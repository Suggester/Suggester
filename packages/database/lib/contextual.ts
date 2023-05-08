import {Database} from '.';
import {
  Prisma,
  PrismaClient,
  Suggestion,
  SuggestionFeed,
  SuggestionVoteKind,
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

type DownloadedAttachment = {file: Buffer; type: string; name?: string};

/** Contextual database actions */
export class ContextualDatabase {
  readonly db: Database;
  readonly guildID?: string;
  readonly channelID?: string;
  readonly userID: string;
  readonly prisma: PrismaClient;

  constructor(cfg: ContextualDatabaseConfig) {
    this.db = cfg.db;
    this.guildID = cfg.guildID;
    this.channelID = cfg.channelID;
    this.userID = cfg.userID;
    this.prisma = cfg.db.prisma;
  }

  // --- feeds ---

  async getFeeds(): Promise<SuggestionFeed[]> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.prisma.suggestionFeed.findMany({
      where: {
        guildID: this.guildID,
      },
    });
  }

  async getFeedByID(id: number): Promise<SuggestionFeed | null> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.prisma.suggestionFeed.findFirst({
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

    return this.prisma.suggestionFeed.findFirst({
      where: {
        guildID: this.guildID,
        name,
      },
    });
  }

  async getDefaultFeed(): Promise<SuggestionFeed | null> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.prisma.suggestionFeed.findFirst({
      where: {
        guildID: this.guildID,
        isDefault: true,
      },
    });
  }

  async getFeedByNameOrDefault(name?: string) {
    return name ? this.getFeedByName(name) : this.getDefaultFeed();
  }

  async countFeeds(): Promise<number> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.prisma.suggestionFeed.count({
      where: {
        guildID: this.guildID,
      },
    });
  }

  async autocompleteFeeds(
    name: string
  ): Promise<{choices: {name: string; value: string}[]}> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    const res = await this.prisma.suggestionFeed
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

    return this.prisma.suggestionFeed.create({
      data: {
        guildID: this.guildID,
        ...data,
      },
    });
  }

  // TODO: delete attachments from s3
  async deleteFeed(id: number): Promise<SuggestionFeed> {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.prisma.suggestionFeed.delete({where: {id}});
  }

  async updateFeed(id: number, data: Partial<PartialSuggestionFeed>) {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.prisma.suggestionFeed.update({
      where: {id},
      data,
    });
  }

  // --- suggestions ---

  async getSuggestionByPublicID(feedID: number, suggestionPubID: number) {
    return this.prisma.suggestion.findFirst({
      where: {
        feed: {
          id: feedID,
        },
        publicID: suggestionPubID,
      },
    });
  }

  async getFullSuggestion(id: number) {
    return this.prisma.suggestion.findFirst({
      where: {id},
      include: {
        attachments: true,
        comments: true,
        feed: true,
      },
    });
  }

  async getFullSuggestionByPublicID(feedID: number, suggestionPubID: number) {
    return this.prisma.suggestion.findFirst({
      where: {
        feed: {
          id: feedID,
        },
        publicID: suggestionPubID,
      },
      include: {
        attachments: true,
        comments: true,
        feed: true,
      },
    });
  }

  async createSuggestion(
    data: Partial<PartialSuggestion> &
      Pick<Suggestion, 'body' | 'feedChannelID' | 'approvalStatus'>,
    attachments?: {file: Buffer; type: string; name?: string}[]
  ) {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    const createdSuggestion = await this.prisma.suggestion.create({
      data: {
        ...data,
        guildID: this.guildID,
        authorID: this.userID,
        feedChannelID: data.feedChannelID,
        approvalStatus: data.approvalStatus,
      },
      include: {
        attachments: true,
        comments: true,
        feed: true,
      },
    });

    if (attachments?.length) {
      const suggestionWithAttachments = this.createAttachments(
        createdSuggestion,
        attachments
      );
      return suggestionWithAttachments;
    }

    return createdSuggestion;
  }

  async updateSuggestion(
    id: number,
    data: Prisma.SuggestionUpdateArgs['data']
  ) {
    if (!this.guildID) {
      throw new Error('guildID missing in ContextualDatabase');
    }

    return this.prisma.suggestion.update({
      where: {id},
      data,
    });
  }

  // TODO: delete attachments from s3
  async deleteSuggestion(id: number) {
    return this.prisma.suggestion.delete({
      where: {id},
    });
  }

  // --- votes ---

  async createVote(kind: SuggestionVoteKind, suggestionID: number) {
    return this.prisma.suggestionVote.create({
      data: {
        kind,
        suggestionID,
        userID: this.userID,
      },
    });
  }

  async updateVoteKind(kind: SuggestionVoteKind, id: number) {
    return this.prisma.suggestionVote.update({
      where: {id},
      data: {kind},
    });
  }

  async deleteVote(id: number) {
    return this.prisma.suggestionVote.delete({
      where: {id},
    });
  }

  async getOpinion(
    suggestionID: number
  ): Promise<{[key in SuggestionVoteKind]: number}> {
    const votes = await this.prisma.suggestionVote.groupBy({
      where: {suggestionID},
      by: [Prisma.SuggestionVoteScalarFieldEnum.kind],
      _count: true,
    });

    return votes.reduce(
      (a, c) => ((a[c.kind] = c._count), a),
      {} as {[key in SuggestionVoteKind]: number}
    );
  }

  // --- attachments ---

  async getAttachmentsByPublicID(feedID: number, publicID: number) {
    return this.prisma.suggestion.findFirst({
      where: {
        guildID: this.guildID,
        publicID,
        feed: {
          id: feedID,
        },
      },
      select: {
        attachments: true,
        authorID: true,
      },
    });
  }

  async getAllAttachments(id: number) {
    return this.prisma.suggestion.findFirst({
      where: {id},
      select: {
        id: true,
        feedChannelID: true,
        authorID: true,
        attachments: {
          orderBy: {id: 'asc'},
        },
      },
    });
  }

  async addAttachmentToSuggestion(
    suggestion: Pick<Suggestion, 'feedChannelID' | 'id'>,
    attachment: DownloadedAttachment
  ) {
    return this.createAttachments(suggestion, [attachment]);
  }

  async createAttachments(
    suggestion: Pick<Suggestion, 'feedChannelID' | 'id'>,
    attachments: DownloadedAttachment[]
  ) {
    const uploadedAttachments = await Promise.all(
      attachments.map(
        async a =>
          [
            await this.db.s3.uploadAttachment(
              a.file,
              a.type,
              this.guildID!,
              suggestion.feedChannelID,
              suggestion.id,
              this.userID
            ),
            a,
          ] as const
      )
    );

    const s3BaseURL =
      this.db.s3.options.s3_endpoint + '/' + this.db.s3.options.s3_bucket + '/';

    const s = await this.prisma.suggestion.update({
      where: {id: suggestion.id},
      data: {
        attachments: {
          createMany: {
            data: uploadedAttachments.map(([u, a]) => ({
              name: a.name,
              url: s3BaseURL + u.key,
              s3Key: u.key,
            })),
          },
        },
      },

      include: {
        attachments: true,
        comments: true,
        feed: true,
      },
    });

    return s;
  }

  async deleteAttachmentByID(id: number) {
    const deleted = await this.prisma.suggestionAttachment.delete({
      where: {id},
    });

    await this.db.s3.deleteAttachment(deleted);

    return deleted;
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

    await this.prisma.guildConfig.upsert({
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
