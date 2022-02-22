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
} from 'discord-api-types/v9';

import {Context} from '..';

export abstract class Command
  implements RESTPostAPIChatInputApplicationCommandsJSONBody
{
  readonly type = ApplicationCommandType.ChatInput;
  abstract name: string;
  abstract description: string;
  defaultPermission = true;
  options: APIApplicationCommandOption[] = [];
  subCommands: (SubCommand | SubCommandGroup)[] = [];

  buttonIds: string[] = [];
  selectIds: string[] = [];
  modalIds: string[] = [];
  autocompleteIds: string[] = [];

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
      name: this.name,
      description: this.description,
      default_permission: this.defaultPermission,
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
  abstract name: string;
  abstract description: string;
  options?: APIApplicationCommandSubcommandOption[] = [];
  subCommands: SubCommand[] = [];

  toJSON(): APIApplicationCommandSubcommandGroupOption {
    const pl: APIApplicationCommandSubcommandGroupOption = {
      type: this.type,
      name: this.name,
      description: this.description,
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
  abstract name: string;
  abstract description: string;
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

  toJSON(): APIApplicationCommandSubcommandOption {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
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
