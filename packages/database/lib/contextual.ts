import {Database} from '.';
import {
  Suggestion,
  SuggestionApprovalStatus,
  SuggestionFeed,
} from '../prisma-out';

export type PartialSuggestionFeed = Omit<
  SuggestionFeed,
  'id' | 'lastSuggestionID' | 'createdAt' | 'updatedAt'
>;

export type PartialSuggestion = Omit<
  Suggestion,
  'id' | 'createdAt' | 'updatedAt' | 'guildID'
>;

export interface ContextualDatabaseConfig {
  db: Database;

  guildID?: string;
  channelID?: string;
  userID: string;
}

/** Contextual database actions */
export class ContextualDatabase {
  readonly db: Database;
  readonly guildID?: string;
  readonly channelID?: string;
  readonly userID: string;

  constructor(cfg: ContextualDatabaseConfig) {
    this.db = cfg.db;
    this.guildID = cfg.guildID;
    this.channelID = cfg.channelID;
    this.userID = cfg.userID;
  }

  // --- feeds ---

  async getFeeds(): Promise<SuggestionFeed[]> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.db.prisma.suggestionFeed.findMany({
      where: {
        guildID: this.guildID,
      },
    });
  }

  async getFeedByID(id: number): Promise<SuggestionFeed | null> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.db.prisma.suggestionFeed.findFirst({
      where: {
        guildID: this.guildID,
        id,
      },
    });
  }

  async getFeedByName(name: string): Promise<SuggestionFeed | null> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.db.prisma.suggestionFeed.findFirst({
      where: {
        guildID: this.guildID,
        name,
      },
    });
  }

  async autocompleteFeeds(
    name: string
  ): Promise<{choices: {name: string; value: string}[]}> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    const res = await this.db.prisma.suggestionFeed
      .findMany({
        where: {
          guildID: this.guildID,
          name: {
            contains: name,
            mode: 'insensitive',
          },
        },
        select: {
          name: true,
          isDefault: true,
        },
      })
      .then(r =>
        r.map(row => ({
          name: `${row.name}${row.isDefault ? ' (default)' : ''}`,
          value: row.name,
        }))
      );

    return {choices: res};
  }

  async createFeed(
    data: Partial<PartialSuggestionFeed> & Pick<SuggestionFeed, 'feedChannelID'>
  ): Promise<SuggestionFeed> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.db.prisma.suggestionFeed.create({
      data: {
        guildID: this.guildID,
        ...data,
      },
    });
  }

  async deleteFeed(id: number): Promise<SuggestionFeed> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.db.prisma.suggestionFeed.delete({where: {id}});
  }

  async updateFeed(id: number, data: Partial<PartialSuggestionFeed>) {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.db.prisma.suggestionFeed.update({
      where: {id},
      data,
    });
  }

  // --- suggestions ---

  async createSuggestion(
    data: Partial<PartialSuggestion> &
      Pick<Suggestion, 'body' | 'feedChannelID' | 'approvalStatus'>
  ) {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.db.prisma.suggestion.create({
      data: {
        ...data,
        guildID: this.guildID,
        authorID: this.userID,
        feedChannelID: data.feedChannelID,
        approvalStatus: data.approvalStatus,
      },
    });
  }

  async updateSuggestion(id: number, data: Partial<PartialSuggestion>) {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.db.prisma.suggestion.update({
      where: {id},
      data,
    });
  }

  async deleteSuggestion(id: number) {
    return this.db.prisma.suggestion.delete({
      where: {id},
    });
  }

  // --- ensures ---

  /**
   * Creates a guild config if one does not exist, thereby
   * ensuring one exists
   */
  async ensureConfig() {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    await this.db.prisma.guildConfig.upsert({
      where: {
        guildID: this.guildID,
      },
      update: {},
      create: {
        guildID: this.guildID,
      },
      // prisma doesn't let you return nothing
      select: {id: true},
    });
  }
}

// export class EnsureFailed extends Error {
//   readonly kind: string;

//   readonly guildID?: string;
//   readonly channelID?: string;
//   readonly userID: string;

//   constructor(ctx: ContextualDatabase, kind: 'config' | 'feed') {
//     super('Ensure failed');

//     this.kind = kind;

//     this.guildID = ctx.guildID;
//     this.channelID = ctx.channelID;
//     this.userID = ctx.userID;
//   }
// }
