import {
  APIApplicationCommandInteraction,
  APIApplicationCommandInteractionDataAttachmentOption,
  APIApplicationCommandOption,
  APIModalSubmitInteraction,
  ApplicationCommandOptionType,
  ComponentType,
  TextInputStyle,
} from 'discord-api-types/v10';

import {Command, Context, Messages} from 'suggester';

export class SuggestCommand extends Command {
  name: keyof Messages = 'command-name--suggest';
  description: keyof Messages = 'command-desc--suggest';
  options: APIApplicationCommandOption[] = [
    {
      type: ApplicationCommandOptionType.Attachment,
      name: 'attachment',
      description: 'Attach an image to your suggestion',
      required: false,
    },
  ];

  modalIds = ['create_suggestion'];

  async command(ctx: Context<APIApplicationCommandInteraction>): Promise<void> {
    const attachment =
      ctx.getOption<APIApplicationCommandInteractionDataAttachmentOption>(
        'attachment'
      );
    console.log(attachment);
    console.log(ctx.interaction.data);

    // await ctx.send({content: op?.value});
    // await ctx.send({content: ctx.getOption('test')!.value as string});
    await ctx.sendModal({
      title: 'Create Suggestion',
      custom_id: 'create_suggestion',
      components: [
        {
          type: ComponentType.ActionRow,
          components: [
            {
              type: ComponentType.TextInput,
              custom_id: 'create_suggestion_body',
              label: 'Suggestion Body',
              style: TextInputStyle.Paragraph,
              max_length: 4_000,
              min_length: 1,
              required: true,
            },
          ],
        },
      ],
    });
  }

  async modal(ctx: Context<APIModalSubmitInteraction>): Promise<void> {
    switch (ctx.interaction.data.custom_id) {
      case 'create_suggestion': {
        console.log('interaction:', ctx.interaction.message?.interaction);
        await ctx.send({
          content: 'aa',
        });
      }
    }
  }

  //   async modal(ctx: Context<APIModalSubmitInteraction>): Promise<void> {
  //     switch (ctx.interaction.data.custom_id) {
  //       case 'create_suggestion': {
  //         const body = ctx.getModalTextField('create_suggestion_body')!;
  //         await ctx.send({
  //           content: body.value,
  //           components: [
  //             {
  //               type: ComponentType.ActionRow,
  //               components: [
  //                 {
  //                   type: ComponentType.SelectMenu,
  //                   custom_id: 'suggest_select_test',
  //                   max_values: 3,
  //                   options: [
  //                     {
  //                       label: '1',
  //                       value: '1',
  //                     },
  //                     {
  //                       label: '2',
  //                       value: '2',
  //                     },
  //                     {
  //                       label: '3',
  //                       value: '3',
  //                     },
  //                     {
  //                       label: '4',
  //                       value: '4',
  //                     },
  //                   ],
  //                 },
  //               ],
  //             },
  //             {
  //               type: ComponentType.ActionRow,
  //               components: [
  //                 {
  //                   type: ComponentType.Button,
  //                   custom_id: 'suggest_button_1',
  //                   style: ButtonStyle.Primary,
  //                   label: 'AAAA',
  //                 },
  //                 {
  //                   type: ComponentType.Button,
  //                   custom_id: 'suggest_button_2',
  //                   style: ButtonStyle.Secondary,
  //                   label: 'BBBB',
  //                 },
  //               ],
  //             },
  //           ],
  //         });
  //       }
  //     }
  //   }

  //   async button(ctx: Context<APIMessageComponentInteraction>): Promise<void> {
  //     // TODO: can this be checked before calling button()?
  //     await ctx.send({content: ctx.getButtonID()});
  //   }

  //   async select(ctx: Context<APIMessageComponentInteraction>): Promise<void> {
  //     await ctx.send({content: ctx.getSelectValues().join(', ')});
  //   }

  //   async autocomplete(
  //     ctx: Context<APIApplicationCommandAutocompleteInteraction>
  //   ): Promise<void> {
  //     await ctx.sendAutocomplete({
  //       choices: [
  //         {
  //           name: 'owo',
  //           value: 'owo',
  //         },
  //       ],
  //     });
  //   }
}
