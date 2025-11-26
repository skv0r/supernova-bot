import TelegramBot from 'node-telegram-bot-api';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('BotLogger');

export function logMessage(msg: TelegramBot.Message): void {
  const user = msg.from ? `${msg.from.first_name}(${msg.from.id})` : 'unknown';
  logger.info(`Message from ${user}: ${msg.text ?? msg.caption ?? ''}`);
}

