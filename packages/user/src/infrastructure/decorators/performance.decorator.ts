import { SetMetadata } from '@nestjs/common';

/**
 * @constant PERFORMANCE_KEY
 * @description 性能监控元数据键
 */
export const PERFORMANCE_KEY = 'performance';

/**
 * @constant PERFORMANCE_THRESHOLD_KEY
 * @description 性能阈值元数据键
 */
export const PERFORMANCE_THRESHOLD_KEY = 'performance_threshold';

/**
 * @function Performance
 * @description
 * 性能监控装饰器，用于指定控制器或方法的性能监控配置。
 *
 * 装饰器功能：
 * 1. 指定性能监控策略和配置
 * 2. 支持性能阈值设置
 * 3. 与PerformanceInterceptor配合使用
 * 4. 提供细粒度性能监控
 *
 * 性能监控：
 * 1. 监控请求处理时间
 * 2. 记录性能指标
 * 3. 检测性能瓶颈
 * 4. 提供性能报告
 *
 * @param {PerformanceConfig} config 性能监控配置
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @Performance({ enabled: true, threshold: 1000 })
 * export class UserController {
 *   @Get()
 *   @Performance({ threshold: 500 })
 *   async getUsers() {}
 *
 *   @Post()
 *   @Performance({ threshold: 2000, includeMemory: true })
 *   async createUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const Performance = (config: PerformanceConfig) =>
  SetMetadata(PERFORMANCE_KEY, config);

/**
 * @function PerformanceThreshold
 * @description
 * 性能阈值装饰器，用于指定性能阈值。
 *
 * 装饰器功能：
 * 1. 指定性能阈值
 * 2. 支持动态阈值设置
 * 3. 与PerformanceInterceptor配合使用
 * 4. 提供简单的阈值设置
 *
 * @param {number} threshold 性能阈值（毫秒）
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @PerformanceThreshold(500) // 500ms阈值
 *   async getUsers() {}
 *
 *   @Post()
 *   @PerformanceThreshold(1000) // 1s阈值
 *   async createUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const PerformanceThreshold = (threshold: number) =>
  SetMetadata(PERFORMANCE_THRESHOLD_KEY, threshold);

/**
 * @function NoPerformanceMonitoring
 * @description
 * 禁用性能监控装饰器，用于指定不监控性能。
 *
 * 装饰器功能：
 * 1. 禁用性能监控
 * 2. 减少监控开销
 * 3. 与PerformanceInterceptor配合使用
 * 4. 提供性能监控控制选项
 *
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * export class UserController {
 *   @Get()
 *   @PerformanceThreshold(500)
 *   async getUsers() {}
 *
 *   @Post()
 *   @NoPerformanceMonitoring()
 *   async createUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const NoPerformanceMonitoring = () =>
  SetMetadata(PERFORMANCE_KEY, { enabled: false });

/**
 * 性能监控配置接口
 */
export interface PerformanceConfig {
  /** 是否启用性能监控 */
  enabled?: boolean;
  /** 性能阈值（毫秒） */
  threshold?: number;
  /** 是否包含内存监控 */
  includeMemory?: boolean;
  /** 是否包含CPU监控 */
  includeCPU?: boolean;
  /** 是否包含响应大小监控 */
  includeResponseSize?: boolean;
  /** 是否包含错误监控 */
  includeErrors?: boolean;
  /** 监控级别 */
  level?: PerformanceLevel;
  /** 监控标签 */
  tags?: string[];
}

/**
 * 性能监控级别枚举
 */
export enum PerformanceLevel {
  /** 基础监控 */
  BASIC = 'BASIC',
  /** 标准监控 */
  STANDARD = 'STANDARD',
  /** 详细监控 */
  DETAILED = 'DETAILED',
  /** 完整监控 */
  COMPLETE = 'COMPLETE',
}
