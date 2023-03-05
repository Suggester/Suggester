import {
  APIApplicationCommandAutocompleteInteraction,
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
  ChannelType,
  ComponentType,
  MessageFlags,
} from 'discord-api-types/v10';

import {SuggestionFeed} from '@suggester/database';
import {PartialSuggestionFeed} from '@suggester/database/build/suggestionFeed';
import {Context, SubCommand} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

import {feedNameAutocomplete} from '../../../../util/commandComponents';

const parseEmoji = (s?: string): string | undefined => {
  if (!s) {
    return;
  }

  const RE = /<a?:\w{2,32}:(\d{16,20})>|(\p{Extended_Pictographic})/gu;

  return RE.exec(s.trim())?.[1];
};

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
  // {
  //   name: 'implicit-suggest',
  //   description:
  //     'Automatically treat messages posted in the feed channel as if they had been `/suggest`ed',
  //   type: ApplicationCommandOptionType.Boolean,
  // },

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

    const opts = ctx.getFlatOptions();

    if (Object.keys(opts) === ['name']) {
      const m = l.user('feeds-edit-set-no-options-provided');
      await ctx.send({
        content: m,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    type OptionKeys = Exclude<keyof typeof opts, 'name'>;
    const mappedOpts: Partial<PartialSuggestionFeed> = Object.entries(
      opts
    ).reduce((a, [key, value]) => {
      const MAP: {
        [key in OptionKeys]: keyof SuggestionFeed;
      } = {
        mode: 'mode',
        default: 'isDefault',
        reviewChannel: 'reviewChannelID',
        logChannel: 'logChannelID',
        deniedChannel: 'deniedChannelID',
        implementedChannel: 'implementedChannelID',
        upvoteEmoji: 'upvoteEmoji',
        midEmoji: 'midEmoji',
        downvoteEmoji: 'downvoteEmoji',
      };

      const newKey = MAP[key as OptionKeys];
      if (!newKey) {
        return a;
      }

      // @ts-expect-error this whole function is a type mess
      a[newKey] = value;

      return a;
    }, {} as Partial<PartialSuggestionFeed>);

    for (const emoji of ['upvoteEmoji', 'midEmoji', 'downvoteEmoji'] as const) {
      if (!(emoji in mappedOpts)) {
        continue;
      }

      const parsed = parseEmoji(mappedOpts[emoji]);

      if (!parsed) {
        const m = l.user('feeds-edit-set-invalid-emoji', {
          opt: {
            upvoteEmoji: 'upvote-emoji',
            midEmoji: 'mid-emoji',
            downvoteEmoji: 'downvote-emoji',
          }[emoji]!,
        });

        await ctx.send({
          content: m,
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      mappedOpts[emoji] = parsed;
    }

    await ctx.db.suggestionFeeds.update(feed.id, mappedOpts);

    const m = l.guild('feeds-edit-set-success');
    await ctx.send({
      content: m,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Primary,
              label: 'View Config',
              custom_id: `feeds-get:overview:${feed.id}:es`,
            },
          ],
        },
      ],
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
