import path from 'node:path';

// import {RewriteFrames} from '@sentry/integrations';
import * as Sentry from '@sentry/node';
import '@sentry/tracing';
import fastify from 'fastify';

import {Database} from '@suggester/database';
import {LocalizationService} from '@suggester/i18n';
import {Framework} from '@suggester/suggester';
import {parseConfigFile} from '@suggester/suggester';

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

  Sentry.init({
    dsn: config.sentry?.dsn,
    enabled: process.env.NODE_ENV === 'prod' && !!config.sentry?.dsn,

    // TODO
    // release: 'v0.0.5',

    // integrations: [
    //   new RewriteFrames({root: __dirname.slice(0, __dirname.indexOf('src'))}),
    // ],
  });

  const db = new Database(config.storage);
  await db.connect();

  const locales = new LocalizationService().loadAll();
  const fw = new Framework({db, locales, config});

  // TODO: switch from fastify to node:http?
  server.post('/interactions', fw.handleRequest.bind(fw));

  await fw.init();
  console.log(`Loaded ${fw.cmds.size} commands`);

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
    Sentry.captureException(err);
  } finally {
    db.prisma.$disconnect();
  }
};

start().catch(err => console.error('start() threw:', err));
