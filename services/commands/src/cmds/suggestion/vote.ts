import {
  APIButtonComponent,
  APIChatInputApplicationCommandGuildInteraction,
  APIGuildInteraction,
  APIMessageComponentGuildInteraction,
  ApplicationCommandOptionType,
  MessageFlags,
  RESTPostAPIChannelMessageJSONBody,
  Routes,
} from 'discord-api-types/v10';

import {SuggestionFeed, SuggestionVoteKind} from '@suggester/database';
import {MessageNames} from '@suggester/i18n';
import {Command, Context, SubCommand} from '@suggester/suggester';
import {emoji} from '@suggester/suggester';

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

  // for replacing buttons after showVoteCount is toggled. lol
  const btn = ctx.interaction.message?.components?.[0]
    ?.components?.[0] as APIButtonComponent;
  if (feed.showVoteCount || btn?.label?.match(/\d/)) {
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

      if (suggestionAndFeed.feed.logVotes) {
        ctx.log.voteRemoved({
          emoji: feedEmoji,
          suggestion: suggestionAndFeed,
          logChannel: suggestionAndFeed.feed.logChannelID,
          user: ctx.interaction.member.user,
        });
      }

      // TODO: why is this here??
      if (feedChannelID || !suggestionAndFeed.feed.showVoteCount) {
        await ctx.send({
          content: l.user('vote-remove-success', {kind: feedEmoji}),
          flags: MessageFlags.Ephemeral,
        });
      }

      return;
    }

    if (suggestionAndFeed.feed.logVotes) {
      const oldEmoji =
        suggestionAndFeed.feed[
          (previousVote.kind.toLowerCase() +
            'Emoji') as `${Lowercase<SuggestionVoteKind>}Emoji`
        ]!;
      ctx.log.voteChanged({
        old: emoji(oldEmoji),
        new: feedEmoji,
        suggestion: suggestionAndFeed,
        logChannel: suggestionAndFeed.feed.logChannelID,
        user: ctx.interaction.member.user,
      });
    }

    await ctx.db.updateVoteKind(kind, previousVote.id);
  } else {
    await ctx.db.createVote(kind, suggestionAndFeed.id);
    if (suggestionAndFeed.feed.logVotes) {
      ctx.log.voteAdded({
        emoji: feedEmoji,
        suggestion: suggestionAndFeed,
        logChannel: suggestionAndFeed.feed.logChannelID,
        user: ctx.interaction.member.user,
      });
    }
  }

  await updateFeedMessage(
    ctx,
    suggestionAndFeed,
    suggestionAndFeed.feed,
    feedChannelID
  );

  // TODO: this too????
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
          cmd: ctx.framework.mentionCmd('vote ' + lc),
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
