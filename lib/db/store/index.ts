export abstract class DatabaseStore<T> {
  abstract create(row: Omit<T, 'id'>): Promise<T>;
  abstract get(...query: unknown[]): Promise<T | null>;
  abstract update(query: unknown, update: Partial<T>): Promise<T | null>;
  abstract upsert(query: unknown, row: T): Promise<T>;
  abstract delete(query: unknown): Promise<T | null>;
}

export * from './guildConfig';
export * from './instance';
export * from './instanceGuild';
export * from './suggestionFeed';
