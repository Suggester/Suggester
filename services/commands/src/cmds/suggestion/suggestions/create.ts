import {MessageNames} from '@suggester/i18n';

import {SuggestCommand} from '../suggest';

export class SuggestionsCreateCommand extends SuggestCommand {
  name: MessageNames = 'cmd-suggestions-create.name';
  description: MessageNames = 'cmd-suggestions-create.desc';
}
