export interface ChannelSettings {
  id: string | number;
  title?: string;
  username?: string;
  type: 'channel' | 'group' | 'supergroup' | 'private';
  memberCount?: number;
  description?: string;
  addedAt: string;
  lastChecked: string;
  isActive: boolean;
}

