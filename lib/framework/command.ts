import {
  APIApplicationCommandBasicOption,
  APIApplicationCommandInteraction,
  APIApplicationCommandOption,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
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

  async run(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    ctx;
    return;
  }

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

  abstract run(ctx: Context<APIApplicationCommandInteraction>): Promise<void>;

  toJSON(): APIApplicationCommandSubcommandOption {
    return {
      type: this.type,
      name: this.name,
      description: this.description,
      options: this.options,
    };
  }
}
