## Running a dev instance

Suggester is built to be able to easily start up "custom instances" (bots with custom branding). As such, the setup is a bit more difficult than a typical bot.

### Prereqs

- yarn
- [fluent-types](https://github.com/Benricheson101/fluent-types)
- PostgreSQL
- Redis

Create a file called `.env` in the project root, containing the following content:

```
DATABASE_URL=''
NODE_ENV='dev'
REDIS_URL=''
PORT='3000'
DEV_DISCORD_TOKEN=''
DEV_DISCORD_PUBLIC_KEY=''
DEV_DISCORD_BOT_ID=''
DEV_DISCORD_GUILD_ID=''
DEV_DISCORD_CHANNEL_ID=''
```

To create locale types, run `fluent-types lang/common.ftl lang/en-US/**/*.ftl -o lib/struct/fluentMessages.d.ts`

To initialize the database, run `yarn prisma migrate deploy` followed by `yarn prisma db seed`

To run a dev instance, run `yarn dev`.
