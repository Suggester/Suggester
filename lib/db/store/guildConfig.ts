import {GuildConfig, PrismaClient} from '@prisma/client';

import {DatabaseStore} from '.';

export class GuildConfigStore extends DatabaseStore<GuildConfig> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  async create(config: GuildConfig): Promise<GuildConfig> {
    return this.prisma.guildConfig.create({data: config});
  }

  async get(query: {
    applicationId: string;
    guildId: string;
  }): Promise<GuildConfig | null> {
    return this.prisma.guildConfig.findFirst({
      where: query,
    });
  }

  async update(
    query: {applicationId: string; guildId: string},
    update: Partial<Omit<GuildConfig, 'createdAt' | 'updatedAt'>>
  ): Promise<GuildConfig | null> {
    return this.prisma.guildConfig.update({
      where: {
        applicationId_guildId: query,
      },
      data: update,
    });
  }

  async upsert(
    query: {applicationId: string; guildId: string},
    row: Omit<GuildConfig, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GuildConfig> {
    return this.prisma.guildConfig.upsert({
      where: {
        applicationId_guildId: query,
      },
      update: row,
      create: row,
    });
  }

  async delete(query: {applicationId: string; guildId: string}) {
    return this.prisma.guildConfig.delete({
      where: {
        applicationId_guildId: query,
      },
    });
  }
}
