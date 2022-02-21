import {Instance} from '@prisma/client';
import {
  APIApplicationCommandAutocompleteInteraction,
  APIChatInputApplicationCommandInteraction,
  APIInteraction,
  APIInteractionResponse,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
  APIPingInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v9';
import EventEmitter from 'events';
import {FastifyReply, FastifyRequest} from 'fastify';

import {
  Context,
  Database,
  HttpStatusCode,
  LocalizationService,
  verifyInteraction,
} from '..';
import {Command, SubCommand, SubCommandGroup} from './command';

export type FrameworkEvents = {
  [InteractionType.Ping]: [Context<APIPingInteraction>];
  [InteractionType.ApplicationCommand]: [
    Context<APIChatInputApplicationCommandInteraction>
  ];
  [InteractionType.ApplicationCommandAutocomplete]: [
    Context<APIApplicationCommandAutocompleteInteraction>
  ];
  [InteractionType.MessageComponent]: [Context<APIMessageComponentInteraction>];
  [InteractionType.ModalSubmit]: [Context<APIModalSubmitInteraction>];
};

export class Framework extends EventEmitter<FrameworkEvents> {
  constructor(readonly db: Database, readonly locales: LocalizationService, readonly cmds: Map<string, Command>) {
    super();
  }

  async handleRequest(
    r: FastifyRequest<{
      Body: APIInteraction;
      Params: {id: string};
      Headers: {
        'x-signature-ed25519': string;
        'x-signature-timestamp': string;
      };
    }>,
    w: FastifyReply
  ): Promise<APIInteractionResponse | void> {
    const instance = await this.db.instances.get(r.params.id);
    if (!instance) {
      w.code(HttpStatusCode.NOT_FOUND).send();
      return;
    }

    const time = r.headers['x-signature-timestamp'];
    const sig = r.headers['x-signature-ed25519'];
    const body = r.body;

    const isVerified = await verifyInteraction(
      instance.publicKey,
      body,
      time,
      sig
    );

    if (!isVerified) {
      w.code(HttpStatusCode.UNAUTHORIZED).send();
      return;
    }

    if (body.type === InteractionType.Ping) {
      return {type: 1};
    }

    const usable = await this.checkInstanceUsability(
      instance,
      r.params.id,
      body.guild_id
    );

    if (!usable) {
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          // TODO: localize
          content: ':x: This bot cannot be used in this server.',
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    this.handleInteraction(r.body);

    w.send();
    return;
  }

  async checkInstanceUsability(
    instance: Instance,
    botId: string,
    guildId: string | undefined
  ): Promise<boolean> {
    if (instance.public || !guildId) {
      return true;
    }

    return this.db.instanceGuilds.checkInstanceUsability({botId, guildId});
  }

  handleInteraction(i: APIInteraction) {
    const mkCtx = <T extends APIInteraction>(i: T) =>
      new Context({
        db: this.db,
        locales: this.locales,
        framework: this,
        interaction: i,
      });

    // TODO: can this be cleaned up?
    switch (i.type) {
      case InteractionType.Ping: {
        this.emit(InteractionType.Ping, mkCtx(i));
        break;
      }

      case InteractionType.ApplicationCommand: {
        // TODO: support context menus
        if (i.data.type !== ApplicationCommandType.ChatInput) {
          return;
        }

        this.emit(
          InteractionType.ApplicationCommand,
          mkCtx(i) as Context<APIChatInputApplicationCommandInteraction>
        );
        break;
      }

      case InteractionType.ApplicationCommandAutocomplete: {
        this.emit(InteractionType.ApplicationCommandAutocomplete, mkCtx(i));
        break;
      }

      case InteractionType.MessageComponent: {
        this.emit(InteractionType.MessageComponent, mkCtx(i));
        break;
      }

      case InteractionType.ModalSubmit: {
        this.emit(InteractionType.ModalSubmit, mkCtx(i));
        break;
      }
    }
  }

  routeCommand(
    i: APIChatInputApplicationCommandInteraction
  ): Command | SubCommand | undefined {
    const cmdName = i.data.name;
    const cmd = this.cmds.get(cmdName);
    if (!cmd) {
      return;
    }

    let run: Command | SubCommand = cmd;

    const ops = i.data.options;
    if (ops?.length === 1) {
      const [op] = ops;
      if (op.type === ApplicationCommandOptionType.SubcommandGroup) {
        const [subCmd] = op.options;

        const cg = cmd.subCommands.find(
          c => c.type === ApplicationCommandOptionType.SubcommandGroup
        ) as SubCommandGroup | undefined;

        if (cg) {
          const sc = cg.subCommands.find(c => c.name === subCmd.name);

          if (sc) {
            run = sc;
          }
        }
      } else if (op.type === ApplicationCommandOptionType.Subcommand) {
        const sc = cmd.subCommands.find(
          c =>
            c.type === ApplicationCommandOptionType.Subcommand &&
            c.name === op.name
        ) as SubCommand | undefined;

        if (sc) {
          run = sc;
        }
      }
    }

    return run;
  }
}

export * from './command';
export * from './module';
