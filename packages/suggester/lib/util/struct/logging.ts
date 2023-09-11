import {APIInteraction, APIUser} from 'discord-api-types/v10';

// import {Suggestion, SuggestionAttachment} from '../../database';
import {
  Suggestion,
  SuggestionAttachment,
  SuggestionVote,
  SuggestionVoteKind,
} from '@suggester/database';
import {Localizer, MessageNames} from '@suggester/i18n';

import {Context} from '../../framework';

// import {Context} from '.';
// import {EmbedBuilder} from '../embeds';

export enum LogAction {
  SuggestionCreated,
  SuggestionApproved,
  SuggestionDenied,

  AttachmentAdded,
  AttachmentRemoved,

  VoteAdded,
  VoteRemoved,
  VoteChanged,
}

type MakeLogPayload<E extends LogAction, T> = T & {
  action: E;
  user: APIUser;
  logChannel?: string | null;
  localizer: Localizer;
  suggestion: Suggestion;
};

export type LogData =
  | MakeLogPayload<LogAction.SuggestionCreated, {}>
  | MakeLogPayload<LogAction.SuggestionApproved, {}>
  | MakeLogPayload<LogAction.SuggestionDenied, {}>
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
    >
  | MakeLogPayload<
      LogAction.VoteAdded,
      {
        emoji: string;
      }
    >
  | MakeLogPayload<
      LogAction.VoteRemoved,
      {
        emoji: string;
      }
    >
  | MakeLogPayload<
      LogAction.VoteChanged,
      {
        old: string;
        new: string;
      }
    >;

export type LogPayload<E extends LogAction, OmitImplicit = true> = Omit<
  Extract<LogData, {action: E}>,
  OmitImplicit extends true ? 'action' | 'localizer' : ''
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
            if (data.logChannel) {
              this.#push(action, data);
            }
          };

          return f;
        }

        return;
      },
    });
  }

  #push<E extends LogAction>(action: E, data: LogPayload<E>) {
    this.ctx.framework.logQueue.push(data.logChannel!, {
      ...data,
      action,
      localizer: this.ctx.getLocalizer(),
    } as Extract<LogData, {action: E}>);
  }
}
