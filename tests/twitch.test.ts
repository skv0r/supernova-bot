import { test } from 'node:test';
import { strict as assert } from 'node:assert';
import { EventEmitter } from 'events';
import { TwitchListener } from '../src/modules/twitch/twitch.listener.js';
import { TwitchService } from '../src/modules/twitch/twitch.service.js';

class MockTwitchService extends EventEmitter implements Partial<TwitchService> {
  private call = 0;

  async getStreamInfo() {
    this.call += 1;
    return {
      id: 'stream',
      title: 'Live now',
      isLive: this.call === 1,
    };
  }
}

test('Twitch listener emits live events', async () => {
  const service = new MockTwitchService() as unknown as TwitchService;
  const listener = new TwitchListener(service, { channelName: 'demo', pollIntervalMs: 10 });

  const liveEvent = new Promise<void>((resolve) => {
    listener.once('live', (info) => {
      assert.equal(info.isLive, true);
      listener.stop();
      resolve();
    });
  });

  listener.start();
  await liveEvent;
});

