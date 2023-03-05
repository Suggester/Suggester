import {
  APIApplicationCommandInteraction,
  MessageFlags,
} from 'discord-api-types/v10';

import {Command, Context} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

export class PrivacyCommand extends Command {
  name: MessageNames = 'cmd-privacy.name';
  description: MessageNames = 'cmd-privacy.desc';

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
