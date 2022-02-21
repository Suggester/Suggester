import {PrismaClient} from '@prisma/client';
import {InteractionType} from 'discord-api-types/v9';
import {fastify} from 'fastify';
import {Command} from 'lib/framework/command';

import {
  CommandModule,
  Database,
  Framework,
  LocalizationService,
} from 'suggester';

import {MiscModule} from './cmds/misc';

const server = fastify({
  logger: true,
});

const mods: CommandModule[] = [new MiscModule()];

const cmds = new Map<string, Command>();
const modules = new Map<string, CommandModule>();

for (const mod of mods) {
  modules.set(mod.name, mod);

  for (const cmd of mod.commands) {
    cmds.set(cmd.name, cmd);
  }
}

console.log(`Loaded ${modules.size} modules and ${cmds.size} commands`);

const start = async () => {
  const prisma = new PrismaClient();
  const db = new Database(prisma);
  const locales = new LocalizationService().loadAll();
  const fw = new Framework(db, locales, cmds);

  server.post('/interactions/:id(^\\d{16,20}$)', fw.handleRequest.bind(fw));

  fw.on(InteractionType.ApplicationCommand, async ctx => {
    const cmd = fw.routeCommand(ctx.interaction);
    if (!cmd) {
      return;
    }

    try {
      await cmd.run(ctx);
    } catch (err) {
      console.error(`Error while running command: ${cmd.name}:`, err);
    }
  });

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
