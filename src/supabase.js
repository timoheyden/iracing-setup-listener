const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_KEY } = require('./config');

/** Supabase-Client initialisieren */
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchBasePaths() {
    const { data, error } = await supabase
        .schema('iracing_watcher')
        .from('basepaths')
        .select('path,client_id,enabled');
    if (error) throw error;
    return (data || []);
}

async function fetchProviders() {
    const { data, error } = await supabase
        .schema('iracing_watcher')
        .from('providers')
        .select('provider_path,display_name')
        .eq('enabled', true);
    if (error) throw error;
    return (data || []);
}

async function fetchCarChannels() {
    const { data, error } = await supabase
        .schema('iracing_watcher')
        .from('iracing_channels')
        .select('car_folder, discord_channel_id');
    if (error) throw error;
    return (data || []);
}

async function insertPostedFile(hash, filepath, client_id) {
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

module.exports = {
    supabase,
    fetchBasePaths,
    fetchProviders,
    fetchCarChannels,
    insertPostedFile
};