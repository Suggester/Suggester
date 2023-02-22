import {PrismaClient} from '../prisma-out';

import {GuildConfigStore} from './guildConfig';
import {SuggestionFeedStore} from './suggestionFeed';

export class Database {
  prisma;
  guildConfigs: GuildConfigStore;
  suggestionFeeds: SuggestionFeedStore;

  constructor(postgresURL: string) {
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: postgresURL,
        },
      },
    });

    this.guildConfigs = new GuildConfigStore(this.prisma);
    this.suggestionFeeds = new SuggestionFeedStore(this.prisma);
  }
}

export * from '../prisma-out';
