/* eslint-disable @typescript-eslint/no-explicit-any */
const cache = new Map<string, unknown>();

const createName = (fn: (...args: any[]) => any) => {
  if (fn.name) {
    return fn.name;
  }

  const string = fn.toString();

  const hash = string.split('').reduce((acc, char) => {
    const charCode = char.charCodeAt(0);
    return ((acc << 5) - acc + charCode) | 0;
  }, 0);

  return `anonymous_${hash}`;
};

export const memoize = <R, T extends (...args: any[]) => R>(
  fn: T,
  keyResolver?: (...args: Parameters<T>) => string,
): T => {
  return ((...args: Parameters<T>): R => {
    const functionName = createName(fn);
    const key = `${functionName}__${keyResolver ? keyResolver(...args) : JSON.stringify(args)}`;

    if (cache.has(key)) {
      return cache.get(key) as R;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
};
