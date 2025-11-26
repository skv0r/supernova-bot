# Telegram Channel Manager Bot

A modular TypeScript Telegram bot for managing automated channel posts, content planning, and channel tracking with scheduling capabilities.

## Overview

The `TelegramChannelManagerBot` is a comprehensive bot solution that provides:
- 🤖 **Automated Posting**: Schedule and automatically post messages to Telegram channels
- 📅 **Content Planning**: Organize multiple posts into content plans
- 📢 **Channel Tracking**: Automatically track and manage channels where the bot is added
- 🔐 **Admin Authentication**: Secure command access with admin-only features
- 📊 **Status Monitoring**: Track scheduled posts, content plans, and channel statistics
- 💾 **Persistent Storage**: All data is saved to JSON database and survives restarts

## Architecture

The bot follows a modular architecture with clear separation of concerns:

```
src/bot/
├── bot.ts                    # Main bot class (TelegramChannelManagerBot)
├── routes.ts                 # Route registration and event handlers
├── handlers/
│   ├── commands.handler.ts   # Command handlers (/start, /help, /status, etc.)
│   ├── messages.handler.ts   # General message handlers
│   └── callbacks.handler.ts  # Callback query handlers
└── middlewares/
    ├── auth.middleware.ts    # Admin authentication middleware
    └── logging.middleware.ts # Message logging middleware
```

### Core Components

- **TelegramChannelManagerBot**: Main bot class that orchestrates all services
- **Handlers**: Process incoming commands, messages, and callbacks
- **Middlewares**: Provide authentication and logging functionality
- **Services**: Business logic for channels, content plans, and scheduling
- **Database**: JSON-based persistent storage

## Installation

The bot is part of the main project. Install dependencies:

```bash
npm install
```

Required dependencies:
- `node-telegram-bot-api`: Telegram Bot API client
- `dotenv`: Environment variable management

## Configuration

The bot requires the following environment variables (configured in `src/config/env.ts`):

```typescript
BOT_TOKEN=your_telegram_bot_token
DATA_DIR=./data/bot
CHECK_INTERVAL_MS=60000  // How often to check for scheduled posts (ms)
ADMIN_IDS=123456789,987654321  // Comma-separated admin user IDs
```

### Getting Your Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the instructions
3. Copy the bot token you receive

### Getting Admin User IDs

1. Start a conversation with your bot
2. Send any message
3. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `from.id` field in the message object

## Usage

### Basic Initialization

```typescript
import { TelegramChannelManagerBot } from './bot/bot.js';

const bot = new TelegramChannelManagerBot({
  token: 'YOUR_BOT_TOKEN',
  dataDir: './data/bot',
  checkInterval: 60000, // Check every 60 seconds
  adminIds: [123456789], // Admin user IDs
});

await bot.init();
console.log('Bot is running');
```

### Graceful Shutdown

```typescript
process.on('SIGINT', async () => {
  await bot.shutdown();
  process.exit(0);
});
```

## Commands

### Admin Commands

These commands are restricted to users in the `adminIds` list:

- `/start` - Initialize the bot and show welcome message
- `/help` - Display available commands
- `/status` - Show bot status (scheduled posts, plans, channels)
- `/list` - List all scheduled posts
- `/plans` - View all content plans
- `/channels` - List all tracked channels

### User Commands

These commands are available to all users:

- `/stats` - Display statistics (placeholder)
- `/schedule` - Show match schedule (placeholder)
- `/playerStats <playerName>` - Get player statistics
  - Example: `/playerStats 9Impulse`

## API Reference

### TelegramChannelManagerBot

#### Constructor

```typescript
new TelegramChannelManagerBot(config: BotOptions, botInstance?: TelegramBot)
```

**BotOptions:**
```typescript
interface BotOptions {
  token: string;              // Telegram bot token (required)
  dataDir?: string;           // Directory for storing data (default: './data/bot')
  checkInterval?: number;     // Check interval in milliseconds (default: 60000)
  adminIds: number[];         // Array of admin user IDs (required)
}
```

#### Methods

##### `init(): Promise<void>`

Initialize the bot. Must be called before the bot can be used.

```typescript
await bot.init();
```

This method:
- Initializes the database
- Loads existing data
- Registers all routes and handlers
- Starts the channel scheduler

##### `shutdown(): Promise<void>`

Gracefully shutdown the bot.

```typescript
await bot.shutdown();
```

This method:
- Stops the channel scheduler
- Shuts down the scheduler service
- Stops Telegram polling
- Saves all data to disk

##### `getBot(): TelegramBot`

Get the underlying TelegramBot instance for advanced usage.

```typescript
const telegramBot = bot.getBot();
```

##### `getStatus(): BotStatusSnapshot`

Get current bot status snapshot.

```typescript
const status = bot.getStatus();
// Returns:
// {
//   isRunning: boolean;
//   scheduledPosts: number;
//   contentPlans: number;
//   activeChannels: number;
//   checkInterval: number;
// }
```

## Handlers

### Command Handlers (`commands.handler.ts`)

Handles all bot commands:
- `/start`, `/help`, `/status`
- `/list`, `/plans`, `/channels` (admin only)
- `/stats`, `/schedule`, `/playerStats` (public)

### Message Handlers (`messages.handler.ts`)

Handles general messages (non-command text):
- Processes admin messages
- Logs all messages
- Provides feedback for unrecognized commands

### Callback Handlers (`callbacks.handler.ts`)

Handles callback queries from inline keyboards:
- Processes callback queries
- Logs callback interactions

## Middlewares

### Authentication Middleware (`auth.middleware.ts`)

```typescript
ensureAdmin(adminIds: number[], msg: TelegramBot.Message): void
```

Validates that the message sender is in the admin list. Throws `UnauthorizedError` if not authorized.

### Logging Middleware (`logging.middleware.ts`)

```typescript
logMessage(msg: TelegramBot.Message): void
```

Logs incoming messages with user information and message content.

## Routes

The `routes.ts` file registers all event handlers:

1. **Command Handlers**: Registered via `registerCommandHandlers()`
2. **Message Handlers**: Registered via `registerMessageHandlers()`
3. **Callback Handlers**: Registered via `registerCallbackHandlers()`
4. **Chat Member Updates**: Tracks when bot is added/removed from channels
5. **Channel Posts**: Refreshes channel information when posts are made

### Chat Member Tracking

The bot automatically tracks channels:
- When added as administrator or member → channel is tracked
- When removed or kicked → channel is deactivated
- Channel information is refreshed on channel posts

## Data Persistence

All bot data is stored in JSON files:
- Location: `{dataDir}/bot-data.json`
- Includes: Scheduled posts, content plans, channel information
- Auto-loaded on initialization
- Auto-saved on shutdown and periodically

## Error Handling

- **Unauthorized Access**: Returns friendly error message to user
- **Command Errors**: Catches and logs errors, sends error message to user
- **Service Errors**: Logged with context, graceful degradation

## Development

### Project Structure

```
src/bot/
├── bot.ts                    # Main bot class
├── routes.ts                 # Route registration
├── handlers/                 # Command/message/callback handlers
│   ├── commands.handler.ts
│   ├── messages.handler.ts
│   └── callbacks.handler.ts
└── middlewares/              # Middleware functions
    ├── auth.middleware.ts
    └── logging.middleware.ts
```

### Adding New Commands

1. Add command handler in `handlers/commands.handler.ts`:

```typescript
bot.onText(/\/mycommand/, (msg) => {
  try {
    ensureAdmin(ctx.adminIds, msg);
    logMessage(msg);
    bot.sendMessage(msg.chat.id, 'Response message');
  } catch (error) {
    handleAuthError(bot, msg.chat.id, error);
  }
});
```

2. Update `/help` command to include the new command

### Adding New Middleware

Create a new middleware function:

```typescript
export function myMiddleware(msg: TelegramBot.Message): void {
  // Middleware logic
}
```

Use it in handlers:

```typescript
myMiddleware(msg);
```

## Testing

Run tests:

```bash
npm test
```

## Troubleshooting

### Bot not responding

1. Check that `bot.init()` was called
2. Verify bot token is correct
3. Check logs for errors
4. Ensure bot is added to channels as administrator

### Commands not working

1. Verify user ID is in `adminIds` array (for admin commands)
2. Check command format matches regex pattern
3. Review logs for authentication errors

### Data not persisting

1. Ensure `dataDir` path is writable
2. Check file permissions
3. Verify `bot.shutdown()` is called on exit

### Channel tracking issues

1. Ensure bot has appropriate permissions in channel
2. Check that bot is added as administrator
3. Review `my_chat_member` event logs

## Related Documentation

- [Main README](../../README.md) - Project overview
- [Telegram Bot Guide](../../TELEGRAM_BOT_GUIDE.md) - Setup guide
- [Channel Service](../../modules/channels/README.md) - Channel management
- [Content Plan Service](../../modules/content-plan/README.md) - Content planning
- [Scheduler Service](../../modules/scheduler/README.md) - Post scheduling

## License

MIT
