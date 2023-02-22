import {PrismaClient, SuggestionFeed} from "../prisma-out";

export type PartialSuggestionFeed = Omit<
  SuggestionFeed,
  'id' | 'lastSuggestionID' | 'createdAt'| 'updatedAt'
>;

export class SuggestionFeedStore {
  constructor(readonly prisma: PrismaClient) {}

  async get(query: {
    guildID: string;
    channelID: string;
  }) {
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
}
