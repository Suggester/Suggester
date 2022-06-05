import {FluentBundle, FluentResource} from '@fluent/bundle';
import {APIInteraction} from 'discord-api-types/v10';
import {readFileSync, readdirSync, statSync} from 'fs';
import path from 'path';

import {Context} from '..';
import {Messages} from './fluentMessages';

const FALLBACK_LOCALE = 'en-US';

const LOCALE_DIR = path.join(process.cwd(), 'lang');
const COMMON_FILE_NAME = 'common.ftl';
const LOCALE_FILE_NAME = 'translations.ftl';

export class LocalizationService {
  readonly bundles = new Map<string, FluentBundle>();

  // TODO: switch to fs promises?
  loadAll(): this {
    const inDir = readdirSync(LOCALE_DIR, {withFileTypes: true});
    const common = inDir.find(d => d.isFile() && d.name === COMMON_FILE_NAME);
    const subDirs = inDir.filter(d => d.isDirectory()).map(d => d.name);

    let commonResoruce = new FluentResource('');
    if (common) {
      const commonTranslations = readFileSync(
        path.join(LOCALE_DIR, COMMON_FILE_NAME),
        {encoding: 'utf8'}
      );

      commonResoruce = new FluentResource(commonTranslations);
    }

    for (const langCode of subDirs) {
      const translationFile = path.join(LOCALE_DIR, langCode, LOCALE_FILE_NAME);

      try {
        statSync(translationFile);
      } catch {
        console.error(
          `Translation file for language: ${langCode} does not exist. Skipping...`
        );
        continue;
      }

      const bundle = new FluentBundle([langCode], {
        useIsolating: false,
      });

      const translations = readFileSync(translationFile, {
        encoding: 'utf8',
      });
      const resource = new FluentResource(translations);
      bundle.addResource(resource);
      bundle.addResource(commonResoruce);

      this.bundles.set(langCode, bundle);
    }

    return this;
  }

  get<T extends keyof Messages>(
    langCode: string,
    id: T,
    args?: Messages[T]
  ): string {
    const bundles = this.bundles;
    const bundle = bundles.get(langCode);
    if (!bundle) {
      return id;
    }

    const msg = bundle.getMessage(id);
    if (!msg || !msg.value) {
      return id;
    }

    const errors: Error[] = [];
    const formatted = bundle.formatPattern(msg.value, args, errors);
    if (errors.length) {
      console.error(
        `Failed to format message \`${id}\` for language code \`${langCode}\`:`,
        errors.join('\n')
      );
    }

    return formatted;
  }
}

export class Localizer {
  constructor(private ctx: Context<APIInteraction>) {}

  /** Format a message using the user's preferred locale */
  async user<T extends keyof Messages>(
    id: T,
    args?: Messages[T]
  ): Promise<string> {
    // TODO: check database
    const langCode = this.ctx.interaction.user?.locale || FALLBACK_LOCALE;
    return this.get(langCode, id, args);
  }

  /** Format a message using a guild's preferred locale */
  async guild<T extends keyof Messages>(
    id: T,
    args?: Messages[T]
  ): Promise<string> {
    // TODO: check database
    const langCode = this.ctx.interaction.guild_locale || FALLBACK_LOCALE;
    return this.get(langCode, id, args);
  }

  get<T extends keyof Messages>(
    langCode: string,
    id: T,
    args?: Messages[T]
  ): string {
    return this.ctx.locales.get(langCode, id, args);
  }
}
