import { SchedulerService } from '../scheduler/scheduler.js';
import { ChannelService } from './channel.service.js';

export class ChannelScheduler {
  constructor(
    private readonly scheduler: SchedulerService,
    private readonly channels: ChannelService,
  ) {}

  start(): void {
    this.scheduler.start();
  }

  stop(): void {
    this.scheduler.stop();
  }

  async schedulePost(
    channelId: string,
    content: string,
    scheduledTime: Date,
    mediaUrls?: string[],
  ): Promise<string> {
    const channel = this.channels.getChannel(channelId);
    if (!channel || !channel.isActive) {
      throw new Error('Channel is not active');
    }

    return this.scheduler.schedulePost(channelId, content, scheduledTime, mediaUrls);
  }

  cancelPost(postId: string): Promise<boolean> {
    return this.scheduler.cancelPost(postId);
  }

  listMessage(): string {
    return this.scheduler.buildPendingPostsMessage();
  }
}

