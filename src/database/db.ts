import fs from 'fs/promises';
import path from 'path';
import { ScheduledPost } from './models/ScheduledPost.js';
import { ChannelSettings } from './models/ChannelSettings.js';
import { ContentPlanItem } from './models/ContentPlanItem.js';
import { BOT_DATA_FILE } from '../config/constants.js';

export interface DatabaseState {
  channels: ChannelSettings[];
  scheduledPosts: ScheduledPost[];
  contentPlans: ContentPlanItem[];
}

const defaultState: DatabaseState = {
  channels: [],
  scheduledPosts: [],
  contentPlans: [],
};

export class JsonDatabase {
  private state: DatabaseState = structuredClone(defaultState);
  private initialized = false;

  constructor(private dataDir: string) {}

  async init(): Promise<void> {
    if (this.initialized) return;
    await fs.mkdir(this.dataDir, { recursive: true });
    const filePath = this.getFilePath();

    try {
      const data = await fs.readFile(filePath, 'utf-8');
      this.state = JSON.parse(data) as DatabaseState;
    } catch (error) {
      await fs.writeFile(filePath, JSON.stringify(this.state, null, 2), 'utf-8');
    }

    this.initialized = true;
  }

  getState(): DatabaseState {
    return this.state;
  }

  async update(partial: Partial<DatabaseState>): Promise<void> {
    this.state = { ...this.state, ...partial };
    await this.persist();
  }

  async save(): Promise<void> {
    await this.persist();
  }

  private async persist(): Promise<void> {
    const filePath = this.getFilePath();
    await fs.writeFile(filePath, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  private getFilePath(): string {
    return path.join(this.dataDir, BOT_DATA_FILE);
  }
}

