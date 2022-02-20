import {APIInteraction} from 'discord-api-types';

import {LocalizationService, Localizer} from '.';
import {Database} from '..';

export interface ContextConfig {
  db: Database;
  locales: LocalizationService;
  interaction: APIInteraction;
}

export class Context {
  readonly db: Database;
  readonly locales: LocalizationService;
  readonly interaction: APIInteraction;

  constructor(cfg: ContextConfig) {
    this.db = cfg.db;
    this.locales = cfg.locales;
    this.interaction = cfg.interaction;
  }

  localizer(): Localizer {
    return new Localizer(this);
  }
}
