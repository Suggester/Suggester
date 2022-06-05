import {
  APIApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';

import {Command, Context, Messages} from 'suggester';

export class PrivacyCommand extends Command {
  name: keyof Messages = 'command-name--privacy';
  description: keyof Messages = 'command-desc--privacy';

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const PRIVACY_POLICY_URL = '<https://suggester.js.org/#/legal>';

    const localizer = ctx.getLocalizer();

    const msg = await localizer.user('privacy-info', {
      link: PRIVACY_POLICY_URL,
    });

    await ctx.send({
      content: msg,
      flags: MessageFlags.Ephemeral,
    });
  }
}
