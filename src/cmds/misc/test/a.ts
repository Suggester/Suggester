import {APIChatInputApplicationCommandInteraction} from 'discord-api-types/v9';

import {Context, SubCommand} from 'suggester';

export class TestSubCommandA extends SubCommand {
  name = 'a';
  description = 'test subcommand a';

  async run(
    ctx: Context<APIChatInputApplicationCommandInteraction>
  ): Promise<void> {
    console.log('subcommand A');
  }
}
