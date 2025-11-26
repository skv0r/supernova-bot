export type ScheduledPostStatus = 'pending' | 'posted' | 'failed';

export interface ScheduledPost {
  id: string;
  content: string;
  scheduledTime: string;
  status: ScheduledPostStatus;
  channelId: string;
  mediaUrls?: string[];
  createdAt: string;
}

