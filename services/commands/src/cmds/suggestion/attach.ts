import {
  APIApplicationCommandAutocompleteGuildInteraction,
  APIAttachment,
  APIChatInputApplicationCommandGuildInteraction,
  APIGuildInteraction,
  APIInteractionResponseCallbackData,
  APIMessageComponentGuildInteraction,
  APIUser,
  ApplicationCommandOptionType,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  Routes,
} from 'discord-api-types/v10';
import {fetch} from 'undici';

import {MAX_FILE_SIZE, SuggestionFeed} from '@suggester/database';
// import {Command, Context, SubCommand} from '@suggester/framework';
import {Localizer, MessageNames} from '@suggester/i18n';
import {Command, Context, SubCommand} from '@suggester/suggester';
import {SuggestionAttachmentEmbed} from '@suggester/suggester';

// import {SuggestionAttachmentEmbed}  from '@suggester/suggester';
// // import {SuggestionAttachmentEmbed} from '@suggester/util';
import {feedNameAutocomplete} from '../../util/commandComponents';
import {FullSuggestion, createFeedMessage} from './suggest';

export const ALLOWED_ATTACHMENT_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webm',
  'image/webp',
];
export const MAX_ATTACHMENTS = 4;

export const downloadAttachment = async (a: APIAttachment) => {
  const downloadedAttachment = await fetch(a.url).then(d => d.arrayBuffer());

  const attachment = {
    file: Buffer.from(downloadedAttachment),
    type: a.content_type!,
  };

  return attachment;
};

const updateFeedMessage = async (
  ctx: Context<APIGuildInteraction>,
  suggestion: FullSuggestion,
  feed: SuggestionFeed
) => {
  const author = (await ctx.framework.rest.get(
    Routes.user(suggestion.authorID)
  )) as APIUser;

  const opinion = await ctx.db.getOpinion(suggestion.id);

  const feedMsg = createFeedMessage(ctx, suggestion, feed, opinion, author);

  await ctx.framework.rest.patch(
    Routes.channelMessage(suggestion.feedChannelID, suggestion.feedMessageID!),
    {
      body: feedMsg,
    }
  );
};

const buildAttachmentsMessage = (
  l: Localizer,
  authorID: string,
  suggestion: FullSuggestion
): APIInteractionResponseCallbackData => {
  if (!suggestion.attachments.length) {
    return {
      flags: MessageFlags.Ephemeral,
      content: l.user('no-attachments'),
      embeds: [],
      components: [],
    };
  }

  const embeds = SuggestionAttachmentEmbed.build(l, suggestion.attachments);

  const resp: APIInteractionResponseCallbackData = {
    embeds,
    flags: MessageFlags.Ephemeral,
  };

  if (suggestion.authorID === authorID) {
    resp.components = [
      {
        type: ComponentType.ActionRow,
        components: suggestion.attachments.map((a, i) => ({
          type: ComponentType.Button,
          style: ButtonStyle.Danger,
          label: `Remove Attachment #${i + 1}`,
          custom_id: `attachment-remove:${suggestion.id}:${a.id}`,
        })),
      },
    ];
  }

  return resp;
};

const addOptions = [
  {
    name: 'suggestion',
    description: 'The ID of the suggestion to add an attachment to',
    type: ApplicationCommandOptionType.Integer,
    required: true,
  },
  {
    name: 'attachment',
    description: 'The image to attach',
    type: ApplicationCommandOptionType.Attachment,
    required: true,
  },
  feedNameAutocomplete,
] as const;

class AttachmentsAddCommand extends SubCommand {
  name: MessageNames = 'cmd-attachment-add.name';
  description: MessageNames = 'cmd-attachment-add.desc';

  options = addOptions;

  async command(
    ctx: Context<
      APIChatInputApplicationCommandGuildInteraction,
      typeof addOptions
    >
  ) {
    const l = ctx.getLocalizer();

    const attachment =
      ctx.interaction.data.resolved!.attachments![
        ctx.getOption('attachment').value
      ];

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

    const feedName = ctx.getOption('feed')?.value;
    const feed = await ctx.db.getFeedByNameOrDefault(feedName);

    if (!feed) {
      await ctx.send({
        content: l.user('unknown-feed', {
          cmd: ctx.framework.mentionCmd('feeds create'),
        }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const suggestionWithAttachments = await ctx.db.getFullSuggestionByPublicID(
      feed.id,
      ctx.getOption('suggestion').value
    );

    if (!suggestionWithAttachments) {
      await ctx.send({
        content: l.user('unknown-suggestion'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (suggestionWithAttachments.authorID !== ctx.interaction.member.user.id) {
      await ctx.send({
        content: l.user('only-attach-own-suggestions'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (suggestionWithAttachments.attachments.length >= MAX_ATTACHMENTS) {
      await ctx.send({
        content: l.user('too-many-attachments', {max: MAX_ATTACHMENTS}),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (attachment.size > MAX_FILE_SIZE) {
      await ctx.send({
        content: l.user('attachment-too-big'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await ctx.defer(true);

    const downloadedAttachment = await downloadAttachment(attachment);

    const suggestion = await ctx.db.addAttachmentToSuggestion(
      suggestionWithAttachments,
      downloadedAttachment
    );

    updateFeedMessage(ctx, suggestion, feed);

    ctx.log.attachmentAdded({
      suggestion,
      attachment: suggestion.attachments.at(-1)!,
      user: ctx.interaction.member.user,
      logChannel: feed.logChannelID,
    });

    await ctx.send({
      content: l.user('attachment-added'),
      flags: MessageFlags.Ephemeral,
    });
  }

  async autocomplete(
    ctx: Context<
      APIApplicationCommandAutocompleteGuildInteraction,
      typeof addOptions
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

const removeOptions = [
  {
    name: 'suggestion',
    description: 'The ID of the suggestion to remove an attachment from',
    type: ApplicationCommandOptionType.Integer,
    required: true,
  },
  feedNameAutocomplete,
] as const;

class AttachmentsRemoveCommand extends SubCommand {
  name: MessageNames = 'cmd-attachment-remove.name';
  description: MessageNames = 'cmd-attachment-remove.desc';

  options = removeOptions;

  buttonIDs = ['attachment-remove:'];

  async command(
    ctx: Context<
      APIChatInputApplicationCommandGuildInteraction,
      typeof removeOptions
    >
  ) {
    const l = ctx.getLocalizer();

    const feedName = ctx.getOption('feed')?.value;
    const feed = await ctx.db.getFeedByNameOrDefault(feedName);

    if (!feed) {
      await ctx.send({
        content: l.user('unknown-feed', {
          cmd: ctx.framework.mentionCmd('feeds create'),
        }),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const suggestionWithAttachments = await ctx.db.getFullSuggestionByPublicID(
      feed.id,
      ctx.getOption('suggestion').value
    );

    if (!suggestionWithAttachments) {
      await ctx.send({
        content: l.user('unknown-suggestion'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // TODO: add a way to remove attachments from someone else's?
    if (suggestionWithAttachments.authorID !== ctx.interaction.member.user.id) {
      await ctx.send({
        content: l.user('only-attach-own-suggestions'),
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await ctx.send(
      buildAttachmentsMessage(
        l,
        ctx.interaction.member.user.id,
        suggestionWithAttachments
      )
    );
  }

  async button(ctx: Context<APIMessageComponentGuildInteraction>) {
    const l = ctx.getLocalizer();

    const [, _sID, _aID] = ctx.interaction.data.custom_id.split(':');
    const sID = parseInt(_sID);
    const aID = parseInt(_aID);

    const deletedAttachment = await ctx.db.deleteAttachmentByID(aID);
    const suggestion = await ctx.db.getFullSuggestion(sID)!;

    if (!suggestion) {
      return;
    }

    updateFeedMessage(ctx, suggestion, suggestion.feed);

    await ctx.update(
      buildAttachmentsMessage(l, ctx.interaction.member.user.id, suggestion)
    );

    ctx.log.attachmentRemoved({
      attachment: deletedAttachment,
      suggestion,
      logChannel: suggestion.feed.logChannelID,
      user: ctx.interaction.member.user,
    });

    ctx.send({
      content: l.user('attachment-removed'),
      flags: MessageFlags.Ephemeral,
    });
  }
}

export class AttachmentCommand extends Command {
  name: MessageNames = 'cmd-attachment.name';
  description: MessageNames = 'cmd-attachment.desc';
  subCommands = [new AttachmentsAddCommand(), new AttachmentsRemoveCommand()];

  // TODO: figure out permissions -- user + mods should be able to manage attachments

  buttonIDs = ['attachments:'];

  async button(ctx: Context<APIMessageComponentGuildInteraction>) {
    const l = ctx.getLocalizer();

    const [, _id] = ctx.interaction.data.custom_id.split(':');
    const id = parseInt(_id);

    const suggestion = await ctx.db.getAllAttachments(id);
    if (!suggestion || !suggestion.attachments.length) {
      await ctx.send({
        content: l.user('no-attachments'),
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const embeds = SuggestionAttachmentEmbed.build(l, suggestion.attachments);

    const resp: APIInteractionResponseCallbackData = {
      embeds,
      flags: MessageFlags.Ephemeral,
    };

    if (suggestion.authorID === ctx.interaction.member.user.id) {
      resp.components = [
        {
          type: ComponentType.ActionRow,
          components: suggestion.attachments.map((a, i) => ({
            type: ComponentType.Button,
            style: ButtonStyle.Danger,
            label: `Remove Attachment #${i + 1}`,
            custom_id: `attachment-remove:${suggestion.id}:${a.id}`,
          })),
        },
      ];
    }

    await ctx.send(resp);
  }
}
