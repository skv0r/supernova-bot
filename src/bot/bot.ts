import TelegramBot from 'node-telegram-bot-api';
import { JsonDatabase } from '../database/db.js';
import { ChannelRepository } from '../modules/channels/channel.repository.js';
import { ChannelService } from '../modules/channels/channel.service.js';
import { SchedulerService } from '../modules/scheduler/scheduler.js';
import { ChannelScheduler } from '../modules/channels/channel.scheduler.js';
import { ContentPlanService } from '../modules/content-plan/content-plan.service.js';
import { registerRoutes } from './routes.js';
import { Logger } from '../utils/logger.js';
import { BotConfig, BotStatusSnapshot } from '../utils/types.js';

export interface BotOptions extends BotConfig {
  adminIds: number[];
}

export class TelegramChannelManagerBot {
  private readonly bot: TelegramBot;
  private readonly logger = new Logger('Bot');
  private readonly db: JsonDatabase;
  private readonly channelRepository: ChannelRepository;
  private readonly channelService: ChannelService;
  private readonly schedulerService: SchedulerService;
  private readonly channelScheduler: ChannelScheduler;
  private readonly contentPlanService: ContentPlanService;
  private routesRegistered = false;

  constructor(private readonly config: BotOptions, botInstance?: TelegramBot) {
    this.bot = botInstance ?? new TelegramBot(config.token, { polling: true });
    this.db = new JsonDatabase(config.dataDir);
    this.channelRepository = new ChannelRepository(this.db);
    this.channelService = new ChannelService(this.channelRepository, new Logger('ChannelService'));
    this.schedulerService = new SchedulerService(this.bot, this.db, config.checkInterval);
    this.channelScheduler = new ChannelScheduler(this.schedulerService, this.channelService);
    this.contentPlanService = new ContentPlanService(this.db, this.schedulerService);
  }

  async init(): Promise<void> {
    await this.db.init();
    await this.channelRepository.init();
    await this.channelService.init();
    await this.schedulerService.init();
    await this.contentPlanService.init();

    if (!this.routesRegistered) {
      registerRoutes(this.bot, {
        channelService: this.channelService,
        contentPlanService: this.contentPlanService,
        channelScheduler: this.channelScheduler,
        scheduler: this.schedulerService,
        adminIds: this.config.adminIds,
      });
      this.routesRegistered = true;
    }

    this.channelScheduler.start();
    this.logger.info('TelegramChannelManagerBot initialized');
  }

  getBot(): TelegramBot {
    return this.bot;
  }

  getStatus(): BotStatusSnapshot {
    return {
      isRunning: true,
      scheduledPosts: this.schedulerService.getPendingPosts().length,
      contentPlans: this.contentPlanService.listPlans().length,
      activeChannels: this.channelService.getActiveChannels().length,
      checkInterval: this.config.checkInterval,
    };
  }

  async shutdown(): Promise<void> {
    this.channelScheduler.stop();
    await this.schedulerService.shutdown();
    await this.bot.stopPolling();
    await this.db.save();
    this.logger.info('Bot shutdown complete');
  }
}

