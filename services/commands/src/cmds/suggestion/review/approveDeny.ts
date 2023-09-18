import {
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
  Prisma,
  Suggestion,
  SuggestionApprovalStatus,
  SuggestionFeed,
} from '@suggester/database';
import {Localizer, MessageNames} from '@suggester/i18n';
import {
  BaseReviewQueueEmbed,
  Context,
  EmbedBuilder,
  Framework,
  SubCommand,
} from '@suggester/suggester';
import {ApprovedDeniedSuggestionReviewQueueEmbed} from '@suggester/suggester';

import {feedNameAutocomplete} from '../../../util/commandComponents';
import {FullSuggestion, sendFeedMessage} from '../suggest';
import {markSelectMenu} from './mark';

export const updateQueueMessages = async <Embed extends EmbedBuilder>(
  l: Localizer,
  rest: Framework['rest'],
  suggestion: Suggestion,
  feed: SuggestionFeed,
  embed: Embed,
  withComponents: boolean
) => {
  await Promise.all(
    suggestion.approvalQueueMessages.map(m => {
      return rest.patch(Routes.channelMessage(feed.reviewChannelID!, m), {
        body: {
          embeds: [embed],
          components: withComponents
            ? [
                {
                  type: ComponentType.ActionRow,
                  components: [markSelectMenu(l, feed, suggestion)],
                },
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
              ]
            : [],
        } as RESTPatchAPIChannelMessageJSONBody,
      });
    })
  );
};

const doAction = async <T extends APIGuildInteraction>(
  action: 'approve' | 'deny',
  ctx: Context<T>,
  feed: SuggestionFeed,
  suggestion: FullSuggestion | null,
  reason?: string
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

  const newStatus = {
    approve: SuggestionApprovalStatus.Approved,
    deny: SuggestionApprovalStatus.Denied,
  }[action];

  const updateSuggestion: Prisma.SuggestionUpdateArgs['data'] = {
    approvalStatus: newStatus,
    denialReason: reason,
  };

  if (action === 'approve') {
    const feedMsg = await sendFeedMessage(ctx, suggestion, feed, false);
    updateSuggestion.feedMessageID = feedMsg.id;
  }

  await ctx.db.updateSuggestion(suggestion.id, updateSuggestion);

  const logFn =
    action === 'approve'
      ? ctx.log.suggestionApproved
      : ctx.log.suggestionDenied;
  logFn({
    suggestion,
    user: ctx.interaction.member.user,
    logChannel: feed.logChannelID,
  });

  await ctx.send({
    content: l.guild(`review-${action}-success`, {
      id: suggestion.publicID,
    }),
  });

  const author = (await ctx.framework.rest.get(
    Routes.user(suggestion.authorID)
  )) as APIUser;

  suggestion.approvalStatus = newStatus;
  suggestion.denialReason = reason || null;
  suggestion.feedChannelID = updateSuggestion.feedChannelID as string;

  const newReviewEmbed = new ApprovedDeniedSuggestionReviewQueueEmbed(
    // newStatus,
    l,
    suggestion,
    author,
    ctx.interaction.member.user
    // reason
  );

  await updateQueueMessages(
    l,
    ctx.framework.rest,
    suggestion,
    feed,
    newReviewEmbed,
    action === 'approve'
  );

  // await Promise.all(
  //   suggestion.approvalQueueMessages.map(m => {
  //     return ctx.framework.rest.patch(
  //       Routes.channelMessage(feed.reviewChannelID!, m),
  //       {
  //         body: {
  //           embeds: [newReviewEmbed],
  //           components:
  //             action === 'approve'
  //               ? [
  //                   {
  //                     type: ComponentType.ActionRow,
  //                     components: [markSelectMenu(l, feed, suggestion)],
  //                   },
  //                   {
  //                     type: ComponentType.ActionRow,
  //                     components: [
  //                       {
  //                         type: ComponentType.Button,
  //                         style: ButtonStyle.Link,
  //                         label: l.guild('suggest-success.link-button-label'),
  //                         url: `https://discord.com/channels/${suggestion.guildID}/${suggestion.feedChannelID}/${updateSuggestion.feedMessageID}`,
  //                       },
  //                     ],
  //                   },
  //                 ]
  //               : [],
  //         } as RESTPatchAPIChannelMessageJSONBody,
  //       }
  //     );
  //   })
  // );

  // TODO: dispatch notification
};

export const approveDenyCmds: SubCommand[] = (['Approve', 'Deny'] as const).map(
  s => {
    const lc = s.toLowerCase() as 'approve' | 'deny';

    const options = [
      {
        name: 'suggestion',
        description: `The ID of the suggestion to ${lc}`,
        type: ApplicationCommandOptionType.Integer,
        required: true,
      },
      feedNameAutocomplete,
      {
        name: 'reason',
        description: 'The reason',
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ] as const;

    class S extends SubCommand {
      name: MessageNames = `cmd-review-${lc}.name` as MessageNames;
      description: MessageNames = `cmd-review-${lc}.desc` as MessageNames;

      options = options;

      buttonIDs = [`review:${lc}:`];

      async command(
        ctx: Context<
          APIChatInputApplicationCommandGuildInteraction,
          typeof options
        >
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

        const selectedSuggestion = await ctx.db.getFullSuggestionByPublicID(
          feed.id,
          ctx.getOption('suggestion').value
        );

        const reason = ctx.getOption('reason')?.value;
        await doAction(lc, ctx, feed, selectedSuggestion, reason);
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
            attachments: true,
            comments: true,
          },
        });

        if (!suggestionAndFeed) {
          return;
        }

        await doAction(lc, ctx, suggestionAndFeed.feed, suggestionAndFeed);
      }
    }

    return new S();
  }
);
