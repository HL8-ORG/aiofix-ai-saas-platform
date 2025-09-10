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
 * @class LoggingInterceptor
 * @description
 * 日志拦截器，负责记录请求和响应的日志信息。
 *
 * 拦截器职责：
 * 1. 记录HTTP请求信息
 * 2. 记录响应状态和时间
 * 3. 提供性能监控
 * 4. 支持结构化日志
 *
 * 日志记录内容：
 * 1. 请求方法、URL、参数
 * 2. 用户身份和租户信息
 * 3. 响应状态码和执行时间
 * 4. 错误信息和堆栈跟踪
 *
 * 性能监控：
 * 1. 请求处理时间统计
 * 2. 响应大小统计
 * 3. 错误率统计
 * 4. 吞吐量统计
 *
 * @param {Logger} logger 日志服务
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseInterceptors(LoggingInterceptor)
 * export class UserController {}
 * ```
 * @since 1.0.0
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  /**
   * @method intercept
   * @description 拦截请求和响应，记录日志信息
   * @param {ExecutionContext} context 执行上下文
   * @param {CallHandler} next 下一个处理器
   * @returns {Observable<any>} 响应流
   *
   * 拦截流程：
   * 1. 记录请求开始时间
   * 2. 记录请求信息
   * 3. 处理请求
   * 4. 记录响应信息
   * 5. 计算执行时间
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const startTime = Date.now();

    // 记录请求信息
    this.logRequest(request);

    return next.handle().pipe(
      tap({
        next: data => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          this.logResponse(request, response, data, duration);
        },
        error: error => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          this.logError(request, response, error, duration);
        },
      }),
    );
  }

  /**
   * @method logRequest
   * @description 记录请求信息
   * @param {any} request HTTP请求对象
   * @returns {void}
   * @private
   */
  private logRequest(request: any): void {
    const requestInfo = {
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
      userId: request.user?.id,
      tenantId: request.tenant?.id,
      timestamp: new Date().toISOString(),
    };

    this.logger.log(
      `Incoming request: ${request.method} ${request.url}`,
      'HTTP_REQUEST',
      requestInfo,
    );
  }

  /**
   * @method logResponse
   * @description 记录响应信息
   * @param {any} request HTTP请求对象
   * @param {any} response HTTP响应对象
   * @param {any} data 响应数据
   * @param {number} duration 执行时间（毫秒）
   * @returns {void}
   * @private
   */
  private logResponse(
    request: any,
    response: any,
    data: any,
    duration: number,
  ): void {
    const responseInfo = {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration,
      userId: request.user?.id,
      tenantId: request.tenant?.id,
      responseSize: this.calculateResponseSize(data),
      timestamp: new Date().toISOString(),
    };

    this.logger.log(
      `Response: ${request.method} ${request.url} - ${response.statusCode} (${duration}ms)`,
      'HTTP_RESPONSE',
      responseInfo,
    );
  }

  /**
   * @method logError
   * @description 记录错误信息
   * @param {any} request HTTP请求对象
   * @param {any} response HTTP响应对象
   * @param {Error} error 错误对象
   * @param {number} duration 执行时间（毫秒）
   * @returns {void}
   * @private
   */
  private logError(
    request: any,
    response: any,
    error: Error,
    duration: number,
  ): void {
    const errorInfo = {
      method: request.method,
      url: request.url,
      statusCode: response.statusCode,
      duration,
      userId: request.user?.id,
      tenantId: request.tenant?.id,
      errorMessage: error.message,
      errorStack: error.stack,
      timestamp: new Date().toISOString(),
    };

    this.logger.error(
      `Error: ${request.method} ${request.url} - ${response.statusCode} (${duration}ms)`,
      error.stack,
      'HTTP_ERROR',
      errorInfo,
    );
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
}
