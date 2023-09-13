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
    description: 'The ID of the suggestion to view',
    type: ApplicationCommandOptionType.Integer,
    required: true,
  },
  feedNameAutocomplete,
] as const;

export class SuggestionsInfoCommand extends SubCommand {
  name: MessageNames = 'cmd-suggestions-info.name';
  description: MessageNames = 'cmd-suggestions-info.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ) {
    console.log(ctx.getFlatOptions());
    await ctx.send({});
  }
}
