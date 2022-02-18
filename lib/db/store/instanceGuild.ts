import {InstanceGuild, PrismaClient} from '@prisma/client';

import {DatabaseStore} from '.';

export class InstanceGuildStore extends DatabaseStore<InstanceGuild> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  async create(row: Omit<InstanceGuild, 'id'>) {
    return this.prisma.instanceGuild.create({
      data: row,
    });
  }

  async get(query: {guildId: string; botId: string}) {
    return this.prisma.instanceGuild.findFirst({
      where: query,
    });
  }

  async update(
    query: {guildId: string; botId: string},
    update: Partial<Omit<InstanceGuild, 'id'>>
  ) {
    return this.prisma.instanceGuild.update({
      where: {
        guildId_botId: query,
      },
      data: update,
    });
  }

  async upsert(
    query: {guildId: string; botId: string},
    row: Omit<InstanceGuild, 'id'>
  ) {
    return this.prisma.instanceGuild.upsert({
      where: {
        guildId_botId: query,
      },
      update: row,
      create: row,
    });
  }

  async delete(query: {guildId: string; botId: string}) {
    return this.prisma.instanceGuild.delete({
      where: {guildId_botId: query},
    });
  }

  async checkInstanceUsability(query: {
    guildId: string;
    botId: string;
  }): Promise<boolean> {
    const count = await this.prisma.instanceGuild.count({
      where: query,
    });

    return count > 0;
  }
}
