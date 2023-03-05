import {ExecException, exec as _exec} from 'node:child_process';
import path from 'node:path';
import {promisify} from 'node:util';

import fastify from 'fastify';

import {Database} from '@suggester/database';
import {Framework} from '@suggester/framework';
import {LocalizationService} from '@suggester/i18n';
import {parseConfigFile} from '@suggester/util';

const exec = promisify(_exec);

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

  if (config.storage.auto_migrate) {
    const schemaPath = path.join(
      'services',
      'commands',
      'node_modules',
      '@suggester',
      'database',
      'prisma',
      'schema.prisma'
    );

    try {
      console.log('Running prisma migrations');
      await exec(`npx prisma migrate deploy --schema="${schemaPath}"`, {
        env: {
          ...process.env,
          DATABASE_URL: config.storage.postgres_url,
        },
      });
      console.log('Finished migrating');
    } catch (err) {
      const e = err as ExecException;

      console.error(
        `Prisma auto migration failed with code ${e.code}:`,
        // @ts-expect-error bad types
        e.stdout,
        // @ts-expect-error bad types
        e.stderr
      );

      throw err;
    }
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
