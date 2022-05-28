import {PrismaClient} from '@prisma/client';

import {
  GuildConfigStore,
  InstanceGuildStore,
  InstanceStore,
  SuggestionFeedStore,
} from './store';

export class Database {
  instances: InstanceStore;
  instanceGuilds: InstanceGuildStore;
  guildConfigs: GuildConfigStore;
  suggestionFeeds: SuggestionFeedStore;

  constructor(public readonly prisma: PrismaClient) {
    this.instances = new InstanceStore(prisma);
    this.instanceGuilds = new InstanceGuildStore(prisma);
    this.guildConfigs = new GuildConfigStore(prisma);
    this.suggestionFeeds = new SuggestionFeedStore(prisma);
  }
}

export * from './store';
