import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import TelegramBot from 'node-telegram-bot-api';
import { JsonDatabase } from '../src/database/db.js';
import { SchedulerService } from '../src/modules/scheduler/scheduler.js';
import { ContentPlanService } from '../src/modules/content-plan/content-plan.service.js';
import { createTempDir, removeTempDir } from './helpers.js';

function mockBot(): TelegramBot {
  return {
    sendMessage: async () => ({ message_id: 1 } as TelegramBot.Message),
    sendPhoto: async () => ({ message_id: 2 } as TelegramBot.Message),
    sendMediaGroup: async () => [],
  } as unknown as TelegramBot;
}

test('Content plan service creates plans', async () => {
  const dir = await createTempDir();
  const db = new JsonDatabase(dir);
  await db.init();

  const scheduler = new SchedulerService(mockBot(), db, 1_000);
  await scheduler.init();

  const service = new ContentPlanService(db, scheduler);
  await service.init();

  const planId = await service.createPlan('Launch Plan', [
    {
      channelId: '123',
      content: 'Hello world',
      scheduledTime: new Date(Date.now() + 5_000),
    },
  ]);

  assert.ok(planId);
  assert.equal(service.listPlans().length, 1);

  await scheduler.shutdown();
  await removeTempDir(dir);
});

