import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteractionDataAttachmentOption,
  APIApplicationCommandInteractionDataBasicOption,
  APIApplicationCommandInteractionDataBooleanOption,
  APIApplicationCommandInteractionDataChannelOption,
  APIApplicationCommandInteractionDataIntegerOption,
  APIApplicationCommandInteractionDataMentionableOption,
  APIApplicationCommandInteractionDataNumberOption,
  APIApplicationCommandInteractionDataOption,
  APIApplicationCommandInteractionDataRoleOption,
  APIApplicationCommandInteractionDataStringOption,
  APIApplicationCommandInteractionDataSubcommandGroupOption,
  APIApplicationCommandInteractionDataSubcommandOption,
  APIApplicationCommandInteractionDataUserOption,
  APIApplicationCommandOption,
  APIApplicationCommandSubcommandGroupOption,
  APIApplicationCommandSubcommandOption,
  APICommandAutocompleteInteractionResponseCallbackData,
  APIInteraction,
  APIInteractionResponse,
  APIInteractionResponseCallbackData,
  APIMessageComponentInteraction,
  APIModalInteractionResponseCallbackData,
  APIModalSubmitInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ComponentType,
  InteractionResponseType,
  InteractionType,
  MessageFlags,
  ModalSubmitComponent,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPatchAPIWebhookWithTokenMessageResult,
  RESTPostAPIWebhookWithTokenJSONBody,
  RESTPostAPIWebhookWithTokenWaitResult,
  Routes,
} from 'discord-api-types/v10';
import {FastifyReply, FastifyRequest} from 'fastify';

import {Database} from '@suggester/database';
import {LocalizationService, Localizer} from '@suggester/i18n';
import {
  DeepReadonly,
  HttpStatusCode,
  KebabCaseToCamelCase,
} from '@suggester/util';

import {Framework} from '.';

export interface ContextConfig<T extends APIInteraction> {
  interaction: T;
  framework: Framework;
  req: FastifyRequest;
  reply: FastifyReply;
}

export class Context<
  T extends APIInteraction,
  Options extends DeepReadonly<APIApplicationCommandOption[]> = DeepReadonly<
    APIApplicationCommandOption[]
  >
> {
  readonly db: Database;
  readonly locales: LocalizationService;
  readonly interaction: T;
  readonly framework: Framework;

  readonly fastifyReq: FastifyRequest;
  readonly fastifyReply: FastifyReply;

  #sentInitial = false;

  constructor(cfg: ContextConfig<T>) {
    this.db = cfg.framework.db;
    this.locales = cfg.framework.locales;
    this.interaction = cfg.interaction;
    this.framework = cfg.framework;
    this.fastifyReq = cfg.req;
    this.fastifyReply = cfg.reply;
  }

  getLocalizer(): Localizer {
    return new Localizer(this.interaction, this.locales, this.db);
  }

  // Intraction methods

  async respond(payload: APIInteractionResponse): Promise<void> {
    if (this.#sentInitial) {
      throw new Error('Already Responded');
    }

    // useful for debugging interactions failing
    // but slower (don't use in prod)
    if (process.env.CMDS_RESPOND_WITH_REST) {
      const url = Routes.interactionCallback(
        this.interaction.id,
        this.interaction.token
      );

      await this.framework.rest.post(url, {
        body: payload,
      });

      this.#sentInitial = true;
      return;
    }

    if (!this.fastifyReply.sent) {
      await this.fastifyReply.code(HttpStatusCode.OK).send(payload);

      this.#sentInitial = true;
      return;
    }

    throw new Error('Fastify request has already been responded to');
  }

  async send(
    payload: APIInteractionResponseCallbackData
  ): Promise<RESTPostAPIWebhookWithTokenWaitResult | undefined> {
    if (!this.#sentInitial) {
      await this.respond({
        type: InteractionResponseType.ChannelMessageWithSource,
        data: payload,
      });
      return;
    }

    const url = Routes.webhook(
      this.interaction.application_id,
      this.interaction.token
    );

    const res = await this.framework.rest.post(url, {body: payload});
    if (this.#sentInitial) {
      return res as RESTPostAPIWebhookWithTokenWaitResult;
    }

    this.#sentInitial = true;

    return;
  }

  async update(payload: APIInteractionResponseCallbackData) {
    return this.respond({
      type: InteractionResponseType.UpdateMessage,
      data: payload,
    });
  }

  async defer(ephemeral = false): Promise<void> {
    if (this.isMessageComponent()) {
      return this.respond({
        type: InteractionResponseType.DeferredMessageUpdate,
      });
    }

    return this.respond({
      type: InteractionResponseType.DeferredChannelMessageWithSource,
      data: {
        flags: ephemeral ? MessageFlags.Ephemeral : 0,
      },
    });
  }

  async sendModal(payload: APIModalInteractionResponseCallbackData) {
    return this.respond({
      type: InteractionResponseType.Modal,
      data: payload,
    });
  }

  async sendAutocomplete(
    payload: APICommandAutocompleteInteractionResponseCallbackData
  ) {
    return this.respond({
      type: InteractionResponseType.ApplicationCommandAutocompleteResult,
      data: payload,
    });
  }

  async followup(
    body: RESTPostAPIWebhookWithTokenJSONBody
  ): Promise<RESTPostAPIWebhookWithTokenWaitResult> {
    const url = Routes.webhook(
      this.interaction.application_id,
      this.interaction.token
    );

    return this.framework.rest.post(url, {
      body,
    }) as Promise<RESTPostAPIWebhookWithTokenWaitResult>;
  }

  async edit(
    msgId: string,
    body: RESTPatchAPIWebhookWithTokenMessageJSONBody
  ): Promise<RESTPatchAPIWebhookWithTokenMessageResult> {
    const url = Routes.webhookMessage(
      this.interaction.application_id,
      this.interaction.token,
      msgId
    );

    return this.framework.rest.patch(url, {
      body,
    }) as Promise<RESTPatchAPIWebhookWithTokenMessageResult>;
  }

  async delete(msgId: string) {
    const url = Routes.webhookMessage(
      this.interaction.application_id,
      this.interaction.token,
      msgId
    );

    await this.framework.rest.delete(url);
  }

  // type checking

  isModal(): this is Context<APIModalSubmitInteraction> {
    return this.interaction.type === InteractionType.ModalSubmit;
  }

  isMessageComponent(): this is Context<APIMessageComponentInteraction> {
    return this.interaction.type === InteractionType.MessageComponent;
  }

  // TODO: why doesnt this work?
  isAutocomplete(): this is Context<APIApplicationCommandAutocompleteInteraction> {
    return (
      this.interaction.type === InteractionType.ApplicationCommandAutocomplete
    );
  }

  // getters

  getModal(): APIModalSubmitInteraction {
    if (!this.isModal()) {
      throw new Error('Context type is not APIModalSubmitInteraction');
    }

    return this.interaction;
  }

  getModalTextField(id: string): ModalSubmitComponent | undefined {
    if (!this.isModal()) {
      throw new Error('Context type is not APIModalSubmitInteraction');
    }

    return this.getModal()
      .data.components?.find(c => c.components.find(co => co.custom_id === id))
      ?.components.find(c => c.custom_id === id);
  }

  getButtonID(): string {
    if (
      !this.isMessageComponent() ||
      this.interaction.data.component_type !== ComponentType.Button
    ) {
      throw new Error('Interaction was not Button');
    }

    return this.interaction.data.custom_id;
  }

  // TODO: support other select types

  getSelectID(): string {
    if (
      !this.isMessageComponent() ||
      this.interaction.data.component_type !== ComponentType.StringSelect
    ) {
      throw new Error('Interaction was not SelectMenu');
    }

    return this.interaction.data.custom_id;
  }

  getSelectValues(): string[] {
    if (
      !this.isMessageComponent() ||
      this.interaction.data.component_type !== ComponentType.StringSelect
    ) {
      throw new Error('Interaction was not SelectMenu');
    }

    return this.interaction.data.values;
  }

  getFocusedOption(): APIApplicationCommandInteractionDataOption | undefined {
    if (
      this.interaction.type !== InteractionType.ApplicationCommandAutocomplete
    ) {
      throw new Error('Interaction was not Autocomplete');
    }

    const opts = this.getOptions();
    return opts?.find(
      o =>
        (o.type === ApplicationCommandOptionType.String ||
          o.type === ApplicationCommandOptionType.Number) &&
        // FIXME: how fix
        // @ts-expect-error bad types?
        o.focused
    );
  }

  // TODO: type this?
  getOptions<
    Opts extends MapCommandOptionsToResponseOptions<FlattenOptions<Options>>
  >(): Opts {
    if (
      (this.interaction.type !== InteractionType.ApplicationCommand &&
        this.interaction.type !==
          InteractionType.ApplicationCommandAutocomplete) ||
      this.interaction.data.type !== ApplicationCommandType.ChatInput
    ) {
      throw new Error('Interaction is not ApplicationCommand');
    }

    const ops = this.interaction.data?.options;
    if (ops?.length === 1) {
      const [op] = ops;

      if (op.type === ApplicationCommandOptionType.SubcommandGroup) {
        const [subCmd] = op.options;

        // TODO: these casts feel wrong. how fix?
        return subCmd.options as unknown as Opts;
      } else if (op.type === ApplicationCommandOptionType.Subcommand) {
        return op.options as unknown as Opts;
      } else {
        return ops as unknown as Opts;
      }
    } else {
      return this.interaction.data.options as unknown as Opts;
    }
  }

  getFlatOptions<
    Opts extends OptionsToMapByName<Options>,
    Typ extends {
      [Name in keyof Opts as KebabCaseToCamelCase<
        Name extends string ? Name : never
      >]: Opts[Name]['required'] extends true
        ? ApplicationCommandOptionTypeMap[Opts[Name]['type']]
        : ApplicationCommandOptionTypeMap[Opts[Name]['type']] | undefined;
    }
  >(): Typ {
    if (
      (this.interaction.type !== InteractionType.ApplicationCommand &&
        this.interaction.type !==
          InteractionType.ApplicationCommandAutocomplete) ||
      this.interaction.data.type !== ApplicationCommandType.ChatInput
    ) {
      throw new Error('Interaction is not ApplicationCommand');
    }

    const ops = this.getOptions();
    const flatOpts = {} as Typ;

    if (!ops) {
      return flatOpts;
    }

    const kebabToCamel = <T extends string>(s: T): KebabCaseToCamelCase<T> => {
      const camel = s.replace(/-(\w)/g, w => w[1].toUpperCase());

      return (
        camel.endsWith('Id') ? camel.slice(0, -2) + 'ID' : camel
      ) as KebabCaseToCamelCase<T>;
    };

    return ops.reduce((a, c) => {
      if ('value' in c) {
        // @ts-expect-error reduce isn't typed strictly enough
        a[kebabToCamel(c.name)] = c.value;
      }

      return a;
    }, flatOpts);
  }

  getOption<
    Opts extends FlattenOptions<Options>,
    Name extends Opts[number]['name'],
    Typ extends Extract<Opts[number], {name: Name}>['type'],
    IsRequired extends Extract<Opts[number], {name: Name}>['required']
  >(name: Name) {
    if (
      (this.interaction.type !== InteractionType.ApplicationCommand &&
        this.interaction.type !==
          InteractionType.ApplicationCommandAutocomplete) ||
      this.interaction.data.type !== ApplicationCommandType.ChatInput
    ) {
      throw new Error('Interaction is not ApplicationCommand');
    }

    const ops = this.getOptions();
    return ops?.find(o => o.name === name) as MapOptionTypeToTypedOptionType<
      Typ,
      IsRequired
    >;
  }
}

type OptionTypeMap = {
  1: APIApplicationCommandInteractionDataSubcommandOption;
  2: APIApplicationCommandInteractionDataSubcommandGroupOption;
  3: APIApplicationCommandInteractionDataStringOption;
  4: APIApplicationCommandInteractionDataIntegerOption;
  5: APIApplicationCommandInteractionDataBooleanOption;
  6: APIApplicationCommandInteractionDataUserOption;
  7: APIApplicationCommandInteractionDataChannelOption;
  8: APIApplicationCommandInteractionDataRoleOption;
  9: APIApplicationCommandInteractionDataMentionableOption;
  10: APIApplicationCommandInteractionDataNumberOption;
  11: APIApplicationCommandInteractionDataAttachmentOption;
};

type ApplicationCommandOptionTypeMap = {
  [ApplicationCommandOptionType.Subcommand]: never;
  [ApplicationCommandOptionType.SubcommandGroup]: never;
  [ApplicationCommandOptionType.String]: string;
  [ApplicationCommandOptionType.Integer]: number;
  [ApplicationCommandOptionType.Boolean]: boolean;
  [ApplicationCommandOptionType.User]: string;
  [ApplicationCommandOptionType.Channel]: string;
  [ApplicationCommandOptionType.Role]: string;
  [ApplicationCommandOptionType.Mentionable]: string;
  [ApplicationCommandOptionType.Number]: string;
  [ApplicationCommandOptionType.Attachment]: string;
};

export type FlattenOptions<
  Options extends DeepReadonly<APIApplicationCommandOption[]>
> = Options[number] extends DeepReadonly<
  Omit<APIApplicationCommandSubcommandGroupOption, 'options'> & {
    options: (Omit<APIApplicationCommandSubcommandOption, 'options'> & {
      options: APIApplicationCommandInteractionDataBasicOption[];
    })[];
  }
>
  ? Options[number]['options'][number]['options']
  : Options[number] extends DeepReadonly<
      APIApplicationCommandSubcommandOption & {
        options: APIApplicationCommandInteractionDataBasicOption[];
      }
    >
  ? Options[number]['options']
  : Options;

type OptionsToMapByName<
  Options extends DeepReadonly<APIApplicationCommandOption[]>
> = {
  [Name in Options[number]['name']]: Extract<Options[number], {name: Name}>;
};

// FIXME: can this be made better?
type MapCommandOptionsToResponseOptions<
  T extends DeepReadonly<APIApplicationCommandOption[]>
> = MapCommandOptionToResponseOption<T[number]>[];

type MapCommandOptionToResponseOption<
  T extends DeepReadonly<APIApplicationCommandOption>
> = MapOptionTypeToTypedOptionType<T['type'], T['required']> & {
  readonly name: T['name'];
};

export type MapOptionTypeToTypedOptionType<
  T extends keyof OptionTypeMap,
  IsRequired extends boolean | undefined
> = IsRequired extends true ? OptionTypeMap[T] : OptionTypeMap[T] | undefined;
