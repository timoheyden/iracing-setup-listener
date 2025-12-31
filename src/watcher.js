import chokidar from 'chokidar';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { supabase, fetchBasePaths, fetchProviders, fetchCarChannels, insertPostedFile } from './supabase.js';
import { postToDiscordWebhook } from './discord.js';

/** Hilfsfunktionen */
function log(message) {
    const timestamp = new Date().toISOString();
    const dir = path.resolve(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, {recursive: true});
    fs.appendFileSync(path.join(dir, 'app.log'), `[${timestamp}] ${message}\n`);
    console.log(`[${timestamp}] ${message}`);
}
function getCarName(filePath, basePaths) {
    // Annahme: [basePath]/<CarName>/<Provider>/...
    const match = basePaths
        .map(p => filePath.startsWith(p) ? p : null)
        .filter(Boolean)[0];
    if (!match) return null;
    const rel = filePath.substring(match.length).replace(/^\/|\\/, ''); // nimmt nur nach basePath
    return rel.split(/[\\/]/)[0];
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
    const allBasePaths = await fetchBasePaths(); // jetzt: alle Einträge
    const localBasePaths = allBasePaths
        .filter(bp => bp.enabled && fs.existsSync(bp.path))
        .map(bp => bp.path);

    const providers = await fetchProviders();
    const carChannels = await fetchCarChannels();

    if (!localBasePaths.length) throw new Error('Keine lokalen basePaths gefunden!');
    if (!providers.length) throw new Error('Keine Provider in DB hinterlegt!');
    log(`Lokale basePaths (überwacht wird NUR, was lokal existiert):\n${localBasePaths.join('\n')}\nmit Providern:\n${providers.join(', ')}`);

    // 2. Alle basePaths/Provider-Kombis als Globs
    const watchGlobs = [];
    for (const basePath of basePaths) {
        for (const prov of providers) {
            // zB /iracing/setups/*/<Provider>/**
            // Windows: Backslash raus (Chokidar verträgt Forward-Slash bei Globs am besten)
            const glob = path.join(basePath, '*/', prov, '**/*').replace(/\\/g, '/');
            watchGlobs.push(glob);
        }
    }
    log(`Setze Watcher auf folgende Globs:\n` + watchGlobs.join('\n'));

    function getClientId() {
        try { return os.hostname(); } catch { return 'unknown-client'; }
    }
    
    // 3. Watcher starten
    const watcher = chokidar.watch(watchGlobs, { persistent: true, ignoreInitial: true });

    watcher.on('ready', () => {
        log('Watcher bereit! Überwache auf neue Dateien...');
    });

    watcher.on('add', async (filepath) => {
        log(`Neu entdeckt: ${filepath}`);
        try {
            const hash = await hashFileWithRetry(filepath);
            log(`Hash berechnet: ${hash}`);
            // Versuche Hash in DB zu registrieren (atomic)
            const { inserted } = await insertPostedFile(hash, filepath, getClientId());
            if (!inserted) {
                log(`Bereits bekannt (Duplikat, anderer Client?). Datei: ${filepath}, Hash: ${hash}`);
                return;
            }
            // Channel/Thread suchen
            const carName = getCarName(filepath, basePaths);
            if (!carName || !carChannels[carName]) {
                log(`Kein Discord Channel/Webhook zu Car-Folder "${carName}" hinterlegt. Datei: ${filepath}`);
                return;
            }
            const webhookUrl = carChannels[carName].discord_webhook_url;
            if (!webhookUrl) {
                log(`Kein Discord Webhook für Channel zum Car "${carName}" hinterlegt.`);
                return;
            }
            // An Discord posten
            const postMsg = `:inbox_tray: **Neues Setup für \`${carName}\` erkannt:**\n\`${path.basename(filepath)}\``;
            await postToDiscordWebhook(webhookUrl, postMsg);
            log(`An Discord gepostet (Channel für "${carName}"): ${webhookUrl}`);
        } catch (e) {
            log(`Fehler: ${e.message || e.toString()} für Datei: ${filepath}`);
        }
    });
}

main().catch(err => {
    log(`Fatal: ${err.message || err.toString()}`);
    process.exit(1);
});