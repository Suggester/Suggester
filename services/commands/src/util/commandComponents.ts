import {ApplicationCommandOptionType} from 'discord-api-types/v10';

export const feedNameAutocomplete = {
  name: 'feed',
  description: 'The name of the suggestion feed',
  type: ApplicationCommandOptionType.String,
  required: false,
  autocomplete: true,
} as const;
