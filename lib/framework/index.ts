import {Instance} from '@prisma/client';
import {
  APIApplicationCommandAutocompleteInteraction,
  APIChatInputApplicationCommandInteraction,
  APIInteraction,
  APIInteractionResponse,
  APIMessageApplicationCommandInteraction,
  APIMessageComponentInteraction,
  APIModalSubmitInteraction,
  APIPingInteraction,
  APIUserApplicationCommandInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ComponentType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
} from 'discord-api-types/v9';
import EventEmitter from 'events';
import {FastifyReply, FastifyRequest} from 'fastify';
import {readdirSync} from 'fs';
import path from 'path';

import {
  AutocompleteFunction,
  ButtonFunction,
  Command,
  CommandModule,
  CommandModuleSubClass,
  Context,
  Database,
  HttpStatusCode,
  LocalizationService,
  ModalFunction,
  SelectFunction,
  SubCommand,
  SubCommandGroup,
  verifyInteraction,
} from '..';

const MODULE_DIR = path.join(__dirname, '../../src/cmds');

export enum Events {
  PING = 'ping',
  COMMAND = 'command',
  USER_CONTEXT_COMMAND = 'user_context_command',
  MESSAGE_CONTEXT_COMMAND = 'message_context_command',
  BUTTON = 'button',
  SELECT = 'select',
  AUTOCOMPLETE = 'autocomplete',
  MODAL = 'modal',
}

export type FrameworkEvents = {
  [Events.PING]: [Context<APIPingInteraction>];
  [Events.COMMAND]: [Context<APIChatInputApplicationCommandInteraction>];
  [Events.MESSAGE_CONTEXT_COMMAND]: [
    Context<APIMessageApplicationCommandInteraction>
  ];
  [Events.USER_CONTEXT_COMMAND]: [
    Context<APIUserApplicationCommandInteraction>
  ];
  [Events.COMMAND]: [Context<APIChatInputApplicationCommandInteraction>];
  [Events.AUTOCOMPLETE]: [
    Context<APIApplicationCommandAutocompleteInteraction>
  ];
  [Events.BUTTON]: [Context<APIMessageComponentInteraction>];
  [Events.SELECT]: [Context<APIMessageComponentInteraction>];
  [Events.MODAL]: [Context<APIModalSubmitInteraction>];
};

const getAndExecFn = async <
  T extends APIInteraction,
  U extends
    | ButtonFunction
    | SelectFunction
    | ModalFunction
    | AutocompleteFunction
>(
  id: string,
  ctx: Context<T>,
  map: Map<string, U>
) => {
  const fn = map.get(id);
  if (!fn) {
    return;
  }

  try {
    await fn(ctx as any); // eslint-disable-line
  } catch (err) {
    console.error(`Error while executing handler for: ${id}:`, err);
  }
};

export class Framework extends EventEmitter<FrameworkEvents> {
  readonly modules = new Map<string, CommandModule>();
  readonly cmds = new Map<string, Command>();

  readonly buttonFns = new Map<string, ButtonFunction>();
  readonly selectFns = new Map<string, SelectFunction>();
  readonly modalFns = new Map<string, ModalFunction>();
  readonly autocompleteFns = new Map<string, AutocompleteFunction>();

  ['constructor']: typeof Framework;

  constructor(readonly db: Database, readonly locales: LocalizationService) {
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

    const ctx = new Context({
      framework: this,
      instance,
      interaction: body,
    });

    const localize = ctx.localizer();

    const usable = await this.checkInstanceUsability(
      instance,
      r.params.id,
      body.guild_id
    );

    if (!usable) {
      const content = await localize.user('err_bot-unusable');
      return {
        type: InteractionResponseType.ChannelMessageWithSource,
        data: {
          content,
          flags: MessageFlags.Ephemeral,
        },
      };
    }

    this.handleInteraction(r.body, instance);
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

  handleInteraction(i: APIInteraction, instance: Instance) {
    const mkCtx = <T extends APIInteraction>(i: T) =>
      new Context({
        framework: this,
        interaction: i,
        instance,
      });

    // TODO: can this be cleaned up?
    switch (i.type) {
      case InteractionType.Ping: {
        this.emit(Events.PING, mkCtx(i));
        break;
      }

      case InteractionType.ApplicationCommand: {
        switch (i.data.type) {
          case ApplicationCommandType.ChatInput: {
            const ctx = mkCtx(i as APIChatInputApplicationCommandInteraction);
            this.emit(Events.COMMAND, ctx);

            const cmd = this.routeCommand(
              i as APIChatInputApplicationCommandInteraction
            );
            if (!cmd) {
              return;
            }

            try {
              cmd.command(ctx);
            } catch (err) {
              console.error(`Error while running command: ${cmd.name}:`, err);
            }
            break;
          }

          // TODO: should context commands be handled the same way as other interaction types?
          case ApplicationCommandType.Message: {
            this.emit(
              Events.MESSAGE_CONTEXT_COMMAND,
              mkCtx(i as APIMessageApplicationCommandInteraction)
            );
            break;
          }

          case ApplicationCommandType.User: {
            this.emit(
              Events.USER_CONTEXT_COMMAND,
              mkCtx(i as APIUserApplicationCommandInteraction)
            );
            break;
          }
        }
        break;
      }

      case InteractionType.ApplicationCommandAutocomplete: {
        const ctx = mkCtx(i);
        this.emit(Events.AUTOCOMPLETE, ctx);

        const cmd = this.routeCommand(i);
        if (!cmd) {
          return;
        }

        try {
          cmd.autocomplete(ctx);
        } catch (err) {
          console.error(`Error while executing handler for: ${cmd.name}:`, err);
        }
        break;
      }

      // TODO: is there a better type for button+select than Context<APIMessageComponentInteraction>
      case InteractionType.MessageComponent: {
        switch (i.data.component_type) {
          case ComponentType.Button: {
            const ctx = mkCtx(i);
            this.emit(Events.BUTTON, ctx);
            // TODO: is it a problem to not await this?
            getAndExecFn(i.data.custom_id, ctx, this.buttonFns);
            break;
          }

          case ComponentType.SelectMenu: {
            const ctx = mkCtx(i);
            this.emit(Events.SELECT, ctx);
            getAndExecFn(i.data.custom_id, ctx, this.selectFns);
            break;
          }
        }
        break;
      }

      case InteractionType.ModalSubmit: {
        const ctx = mkCtx(i);
        this.emit(Events.MODAL, ctx);
        getAndExecFn(i.data.custom_id, ctx, this.modalFns);
        break;
      }
    }
  }

  routeCommand(
    i:
      | APIChatInputApplicationCommandInteraction
      | APIApplicationCommandAutocompleteInteraction
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

  async loadModules() {
    const mods = await this.constructor.discoverModules();

    for (const Mod of mods) {
      const m = new Mod();
      this.modules.set(m.name, m);

      for (const cmd of m.commands) {
        this.cmds.set(cmd.name, cmd);

        const ld = <
          T extends
            | ButtonFunction
            | SelectFunction
            | ModalFunction
            | AutocompleteFunction
        >(
          ids: string[],
          fn: T,
          map: Map<string, T>
        ) => {
          for (const id of ids) {
            map.set(id, fn);
          }
        };

        const loadIds = (c: Command | SubCommand) => {
          ld(c.buttonIds, c.button.bind(c), this.buttonFns);
          ld(c.modalIds, c.modal.bind(c), this.modalFns);
          ld(c.selectIds, c.select.bind(c), this.selectFns);
          ld(c.autocompleteIds, c.autocomplete.bind(c), this.autocompleteFns);
        };

        loadIds(cmd);
        for (const grp of cmd.subCommands) {
          if (grp instanceof SubCommandGroup) {
            for (const sub of grp.subCommands) {
              loadIds(sub);
            }
          } else {
            loadIds(grp);
          }
        }
      }
    }
  }

  static async discoverModules(): Promise<CommandModuleSubClass[]> {
    const modsDir = readdirSync(MODULE_DIR, {withFileTypes: true})
      .filter(f => f.isDirectory())
      .map(f => path.join(MODULE_DIR, f.name));

    let mods: CommandModuleSubClass[] = [];

    for (const modDir of modsDir) {
      const mod = readdirSync(modDir, {withFileTypes: true}).find(
        d =>
          d.isFile() &&
          d.name === (__filename.endsWith('js') ? 'index.js' : 'index.ts')
      );

      if (mod) {
        const modFile = path.join(modDir, mod.name);
        const imported = await import(modFile);

        const loadedMods = Object.values(imported).filter(
          m => Object.getPrototypeOf(m) === CommandModule
        ) as CommandModuleSubClass[];

        mods = mods.concat(loadedMods);
      }
    }

    return mods;
  }
}

export * from './context';
export * from './command';
export * from './module';
