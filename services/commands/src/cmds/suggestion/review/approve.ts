import {
  APIApplicationCommandAutocompleteGuildInteraction,
  APIChatInputApplicationCommandGuildInteraction,
  APIGuildInteraction,
  APIMessageComponentGuildInteraction,
  APIUser,
  ApplicationCommandOptionType,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  RESTPatchAPIChannelMessageJSONBody,
  Routes,
} from 'discord-api-types/v10';

import {
  Suggestion,
  SuggestionApprovalStatus,
  SuggestionFeed,
} from '@suggester/database';
import {Context, SubCommand} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {ApprovedSuggestionReviewQueueEmbed} from '@suggester/util';

import {feedNameAutocomplete} from '../../../util/commandComponents';
import {sendFeedMessage} from '../suggest';

const doApprove = async <T extends APIGuildInteraction>(
  ctx: Context<T>,
  feed: SuggestionFeed,
  suggestion: Suggestion | null
) => {
  const l = ctx.getLocalizer();

  if (!suggestion) {
    await ctx.send({
      content: l.user('unknown-suggestion'),
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  if (suggestion.approvalStatus !== SuggestionApprovalStatus.InQueue) {
    await ctx.send({
      content: l.user('not-in-queue-error', {
        status: suggestion.approvalStatus,
      }),
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  const feedMsg = await sendFeedMessage(ctx, suggestion, feed, false);
  await ctx.db.updateSuggestion(suggestion.id, {
    feedMessageID: feedMsg.id,
    approvalStatus: SuggestionApprovalStatus.Approved,
  });

  await ctx.send({
    content: l.guild('review-approve-success', {
      id: suggestion.publicID,
    }),
  });

  const author = (await ctx.framework.rest.get(
    Routes.user(suggestion.authorID)
  )) as APIUser;

  const newReviewEmbed = new ApprovedSuggestionReviewQueueEmbed(
    l,
    suggestion,
    author,
    ctx.interaction.member.user
  );

  await Promise.all(
    suggestion.approvalQueueMessages.map(m => {
      return ctx.framework.rest.patch(
        Routes.channelMessage(feed.reviewChannelID!, m),
        {
          body: {
            embeds: [newReviewEmbed],
            components: [
              {
                type: ComponentType.ActionRow,
                components: [
                  {
                    type: ComponentType.Button,
                    style: ButtonStyle.Link,
                    label: l.guild('suggest-success.link-button-label'),
                    url: `https://discord.com/channels/${suggestion.guildID}/${suggestion.feedChannelID}/${suggestion.feedMessageID}`,
                  },
                ],
              },
            ],
          } as RESTPatchAPIChannelMessageJSONBody,
        }
      );
    })
  );

  // TODO: dispatch notification
};

const options = [
  {
    name: 'suggestion',
    description: 'The ID of the suggestion to approve',
    type: ApplicationCommandOptionType.Integer,
    required: true,
  },
  feedNameAutocomplete,
] as const;

export class ReviewApproveSubCommand extends SubCommand {
  name: MessageNames = 'cmd-review-approve.name';
  description: MessageNames = 'cmd-review-approve.desc';

  options = options;

  buttonIDs = ['review:approve:'];

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ) {
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

    const selectedSuggestion = await ctx.db.getSuggestionByPublicID(
      feed.id,
      ctx.getOption('suggestion').value
    );

    await doApprove(ctx, feed, selectedSuggestion);
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
    } else if (
      opt?.name === 'suggestion' &&
      opt.type === ApplicationCommandOptionType.Number
    ) {
      // TODO: use search engine
    }
  }

  async button(ctx: Context<APIMessageComponentGuildInteraction>) {
    const [, , _id] = ctx.interaction.data.custom_id.split(':');
    const id = parseInt(_id);
    if (isNaN(id)) {
      return;
    }

    const suggestionAndFeed = await ctx.db.db.prisma.suggestion.findFirst({
      where: {id},
      include: {
        feed: true,
      },
    });

    if (!suggestionAndFeed) {
      return;
    }

    await doApprove(ctx, suggestionAndFeed.feed, suggestionAndFeed);
  }
}
