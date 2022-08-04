/* eslint-disable @typescript-eslint/no-unused-vars */
import Cache from "../Cache";
import { CachedItem } from "../interfaces/CachedItem";
import CacheStrategy from "./CacheStrategy.interface";

interface LRUData {
  readHistory: string[];
}

export default class LRUStrategy implements CacheStrategy {
  private maxEntries = 1000;
  private lruDataKey = "lruStrategyData";

  async onRead<T>(
    key: string,
    _value: CachedItem<T>,
    cache: Cache
  ): Promise<void> {
    let lruData = await cache.read<LRUData>(this.lruDataKey, true);
    if (!lruData) {
      lruData = {
        readHistory: [],
      };
    }

    const newHistory = lruData.readHistory.filter(
      (cacheKey) => cacheKey !== key
    );
    newHistory.unshift(key);

    await cache.write<LRUData>(
      this.lruDataKey,
      {
        readHistory: newHistory,
      },
      -1,
      true
    );
  }

  async onWrite<T>(
    key: string,
    _value: CachedItem<T>,
    cache: Cache
  ): Promise<void> {
    const allCachedKeys = await cache.getAllKeys();
    if (!allCachedKeys) {
      return;
    }

    const lruData = await cache.read<LRUData>(this.lruDataKey, true);

    if (allCachedKeys.length + 1 > this.maxEntries) {
      const leastRecentlyReadKey = lruData?.readHistory.pop();

      if (leastRecentlyReadKey) {
        await cache.evict(leastRecentlyReadKey, true);
      }
    }

    const newHistory = lruData?.readHistory || [];
    newHistory.unshift(key);

    await cache.write<LRUData>(
      this.lruDataKey,
      {
        readHistory: newHistory,
      },
      -1,
      true
    );
  }

  async onEvict(key: string, cache: Cache): Promise<void> {
    let lruData = await cache.read<LRUData>(this.lruDataKey, true);
    if (!lruData) {
      lruData = {
        readHistory: [],
      };
    }

    const newHistory = lruData.readHistory.filter(
      (cacheKey) => cacheKey !== key
    );

    await cache.write<LRUData>(
      this.lruDataKey,
      {
        readHistory: newHistory,
      },
      -1,
      true
    );
  }

  onInit(
    _namespace: string,
    _keyConstructor: (key: string) => string,
    _cache: Cache
  ): void {
    return;
  }

  public setMaxEntries(entries: number) {
    this.maxEntries = entries;
  }
}
