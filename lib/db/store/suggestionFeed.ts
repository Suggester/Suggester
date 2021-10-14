import {PrismaClient, SuggestionFeed} from '@prisma/client';

export class SuggestionFeedStore {
  constructor(private prisma: PrismaClient) {}

  async add(
    data: Partial<Omit<SuggestionFeed, 'id' | 'createdAt' | 'updatedAt'>> & {
      id: string;
      guildId: string;
    }
  ) {
    return this.prisma.suggestionFeed.create({data});
  }

  async delete(chan: string) {
    return this.prisma.suggestionFeed.delete({where: {id: chan}});
  }

  async get(id: string): Promise<SuggestionFeed | null> {
    return this.prisma.suggestionFeed.findUnique({
      where: {id},
    });
  }

  async getAll(id: string) {
    return this.prisma.suggestionFeed.findUnique({
      where: {id},
      include: {suggestions: true},
    });
  }

  async update(
    chan: string,
    data: Partial<Omit<SuggestionFeed, 'id' | 'channelId' | 'guildId'>>
  ) {
    return this.prisma.suggestionFeed.update({
      where: {id: chan},
      data: data,
    });
  }
}
