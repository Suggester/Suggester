import {
  APIActionRowComponent,
  APIApplicationCommandAutocompleteGuildInteraction,
  APIAttachment,
  APIButtonComponent,
  APIChatInputApplicationCommandGuildInteraction,
  APIGuildInteraction,
  APIMessage,
  APIModalSubmitGuildInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  RESTPostAPIChannelMessageJSONBody,
  Routes,
  TextInputStyle,
} from 'discord-api-types/v10';
import {fetch} from 'undici';

// import {Command, Context, LogAction} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {
  Suggestion,
  SuggestionApprovalStatus,
  SuggestionAttachment,
  SuggestionComment,
  SuggestionFeed,
  SuggestionFeedMode,
  SuggestionVoteKind,
} from '@suggester/database';
import {Command, Context, LogAction} from '@suggester/suggester';
import {
  NewSuggestionReviewQueueEmbed,
  SuggestionEmbed,
} from '@suggester/suggester';

// import {NewSuggestionReviewQueueEmbed, SuggestionEmbed}  from '@suggester/suggester';
// // import {NewSuggestionReviewQueueEmbed, SuggestionEmbed} from '@suggester/util';
import {feedNameAutocomplete} from '../../util/commandComponents';
import {ALLOWED_ATTACHMENT_TYPES} from './attach';

export type FullSuggestion = Suggestion & {
  comments: SuggestionComment[];
  attachments: SuggestionAttachment[];
  feed: SuggestionFeed;
};

export type Opinion = {[key in SuggestionVoteKind]?: number};

export const createFeedMessage = <T extends APIGuildInteraction>(
  ctx: Context<T, []>,
  suggestion: FullSuggestion,
  feed: SuggestionFeed,
  opinion: Opinion,
  author = ctx.interaction.member.user
): RESTPostAPIChannelMessageJSONBody => {
  const l = ctx.getLocalizer();

  const embeds = SuggestionEmbed.build(l, feed, suggestion, opinion, author);

  const buttons = createFeedButtons(
    feed,
    opinion,
    suggestion.id,
    suggestion.attachments.length
  );

  return {
    embeds,
    components: buttons,
  };
};

export const createFeedButtons = (
  feed: SuggestionFeed,
  opinion: Opinion,
  suggestionID: number,
  nAttachments = 0
): APIActionRowComponent<APIButtonComponent>[] => {
  const buttons: APIButtonComponent[] = (
    (
      [
        ['upvote', feed.upvoteEmoji, opinion.Upvote || 0],
        ['mid', feed.midEmoji, opinion.Mid || 0],
        ['downvote', feed.downvoteEmoji, opinion.Downvote || 0],
      ] as const
    )
      .map(
        ([action, emoji, count]) =>
          emoji && {
            type: ComponentType.Button,
            style: ButtonStyle.Secondary,
            emoji: emoji.length > 15 ? {id: emoji} : {name: emoji},
            label: feed.showVoteCount ? count.toString() : null,
            custom_id: `${action}:${suggestionID}`,
          }
      )
      .filter(Boolean) as APIButtonComponent[]
  ).concat(
    nAttachments
      ? {
          type: ComponentType.Button,
          style: ButtonStyle.Secondary,
          label: `View ${nAttachments} Attachment${
            nAttachments === 1 ? '' : 's'
          }`,
          emoji: {name: '\ud83d\uddbc\ufe0f'}, // picture emoji
          custom_id: `attachments:${suggestionID}`,
        }
      : []
  );

  return [
    {
      type: ComponentType.ActionRow,
      components: buttons,
    },
  ];
};

export const sendFeedMessage = async <T extends APIGuildInteraction>(
  ctx: Context<T, []>,
  suggestion: FullSuggestion,
  feed: SuggestionFeed,
  suggestCmd = true,
  votes: {[key in SuggestionVoteKind]?: number} = {}
): Promise<APIMessage> => {
  const l = ctx.getLocalizer();

  const msg = createFeedMessage(ctx, suggestion, feed, votes);
  const createdMsg = (await ctx.framework.rest.post(
    Routes.channelMessages(feed.feedChannelID),
    {
      body: msg,
    }
  )) as APIMessage;

  if (suggestCmd) {
    await ctx.send({
      content: l.user('suggest-success.autoapprove'),
      flags: MessageFlags.Ephemeral,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              url: `https://discord.com/channels/${feed.guildID}/${feed.feedChannelID}/${createdMsg.id}`,
              label: l.user('suggest-success.link-button-label'),
            },
          ],
        },
      ],
    });

    await ctx.db.updateSuggestion(suggestion.id, {
      feedMessageID: createdMsg.id,
    });
  }

  return createdMsg;
};

const createSuggestion = async <C extends APIGuildInteraction>(
  ctx: Context<C>,
  feed: SuggestionFeed,
  {
    anon,
    body,
    attachment,
  }: {anon: boolean; body: string; attachment?: APIAttachment}
) => {
  const sendMsg = async (
    channelID: string,
    m: RESTPostAPIChannelMessageJSONBody
  ): Promise<APIMessage> =>
    ctx.framework.rest.post(Routes.channelMessages(channelID), {
      body: m,
    }) as Promise<APIMessage>;

  const l = ctx.getLocalizer();

  if (anon && !feed.allowAnonymous) {
    const m = l.user('suggest-anon-disallowed-error');
    await ctx.send({
      content: m,
      flags: MessageFlags.Ephemeral,
    });

    return;
  }

  const attachments: {file: Buffer; type: string}[] = [];

  if (attachment) {
    const downloadedAttachment = await fetch(attachment.url).then(d =>
      d.arrayBuffer()
    );
    attachments.push({
      file: Buffer.from(downloadedAttachment),
      type: attachment.content_type!,
    });
  }

  const createdSuggestion = await ctx.db.createSuggestion(
    {
      body,
      feedChannelID: feed.feedChannelID,
      isAnonymous: anon,
      approvalStatus:
        feed.mode === SuggestionFeedMode.Review
          ? SuggestionApprovalStatus.InQueue
          : SuggestionApprovalStatus.Approved,
    },
    attachments
  );

  if (feed.logChannelID) {
    ctx.log.suggestionCreated({
      suggestion: createdSuggestion,
      logChannel: feed.logChannelID,
      author: ctx.interaction.member.user,
    });

    setTimeout(() => {
      ctx.log.suggestionCreated({
        suggestion: createdSuggestion,
        logChannel: feed.logChannelID!,
        author: ctx.interaction.member.user,
      });
    }, 1000);
  }

  try {
    switch (feed.mode) {
      case SuggestionFeedMode.Review: {
        if (!feed.reviewChannelID) {
          await ctx.send({
            content: l.user('review-channel-not-set-error', {
              cmd: ctx.framework.mentionCmd('feeds edit set'),
            }),
            flags: MessageFlags.Ephemeral,
          });

          return;
        }

        const embed = new NewSuggestionReviewQueueEmbed(
          l,
          createdSuggestion,
          ctx.interaction.member.user
        );

        const sent = await sendMsg(feed.reviewChannelID, {
          embeds: [embed],
          components: [
            {
              type: ComponentType.ActionRow,
              components: [
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Success,
                  custom_id: `review:approve:${createdSuggestion.id}`,
                  label: l.guild('review-queue-buttons.approve'),
                },
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Secondary,
                  custom_id: `review:deny:${createdSuggestion.id}`,
                  label: l.guild('review-queue-buttons.deny'),
                },
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Danger,
                  custom_id: `review:delete:${createdSuggestion.id}`,
                  label: l.guild('review-queue-buttons.delete'),
                },
                {
                  type: ComponentType.Button,
                  style: ButtonStyle.Primary,
                  custom_id: `review:status:${createdSuggestion.id}`,
                  label: l.guild('review-queue-buttons.change-status'),
                },
              ],
            },
          ],
        });

        await ctx.send({
          content: l.guild('suggest-success.review'),
          flags: MessageFlags.Ephemeral,
        });

        await ctx.db.updateSuggestion(createdSuggestion.id, {
          approvalQueueMessages: {
            push: sent.id,
          },
        });

        return;
      }

      case SuggestionFeedMode.AutoApprove: {
        await sendFeedMessage(ctx, createdSuggestion, feed);
        return;
      }
    }
  } catch (err) {
    console.error('Failed to create suggestion feed message:', err);

    await ctx.db.deleteSuggestion(createdSuggestion.id);

    const msg = l.user('err_generic');
    await ctx.sendOrUpdate({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });

    return;
  }
};

const options = [
  feedNameAutocomplete,
  {
    name: 'body',
    description:
      'The body of your suggestion. Leave blank for multi-line input',
    type: ApplicationCommandOptionType.String,
    required: false,
  },
  {
    name: 'anonymous',
    description: 'Submit the suggestion anonymously (if the server allows it)',
    type: ApplicationCommandOptionType.Boolean,
    required: false,
  },
  {
    name: 'attachment',
    description: 'An image to display with your suggestion',
    type: ApplicationCommandOptionType.Attachment,
    required: false,
  },
] as const;

const MAX_ATTACHMENT_SIZE = 100 * 1_024 * 1_024;

export class SuggestCommand extends Command {
  name: MessageNames = 'cmd-suggest.name';
  description: MessageNames = 'cmd-suggest.desc';

  options = options;

  modalIDs = ['suggest:'];

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

    const anon = !!ctx.getOption('anonymous')?.value;
    const body = ctx.getOption('body')?.value;
    if (!body) {
      await ctx.sendModal({
        title: 'Suggestion',
        custom_id: `suggest:${feed.id}:${anon}`,
        components: [
          {
            type: ComponentType.ActionRow,
            components: [
              {
                type: ComponentType.TextInput,
                custom_id: 'body',
                label: 'Suggestion Body',
                style: TextInputStyle.Paragraph,
                placeholder: 'I would like you to add...',
                required: true,
                min_length: 1,
                max_length: 4_000,
              },
            ],
          },
        ],
      });

      return;
    }

    const attachmentID = ctx.getOption('attachment')?.value;
    const attachment = attachmentID
      ? ctx.interaction.data.resolved?.attachments?.[attachmentID]
      : undefined;

    if (attachment) {
      if (attachment.size > MAX_ATTACHMENT_SIZE) {
        await ctx.send({
          content: l.user('attachment-too-big'),
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (
        !attachment.content_type ||
        !ALLOWED_ATTACHMENT_TYPES.includes(attachment.content_type)
      ) {
        await ctx.send({
          content: l.user('disallowed-attachment-type'),
          flags: MessageFlags.Ephemeral,
        });

        return;
      }
    }

    await createSuggestion(ctx, feed, {anon, body, attachment});
  }

  async modal(ctx: Context<APIModalSubmitGuildInteraction>) {
    const [, _id, _anon] = ctx.interaction.data.custom_id.split(':');
    const id = parseInt(_id);
    const anon = _anon === 'true';

    if (isNaN(id)) {
      return;
    }

    const l = ctx.getLocalizer();

    const body = ctx.interaction.data.components[0].components.find(
      c => c.type === ComponentType.TextInput && c.custom_id === 'body'
    )!.value;

    const feed = await ctx.db.getFeedByID(id);
    if (!feed) {
      const m = l.user('err_generic');
      await ctx.send({
        content: m,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    await createSuggestion(ctx, feed, {anon, body});
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
