import { Module } from '@nestjs/common';
import { RedisCacheService } from './redis-cache.service';
import { ICacheService } from './cache.service.interface';

/**
 * @class CacheModule
 * @description
 * 缓存模块，提供缓存服务的依赖注入和配置。
 *
 * 模块职责：
 * 1. 提供缓存服务的依赖注入
 * 2. 配置缓存服务的实现
 * 3. 管理缓存服务的生命周期
 * 4. 提供缓存服务的统一接口
 *
 * 服务提供：
 * 1. ICacheService - 缓存服务接口
 * 2. RedisCacheService - Redis缓存服务实现
 *
 * @example
 * ```typescript
 * @Module({
 *   imports: [CacheModule],
 *   providers: [UserService],
 * })
 * export class UserModule {}
 * ```
 * @since 1.0.0
 */
@Module({
  providers: [
    {
      provide: 'ICacheService',
      useClass: RedisCacheService,
    },
    RedisCacheService,
  ],
  exports: ['ICacheService', RedisCacheService],
})
export class CacheModule {}
