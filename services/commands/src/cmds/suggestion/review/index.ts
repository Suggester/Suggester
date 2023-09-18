import {MessageNames} from '@suggester/i18n';
import {Command, SubCommand, SubCommandGroup} from '@suggester/suggester';

import {DefaultModCommandPermissions} from '../../../constants';
import {approveDenyCmds} from './approveDeny';
import {ReviewMarkCommand} from './mark';

export class ReviewCommand extends Command {
  name: MessageNames = 'cmd-review.name';
  description: MessageNames = 'cmd-review.desc';

  defaultMemberPermissions = DefaultModCommandPermissions;

  subCommands: (SubCommand | SubCommandGroup)[] = [
    ...approveDenyCmds,
    new ReviewMarkCommand(),
  ];
}
