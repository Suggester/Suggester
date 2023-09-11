import {
  APIApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';

// import {Command, Context} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {Command, Context} from '@suggester/suggester';

export class GitHubCommand extends Command {
  name: MessageNames = 'cmd-github.name';
  description: MessageNames = 'cmd-github.desc';

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const REPO = 'https://github.com/suggester/suggester';

    const localizer = ctx.getLocalizer();
    const msg = await localizer.user('github-repo', {link: REPO});

    await ctx.send({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
  }
}
