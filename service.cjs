const Service = require('node-windows').Service;
const path = require('path');

// Path zur watcher.js (ggf. anpassen)
const scriptPath = path.join(__dirname, 'src', 'watcher.js');

const svc = new Service({
    name: 'iRacingSetupWatcher',
    description: 'Monitors iRacing setup directories and posts new setups to Discord.',
    script: scriptPath,
    nodeOptions: [
        '--harmony',
        '--max_old_space_size=4096'
    ],
    env: [
        { name: "NODE_ENV", value: "production" }
        // Hier ggf. weitere Umgebungsvariablen ergänzen!
    ]
});

svc.on('install', () => {
    console.log('Service installed');
    svc.start();
});

svc.on('alreadyinstalled', () => {
    console.log('Service is already installed.');
});

svc.on('start', () => {
    console.log('Service started!');
});

svc.on('error', (err) => {
    console.log('Service error:', err);
});

// Service installieren
svc.install();