import {Instance} from '@prisma/client';
import {
  APIInteraction,
  APIInteractionResponseCallbackData,
  InteractionResponseType,
  RESTPatchAPIWebhookWithTokenMessageJSONBody,
  RESTPostAPIWebhookWithTokenJSONBody,
  RESTPostAPIWebhookWithTokenWaitResult,
  RouteBases,
  Routes,
} from 'discord-api-types/v9';
import {fetch} from 'undici';

import {LocalizationService, Localizer} from '.';
import {Database, Framework} from '..';

export interface ContextConfig<T extends APIInteraction> {
  db: Database;
  locales: LocalizationService;
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
    this.db = cfg.db;
    this.locales = cfg.locales;
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
    type = InteractionResponseType.ChannelMessageWithSource
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
          this.#sentInitial ? payload : {type, data: payload}
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
  ) {
    const url =
      RouteBases.api +
      Routes.webhookMessage(
        this.interaction.application_id,
        this.interaction.token,
        msgId
      );

    const res = await fetch(url, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      headers: {
        'content-type': 'application/json',
      },
    }).then(r => r.json());

    console.log(res);
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
}
