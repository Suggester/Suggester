import {readFileSync, readdirSync, statSync} from 'node:fs';

import {FluentBundle, FluentResource, FluentValue} from '@fluent/bundle';
import {APIInteraction, APIPingInteraction} from 'discord-api-types/v10';
import path from 'path';

import {MessageNames, Placeholders} from './fluentMessages';

const FALLBACK_LOCALE = 'en-US';

const LOCALE_DIR = path.join('..', '..', 'lang');
const COMMON_FILE_NAME = 'common.ftl';
const LOCALE_FILE_NAME = 'translations.ftl';

export class LocalizationService {
  readonly bundles = new Map<string, FluentBundle>();

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
        functions: {
          // mentions
          ROLE_MENTION: (roleIDs: FluentValue[]) =>
            roleIDs.map(r => `<@&${r}>`).join(' '),
          USER_MENTION: (userIDs: FluentValue[]) =>
            userIDs.map(u => `<@${u}>`).join(' '),
          CHANNEL_MENTION: (channelIDs: FluentValue[]) =>
            channelIDs.map(c => `<#${c}>`).join(' '),

          // markdown
          BOLD: (text: FluentValue[]) => `**${text.join(' ')}**`,
          ITALIC: (text: FluentValue[]) => `*${text.join(' ')}*`,
          UNDERLINE: (text: FluentValue[]) => `__${text.join(' ')}__`,
          INLINE_CODE: (text: FluentValue[]) => `\`${text.join(' ')}\``,
          BLOCK_QUOTE: (
            text: FluentValue[],
            {multiline}: Record<string, FluentValue>
          ) => `${multiline === 'true' ? '>>>' : '>'} ${text.join(' ')}`,
          BLOCK_CODE: (
            text: FluentValue[],
            {lang = ''}: Record<string, FluentValue>
          ) => '```' + lang + '\n' + text.join(' ') + '\n```',
        },
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

  get<Name extends MessageNames>(
    langCode: string,
    id: Name,
    args?: Placeholders<Name>
  ): string {
    const bundles = this.bundles;
    const bundle = bundles.get(langCode);
    if (!bundle) {
      return id;
    }

    const [msgName, attr] = id.split('.');

    const msg = bundle.getMessage(msgName);
    const value = attr ? msg?.attributes[attr] : msg?.value;

    if (!value) {
      return id;
    }

    const errors: Error[] = [];
    const formatted = bundle.formatPattern(value, args, errors);
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
  constructor(
    private i: Exclude<APIInteraction, APIPingInteraction>,
    private ls: LocalizationService
  ) {}

  getUserLocale(): string {
    return this.i.locale || FALLBACK_LOCALE;
  }

  getGuildLocale(): string {
    if (!this.i.guild_id) {
      return FALLBACK_LOCALE;
    }

    return this.i.guild_locale || FALLBACK_LOCALE;
  }

  /**
   * Format a message using the user's preferred locale
   *
   * Use this for messages only visible to one user (DMs, ephemeral)
   */
  user<Name extends MessageNames>(id: Name, args?: Placeholders<Name>): string {
    const langCode = this.getUserLocale();
    return this.get(langCode, id, args);
  }

  /**
   * Format a message using a guild's preferred locale
   *
   * Use this for messages visible to many users (non-ephemeral, feed)
   */
  guild<Name extends MessageNames>(
    id: Name,
    args?: Placeholders<Name>
  ): string {
    const langCode = this.getGuildLocale();
    return this.get(langCode, id, args);
  }

  get<Name extends MessageNames>(
    langCode: string,
    id: Name,
    args?: Placeholders<Name>
  ): string {
    return this.ls.get(langCode, id, args);
  }
}

export * from './fluentMessages';
