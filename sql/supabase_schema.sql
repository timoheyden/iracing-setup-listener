-- Neues Schema für das Projekt
create schema if not exists iracing_watcher;

-- Basispfade je Client (Erkennung: Service prüft lokal, welche existieren!)
create table if not exists iracing_watcher.basepaths (
                                                         id serial primary key,
                                                         client_id text not null, -- Dient nur zu Doku
                                                         path text not null,
                                                         enabled boolean not null default true
);

-- Provider-Namen (z. B. HYMO, VRS, ...), DB-priorisiert pflegbar
create table if not exists iracing_watcher.providers (
                                                         id serial primary key,
                                                         name text not null,
                                                         enabled boolean not null default true
);

-- Channel/Webhook-Mapping für Fahrzeug-Ordner
create table if not exists iracing_watcher.iracing_channels (
                                                                id serial primary key,
                                                                car_folder text not null,
                                                                discord_channel_id text,
                                                                discord_webhook_url text
);

-- Bereits gepostete Dateien zur Duplikatsvermeidung
create table if not exists iracing_watcher.posted_files (
                                                            id serial primary key,
                                                            hash text not null unique,
                                                            filepath text not null,
                                                            client_id text not null,
                                                            posted_at timestamp with time zone default timezone('utc', now())
    );

-- Optional: Indexe/Performance
create index if not exists idx_iracing_basepaths_enabled_path on iracing_watcher.basepaths (enabled, path);
create index if not exists idx_iracing_posted_files_hash on iracing_watcher.posted_files (hash);