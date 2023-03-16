import {Command} from '@suggester/framework';
import {MessageNames} from '@suggester/i18n';

import {DefaultModCommandPermissions} from '../../../constants';
import {ReviewApproveSubCommand} from './approve';

export class ReviewCommand extends Command {
  name: MessageNames = 'cmd-review.name';
  description: MessageNames = 'cmd-review.desc';

  defaultMemberPermissions = DefaultModCommandPermissions;

  subCommands = [new ReviewApproveSubCommand()];
}
