import {Instance} from '@prisma/client';
import {
  APIApplicationCommandAutocompleteInteraction,
  APIApplicationCommandInteractionDataBasicOption,
  APIApplicationCommandInteractionDataOption,
  APICommandAutocompleteInteractionResponseCallbackData,
  APIInteraction,
  APIInteractionResponseCallbackData,
  APIMessageComponentInteraction,
  APIModalInteractionResponseCallbackData,
  APIModalSubmitInteraction,
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ComponentType,
  InteractionResponseType,
  InteractionType,
  ModalSubmitComponent,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPatchAPIWebhookWithTokenMessageResult,
  RESTPostAPIWebhookWithTokenJSONBody,
  RESTPostAPIWebhookWithTokenWaitResult,
  RouteBases,
  Routes,
} from 'discord-api-types/v9';
import {fetch} from 'undici';

import {Database, Framework, LocalizationService, Localizer} from '..';

export interface ContextConfig<T extends APIInteraction> {
  interaction: T;
  framework: Framework;
  instance: Instance;
}

export class Context<T extends APIInteraction> {
  readonly db: Database;
  readonly locales: LocalizationService;
  readonly interaction: T;
  readonly framework: Framework;
  readonly instance: Instance;

  #sentInitial = false;

  constructor(cfg: ContextConfig<T>) {
    this.db = cfg.framework.db;
    this.locales = cfg.framework.locales;
    this.interaction = cfg.interaction;
    this.framework = cfg.framework;
    this.instance = cfg.instance;
  }

  localizer(): Localizer {
    return new Localizer(this);
  }

  // Intraction methods

  async send(
    payload: APIInteractionResponseCallbackData,
    type: InteractionResponseType = InteractionResponseType.ChannelMessageWithSource
  ): Promise<RESTPostAPIWebhookWithTokenWaitResult | undefined> {
    const url =
      RouteBases.api +
      (this.#sentInitial
        ? Routes.webhook(
            this.interaction.application_id,
            this.interaction.token
          )
        : Routes.interactionCallback(
            this.interaction.id,
            this.interaction.token
          ));

    try {
      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(
          this.#sentInitial
            ? payload
            : {
                type: type,
                data: payload,
              }
        ),
        headers: {
          'content-type': 'application/json',
        },
      });

      if (this.#sentInitial) {
        return res.json() as Promise<RESTPostAPIWebhookWithTokenWaitResult>;
      }
    } catch (err) {
      console.error('Failed to respond to interaction:', err);
    }

    this.#sentInitial = true;

    return;
  }

  // TODO: the next two methods are basically identical. can they be combined?

  // TODO: combine this with send?
  async sendModal(payload: APIModalInteractionResponseCallbackData) {
    const url =
      RouteBases.api +
      Routes.interactionCallback(this.interaction.id, this.interaction.token);

    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        type: InteractionResponseType.Modal,
        data: payload,
      }),
      headers: {
        'content-type': 'application/json',
      },
    });
  }

  async sendAutocomplete(
    payload: APICommandAutocompleteInteractionResponseCallbackData
  ) {
    const url =
      RouteBases.api +
      Routes.interactionCallback(this.interaction.id, this.interaction.token);

    await fetch(url, {
      method: 'POST',
      body: JSON.stringify({
        type: InteractionResponseType.ApplicationCommandAutocompleteResult,
        data: payload,
      }),
      headers: {
        'content-type': 'application/json',
      },
    });
  }

  async followup(
    body: RESTPostAPIWebhookWithTokenJSONBody
  ): Promise<RESTPostAPIWebhookWithTokenWaitResult> {
    const url =
      RouteBases.api +
      Routes.webhook(this.interaction.application_id, this.interaction.token);

    return fetch(url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'content-type': 'application/json',
      },
    }).then(r => r.json()) as Promise<RESTPostAPIWebhookWithTokenWaitResult>;
  }

  async edit(
    msgId: string,
    payload: RESTPatchAPIWebhookWithTokenMessageJSONBody
  ): Promise<RESTPatchAPIWebhookWithTokenMessageResult> {
    const url =
      RouteBases.api +
      Routes.webhookMessage(
        this.interaction.application_id,
        this.interaction.token,
        msgId
      );

    return (await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
      },
    }).then(r =>
      r.json()
    )) as Promise<RESTPatchAPIWebhookWithTokenMessageResult>;
  }

  async delete(msgId: string) {
    const url =
      RouteBases.api +
      Routes.webhookMessage(
        this.interaction.application_id,
        this.interaction.token,
        msgId
      );

    await fetch(url, {
      method: 'DELETE',
    });
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

  getSelectID(): string {
    if (
      !this.isMessageComponent() ||
      this.interaction.data.component_type !== ComponentType.SelectMenu
    ) {
      throw new Error('Interaction was not SelectMenu');
    }

    return this.interaction.data.custom_id;
  }

  getSelectValues(): string[] {
    if (
      !this.isMessageComponent() ||
      this.interaction.data.component_type !== ComponentType.SelectMenu
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
        o.focused
    );
  }

  getOptions(): APIApplicationCommandInteractionDataOption[] | undefined {
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
        return subCmd.options;
      } else if (op.type === ApplicationCommandOptionType.Subcommand) {
        return op.options;
      } else {
        return ops;
      }
    } else {
      return this.interaction.data.options;
    }
  }

  getOption<
    T extends APIApplicationCommandInteractionDataBasicOption = APIApplicationCommandInteractionDataBasicOption
  >(name: string): T | undefined {
    if (
      (this.interaction.type !== InteractionType.ApplicationCommand &&
        this.interaction.type !==
          InteractionType.ApplicationCommandAutocomplete) ||
      this.interaction.data.type !== ApplicationCommandType.ChatInput
    ) {
      throw new Error('Interaction is not ApplicationCommand');
    }

    const ops = this.getOptions();
    return ops?.find(o => o.name === name) as T;
  }
}
