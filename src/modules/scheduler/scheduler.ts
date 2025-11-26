import TelegramBot from 'node-telegram-bot-api';
import { JsonDatabase } from '../../database/db.js';
import { ScheduledPost } from '../../database/models/ScheduledPost.js';
import { formatDateTime } from '../../utils/time.js';
import { generateId } from './scheduler.utils.js';

export class SchedulerService {
  private posts = new Map<string, ScheduledPost>();
  private intervalId?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly bot: TelegramBot,
    private readonly db: JsonDatabase,
    private readonly intervalMs: number,
  ) {}

  async init(): Promise<void> {
    const stored = this.db.getState().scheduledPosts ?? [];
    stored.forEach((post) => this.posts.set(post.id, post));
  }

  async schedulePost(
    channelId: string,
    content: string,
    scheduledTime: Date,
    mediaUrls?: string[],
  ): Promise<string> {
    const post: ScheduledPost = {
      id: generateId(),
      channelId,
      content,
      mediaUrls,
      status: 'pending',
      scheduledTime: scheduledTime.toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.posts.set(post.id, post);
    await this.persist();
    return post.id;
  }

  async cancelPost(postId: string): Promise<boolean> {
    const post = this.posts.get(postId);
    if (!post || post.status === 'posted') {
      return false;
    }

    this.posts.delete(postId);
    await this.persist();
    return true;
  }

  getPendingPosts(): ScheduledPost[] {
    return Array.from(this.posts.values()).filter((post) => post.status === 'pending');
  }

  buildPendingPostsMessage(): string {
    const posts = this.getPendingPosts().sort(
      (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
    );

    if (posts.length === 0) {
      return '📭 No scheduled posts';
    }

    let message = '📅 *Scheduled Posts:*\n\n';
    posts.forEach((post, index) => {
      const preview = `${post.content}`.slice(0, 50);
      message += `${index + 1}. *ID:* \`${post.id}\`\n`;
      message += `   *Time:* ${formatDateTime(post.scheduledTime)}\n`;
      message += `   *Preview:* ${preview}${post.content.length > 50 ? '...' : ''}\n`;
      message += `   *Channel:* ${post.channelId}\n\n`;
    });

    return message;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.intervalId = setInterval(() => {
      void this.processDuePosts();
    }, this.intervalMs);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  async shutdown(): Promise<void> {
    this.stop();
    await this.persist();
  }

  private async processDuePosts(): Promise<void> {
    const now = Date.now();
    const duePosts = this.getPendingPosts().filter(
      (post) => new Date(post.scheduledTime).getTime() <= now,
    );

    for (const post of duePosts) {
      try {
        await this.publish(post);
        post.status = 'posted';
      } catch (error) {
        post.status = 'failed';
        console.error('Failed to publish post', error);
      } finally {
        this.posts.set(post.id, post);
      }
    }

    if (duePosts.length > 0) {
      await this.persist();
    }
  }

  private async publish(post: ScheduledPost): Promise<void> {
    if (post.mediaUrls && post.mediaUrls.length > 0) {
      if (post.mediaUrls.length === 1) {
        await this.bot.sendPhoto(post.channelId, post.mediaUrls[0], {
          caption: post.content,
          parse_mode: 'Markdown',
        });
      } else {
        await this.bot.sendMediaGroup(
          post.channelId,
          post.mediaUrls.map((url, index) => ({
            type: 'photo' as const,
            media: url,
            caption: index === 0 ? post.content : undefined,
            parse_mode: 'Markdown' as const,
          })),
        );
      }
      return;
    }

    await this.bot.sendMessage(post.channelId, post.content, {
      parse_mode: 'Markdown',
    });
  }

  private async persist(): Promise<void> {
    await this.db.update({
      scheduledPosts: Array.from(this.posts.values()),
    });
  }
}

