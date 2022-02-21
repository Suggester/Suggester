import {APIChatInputApplicationCommandInteraction} from 'discord-api-types/v9';

import {Context, SubCommand} from 'suggester';

export class TestSubCommandA extends SubCommand {
  name = 'a';
  description = 'test subcommand a';

  async run(
    ctx: Context<APIChatInputApplicationCommandInteraction>
  ): Promise<void> {
    await ctx.send({
      content: 'OwO',
    });

    const second = await ctx.followup({
      content: 'OwO 2',
    });

    const third = await ctx.followup({
      content: 'OwO 3',
    });

    await ctx.edit(second.id, {content: 'owo'});
    await ctx.delete('@original');
    console.log(third);
  }
}
