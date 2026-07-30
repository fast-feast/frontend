/**
 * Lightweight in-memory cache with TTL for API responses.
 * Prevents re-fetching data when screens remount during navigation.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

const store = new Map<string, CacheEntry<unknown>>();

// Default TTL: 2 minutes
const DEFAULT_TTL = 120_000;

/**
 * Retrieve a cached value. Returns `null` if the key doesn't exist
 * or the entry has expired (auto-deletes expired entries).
 */
export function getCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > entry.ttl) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Store a value in the cache with an optional TTL (milliseconds).
 * Default TTL is 2 minutes.
 */
export function setCache<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
  store.set(key, { data, timestamp: Date.now(), ttl });
}

/**
 * Clear all cache entries, or only those whose key starts with `pattern`.
 */
export function clearCache(pattern?: string): void {
  if (!pattern) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(pattern)) {
      store.delete(key);
    }
  }
}

/**
 * Invalidate cache entries that match a predicate function.
 */
export function invalidateCache(predicate: (key: string) => boolean): void {
  for (const key of store.keys()) {
    if (predicate(key)) {
      store.delete(key);
    }
  }
}
