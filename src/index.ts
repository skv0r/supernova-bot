import { loadEnv } from './config/env.js';
import { TelegramChannelManagerBot } from './bot/bot.js';

async function bootstrap() {
  console.log('🤖 Initializing Telegram Channel Manager Bot...');
  const env = loadEnv();

  const bot = new TelegramChannelManagerBot({
    token: env.botToken,
    dataDir: env.dataDir,
    checkInterval: env.checkIntervalMs,
    adminIds: env.adminIds,
  });

  await bot.init();
  console.log('✅ Bot is running');

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 Received ${signal}, shutting down...`);
    await bot.shutdown();
    process.exit(0);
  };

  process.on('SIGINT', () => void gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => void gracefulShutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});