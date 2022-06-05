import {CommandModule} from 'suggester';

import {SuggestCommand} from './suggest';

export class SuggestionModule extends CommandModule {
  name = '';
  description = '';
  position = 1;
  commands = [new SuggestCommand()];
}
