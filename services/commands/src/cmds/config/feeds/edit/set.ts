import {
  APIApplicationCommandAutocompleteInteraction,
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ChannelType,
  MessageFlags,
} from 'discord-api-types/v10';

import {Context, SubCommand} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

import {feedNameAutocomplete} from '../../../../util/commandComponents';

const options = [
  feedNameAutocomplete,

  // TODO: add the rest of the options

  {
    name: 'mode',
    description:
      'Should submitted suggestions be sent for manual review or be automatically approved?',
    type: ApplicationCommandOptionType.String,
    choices: [
      {name: 'Require Manual Review', value: 'REVIEW'},
      {name: 'Automatically Approve', value: 'AUTOAPPROVE'},
    ],
  },

  {
    name: 'default',
    description: 'Make this feed the default feed',
    type: ApplicationCommandOptionType.Boolean,
  },
  {
    name: 'implicit-suggest',
    description:
      'Automatically treat messages posted in the feed channel as if they had been `/suggest`ed',
    type: ApplicationCommandOptionType.Boolean,
  },

  // channels
  {
    name: 'review-channel',
    description:
      'The channel to post review messages in when mode is set to "review"',
    type: ApplicationCommandOptionType.Channel,
    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
  },
  {
    name: 'log-channel',
    description: 'The channel to post suggestion logs in',
    type: ApplicationCommandOptionType.Channel,
    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
  },
  {
    name: 'denied-channel',
    description: 'The channel to move denied suggestions to',
    type: ApplicationCommandOptionType.Channel,
    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
  },
  {
    name: 'implemented-channel',
    description: 'The channel to move implemented suggestions to',
    type: ApplicationCommandOptionType.Channel,
    channel_types: [ChannelType.GuildText, ChannelType.GuildAnnouncement],
  },

  // emojis
  {
    name: 'upvote-emoji',
    description: 'Which emoji to use for the upvote button',
    type: ApplicationCommandOptionType.String,
    min_length: 1,
    max_length: 50, // TODO: what's the max length for an emoji?
  },
  {
    name: 'mid-emoji',
    description: 'Which emoji to use for the mid button',
    type: ApplicationCommandOptionType.String,
    min_length: 1,
    max_length: 50, // TODO: what's the max length for an emoji?
  },
  {
    name: 'downvote-emoji',
    description: 'Which emoji to use for the downvote button',
    type: ApplicationCommandOptionType.String,
    min_length: 1,
    max_length: 50, // TODO: what's the max length for an emoji?
  },
] as const;

export class FeedsEditSetCommand extends SubCommand {
  name: MessageNames = 'cmd-feeds-edit-set.name';
  description: MessageNames = 'cmd-feeds-edit-set.desc';

  buttonIDs = ['hi'];

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandInteraction, typeof options>
  ): Promise<void> {
    const l = ctx.getLocalizer();
    const feedName = ctx.getOption('name').value;

    const feed = await ctx.db.suggestionFeeds.getByName(
      ctx.interaction.guild_id!,
      feedName
    );

    if (!feed) {
      const mention = ctx.framework.mentionCmd('feeds create');
      const m = l.user('unknown-feed', {
        name: feedName,
        cmd: mention,
      });

      await ctx.send({
        content: m,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const opts = ctx.getOptions();

    console.log(opts);

    if (!opts.length) {
      const m = l.user('feeds-edit-set-no-options-provided');
      await ctx.send({
        content: m,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await ctx.send({
      content: '```json\n' + JSON.stringify(opts, null, 2) + '```',
    });
  }

  async autocomplete(
    ctx: Context<APIApplicationCommandAutocompleteInteraction, typeof options>
  ): Promise<void> {
    const focused = ctx.getFocusedOption();

    if (
      focused?.name === 'name' &&
      focused.type === ApplicationCommandOptionType.String
    ) {
      const suggestions = await ctx.db.suggestionFeeds.autocompleteName(
        ctx.interaction.guild_id!,
        focused.value
      );

      await ctx.sendAutocomplete(suggestions);
    }
  }
}
