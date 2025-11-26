import TelegramBot from 'node-telegram-bot-api';
import { registerCommandHandlers } from './handlers/commands.handler.js';
import { registerMessageHandlers } from './handlers/messages.handler.js';
import { registerCallbackHandlers } from './handlers/callbacks.handler.js';
import { ChannelService } from '../modules/channels/channel.service.js';
import { ContentPlanService } from '../modules/content-plan/content-plan.service.js';
import { ChannelScheduler } from '../modules/channels/channel.scheduler.js';
import { SchedulerService } from '../modules/scheduler/scheduler.js';
import { Logger } from '../utils/logger.js';

export interface RouteContext {
  channelService: ChannelService;
  contentPlanService: ContentPlanService;
  channelScheduler: ChannelScheduler;
  scheduler: SchedulerService;
  adminIds: number[];
}

const logger = new Logger('Routes');

export function registerRoutes(bot: TelegramBot, ctx: RouteContext): void {
  registerCommandHandlers(bot, ctx);
  registerMessageHandlers(bot, { adminIds: ctx.adminIds });
  registerCallbackHandlers(bot);

  bot.on('my_chat_member', async (update) => {
    try {
      const chat = update.chat;
      const status = update.new_chat_member.status;
      if (status === 'administrator' || status === 'member') {
        await ctx.channelService.trackChat(bot, chat);
      } else if (status === 'left' || status === 'kicked') {
        await ctx.channelService.deactivate(chat.id);
      }
    } catch (error) {
      logger.error('Failed to handle chat member update', error);
    }
  });

  bot.on('channel_post', async (msg) => {
    try {
      logger.info(`${JSON.stringify(msg, null, 2)}`)
      if (msg.chat.type === 'channel') {
        await ctx.channelService.refresh(bot, msg.chat.id);
      }
    } catch (error) {
      logger.error('Failed to refresh channel info', error);
    }
  });
}

