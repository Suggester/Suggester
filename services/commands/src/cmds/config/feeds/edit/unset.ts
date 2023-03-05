import {APIChatInputApplicationCommandInteraction} from 'discord-api-types/v10';

import {Context, SubCommand} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

const options = [] as const;

export class FeedsEditUnsetCommand extends SubCommand {
  name: MessageNames = 'cmd-feeds-edit-unset.name';
  description: MessageNames = 'cmd-feeds-edit-unset.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandInteraction, typeof options>
  ): Promise<void> {}
}
