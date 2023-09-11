import {
  APIApplicationCommandAutocompleteGuildInteraction,
  APIChatInputApplicationCommandGuildInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
  ChannelType,
  ComponentType,
  MessageFlags,
} from 'discord-api-types/v10';

// import {Context, SubCommand} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {SuggestionFeed, PartialSuggestionFeed} from '@suggester/database';
import {
  Context,
  SubCommand,
} from '@suggester/suggester';

import {feedNameAutocomplete} from '../../../../util/commandComponents';

const parseEmoji = (s?: string): string | undefined => {
  if (!s) {
    return;
  }

  const RE = /<a?:\w{2,32}:(\d{16,20})>|(\p{Extended_Pictographic})/gu;
  const match = RE.exec(s.trim());
  return match?.[1] || match?.[2];
};

const parseHex = (s: string): number | undefined => {
  const RE = /^#?([a-fA-F0-9]{6})$/;

  const hex = RE.exec(s.trim())?.[1];

  if (!hex) {
    return;
  }

  return parseInt(hex, 16);
};

const options = [
  feedNameAutocomplete,

  // TODO: cooldown
  // TODO: trello/3p

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

  // roles
  {
    name: 'approved-reward-role',
    description:
      'A role to be given to a user when their suggestion is approved',
    type: ApplicationCommandOptionType.Role,
  },
  {
    name: 'implemented-reward-role',
    description:
      'A role to be given to a user when their suggestion is marked as implemented',
    type: ApplicationCommandOptionType.Role,
  },
  {
    name: 'review-ping-role',
    description:
      'A role to be pinged when a new suggestion is added to the review queue',
    type: ApplicationCommandOptionType.Role,
  },
  {
    name: 'new-suggestion-ping-role',
    description:
      'A role to be given to a user when their suggestion is marked as implemented',
    type: ApplicationCommandOptionType.Role,
  },

  // color change
  {
    name: 'enable-color-change',
    description:
      'Change the color of a suggestion when it reaches a certain number of upvotes',
    type: ApplicationCommandOptionType.Boolean,
  },
  {
    name: 'color-change-threshold',
    description:
      'The number of upvotes required to change the color of a suggestion',
    type: ApplicationCommandOptionType.Integer,
    min_value: 1,
  },
  {
    name: 'color-change-color',
    description: 'What color (hex code) to change suggestions to',
    type: ApplicationCommandOptionType.String,
    min_length: 6,
    max_length: 7,
  },

  // notifications
  {
    name: 'auto-follow-on-interact',
    description:
      'Should members automatically follow suggestions they interact with?',
    type: ApplicationCommandOptionType.Boolean,
  },
  {
    name: 'auto-follow-own-suggestions',
    description:
      'Should members automatically subscribe to notifications for their own suggestions?',
    type: ApplicationCommandOptionType.Boolean,
  },

  // votes/voting
  {
    name: 'allow-voting-on-own-suggestion',
    description: 'Should members be able to vote on their own suggestion?',
    type: ApplicationCommandOptionType.Boolean,
  },
  {
    name: 'show-vote-count',
    description: 'Should the vote count be shown on the suggestion post?',
    type: ApplicationCommandOptionType.Boolean,
  },

  // other
  {
    name: 'allow-anonymous-suggestions',
    description:
      'Should members be able to submit suggestions anonymously (moderators can still see the author)?',
    type: ApplicationCommandOptionType.Boolean,
  },
  {
    name: 'suggestion-feed-cap',
    description:
      'The maximum number of approved suggestions there can be at any given time',
    type: ApplicationCommandOptionType.Integer,
    min_value: 1,
  },
] as const;

export class FeedsEditSetCommand extends SubCommand {
  name: MessageNames = 'cmd-feeds-edit-set.name';
  description: MessageNames = 'cmd-feeds-edit-set.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ): Promise<void> {
    const l = ctx.getLocalizer();
    const feedName = ctx.getOption('feed')?.value;

    await ctx.db.ensureConfig();
    const feed = await ctx.db.getFeedByNameOrDefault(feedName);

    if (!feed) {
      const mention = ctx.framework.mentionCmd('feeds create');
      const m = l.user('unknown-feed', {
        cmd: mention,
      });

      await ctx.send({
        content: m,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const opts = ctx.getFlatOptions();

    if (Object.keys(opts) === ['feed']) {
      const m = l.user('feeds-edit-set-no-options-provided');
      await ctx.send({
        content: m,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    type OptionKeys = Exclude<keyof typeof opts, 'feed'>;
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

        approvedRewardRole: 'approvedRole',
        implementedRewardRole: 'implementedRole',
        reviewPingRole: 'reviewPingRole',
        newSuggestionPingRole: 'feedPingRole',

        enableColorChange: 'colorChangeEnabled',
        colorChangeThreshold: 'colorChangeThreshold',
        colorChangeColor: 'colorChangeColor',

        autoFollowOnInteract: 'autoSubscribe',
        autoFollowOwnSuggestions: 'notifyAuthor',

        allowVotingOnOwnSuggestion: 'allowSelfVote',
        showVoteCount: 'showVoteCount',
        suggestionFeedCap: 'suggestionCap',
        allowAnonymousSuggestions: 'allowAnonymous',
      };

      const newKey = MAP[key as OptionKeys];
      if (!newKey) {
        return a;
      }

      // @ts-expect-error this whole function is a type mess
      a[newKey] = value;

      return a;
    }, {} as Partial<PartialSuggestionFeed>);

    if (mappedOpts.isDefault) {
      await ctx.db.db.prisma.suggestionFeed.updateMany({
        where: {
          guildID: ctx.interaction.guild_id,
        },
        data: {
          isDefault: false,
        },
      });
    }

    for (const emoji of ['upvoteEmoji', 'midEmoji', 'downvoteEmoji'] as const) {
      if (!(emoji in mappedOpts)) {
        continue;
      }

      const parsed = parseEmoji(mappedOpts[emoji]!);

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

    if ('colorChangeColor' in mappedOpts) {
      const colorOpt = opts.colorChangeColor!;
      const parsedColor = parseHex(colorOpt);

      if (parsedColor === undefined) {
        const m = l.user('feeds-edit-set-invalid-color');

        await ctx.send({
          content: m,
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      mappedOpts.colorChangeColor = parsedColor;
    }

    await ctx.db.updateFeed(feed.id, mappedOpts);

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
    ctx: Context<
      APIApplicationCommandAutocompleteGuildInteraction,
      typeof options
    >
  ): Promise<void> {
    const focused = ctx.getFocusedOption();

    if (
      focused?.name === 'feed' &&
      focused.type === ApplicationCommandOptionType.String
    ) {
      const suggestions = await ctx.db.autocompleteFeeds(focused.value);

      await ctx.sendAutocomplete(suggestions);
    }
  }
}
