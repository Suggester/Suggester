import {
  APIApplicationCommandAutocompleteGuildInteraction,
  APIChatInputApplicationCommandGuildInteraction,
  ApplicationCommandOptionType,
  MessageFlags,
} from 'discord-api-types/v10';

import {
  SuggestionApprovalStatus,
  SuggestionDisplayStatus,
} from '@suggester/database';
import {MessageNames} from '@suggester/i18n';
import {Context, SubCommand} from '@suggester/suggester';

import {feedNameAutocomplete} from '../../../util/commandComponents';

const options = [
  {
    name: 'suggestion',
    description: 'The ID of the suggestion to delete',
    type: ApplicationCommandOptionType.Integer,
    required: true,
  },
  {
    name: 'status',
    description: 'The new status',
    type: ApplicationCommandOptionType.String,
    required: true,
    choices: [
      {name: 'Default', value: SuggestionDisplayStatus.Default},
      {name: 'Considering', value: SuggestionDisplayStatus.Considering},
      {name: 'In Progress', value: SuggestionDisplayStatus.InProgress},
      {name: 'Implemented', value: SuggestionDisplayStatus.Implemented},
      {name: 'Not Happening', value: SuggestionDisplayStatus.NotHappening},
    ],
  },
  feedNameAutocomplete,
] as const;

export class ReviewMarkCommand extends SubCommand {
  name: MessageNames = 'cmd-review-mark.name';
  description: MessageNames = 'cmd-review-mark.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ) {
    const l = ctx.getLocalizer();

    const {suggestion: sID, status, feed: feedName} = ctx.getFlatOptions();
    const feed = await ctx.db.getFeedByNameOrDefault(feedName);

    if (!feed) {
      const msg = l.user('unknown-feed', {
        cmd: ctx.framework.mentionCmd('review mark'),
      });

      await ctx.send({
        content: msg,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const suggestion = ctx.db.getSuggestionByPublicID(feed.id, sID);
    if (!suggestion) {
      await ctx.send({
        content: l.user('unknown-suggestion'),
        flags: MessageFlags.Ephemeral,
      });

      return;
    }
  }

  async autocomplete(
    ctx: Context<
      APIApplicationCommandAutocompleteGuildInteraction,
      typeof options
    >
  ): Promise<void> {
    const opt = ctx.getFocusedOption();
    if (
      opt?.name === 'name' &&
      opt?.type === ApplicationCommandOptionType.String
    ) {
      const suggestions = await ctx.db.autocompleteFeeds(opt.value);
      await ctx.sendAutocomplete(suggestions);
    }
  }
}
