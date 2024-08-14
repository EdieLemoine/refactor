import {addToMap} from './addToMap.ts';

export const addToMapArray = <T, K = string>(key: K, value: T, map: Map<K, T[]>): void => {
  addToMap(key, value, (array) => array.push(value), (value) => [value], map);
};
