# React Native Async Cache

A simple, decorated, AsyncStorage-based and configurable cache written in Typescript.

# Install

## NPM

```bash
$ npm install @timp4w/react-native-async-cache
```

## Yarn

```bash
$ yarn add @timp4w/react-native-async-cache
```

# Setup

## React Native (JS)

```bash
$ yarn add -D @babel/plugin-proposal-decorators
$ yarn add reflect-metadata
```

Then add to your `babel.config.js`

```javascript
  plugins: [['@babel/plugin-proposal-decorators', {legacy: true}]],
```

And in the top of your `index.js` file:

```javascript
import 'reflect-metadata';
...
```

## React Native (TS)

```bash
$ yarn add reflect-metadata
```

Then modify your `tsconfig.json` file to include the following:

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

And in the top of your `index.js` file:

```javascript
import 'reflect-metadata';
...
```

# Cache Factory methods

In order to start you need to import `CacheFactory` in your index file

```typescript
import { CacheFactory } from "@timp4w/react-native-async-cache";
```

## `.setNamespace(namespace: string)`

Set a namespace for your this.cache.

The keys will be serialized with `${namespace}:${key}`

## `.setBackend(backend: StorageBackend) `

Select a backend to use for your this.cache.

By default a MemoryStorage is provided.

You can use any backend with the following signature:

```typescript
type StorageBackend = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clear: () => Promise<void>;
  getAllKeys: () => Promise<readonly string[]>;
  multiRemove: (keys: string[]) => Promise<void>;
};
```

## `.attachStrategy(strategy: CacheStrategy) `

With this method you can attach a cach management strategy.

This library provides some basic strategies:

- LRUStrategy: When max entries are reached, remove the least recently used entry from the cache
- ... more to come

You can also write your own strategy, by implementing the `CacheStrategy` interface (see the implementation of the LRU strategy)

```typescript
class MyStrategy implements CacheStrategy {
  async onRead<T>(key: string, value: CachedItem<T>): Promise<void> {
    /* Do something when an item is read */
  }

  onWrite<T>(_key: string, _value: CachedItem<T>): Promise<void> {
    /* Do something when an item is written */
  }

  onEvict<T>(_key: string): Promise<void> {
    /* Do something when an item is evicted */
  }

  onInit(_namespace: string, _keyConstructor: (key: string) => string): void {
    /* Do something on cache init */
  }
}

export default new RemoveExpiredValueOnReadStrategy();
```

## `.create(): void`

Initialize the cache

## `.getInstance(): Cache | undefined`

Returns the instance of the cache as a singleton.

## Example

```typescript
const lruStrategy = new LRUStrategy();
lruStrategy.setMaxEntries(5000);

CacheFactory.setNamespace("@MyAppCache")
  .setBackend(AsyncStorage)
  .attachStrategy(lruStrategy)
  .create();

const cache = CacheFactory.getInstance();
```

# Decorators

## `@cached(key: string, ttl: number)`

Use this decorator above an async function to cache its value with the given TTL (in seconds).

## `@evictKey(key: string)`

Decorating a method with `evictKey` will evict the item stored with the given key.

You can also provide a pattern: `my-key:*` which will evict all items starting with that pattern, you **must use** this pattern if you want to evict all items where you used the `@cacheKey` decorator on the parameters.

In this example, calling `evictAll()` will evict all items cached for `cacheThis(...)` for all the arguments:

```typescript
@cached('my-multi-item', 60)
async cacheThis(@cacheKey a: number) {
  /* ... */
}

@evictKey('my-multi-item:*')
async evictAll() {
  /* ... */
}
```

## `@cacheKey`

You can decorate the parameters of your function with `@cacheKey` in order to serialize them into the key.

Useful if you want to cache the result given different parameters (see the note on `@evictKey()` for evicting the cached items if you use this decorator).

# APIs

You can also use the cache directly, it exposes the following APIs.

Just import the Cache Factory wherever you need it (after you called `.create()`) and call `.getInstance()`

```typescript
import { CacheFactory } from "@timp4w/react-native-async-cache";

const cache = CacheFactory.getInstance();

cache?.write<string>("myKey", "myValue", 60); // Stores 'myValue' with a TTL of 60 seconds
const myCachedString = cache?.read<string>("myKey"); // Read value
cache?.evict("myKey"); // Remove value
const cacheKeys: string[] = cache?.getAllKeys();
cache?.flush(); // Flush the whole cache
```

The methods that the strategies can hook to, have an extra `skipStrategy: boolean` flag, if you need to write / read items in the cache without causing an infinite loop in the strategy. You should ignore it and use the default value if you're not writing a strategy.

## Read

`public async read<T>(key: string, skipStrategy = false): Promise<T | null>`

## Write

`public async write<T>(key: string, value: T, ttl: number, skipStrategy = false): Promise<void>`

## Evict

`public async evict(key: string, skipStrategy = false): Promise<boolean>`

## Flush cache

`public async flush(): Promise<void>`

Flush all items in the cache.

## Get all keys

`public async getAllKeys(): Promise<string[] | undefined>`

Flush all keys stored in cache.

## Methods you would probably never use unless you write your strategy

### Create Storage Key

`public createStorageKey(key: string): string`

Returns the final storage key used by the cache.

### Serialize key

`public serializeItemKeys(key: string, additionalKeys: string[]): string`

Returns a serialized key.

### Is Expired?

`public isExpired(item: CachedItem<unknown>): boolean`

Test if an item is expired. You can use this in your custom strategy if you need to check for expiration.

# Example Usage

Your index file

```typescript
...
import 'reflect-metadata';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CacheFactory,
  LRUStrategy,
} from ' @timp4w/react-native-async-cache';

...
const lruStrategy = new LRUStrategy();
lruStrategy.setMaxEntries(5000);

CacheFactory.setNamespace("@MyAppCache")
  .setBackend(AsyncStorage)
  .attachStrategy(lruStrategy)
  .create();

const cache = CacheFactory.getInstance();

```

In your classes

```typescript
...
import {
  cached,
  evictKey,
  cacheKey
} from '@timp4w/react-native-async-cache';

class MyClass {
  @cached('cache-key', 1000)
  async cachedWork() {
    /* Do work */
  }

  @evictKey('cache-key')
  async evictOtherCacheWork() {
    /* Do work */
  }

  @cached('another-cache-key', 60)
  async anotherCachedWork(
    @cacheKey myParam1: string,
    @cacheKey myParam2: string
  ) {
    /* Do work */
  }
}

```

# ToDo

- Test performance
- Apply feedback
- Refactoring and renaming
