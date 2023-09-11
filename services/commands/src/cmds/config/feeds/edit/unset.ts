import {
  APIApplicationCommandAutocompleteInteraction,
  APIChatInputApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord-api-types/v10';

// import {Context, SubCommand} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {Context, SubCommand} from '@suggester/suggester';

import {feedNameAutocomplete} from '../../../../util/commandComponents';

const options = [
  {
    ...feedNameAutocomplete,
    required: true,
  },
  {
    name: 'option',
    description: 'The option to unset for this feed',
    type: ApplicationCommandOptionType.String,
    required: true,
    choices: [
      {
        name: 'Review Channel',
        value: 'reviewChannelID',
      },
      {
        name: 'Log Channel',
        value: 'logChannelID',
      },
      {
        name: 'Denied Channel',
        value: 'deniedChannelID',
      },
      {
        name: 'Implemented Channel',
        value: 'implementedChannelID',
      },
      {
        name: 'Upvote Emoji',
        value: 'upvoteEmoji',
      },
      {
        name: 'Mid Emoji',
        value: 'midEmoji',
      },
      {
        name: 'Downvote Emoji',
        value: 'downvoteEmoji',
      },
      {
        name: 'Approved Suggestion Reward Role',
        value: 'approvedRole',
      },
      {
        name: 'Implemented Suggestion Reward Role',
        value: 'implementedRole',
      },
      {
        name: 'Review Ping Role',
        value: 'reviewPingRole',
      },
      {
        name: 'New Suggestion Ping Role',
        value: 'feedPingRole',
      },
      {
        name: 'Suggestion Feed Cap',
        value: 'suggestionCap',
      },
    ],
  },

  // name: 'mode',
  // name: 'default',
  //
  // name: 'enable-color-change',
  // name: 'color-change-threshold',
  // name: 'color-change-color',
  // name: 'auto-follow-on-interact',
  // name: 'auto-follow-own-suggestions',
  // name: 'allow-voting-on-own-suggestion',
  // name: 'show-vote-count',
  // name: 'allow-anonymous-suggestions',
] as const;

export class FeedsEditUnsetCommand extends SubCommand {
  name: MessageNames = 'cmd-feeds-edit-unset.name';
  description: MessageNames = 'cmd-feeds-edit-unset.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandInteraction, typeof options>
  ): Promise<void> {
    const l = ctx.getLocalizer();

    const name = ctx.getOption('feed')?.value;
    const feed = await ctx.db.getFeedByNameOrDefault(name);

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

    const defaultValues: Record<string, string | null> = {
      reviewChannelID: null,
      logChannelID: null,
      deniedChannelID: null,
      implementedChannelID: null,
      upvoteEmoji: null,
      midEmoji: null,
      downvoteEmoji: null,
      approvedRole: null,
      implementedRole: null,
      reviewPingRole: null,
      feedPingRole: null,
      suggestionCap: null,
    };

    const option = ctx.getOption('option').value;

    if (!(option in defaultValues)) {
      // TODO: error message
      return;
    }

    const newValue = defaultValues[option];
    const upd = {[option]: newValue};

    await ctx.db.updateFeed(feed.id, upd);

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
      focused?.name === 'feed' &&
      focused.type === ApplicationCommandOptionType.String
    ) {
      const suggestions = await ctx.db.autocompleteFeeds(focused.value);
      await ctx.sendAutocomplete(suggestions);
    }
  }
}
