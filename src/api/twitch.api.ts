import { httpRequest } from './http.client.js';

export interface TwitchStreamInfo {
  id: string;
  title: string;
  isLive: boolean;
  startedAt?: string;
}

export async function fetchStreamInfo(serviceUrl: string, channelName: string): Promise<TwitchStreamInfo> {
  const url = `${serviceUrl.replace(/\/$/, '')}/streams/${channelName}`;
  return httpRequest<TwitchStreamInfo>(url);
}

