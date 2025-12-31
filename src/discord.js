import { Client, GatewayIntentBits } from 'discord.js';
import { config } from 'dotenv';
config();

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!BOT_TOKEN) throw new Error('DISCORD_BOT_TOKEN fehlt in .env');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

let botReadyPromise = new Promise((resolve) => {
    client.once("ready", () => {
        console.log(`[discord] Bot ist eingeloggt als ${client.user.tag}`);
        resolve();
    });
});
client.login(BOT_TOKEN);

/**
 * Datei in einen Discord-Channel schicken.
 * @param {string} channelId - Die Discord-Channel-ID
 * @param {string} filePath - Pfad zur Datei
 * @param {string} [message] - Optionaler Nachrichtentext
 */
export async function sendFileToDiscord(channelId, filePath, message = '') {
    await botReadyPromise;
    const channel = await client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) throw new Error("Channel nicht gefunden oder nicht textbasiert!");

    await channel.send({
        content: message,
        files: [filePath]
    });
}