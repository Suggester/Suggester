import TOML from '@ltd/j-toml';
import {readFileSync} from 'fs';
import {z} from 'zod';

const BotConfigInitStruct = z.object({
  token: z.string(),
  public_key: z.string(),
  application_id: z.string(),
});

const BotConfigDevInitStruct = BotConfigInitStruct.extend({
  guild_id: z.string(),
  channel_id: z.string(),
  user_id: z.string(),
});

const BotConfigMetaStruct = z.object({
  support_server_invite: z.string(),
  invite_url_permissions: z.string().regex(/^\d+/),
  admins: z.string().array(),
});

const BotConfigStorageStruct = z.object({
  postgres_url: z.string(),
  redis_url: z.string(),
  // TODO: not really "storage" but idk where else to put it
  sentry_dsn: z.string().optional(),
});

const BotConfigWebServerStruct = z.object({
  host: z.string(),
  port: z.number(),
});

const BotConfigStruct = z.object({
  meta: BotConfigMetaStruct,
  storage: BotConfigStorageStruct,
  web_server: BotConfigWebServerStruct,
  init: BotConfigInitStruct.array().optional(),
  dev: BotConfigDevInitStruct.array().optional(),
});

export type BotConfig = z.infer<typeof BotConfigStruct>;

export const parseConfigFile = (path: string) => {
  const configFile = readFileSync(path, 'utf8');
  const parsed = TOML.parse(configFile, undefined, false);
  const verify = BotConfigStruct.safeParse(parsed);
  return verify;
};
