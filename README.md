# iRacing-Setup-Watcher

Ein Node.js-Service zum Überwachen von iRacing-Setup-Ordnern auf mehreren Clients.  
Neue (noch nicht bekannte) Dateien werden erkannt, in einer Supabase-DB dedupliziert und in einem spezifischen Discord-Channel gemeldet.

## Features

- Zentrale Konfiguration der zu überwachenden Pfade und "Provider"-Ordner über Supabase
- Automatische Zuordnung von Fahrzeugordnern zu Discord-Channeln (aus DB)
- Duplikate werden DB-basiert client-übergreifend vermieden – nur der erste Client postet!
- Kein Hardcoding, Anpassung von Fahrzeugen/Providern/Channels jederzeit in der DB möglich

## Project Structure

| Ordner/Datei               | Inhalt                                                         |
|----------------------------|---------------------------------------------------------------|
| `src/watcher.js`           | Hauptprogramm, startet watcher, orchestriert alles            |
| `src/supabase.js`          | Supabase-Client und DB-Logik                                  |
| `src/config.js`            | Lädt Konfiguration aus `.env` und DB                          |
| `src/discord.js`           | Sendet Nachrichten an Discord via Webhook                     |
| `logs/`                    | Speichert lokale Logs und ggf. Hashes (nur für debug)         |
| `sql/supabase_schema.sql`  | DDL für die benötigten Supabase-Tabellen                      |
| `.env.example`             | Beispiel-Konfiguration, deine echten Werte in `.env` eintragen|

## Setup

1. **Supabase-Tabellen anlegen:**  
   Führe das SQL aus `sql/supabase_schema.sql` in deinem Supabase-Projekt aus.

2. **Discord-Webhooks erstellen:**  
   Lege pro Channel einen Webhook an und trage die IDs/URLs in Supabase-Tabelle ein.

3. **Projekt einrichten:**
   ```sh
   cp .env.example .env
   # Dann: .env mit deinen echten Infowerten befüllen
   npm install
   npm start
   ```

## Hinweise

- Jeder Client braucht eine eigene `CLIENT_ID` im .env
- Die Konfiguration erfolgt komplett über Supabase, keine Änderungen am Code nötig bei Fahrzeug/Provider/Channel-Updates
- Siehe Quellcode für Anpassungsoptionen (z. B. Error-Handling, Logging etc.)
