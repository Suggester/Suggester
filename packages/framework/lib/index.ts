import crypto from 'node:crypto';
import EventEmitter from 'node:events';
import {readdirSync} from 'node:fs';
import path from 'node:path';

import {REST} from '@discordjs/rest';
import {
  APIApplicationCommand,
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
  InteractionType,
  Routes,
} from 'discord-api-types/v10';
import {verify} from 'discord-verify/node';
import {FastifyReply, FastifyRequest} from 'fastify';

import {Database} from '@suggester/database';
import {LocalizationService} from '@suggester/i18n';
import {HttpStatusCode} from '@suggester/util';
import {BotConfig} from '@suggester/util';

import {
  AutocompleteFunction,
  ButtonFunction,
  Command,
  ModalFunction,
  SelectFunction,
  SubCommand,
  SubCommandGroup,
} from './command';
import {Context} from './context';
import {CommandModule, CommandModuleSubClass} from './module';

const MODULE_DIR = path.join(
  process.cwd(),
  'services',
  'commands',
  __filename.endsWith('.js') ? 'build' : '',
  'src',
  'cmds'
);

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
  const fn = [...map.entries()].find(([k]) =>
    id.toLowerCase().startsWith(k.toLowerCase())
  );
  if (!fn) {
    return;
  }

  try {
    await fn[1](ctx as any); // eslint-disable-line
  } catch (err) {
    console.error(`Error while executing handler for: ${id}:`, err);
  }
};

const initCommands = (l: LocalizationService, cmds: Command[]) => {
  for (const cmd of cmds) {
    cmd.init(l);
    for (const grp of cmd.subCommands) {
      if (grp instanceof SubCommandGroup) {
        grp.init(l);
        for (const sub of grp.subCommands) {
          sub.init(l);
        }
      } else {
        grp.init(l);
      }
    }
  }
};

export class Framework extends EventEmitter<FrameworkEvents> {
  readonly modules = new Map<string, CommandModule>();
  readonly cmds = new Map<string, Command>();

  readonly buttonFns = new Map<string, ButtonFunction>();
  readonly selectFns = new Map<string, SelectFunction>();
  readonly modalFns = new Map<string, ModalFunction>();
  readonly autocompleteFns = new Map<string, AutocompleteFunction>();

  readonly db: Database;
  readonly locales: LocalizationService;
  readonly config: BotConfig;

  readonly rest: REST;

  ['constructor']!: typeof Framework;

  constructor({
    db,
    locales,
    config,
    proxyURL = undefined,
  }: {
    readonly db: Database;
    readonly locales: LocalizationService;
    readonly config: BotConfig;
    readonly proxyURL?: string;
  }) {
    super();

    this.db = db;
    this.locales = locales;
    this.config = config;

    this.rest = new REST({
      api: proxyURL,
    });
  }

  async handleRequest(
    r: FastifyRequest<{
      Body: APIInteraction;
      Headers: {
        'x-signature-ed25519': string;
        'x-signature-timestamp': string;
      };
    }>,
    w: FastifyReply
  ): Promise<APIInteractionResponse | void> {
    const body = r.body;
    const publicKey = this.config.discord_application.public_key;

    const time = r.headers['x-signature-timestamp'];
    const sig = r.headers['x-signature-ed25519'];

    const isVerified = await verify(
      JSON.stringify(body),
      sig,
      time,
      publicKey,
      crypto.webcrypto.subtle
    );

    if (!isVerified) {
      await w.code(HttpStatusCode.UNAUTHORIZED).send();
      return w;
    }

    if (body.type === InteractionType.Ping) {
      await w.status(HttpStatusCode.OK).send({type: 1});
      return w;
    }
    this.handleInteraction(body);

    return w;
  }

  handleInteraction(i: APIInteraction) {
    const mkCtx = <T extends APIInteraction>(i: T) =>
      new Context({
        framework: this,
        interaction: i,
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

          // TODO: other select types
          case ComponentType.StringSelect: {
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
          c =>
            c.type === ApplicationCommandOptionType.SubcommandGroup &&
            c.defaultName === op.name
        ) as SubCommandGroup | undefined;

        if (cg) {
          const sc = cg.subCommands.find(c => c.defaultName === subCmd.name);

          if (sc) {
            run = sc;
          }
        }
      } else if (op.type === ApplicationCommandOptionType.Subcommand) {
        const sc = cmd.subCommands.find(
          c =>
            c.type === ApplicationCommandOptionType.Subcommand &&
            c.defaultName === op.name
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

      initCommands(this.locales, m.commands);
      for (const cmd of m.commands) {
        this.cmds.set(cmd.defaultName, cmd);

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

  static async bulkCreateCommands(
    l: LocalizationService,
    token: string,
    guildID?: string
  ): Promise<APIApplicationCommand[]> {
    const applicationID = Buffer.from(token.split('.')[0], 'base64').toString();
    const rest = new REST().setToken(token);

    let cmds: Command[] = [];
    const mods = await this.discoverModules();
    for (const Mod of mods) {
      const m = new Mod();
      cmds = cmds.concat(m.commands);
      initCommands(l, cmds);
    }

    const json = cmds.map(c => c.toJSON());

    const url = guildID
      ? Routes.applicationGuildCommands(applicationID, guildID)
      : Routes.applicationCommands(applicationID);

    const created: APIApplicationCommand[] = (await rest.put(url, {
      body: json,
    })) as APIApplicationCommand[];

    return created;
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
