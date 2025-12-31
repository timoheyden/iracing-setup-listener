import 'dotenv/config'

export const SUPABASE_URL = process.env.SUPABASE_URL;
export const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Bitte SUPABASE_URL und SUPABASE_KEY in .env eintragen!");
}