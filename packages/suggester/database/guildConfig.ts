import {GuildConfig, PrismaClient} from '@prisma/client';

export type PartialGuildConfig = Omit<
  GuildConfig,
  'id' | 'createdAt' | 'updatedAt'
>;

/**
 * An abstraction around the guild_configs table
 */
export class GuildConfigStore {
  constructor(readonly prisma: PrismaClient) {}

  async get(guildID: string) {
    return this.prisma.guildConfig.findFirst({
      where: {
        guildID,
      },
    });
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
    });
  }

  async delete(guildID: string) {
    return this.prisma.guildConfig.delete({
      where: {guildID},
    });
  }

  async getLocale(guildID: string) {
    return this.prisma.guildConfig
      .findFirst({
        where: {guildID},
        select: {
          locale: true,
        },
      })
      .then(r => r?.locale);
  }

  /** Creates a config if one does not exist, and returns it */
  async getOrCreate(guildID: string) {
    // prisma doesn't have a `findOrCreate` method, but
    // upsert with an empty update behaves the same (mostly)

    // TODO: does this bump updatedAt
    return this.prisma.guildConfig.upsert({
      where: {guildID},
      update: {},
      create: {guildID},
    });
  }

  async ensureExists(guildID: string) {
    // prisma doesn't have a `findOrCreate` method, but
    // upsert with an empty update behaves the same (mostly)

    // TODO: does this bump updatedAt
    await this.prisma.guildConfig.upsert({
      where: {guildID},
      update: {},
      create: {guildID},
      // prisma doesn't let you return nothing
      select: {id: true},
    });
  }
}
