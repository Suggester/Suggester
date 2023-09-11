import {
  APIApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';

// import {Command, Context} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {Command, Context} from '@suggester/suggester';

export class SupportCommand extends Command {
  name: MessageNames = 'cmd-support.name';
  description: MessageNames = 'cmd-support.desc';

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const localizer = ctx.getLocalizer();
    const invite = ctx.framework.config.meta.support_server_url;

    const msg = await localizer.user('support-invite', {link: invite});
    await ctx.send({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
  }
}
