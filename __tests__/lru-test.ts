import { Storage } from "../src/storage/Storage";
import { cached, CacheFactory, LRUStrategy } from "../src/index";
import Cache from "../src/Cache";

class Work {
  async doWork(): Promise<number> {
    return Promise.resolve(Date.now());
  }
}

const work = new Work();

class Test {
  @cached("testKey1", 1000)
  async testCache1() {
    return work.doWork();
  }

  @cached("testKey2", 1000)
  async testCache2() {
    return work.doWork();
  }

  @cached("testKey3", 1000)
  async testCache3() {
    return work.doWork();
  }

  @cached("testKey4", 1000)
  async testCache4() {
    return work.doWork();
  }

  @cached("testKey5", 1000)
  async testCache5() {
    return work.doWork();
  }
}

const cacheReadSpy = jest.spyOn(Cache.prototype, "read");
const cacheWriteSpy = jest.spyOn(Cache.prototype, "write");
const cacheEvictStpy = jest.spyOn(Cache.prototype, "evict");

const storageGetSpy = jest.spyOn(Storage.prototype, "get");
const storageStoreSpy = jest.spyOn(Storage.prototype, "store");
const storageMultiRemoveSpy = jest.spyOn(Storage.prototype, "multiRemove");

const test = new Test();

describe("Given a cache with the LRU strategy", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    const lruStrategy = new LRUStrategy();
    lruStrategy.setMaxEntries(3 + 1); // Consider the metadata stored by the strategy itself
    CacheFactory.setNamespace("@TestCache")
      .attachStrategy(lruStrategy)
      .create();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    storageGetSpy.mockClear();
    storageStoreSpy.mockClear();
    cacheReadSpy.mockClear();
    cacheWriteSpy.mockClear();
    cacheEvictStpy.mockClear();
    storageMultiRemoveSpy.mockClear();
    CacheFactory.getInstance()?.flush();
  });

  describe("When multiple values are cached", () => {
    it("And when the next value will reach the max entries, Then the least recently written value is evicted ", async () => {
      await test.testCache1();
      await test.testCache2();
      await test.testCache3();
      await test.testCache4();

      expect(cacheEvictStpy).toHaveBeenCalledWith("@TestCache:testKey1", true);

      expect(cacheEvictStpy).toHaveBeenCalledTimes(1);
    });

    describe("And when they are read before their TTL expired", () => {
      beforeEach(async () => {
        await test.testCache1();
        await test.testCache2();
        await test.testCache3();
        jest.advanceTimersByTime(500);
        await test.testCache2();
        await test.testCache1(); // Least recently used
        await test.testCache3();
        jest.advanceTimersByTime(500);
        await test.testCache2();
        await test.testCache3();
        await test.testCache2();
      });

      it("And the values are less than the max entries, Then no value is evicted", async () => {
        expect(cacheEvictStpy).not.toHaveBeenCalled();
      });

      it("And when the next written value will reach the max entries, Then the least recently read value is evicted", async () => {
        await test.testCache4();

        expect(cacheEvictStpy).toHaveBeenCalledWith(
          "@TestCache:testKey1",
          true
        );

        expect(cacheEvictStpy).toHaveBeenCalledTimes(1);
      });
    });
  });
});
