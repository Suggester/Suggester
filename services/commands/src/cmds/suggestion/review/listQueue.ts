import {
  APIChatInputApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';

import {MessageNames} from '@suggester/i18n';
import {Context, SubCommand} from '@suggester/suggester';

import {feedNameAutocomplete} from '../../../util/commandComponents';

const options = [feedNameAutocomplete] as const;

const PER_PAGE = 10;

export class ReviewListQueueCommand extends SubCommand {
  name: MessageNames = 'cmd-review-listqueue.name';
  description: MessageNames = 'cmd-review-listqueue.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandInteraction, typeof options>
  ): Promise<void> {
    const l = ctx.getLocalizer();

    const feedName = ctx.getOption('feed')?.value;
    const feed = await ctx.db.getFeedByNameOrDefault(feedName);

    if (!feed) {
      const msg = l.user('unknown-feed', {
        cmd: ctx.framework.mentionCmd('review list-queue'),
      });

      await ctx.send({
        content: msg,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const found = await ctx.db.prisma.suggestion.findMany({
      // TODO: is there a better way?

      // the embed will display max PAGE_NUMBER, but querying +1 to see if
      // there should be pagination buttons
      take: PER_PAGE + 1,
      where: {
        guildID: ctx.interaction.guild_id!,
        feedChannelID: feed.feedChannelID,
      },
      orderBy: {
        publicID: 'asc',
      },
    });

    console.log(found);
  }
}
