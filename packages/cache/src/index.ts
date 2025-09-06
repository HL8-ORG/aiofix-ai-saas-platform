/**
 * Aiofix缓存模块
 *
 * 提供统一的缓存管理功能，包括：
 * - Redis缓存
 * - 内存缓存
 * - 缓存策略
 * - 缓存失效
 * - NestJS集成
 *
 * @fileoverview 缓存模块入口
 * @author AI开发团队
 * @since 1.0.0
 */

// 缓存服务导出
export * from './services/cache.service';
export * from './interfaces/cache.interface';

// 缓存策略导出
export * from './strategies/redis-cache.strategy';
export * from './strategies/memory-cache.strategy';

// 缓存模块导出
export * from './cache.module';

// 版本信息
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@aiofix/cache';
