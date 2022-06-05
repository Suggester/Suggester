## Running a dev instance

Suggester is built to be able to easily start up "custom instances" (bots with custom branding). As such, the setup is a bit more difficult than a typical bot.

### Prereqs

- yarn
- [fluent-types](https://github.com/Benricheson101/fluent-types)
- PostgreSQL
- Redis

Create a file called `.env` in the project root, containing the following content:

```
NODE_ENV='dev'
```

Copy `config_example.toml` to `config.toml` and modify the relevant lines

To create locale types, run `fluent-types lang/common.ftl lang/en-US/**/*.ftl -o lib/struct/fluentMessages.ts`

To initialize the database, run `yarn prisma migrate deploy` followed by `yarn prisma db seed`

To run a dev instance, run `yarn dev`.
