export const addToMap = <T, K = string, MapType = Set<T>>(key: K, value: T, addCb: (value: MapType) => void, createCb: (value: T) => MapType, map: Map<K, MapType>): void => {
  if (map.has(key)) {
    addCb(map.get(key)!);
  } else {
    map.set(key, createCb(value));
  }
};
