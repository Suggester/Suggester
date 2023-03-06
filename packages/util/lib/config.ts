import {readFileSync} from 'node:fs';

import TOML from '@ltd/j-toml';
import {z} from 'zod';

const zodSnowflake = () => z.string().regex(/^\d{17,20}$/);

export const BotConfigStruct = z.object({
  amqp: z.object({
    url: z.string(),
  }),

  meta: z.object({
    support_server_url: z.string(),
    // TODO: should this be a bigint?
    invite_permissions: z.string().regex(/^\d+$/).default('805694544'),
    // users who can use admin commands
    admins: zodSnowflake().array(),
    // servers where admin commands are available
    admin_servers: zodSnowflake().array(),
  }),

  storage: z.object({
    // auto_migrate: z.boolean().default(true),
    postgres_url: z.string(),
    redis_url: z.string(),

    // TODO: S3 for attachment storage?
  }),

  sentry: z
    .object({
      dsn: z.string(),
      url: z.string().optional(),
    })
    .optional(),

  discord_application: z.object({
    id: zodSnowflake(),
    token: z.string(),
    public_key: z.string(),
  }),

  // options specific to the commands service
  commands: z.object({
    host: z.string().default('127.0.0.1'),
    port: z.number(),
  }),
});

export type BotConfig = z.infer<typeof BotConfigStruct>;

export const parseConfigFile = (path: string): BotConfig | null => {
  const configFile = readFileSync(path, 'utf8');
  const parsed = TOML.parse(configFile, undefined, false);

  const verify = BotConfigStruct.parse(parsed);
  return verify;
};
