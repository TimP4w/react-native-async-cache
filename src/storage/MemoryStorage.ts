export default class MemoryStorage {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  storage: any = {};

  async getItem(key: string): Promise<string | null> {
    if (this.storage[key]) {
      return this.storage[key];
    }
    return null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage[key] = value;
    return Promise.resolve();
  }

  async removeItem(key: string): Promise<void> {
    delete this.storage[key];
    return Promise.resolve();
  }

  async clear(): Promise<void> {
    this.storage = {};
    return Promise.resolve();
  }

  async getAllKeys(): Promise<readonly string[]> {
    return Object.keys(this.storage);
  }

  async multiRemove(keys: string[]): Promise<void> {
    for (const key of keys) {
      delete this.storage[key];
    }
  }
}
