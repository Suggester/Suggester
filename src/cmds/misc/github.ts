import {
  APIApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';

import {Command, Context, Messages} from 'suggester';

export class GitHubCommand extends Command {
  name: keyof Messages = 'command-name--github';
  description: keyof Messages = 'command-desc--github';

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
