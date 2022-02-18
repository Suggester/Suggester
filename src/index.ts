import {PrismaClient} from '@prisma/client';
import {fastify} from 'fastify';

import {Database} from 'suggester';

import {registerInteractionRoutes} from './routes/interactions';

const server = fastify();

const start = async () => {
  const prisma = new PrismaClient();
  const db = new Database(prisma);

  server.register(registerInteractionRoutes(db), {prefix: '/interactions'});

  try {
    await server.listen(process.env.PORT || 3000, '127.0.0.1');
    const addr = server.server.address();
    console.log(
      'Server listening on',
      typeof addr === 'string' ? addr : `${addr?.address}:${addr?.port}`
    );

    console.log(server.printRoutes());
  } catch (err) {
    console.error('Failed to bind to port:', err);
  } finally {
    prisma.$disconnect();
  }
};

start().catch(console.error);
