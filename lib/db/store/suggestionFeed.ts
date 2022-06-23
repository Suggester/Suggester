import {PrismaClient, SuggestionFeed} from '@prisma/client';

import {DatabaseStore} from '.';

export class SuggestionFeedStore extends DatabaseStore<SuggestionFeed> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  create(
    row: Omit<SuggestionFeed, 'id' | 'updatedAt' | 'createdAt'>
  ): Promise<SuggestionFeed> {
    return this.prisma.suggestionFeed.create({data: row});
  }

  get(query: {
    applicationId: string;
    guildId: string;
    channelId: string;
  }): Promise<SuggestionFeed | null> {
    return this.prisma.suggestionFeed.findFirst({
      where: query,
    });
  }

  update(
    query: {
      applicationId: string;
      guildId: string;
      channelId: string;
    },
    update: Partial<SuggestionFeed>
  ): Promise<SuggestionFeed | null> {
    return this.prisma.suggestionFeed.update({
      where: {
        applicationId_guildId_channelId: query,
      },
      data: update,
    });
  }

  upsert(
    query: {
      applicationId: string;
      guildId: string;
      channelId: string;
    },
    row: Omit<
      SuggestionFeed,
      'id' | 'lastSuggestionId' | 'updatedAt' | 'createdAt'
    >
  ): Promise<SuggestionFeed> {
    return this.prisma.suggestionFeed.upsert({
      where: {
        applicationId_guildId_channelId: query,
      },
      update: row,
      create: row,
    });
  }

  delete(query: {
    applicationId: string;
    guildId: string;
    channelId: string;
  }): Promise<SuggestionFeed | null> {
    return this.prisma.suggestionFeed.delete({
      where: {
        applicationId_guildId_channelId: query,
      },
    });
  }
}
