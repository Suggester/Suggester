import {PrismaClient} from '@prisma/client';
import {Service} from 'typedi';
import {GuildConfigStore} from './store/guildConfig';
import {SuggestionStore} from './store/suggestion';
import {SuggestionFeedStore} from './store/suggestionFeed';

@Service()
export class Database {
  feeds: SuggestionFeedStore;
  guildConfigs: GuildConfigStore;
  suggestions: SuggestionStore;

  constructor() {
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });

    this.feeds = new SuggestionFeedStore(prisma);
    this.guildConfigs = new GuildConfigStore(prisma);
    this.suggestions = new SuggestionStore(prisma);
  }
}
