import { fetchStreamInfo, TwitchStreamInfo } from '../../api/twitch.api.js';

export class TwitchService {
  constructor(private readonly serviceUrl: string) {}

  getStreamInfo(channelName: string): Promise<TwitchStreamInfo> {
    return fetchStreamInfo(this.serviceUrl, channelName);
  }
}

