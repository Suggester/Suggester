import {MessageNames} from '@suggester/i18n';
import {Command} from '@suggester/suggester';

import {DefaultModCommandPermissions} from '../../../constants';
import {approveDenyCmds} from './approveDeny';

export class ReviewCommand extends Command {
  name: MessageNames = 'cmd-review.name';
  description: MessageNames = 'cmd-review.desc';

  defaultMemberPermissions = DefaultModCommandPermissions;

  subCommands = [...approveDenyCmds];
}
