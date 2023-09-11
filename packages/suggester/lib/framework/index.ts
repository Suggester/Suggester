import {webcrypto} from 'node:crypto';
import EventEmitter from 'node:events';
import path from 'node:path';

import {REST} from '@discordjs/rest';
import * as Sentry from '@sentry/node';
import {Scope} from '@sentry/node';
import {
  APIApplicationCommand,
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteractionDataOption,
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
  RESTPostAPIChannelMessageJSONBody,
  Routes,
} from 'discord-api-types/v10';
import {FastifyReply, FastifyRequest} from 'fastify';

import {LocalizationService} from '@suggester/i18n';

import {Database} from '@suggester/database';
import {
  BotConfig,
  BufferedQueue,
  EmbedBuilder,
  HttpStatusCode,
  LogAction,
  LogData,
  LogEmbed,
  readdir,
} from '../util';
import {
  AutocompleteFunction,
  ButtonFunction,
  Command,
  CommandSubClass,
  ModalFunction,
  SelectFunction,
  SubCommand,
  SubCommandGroup,
} from './command';
import {Context} from './context';

// import {LogAction, LogData} from './logging';

const COMMAND_DIR = path.join(
  process.cwd(),
  // 'services',
  // 'commands',
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
  U extends ButtonFunction | SelectFunction | ModalFunction
>(
  id: string,
  ctx: Context<T>,
  map: Map<string | RegExp, U>,
  kind: string
) => {
  ctx.scope.setTag('handler', kind);

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
    console.error(`Error while executing ${kind} handler for: ${id}:`, err);

    Sentry.captureException(err, ctx.scope);
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
  #interactionPubKey!: webcrypto.CryptoKey;

  readonly cmds = new Map<string, Command>();

  readonly buttonFns = new Map<string | RegExp, ButtonFunction>();
  readonly selectFns = new Map<string | RegExp, SelectFunction>();
  readonly modalFns = new Map<string | RegExp, ModalFunction>();
  readonly autocompleteFns = new Map<string, AutocompleteFunction>();

  readonly logQueue = new BufferedQueue<LogData>().setHandler(
    this.#handleLog.bind(this)
  );

  readonly db: Database;
  readonly locales: LocalizationService;
  readonly config: BotConfig;

  readonly rest: REST;

  ['constructor']!: typeof Framework;

  constructor({
    db,
    locales,
    config,
    proxyURL = 'https://discord.com/api',
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

  async #handleLog(topic: string, data: LogData[]) {
    console.log(
      'handle',
      topic,
      data.map(d => LogAction[d.action])
    );

    const buildEmbeds = (data: LogData[]): EmbedBuilder[] => {
      const langCode = data[0].localizer.getGuildLocale();

      return data.map(d => new LogEmbed(d).localize(d.localizer, langCode));
    };

    const embeds = buildEmbeds(data);

    await this.rest.post(Routes.channelMessages(topic), {
      body: {
        embeds,
      } as RESTPostAPIChannelMessageJSONBody,
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
    const scope = new Scope();

    const body = r.body;

    const time = r.headers['x-signature-timestamp'];
    const sig = r.headers['x-signature-ed25519'];

    const isVerified = await webcrypto.subtle.verify(
      'Ed25519',
      this.#interactionPubKey,
      Buffer.from(sig, 'hex'),
      Buffer.from(time + JSON.stringify(body))
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

    const dUser = body.member?.user || body.user;
    scope.setUser({
      id: dUser?.id || 'unknown',
      username: dUser
        ? `${dUser.username}#${dUser.discriminator}`
        : 'Unknown#0000',
    });

    await this.handleInteraction(body, r, w, scope);

    if (!w.sent) {
      await w.code(HttpStatusCode.INTERNAL_SERVER_ERROR).send();
      return w;
    }

    return w;
  }

  async handleInteraction(
    i: APIInteraction,
    req: FastifyRequest,
    reply: FastifyReply,
    scope: Scope
  ) {
    const mkCtx = <T extends APIInteraction>(i: T) =>
      new Context({
        framework: this,
        interaction: i,
        req,
        reply,
        scope,
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

            scope.setTag('handler', 'command');
            scope.setTag('command', ctx.interaction.data.name);

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
              console.error(
                `Error while running command: ${cmd.defaultName}:`,
                err
              );

              Sentry.captureException(err, scope);
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

        scope.setTag('command', ctx.interaction.data.name);
        scope.setTag('handler', 'autocomplete');

        this.emit(Events.Autocomplete, ctx);

        const cmd = this.routeCommand(i);
        if (!cmd) {
          return;
        }

        try {
          await cmd.autocomplete(ctx);
        } catch (err) {
          console.error(
            `Error while executing autocomplete handler for: ${cmd.defaultName}:`,
            err
          );
          Sentry.captureException(err, scope);
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
            await getAndExecFn(i.data.custom_id, ctx, this.buttonFns, 'button');
            break;
          }

          // TODO: other select types
          case ComponentType.StringSelect: {
            const ctx = mkCtx(i);
            this.emit(Events.Select, ctx);
            await getAndExecFn(i.data.custom_id, ctx, this.selectFns, 'select');
            break;
          }
        }
        break;
      }

      case InteractionType.ModalSubmit: {
        const ctx = mkCtx(i);
        this.emit(Events.Modal, ctx);
        await getAndExecFn(i.data.custom_id, ctx, this.modalFns, 'modal');
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

  async init() {
    this.#interactionPubKey = await webcrypto.subtle.importKey(
      'raw',
      Buffer.from(this.config.discord_application.public_key, 'hex'),
      'Ed25519',
      true,
      ['verify']
    );

    await this.loadCommands();
  }

  async loadCommands() {
    const foundCmds = await this.constructor.discoverCommands();
    const cmds = foundCmds.map(C => new C());

    const remoteCmds = (await this.rest.get(
      Routes.applicationCommands(this.config.discord_application.id)
    )) as APIApplicationCommand[];

    initCommands(this.locales, cmds, this, remoteCmds);
    for (const cmd of cmds) {
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

    const cmds = await this.discoverCommands().then(cs => cs.map(C => new C()));
    initCommands(l, cmds);

    const {publicCmds, adminCmds} = cmds.reduce(
      (a, c) => {
        if (c.adminCommand) {
          a.adminCmds.push(c);
        } else {
          a.publicCmds.push(c);
        }

        return a;
      },
      {adminCmds: [], publicCmds: []} as {
        adminCmds: Command[];
        publicCmds: Command[];
      }
    );

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

  static async discoverCommands(): Promise<CommandSubClass[]> {
    let cmds: CommandSubClass[] = [];

    const cmdFiles = readdir(COMMAND_DIR, '.js');
    for await (const cmdFile of cmdFiles) {
      const imported = await import(cmdFile);
      const loadedCmds = Object.values(imported).filter(
        m => Object.getPrototypeOf(m) === Command
      ) as CommandSubClass[];

      cmds = cmds.concat(loadedCmds);
    }

    return cmds;
  }
}

export const stringifyCommand = (
  cmd:
    | APIChatInputApplicationCommandInteraction
    | APIApplicationCommandAutocompleteInteraction
) => {
  const fullcmd: (string | number | boolean)[] = [cmd.data.name];

  const down = (s: APIApplicationCommandInteractionDataOption[]) => {
    for (const op of s) {
      if ('value' in op && op.value) {
        fullcmd.push(`${op.name}:`, `\`${op.value}\``);
      } else {
        fullcmd.push(op.name);
      }

      if ('options' in op) {
        if (op.options) {
          down(op.options);
        }
      }
    }
  };

  if ('options' in cmd.data) {
    if (cmd.data.options) {
      down(cmd.data.options);
    }
  }

  return '/' + fullcmd.join(' ');
};

export * from './command';
export * from './context';
// export * from './logging';
