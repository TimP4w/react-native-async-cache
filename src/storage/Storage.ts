import { StorageBackend } from "../types/StorageBackend";
import MemoryStorage from "./MemoryStorage";

export class Storage {
  private backend: StorageBackend = new MemoryStorage();

  public setBackend(backend: StorageBackend) {
    this.backend = backend;
  }

  async get<T>(key: string): Promise<T> {
    return this.backend.getItem(key).then((value) => {
      if (value) {
        return JSON.parse(value);
      }
      return null;
    });
  }

  async store<T>(key: string, item: T): Promise<void> {
    const stringifiyedItem: string = JSON.stringify(item);
    return this.backend.setItem(key, stringifiyedItem);
  }

  async delete(key: string): Promise<boolean> {
    return this.backend
      .removeItem(key)
      .then(() => {
        return Promise.resolve(true);
      })
      .catch(() => {
        return Promise.resolve(false);
      });
  }

  async getAllKeys(): Promise<readonly string[]> {
    return this.backend.getAllKeys();
  }

  async multiRemove(keys: string[]): Promise<void> {
    return this.backend.multiRemove(keys);
  }
}

const storage = new Storage();

export default storage;
