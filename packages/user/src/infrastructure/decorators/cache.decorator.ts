import { SetMetadata } from '@nestjs/common';

/**
 * @constant CACHE_KEY
 * @description 缓存元数据键
 */
export const CACHE_KEY = 'cache';

/**
 * @constant CACHE_TTL_KEY
 * @description 缓存TTL元数据键
 */
export const CACHE_TTL_KEY = 'cache_ttl';

/**
 * @function Cache
 * @description
 * 缓存装饰器，用于指定控制器或方法的缓存配置。
 *
 * 装饰器功能：
 * 1. 指定缓存策略和配置
 * 2. 支持TTL过期时间设置
 * 3. 与CacheInterceptor配合使用
 * 4. 提供细粒度缓存控制
 *
 * 缓存策略：
 * 1. 基于请求URL和参数的缓存键
 * 2. 支持TTL过期时间
 * 3. 支持条件缓存
 * 4. 支持缓存失效机制
 *
 * @param {CacheConfig} config 缓存配置
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @Cache({ ttl: 300, key: 'users' })
 * export class UserController {
 *   @Get()
 *   @Cache({ ttl: 600, key: 'users:list' })
 *   async getUsers() {}
 *
 *   @Get(':id')
 *   @Cache({ ttl: 300, key: 'user:detail' })
 *   async getUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const Cache = (config: CacheConfig) => SetMetadata(CACHE_KEY, config);

/**
 * @function CacheTTL
 * @description
 * 缓存TTL装饰器，用于指定缓存过期时间。
 *
 * 装饰器功能：
 * 1. 指定缓存过期时间
 * 2. 支持动态TTL计算
 * 3. 与CacheInterceptor配合使用
 * 4. 提供简单的TTL设置
 *
 * @param {number} ttl TTL时间（秒）
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @CacheTTL(300) // 5分钟缓存
 *   async getUsers() {}
 *
 *   @Get(':id')
 *   @CacheTTL(600) // 10分钟缓存
 *   async getUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl);

/**
 * @function NoCache
 * @description
 * 禁用缓存装饰器，用于指定不缓存响应。
 *
 * 装饰器功能：
 * 1. 禁用响应缓存
 * 2. 确保数据实时性
 * 3. 与CacheInterceptor配合使用
 * 4. 提供缓存控制选项
 *
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @CacheTTL(300)
 *   async getUsers() {}
 *
 *   @Post()
 *   @NoCache()
 *   async createUser() {}
 *
 *   @Put(':id')
 *   @NoCache()
 *   async updateUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const NoCache = () => SetMetadata(CACHE_KEY, { enabled: false });

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled?: boolean;
  /** 缓存键前缀 */
  key?: string;
  /** TTL时间（秒） */
  ttl?: number;
  /** 缓存条件 */
  condition?: CacheCondition;
  /** 缓存策略 */
  strategy?: CacheStrategy;
  /** 是否包含用户信息 */
  includeUser?: boolean;
  /** 是否包含租户信息 */
  includeTenant?: boolean;
}

/**
 * 缓存条件接口
 */
export interface CacheCondition {
  /** 基于HTTP方法的条件 */
  methods?: string[];
  /** 基于状态码的条件 */
  statusCodes?: number[];
  /** 基于用户角色的条件 */
  roles?: string[];
  /** 基于租户的条件 */
  tenants?: string[];
}

/**
 * 缓存策略枚举
 */
export enum CacheStrategy {
  /** 标准缓存 */
  STANDARD = 'STANDARD',
  /** 智能缓存 */
  INTELLIGENT = 'INTELLIGENT',
  /** 分布式缓存 */
  DISTRIBUTED = 'DISTRIBUTED',
  /** 本地缓存 */
  LOCAL = 'LOCAL',
}
