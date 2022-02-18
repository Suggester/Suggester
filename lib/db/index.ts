import {PrismaClient} from '@prisma/client';

import {InstanceGuildStore, InstanceStore} from './store';

export class Database {
  instances: InstanceStore;
  instanceGuilds: InstanceGuildStore;

  constructor(public readonly prisma: PrismaClient) {
    this.instances = new InstanceStore(prisma);
    this.instanceGuilds = new InstanceGuildStore(prisma);
  }
}

export * from './store';
