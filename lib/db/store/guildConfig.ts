import {PrismaClient, GuildConfig} from '@prisma/client';

export class GuildConfigStore {
  constructor(private prisma: PrismaClient) {}

  async add(
    data: Partial<Omit<GuildConfig, 'createdAt' | 'updatedAt'>> & {id: string}
  ) {
    return this.prisma.guildConfig.create({data});
  }

  async delete(guild: string) {
    return this.prisma.guildConfig.delete({
      where: {id: guild},
    });
  }

  async get(guild: string): Promise<GuildConfig | null> {
    return this.prisma.guildConfig.findUnique({
      where: {id: guild},
    });
  }

  async getFull(guild: string) {
    return this.prisma.guildConfig.findUnique({
      where: {id: guild},
      include: {
        feeds: true,
      },
    });
  }

  async update(guild: string, data: Partial<Omit<GuildConfig, 'id'>>) {
    return this.prisma.guildConfig.update({
      where: {id: guild},
      data: data,
    });
  }
}
