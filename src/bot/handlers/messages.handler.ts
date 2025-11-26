import TelegramBot from 'node-telegram-bot-api';
import { ensureAdmin } from '../middlewares/auth.middleware.js';
import { logMessage } from '../middlewares/logging.middleware.js';

export interface MessageHandlerContext {
  adminIds: number[];
}

export function registerMessageHandlers(bot: TelegramBot, ctx: MessageHandlerContext): void {
  bot.on('message', (msg) => {
    if (msg.text?.startsWith('/')) {
      return; // handled by command handlers
    }

    try {
      ensureAdmin(ctx.adminIds, msg);
      logMessage(msg);
      bot.sendMessage(msg.chat.id, '📝 Command received. Use /help to see supported actions.');
    } catch (error) {
      if (error instanceof Error && error.name === 'UnauthorizedError') {
        bot.sendMessage(msg.chat.id, '⛔️ Unauthorized');
        return;
      }
      bot.sendMessage(msg.chat.id, '❌ Unable to process message.');
    }
  });
}

