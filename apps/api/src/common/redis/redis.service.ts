import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: any = null;
  private readonly logger = new Logger(RedisService.name);
  private useMemory = false;
  private memoryStore = new Map<string, { value: string; expiry?: number }>();

  constructor(private configService: ConfigService) {
    this.connect();
  }

  private async connect() {
    try {
      const Redis = (await import('ioredis')).default;
      this.client = new Redis(this.configService.get<string>('REDIS_URL', 'redis://localhost:6379'), {
        maxRetriesPerRequest: 1,
        retryStrategy(times) {
          if (times > 2) return null;
          return Math.min(times * 100, 1000);
        },
        lazyConnect: true,
        connectTimeout: 3000,
      });
      await this.client.connect();
      this.logger.log('Redis connected');
    } catch {
      this.logger.warn('Redis unavailable - using in-memory cache');
      this.useMemory = true;
      this.client = null;
    }
  }

  getClient() {
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemory) {
      const entry = this.memoryStore.get(key);
      if (!entry) return null;
      if (entry.expiry && Date.now() > entry.expiry) {
        this.memoryStore.delete(key);
        return null;
      }
      return entry.value;
    }
    try { return await this.client?.get(key) ?? null; } catch { return null; }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (this.useMemory) {
      this.memoryStore.set(key, {
        value,
        expiry: ttl ? Date.now() + ttl * 1000 : undefined,
      });
      return;
    }
    try {
      if (ttl) await this.client?.set(key, value, 'EX', ttl);
      else await this.client?.set(key, value);
    } catch { /* silently fail */ }
  }

  async del(key: string): Promise<void> {
    if (this.useMemory) { this.memoryStore.delete(key); return; }
    try { await this.client?.del(key); } catch { /* silently fail */ }
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (!value) return null;
    try { return JSON.parse(value) as T; } catch { return null; }
  }

  async setJson<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttl);
  }

  async increment(key: string): Promise<number> {
    if (this.useMemory) {
      const curr = parseInt(await this.get(key) || '0', 10);
      await this.set(key, String(curr + 1));
      return curr + 1;
    }
    try { return await this.client?.incr(key) ?? 0; } catch { return 0; }
  }

  async expire(key: string, seconds: number): Promise<void> {
    if (this.useMemory) {
      const entry = this.memoryStore.get(key);
      if (entry) entry.expiry = Date.now() + seconds * 1000;
      return;
    }
    try { await this.client?.expire(key, seconds); } catch { /* silently fail */ }
  }

  async exists(key: string): Promise<boolean> {
    if (this.useMemory) return this.memoryStore.has(key);
    try { return (await this.client?.exists(key)) === 1; } catch { return false; }
  }

  async keys(pattern: string): Promise<string[]> {
    if (this.useMemory) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return [...this.memoryStore.keys()].filter((k) => regex.test(k));
    }
    try { return await this.client?.keys(pattern) ?? []; } catch { return []; }
  }

  async flushByPattern(pattern: string): Promise<void> {
    if (this.useMemory) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.memoryStore.keys()) {
        if (regex.test(key)) this.memoryStore.delete(key);
      }
      return;
    }
    try {
      const keys = await this.keys(pattern);
      if (keys.length > 0) await this.client?.del(...keys);
    } catch { /* silently fail */ }
  }

  async onModuleDestroy() {
    try { await this.client?.quit(); } catch { /* already closed */ }
  }
}
