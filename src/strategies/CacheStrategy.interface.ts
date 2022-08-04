import { CachedItem } from "../interfaces/CachedItem";
import Cache from "../Cache";

export default interface CacheStrategy {
  onRead<T>(key: string, value: CachedItem<T>, cache: Cache): Promise<void>;
  onWrite<T>(key: string, value: CachedItem<T>, cache: Cache): Promise<void>;
  onEvict(key: string, cache: Cache): Promise<void>;
  onInit(
    namespace: string,
    keyConstructor: (key: string) => string,
    cache: Cache
  ): void;
}
