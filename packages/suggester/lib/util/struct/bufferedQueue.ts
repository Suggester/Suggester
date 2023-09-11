import {setTimeout} from 'node:timers';

import {defer} from '../promise';

interface BufferedData<Data, Topic> {
  buffer: Data[];
  timeout: NodeJS.Timeout;
  promise: Promise<[Topic, unknown]>;
  resolve: (t: [Topic, unknown]) => void;
}

export interface BufferedQueueOptions<Data, Topic> {
  timeout?: number;
  maxSize?: number;
  handler?: HandleFn<Data, Topic>;
}

export type HandleFn<Data, Topic> = (
  topic: Topic,
  data: Data[]
) => unknown | Promise<unknown>;

export class BufferedQueue<Data, Topic = string> {
  private buf = new Map<Topic, BufferedData<Data, Topic>>();
  private handler?: HandleFn<Data, Topic>;
  private options: BufferedQueueOptions<Data, Topic>;

  constructor(options: BufferedQueueOptions<Data, Topic> = {}) {
    const defaultOptions = {
      timeout: 500,
      maxSize: undefined,
      handler: undefined,
    };

    const opts: BufferedQueueOptions<Data, Topic> = {
      ...defaultOptions,
      ...options,
    };

    this.handler = opts?.handler;
    this.options = opts;
  }

  setHandler(f: HandleFn<Data, Topic>) {
    this.handler = f;
    return this;
  }

  async push(topic: Topic, ...data: Data[]) {
    let stored = this.buf.get(topic);

    if (!stored) {
      const [promise, resolve] = defer<[Topic, unknown]>();

      stored = {
        buffer: [],
        timeout: undefined!,
        promise,
        resolve,
      };

      this.buf.set(topic, stored);
    }

    stored.buffer.push(...data);

    if (
      this.options.maxSize &&
      this.options.maxSize > 0 &&
      stored.buffer.length >= this.options.maxSize
    ) {
      this.#dispatch(topic);
      return stored.promise;
    }

    if (!stored.timeout && this.options.timeout) {
      stored.timeout = setTimeout(
        () => this.#dispatch(topic),
        this.options.timeout
      );
      this.buf.set(topic, stored);
    }

    return stored.promise;
  }

  async #dispatch(topic: Topic) {
    const data = this.buf.get(topic);
    this.buf.delete(topic);

    if (!data) {
      return;
    }

    clearTimeout(data.timeout);

    const output = await this.handler?.(topic, data.buffer);
    data.resolve([topic, output]);
  }
}
