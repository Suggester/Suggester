import {
  APIApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';

import {Command, Context, Messages} from 'suggester';

export class SupportCommand extends Command {
  name: keyof Messages = 'command-name--support';
  description: keyof Messages = 'command-desc--support';

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const localizer = ctx.getLocalizer();
    const invite = ctx.framework.config.meta.support_server_invite;

    const msg = await localizer.user('support-invite', {link: invite});
    await ctx.send({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
  }
}
