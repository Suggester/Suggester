import {ApplicationCommandOptionType} from 'discord-api-types/v10';

export const feedNameAutocomplete = {
  name: 'name',
  description: 'The name of the suggestion feed',
  type: ApplicationCommandOptionType.String,
  required: true,
  autocomplete: true,
} as const;
