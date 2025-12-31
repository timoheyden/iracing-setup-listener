import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

/** Supabase-Client initialisieren */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Hole alle aktiven basePaths für den Client
export async function fetchBasePaths() {
    const { data, error } = await supabase
        .schema('iracing_watcher')
        .from('basepaths')
        .select('path,client_id,enabled')
    if (error) throw error;
    return (data || []);
}

// Hole alle aktiven Provider-Namen
export async function fetchProviders() {
    const { data, error } = await supabase
        .schema('iracing_watcher')
        .from('providers')
        .select('provider_path,display_name')
        .eq('enabled', true);
    if (error) throw error;
    return (data || []);
}

// Zuordnung Fahrzeugordner <-> Discord channel/webhook
export async function fetchCarChannels() {
    const { data, error } = await supabase
        .schema('iracing_watcher')
        .from('iracing_channels')
        .select('car_folder, discord_channel_id');
    if (error) throw error;
   return (data || []);
}

// Versuche hash einzutragen - nur erster gewinnt!
export async function insertPostedFile(hash, filepath, client_id) {
    try {
        const { error } = await supabase
            .schema('iracing_watcher')
            .from('posted_files')
            .insert([{ hash, filepath, client_id }], { upsert: false });

        if (!error) return { inserted: true };
        if (error.code === '23505' || (error.message && error.message.includes('duplicate'))) {
            return { inserted: false };
        }
        throw error;
    } catch (e) {
        console.error(`Insert-Fehler für Datei: ${filepath}\nName: ${e.name}\nMessage: ${e.message}\nStack:\n${e.stack}`);
        throw e;
    }
}