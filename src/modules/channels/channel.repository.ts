import { JsonDatabase } from '../../database/db.js';
import { ChannelSettings } from '../../database/models/ChannelSettings.js';

export class ChannelRepository {
  private channels = new Map<string | number, ChannelSettings>();

  constructor(private readonly db: JsonDatabase) {}

  async init(): Promise<void> {
    const stored = this.db.getState().channels ?? [];
    stored.forEach((channel) => this.channels.set(channel.id, channel));
  }

  list(): ChannelSettings[] {
    return Array.from(this.channels.values());
  }

  get(id: string | number): ChannelSettings | undefined {
    return this.channels.get(id);
  }

  async upsert(channel: ChannelSettings): Promise<void> {
    this.channels.set(channel.id, channel);
    await this.persist();
  }

  async saveAll(channels: ChannelSettings[]): Promise<void> {
    this.channels.clear();
    channels.forEach((channel) => this.channels.set(channel.id, channel));
    await this.persist();
  }

  private async persist(): Promise<void> {
    await this.db.update({
      channels: this.list(),
    });
  }
}

