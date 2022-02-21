import {APIChatInputApplicationCommandInteraction} from 'discord-api-types/v9';

import {Context, SubCommand} from 'suggester';

export class TestSubCommandB extends SubCommand {
  name = 'b';
  description = 'test subcommand b';

  async run(
    ctx: Context<APIChatInputApplicationCommandInteraction>
  ): Promise<void> {
    console.log('subcommand B');
  }
}
