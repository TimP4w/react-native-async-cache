import { CachedItem } from "./interfaces/CachedItem";
import storage from "./storage/Storage";
import CacheStrategy from "./strategies/CacheStrategy.interface";

export default class Cache {
  private namespace = "@Cache";
  private strategies: CacheStrategy[] = [];

  constructor(namespace: string, strategies: CacheStrategy[]) {
    this.namespace = namespace;
    this.strategies = strategies;
    for (const strategy of this.strategies) {
      strategy.onInit(this.namespace, this.createStorageKey, this);
    }
  }

  public async read<T>(key: string, skipStrategy = false): Promise<T | null> {
    const storageKey = this.createStorageKey(key);

    const cachedItem = await storage.get<CachedItem<T>>(storageKey);

    if (!cachedItem) {
      return null;
    }

    if (this.isExpired(cachedItem)) {
      return null;
    }

    if (!skipStrategy) {
      for (const strategy of this.strategies) {
        await strategy.onRead<T>(storageKey, cachedItem, this);
      }
    }

    return cachedItem.data;
  }

  public async write<T>(
    key: string,
    value: T,
    ttl: number,
    skipStrategy = false
  ): Promise<void> {
    if (ttl < 0 && ttl !== -1) {
      throw new Error("TTL must be a positive value");
    }
    const cacheItem: CachedItem<T> = {
      expiresAt: ttl === -1 ? -1 : Date.now() + ttl * 1000,
      data: value,
    };

    const storageKey = this.createStorageKey(key);

    if (!skipStrategy) {
      for (const strategy of this.strategies) {
        await strategy.onWrite<T>(storageKey, cacheItem, this);
      }
    }

    return storage.store(storageKey, cacheItem);
  }

  public async evict(key: string, skipStrategy = false): Promise<boolean> {
    if (key.includes(":*")) {
      return this.evictPattern(key, skipStrategy);
    } else {
      const storageKey = this.createStorageKey(key);
      if (!skipStrategy) {
        for (const strategy of this.strategies) {
          await strategy.onEvict(storageKey, this);
        }
      }

      return storage.delete(storageKey);
    }
  }

  private async evictPattern(
    pattern: string,
    skipStrategy = false
  ): Promise<boolean> {
    const searchKey = pattern.replace(":*", "");

    const allKeys = await this.getAllKeys();
    if (!allKeys) {
      return false;
    }

    const keyToSearch = this.createStorageKey(searchKey);

    const keysToEvict = allKeys.filter((k: string) => k.includes(keyToSearch));

    if (keysToEvict.length > 0) {
      for (const cacheKeyToEvict of keysToEvict) {
        if (!skipStrategy) {
          for (const strategy of this.strategies) {
            await strategy.onEvict(cacheKeyToEvict, this);
          }
        }
        await storage.delete(cacheKeyToEvict);
      }
      return true;
    }
    return false;
  }

  public createStorageKey(key: string): string {
    if (key.includes(this.namespace + ":")) {
      return key;
    }
    return `${this.namespace}:${key}`;
  }

  public serializeItemKeys(key: string, additionalKeys: string[]): string {
    let itemKey = key;

    if (additionalKeys) {
      for (const additionalKey of additionalKeys) {
        itemKey = itemKey + "_" + additionalKey;
      }
    }

    return itemKey;
  }

  public async flush(): Promise<void> {
    const cacheKeys = await this.getAllKeys();
    if (cacheKeys) {
      storage.multiRemove(cacheKeys);
    }
  }

  public async getAllKeys(): Promise<string[] | undefined> {
    const keys = await storage.getAllKeys();
    return keys.filter((key: string) => key.includes(this.namespace));
  }

  public isExpired(item: CachedItem<unknown>): boolean {
    return item.expiresAt === -1 ? false : item.expiresAt < Date.now();
  }
}
