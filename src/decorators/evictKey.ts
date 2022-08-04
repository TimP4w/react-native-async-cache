import CacheFactory from "../CacheFactory";

function evictKey(key: string) {
  return (
    _target: object,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    if (typeof descriptor.value === "function") {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: unknown[]) {
        const cache = CacheFactory.getInstance();
        if (!cache) return;
        await cache.evict(key);
        return originalMethod.apply(this, args);
      };
    }
  };
}

export default evictKey;
