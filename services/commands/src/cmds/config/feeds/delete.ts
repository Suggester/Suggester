import {
  APIApplicationCommandAutocompleteGuildInteraction,
  APIChatInputApplicationCommandGuildInteraction,
  APIMessageComponentGuildInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord-api-types/v10';

import {Context, SubCommand} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

const options = [
  {
    name: 'name',
    description: 'The name of the feed',
    type: ApplicationCommandOptionType.String,
    autocomplete: true,
    required: true,
  },
] as const;

export class FeedsDeleteCommand extends SubCommand {
  name: MessageNames = 'cmd-feeds-delete.name';
  description: MessageNames = 'cmd-feeds-delete.desc';
  options = options;

  buttonIDs = ['feeds-delete-confirm:'];

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ): Promise<void> {
    const l = ctx.getLocalizer();
    const name = ctx.getOption('name').value;

    const feed = await ctx.db.suggestionFeeds.getByName(
      ctx.interaction.guild_id,
      name
    );

    if (!feed) {
      const mention = ctx.framework.mentionCmd('feeds create');
      const m = l.user('unknown-feed', {
        name: name,
        cmd: mention,
      });

      await ctx.send({
        content: m,
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const m = l.guild('feeds-delete-confirm-prompt', {name: feed.name});
    const yesLabel = l.guild('feeds-delete-confirm-prompt.yes');
    const noLabel = l.guild('feeds-delete-confirm-prompt.no');
    await ctx.send({
      content: m,
      // ephemeral so only users with permission to use the command
      // are able to use the buttons
      flags: MessageFlags.Ephemeral,
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.Button,
              custom_id: `feeds-delete-confirm:${feed.id}:t`,
              style: ButtonStyle.Danger,
              label: yesLabel,
            },
            {
              type: ComponentType.Button,
              custom_id: `feeds-delete-confirm:${feed.id}:f`,
              style: ButtonStyle.Secondary,
              label: noLabel,
            },
          ],
        },
      ],
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
      opt?.name === 'name' &&
      opt?.type === ApplicationCommandOptionType.String
    ) {
      const suggestions = await ctx.db.suggestionFeeds.autocompleteName(
        ctx.interaction.guild_id,
        opt.value
      );

      await ctx.sendAutocomplete(suggestions);
    }
  }

  // TODO: how do you compare button permissions to command permissions
  // if user does not have permissions to use the command, how do you
  // prevent them from using the button?
  async button(
    ctx: Context<APIMessageComponentGuildInteraction>
  ): Promise<void> {
    const l = ctx.getLocalizer();

    const [, _id, confirm] = ctx.interaction.data.custom_id.split(':');
    const id = parseInt(_id);

    if (isNaN(id)) {
      return;
    }

    const feed = await ctx.db.suggestionFeeds.getByID(
      ctx.interaction.guild_id,
      id
    );

    if (!feed) {
      const m = l.guild('feeds-delete-unknown-feed');
      await ctx.update({
        content: m,
        components: [],
      });

      return;
    }

    if (confirm === 't') {
      await ctx.db.suggestionFeeds.delete(id);
      const m = l.guild('feeds-delete-success', {name: feed.name});
      await ctx.update({
        content: m,
        components: [],
      });
    } else {
      const m = l.guild('feeds-delete-cancel');
      await ctx.update({
        content: m,
        components: [],
      });
    }
  }
}
