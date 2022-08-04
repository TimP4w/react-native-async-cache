import cacheFactory from "../CacheFactory";
import { cacheKeyMetadataKey } from "./metadata";

function cached(key: string, ttl: number) {
  return (
    target: object,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) => {
    if (typeof descriptor.value === "function") {
      const originalMethod = descriptor.value;
      descriptor.value = async function (...args: unknown[]) {
        const cache = cacheFactory.getInstance();

        if (!cache) return;

        const argsToSerialize: number[] = Reflect.getOwnMetadata(
          cacheKeyMetadataKey,
          target,
          propertyKey
        );

        let additionalKeys: string[] = [];

        if (argsToSerialize) {
          additionalKeys = argsToSerialize.map((index: number) =>
            JSON.stringify(args[index])
          );
        }

        const storageKey = cache.serializeItemKeys(key, additionalKeys);
        const cachedValue = await cache.read(storageKey);

        if (cachedValue) {
          return cachedValue;
        } else {
          return originalMethod
            .apply(this, args)
            .then(async (response: unknown) => {
              await cache.write(storageKey, response, ttl);
              return response;
            });
        }
      };
    }
  };
}

export default cached;
