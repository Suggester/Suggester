import {
  APIApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';
import {fetch} from 'undici';

// import {Command, Context} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';
import {Command, Context} from '@suggester/suggester';
import {
  ChangelogEmbed,
  GitHubReleaseData,
  chunk,
  chunkStringAt,
} from '@suggester/suggester';

// }  from '@suggester/suggester';
// // } from '@suggester/util';

export class ChangelogCommand extends Command {
  name: MessageNames = 'cmd-changelog.name';
  description: MessageNames = 'cmd-changelog.desc';

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const latestGitHubChangelog = (await fetch(
      'https://api.github.com/repos/Suggester/Suggester/releases/latest'
    ).then(r => r.json())) as GitHubReleaseData;

    const chunks = chunkStringAt(latestGitHubChangelog.body, 2000);

    // TODO: work out pagination
    const embeds = chunks.map(
      c => new ChangelogEmbed(latestGitHubChangelog, c)
    );

    const embedChunks = chunk(embeds, 10);

    // TODO: paginate, don't send all lol
    for (const chunk of embedChunks) {
      await ctx.send({
        embeds: chunk,
        flags: MessageFlags.Ephemeral,
      });
    }
  }
}
