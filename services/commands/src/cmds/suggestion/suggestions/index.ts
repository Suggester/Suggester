import {ApplicationCommandOptionType} from 'discord-api-types/v10';

import {MessageNames} from '@suggester/i18n';
import {Command, SubCommand} from '@suggester/suggester';

import {SuggestionsCreateCommand} from './create';
import {SuggestionsDeleteCommand} from './delete';
import {SuggestionsEditCommand} from './edit';
import {SuggestionsInfoCommand} from './info';
import {SuggestionsSearchCommand} from './search';

export class SuggestionCommand extends Command {
  name: MessageNames = 'cmd-suggestions.name';
  description: MessageNames = 'cmd-suggestions.desc';

  subCommands: SubCommand[] = [
    new SuggestionsDeleteCommand(),
    new SuggestionsEditCommand(),
    new SuggestionsInfoCommand(),
    new SuggestionsSearchCommand(),
  ];

  constructor() {
    super();

    // add the legacy /suggest command as /suggestions create
    const createSubCmd =
      new SuggestionsCreateCommand() as unknown as SubCommand;
    // @ts-expect-error "read-only" my ass
    createSubCmd.type = ApplicationCommandOptionType.Subcommand;
    createSubCmd.parent = this;
    this.subCommands.unshift(createSubCmd);
  }
}
