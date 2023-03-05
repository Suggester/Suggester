import {Command} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

import {FeedsCreateCommand} from './create';
import {FeedsEditCommandGroup} from './edit';
import {FeedsGetCommand} from './get';

export class FeedsCommand extends Command {
  name: MessageNames = 'cmd-feeds.name';
  description: MessageNames = 'cmd-feeds.desc';

  subCommands = [
    new FeedsGetCommand(),
    new FeedsCreateCommand(),
    new FeedsEditCommandGroup(),
  ];

  async command(): Promise<void> {}
}
