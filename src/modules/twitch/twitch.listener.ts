import EventEmitter from 'events';
import { TwitchService } from './twitch.service.js';

export interface TwitchListenerOptions {
  channelName: string;
  pollIntervalMs?: number;
}

export class TwitchListener extends EventEmitter {
  private intervalId?: NodeJS.Timeout;
  private wasLive = false;

  constructor(
    private readonly service: TwitchService,
    private readonly options: TwitchListenerOptions,
  ) {
    super();
  }

  start(): void {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => {
      void this.poll();
    }, this.options.pollIntervalMs ?? 60_000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  private async poll(): Promise<void> {
    try {
      const info = await this.service.getStreamInfo(this.options.channelName);
      if (info.isLive && !this.wasLive) {
        this.wasLive = true;
        this.emit('live', info);
      } else if (!info.isLive) {
        this.wasLive = false;
      }
    } catch (error) {
      this.emit('error', error);
    }
  }
}

