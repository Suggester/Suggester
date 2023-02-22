import {PrismaClient, GuildConfig} from "../prisma-out";

export type PartialGuildConfig = Omit<GuildConfig, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * An abstraction around the guild_configs table
 */
export class GuildConfigStore {
  constructor(readonly prisma: PrismaClient) {}

  async get(guildID: string) {
    return this.prisma.guildConfig.findFirst({
      where: {
        guildID,
      }
    })
  }

  async update(guildID: string, row: PartialGuildConfig) {
    return this.prisma.guildConfig.update({
      where: {guildID},
      data: row,
    });
  }

  async upsert(guildID: string, row: PartialGuildConfig) {
    return this.prisma.guildConfig.upsert({
      where: {guildID},
      update: row,
      create: row,
    })
  }

  async delete(guildID: string) {
    return this.prisma.guildConfig.delete({
      where: {guildID},
    });
  }

  async getLocale(guildID: string) {
    return this.prisma.guildConfig.findFirst({
      where: {guildID},
      select: {
        locale: true,
      }
    }).then(r => r?.locale);
  }
}
