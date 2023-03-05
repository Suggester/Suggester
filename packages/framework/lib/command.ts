import {
  APIApplicationCommand,
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandBasicOption,
  APIApplicationCommandInteraction,
  APIApplicationCommandOption,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  APIChatInputApplicationCommandInteraction,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord-api-types/v10';

import {LocalizationService, MessageNames} from '@suggester/i18n';
import {DeepReadonly} from '@suggester/util';

import {Framework} from '.';
import {Context} from './context';

const toLocalizedMap = (
  l: LocalizationService,
  availableLocales: string[],
  key: MessageNames,
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

export abstract class Command {
  // implements RESTPostAPIChatInputApplicationCommandsJSONBody
  readonly type = ApplicationCommandType.ChatInput;
  defaultName = '';
  abstract name: MessageNames;
  name_localizations = {};
  defaultDescription = '';
  abstract description: MessageNames;
  description_localizations = {};
  default_member_permissions = '0';
  dm_permission = false;
  options: DeepReadonly<APIApplicationCommandOption[]> = [];
  subCommands: (SubCommand | SubCommandGroup)[] = [];

  /** adds the command as a guild command in these servers */
  guilds?: string[];
  /** makes the command a guild command only available in configured admin_servers */
  adminCommand = false;

  buttonIDs: (string | RegExp)[] = [];
  selectIDs: (string | RegExp)[] = [];
  modalIDs: (string | RegExp)[] = [];
  autocompleteIDs: (string | RegExp)[] = [];

  framework!: Framework;
  remoteCmd?: APIApplicationCommand;

  init(l: LocalizationService): this {
    localize(this, l);
    return this;
  }

  // TODO: is there a better way to do this?
  /* eslint-disable @typescript-eslint/no-unused-vars */
  async command(
    _ctx: Context<APIChatInputApplicationCommandInteraction>
  ): Promise<void> {}
  async button(_ctx: Context<APIMessageComponentInteraction>): Promise<void> {}
  async select(_ctx: Context<APIMessageComponentInteraction>): Promise<void> {}
  async modal(_ctx: Context<APIModalSubmitInteraction>): Promise<void> {}
  async autocomplete(
    _ctx: Context<APIApplicationCommandAutocompleteInteraction>
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
      options: this.options as APIApplicationCommandOption[],
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
  abstract name: MessageNames;
  name_localizations = {};
  defaultDescription = '';
  abstract description: MessageNames;
  description_localizations = {};

  options?: APIApplicationCommandSubcommandOption[] = [];
  subCommands: SubCommand[] = [];

  framework!: Framework;
  remoteCmd?: APIApplicationCommand;
  parent!: Command;

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

export abstract class SubCommand {
  readonly type = ApplicationCommandOptionType.Subcommand;
  defaultName = '';
  abstract name: MessageNames;
  name_localizations = {};
  defaultDescription = '';
  abstract description: MessageNames;
  description_localizations = {};

  options: DeepReadonly<APIApplicationCommandOption[]> = [];

  buttonIDs: (string | RegExp)[] = [];
  selectIDs: (string | RegExp)[] = [];
  modalIDs: (string | RegExp)[] = [];
  autocompleteIDs: (string | RegExp)[] = [];

  // TODO: is there a better way to do this?
  /* eslint-disable @typescript-eslint/no-unused-vars */
  abstract command(
    ctx: Context<APIChatInputApplicationCommandInteraction>
  ): Promise<void>;
  async button(_ctx: Context<APIMessageComponentInteraction>): Promise<void> {}
  async select(_ctx: Context<APIMessageComponentInteraction>): Promise<void> {}
  async modal(_ctx: Context<APIModalSubmitInteraction>): Promise<void> {}
  async autocomplete(
    _ctx: Context<APIApplicationCommandAutocompleteInteraction>
  ): Promise<void> {}
  /* eslint-enable */

  framework!: Framework;
  remoteCmd?: APIApplicationCommand;
  parent!: Command | SubCommandGroup;

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
      options: this.options as APIApplicationCommandBasicOption[],
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
