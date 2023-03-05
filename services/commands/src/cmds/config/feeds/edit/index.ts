import {SubCommandGroup} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

import {FeedsEditSetCommand} from './set';
import {FeedsEditUnsetCommand} from './unset';

export class FeedsEditCommandGroup extends SubCommandGroup {
  name: MessageNames = 'cmd-feeds-edit.name';
  description: MessageNames = 'cmd-feeds-edit.desc';
  subCommands = [new FeedsEditSetCommand(), new FeedsEditUnsetCommand()];
}
