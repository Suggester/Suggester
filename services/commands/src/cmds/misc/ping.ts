import {APIApplicationCommandInteraction} from 'discord-api-types/v10';

import {Command, Context} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

export class PingCommand extends Command {
  name: MessageNames = 'cmd-ping.name';
  description: MessageNames = 'cmd-ping.desc';

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
