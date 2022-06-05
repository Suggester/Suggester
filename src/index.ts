import {PrismaClient} from '@prisma/client';
import {fastify} from 'fastify';
import path from 'path';
import {inspect} from 'util';

import {
  Database,
  Framework,
  LocalizationService,
  parseConfigFile,
} from 'suggester';

const server = fastify({
  logger: false,
});

const start = async () => {
  const _config = parseConfigFile(path.join(process.cwd(), 'config.toml'));
  if (!_config.success) {
    const formattedErrors = _config.error.format();
    console.error(inspect(formattedErrors, {depth: null}));

    throw new Error('One or more invalid items in configuration file');
  }

  const config = _config.data;

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: config.storage.postgres_url,
      },
    },
  });

  const db = new Database(prisma);
  const locales = new LocalizationService().loadAll();
  const fw = new Framework(db, locales, config);

  server.post('/interactions/:id(^\\d{16,20}$)', fw.handleRequest.bind(fw));

  await fw.loadModules();
  console.log(`Loaded ${fw.modules.size} modules and ${fw.cmds.size} commands`);

  try {
    await server.listen(config.web_server.port, config.web_server.host);
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
