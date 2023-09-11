import {UnionToTuple} from './types';

export const UserFlags = {
  /** Grants access to admin commands */
  BotAdmin: 1,

  /** User is blocked from using the bot globally */
  Blocked: 2,
} as const;

export type UserFlagChoices = UnionToTuple<
  {
    [K in keyof typeof UserFlags]: {
      readonly name: K;
      readonly value: (typeof UserFlags)[K];
    };
  }[keyof typeof UserFlags]
>;

export const UserFlagChoices = Object.entries(UserFlags).map(([k, v]) => ({
  name: k,
  value: v,
})) as UserFlagChoices;
