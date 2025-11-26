import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import TelegramBot from 'node-telegram-bot-api';
import { JsonDatabase } from '../src/database/db.js';
import { SchedulerService } from '../src/modules/scheduler/scheduler.js';
import { createTempDir, removeTempDir } from './helpers.js';

function createMockBot(): TelegramBot {
  return {
    sendMessage: async () => ({ message_id: 1 } as TelegramBot.Message),
    sendPhoto: async () => ({ message_id: 2 } as TelegramBot.Message),
    sendMediaGroup: async () => [],
  } as unknown as TelegramBot;
}

test('Scheduler schedules and cancels posts', async () => {
  const dir = await createTempDir();
  const db = new JsonDatabase(dir);
  await db.init();

  const scheduler = new SchedulerService(createMockBot(), db, 1_000);
  await scheduler.init();

  const id = await scheduler.schedulePost('123', 'Hello', new Date(Date.now() + 10_000));
  assert.ok(id);
  assert.equal(scheduler.getPendingPosts().length, 1);

  const cancelled = await scheduler.cancelPost(id);
  assert.equal(cancelled, true);

  await scheduler.shutdown();
  await removeTempDir(dir);
});

