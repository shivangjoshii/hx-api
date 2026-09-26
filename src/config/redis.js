import Redis from 'ioredis';
import { ENV } from './env.js';

class CacheService {
  constructor() {
    this.memoryStore = new Map();
    this.isRedisConnected = false;
    this.client = null;

    try {
      this.client = new Redis(ENV.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
          if (times > 3) {
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        enableOfflineQueue: false,
        lazyConnect: true
      });

      this.client.connect().then(() => {
        this.isRedisConnected = true;
        console.log('Redis Connected successfully');
      }).catch(() => {
        this.isRedisConnected = false;
      });

      this.client.on('error', () => {
        this.isRedisConnected = false;
      });

      this.client.on('connect', () => {
        this.isRedisConnected = true;
      });
    } catch {
      this.isRedisConnected = false;
    }
  }

  async get(key) {
    if (this.isRedisConnected && this.client) {
      try {
        const data = await this.client.get(key);
        return data ? JSON.parse(data) : null;
      } catch {
        const item = this.memoryStore.get(key);
        if (!item) return null;
        if (item.expiresAt && Date.now() > item.expiresAt) {
          this.memoryStore.delete(key);
          return null;
        }
        return item.value;
      }
    }
    const item = this.memoryStore.get(key);
    if (!item) return null;
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, ttlSeconds = 3600) {
    const stringValue = JSON.stringify(value);
    if (this.isRedisConnected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, stringValue, 'EX', ttlSeconds);
        } else {
          await this.client.set(key, stringValue);
        }
        return true;
      } catch {
        this.memoryStore.set(key, {
          value,
          expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
        });
        return true;
      }
    }
    this.memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null
    });
    return true;
  }

  async del(key) {
    this.memoryStore.delete(key);
    if (this.isRedisConnected && this.client) {
      try {
        await this.client.del(key);
      } catch {
        return false;
      }
    }
    return true;
  }

  async delPattern(pattern) {
    for (const key of this.memoryStore.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.memoryStore.delete(key);
      }
    }
    if (this.isRedisConnected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
      } catch {
        return false;
      }
    }
    return true;
  }
}

export const cache = new CacheService();
