import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandBasicOption,
  APIApplicationCommandInteraction,
  APIApplicationCommandOption,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';

import {Context, LocalizationService} from '..';
import {Messages} from '../struct/fluentMessages';

const toLocalizedMap = (
  l: LocalizationService,
  availableLocales: string[],
  key: keyof Messages,
  def: string
) =>
  availableLocales.reduce((prev, curr) => {
    const lo = l.get(curr, key);
    prev[curr] = lo === key ? def : lo;
    return prev;
  }, {} as {[key: string]: string});

const localize = (
  struct: Command | SubCommand | SubCommandGroup,
  l: LocalizationService
) => {
  const availableLocales = [...l.bundles.keys()];

  const descriptionKey = struct.description;
  const defaultDesc = l.get('en-US', descriptionKey);
  const descriptionLocalizations = toLocalizedMap(
    l,
    availableLocales,
    descriptionKey,
    defaultDesc
  );
  struct.defaultDescription = defaultDesc;
  struct.description_localizations = descriptionLocalizations;

  const nameKey = struct.name;
  const defaultName = l.get('en-US', nameKey);
  const nameLocalizations = toLocalizedMap(
    l,
    availableLocales,
    nameKey,
    defaultName
  );
  struct.defaultName = defaultName;
  struct.name_localizations = nameLocalizations;

  // TODO: localize options
};

export abstract class Command
  implements RESTPostAPIChatInputApplicationCommandsJSONBody
{
  readonly type = ApplicationCommandType.ChatInput;
  defaultName = '';
  abstract name: keyof Messages;
  name_localizations = {};
  defaultDescription = '';
  abstract description: keyof Messages;
  description_localizations = {};
  default_member_permissions = '0';
  dm_permission = false;
  options: APIApplicationCommandOption[] = [];
  subCommands: (SubCommand | SubCommandGroup)[] = [];

  buttonIds: string[] = [];
  selectIds: string[] = [];
  modalIds: string[] = [];
  autocompleteIds: string[] = [];

  init(l: LocalizationService): this {
    localize(this, l);
    return this;
  }

  // TODO: is there a better way to do this?
  /* eslint-disable @typescript-eslint/no-unused-vars */
  async command(
    ctx: Context<APIApplicationCommandInteraction>
  ): Promise<void> {}
  async button(ctx: Context<APIMessageComponentInteraction>): Promise<void> {}
  async select(ctx: Context<APIMessageComponentInteraction>): Promise<void> {}
  async modal(ctx: Context<APIModalSubmitInteraction>): Promise<void> {}
  async autocomplete(
    ctx: Context<APIApplicationCommandAutocompleteInteraction>
  ): Promise<void> {}
  /* eslint-enable */

  toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody {
    const pl: RESTPostAPIChatInputApplicationCommandsJSONBody = {
      type: this.type,
      name: this.defaultName,
      name_localizations: this.name_localizations,
      description: this.defaultDescription,
      description_localizations: this.description_localizations,
      default_member_permissions: this.default_member_permissions,
      dm_permission: this.dm_permission,
      options: this.options,
    };

    if (this.subCommands.length) {
      pl.options = pl.options?.concat(this.subCommands.map(s => s.toJSON()));
    }

    return pl;
  }
}

export abstract class SubCommandGroup
  implements APIApplicationCommandSubcommandGroupOption
{
  readonly type = ApplicationCommandOptionType.SubcommandGroup;
  defaultName = '';
  abstract name: keyof Messages;
  name_localizations = {};
  defaultDescription = '';
  abstract description: keyof Messages;
  description_localizations = {};

  options?: APIApplicationCommandSubcommandOption[] = [];
  subCommands: SubCommand[] = [];

  init(l: LocalizationService): this {
    localize(this, l);
    return this;
  }

  toJSON(): APIApplicationCommandSubcommandGroupOption {
    const pl: APIApplicationCommandSubcommandGroupOption = {
      type: this.type,
      name: this.defaultName,
      name_localizations: this.name_localizations,
      description: this.defaultDescription,
      description_localizations: this.description_localizations,
      options: this.options,
    };

    if (this.subCommands.length) {
      pl.options = pl.options?.concat(this.subCommands.map(s => s.toJSON()));
    }

    return pl;
  }
}

export abstract class SubCommand
  implements APIApplicationCommandSubcommandOption
{
  readonly type = ApplicationCommandOptionType.Subcommand;
  defaultName = '';
  abstract name: keyof Messages;
  name_localizations = {};
  defaultDescription = '';
  abstract description: keyof Messages;
  description_localizations = {};

  options: APIApplicationCommandBasicOption[] = [];

  buttonIds: string[] = [];
  selectIds: string[] = [];
  modalIds: string[] = [];
  autocompleteIds: string[] = [];

  // TODO: is there a better way to do this?
  /* eslint-disable @typescript-eslint/no-unused-vars */
  abstract command(
    ctx: Context<APIApplicationCommandInteraction>
  ): Promise<void>;
  async button(ctx: Context<APIMessageComponentInteraction>): Promise<void> {}
  async select(ctx: Context<APIMessageComponentInteraction>): Promise<void> {}
  async modal(ctx: Context<APIModalSubmitInteraction>): Promise<void> {}
  async autocomplete(
    ctx: Context<APIApplicationCommandAutocompleteInteraction>
  ): Promise<void> {}
  /* eslint-enable */

  init(l: LocalizationService): this {
    localize(this, l);
    return this;
  }

  toJSON(): APIApplicationCommandSubcommandOption {
    return {
      type: this.type,
      name: this.defaultName,
      name_localizations: this.name_localizations,
      description: this.defaultDescription,
      description_localizations: this.description_localizations,
      options: this.options,
    };
  }
}

export type CommandFunction = (
  ctx: Context<APIApplicationCommandInteraction>
) => Promise<void>;

export type ButtonFunction = (
  ctx: Context<APIMessageComponentInteraction>
) => Promise<void>;

export type SelectFunction = (
  ctx: Context<APIMessageComponentInteraction>
) => Promise<void>;

export type ModalFunction = (
  ctx: Context<APIModalSubmitInteraction>
) => Promise<void>;

export type AutocompleteFunction = (
  ctx: Context<APIApplicationCommandAutocompleteInteraction>
) => Promise<void>;
