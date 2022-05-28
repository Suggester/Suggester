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

import {Database} from 'suggester';

const BOT_ID = process.env.DEV_DISCORD_BOT_ID;
const DISCORD_TOKEN = process.env.DEV_DISCORD_TOKEN;
const PUBLIC_KEY = process.env.DEV_DISCORD_PUBLIC_KEY;
const GUILD_ID = process.env.DEV_DISCORD_GUILD_ID;
const CHANNEL_ID = process.env.DEV_DISCORD_CHANNEL_ID;
const USER_ID = process.env.DEV_DISCORD_USER_ID;

const main = async () => {
  if (
    !BOT_ID ||
    !DISCORD_TOKEN ||
    !PUBLIC_KEY ||
    !GUILD_ID ||
    !CHANNEL_ID ||
    !USER_ID
  ) {
    throw new Error(
      'Missing one or more required environemnt variables: `DEV_DISCORD_BOT_ID`, `DEV_DISCORD_TOKEN`, `DEV_DISCORD_PUBLIC_KEY`, `DEV_DISCORD_GUILD_ID`, `DEV_DISCORD_CHANNEL_ID`, `USER_ID`.'
    );
  }

  const prisma = new PrismaClient();
  const db = new Database(prisma);

  try {
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
      'id' | 'updatedAt' | 'createdAt'
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

    const suggestionConfig: Omit<Suggestion, 'id' | 'updatedAt' | 'createdAt'> =
      {
        body: 'owo',
        suggestionId: 0,
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
  } catch (err) {
    console.error('failed to seed the database:', err);
  } finally {
    await prisma.$disconnect();
  }

  // try {
  //   const instance: Omit<Instance, 'id' | 'updatedAt' | 'createdAt'> = {
  //     botId: BOT_ID,
  //     token: DISCORD_TOKEN,
  //     publicKey: PUBLIC_KEY,
  //     public: false,
  //   };

  //   const instanceGuild: Omit<InstanceGuild, 'id' | 'updatedAt' | 'createdAt'> =
  //     {
  //       botId: BOT_ID,
  //       guildId: GUILD_ID,
  //     };

  //   const guildConfig: Omit<GuildConfig, 'updatedAt' | 'createdAt'> = {
  //     id: GUILD_ID,
  //     adminRoles: [],
  //     archiveChannel: null,
  //     deniedChannel: null,
  //     flags: [],
  //     locale: 'en-US',
  //     logChannel: null,
  //     logHookId: null,
  //     logHookToken: null,
  //     reviewChannel: null,
  //     staffRoles: [],
  //   };

  //   const suggestionFeed: Omit<SuggestionFeed, 'updatedAt' | 'createdAt'> = {
  //     id: CHANNEL_ID,
  //     guildId: GUILD_ID,
  //     emojiUp: '👍',
  //     emojiMid: '🤷',
  //     emojiDown: '👎',
  //     mode: SuggestionFeedMode.AUTOAPPROVE,
  //     commentTimestamps: true,
  //     inChannelSuggest: false,
  //   };

  //   const createdInstance = await db.instances.upsert(
  //     BOT_ID,
  //     instance as Instance
  //   );
  //   console.log('Created instance:', createdInstance);

  //   const createdInstanceGuild = await db.instanceGuilds.upsert(
  //     {botId: BOT_ID, guildId: GUILD_ID},
  //     instanceGuild as InstanceGuild
  //   );
  //   console.log('Created instance guild:', createdInstanceGuild);

  //   // TODO: create stores for these
  //   const createdGuildConfig = await db.prisma.guildConfig.upsert({
  //     create: guildConfig,
  //     update: guildConfig,
  //     where: {
  //       id: guildConfig.id,
  //     },
  //   });
  //   console.log('Created guild config:', createdGuildConfig);

  //   const createdSuggestionFeed = await db.prisma.suggestionFeed.upsert({
  //     create: suggestionFeed,
  //     update: suggestionFeed,
  //     where: {
  //       id: suggestionFeed.id,
  //     },
  //   });
  //   console.log('Created suggestion feed:', createdSuggestionFeed);
  // } catch (err) {
  //   console.error('Failed to seed database:', err);
  // } finally {
  // prisma.$disconnect();
  // }
};

main().catch(console.error);
