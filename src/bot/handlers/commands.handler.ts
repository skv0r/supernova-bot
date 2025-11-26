import TelegramBot from 'node-telegram-bot-api';
import { ChannelService } from '../../modules/channels/channel.service.js';
import { ChannelScheduler } from '../../modules/channels/channel.scheduler.js';
import { ContentPlanService } from '../../modules/content-plan/content-plan.service.js';
import { SchedulerService } from '../../modules/scheduler/scheduler.js';
import { ensureAdmin } from '../middlewares/auth.middleware.js';
import { logMessage } from '../middlewares/logging.middleware.js';

export interface CommandHandlerContext {
  channelService: ChannelService;
  channelScheduler: ChannelScheduler;
  contentPlanService: ContentPlanService;
  scheduler: SchedulerService;
  adminIds: number[];
}

export function registerCommandHandlers(bot: TelegramBot, ctx: CommandHandlerContext): void {
  bot.onText(/\/start/, (msg) => {
    try {
      ensureAdmin(ctx.adminIds, msg);
      logMessage(msg);
      bot.sendMessage(
        msg.chat.id,
        '🤖 *Telegram Channel Manager*\n\nUse /help to see available commands.',
        { parse_mode: 'Markdown' },
      );
    } catch (error) {
      handleAuthError(bot, msg.chat.id, error);
    }
  });

  bot.onText(/\/help/, (msg) => {
    try {
      ensureAdmin(ctx.adminIds, msg);
      logMessage(msg);
      bot.sendMessage(
        msg.chat.id,
        [
          '📚 *Help*',
          '/status - Bot status',
          '/list - Scheduled posts',
          '/plans - Content plans',
          '/channels - Managed channels',
        ].join('\n'),
        { parse_mode: 'Markdown' },
      );
    } catch (error) {
      handleAuthError(bot, msg.chat.id, error);
    }
  });

  bot.onText(/\/status/, (msg) => {
    try {
      ensureAdmin(ctx.adminIds, msg);
      logMessage(msg);
      const schedulerPosts = ctx.scheduler.getPendingPosts().length;
      const plans = ctx.contentPlanService.listPlans().length;
      const activeChannels = ctx.channelService.getActiveChannels().length;
      const status = `📊 *Status*\n\nScheduled: ${schedulerPosts}\nPlans: ${plans}\nChannels: ${activeChannels}`;
      bot.sendMessage(msg.chat.id, status, { parse_mode: 'Markdown' });
    } catch (error) {
      handleAuthError(bot, msg.chat.id, error);
    }
  });

  // Admin part
  bot.onText(/\/list/, (msg) => sendMessage(bot, msg, ctx, ctx.scheduler.buildPendingPostsMessage()));
  bot.onText(/\/plans/, (msg) => sendMessage(bot, msg, ctx, ctx.contentPlanService.buildPlansMessage()));
  bot.onText(/\/channels/, (msg) => sendMessage(bot, msg, ctx, ctx.channelService.buildChannelsMessage()));

  // Users part 
  bot.onText(/\/stats/, (msg) => bot.sendMessage(msg.chat.id, "Here will be stats"))
  bot.onText(/\/schedule/, (msg) => bot.sendMessage(msg.chat.id, "Here will be schedule of matches"))

  bot.onText(/\/playerStats(?:\s+(.+))?/i, (msg, match) => {
    const playerName = match && match[1] ? match[1].trim() : null;
    if (!playerName) {
      bot.sendMessage(
        msg.chat.id,
        "❌ Please provide a player name after the command.\n\nExample:\n `/playerStats 9Impulse`",
        { parse_mode: "Markdown" }
      );
      return;
    }
    // Example of work (blueprint): Return a message pretending to fetch stats for given player
    bot.sendMessage(
      msg.chat.id,
      `📊 *Player Stats*\n\nHere will be the stats for *${playerName}*.`,
      { parse_mode: "Markdown" }
    );
  });

}

function sendMessage(bot: TelegramBot, msg: TelegramBot.Message, ctx: CommandHandlerContext, body: string): void {
  try {
    ensureAdmin(ctx.adminIds, msg);
    logMessage(msg);
    bot.sendMessage(msg.chat.id, body, { parse_mode: 'Markdown' });
  } catch (error) {
    handleAuthError(bot, msg.chat.id, error);
  }
}

function handleAuthError(bot: TelegramBot, chatId: number, error: unknown): void {
  if (error instanceof Error && error.name === 'UnauthorizedError') {
    bot.sendMessage(chatId, '⛔️ You are not allowed to use this bot.');
    return;
  }
  bot.sendMessage(chatId, '❌ Something went wrong.');
}

