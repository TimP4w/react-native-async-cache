export interface CachedItem<T> {
  expiresAt: number;
  data: T;
}
