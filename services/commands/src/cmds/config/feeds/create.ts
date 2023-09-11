import {
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ChannelType,
  MessageFlags,
} from 'discord-api-types/v10';

import {
  FEED_NAME_MAX_LENGTH,
  Prisma,
  PrismaErrorCode,
  SuggestionFeedMode, // } from '@suggester/suggester';
} from '@suggester/database';
// import {Context, SubCommand} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {Context, SubCommand} from '@suggester/suggester';

const options = [
  {
    name: 'feed-channel',
    description: 'Which channel to use as the suggestion feed',
    type: ApplicationCommandOptionType.Channel,
    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
    required: true,
  },
  {
    name: 'name',
    description: 'The name of the feed (default: `Server Suggestions`)',
    type: ApplicationCommandOptionType.String,
    required: false,
    max_length: FEED_NAME_MAX_LENGTH,
  },
  {
    name: 'mode',
    description:
      'Should submitted suggestions be sent for manual review or be automatically approved?',
    type: ApplicationCommandOptionType.String,
    choices: [
      {name: 'Require Manual Review', value: 'Review'},
      {name: 'Automatically Approve', value: 'AutoApprove'},
    ],
  },
  {
    name: 'review-channel',
    description:
      'Which channel to use as the review channel (only used when mode:review)',
    type: ApplicationCommandOptionType.Channel,
    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
    required: false,
  },
  {
    name: 'log-channel',
    description: 'Which channel to use as the log channel',
    type: ApplicationCommandOptionType.Channel,
    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
    required: false,
  },
  {
    name: 'denied-channel',
    description:
      'Which channel to use as the denied suggestion channel (only used when mode:review)',
    type: ApplicationCommandOptionType.Channel,
    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
    required: false,
  },
] as const;

export class FeedsCreateCommand extends SubCommand {
  name: MessageNames = 'cmd-feeds-create.name';
  description: MessageNames = 'cmd-feeds-create.desc';
  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandInteraction, typeof options>
  ): Promise<void> {
    const l = ctx.getLocalizer();

    // TODO: strip special characters?
    const name = ctx.getOption('name')?.value || 'Server Suggestions';
    const mode = ctx.getOption('mode')?.value as SuggestionFeedMode | undefined;
    const feedChannelID = ctx.getOption('feed-channel').value;
    const reviewChannelID = ctx.getOption('review-channel')?.value;
    const logChannelID = ctx.getOption('log-channel')?.value;
    const deniedChannelID = ctx.getOption('denied-channel')?.value;

    await ctx.db.ensureConfig();

    const existingFeeds = await ctx.db.countFeeds();

    try {
      const feed = await ctx.db.createFeed({
        feedChannelID,
        mode,
        reviewChannelID,
        logChannelID,
        deniedChannelID,
        name,
        isDefault: existingFeeds === 0,
      });

      const m = l.guild('feed-create-success', {
        name: feed.name,
        channel: feed.feedChannelID,
        feedsEdit: ctx.framework.mentionCmd('feeds edit set'),
      });

      await ctx.send({
        content: m,
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === PrismaErrorCode.UniqueConstraintViolation) {
          const target = err.meta?.target as string[];

          if (target.includes('name')) {
            const msg = l.user('feed-create-fail-duplicate-name', {name});
            await ctx.send({
              content: msg,
              flags: MessageFlags.Ephemeral,
            });

            return;
          }

          if (target.includes('feed_channel_id')) {
            const msg = l.user('feed-create-fail-duplicate-channel');
            await ctx.send({
              content: msg,
              flags: MessageFlags.Ephemeral,
            });

            return;
          }
        }
      }

      console.error(err);

      const genericError = l.user('feed-create-fail-generic');
      await ctx.send({
        content: genericError,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
