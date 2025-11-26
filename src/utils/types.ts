import type { ChannelSettings } from '../database/models/ChannelSettings.js';
import type { ScheduledPost } from '../database/models/ScheduledPost.js';
import type { ContentPlan } from '../modules/content-plan/content-plan.types.js';

export type { ScheduledPost, ContentPlan };

export interface BotConfig {
  token: string;
  dataDir: string;
  checkInterval: number;
}

export interface ChannelInfo extends Omit<ChannelSettings, 'addedAt' | 'lastChecked'> {
  addedAt: Date;
  lastChecked: Date;
}

export interface BotStatusSnapshot {
  isRunning: boolean;
  scheduledPosts: number;
  contentPlans: number;
  activeChannels: number;
  checkInterval: number;
}