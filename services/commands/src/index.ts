import path from 'node:path';

import fastify from 'fastify';

import {Database} from '@suggester/database';
import {Framework} from '@suggester/framework';
import {LocalizationService} from '@suggester/i18n';
import {parseConfigFile} from '@suggester/util';

const server = fastify({
  logger: false,
});

const start = async () => {
  const configPath = path.join(process.cwd(), 'config.toml');
  const config = parseConfigFile(configPath);

  if (!config) {
    console.error('Config is null.');
    return;
  }

  const db = new Database(config.storage.postgres_url);
  const locales = new LocalizationService().loadAll();
  const fw = new Framework({db, locales, config});

  // TODO: switch from fastify to node:http?
  server.post('/interactions', fw.handleRequest.bind(fw));

  await fw.loadModules();
  console.log(`Loaded ${fw.modules.size} modules and ${fw.cmds.size} commands`);

  try {
    await server.listen({
      port: config.commands.port,
      host: config.commands.host,
    });

    const addr = server.server.address();
    console.log(
      'Server listening on',
      typeof addr === 'string' ? addr : `${addr?.address}:${addr?.port}`
    );
  } catch (err) {
    console.error('Failed to bind to port:', err);
  } finally {
    db.prisma.$disconnect();
  }
};

start().catch(err => console.error('start() threw:', err));
