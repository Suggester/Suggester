import {Database} from 'suggester';
import Container from 'typedi';

const db = Container.get<Database>(Database);

const GUILD_ID = '579466138992508928';
const CHANNEL_ID = '897614701985419364';
const CHANNEL_ID_2 = '728067827898122253';
const USER_ID = '255834596766253057';

async function main() {
  await db.guildConfigs.add({id: GUILD_ID});

  const created1 = await db.feeds.add({
    id: CHANNEL_ID,
    guildId: GUILD_ID,
  });

  const created2 = await db.feeds.add({
    id: CHANNEL_ID_2,
    guildId: GUILD_ID,
  });

  await db.suggestions.add({
    guildId: GUILD_ID,
    feedId: created1.id,
    body: 'suggestion 1',
    authorId: USER_ID,
  });

  await db.suggestions.add({
    guildId: GUILD_ID,
    feedId: created1.id,
    body: 'suggestion 2',
    authorId: USER_ID,
  });

  await db.suggestions.add({
    guildId: GUILD_ID,
    feedId: created1.id,
    body: 'suggestion 3',
    authorId: USER_ID,
  });

  await db.suggestions.add({
    guildId: GUILD_ID,
    feedId: created2.id,
    body: 'suggestion 4',
    authorId: USER_ID,
  });

  await db.suggestions.add({
    guildId: GUILD_ID,
    feedId: created2.id,
    body: 'suggestion 5',
    authorId: USER_ID,
  });

  await db.suggestions.add({
    guildId: GUILD_ID,
    feedId: created2.id,
    body: 'suggestion 6',
    authorId: USER_ID,
  });

  const all = await Promise.all([
    await db.feeds.getAll(CHANNEL_ID),
    await db.feeds.getAll(CHANNEL_ID_2),
  ]);
  console.dir(all, {depth: null});

  await db.guildConfigs.delete(GUILD_ID);
}

main();
