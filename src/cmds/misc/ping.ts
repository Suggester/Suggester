import {APIApplicationCommandInteraction} from 'discord-api-types/v9';

import {Command, Context} from 'suggester';

export class PingCommand extends Command {
  name = 'ping';
  description = 'Check the response time of the bot';

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const localizer = ctx.localizer();
    const origMessage = await localizer.user('cmd-ping_original');

    const before = Date.now();
    await ctx.send({
      content: origMessage,
    });
    const after = Date.now();

    const afterMsg = await localizer.user('cmd-ping_edited', {
      ms: after - before,
    });

    await ctx.edit('@original', {
      content: afterMsg,
    });
  }
}
