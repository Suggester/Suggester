import {
  APIChatInputApplicationCommandGuildInteraction,
  ApplicationCommandOptionType,
} from 'discord-api-types/v10';

import {MessageNames} from '@suggester/i18n';
import {Context, SubCommand} from '@suggester/suggester';

import {feedNameAutocomplete} from '../../../util/commandComponents';

const options = [
  {
    name: 'query',
    description: 'The search query',
    type: ApplicationCommandOptionType.String,
    required: true,
  },
  feedNameAutocomplete,
] as const;

export class SuggestionsSearchCommand extends SubCommand {
  name: MessageNames = 'cmd-suggestions-search.name';
  description: MessageNames = 'cmd-suggestions-search.desc';

  options = options;

  async command(
    ctx: Context<APIChatInputApplicationCommandGuildInteraction, typeof options>
  ) {
    console.log(ctx.getFlatOptions());
    await ctx.send({});
  }
}
