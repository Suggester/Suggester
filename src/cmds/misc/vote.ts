import {
  APIApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';

import {Command, Context, Messages} from 'suggester';

export class VoteCommand extends Command {
  name: keyof Messages = 'command-name--vote';
  description: keyof Messages = 'command-desc--vote';

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const voteLinks = [
      'https://top.gg/bot/564426594144354315/vote',
      'https://botlist.space/bot/564426594144354315/upvote',
      'https://botsfordiscord.com/bot/564426594144354315/vote',
      'https://discordbotlist.com/bots/564426594144354315/upvote',
      'https://discord.boats/bot/564426594144354315/vote',
      'https://bots.ondiscord.xyz/bots/564426594144354315/review',
    ]
      .map(l => `<${l}>`)
      .join('\n');

    const supportLink = ctx.framework.config.meta.support_server_invite;

    const localizer = ctx.getLocalizer();
    const msg = await localizer.user('vote-info', {
      link: supportLink,
      links: voteLinks,
    });

    await ctx.send({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
  }
}
