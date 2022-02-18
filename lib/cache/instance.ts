import {Instance} from '@prisma/client';
import {Redis} from 'ioredis';

import {CachedInstance} from 'suggester';

export class InstanceCache {
  constructor(private redis: Redis) {}

  async set(instance: Instance): Promise<boolean> {
    const proto = CachedInstance.encode(instance);
    const ok = await this.redis.set(
      this.#redisKey(instance.botId),
      Buffer.from(proto.finish())
    );

    return ok === 'OK';
  }

  async get(botId: string): Promise<CachedInstance | null> {
    const found = await this.redis.getBuffer(this.#redisKey(botId));

    if (!found) {
      return null;
    }

    const decoded = CachedInstance.decode(found);
    console.log('decoded:', decoded);
    return decoded;
  }

  #redisKey(botId: string): string {
    return `instances:${botId}`;
  }
}
