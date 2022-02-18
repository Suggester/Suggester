import {Instance, PrismaClient} from '@prisma/client';

import {DatabaseStore} from '.';

export class InstanceStore extends DatabaseStore<Instance> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  async allInstances() {
    return this.prisma.instance.findMany();
  }

  async allInstanceIds() {
    return this.prisma.instance.findMany({
      select: {
        botId: true,
      },
    });
  }

  async allGuildsForInstance(botId: string) {
    return this.prisma.instance.findFirst({
      where: {
        botId,
      },
      include: {
        guilds: true,
      },
    });
  }

  async allInstancesWithGuilds() {
    return this.prisma.instance.findMany({
      include: {
        guilds: true,
      },
    });
  }

  async getInstanceWithGuild(botId: string, guildId: string) {
    return this.prisma.instance.findFirst({
      where: {
        botId,
      },
      include: {
        guilds: {
          where: {
            botId,
            guildId,
          },
        },
      },
    });
  }

  async create(instance: Omit<Instance, 'id'>) {
    return this.prisma.instance.create({data: instance});
  }

  async get(botId: string) {
    return this.prisma.instance.findFirst({
      where: {
        botId,
      },
    });
  }

  async update(botId: string, update: Partial<Omit<Instance, 'id'>>) {
    return this.prisma.instance.update({
      where: {
        botId,
      },
      data: update,
    });
  }

  async upsert(botId: string, row: Omit<Instance, 'id'>) {
    return this.prisma.instance.upsert({
      where: {
        botId,
      },
      update: row,
      create: row,
    });
  }

  async delete(botId: string) {
    return this.prisma.instance.delete({
      where: {
        botId,
      },
    });
  }
}
