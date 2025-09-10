/**
 * @fileoverview 缓存服务模拟对象
 * @description 提供缓存服务的测试模拟实现
 * @since 1.0.0
 */

import { UserId } from '@aiofix/shared';
import { ICacheService } from '../../src/infrastructure/cache/cache.service.interface';

/**
 * 缓存服务模拟实现
 */
export class MockCacheService implements ICacheService {
  private cache: Map<string, any> = new Map();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    clears: 0,
    totalOperations: 0,
  };

  async get<T>(key: string): Promise<T | null> {
    this.stats.totalOperations++;
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.stats.hits++;
      return value as T;
    } else {
      this.stats.misses++;
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.cache.set(key, value);
    this.stats.sets++;
    this.stats.totalOperations++;
  }

  async delete(key: string): Promise<boolean> {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    this.stats.deletes++;
    this.stats.totalOperations++;
    return existed;
  }

  async exists(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    return this.cache.has(key);
  }

  async clearTenantCache(): Promise<number> {
    const size = this.cache.size;
    this.cache.clear();
    this.stats.clears += size;
    this.stats.totalOperations += size;
    return size;
  }

  async getUserCache<T>(userId: UserId, cacheType: string): Promise<T | null> {
    const key = `user:${userId.value}:${cacheType}`;
    return this.get<T>(key);
  }

  async setUserCache<T>(
    userId: UserId,
    cacheType: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void> {
    const key = `user:${userId.value}:${cacheType}`;
    await this.set(key, value, ttlSeconds);
  }

  async deleteUserCache(userId: UserId, cacheType?: string): Promise<number> {
    if (cacheType) {
      const key = `user:${userId.value}:${cacheType}`;
      const existed = this.cache.has(key);
      this.cache.delete(key);
      if (existed) {
        this.stats.deletes++;
        this.stats.totalOperations++;
      }
      return existed ? 1 : 0;
    } else {
      // 删除用户的所有缓存
      let deletedCount = 0;
      const userPrefix = `user:${userId.value}:`;
      for (const key of this.cache.keys()) {
        if (key.startsWith(userPrefix)) {
          this.cache.delete(key);
          deletedCount++;
        }
      }
      this.stats.deletes += deletedCount;
      this.stats.totalOperations += deletedCount;
      return deletedCount;
    }
  }

  getCacheStats() {
    return { ...this.stats };
  }

  resetCacheStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      totalOperations: 0,
    };
  }

  // 测试辅助方法
  clear(): void {
    this.cache.clear();
    this.resetCacheStats();
  }

  getCacheSize(): number {
    return this.cache.size;
  }

  hasKey(key: string): boolean {
    return this.cache.has(key);
  }
}
