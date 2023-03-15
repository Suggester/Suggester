import {
  APIApplicationCommandAutocompleteGuildInteraction,
  APIButtonComponent,
  APIChatInputApplicationCommandGuildInteraction,
  APIGuildInteraction,
  APIInteraction,
  APIMessage,
  APIMessageComponent,
  APIModalSubmitGuildInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  RESTPostAPIChannelMessageJSONBody,
  RouteBases,
  Routes,
  TextInputStyle,
} from 'discord-api-types/v10';

import {
  SuggestionApprovalStatus,
  SuggestionFeed,
  SuggestionFeedMode,
} from '@suggester/database';
import {Command, Context} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {SuggestionEmbed, channel} from '@suggester/util';

import {feedNameAutocomplete} from '../../util/commandComponents';

const createSuggestion = async <C extends APIGuildInteraction>(
  ctx: Context<C>,
  feed: SuggestionFeed,
  {anon, body}: {anon: boolean; body: string}
) => {
  const sendMsg = async (
    channelID: string,
    m: RESTPostAPIChannelMessageJSONBody
  ): Promise<APIMessage> =>
    ctx.framework.rest.post(Routes.channelMessages(channelID), {
      body: m,
    }) as Promise<APIMessage>;

  const l = ctx.getLocalizer();

  const createdSuggestion = await ctx.db.createSuggestion({
    body,
    feedChannelID: feed.feedChannelID,
    isAnonymous: anon,
    approvalStatus:
      feed.mode === SuggestionFeedMode.Review
        ? SuggestionApprovalStatus.InQueue
        : SuggestionApprovalStatus.Approved,
  });

  let createdMsg: APIMessage;

  try {
    switch (feed.mode) {
      case SuggestionFeedMode.Review: {
        // TODO: send to review channel
        break;
      }

      case SuggestionFeedMode.AutoApprove: {
        const embed = new SuggestionEmbed(
          l,
          feed,
          createdSuggestion,
          [],
          [],
          ctx.interaction.member.user
        );

        const buttons: APIButtonComponent[] = [
          ['upvote', feed.upvoteEmoji],
          ['mid', feed.midEmoji],
          ['downvote', feed.downvoteEmoji],
        ]
          .map(
            ([action, emoji]) =>
              emoji && {
                type: ComponentType.Button,
                style: ButtonStyle.Primary,
                emoji: emoji.length > 15 ? {id: emoji} : {name: emoji},
                custom_id: `${action}:${createdSuggestion.id}`,
                // TODO: label or no label?
                label: l.guild(
                  ('suggestion-vote-buttons.' + action) as MessageNames
                ),
              }
          )
          .filter(Boolean) as APIButtonComponent[];

        createdMsg = await sendMsg(feed.feedChannelID, {
          embeds: [embed],
          components: buttons.length
            ? [
                {
                  type: ComponentType.ActionRow,
                  components: buttons,
                },
              ]
            : [],
        });

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

        await ctx.db.updateSuggestion(createdSuggestion.id, {
          feedMessageID: createdMsg.id,
        });

        break;
      }
    }
  } catch (err) {
    console.error('Failed to create suggestion feed message:', err);

    await ctx.db.deleteSuggestion(createdSuggestion.id);

    // TODO: delete suggsetion from db
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
] as const;

export class FeedsCommand extends Command {
  name: MessageNames = 'cmd-suggest.name';
  description: MessageNames = 'cmd-suggest.desc';

  options = options;

  modalIDs = ['suggest:'];

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ) {
    const l = ctx.getLocalizer();

    const feedName = ctx.getOption('name').value;
    const feed = await ctx.db.getFeedByName(feedName);

    if (!feed) {
      const msg = l.user('unknown-feed', {
        name: feedName,
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

    await createSuggestion(ctx, feed, {anon, body});
  }

  async modal(ctx: Context<APIModalSubmitGuildInteraction>) {
    const [, _id, _anon] = ctx.interaction.data.custom_id.split(':');
    const id = parseInt(_id);
    const anon = Boolean(_anon);

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
      opt?.name === 'name' &&
      opt?.type === ApplicationCommandOptionType.String
    ) {
      const suggestions = await ctx.db.autocompleteFeeds(opt.value);
      await ctx.sendAutocomplete(suggestions);
    }
  }
}
