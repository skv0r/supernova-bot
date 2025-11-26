import TelegramBot from 'node-telegram-bot-api';
import { TwitchListener } from './twitch.listener.js';
import { TwitchService } from './twitch.service.js';

export interface TwitchNotifierOptions {
  serviceUrl: string;
  channelName: string;
  notifyChannelId: string;
}

export class TwitchNotifier {
  private readonly listener: TwitchListener;

  constructor(
    private readonly bot: TelegramBot,
    private readonly options: TwitchNotifierOptions,
  ) {
    const service = new TwitchService(options.serviceUrl);
    this.listener = new TwitchListener(service, {
      channelName: options.channelName,
    });

    this.listener.on('live', (info) => {
      void this.bot.sendMessage(
        this.options.notifyChannelId,
        `🔴 Stream started: ${info.title}`,
      );
    });
  }

  start(): void {
    this.listener.start();
  }

  stop(): void {
    this.listener.stop();
  }
}

