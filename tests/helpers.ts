import os from 'os';
import path from 'path';
import { mkdtemp, rm } from 'fs/promises';
import TelegramBot from 'node-telegram-bot-api';

export async function createTempDir(prefix = 'tcm-'): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function removeTempDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

export function createMockTelegramBot(): TelegramBot {
  const noop = () => undefined;

  const bot = {
    on: noop,
    onText: noop,
    once: noop,
    sendMessage: async () => ({ message_id: 1 } as TelegramBot.Message),
    sendPhoto: async () => ({ message_id: 1 } as TelegramBot.Message),
    sendMediaGroup: async () => [],
    stopPolling: async () => undefined,
    answerCallbackQuery: async () => undefined,
  };

  return bot as unknown as TelegramBot;
}

