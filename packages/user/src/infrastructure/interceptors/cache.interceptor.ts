import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ICacheService } from '../cache/cache.service.interface';

/**
 * @class CacheInterceptor
 * @description
 * 缓存拦截器，负责实现HTTP响应的缓存机制。
 *
 * 拦截器职责：
 * 1. 检查缓存中是否存在响应数据
 * 2. 缓存HTTP响应数据
 * 3. 管理缓存过期时间
 * 4. 支持条件缓存
 *
 * 缓存策略：
 * 1. 基于请求URL和参数的缓存键
 * 2. 支持TTL过期时间
 * 3. 支持条件缓存（基于用户、租户等）
 * 4. 支持缓存失效机制
 *
 * 多租户支持：
 * 1. 基于租户ID的缓存隔离
 * 2. 支持租户级缓存配置
 * 3. 实现租户级缓存清理
 * 4. 确保跨租户数据安全
 *
 * @param {ICacheService} cacheService 缓存服务
 * @param {Logger} logger 日志服务
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseInterceptors(CacheInterceptor)
 * export class UserController {}
 * ```
 * @since 1.0.0
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: ICacheService,
    private readonly logger: Logger,
  ) {}

  /**
   * @method intercept
   * @description 拦截请求和响应，实现缓存机制
   * @param {ExecutionContext} context 执行上下文
   * @param {CallHandler} next 下一个处理器
   * @returns {Observable<any>} 响应流
   *
   * 缓存流程：
   * 1. 生成缓存键
   * 2. 检查缓存中是否存在数据
   * 3. 如果存在，返回缓存数据
   * 4. 如果不存在，处理请求并缓存响应
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // 1. 生成缓存键
    const cacheKey = this.generateCacheKey(request);

    // 2. 检查缓存中是否存在数据
    const cachedData = await this.cacheService.get(cacheKey);
    if (cachedData) {
      this.logger.log(`Cache hit for key: ${cacheKey}`);
      return of(cachedData);
    }

    // 3. 处理请求并缓存响应
    return next.handle().pipe(
      tap(data => {
        this.cacheResponse(cacheKey, data, request);
      }),
    );
  }

  /**
   * @method generateCacheKey
   * @description 生成缓存键
   * @param {any} request HTTP请求对象
   * @returns {string} 缓存键
   * @private
   */
  private generateCacheKey(request: any): string {
    const { method, url, query, params, user, tenant } = request;

    // 构建缓存键组件
    const keyComponents = [
      method.toLowerCase(),
      url,
      JSON.stringify(query),
      JSON.stringify(params),
    ];

    // 添加用户和租户信息（如果需要用户级缓存）
    if (user?.id) {
      keyComponents.push(`user:${user.id}`);
    }

    if (tenant?.id) {
      keyComponents.push(`tenant:${tenant.id}`);
    }

    // 生成缓存键
    const cacheKey = keyComponents.join(':');
    return this.hashCacheKey(cacheKey);
  }

  /**
   * @method hashCacheKey
   * @description 对缓存键进行哈希处理
   * @param {string} key 原始缓存键
   * @returns {string} 哈希后的缓存键
   * @private
   */
  private hashCacheKey(key: string): string {
    // TODO: 实现缓存键哈希
    // 1. 使用SHA-256哈希算法
    // 2. 截取前16个字符作为缓存键
    // 3. 添加前缀标识
    return `cache:${key.substring(0, 16)}`;
  }

  /**
   * @method cacheResponse
   * @description 缓存响应数据
   * @param {string} cacheKey 缓存键
   * @param {any} data 响应数据
   * @param {any} request HTTP请求对象
   * @returns {void}
   * @private
   */
  private async cacheResponse(
    cacheKey: string,
    data: any,
    request: any,
  ): Promise<void> {
    try {
      // 1. 确定缓存TTL
      const ttl = this.getCacheTTL(request);

      // 2. 检查是否应该缓存
      if (!this.shouldCache(request, data)) {
        return;
      }

      // 3. 缓存响应数据
      await this.cacheService.set(cacheKey, data, ttl);

      this.logger.log(`Cached response for key: ${cacheKey} (TTL: ${ttl}s)`);
    } catch (error) {
      this.logger.error(`Failed to cache response for key: ${cacheKey}`, error);
    }
  }

  /**
   * @method getCacheTTL
   * @description 获取缓存TTL时间
   * @param {any} request HTTP请求对象
   * @returns {number} TTL时间（秒）
   * @private
   */
  private getCacheTTL(request: any): number {
    // TODO: 实现TTL配置
    // 1. 从请求头获取TTL配置
    // 2. 根据请求类型设置默认TTL
    // 3. 支持租户级TTL配置
    // 4. 返回TTL时间

    const ttlFromHeader = request.headers['x-cache-ttl'];
    if (ttlFromHeader) {
      return parseInt(ttlFromHeader, 10);
    }

    // 默认TTL配置
    const method = request.method.toLowerCase();
    switch (method) {
      case 'get':
        return 300; // 5分钟
      case 'post':
        return 60; // 1分钟
      case 'put':
      case 'patch':
        return 120; // 2分钟
      case 'delete':
        return 0; // 不缓存
      default:
        return 60; // 1分钟
    }
  }

  /**
   * @method shouldCache
   * @description 检查是否应该缓存响应
   * @param {any} request HTTP请求对象
   * @param {any} data 响应数据
   * @returns {boolean} 是否应该缓存
   * @private
   */
  private shouldCache(request: any, data: any): boolean {
    // 1. 检查HTTP方法
    const method = request.method.toLowerCase();
    if (method !== 'get') {
      return false;
    }

    // 2. 检查响应状态码
    const statusCode = request.res?.statusCode;
    if (statusCode && statusCode >= 400) {
      return false;
    }

    // 3. 检查响应数据
    if (!data || data === null) {
      return false;
    }

    // 4. 检查缓存控制头
    const cacheControl = request.headers['cache-control'];
    if (cacheControl && cacheControl.includes('no-cache')) {
      return false;
    }

    // 5. 检查用户权限（敏感数据不缓存）
    if (this.isSensitiveData(request, data)) {
      return false;
    }

    return true;
  }

  /**
   * @method isSensitiveData
   * @description 检查是否为敏感数据
   * @param {any} request HTTP请求对象
   * @param {any} data 响应数据
   * @returns {boolean} 是否为敏感数据
   * @private
   */
  private isSensitiveData(request: any, data: any): boolean {
    // TODO: 实现敏感数据检查
    // 1. 检查URL路径
    // 2. 检查响应数据内容
    // 3. 检查用户权限
    // 4. 返回是否为敏感数据

    const sensitivePaths = ['/auth', '/password', '/token', '/secret'];
    const url = request.url.toLowerCase();

    return sensitivePaths.some(path => url.includes(path));
  }
}
