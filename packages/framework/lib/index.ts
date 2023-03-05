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
  InteractionResponseType,
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
  Ping = 'ping',
  Command = 'command',
  UserContextCommand = 'user_context_command',
  MessageComponentCommand = 'message_context_command',
  Button = 'button',
  Select = 'select',
  Autocomplete = 'autocomplete',
  Modal = 'modal',
}

export type FrameworkEvents = {
  [Events.Ping]: [Context<APIPingInteraction>];
  [Events.Command]: [Context<APIChatInputApplicationCommandInteraction>];
  [Events.MessageComponentCommand]: [
    Context<APIMessageApplicationCommandInteraction>
  ];
  [Events.UserContextCommand]: [Context<APIUserApplicationCommandInteraction>];
  [Events.Command]: [Context<APIChatInputApplicationCommandInteraction>];
  [Events.Autocomplete]: [
    Context<APIApplicationCommandAutocompleteInteraction>
  ];
  [Events.Button]: [Context<APIMessageComponentInteraction>];
  [Events.Select]: [Context<APIMessageComponentInteraction>];
  [Events.Modal]: [Context<APIModalSubmitInteraction>];
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
  map: Map<string | RegExp, U>
) => {
  // map.get is O(1) so if the ID name is constant, it will be faster than Array::find
  const fn =
    map.get(id) ||
    [...map.entries()].find(([k]: readonly [string | RegExp, U]) =>
      typeof k === 'string'
        ? id.toLowerCase().startsWith(k.toLowerCase())
        : k.test(id.toLowerCase())
    )?.[1];
  if (!fn) {
    return;
  }

  try {
    await fn(ctx as any); // eslint-disable-line
  } catch (err) {
    console.error(`Error while executing handler for: ${id}:`, err);
  }
};

// ugly hack to localize commands and set
// their ID (used for command mentions in chat)
const initCommands = (
  l: LocalizationService,
  cmds: Command[],
  fw?: Framework,
  remoteCmds?: APIApplicationCommand[]
) => {
  for (const cmd of cmds) {
    cmd.init(l);
    cmd.framework = fw!;

    const remoteCmd = remoteCmds?.find(c => c.name === cmd.defaultName);
    cmd.remoteCmd = remoteCmd;

    for (const grp of cmd.subCommands) {
      if (grp instanceof SubCommandGroup) {
        grp.init(l);
        grp.framework = fw!;
        grp.remoteCmd = remoteCmd;
        for (const sub of grp.subCommands) {
          sub.init(l);
          sub.framework = fw!;
          sub.remoteCmd = remoteCmd;
        }
      } else {
        grp.init(l);
        grp.framework = fw!;
        grp.remoteCmd = remoteCmd;
      }
    }
  }
};

export class Framework extends EventEmitter<FrameworkEvents> {
  readonly modules = new Map<string, CommandModule>();
  readonly cmds = new Map<string, Command>();

  readonly buttonFns = new Map<string | RegExp, ButtonFunction>();
  readonly selectFns = new Map<string | RegExp, SelectFunction>();
  readonly modalFns = new Map<string | RegExp, ModalFunction>();
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
      api: proxyURL || 'https://discord.com/api',
    }).setToken(config.discord_application.token);
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
      await w
        .status(HttpStatusCode.OK)
        .send({type: InteractionResponseType.Pong});
      return w;
    }

    await this.handleInteraction(body, r, w);

    if (!w.sent) {
      await w.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send();
      return w;
    }

    return w;
  }

  async handleInteraction(
    i: APIInteraction,
    req: FastifyRequest,
    reply: FastifyReply
  ) {
    const mkCtx = <T extends APIInteraction>(i: T) =>
      new Context({
        framework: this,
        interaction: i,
        req,
        reply,
      });

    // TODO: can this be cleaned up?
    switch (i.type) {
      case InteractionType.Ping: {
        this.emit(Events.Ping, mkCtx(i));
        break;
      }

      case InteractionType.ApplicationCommand: {
        switch (i.data.type) {
          case ApplicationCommandType.ChatInput: {
            const ctx = mkCtx(i as APIChatInputApplicationCommandInteraction);
            this.emit(Events.Command, ctx);

            const cmd = this.routeCommand(
              i as APIChatInputApplicationCommandInteraction
            );
            if (!cmd) {
              return;
            }

            try {
              await cmd.command(ctx);
            } catch (err) {
              console.error(`Error while running command: ${cmd.name}:`, err);
            }
            break;
          }

          // TODO: should context commands be handled the same way as other interaction types?
          case ApplicationCommandType.Message: {
            this.emit(
              Events.MessageComponentCommand,
              mkCtx(i as APIMessageApplicationCommandInteraction)
            );
            break;
          }

          case ApplicationCommandType.User: {
            this.emit(
              Events.UserContextCommand,
              mkCtx(i as APIUserApplicationCommandInteraction)
            );
            break;
          }
        }
        break;
      }

      case InteractionType.ApplicationCommandAutocomplete: {
        const ctx = mkCtx(i);
        this.emit(Events.Autocomplete, ctx);

        const cmd = this.routeCommand(i);
        if (!cmd) {
          return;
        }

        try {
          await cmd.autocomplete(ctx);
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
            this.emit(Events.Button, ctx);
            // TODO: is it a problem to not await this?
            await getAndExecFn(i.data.custom_id, ctx, this.buttonFns);
            break;
          }

          // TODO: other select types
          case ComponentType.StringSelect: {
            const ctx = mkCtx(i);
            this.emit(Events.Select, ctx);
            await getAndExecFn(i.data.custom_id, ctx, this.selectFns);
            break;
          }
        }
        break;
      }

      case InteractionType.ModalSubmit: {
        const ctx = mkCtx(i);
        this.emit(Events.Modal, ctx);
        await getAndExecFn(i.data.custom_id, ctx, this.modalFns);
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

  mentionCmd(cmd: string) {
    const MD_MENTION = `\`/${cmd}\``;

    const [name] = cmd.split(' ');
    const c = this.cmds.get(name);

    if (!c || !c.remoteCmd) {
      return MD_MENTION;
    }

    return `</${cmd}:${c.remoteCmd.id}>`;
  }

  async loadModules() {
    const mods = await this.constructor.discoverModules();

    for (const Mod of mods) {
      const m = new Mod();
      this.modules.set(m.name, m);

      const cmds = (await this.rest.get(
        Routes.applicationCommands(this.config.discord_application.id)
      )) as APIApplicationCommand[];

      initCommands(this.locales, m.commands, this, cmds);
      for (const cmd of m.commands) {
        this.cmds.set(cmd.defaultName, cmd);

        const ld = <
          T extends
            | ButtonFunction
            | SelectFunction
            | ModalFunction
            | AutocompleteFunction
        >(
          ids: (string | RegExp)[],
          fn: T,
          map: Map<string | RegExp, T>
        ) => {
          for (const id of ids) {
            map.set(id, fn);
          }
        };

        const loadIds = (c: Command | SubCommand) => {
          ld(c.buttonIDs, c.button.bind(c), this.buttonFns);
          ld(c.modalIDs, c.modal.bind(c), this.modalFns);
          ld(c.selectIDs, c.select.bind(c), this.selectFns);
          ld(c.autocompleteIDs, c.autocomplete.bind(c), this.autocompleteFns);
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
    adminServers: string[] = []
  ): Promise<{
    global: APIApplicationCommand[];
    admin: {[key: string]: APIApplicationCommand[]};
  }> {
    const applicationID = Buffer.from(token.split('.')[0], 'base64').toString();
    const rest = new REST().setToken(token);

    let publicCmds: Command[] = [];
    let adminCmds: Command[] = [];
    const mods = await this.discoverModules();
    for (const Mod of mods) {
      const m = new Mod();
      publicCmds = publicCmds.concat(m.commands.filter(c => !c.adminCommand));
      adminCmds = adminCmds.concat(m.commands.filter(c => c.adminCommand));
      initCommands(l, publicCmds);
    }

    const createdGlobal = (await rest.put(
      Routes.applicationCommands(applicationID),
      {body: publicCmds.map(c => c.toJSON())}
    )) as APIApplicationCommand[];

    const createdAdmin: {[key: string]: APIApplicationCommand[]} = {};
    for (const adminServer of adminServers) {
      createdAdmin[adminServer] = (await rest.put(
        Routes.applicationGuildCommands(applicationID, adminServer),
        {body: adminCmds.map(c => c.toJSON())}
      )) as APIApplicationCommand[];
    }

    return {global: createdGlobal, admin: createdAdmin};
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
