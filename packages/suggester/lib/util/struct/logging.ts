import {APIInteraction, APIUser} from 'discord-api-types/v10';

import {Localizer, MessageNames} from '@suggester/i18n';

// import {Suggestion, SuggestionAttachment} from '../../database';
import {Suggestion, SuggestionAttachment} from '@suggester/database';
import {Context} from '../../framework';
// import {Context} from '.';
import {EmbedBuilder} from '../embeds';

export enum LogAction {
  SuggestionCreated,
  AttachmentAdded,
  AttachmentRemoved,
}

type MakeLogPayload<E extends LogAction, T> = T & {
  action: E;
  logChannel: string;
  localizer: Localizer;
  suggestion: Suggestion;
};

export type LogData =
  | MakeLogPayload<
      LogAction.SuggestionCreated,
      {
        author: APIUser;
      }
    >
  | MakeLogPayload<
      LogAction.AttachmentAdded,
      {
        attachment: SuggestionAttachment;
      }
    >
  | MakeLogPayload<
      LogAction.AttachmentRemoved,
      {
        attachment: SuggestionAttachment;
      }
    >;

export type LogPayload<E extends LogAction> = Omit<
  Extract<LogData, {action: E}>,
  'action' | 'localizer'
>;

// TODO: move to own package?

type PascalToCamel<S extends string> = Uncapitalize<S>;
type LogActionName = keyof typeof LogAction;
type LogActionMethodMap = {
  [key in LogActionName as Uncapitalize<key>]: (typeof LogAction)[key];
};
type LogMethodName = keyof LogActionMethodMap;

const pascalToCamel = <S extends string>(s: S): PascalToCamel<S> =>
  (s[0].toLowerCase() + s.slice(1)) as PascalToCamel<S>;

const LogActionNameMap = (Object.keys(LogAction) as LogActionName[]).reduce(
  (a, c) =>
    isNaN(Number(c))
      ? {...a, [pascalToCamel(c)]: LogAction[c as LogActionName]}
      : a,
  {} as LogActionMethodMap
);

const isLogMethodName = (s: unknown): s is LogMethodName =>
  !!s && typeof s === 'string' && s in LogActionNameMap;

type LogMethods = {
  [key in keyof LogActionMethodMap]: (
    data: LogPayload<LogActionMethodMap[key]>
  ) => void;
};

// eslint-disable-next-line
export interface ContextualLogs<T extends APIInteraction> extends LogMethods {}

export class ContextualLogs<T extends APIInteraction> {
  constructor(private ctx: Context<T>) {
    return new Proxy(this, {
      get: (_target, prop) => {
        if (isLogMethodName(prop)) {
          const action = LogActionNameMap[prop];

          const f = (data: LogPayload<LogAction>) => {
            this.#push(action, data);
          };

          return f;
        }

        return;
      },
    });
  }

  #push<E extends LogAction>(action: E, data: LogPayload<E>) {
    this.ctx.framework.logQueue.push(data.logChannel, {
      ...data,
      action,
      localizer: this.ctx.getLocalizer(),
    } as Extract<LogData, {action: E}>);
  }
}

export class LogEmbed extends EmbedBuilder {
  constructor(data: LogData) {
    super();

    super.setTitleLocalized(
      `log-action.${LogAction[data.action]}` as MessageNames
    );
    super.setColor(0x5865f2);
    super.setFooterLocalized(
      {
        text: 'log-embed.footer',
      },
      {
        authorID: data.suggestion.authorID,
        suggestionID: data.suggestion.publicID,
      }
    );
  }
}
