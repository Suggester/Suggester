import {
  APIChatInputApplicationCommandGuildInteraction,
  APIGuildInteraction,
  APIMessageComponentGuildInteraction,
  ApplicationCommandOptionType,
  MessageFlags,
  RESTPostAPIChannelMessageJSONBody,
  Routes,
} from 'discord-api-types/v10';

import {SuggestionFeed, SuggestionVoteKind} from '@suggester/database';
import {Command, Context, SubCommand} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {emoji} from '@suggester/util';

import {feedNameAutocomplete} from '../../util/commandComponents';
import {FullSuggestion, createFeedButtons} from './suggest';

const updateFeedMessage = async (
  ctx: Context<APIGuildInteraction>,
  suggestion: FullSuggestion,
  feed: SuggestionFeed,
  feedChannelID?: string
) => {
  const votes = await ctx.db.getOpinion(suggestion.id);
  const feedMsg: RESTPostAPIChannelMessageJSONBody = {
    components: createFeedButtons(
      feed,
      votes,
      suggestion.id,
      suggestion.attachments.length
    ),
  };

  if (feed.showVoteCount) {
    if (feedChannelID) {
      // command
      ctx.framework.rest.patch(
        Routes.channelMessage(feedChannelID, suggestion.feedMessageID!),
        {
          body: feedMsg,
        }
      );
    } else {
      // button -- updating this way is faster than PATCHing the message
      await ctx.update(feedMsg);
      return;
    }
  }
};

const doAction = async (
  ctx: Context<APIGuildInteraction>,
  kind: SuggestionVoteKind,
  id: number,
  feedChannelID?: string
) => {
  const l = ctx.getLocalizer();
  const lc = kind.toLowerCase() as Lowercase<SuggestionVoteKind>;

  const suggestionAndFeed = await ctx.db.db.prisma.suggestion.findFirst({
    where: feedChannelID
      ? {
          publicID: id,
          guildID: ctx.interaction.guild_id,
          feedChannelID,
        }
      : {id},
    include: {
      comments: true,
      attachments: true,
      votes: {
        where: {
          userID: ctx.interaction.member.user.id,
          suggestion: feedChannelID
            ? {
                feedChannelID,
                publicID: id,
                guildID: ctx.interaction.guild_id,
              }
            : {id},
        },
      },
      feed: true,
    },
  });

  if (!suggestionAndFeed || !suggestionAndFeed.feed) {
    await ctx.send({
      content: l.user('vote-error-no-feed'),
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  let feedEmoji = suggestionAndFeed.feed[(lc + 'Emoji') as `${typeof lc}Emoji`];
  // TODO: when a mode is disabled, should all existing votes of that kind be deleted?
  if (!feedEmoji) {
    // TODO: edit the original message to remove the button?
    await ctx.send({
      content: l.user('vote-error-type-disabled'),
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  feedEmoji = emoji(feedEmoji);
  console.log(feedEmoji, ctx.interaction.app_permissions);

  if (
    ctx.interaction.member.user.id === suggestionAndFeed.authorID &&
    !suggestionAndFeed.feed.allowSelfVote
  ) {
    await ctx.send({
      content: l.user('vote-error-no-self-vote'),
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  const previousVote = suggestionAndFeed.votes[0];
  if (previousVote) {
    if (previousVote.kind === kind) {
      await ctx.db.deleteVote(previousVote.id);

      await updateFeedMessage(
        ctx,
        suggestionAndFeed,
        suggestionAndFeed.feed,
        feedChannelID
      );

      if (feedChannelID || !suggestionAndFeed.feed.showVoteCount) {
        await ctx.send({
          content: l.user('vote-remove-success', {kind: feedEmoji}),
          flags: MessageFlags.Ephemeral,
        });
      }

      return;
    }

    await ctx.db.updateVoteKind(kind, previousVote.id);
  } else {
    await ctx.db.createVote(kind, suggestionAndFeed.id);
  }

  await updateFeedMessage(
    ctx,
    suggestionAndFeed,
    suggestionAndFeed.feed,
    feedChannelID
  );

  if (feedChannelID || !suggestionAndFeed.feed.showVoteCount) {
    await ctx.send({
      content: l.user('vote-success', {
        kind: feedEmoji,
      }),
      flags: MessageFlags.Ephemeral,
    });
  }
};

const subCmds: SubCommand[] = (
  [
    SuggestionVoteKind.Upvote,
    SuggestionVoteKind.Mid,
    SuggestionVoteKind.Downvote,
  ] as const
).map(kind => {
  const lc = kind.toLowerCase() as Lowercase<typeof kind>;
  const options = [
    // TODO: autocomplete this
    {
      name: 'suggestion',
      description: `The ID of the suggestion to ${lc}`,
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
    feedNameAutocomplete,
  ] as const;

  class S extends SubCommand {
    name: MessageNames = `cmd-vote-${lc}.name`;
    description: MessageNames = `cmd-vote-${lc}.desc`;

    options = options;

    buttonIDs = [`${lc}:`];

    async command(
      ctx: Context<
        APIChatInputApplicationCommandGuildInteraction,
        typeof options
      >
    ) {
      await ctx.db.ensureConfig();

      const l = ctx.getLocalizer();

      const feedName = ctx.getOption('feed')?.value;
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

      const suggestionPublicID = ctx.getOption('suggestion').value;
      await doAction(ctx, kind, suggestionPublicID, feed.feedChannelID);
    }

    async button(ctx: Context<APIMessageComponentGuildInteraction>) {
      const [, _id] = ctx.interaction.data.custom_id.split(':');
      const id = parseInt(_id);
      if (isNaN(id)) {
        return;
      }

      await doAction(ctx, kind, id);
    }
  }

  return new S();
});

export class VoteCommand extends Command {
  name: MessageNames = 'cmd-vote.name';
  description: MessageNames = 'cmd-vote.desc';
  subCommands = [...subCmds];
}
