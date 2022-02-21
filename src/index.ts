import {PrismaClient} from '@prisma/client';
import {fastify} from 'fastify';

import {Database, Framework, LocalizationService} from 'suggester';

const server = fastify({
  logger: true,
});

const start = async () => {
  const prisma = new PrismaClient();
  const db = new Database(prisma);
  const locales = new LocalizationService().loadAll();
  const fw = new Framework(db, locales);

  server.post('/interactions/:id(^\\d{16,20}$)', fw.handleRequest.bind(fw));

  try {
    await server.listen(
      process.env.PORT || 3000,
      process.env.ADDR || '127.0.0.1'
    );
    const addr = server.server.address();
    console.log(
      'Server listening on',
      typeof addr === 'string' ? addr : `${addr?.address}:${addr?.port}`
    );
  } catch (err) {
    console.error('Failed to bind to port:', err);
  } finally {
    prisma.$disconnect();
  }
};

start().catch(console.error);
