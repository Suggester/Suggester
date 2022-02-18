import '@types/node';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'dev' | 'development' | 'prod' | 'production';
      DATABASE_URL: string;
      REDIS_URL: string;
      PORT: `${number}`;
      DEV_DISCORD_TOKEN?: string;
      DEV_DISCORD_PUBLIC_KEY?: string;
      DEV_DISCORD_BOT_ID?: string;
      DEV_DISCORD_GUILD_ID?: string;
    }
  }
}
