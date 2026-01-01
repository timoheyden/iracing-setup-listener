import rfs from 'rotating-file-stream';
import path from 'path';
import fs from 'fs';

const logDirectory = path.join(process.env.PROGRAMDATA || 'C:\\ProgramData', 'iRacingSetupListener', 'logs');
if (!fs.existsSync(logDirectory)) fs.mkdirSync(logDirectory, {recursive: true});

// Maximal 10MB pro Logfile, maximal 5 Files (ältere werden gelöscht)
const logStream = rfs.createStream('app.log', {
    size: '10M',             // rotate every 10 MegaBytes written
    interval: '1d',          // rotate daily
    maxFiles: 5,             // keep 5 rotated files (ältere werden gelöscht)
    path: logDirectory,
    compress: 'gzip'         // optional: Logfiles werden komprimiert
});

export function log(message) {
    const timestamp = new Date().toISOString();
    const out = `[${timestamp}] ${message}\n`;
    logStream.write(out);
    console.log(out.trim());
}