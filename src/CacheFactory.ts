import Cache from "./Cache";
import storage from "./storage/Storage";
import CacheStrategy from "./strategies/CacheStrategy.interface";
import { StorageBackend } from "./types/StorageBackend";

export class CacheFactory {
  private namespace = "@cache";
  private backend: StorageBackend | undefined;
  private strategies: CacheStrategy[] = [];
  private cache: Cache | undefined;

  public setNamespace(namespace: string): CacheFactory {
    this.namespace = namespace;
    return this;
  }

  public setBackend(backend: StorageBackend): CacheFactory {
    this.backend = backend;
    storage.setBackend(this.backend);
    return this;
  }

  public attachStrategy(strategy: CacheStrategy): CacheFactory {
    this.strategies.push(strategy);
    return this;
  }

  public getInstance(): Cache | undefined {
    return this.cache;
  }

  public create() {
    if (!this.cache) {
      this.cache = new Cache(this.namespace, this.strategies);
    }
  }
}

const cacheFactory = new CacheFactory();
export default cacheFactory;
