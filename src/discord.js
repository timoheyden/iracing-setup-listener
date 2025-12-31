// src/discord.js
import { Client, GatewayIntentBits } from "discord.js";
import { config } from "dotenv";
config();

const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
    throw new Error("[discord.js] Bot-Token fehlt in .env (DISCORD_BOT_TOKEN)");
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

let loginPromise = client.login(TOKEN).then(() => {
    console.log(`[discord.js] Bot eingeloggt als ${client.user.tag}`);
});

/**
 * Sendet eine Datei (und Nachricht) in einen Discord-Channel (oder Thread) via Bot.
 *
 * @param {string} channelId - Discord Channel- (oder Thread-)ID
 * @param {string} filePath - Absoluter Pfad zur Datei
 * @param {string} [text] - Optionaler Nachrichtentext
 * @returns {Promise<boolean>}
 */
export async function sendFileToDiscord(channelId, filePath, text = "") {
    await loginPromise;
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel.isTextBased()) {
            console.warn(`[discord.js] Channel ${channelId} ist nicht textbasiert, kein Upload.`);
            return false;
        }
        await channel.send({
            content: text || undefined,
            files: [filePath],
        });
        console.log(`[discord.js] Datei erfolgreich an Channel ${channelId} gesendet.`);
        return true;
    } catch (e) {
        console.error(`[discord.js] Fehler beim Upload in Channel ${channelId}:`, e.message || e);
        return false;
    }
}