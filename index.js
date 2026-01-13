require('dotenv').config();
const { GameDig } = require('gamedig');
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');

const POST_ID_FILE = './post_id.json';
const SERVERS = JSON.parse(process.env.SERVERS || '[]');
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const UPDATE_INTERVAL_MINUTES = parseInt(process.env.UPDATE_INTERVAL_MINUTES || '5', 10);

// Validate server configuration
function validateServerConfig() {
  if (SERVERS.length === 0) {
    console.warn('Warning: No servers configured in SERVERS environment variable.');
    return;
  }
  
  SERVERS.forEach((server, idx) => {
    if (!server.host) {
      console.error(`Error: Server at index ${idx} missing required field "host"`);
      process.exit(1);
    }
    if (!server.port) {
      console.error(`Error: Server at index ${idx} missing required field "port"`);
      process.exit(1);
    }
    if (!server.name) {
      console.warn(`Warning: Server at index ${idx} (${server.host}:${server.port}) missing "name" field`);
    }
    if (!server.channelId) {
      console.warn(`Warning: Server at index ${idx} (${server.host}:${server.port}) missing "channelId" - will be skipped`);
    }
    console.log(`✓ Server ${idx + 1}: ${server.name || 'Unnamed'} (${server.host}:${server.port})`);
  });
}

validateServerConfig();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,          // Access guild info
        GatewayIntentBits.GuildMessages,   // Access messages in guilds
        GatewayIntentBits.MessageContent   // Access the content of messages
    ]
});

async function queryServers() {
    if (SERVERS.length === 0) return [];

    console.log(`Querying ${SERVERS.length} servers...`);
    
    const promises = SERVERS.map(async (server) => {
        try {
            const state = await GameDig.query({
                type: 'arma3',
                host: server.host,
                port: server.port,
            });
            return {
                online: true,
                stats: state,
                name: server.name,
                host: server.host,
                port: server.port
            };
        } catch (error) {
            return {
                online: false,
                name: server.name,
                host: server.host,
                port: server.port
            };
        }
    });
    
    return await Promise.all(promises);
}

function formatServerEmbeds(stats) {
    return stats.map(s => {
        if (!s.online) {
            return {
                title: s.name || 'Unknown Server',
                description: 'Status: 🔴 Offline',
                color: 0xff0000,
                footer: { text: `IP: ${s.host}:${s.port}` },
                timestamp: new Date().toISOString(),
            };
        }

        const randomColor = Math.floor(Math.random() * 0xffffff);

        return {
            title: s.stats.name,
            color: randomColor,
            thumbnail: { url: 'https://arma3.com/assets/img/logos/arma3.png' },
            fields: [
                { name: '🔱 Mission', value: s.stats.raw.game || 'Unknown', inline: false },
                { name: '🗺️ Map', value: s.stats.map || 'Unknown', inline: true },
                { name: '👥 Players', value: `${s.stats.numplayers}/${s.stats.maxplayers}`, inline: true },
                { name: '⚡ Ping(EU)', value: s.stats.ping ? `${s.stats.ping} ms` : 'Unknown', inline: true },
                { name: '🔐 Password', value: s.stats.password ? 'Yes' : 'No', inline: true },
                { name: '🔰 Game Version', value: s.stats.version || 'Unknown', inline: true },
            ],
            footer: { text: `IP: ${s.stats.connect}` },
            timestamp: new Date().toISOString(),
        };
    });
}

function getServerKey(server) {
    return `${server.host}:${server.port}`;
}

function savePostId(server, id) {
    let data = {};

    try {
        data = JSON.parse(fs.readFileSync(POST_ID_FILE, 'utf8'));
    } catch { }
    
    data[getServerKey(server)] = id;
    fs.writeFileSync(POST_ID_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function loadPostIds() {
    try {
        return JSON.parse(fs.readFileSync(POST_ID_FILE, 'utf8'));
    } catch {
        return {};
    }
}

let postIds = loadPostIds();

async function postOrUpdateStats() {
    const stats = await queryServers();
    const embeds = formatServerEmbeds(stats);

    for (let idx = 0; idx < stats.length; idx++) {
        const s = stats[idx];
        const server = SERVERS[idx];
        const key = `${s.host}:${s.port}`;
        const embed = embeds[idx];
        const lastMessageId = postIds[key];
        const channelId = server.channelId;

        if (!channelId) continue;

        try {
            const channel = await client.channels.fetch(channelId);
            
            if (lastMessageId) {
                try {
                    const msg = await channel.messages.fetch(lastMessageId);
                    console.log(`Editing message ID: ${lastMessageId}`);
                    await msg.edit({ embeds: [embed] });
                } catch (e) {
                    console.error('Error fetching or editing message:', e);
                    const sent = await channel.send({ embeds: [embed] });
                    postIds[key] = sent.id;
                    savePostId({ host: s.host, port: s.port }, sent.id);
                }
            } else {
                const sent = await channel.send({ embeds: [embed] });
                postIds[key] = sent.id;
                savePostId({ host: s.host, port: s.port }, sent.id);
            }
        } catch (error) {
            console.error(`Error processing server ${server.name}:`, error);
        }
    }
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Update interval: ${UPDATE_INTERVAL_MINUTES} minute(s)`);

    postOrUpdateStats();
    setInterval(() => postOrUpdateStats(), UPDATE_INTERVAL_MINUTES * 60 * 1000);
});

client.login(DISCORD_TOKEN);

module.exports = { queryServers };