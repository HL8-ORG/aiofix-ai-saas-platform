import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * @class PerformanceInterceptor
 * @description
 * 性能监控拦截器，负责监控和记录API性能指标。
 *
 * 拦截器职责：
 * 1. 监控请求处理时间
 * 2. 记录性能指标
 * 3. 检测性能瓶颈
 * 4. 提供性能报告
 *
 * 监控指标：
 * 1. 请求处理时间
 * 2. 响应大小
 * 3. 内存使用情况
 * 4. 错误率统计
 *
 * 性能分析：
 * 1. 慢查询检测
 * 2. 性能趋势分析
 * 3. 资源使用统计
 * 4. 性能优化建议
 *
 * @param {Logger} logger 日志服务
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseInterceptors(PerformanceInterceptor)
 * export class UserController {}
 * ```
 * @since 1.0.0
 */
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  private performanceStats: Map<string, PerformanceStats> = new Map();

  constructor(private readonly logger: Logger) {}

  /**
   * @method intercept
   * @description 拦截请求和响应，监控性能指标
   * @param {ExecutionContext} context 执行上下文
   * @param {CallHandler} next 下一个处理器
   * @returns {Observable<any>} 响应流
   *
   * 监控流程：
   * 1. 记录请求开始时间
   * 2. 监控内存使用情况
   * 3. 处理请求
   * 4. 记录性能指标
   * 5. 更新统计信息
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = process.hrtime.bigint();
    const startMemory = process.memoryUsage();

    // 记录请求开始时间
    this.logRequestStart(request);

    return next.handle().pipe(
      tap({
        next: data => {
          const endTime = process.hrtime.bigint();
          const endMemory = process.memoryUsage();
          this.recordPerformanceMetrics(
            request,
            response,
            data,
            startTime,
            endTime,
            startMemory,
            endMemory,
          );
        },
        error: error => {
          const endTime = process.hrtime.bigint();
          const endMemory = process.memoryUsage();
          this.recordErrorMetrics(
            request,
            response,
            error,
            startTime,
            endTime,
            startMemory,
            endMemory,
          );
        },
      }),
    );
  }

  /**
   * @method logRequestStart
   * @description 记录请求开始时间
   * @param {any} request HTTP请求对象
   * @returns {void}
   * @private
   */
  private logRequestStart(request: any): void {
    const requestInfo = {
      method: request.method,
      url: request.url,
      userId: request.user?.id,
      tenantId: request.tenant?.id,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(
      `Request started: ${request.method} ${request.url}`,
      'PERFORMANCE_START',
      requestInfo,
    );
  }

  /**
   * @method recordPerformanceMetrics
   * @description 记录性能指标
   * @param {any} request HTTP请求对象
   * @param {any} response HTTP响应对象
   * @param {any} data 响应数据
   * @param {bigint} startTime 开始时间
   * @param {bigint} endTime 结束时间
   * @param {NodeJS.MemoryUsage} startMemory 开始内存使用
   * @param {NodeJS.MemoryUsage} endMemory 结束内存使用
   * @returns {void}
   * @private
   */
  private recordPerformanceMetrics(
    request: any,
    response: any,
    data: any,
    startTime: bigint,
    endTime: bigint,
    startMemory: NodeJS.MemoryUsage,
    endMemory: NodeJS.MemoryUsage,
  ): void {
    const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
    const responseSize = this.calculateResponseSize(data);

    const performanceMetrics = {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration,
      memoryDelta,
      responseSize,
      userId: request.user?.id,
      tenantId: request.tenant?.id,
      timestamp: new Date().toISOString(),
    };

    // 记录性能日志
    this.logger.log(
      `Performance: ${request.method} ${request.url} - ${duration.toFixed(2)}ms (${responseSize} bytes)`,
      'PERFORMANCE_METRICS',
      performanceMetrics,
    );

    // 更新统计信息
    this.updatePerformanceStats(request, performanceMetrics);

    // 检查性能阈值
    this.checkPerformanceThresholds(performanceMetrics);
  }

  /**
   * @method recordErrorMetrics
   * @description 记录错误性能指标
   * @param {any} request HTTP请求对象
   * @param {any} response HTTP响应对象
   * @param {Error} error 错误对象
   * @param {bigint} startTime 开始时间
   * @param {bigint} endTime 结束时间
   * @param {NodeJS.MemoryUsage} startMemory 开始内存使用
   * @param {NodeJS.MemoryUsage} endMemory 结束内存使用
   * @returns {void}
   * @private
   */
  private recordErrorMetrics(
    request: any,
    response: any,
    error: Error,
    startTime: bigint,
    endTime: bigint,
    startMemory: NodeJS.MemoryUsage,
    endMemory: NodeJS.MemoryUsage,
  ): void {
    const duration = Number(endTime - startTime) / 1000000; // 转换为毫秒
    const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;

    const errorMetrics = {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration,
      memoryDelta,
      errorMessage: error.message,
      userId: request.user?.id,
      tenantId: request.tenant?.id,
      timestamp: new Date().toISOString(),
    };

    // 记录错误性能日志
    this.logger.error(
      `Error Performance: ${request.method} ${request.url} - ${duration.toFixed(2)}ms`,
      error.stack,
      'PERFORMANCE_ERROR',
      errorMetrics,
    );

    // 更新错误统计
    this.updateErrorStats(request, errorMetrics);
  }

  /**
   * @method updatePerformanceStats
   * @description 更新性能统计信息
   * @param {any} request HTTP请求对象
   * @param {any} metrics 性能指标
   * @returns {void}
   * @private
   */
  private updatePerformanceStats(request: any, metrics: any): void {
    const key = `${request.method}:${request.url}`;
    const stats = this.performanceStats.get(key) || {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      totalResponseSize: 0,
      totalMemoryDelta: 0,
      errorCount: 0,
    };

    stats.count++;
    stats.totalDuration += metrics.duration;
    stats.minDuration = Math.min(stats.minDuration, metrics.duration);
    stats.maxDuration = Math.max(stats.maxDuration, metrics.duration);
    stats.totalResponseSize += metrics.responseSize;
    stats.totalMemoryDelta += metrics.memoryDelta;

    this.performanceStats.set(key, stats);
  }

  /**
   * @method updateErrorStats
   * @description 更新错误统计信息
   * @param {any} request HTTP请求对象
   * @param {any} metrics 错误指标
   * @returns {void}
   * @private
   */
  private updateErrorStats(request: any, metrics: any): void {
    const key = `${request.method}:${request.url}`;
    const stats = this.performanceStats.get(key);
    if (stats) {
      stats.errorCount++;
    }
  }

  /**
   * @method checkPerformanceThresholds
   * @description 检查性能阈值
   * @param {any} metrics 性能指标
   * @returns {void}
   * @private
   */
  private checkPerformanceThresholds(metrics: any): void {
    const thresholds = {
      slowRequest: 1000, // 1秒
      largeResponse: 1024 * 1024, // 1MB
      highMemoryUsage: 10 * 1024 * 1024, // 10MB
    };

    if (metrics.duration > thresholds.slowRequest) {
      this.logger.warn(
        `Slow request detected: ${metrics.method} ${metrics.url} - ${metrics.duration.toFixed(2)}ms`,
        'PERFORMANCE_WARNING',
        metrics,
      );
    }

    if (metrics.responseSize > thresholds.largeResponse) {
      this.logger.warn(
        `Large response detected: ${metrics.method} ${metrics.url} - ${metrics.responseSize} bytes`,
        'PERFORMANCE_WARNING',
        metrics,
      );
    }

    if (metrics.memoryDelta > thresholds.highMemoryUsage) {
      this.logger.warn(
        `High memory usage detected: ${metrics.method} ${metrics.url} - ${metrics.memoryDelta} bytes`,
        'PERFORMANCE_WARNING',
        metrics,
      );
    }
  }

  /**
   * @method calculateResponseSize
   * @description 计算响应大小
   * @param {any} data 响应数据
   * @returns {number} 响应大小（字节）
   * @private
   */
  private calculateResponseSize(data: any): number {
    try {
      if (data === null || data === undefined) {
        return 0;
      }

      if (typeof data === 'string') {
        return Buffer.byteLength(data, 'utf8');
      }

      if (typeof data === 'object') {
        return Buffer.byteLength(JSON.stringify(data), 'utf8');
      }

      return Buffer.byteLength(String(data), 'utf8');
    } catch (error) {
      return 0;
    }
  }

  /**
   * @method getPerformanceStats
   * @description 获取性能统计信息
   * @returns {Map<string, PerformanceStats>} 性能统计信息
   */
  getPerformanceStats(): Map<string, PerformanceStats> {
    return new Map(this.performanceStats);
  }

  /**
   * @method resetPerformanceStats
   * @description 重置性能统计信息
   * @returns {void}
   */
  resetPerformanceStats(): void {
    this.performanceStats.clear();
  }
}

/**
 * 性能统计信息接口
 */
interface PerformanceStats {
  count: number;
  totalDuration: number;
  minDuration: number;
  maxDuration: number;
  totalResponseSize: number;
  totalMemoryDelta: number;
  errorCount: number;
}
