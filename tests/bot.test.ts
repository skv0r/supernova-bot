import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { TelegramChannelManagerBot } from '../src/bot/bot.js';
import { createTempDir, removeTempDir, createMockTelegramBot } from './helpers.js';

test('Bot exposes status snapshot', async () => {
  const dir = await createTempDir();
  const bot = new TelegramChannelManagerBot(
    {
      token: 'test-token',
      dataDir: dir,
      checkInterval: 1_000,
      adminIds: [],
    },
    createMockTelegramBot(),
  );

  const status = bot.getStatus();
  assert.equal(status.scheduledPosts, 0);
  assert.equal(status.contentPlans, 0);

  await removeTempDir(dir);
});

