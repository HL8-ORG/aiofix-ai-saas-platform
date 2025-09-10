/**
 * @fileoverview 缓存模块导出文件
 * @description 导出缓存相关的服务、接口和模块
 * @since 1.0.0
 */

export {
  ICacheService,
  CacheStats,
  CacheError,
} from './cache.service.interface';
export { RedisCacheService } from './redis-cache.service';
export { CacheModule } from './cache.module';
