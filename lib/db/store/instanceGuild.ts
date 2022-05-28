import {InstanceGuild, PrismaClient} from '@prisma/client';

import {DatabaseStore} from '.';

export class InstanceGuildStore extends DatabaseStore<InstanceGuild> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  async create(row: Omit<InstanceGuild, 'id' | 'updatedAt' | 'createdAt'>) {
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
    query: {guildId: string; applicationId: string},
    update: Omit<InstanceGuild, 'id' | 'updatedAt' | 'createdAt'>
  ) {
    return this.prisma.instanceGuild.update({
      where: {applicationId_guildId: query},
      data: update,
    });
  }

  async upsert(
    query: {guildId: string; applicationId: string},
    row: Omit<InstanceGuild, 'id' | 'updatedAt' | 'createdAt'>
  ) {
    return this.prisma.instanceGuild.upsert({
      where: {
        applicationId_guildId: query,
      },
      update: row,
      create: row,
    });
  }

  async delete(query: {guildId: string; applicationId: string}) {
    return this.prisma.instanceGuild.delete({
      where: {applicationId_guildId: query},
    });
  }

  async checkInstanceUsability(query: {
    guildId: string;
    applicationId: string;
  }): Promise<boolean> {
    const count = await this.prisma.instanceGuild.count({
      where: query,
    });

    return count > 0;

    // const instanceCount = await this.prisma.instance.findFirst({
    //   where: query,
    //   select: {
    //     instanceGuilds: {
    //       select: {
    //         guildId: true,
    //       },
    //     },
    //     _count: {
    //       select: {
    //         instanceGuilds: true,
    //       },
    //     },
    //   },
    // });

    // console.log(instanceCount);

    // return true;
  }
}
