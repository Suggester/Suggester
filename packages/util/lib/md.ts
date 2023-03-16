import {APIUser, RouteBases} from 'discord-api-types/v10';

export enum TimestampStyle {
  /** 6:14 PM */
  ShortTime = 't',
  /** 4:14:30 PM */
  LongTime = 'T',

  /** 03/06/2023 */
  ShortDate = 'd',
  /** March 6, 2023 */
  LongDate = 'D',

  /** March 6, 2023 6:14 (default) */
  ShortTimeDate = 'f',
  /** Monday, March 6, 2023 */
  LongTimeDate = 'F',

  /** 2 months ago */
  RelativeTime = 'R',
}

export const timestamp = (
  time: Date,
  style: TimestampStyle = TimestampStyle.ShortTimeDate
) => `<t:${Math.floor(time.getTime() / 1_000)}:${style}>`;

export const bold = <T>(s: T) => `**${s}**`;
export const italic = <T>(s: T) => `*${s}*`;
export const underline = <T>(s: T) => `__${s}__`;
export const quote = <T>(s: T) => `> ${s}`;
export const strikethrough = <T>(s: T) => `~~${s}~~`;
export const code = <T>(s: T, lang?: string) =>
  lang ? `\`\`\`${lang}\n${s}\n\`\`\`` : `\`${s}\``;

export const user = (u: string) => `<@${u}>`;
export const channel = (c: string) => `<#${c}>`;
export const role = (r: string) => `<@&${r}>`;

export const emoji = (id: string, animated = false) =>
  `<${animated ? 'a' : ''}:aa:${id}>`;

export const tag = (u: APIUser) => `${u.username}#${u.discriminator}`;

export const formatAvatarURL = (user: APIUser) =>
  RouteBases.cdn +
  (user.avatar
    ? `/avatars/${user.id}/${user.avatar}.png`
    : `/embed/avatars/${Number(user.discriminator) % 5}.png`);
