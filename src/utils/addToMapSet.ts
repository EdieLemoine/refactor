import {addToMap} from './addToMap.ts';

export const addToMapSet = <T, K = string>(key: K, value: T, map: Map<K, Set<T>>): void => {
  addToMap(key, value, (set) => set.add(value), (value) => new Set([value]), map);
};

