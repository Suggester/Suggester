import {PrismaClient, Suggestion} from '@prisma/client';

export class SuggestionStore {
  constructor(private prisma: PrismaClient) {}

  async add(
    data: Partial<Omit<Suggestion, 'createdAt' | 'updatedAt' | 'id'>> & {
      feedId: string;
      body: string;
      guildId: string;
      authorId: string;
    }
  ) {
    return this.prisma.suggestion.create({
      data: {
        ...data,
      },
    });
  }
}
