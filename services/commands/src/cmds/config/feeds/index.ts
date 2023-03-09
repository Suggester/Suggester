import {Command} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

import {DefaultAdminCommandPermissions} from '../../../constants';
import {FeedsCreateCommand} from './create';
import {FeedsDeleteCommand} from './delete';
import {FeedsEditCommandGroup} from './edit';
import {FeedsGetCommand} from './get';

export class FeedsCommand extends Command {
  name: MessageNames = 'cmd-feeds.name';
  description: MessageNames = 'cmd-feeds.desc';

  defaultMemberPermissions = DefaultAdminCommandPermissions;

  subCommands = [
    new FeedsGetCommand(),
    new FeedsCreateCommand(),
    new FeedsEditCommandGroup(),
    new FeedsDeleteCommand(),
  ];

  async command(): Promise<void> {}
}
