import {PrismaClient, SuggestionFeed} from '../prisma-out';

export type PartialSuggestionFeed = Omit<
  SuggestionFeed,
  'id' | 'lastSuggestionID' | 'createdAt' | 'updatedAt'
>;

export class SuggestionFeedStore {
  constructor(readonly prisma: PrismaClient) {}

  async create(
    data: Partial<PartialSuggestionFeed> &
      Pick<SuggestionFeed, 'guildID' | 'feedChannelID'>
  ) {
    return this.prisma.suggestionFeed.create({data});
  }

  async get(query: {guildID: string; channelID: string}) {
    return this.prisma.suggestionFeed.findFirst({
      where: query,
    });
  }

  async getAll(guildID: string) {
    return this.prisma.suggestionFeed.findMany({
      where: {guildID},
    });
  }

  async getDefault(guildID: string) {
    return this.prisma.suggestionFeed.findFirst({
      where: {
        guildID,
        isDefault: true,
      },
    });
  }

  async getByID(guildID: string, id: number) {
    return this.prisma.suggestionFeed.findFirst({
      where: {id, guildID},
    });
  }

  async autocompleteName(
    guildID: string,
    name: string
  ): Promise<{choices: {name: string; value: string}[]}> {
    const res = await this.prisma.suggestionFeed
      .findMany({
        where: {
          guildID,
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

  async getByName(guildID: string, name: string) {
    return this.prisma.suggestionFeed.findFirst({
      where: {
        guildID,
        name,
      },
    });
  }
}
