export interface ContentPlanItem {
  id: string;
  channelId: string;
  content: string;
  scheduledTime: string;
  status: 'pending' | 'posted' | 'failed';
  createdAt: string;
}

