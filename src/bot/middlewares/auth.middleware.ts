import TelegramBot from 'node-telegram-bot-api';
import { UnauthorizedError } from '../../utils/errors.js';

export function ensureAdmin(adminIds: number[], msg: TelegramBot.Message): void {
  if (adminIds.length === 0) {
    return;
  }

  const userId = msg.from?.id;
  if (!userId || !adminIds.includes(userId)) {
    throw new UnauthorizedError();
  }
}

