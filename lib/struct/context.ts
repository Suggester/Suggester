import {APIInteraction} from 'discord-api-types/v9';

import {LocalizationService, Localizer} from '.';
import {Database, Framework} from '..';

export interface ContextConfig<T extends APIInteraction> {
  db: Database;
  locales: LocalizationService;
  interaction: T;
  framework: Framework;
}

export class Context<T extends APIInteraction> {
  readonly db: Database;
  readonly locales: LocalizationService;
  readonly interaction: T;
  readonly framework: Framework;

  constructor(cfg: ContextConfig<T>) {
    this.db = cfg.db;
    this.locales = cfg.locales;
    this.interaction = cfg.interaction;
    this.framework = cfg.framework;
  }

  localizer(): Localizer {
    return new Localizer(this);
  }
}
