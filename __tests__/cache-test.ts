import { Storage } from "../src/storage/Storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { cached, evictKey, cacheKey, CacheFactory } from "../src/index";
import Cache from "../src/Cache";
class Work {
  async doWork(): Promise<number> {
    return Promise.resolve(Date.now());
  }

  async sum(a: number, b: number): Promise<number> {
    return a + b;
  }
}

const work = new Work();

class Test {
  @cached("testKey", 1000)
  async testCache() {
    return work.doWork();
  }

  @evictKey("testKey")
  async testEvict() {
    return Promise.resolve(true);
  }

  @cached("testKeyWithParams", 1000)
  async testWithParams(@cacheKey a: number, @cacheKey b: number) {
    return work.sum(a, b);
  }

  @evictKey("testKeyWithParams:*")
  async testEvictMulti() {
    return Promise.resolve(true);
  }
}

const cacheReadSpy = jest.spyOn(Cache.prototype, "read");
const cacheWriteSpy = jest.spyOn(Cache.prototype, "write");
const cacheEvictStpy = jest.spyOn(Cache.prototype, "evict");

const storageGetSpy = jest.spyOn(Storage.prototype, "get");
const storageStoreSpy = jest.spyOn(Storage.prototype, "store");
const storageMultiRemoveSpy = jest.spyOn(Storage.prototype, "multiRemove");

const workSpy = jest.spyOn(Work.prototype, "doWork");
const sumSpy = jest.spyOn(Work.prototype, "sum");

const test = new Test();

describe("Given a cache", () => {
  beforeAll(() => {
    jest.useFakeTimers();
    CacheFactory.setNamespace("@TestCache").setBackend(AsyncStorage).create();
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
    workSpy.mockClear();
    sumSpy.mockClear();
    AsyncStorage.clear();
  });

  describe("When a decorated method is called", () => {
    it("Then the result is stored in cache", async () => {
      await test.testCache();
      expect(storageStoreSpy).toHaveBeenCalledTimes(1);
      expect(cacheWriteSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("When a method is cached", () => {
    describe("And the TTL is not reached", () => {
      it("Then the upstream work is called", async () => {
        await test.testCache();
        expect(workSpy).toHaveBeenCalled();
      });

      it("Then subsequent calls wont call the upstream work", async () => {
        await test.testCache();
        jest.advanceTimersByTime(500);
        await test.testCache();

        expect(workSpy).toHaveBeenCalledTimes(1);
      });

      it("Then the new result is not stored again", async () => {
        await test.testCache();
        expect(storageStoreSpy).toHaveBeenCalledTimes(1);
        expect(cacheWriteSpy).toHaveBeenCalledTimes(1);
        storageStoreSpy.mockClear();
        cacheWriteSpy.mockClear();

        jest.advanceTimersByTime(500);

        await test.testCache();
        expect(storageStoreSpy).not.toHaveBeenCalled();
        expect(cacheWriteSpy).not.toHaveBeenCalled();
      });
    });

    describe("And the TTL is reached", () => {
      it("Then subsequent calls will call the upstream work", async () => {
        await test.testCache();
        jest.advanceTimersByTime(1500 * 1000);
        await test.testCache();

        expect(workSpy).toHaveBeenCalledTimes(2);
      });

      it("Then subsequent calls will store the result", async () => {
        await test.testCache();
        jest.advanceTimersByTime(1500 * 1000);
        await test.testCache();
        expect(cacheWriteSpy).toHaveBeenCalledTimes(2);
        expect(storageStoreSpy).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("When an evictKey decorated method is called and the TTL is not reached", () => {
    it("Then the cached value for that key is not returned ", async () => {
      await test.testCache();
      await test.testEvict();
      jest.advanceTimersByTime(500);
      await test.testCache();
      expect(workSpy).toHaveBeenCalledTimes(2);
      expect(cacheEvictStpy).toHaveBeenCalled();
    });

    describe("And the key is a multi key (multi argument)", () => {
      it("Then the cached value for that key and different arguments is not returned ", async () => {
        await test.testWithParams(1, 1);
        await test.testWithParams(1, 2);
        await test.testEvictMulti();
        jest.advanceTimersByTime(500);
        await test.testWithParams(1, 1);
        await test.testWithParams(1, 2);
        expect(sumSpy).toHaveBeenCalledTimes(4);
        expect(cacheEvictStpy).toHaveBeenCalled();
      });
    });
  });

  describe("When the cache is flushed", () => {
    it("Then the cached value for that key is not returned ", async () => {
      await test.testCache();
      await CacheFactory.getInstance()?.flush();
      await test.testCache();
      expect(workSpy).toHaveBeenCalledTimes(2);
      expect(storageMultiRemoveSpy).toHaveBeenCalledWith([
        "@TestCache:testKey",
      ]);
    });
  });

  describe("When a method with decorated parameters is called", () => {
    it("Then the cached value is returned and the work is not called", async () => {
      const resultPreCache = await test.testWithParams(1, 1);
      jest.advanceTimersByTime(500);
      const resultPostCache = await test.testWithParams(1, 1);
      expect(resultPostCache).toBe(resultPreCache);
      expect(sumSpy).toHaveBeenCalledTimes(1);
    });

    it("Then the correct result is returned for different arguments and the work is only called for each new argument", async () => {
      await test.testWithParams(1, 1);
      jest.advanceTimersByTime(250);
      await test.testWithParams(1, 2);
      jest.advanceTimersByTime(250);
      const result1 = await test.testWithParams(1, 1);
      const result2 = await test.testWithParams(1, 2);

      expect(result1).toBe(2);
      expect(result2).toBe(3);
      expect(sumSpy).toHaveBeenCalledTimes(2);
    });
  });
});
