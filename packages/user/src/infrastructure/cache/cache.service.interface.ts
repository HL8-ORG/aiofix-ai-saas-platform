import { UserId } from '@aiofix/shared';

/**
 * @interface ICacheService
 * @description
 * 缓存服务接口，定义缓存操作的标准接口。
 *
 * 缓存服务职责：
 * 1. 提供键值对缓存存储
 * 2. 实现缓存过期和淘汰策略
 * 3. 支持分布式缓存同步
 * 4. 提供缓存统计和监控
 *
 * 多租户支持：
 * 1. 基于租户ID的缓存键命名空间
 * 2. 租户级缓存隔离
 * 3. 租户级缓存统计
 * 4. 支持租户级缓存清理
 *
 * @example
 * ```typescript
 * const cacheService: ICacheService = new RedisCacheService(logger);
 * await cacheService.set('user:123', userData, 300);
 * const userData = await cacheService.get('user:123');
 * ```
 * @since 1.0.0
 */
export interface ICacheService {
  /**
   * @method get
   * @description 从缓存中获取数据
   * @param {string} key 缓存键
   * @returns {Promise<T | null>} 缓存数据或null
   * @template T 数据类型
   * @throws {CacheError} 当缓存操作失败时抛出
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * @method set
   * @description 设置缓存数据
   * @param {string} key 缓存键
   * @param {T} value 缓存值
   * @param {number} ttlSeconds TTL秒数
   * @returns {Promise<void>}
   * @template T 数据类型
   * @throws {CacheError} 当缓存操作失败时抛出
   */
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;

  /**
   * @method delete
   * @description 删除缓存数据
   * @param {string} key 缓存键
   * @returns {Promise<boolean>} 是否删除成功
   * @throws {CacheError} 当缓存操作失败时抛出
   */
  delete(key: string): Promise<boolean>;

  /**
   * @method exists
   * @description 检查缓存键是否存在
   * @param {string} key 缓存键
   * @returns {Promise<boolean>} 是否存在
   * @throws {CacheError} 当缓存操作失败时抛出
   */
  exists(key: string): Promise<boolean>;

  /**
   * @method expire
   * @description 设置缓存键的过期时间
   * @param {string} key 缓存键
   * @param {number} ttlSeconds TTL秒数
   * @returns {Promise<boolean>} 是否设置成功
   * @throws {CacheError} 当缓存操作失败时抛出
   */
  expire(key: string, ttlSeconds: number): Promise<boolean>;

  /**
   * @method clearTenantCache
   * @description 清理租户级缓存
   * @returns {Promise<number>} 清理的键数量
   * @throws {CacheError} 当缓存操作失败时抛出
   */
  clearTenantCache(): Promise<number>;

  /**
   * @method getUserCache
   * @description 获取用户缓存数据
   * @param {UserId} userId 用户ID
   * @param {string} cacheType 缓存类型
   * @returns {Promise<T | null>} 用户缓存数据
   * @template T 数据类型
   */
  getUserCache<T>(userId: UserId, cacheType: string): Promise<T | null>;

  /**
   * @method setUserCache
   * @description 设置用户缓存数据
   * @param {UserId} userId 用户ID
   * @param {string} cacheType 缓存类型
   * @param {T} value 缓存值
   * @param {number} ttlSeconds TTL秒数
   * @returns {Promise<void>}
   * @template T 数据类型
   */
  setUserCache<T>(
    userId: UserId,
    cacheType: string,
    value: T,
    ttlSeconds: number,
  ): Promise<void>;

  /**
   * @method deleteUserCache
   * @description 删除用户缓存数据
   * @param {UserId} userId 用户ID
   * @param {string} [cacheType] 缓存类型，可选
   * @returns {Promise<number>} 删除的键数量
   */
  deleteUserCache(userId: UserId, cacheType?: string): Promise<number>;

  /**
   * @method getCacheStats
   * @description 获取缓存统计信息
   * @returns {CacheStats} 缓存统计信息
   */
  getCacheStats(): CacheStats;

  /**
   * @method resetCacheStats
   * @description 重置缓存统计信息
   * @returns {void}
   */
  resetCacheStats(): void;
}

/**
 * 缓存统计信息接口
 */
export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  clears: number;
  totalOperations: number;
}

/**
 * 缓存异常
 */
export class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}
