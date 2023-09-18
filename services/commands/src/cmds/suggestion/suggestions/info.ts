import {
  APIApplicationCommandAutocompleteGuildInteraction,
  APIChatInputApplicationCommandGuildInteraction,
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionFlagsBits,
} from 'discord-api-types/v10';

import {MessageNames} from '@suggester/i18n';
import {Context, SubCommand, SuggestionEmbed} from '@suggester/suggester';

import {feedNameAutocomplete} from '../../../util/commandComponents';

const options = [
  {
    name: 'suggestion',
    description: 'The ID of the suggestion to view',
    type: ApplicationCommandOptionType.Integer,
    required: true,
  },
  feedNameAutocomplete,
] as const;

export class SuggestionsInfoCommand extends SubCommand {
  name: MessageNames = 'cmd-suggestions-info.name';
  description: MessageNames = 'cmd-suggestions-info.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ) {
    const l = ctx.getLocalizer();

    const {suggestion: sID, feed: feedName} = ctx.getFlatOptions();

    const feed = await ctx.db.getFeedByNameOrDefault(feedName);

    if (!feed) {
      const msg = l.user('unknown-feed', {
        cmd: ctx.framework.mentionCmd('feeds create'),
      });

      await ctx.send({
        content: msg,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const suggestion = await ctx.db.getFullSuggestionByPublicID(feed.id, sID);
    if (!suggestion) {
      await ctx.send({
        content: l.user('unknown-suggestion'),
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const opinion = await ctx.db.getOpinion(suggestion.id);

    // TODO: is there a better perm to use than Moderate Members
    const shouldRevealAnon = !(
      BigInt(ctx.interaction.member.permissions) &
      PermissionFlagsBits.ModerateMembers
    );

    const embed = SuggestionEmbed.build(
      l,
      {...feed, showVoteCount: true},
      {
        ...suggestion,
        isAnonymous: suggestion.isAnonymous ? shouldRevealAnon : false,
      },
      opinion,
      ctx.interaction.member.user,
      undefined,
      true
    );

    await ctx.send({
      embeds: embed,
      flags: MessageFlags.Ephemeral,
    });
  }

  async autocomplete(
    ctx: Context<
      APIApplicationCommandAutocompleteGuildInteraction,
      typeof options
    >
  ): Promise<void> {
    const opt = ctx.getFocusedOption();
    if (
      opt?.name === 'feed' &&
      opt?.type === ApplicationCommandOptionType.String
    ) {
      const suggestions = await ctx.db.autocompleteFeeds(opt.value);
      await ctx.sendAutocomplete(suggestions);
    }
  }
}
