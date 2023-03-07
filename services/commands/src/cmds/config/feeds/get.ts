import {
  APIActionRowComponent,
  APIApplicationCommandAutocompleteInteraction,
  APIChatInputApplicationCommandInteraction,
  APIMessageActionRowComponent,
  APIMessageComponentInteraction,
  ApplicationCommandOptionType,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} from 'discord-api-types/v10';

import {SuggestionFeed} from '@suggester/database';
import {Context, SubCommand} from '@suggester/framework';
import {Localizer, MessageNames} from '@suggester/i18n';
import {
  EmbedBuilder,
  FeedInfoChannelsEmbed,
  FeedInfoOtherEmbed,
  FeedInfoOverviewEmbed,
  FeedInfoRolesEmbed,
} from '@suggester/util';

const options = [
  {
    name: 'name',
    description: 'The name of the feed',
    type: ApplicationCommandOptionType.String,
    autocomplete: true,
    required: true,
  },
] as const;

const pageButtons = (
  l: Localizer,
  selected: string,
  id: number
): APIActionRowComponent<APIMessageActionRowComponent>[] => [
  {
    type: ComponentType.ActionRow,
    components: ['overview', 'channels', 'roles', 'other'].map(k => ({
      type: ComponentType.Button,
      label: l.guild(('feed-info-page-buttons.' + k) as MessageNames),
      custom_id: `feeds-get:${k}:${id}`,
      style: ButtonStyle.Primary,
      disabled: selected === k,
    })),
  },
];

export class FeedsGetCommand extends SubCommand {
  name: MessageNames = 'cmd-feeds-get.name';
  description: MessageNames = 'cmd-feeds-get.desc';
  options = options;

  buttonIDs = ['feeds-get:'];

  async command(
    ctx: Context<APIChatInputApplicationCommandInteraction, typeof options>
  ): Promise<void> {
    const l = ctx.getLocalizer();

    const feedName = ctx.getOption('name').value;

    const feed = await ctx.db.suggestionFeeds.getByName(
      ctx.interaction.guild_id!,
      feedName
    );

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

    const overviewEmbed = new FeedInfoOverviewEmbed(feed, l).localize(
      l,
      l.getGuildLocale()
    );

    await ctx.send({
      embeds: [overviewEmbed],
      components: pageButtons(l, 'overview', feed.id),
    });
  }

  async autocomplete(
    ctx: Context<APIApplicationCommandAutocompleteInteraction, typeof options>
  ): Promise<void> {
    const opt = ctx.getFocusedOption();
    if (
      opt?.name === 'name' &&
      opt?.type === ApplicationCommandOptionType.String
    ) {
      const suggestions = await ctx.db.suggestionFeeds.autocompleteName(
        ctx.interaction.guild_id!,
        opt.value
      );

      await ctx.sendAutocomplete(suggestions);
    }
  }

  async button(ctx: Context<APIMessageComponentInteraction>): Promise<void> {
    const l = ctx.getLocalizer();

    const [, selected, _id, opts] = ctx.interaction.data.custom_id.split(':');
    const id = parseInt(_id);

    const clearButtonsAndError = async (err: string) => {
      await ctx.update({
        components: [],
      });

      await ctx.send({
        content: err,
        flags: MessageFlags.Ephemeral,
      });
    };

    const PAGES_MAP: {[key: string]: (feed: SuggestionFeed) => EmbedBuilder} = {
      overview: feed => new FeedInfoOverviewEmbed(feed, l),
      channels: feed => new FeedInfoChannelsEmbed(feed, l),
      roles: feed => new FeedInfoRolesEmbed(feed, l),
      other: feed => new FeedInfoOtherEmbed(feed, l),
    };

    if (!(selected in PAGES_MAP)) {
      const msg = l.user('err_generic');
      await clearButtonsAndError(msg);
      return;
    }

    const feed = await ctx.db.suggestionFeeds.getByID(
      ctx.interaction.guild_id!,
      id
    );

    if (!feed) {
      const msg = l.user('feed-info-button-error');
      await clearButtonsAndError(msg);
      return;
    }

    const embed = PAGES_MAP[selected](feed).localize(l, l.getGuildLocale());

    // 'e' option makes the message ephemeral
    const flags =
      (+opts?.includes('e') << 6) | (ctx.interaction.message.flags || 0);

    // 's' option sends a new message instead of updating the prev one
    if (opts?.includes('s')) {
      await ctx.send({
        embeds: [embed],
        components: pageButtons(l, selected, id),
        flags,
      });

      return;
    }

    await ctx.update({
      embeds: [embed],
      components: pageButtons(l, selected, id),
      flags,
    });
  }
}
