import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {fileURLToPath} from 'url';
import {supabase, fetchBasePaths, fetchProviders, fetchCarChannels, insertPostedFile} from './supabase.js';
import {sendFileToDiscord} from './discord.js';

/** Hilfsfunktionen */
function log(message) {
    const timestamp = new Date().toISOString();
    const dir = path.resolve(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
    fs.appendFileSync(path.join(dir, 'app.log'), `[${timestamp}] ${message}\n`);
    console.log(`[${timestamp}] ${message}`);
}

function getCarName(filePath, basePaths) {
    for (const bp of basePaths) {
        const rel = path.relative(bp.path, filePath);

        // Datei liegt nicht unter diesem basePath
        if (rel.startsWith("..") || path.isAbsolute(rel)) continue;

        const carName = rel.split(path.sep)[0];
        return carName || null;
    }
}

function getClientIdForFile(filePath, basePaths) {
    for (const bp of basePaths) {
        const rel = path.relative(bp.path, filePath);

        // Datei liegt nicht unter diesem basePath
        if (rel.startsWith("..") || path.isAbsolute(rel)) continue;

        return bp.client_id;
    }
    return null;
}

function hashFileWithRetry(filePath, retries = 5, delayMs = 1000) {
    let attempt = 0;
    return new Promise((resolve, reject) => {
        function tryHash() {
            attempt++;
            try {
                const fileBuffer = fs.readFileSync(filePath);
                const hashSum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
                resolve(hashSum);
            } catch (e) {
                const isBusy = (e.code === 'EBUSY' || e.code === 'EPERM' || /busy|locked/i.test(e.message));
                if (isBusy && attempt < retries)
                    setTimeout(tryHash, delayMs);
                else
                    reject(e);
            }
        }

        tryHash();
    });
}

// Dynamischer Projektpfad für Logs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logPath = path.join(__dirname, '..', 'logs');

// START
async function main() {
    log('Starte Watcher-Service (mit DB-Konfiguration)...');
    const allBasePaths = await fetchBasePaths();
    const localBasePaths = allBasePaths
        .filter(bp => bp.enabled && fs.existsSync(bp.path))
        .map(bp => ({
            path: bp.path,
            client_id: bp.client_id
        }));

    const providers = await fetchProviders();
    
    const carChannelsArray = await fetchCarChannels();
    const carChannels = {};
    carChannelsArray.forEach(c => {
        carChannels[c.car_folder] = {
            discord_channel_id: c.discord_channel_id
        };
    });

    if (!localBasePaths.length) throw new Error('Keine lokalen basePaths gefunden!');
    if (!providers.length) throw new Error('Keine Provider in DB hinterlegt!');
    log('Lokale basePaths (überwacht wird NUR, was lokal existiert):\n' +
        localBasePaths.map(bp => bp.path).join('\n'));
    log('mit Providern:\n' +
        providers.map(p => p.provider_path).join(', '));

    // 2. Alle basePaths/Provider-Kombis als Globs
    const watchGlobs = [];
    for (const bp of localBasePaths) {
        for (const prov of providers) {
            const glob = path.join(bp.path, '*/', prov.provider_path, '**/*').replace(/\\/g, '/');
            watchGlobs.push(glob);
        }
    }

    log(`Setze Watcher auf folgende Globs:\n` + watchGlobs.join('\n'));

    // 3. Watcher starten
    const watcher = chokidar.watch(watchGlobs, {persistent: true, ignoreInitial: true});

    watcher.on('ready', () => {
        log('Watcher bereit! Überwache auf neue Dateien...');
    });

    watcher.on('add', async (filepath) => {
        log(`Neu entdeckt: ${filepath}`);
        try {
            const hash = await hashFileWithRetry(filepath);
            log(`Hash berechnet: ${hash}`);
            // Versuche Hash in DB zu registrieren (atomic)
            const clientId = getClientIdForFile(filepath, localBasePaths);
            if (!clientId) {
                log(`Keine client_id zu basePath gefunden für Datei: ${filepath}`);
                return;
            }
            
            const {inserted} = await insertPostedFile(hash, filepath, clientId);
            if (!inserted) {
                log(`Bereits bekannt (Duplikat, anderer Client?). Datei: ${filepath}, Hash: ${hash}`);
                return;
            }
            
            // Channel/Thread suchen
            const carName = getCarName(filepath, localBasePaths);
            if (!carName || !carChannels[carName]) {
                log(`Kein Discord Channel zu Car-Folder "${carName}" hinterlegt. Datei: ${filepath}`);
                return;
            }
            const channelId = carChannels[carName].discord_channel_id;
            if (!channelId) {
                log(`Kein Discord Channel für Car "${carName}" hinterlegt.`);
                return;
            }
            // Nachricht bauen
            const postMsg = `:inbox_tray: **New setup detected for \`${carName}\`**:\n\`${path.basename(filepath)}\``;

            try {
                await sendFileToDiscord(channelId, filepath, postMsg);
                log(`An Discord gepostet (Channel für "${carName}"): ${channelId}`);
            } catch (err) {
                log(`Fehler beim Posten an Discord: ${err.message || err.toString()}`);
            }
        } catch (e) {
            log(`Fehler bei Datei: ${filepath}\n` +
                `Name: ${e.name}\n` +
                `Message: ${e.message}\n` +
                `Stack:\n${e.stack}`);
        }
    });
}

main().catch(err => {
    log(`Fatal: ${err.message || err.toString()}`);
    process.exit(1);
});