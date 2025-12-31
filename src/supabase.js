import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

/** Supabase-Client initialisieren */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Hole alle aktiven basePaths für den Client
export async function fetchBasePaths() {
    const { data, error } = await supabase
        .from('iracing_watcher.basepaths')
        .select('path,client_id,enabled')
    if (error) throw error;
    return (data || []).map(d => d.path);
}

// Hole alle aktiven Provider-Namen
export async function fetchProviders() {
    const { data, error } = await supabase
        .from('iracing_watcher.providers')
        .select('name')
        .eq('enabled', true);
    if (error) throw error;
    return (data || []).map(d => d.name);
}

// Zuordnung Fahrzeugordner <-> Discord channel/webhook
export async function fetchCarChannels() {
    const { data, error } = await supabase
        .from('iracing_watcher.iracing_channels')
        .select('car_folder, discord_channel_id, discord_webhook_url');
    if (error) throw error;
    // Ergebnis als Mapping { car_folder: {discord_channel_id, discord_webhook_url}, ... }
    const map = {};
    (data || []).forEach(({car_folder, discord_channel_id, discord_webhook_url}) => {
        map[car_folder] = {discord_channel_id, discord_webhook_url};
    });
    return map;
}

// Versuche hash einzutragen - nur erster gewinnt!
export async function insertPostedFile(hash, filepath, client_id) {
    const { error } = await supabase
        .from('iracing_watcher.posted_files')
        .insert([{ hash, filepath, client_id }], { upsert: false });
    if (!error) return {inserted: true};
    if (error.code === '23505' || (error.message && error.message.includes('duplicate'))) {
        return {inserted: false};
    }
    throw error;
}