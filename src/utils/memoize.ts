const cache = new Map<string, unknown>();

// Create the memoize function
export const memoize = <R, T extends (...args: any[]) => R>(
  fn: T,
  keyResolver?: (...args: Parameters<T>) => string,
): T => {
  return ((...args: Parameters<T>): R => {
    const key = keyResolver ? keyResolver(...args) : `${fn.name}__${JSON.stringify(args)}`;

    if (cache.has(key)) {
      return cache.get(key) as R;
    }

    const result = fn(...args);
    cache.set(key, result);

    return result;
  }) as T;
};
