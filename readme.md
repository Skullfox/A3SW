# A3SW

A Discord bot that monitors multiple Arma 3 game servers and posts real-time status updates to Discord channels.


## Features

- 🎮 Monitor multiple Arma 3 servers simultaneously
- 📊 Real-time server stats (players, map, mission, version)
- 🔄 Automatic status updates with configurable intervals
- 💾 Persistent message tracking (updates same message on restart)
- 🎨 Rich Discord embeds with server information
- 🐳 Docker support for easy deployment
- ⚙️ Flexible configuration via environment variables

## Requirements

- Node.js 25 or higher
- Discord Bot Token
- Arma 3 server(s) to monitor

## Discord Bot Permissions

The bot requires the following permissions (84992):
- View Channels
- Send Messages
- Embed Links
- Read Message History

[Permission Calculator](https://discordapi.com/permissions.html#84992)

## Installation

### Local Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Skullfox/A3SW.git
   cd A3SW
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Copy `.env.example` to `.env` and configure:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   UPDATE_INTERVAL_MINUTES=5
   SERVERS=[{"host":"server.ip","port":2302,"channelId":"discord_channel_id","name":"Server Name"}]
   ```

4. **Run the bot:**
   ```bash
   node index.js
   ```

### Docker Setup

1. **Configure `.env` file** as shown above

2. **Run with Docker Compose:**
   ```bash
   docker compose up -d
   ```

## Configuration

### Environment Variables

- `DISCORD_TOKEN` - Your Discord bot token
- `UPDATE_INTERVAL_MINUTES` - How often to update server stats (default: 5)
- `SERVERS` - JSON array of server configurations

### Server Configuration

Each server in the `SERVERS` array requires:

```json
{
  "host": "127.0.0.1",           // Server IP address
  "port": 2302,                   // Server query port
  "channelId": "123456789",       // Discord channel ID for updates
  "name": "My Server"             // Display name
}
```

**Example with multiple servers:**

```json
[
  {"host":"127.0.0.1","port":2302,"channelId":"123456789","name":"Server 1"},
  {"host":"127.0.0.1","port":2402,"channelId":"112233445","name":"Server 2"}
]
```

## How It Works

1. Bot queries configured Arma 3 servers using gamedig
2. Formats server info into Discord embeds
3. Posts or updates embed messages in specified channels
4. Saves message IDs to `post_id.json` for persistence
5. On restart, edits existing messages instead of posting new ones

## Troubleshooting

### Bot can't edit messages after restart
- Ensure bot has "Read Message History" permission
- Check that message IDs in `post_id.json` are valid
- Verify bot has access to the configured channels

### Server shows as offline
- Verify server IP and port are correct
- Ensure server has query port open (usually game port + 1)
- Check server is running and queryable

### Messages post as new instead of updating
- Delete `post_id.json` and restart bot to reset tracking
- Ensure channel IDs match between config and saved messages

## Contributing

Contributions are welcome! Please open issues or submit pull requests.

## License

This project is licensed under the MIT License.
