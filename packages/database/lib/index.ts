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

// From https://www.prisma.io/docs/reference/api-reference/error-reference#error-codes
// NOTE: this is not all error codes, just the ones we're using
export enum PrismaErrorCode {
  UniqueConstraintViolation = 'P2002',
}

export * from '../prisma-out';
export * from './constants';
