import {
  APIApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';

// import {Command, Context} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {Command, Context} from '@suggester/suggester';

export class InviteCommand extends Command {
  name: MessageNames = 'cmd-invite.name';
  description: MessageNames = 'cmd-invite.desc';

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const localizer = ctx.getLocalizer();

    // if (!ctx.instance.isPublic) {
    //   const msg = await localizer.user('err_bot-not-public');
    //   await ctx.send({
    //     content: msg,
    //     flags: MessageFlags.Ephemeral,
    //   });
    // }

    const perms = ctx.framework.config.meta.invite_permissions;
    const url = `<https://discord.com/oauth2/authorize?client_id=${
      ctx.framework.config.discord_application.id
    }&scope=bot%20applications.commands${
      perms !== '0' ? `&permissions=${perms}` : ''
    }>`;

    const msg = await localizer.user('invite-bot', {
      // TODO: make this show the actual name?
      name: 'me',
      link: url,
    });

    await ctx.send({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
  }
}
