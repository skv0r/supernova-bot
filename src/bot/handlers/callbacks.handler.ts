import TelegramBot from 'node-telegram-bot-api';
import { logMessage } from '../middlewares/logging.middleware.js';

export function registerCallbackHandlers(bot: TelegramBot): void {
  bot.on('callback_query', (query) => {
    if (!query.message) return;
    logMessage(query.message);
    void bot.answerCallbackQuery(query.id, {
      text: 'Callback processed ✅',
    });
  });
}

