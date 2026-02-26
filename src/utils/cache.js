const DEFAULT_TTL_MS = 5 * 60 * 1000;

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  get(key) {
    const hit = this.store.get(key);
    if (!hit) return null;

    if (Date.now() > hit.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return hit.value;
  }

  set(key, value, ttlMs = DEFAULT_TTL_MS) {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });

    return value;
  }

  async wrap(key, producer, ttlMs = DEFAULT_TTL_MS) {
    const cached = this.get(key);
    if (cached) return cached;

    const value = await producer();
    return this.set(key, value, ttlMs);
  }

  stats() {
    return {
      keys: this.store.size,
      ttlMs: DEFAULT_TTL_MS,
    };
  }
}

module.exports = {
  MemoryCache,
  DEFAULT_TTL_MS,
};
