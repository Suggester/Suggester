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
    description: 'The ID of the suggestion to delete',
    type: ApplicationCommandOptionType.Integer,
    required: true,
  },
  {
    name: 'reason',
    description: 'The reason for deleting the suggestion',
    type: ApplicationCommandOptionType.String,
    required: false,
  },
  feedNameAutocomplete,
] as const;

export class SuggestionsDeleteCommand extends SubCommand {
  name: MessageNames = 'cmd-suggestions-delete.name';
  description: MessageNames = 'cmd-suggestions-delete.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ) {}
}
