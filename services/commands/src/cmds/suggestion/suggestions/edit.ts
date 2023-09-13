import {
  APIChatInputApplicationCommandGuildInteraction,
  ApplicationCommandOptionType,
} from 'discord-api-types/v10';

import {MessageNames} from '@suggester/i18n';
import {Context, SubCommand} from '@suggester/suggester';

import {feedNameAutocomplete} from '../../../util/commandComponents';

const options = [
  {
    name: 'suggestion',
    description: 'The ID of the suggestion to edit',
    type: ApplicationCommandOptionType.Integer,
    required: true,
  },
  {
    name: 'body',
    description: 'The new suggestion body. Leave blank for multi-line input',
    type: ApplicationCommandOptionType.String,
    required: false,
  },
  feedNameAutocomplete,
] as const;

export class SuggestionsEditCommand extends SubCommand {
  name: MessageNames = 'cmd-suggestions-edit.name';
  description: MessageNames = 'cmd-suggestions-edit.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ) {
    {
    }
  }
}
