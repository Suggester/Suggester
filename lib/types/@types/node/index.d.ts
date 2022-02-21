import '@types/node';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'dev' | 'development' | 'prod' | 'production';
      DATABASE_URL: string;
      REDIS_URL: string;
      PORT: `${number}`;
      ADDR?: string;
      DEV_DISCORD_TOKEN?: string;
      DEV_DISCORD_PUBLIC_KEY?: string;
      DEV_DISCORD_BOT_ID?: string;
      DEV_DISCORD_GUILD_ID?: string;
    }
  }
}

declare module 'events' {
  namespace EventEmitter {
    class EventEmitter<Events extends {[key: string]: unknown[]}> {
      constructor(options?: EventEmitterOptions);
      addListener<E extends keyof Events>(
        event: E,
        listener: (...args: Events[E]) => void
      ): this;
      on<E extends keyof Events>(
        emitter: E,
        listener: (...args: Events[E]) => void
      ): this;
      once<E extends keyof Events>(
        emitter: E,
        listener: (...args: Events[E]) => void
      ): this;
      removeListener<E extends keyof Events>(
        event: E,
        listener: (...args: Events[E]) => void
      ): this;
      off<E extends keyof Events>(
        event: E,
        listener: (...args: Events[E]) => void
      ): this;
      removeAllListeners<E extends keyof Events>(event?: E): this;
      listeners<E extends keyof Events>(
        event: E
      ): ((...args: Event[E]) => void)[];
      rawListeners<E extends keyof Events>(
        event: E
      ): ((...args: Event[E]) => void)[];
      emit<E extends keyof Events>(event: E, ...args: Events[E]);
      listenerCount<E extends keyof Events>(event: E): number;
      prependListener<E extends keyof Events>(
        emitter: E,
        listener: (...args: Events[E]) => void
      ): this;
      prependOnceListener<E extends keyof Events>(
        emitter: E,
        listener: (...args: Events[E]) => void
      ): this;
      eventNames<E extends keyof Events>(): E[];
    }
  }
}
