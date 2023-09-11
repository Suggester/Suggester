export const defer = <Resolve = unknown, Reject = unknown>() => {
  let _resolve!: (arg0: Resolve | PromiseLike<Resolve>) => void;
  let _reject!: (arg0?: Reject) => void;

  const promise = new Promise<Resolve>((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });

  return [promise, _resolve, _reject] as const;
};
