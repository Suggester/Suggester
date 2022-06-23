import {SuggestionApprovalStatus} from '@prisma/client';
import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteraction,
  APIApplicationCommandInteractionDataAttachmentOption,
  APIApplicationCommandInteractionDataStringOption,
  APIApplicationCommandOption,
  APIAttachment,
  APIModalSubmitInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ComponentType,
  MessageFlags,
  TextInputStyle,
} from 'discord-api-types/v10';

import {Command, Context, Messages} from 'suggester';

interface SuggestCommandState {
  feed: string;
  attachment?: APIAttachment;
}

export class SuggestCommand extends Command {
  name: keyof Messages = 'command-name--suggest';
  description: keyof Messages = 'command-desc--suggest';
  options: APIApplicationCommandOption[] = [
    {
      type: ApplicationCommandOptionType.String,
      name: 'feed',
      description: 'The feed to post the suggestion in',
      required: false,
      autocomplete: true,
    },
    {
      type: ApplicationCommandOptionType.Attachment,
      name: 'attachment',
      description: 'Attach an image to your suggestion',
      required: false,
    },
  ];

  modalIds = ['create_suggestion'];

  // TODO: replace with redis?
  state = new Map<string, SuggestCommandState>();

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    if (
      !ctx.interaction.guild_id ||
      ctx.interaction.data.type !== ApplicationCommandType.ChatInput
    ) {
      return;
    }

    const attachment =
      ctx.getOption<APIApplicationCommandInteractionDataAttachmentOption>(
        'attachment'
      );

    let feed =
      ctx.getOption<APIApplicationCommandInteractionDataStringOption>(
        'feed'
      )?.value;

    if (!feed) {
      const defaultFeed = await ctx.db.suggestionFeeds.getDefault({
        applicationId: ctx.instance.applicationId,
        guildId: ctx.interaction.guild_id,
      });

      if (!defaultFeed) {
        const localizer = ctx.getLocalizer();
        // TODO: this still references `setup` command
        const msg = await localizer.user('unconfigured-error');

        await ctx.send({
          content: msg,
          flags: MessageFlags.Ephemeral,
        });

        return;
      }

      feed = defaultFeed.channelId;
    }

    const resolvedAttachment =
      attachment &&
      ctx.interaction.data.resolved!.attachments![attachment.value];

    // TODO: check against actual mime times instead of allowing all photo/video
    const isAttachmentValid =
      !!resolvedAttachment?.content_type?.match(/^image|video/);

    this.state.set(ctx.interaction.id, {
      attachment: isAttachmentValid ? resolvedAttachment : undefined,
      feed,
    });

    await ctx.sendModal({
      title: 'Create Suggestion',
      custom_id: `create_suggestion:${ctx.interaction.id}`,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.TextInput,
              custom_id: 'create_suggestion_body',
              label: 'Suggestion Body',
              style: TextInputStyle.Paragraph,
              max_length: 4_000,
              min_length: 1,
              required: true,
            },
          ],
        },
      ],
    });
  }

  async autocomplete(
    ctx: Context<APIApplicationCommandAutocompleteInteraction>
  ): Promise<void> {
    // this command can only be used in servers so this should never happen
    if (!ctx.interaction.guild_id) {
      return;
    }

    const focused = ctx.getFocusedOption();
    if (!focused || focused.type !== ApplicationCommandOptionType.String) {
      return;
    }

    const feeds = await ctx.db.suggestionFeeds.getAll({
      applicationId: ctx.instance.applicationId,
      guildId: ctx.interaction.guild_id,
    });

    const like = feeds.filter(f =>
      f.name?.toLowerCase().includes(focused.value.toLowerCase())
    );

    await ctx.sendAutocomplete({
      choices: like.slice(0, 24).map(c => ({name: c.name, value: c.channelId})),
    });
  }

  async modal(ctx: Context<APIModalSubmitInteraction>): Promise<void> {
    if (!ctx.interaction.guild_id) {
      return;
    }

    const [modal, stateKey] = ctx.interaction.data.custom_id.split(':');
    switch (modal) {
      case 'create_suggestion': {
        const fromState = this.state.get(stateKey);
        if (!fromState) {
          await ctx.send({
            content: 'some generic error message lol',
            flags: MessageFlags.Ephemeral,
          });
          return;
        }

        const {feed, attachment} = fromState;

        const body = ctx.getModalTextField('create_suggestion_body')!;
        await ctx.db.prisma.suggestion.create({
          data: {
            body: body.value,
            approvalStatus: SuggestionApprovalStatus.IN_QUEUE,
            authorId: ctx.interaction.member!.user.id,
            applicationId: ctx.instance.applicationId,
            guildId: ctx.interaction.guild_id,
            feedChannelId: feed,
            attachmentURL: attachment && attachment.url,
          },
        });

        this.state.delete(stateKey);

        await ctx.send({
          content: body.value,
        });
      }
    }
  }
}
