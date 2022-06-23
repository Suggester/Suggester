import {
  GuildConfig,
  Instance,
  InstanceGuild,
  PrismaClient,
  Suggestion,
  SuggestionApprovalStatus,
  SuggestionDisplayStatus,
  SuggestionFeed,
  SuggestionFeedMode,
} from '@prisma/client';
import {readFile} from 'fs/promises';
import path from 'path';
import {inspect} from 'util';

import {Database, parseConfigFile} from 'suggester';

const config = parseConfigFile(path.join(process.cwd(), 'config.toml'));
if (!config.success) {
  const formattedErrors = config.error.format();
  console.error(inspect(formattedErrors, {depth: null}));

  throw new Error('One or more invalid items in configuration file');
}

const main = async () => {
  if (!config.data.dev) {
    throw new Error('no dev instances in config file');
  }

  const prisma = new PrismaClient({
    log: ['query'],
  });
  const db = new Database(prisma);

  const initFile = await readFile(
    path.join(process.cwd(), 'prisma', 'init.sql'),
    'utf8'
  );

  const rawQueries = initFile.split('--').map(q => prisma.$executeRawUnsafe(q));
  await prisma.$transaction(rawQueries);

  try {
    for (const devInstance of config.data.dev) {
      const BOT_ID = devInstance.application_id;
      const DISCORD_TOKEN = devInstance.token;
      const PUBLIC_KEY = devInstance.public_key;
      const GUILD_ID = devInstance.guild_id;
      const CHANNEL_ID = devInstance.channel_id;
      const USER_ID = devInstance.user_id;

      const instanceConfig: Omit<Instance, 'id' | 'updatedAt' | 'createdAt'> = {
        applicationId: BOT_ID,
        token: DISCORD_TOKEN,
        publicKey: PUBLIC_KEY,
        expiresAt: null,
        isActive: true,
        isPublic: false,
      };
      const instance = await db.instances.upsert(BOT_ID, instanceConfig);
      console.log('Upserted Instance:', instance);

      const instanceGuildConfig: Omit<
        InstanceGuild,
        'id' | 'updatedAt' | 'createdAt'
      > = {
        applicationId: BOT_ID,
        guildId: GUILD_ID,
        accessGrantedBy: null,
      };
      const instanceGuild = await db.instanceGuilds.upsert(
        {guildId: GUILD_ID, applicationId: BOT_ID},
        instanceGuildConfig
      );
      console.log('Upserted InstanceGuild:', instanceGuild);

      const guildConfigConfig: Omit<
        GuildConfig,
        'id' | 'updatedAt' | 'createdAt'
      > = {
        applicationId: BOT_ID,
        guildId: GUILD_ID,
        adminRoles: [],
        flags: 0,
        locale: 'en-US',
        staffRoles: [],
      };
      const guildConfig = await db.guildConfigs.upsert(
        {
          guildId: GUILD_ID,
          applicationId: BOT_ID,
        },
        guildConfigConfig
      );
      console.log('Upserted GuildConfig:', guildConfig);

      const suggestionFeedConfig: Omit<
        SuggestionFeed,
        'id' | 'lastSuggestionId' | 'updatedAt' | 'createdAt'
      > = {
        applicationId: BOT_ID,
        guildId: GUILD_ID,
        channelId: CHANNEL_ID,
        mode: SuggestionFeedMode.AUTOAPPROVE,
        allowedRoles: [],
        approvedRole: null,
        archiveChannelId: null,
        blockedRoles: [],
        commandAliasName: null,
        deniedChannelId: null,
        description: null,
        downvoteEmoji: null,
        feedPingRole: null,
        implementedRole: null,
        logChannelId: null,
        logWebhookId: null,
        logWebhookToken: null,
        midEmoji: null,
        name: null,
        pingRole: null,
        reviewChannelId: null,
        showCommentTimestamps: true,
        submitCooldown: null,
        suggestionCap: null,
        upvoteEmoji: null,
        votingRoles: [],
      };
      const suggestionFeed = await db.suggestionFeeds.upsert(
        {
          guildId: GUILD_ID,
          channelId: CHANNEL_ID,
          applicationId: BOT_ID,
        },
        suggestionFeedConfig
      );
      console.log('Upserted SuggestionFeed:', suggestionFeed);

      const suggestionConfig: Omit<
        Suggestion,
        'id' | 'publicId' | 'updatedAt' | 'createdAt'
      > = {
        body: 'owo',
        applicationId: BOT_ID,
        guildId: GUILD_ID,
        feedChannelId: CHANNEL_ID,
        authorId: USER_ID,
        approvalStatus: SuggestionApprovalStatus.IN_QUEUE,
        displayStatus: SuggestionDisplayStatus.DEFAULT,
        feedMessageId: null,
        attachmentURL: null,
        denialReason: null,
        isAnonymous: false,
        lastEditedBy: null,
        pendingEditBody: null,
        pendingEditCreatedAt: null,
        trelloAttachmentId: null,
        trelloCard: null,
      };
      const suggestion = await prisma.suggestion.create({
        data: suggestionConfig,
      });
      console.log('Inserted Suggestion:', suggestion);
    }
  } catch (err) {
    console.error('failed to seed the database:', err);
  } finally {
    await prisma.$disconnect();
  }
};

main().catch(console.error);
