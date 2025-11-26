import TelegramBot from 'node-telegram-bot-api';
import { ChannelRepository } from './channel.repository.js';
import { ChannelInfo } from '../../utils/types.js';
import { Logger } from '../../utils/logger.js';
import { ChannelSettings } from '../../database/models/ChannelSettings.js';

export class ChannelService {
  private channels = new Map<string | number, ChannelInfo>();

  constructor(private readonly repo: ChannelRepository, private readonly logger: Logger) {}

  async init(): Promise<void> {
    const stored = this.repo.list();
    stored.forEach((channel) => this.channels.set(channel.id, this.deserialize(channel)));
  }

  async trackChat(bot: TelegramBot, chat: TelegramBot.Chat): Promise<void> {
    const info = await this.enrichChat(bot, chat);
    this.channels.set(info.id, info);
    await this.persist();
    this.logger.info(`Tracking channel ${info.title || info.username || info.id}`);
  }

  async refresh(bot: TelegramBot, chatId: string | number): Promise<void> {
    const chat = await bot.getChat(chatId);
    await this.trackChat(bot, chat);
  }

  async deactivate(chatId: string | number): Promise<void> {
    const channel = this.channels.get(chatId);
    if (!channel) return;
    channel.isActive = false;
    channel.lastChecked = new Date();
    this.channels.set(chatId, channel);
    await this.persist();
  }

  getChannel(chatId: string | number): ChannelInfo | undefined {
    return this.channels.get(chatId);
  }

  getChannels(): ChannelInfo[] {
    return Array.from(this.channels.values());
  }

  getActiveChannels(): ChannelInfo[] {
    return this.getChannels().filter((channel) => channel.isActive);
  }

  buildChannelsMessage(): string {
    const channels = this.getChannels();
    if (channels.length === 0) {
      return '📢 No channels tracked yet\n\nAdd this bot as an administrator to a channel to start tracking it.';
    }

    let message = '📢 *Tracked Channels:*\n\n';
    channels.forEach((channel, index) => {
      const status = channel.isActive ? '✅ Active' : '❌ Inactive';
      const title = channel.title || channel.username || `ID: ${channel.id}`;
      const username = channel.username ? `@${channel.username}` : '';

      message += `${index + 1}. *${title}*\n`;
      if (username) {
        message += `   *Username:* ${username}\n`;
      }
      message += `   *Type:* ${channel.type}\n`;
      message += `   *Status:* ${status}\n`;
      if (channel.memberCount) {
        message += `   *Members:* ${channel.memberCount}\n`;
      }
      message += `   *Added:* ${channel.addedAt.toLocaleDateString()}\n`;
      message += `   *Last Checked:* ${channel.lastChecked.toLocaleDateString()}\n\n`;
    });

    return message;
  }

  private async enrichChat(bot: TelegramBot, chat: TelegramBot.Chat): Promise<ChannelInfo> {
    const info: ChannelInfo = {
      id: chat.id,
      title: chat.title ?? undefined,
      username: chat.username ?? undefined,
      type: chat.type,
      description: chat.description ?? undefined,
      addedAt: new Date(),
      lastChecked: new Date(),
      isActive: true,
    };

    try {
      const chatInfo = await bot.getChat(chat.id);
      info.title = chatInfo.title ?? info.title;
      info.username = chatInfo.username ?? info.username;
      info.description = chatInfo.description ?? info.description;
      info.lastChecked = new Date();

      const memberCount = await bot.getChatMemberCount(chat.id);
      info.memberCount = memberCount;
    } catch (error) {
      this.logger.warn('Failed to enrich channel info', error);
    }

    return info;
  }

  private async persist(): Promise<void> {
    const serialized = this.getChannels().map((channel) => this.serialize(channel));
    await this.repo.saveAll(serialized);
  }

  private serialize(channel: ChannelInfo): ChannelSettings {
    return {
      ...channel,
      addedAt: channel.addedAt.toISOString(),
      lastChecked: channel.lastChecked.toISOString(),
    };
  }

  private deserialize(channel: ChannelSettings): ChannelInfo {
    return {
      ...channel,
      addedAt: new Date(channel.addedAt),
      lastChecked: new Date(channel.lastChecked),
    };
  }
}

