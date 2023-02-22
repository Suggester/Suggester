import {APIApplicationCommandInteraction} from 'discord-api-types/v10';

import {Command, Context} from '@suggester/framework';
import {Messages} from '@suggester/i18n';

export class PingCommand extends Command {
  name: keyof Messages = 'command-name--ping';
  description: keyof Messages = 'command-desc--ping';

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const localizer = ctx.getLocalizer();
    const origMessage = await localizer.user('ping-original');

    const before = Date.now();
    await ctx.send({
      content: origMessage,
    });
    const after = Date.now();

    const afterMsg = await localizer.user('ping-edited', {
      ms: after - before,
    });

    await ctx.edit('@original', {
      content: afterMsg,
    });
  }
}
