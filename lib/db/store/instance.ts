import {Instance, PrismaClient} from '@prisma/client';

import {DatabaseStore} from '.';

export class InstanceStore extends DatabaseStore<Instance> {
  constructor(private prisma: PrismaClient) {
    super();
  }

  async create(instance: Omit<Instance, 'id' | 'updatedAt' | 'createdAt'>) {
    return this.prisma.instance.create({data: instance});
  }

  async get(applicationId: string) {
    return this.prisma.instance.findFirst({
      where: {
        applicationId,
      },
    });
  }

  async update(
    applicationId: string,
    update: Partial<Omit<Instance, 'id' | 'updatedAt' | 'createdAt'>>
  ) {
    return this.prisma.instance.update({
      where: {
        applicationId,
      },
      data: update,
    });
  }

  async upsert(
    applicationId: string,
    row: Omit<Instance, 'id' | 'updatedAt' | 'createdAt'>
  ) {
    return this.prisma.instance.upsert({
      where: {
        applicationId,
      },
      update: row,
      create: row,
    });
  }

  async delete(applicationId: string) {
    return this.prisma.instance.delete({
      where: {
        applicationId,
      },
    });
  }
}
