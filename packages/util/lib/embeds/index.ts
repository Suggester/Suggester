import {
  APIEmbed,
  APIEmbedAuthor,
  APIEmbedField,
  APIEmbedFooter,
  APIEmbedImage,
  APIEmbedThumbnail,
  APIEmbedVideo,
} from 'discord-api-types/v10';

import {Localizer, MessageNames, Placeholders} from '@suggester/i18n';

export class EmbedBuilder implements APIEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: APIEmbedFooter;
  image?: APIEmbedImage;
  thumbnail?: APIEmbedThumbnail;
  video?: APIEmbedVideo;
  author?: APIEmbedAuthor;
  fields?: APIEmbedField[];

  #titleLocalized?: [string, FluentArgs];
  #descriptionLocalized?: [string, FluentArgs];
  #footerLocalized?: [LocalizedAPIEmbedFooter<MessageNames>, FluentArgs];
  #authorLocalized?: [LocalizedAPIEmbedAuthor<MessageNames>, FluentArgs];
  #fieldsLocalized?: [LocalizedAPIEmbedField<MessageNames>, FluentArgs][];

  constructor(embed?: APIEmbed) {
    Object.assign(this, embed || {});
  }

  setTitle(title: string): this {
    this.title = title;
    return this;
  }

  setDescription(description: string): this {
    this.description = description;
    return this;
  }

  setURL(url: string): this {
    this.url = url;
    return this;
  }

  setTimestamp(time: string | Date): this {
    this.timestamp = time instanceof Date ? time.toISOString() : time;
    return this;
  }

  setColor(color: number | `#${string}`): this {
    this.color =
      typeof color === 'number' ? color : parseInt(color.slice(1), 16);
    return this;
  }

  setFooter(footer: APIEmbedFooter): this {
    this.footer = footer;
    return this;
  }

  setImage(image: APIEmbedImage): this {
    this.image = image;
    return this;
  }

  setThumbnail(thumbnail: APIEmbedThumbnail): this {
    this.thumbnail = thumbnail;
    return this;
  }

  setAuthor(author: APIEmbedAuthor): this {
    this.author = author;
    return this;
  }

  setFields(fields: APIEmbedField[]): this {
    this.fields = fields;
    return this;
  }

  addField(field: APIEmbedField): this {
    this.fields = (this.fields || []).concat(field);
    return this;
  }

  setTitleLocalized<T extends MessageNames>(
    title: T,
    args?: Placeholders<T>
  ): this {
    this.#titleLocalized = [title, args];
    return this;
  }

  setDescriptionLocalized<T extends MessageNames>(
    description: T,
    args?: Placeholders<T>
  ): this {
    this.#descriptionLocalized = [description, args];
    return this;
  }

  setFooterLocalized<T extends MessageNames>(
    footer: LocalizedAPIEmbedFooter<T>,
    args?: Placeholders<T>
  ): this {
    this.#footerLocalized = [footer, args];
    return this;
  }

  setAuthorLocalized<T extends MessageNames>(
    author: LocalizedAPIEmbedAuthor<T>,
    args?: Placeholders<T>
  ): this {
    this.#authorLocalized = [author, args];
    return this;
  }

  addFieldLocalized<T extends MessageNames>(
    field: LocalizedAPIEmbedField<T>,
    args?: Placeholders<T>
  ): this {
    this.#fieldsLocalized = (this.#fieldsLocalized || []).concat([field, args]);
    return this;
  }

  /** **WARNING**: __will__ overwrite existing keys */
  localize(l: Localizer, langCode: string): this {
    if (this.#titleLocalized) {
      this.title = l.get(
        langCode,
        this.#titleLocalized[0] as MessageNames,
        this.#titleLocalized[1]
      );
    }

    if (this.#descriptionLocalized) {
      this.description = l.get(
        langCode,
        this.#descriptionLocalized[0] as MessageNames,
        this.#descriptionLocalized[1]
      );
    }

    if (this.#footerLocalized) {
      this.footer = {
        ...this.#footerLocalized[0],
        text: l.get(
          langCode,
          this.#footerLocalized[0].text,
          this.#footerLocalized[1]
        ),
      };
    }

    if (this.#authorLocalized) {
      this.author = {
        ...this.#authorLocalized[0],
        name: l.get(
          langCode,
          this.#authorLocalized[0].name,
          this.#authorLocalized[1]
        ),
      };
    }

    if (this.#fieldsLocalized) {
      this.fields = this.#fieldsLocalized.map(([data, args]) => ({
        ...data,
        name: l.get(langCode, data.name, args),
        value: l.get(langCode, data.value, args),
      }));
    }

    return this;
  }
}

export type FluentArgs = {[key: string]: string | number | Date} | undefined;

export interface LocalizedAPIEmbedFooter<T extends MessageNames> {
  text: T;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface LocalizedAPIEmbedAuthor<T extends MessageNames> {
  name: T;
  url?: string;
  icon_url?: string;
  proxy_icon_url?: string;
}

export interface LocalizedAPIEmbedField<T extends MessageNames> {
  name: T;
  value: T;
  inline?: boolean;
}

export * from './changelog';
export * from './feeds';
export * from './suggestion';
