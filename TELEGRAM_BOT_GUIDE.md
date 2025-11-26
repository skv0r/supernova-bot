# 🤖 Telegram AdminBot - Quick Start Guide

## Overview

The AdminBot automatically posts scheduled content to your Telegram channel. It supports:
- ⏰ Scheduled posting at specific times
- 📋 Content plans with multiple posts
- 🖼️ Text and media posts
- 💾 Persistent storage (survives restarts)
- 🎮 Interactive Telegram commands

## Setup Instructions

### 1. Create Your Telegram Bot

1. Open Telegram and find [@BotFather](https://t.me/BotFather)
2. Send `/newbot` command
3. Follow instructions to choose a name and username
4. Copy the bot token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Setup Your Channel

1. Create a Telegram channel (or use existing one)
2. Add your bot as an administrator with these permissions:
   - ✅ Post messages
   - ✅ Edit messages
   - ✅ Delete messages (optional)

3. Get your channel ID:
   - If public: use `@your_channel_username`
   - If private: 
     - Post a message to your channel
     - Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
     - Find the `chat` object and copy the `id` (e.g., `-1001234567890`)

### 3. Configure the Bot

Set your bot token as an environment variable:

```bash
export BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
```

Or add it to your shell profile (`~/.zshrc` or `~/.bashrc`):

```bash
echo 'export BOT_TOKEN="your_token_here"' >> ~/.zshrc
source ~/.zshrc
```

### 4. Start the Bot

```bash
npm start
```

You should see:

```
🤖 Initializing AdminBot...
✅ AdminBot is running!
📊 Bot Status:
   - Auto-posting: Active
   - Check interval: 60 seconds
   - Data directory: ./data/bot
```

## Using the Bot

### Telegram Commands

Open a chat with your bot in Telegram and use these commands:

- `/start` - Initialize and see all commands
- `/status` - Check bot status and statistics
- `/list` - List all scheduled posts
- `/plans` - View content plans
- `/help` - Show help message

### Programmatic Usage

You can also schedule posts programmatically by modifying `index.ts`:

```typescript
import { AdminBot } from "./services/telegram-bot/bot.js";

const adminBot = new AdminBot({
  token: process.env.BOT_TOKEN!,
  dataDir: "./data/bot",
  checkInterval: 60000,
});

// Schedule a post
await adminBot.schedulePost(
  '@your_channel',
  '🚀 *Hello World!*\n\nThis is an automated post.',
  new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
);

// Schedule a post with image
await adminBot.schedulePost(
  '@your_channel',
  '📸 *Check this out!*',
  new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  ['https://example.com/image.jpg']
);

// Create a content plan
await adminBot.createContentPlan('Weekly Posts', [
  {
    channelId: '@your_channel',
    content: '📅 *Monday Motivation*',
    scheduledTime: new Date('2025-12-02T09:00:00'),
  },
  {
    channelId: '@your_channel',
    content: '🎉 *Friday Fun*',
    scheduledTime: new Date('2025-12-06T17:00:00'),
  },
]);

// Start the bot
adminBot.start();
```

## How It Works

1. **Scheduling**: When you schedule a post, it's saved to `./data/bot/bot-data.json`
2. **Checking**: Every 60 seconds, the bot checks if any posts should be published
3. **Posting**: If the scheduled time has arrived, the bot posts to your channel
4. **Persistence**: All data is saved and reloaded on restart

## Data Storage

All scheduled posts and content plans are stored in:
```
./data/bot/bot-data.json
```

This file is automatically created and updated. The bot loads this data on startup, so your scheduled posts survive restarts.

## Message Formatting

Use Telegram's Markdown formatting:

```
*bold text*
_italic text_
`inline code`
[link text](https://example.com)

Multi-line
messages
work too!
```

## Example: Weekly Content Schedule

```typescript
// Helper function to get next occurrence of a weekday
function getNextWeekday(weekday: number, hour: number, minute: number): Date {
  const now = new Date();
  const result = new Date(now);
  result.setHours(hour, minute, 0, 0);
  
  const daysUntilTarget = (weekday + 7 - now.getDay()) % 7;
  if (daysUntilTarget === 0 && now.getHours() * 60 + now.getMinutes() >= hour * 60 + minute) {
    result.setDate(result.getDate() + 7);
  } else {
    result.setDate(result.getDate() + daysUntilTarget);
  }
  
  return result;
}

// Schedule weekly posts
await adminBot.createContentPlan('Weekly Newsletter', [
  {
    channelId: '@your_channel',
    content: '📅 *Monday*\nStart your week strong!',
    scheduledTime: getNextWeekday(1, 9, 0), // Monday 9:00 AM
  },
  {
    channelId: '@your_channel',
    content: '💡 *Wednesday*\nMid-week wisdom',
    scheduledTime: getNextWeekday(3, 12, 0), // Wednesday 12:00 PM
  },
  {
    channelId: '@your_channel',
    content: '🎉 *Friday*\nWeekend vibes!',
    scheduledTime: getNextWeekday(5, 17, 0), // Friday 5:00 PM
  },
]);
```

## Troubleshooting

### Bot not posting

1. ✅ Check bot is running: `npm start`
2. ✅ Verify bot is admin in your channel
3. ✅ Ensure scheduled time is in the future
4. ✅ Check logs for errors

### "BOT_TOKEN not set" error

```bash
export BOT_TOKEN="your_token_here"
```

### Permission errors in channel

Make sure your bot is:
- Added to the channel
- Has admin rights
- Has permission to post messages

### Posts not persisting after restart

Check that `./data/bot/` directory is writable and `bot-data.json` is being created.

## Stopping the Bot

Press `Ctrl+C` to gracefully stop the bot. It will:
1. Save all data
2. Stop polling
3. Exit cleanly

## Advanced Configuration

Edit `index.ts` to customize:

```typescript
const adminBot = new AdminBot({
  token: process.env.BOT_TOKEN!,
  dataDir: "./data/bot",        // Where to store data
  checkInterval: 60000,          // How often to check (ms)
});
```

## Need Help?

- 📖 See full API documentation: `services/telegram-bot/README.md`
- 💡 Check example code: `services/telegram-bot/example.ts`
- 🐛 Report issues: GitHub Issues

---

**Happy Automating! 🚀**

