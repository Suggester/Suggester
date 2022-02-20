import {Instance, InstanceGuild, PrismaClient} from '@prisma/client';

import {Database} from 'suggester';

const BOT_ID = process.env.DEV_DISCORD_BOT_ID;
const DISCORD_TOKEN = process.env.DEV_DISCORD_TOKEN;
const PUBLIC_KEY = process.env.DEV_DISCORD_PUBLIC_KEY;
const GUILD_ID = process.env.DEV_DISCORD_GUILD_ID;

const main = async () => {
  if (!BOT_ID || !DISCORD_TOKEN || !PUBLIC_KEY || !GUILD_ID) {
    throw new Error(
      'Missing one or more required environemnt variables: `DEV_DISCORD_BOT_ID`, `DEV_DISCORD_TOKEN`, `DEV_DISCORD_PUBLIC_KEY`, `DEV_DISCORD_GUILD_ID`.'
    );
  }

  const prisma = new PrismaClient();
  const db = new Database(prisma);

  try {
    const instance: Omit<Instance, 'id' | 'updatedAt' | 'createdAt'> = {
      botId: BOT_ID,
      token: DISCORD_TOKEN,
      publicKey: PUBLIC_KEY,
      public: false,
    };

    const instanceGuild: Omit<InstanceGuild, 'id' | 'updatedAt' | 'createdAt'> =
      {
        botId: BOT_ID,
        guildId: GUILD_ID,
      };

    const createdInstance = await db.instances.upsert(
      BOT_ID,
      instance as Instance
    );
    console.log('Created instance:', createdInstance);

    const createdInstanceGuild = await db.instanceGuilds.upsert(
      {botId: BOT_ID, guildId: GUILD_ID},
      instanceGuild as InstanceGuild
    );
    console.log('Created instance guild:', createdInstanceGuild);
  } catch (err) {
    console.error('Failed to seed database:', err);
  } finally {
    prisma.$disconnect();
  }
};

main().catch(console.error);
