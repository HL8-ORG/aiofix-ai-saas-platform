import { ValueObject } from '@aiofix/core';
import { AnalyticsMetric } from './analytics-metric.vo';
import { AnalyticsDimension } from './analytics-dimension.vo';

/**
 * @enum AnalyticsReportType
 * @description 分析报告类型枚举
 */
export enum AnalyticsReportType {
  SUMMARY = 'summary',
  DETAILED = 'detailed',
  COMPARATIVE = 'comparative',
  TREND = 'trend',
  PERFORMANCE = 'performance',
  CUSTOM = 'custom',
}

/**
 * @enum AnalyticsReportStatus
 * @description 分析报告状态枚举
 */
export enum AnalyticsReportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired',
}

/**
 * @interface AnalyticsReportProps
 * @description 分析报告属性接口
 */
export interface AnalyticsReportProps {
  readonly type: AnalyticsReportType;
  readonly title: string;
  readonly description?: string;
  readonly status: AnalyticsReportStatus;
  readonly metrics: AnalyticsMetric[];
  readonly dimensions: AnalyticsDimension[];
  readonly timeRange: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly filters?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly expiresAt?: Date;
}

/**
 * @class AnalyticsReport
 * @description 分析报告值对象，封装通知分析报告数据
 *
 * 业务规则：
 * 1. 报告标题不能为空
 * 2. 时间范围必须有效（开始时间不能晚于结束时间）
 * 3. 报告必须包含至少一个指标
 * 4. 过期时间不能早于创建时间
 * 5. 报告状态转换必须符合状态机规则
 *
 * 不变性约束：
 * 1. 报告ID一旦创建不可变更
 * 2. 创建时间不可修改
 * 3. 指标和维度数据不可直接修改
 */
export class AnalyticsReport extends ValueObject<AnalyticsReportProps> {
  /**
   * @method create
   * @description 创建分析报告实例
   * @param {AnalyticsReportProps} props 报告属性
   * @returns {AnalyticsReport} 分析报告实例
   * @throws {InvalidAnalyticsReportError} 当报告数据无效时抛出
   */
  public static create(props: AnalyticsReportProps): AnalyticsReport {
    this.validateReport(props);
    return new AnalyticsReport(props);
  }

  /**
   * @method createSummary
   * @description 创建摘要报告
   * @param {string} title 报告标题
   * @param {AnalyticsMetric[]} metrics 指标列表
   * @param {Date} startDate 开始日期
   * @param {Date} endDate 结束日期
   * @returns {AnalyticsReport} 摘要报告
   */
  public static createSummary(
    title: string,
    metrics: AnalyticsMetric[],
    startDate: Date,
    endDate: Date,
  ): AnalyticsReport {
    return this.create({
      type: AnalyticsReportType.SUMMARY,
      title,
      description: '通知系统摘要报告',
      status: AnalyticsReportStatus.PENDING,
      metrics,
      dimensions: [],
      timeRange: { start: startDate, end: endDate },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * @method createDetailed
   * @description 创建详细报告
   * @param {string} title 报告标题
   * @param {AnalyticsMetric[]} metrics 指标列表
   * @param {AnalyticsDimension[]} dimensions 维度列表
   * @param {Date} startDate 开始日期
   * @param {Date} endDate 结束日期
   * @returns {AnalyticsReport} 详细报告
   */
  public static createDetailed(
    title: string,
    metrics: AnalyticsMetric[],
    dimensions: AnalyticsDimension[],
    startDate: Date,
    endDate: Date,
  ): AnalyticsReport {
    return this.create({
      type: AnalyticsReportType.DETAILED,
      title,
      description: '通知系统详细分析报告',
      status: AnalyticsReportStatus.PENDING,
      metrics,
      dimensions,
      timeRange: { start: startDate, end: endDate },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * @method createTrend
   * @description 创建趋势报告
   * @param {string} title 报告标题
   * @param {AnalyticsMetric[]} metrics 指标列表
   * @param {Date} startDate 开始日期
   * @param {Date} endDate 结束日期
   * @returns {AnalyticsReport} 趋势报告
   */
  public static createTrend(
    title: string,
    metrics: AnalyticsMetric[],
    startDate: Date,
    endDate: Date,
  ): AnalyticsReport {
    return this.create({
      type: AnalyticsReportType.TREND,
      title,
      description: '通知系统趋势分析报告',
      status: AnalyticsReportStatus.PENDING,
      metrics,
      dimensions: [],
      timeRange: { start: startDate, end: endDate },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * @method createPerformance
   * @description 创建性能报告
   * @param {string} title 报告标题
   * @param {AnalyticsMetric[]} metrics 指标列表
   * @param {Date} startDate 开始日期
   * @param {Date} endDate 结束日期
   * @returns {AnalyticsReport} 性能报告
   */
  public static createPerformance(
    title: string,
    metrics: AnalyticsMetric[],
    startDate: Date,
    endDate: Date,
  ): AnalyticsReport {
    return this.create({
      type: AnalyticsReportType.PERFORMANCE,
      title,
      description: '通知系统性能分析报告',
      status: AnalyticsReportStatus.PENDING,
      metrics,
      dimensions: [],
      timeRange: { start: startDate, end: endDate },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * @method getType
   * @description 获取报告类型
   * @returns {AnalyticsReportType} 报告类型
   */
  public getType(): AnalyticsReportType {
    return this.value.type;
  }

  /**
   * @method getTitle
   * @description 获取报告标题
   * @returns {string} 报告标题
   */
  public getTitle(): string {
    return this.value.title;
  }

  /**
   * @method getDescription
   * @description 获取报告描述
   * @returns {string | undefined} 报告描述
   */
  public getDescription(): string | undefined {
    return this.value.description;
  }

  /**
   * @method getStatus
   * @description 获取报告状态
   * @returns {AnalyticsReportStatus} 报告状态
   */
  public getStatus(): AnalyticsReportStatus {
    return this.value.status;
  }

  /**
   * @method getMetrics
   * @description 获取指标列表
   * @returns {AnalyticsMetric[]} 指标列表
   */
  public getMetrics(): AnalyticsMetric[] {
    return [...this.value.metrics];
  }

  /**
   * @method getDimensions
   * @description 获取维度列表
   * @returns {AnalyticsDimension[]} 维度列表
   */
  public getDimensions(): AnalyticsDimension[] {
    return [...this.value.dimensions];
  }

  /**
   * @method getTimeRange
   * @description 获取时间范围
   * @returns {{ start: Date; end: Date }} 时间范围
   */
  public getTimeRange(): { start: Date; end: Date } {
    return { ...this.value.timeRange };
  }

  /**
   * @method getFilters
   * @description 获取过滤器
   * @returns {Record<string, unknown> | undefined} 过滤器
   */
  public getFilters(): Record<string, unknown> | undefined {
    return this.value.filters ? { ...this.value.filters } : undefined;
  }

  /**
   * @method getMetadata
   * @description 获取元数据
   * @returns {Record<string, unknown> | undefined} 元数据
   */
  public getMetadata(): Record<string, unknown> | undefined {
    return this.value.metadata ? { ...this.value.metadata } : undefined;
  }

  /**
   * @method getCreatedAt
   * @description 获取创建时间
   * @returns {Date} 创建时间
   */
  public getCreatedAt(): Date {
    return this.value.createdAt;
  }

  /**
   * @method getUpdatedAt
   * @description 获取更新时间
   * @returns {Date} 更新时间
   */
  public getUpdatedAt(): Date {
    return this.value.updatedAt;
  }

  /**
   * @method getExpiresAt
   * @description 获取过期时间
   * @returns {Date | undefined} 过期时间
   */
  public getExpiresAt(): Date | undefined {
    return this.value.expiresAt;
  }

  /**
   * @method isPending
   * @description 判断是否为待处理状态
   * @returns {boolean} 是否为待处理状态
   */
  public isPending(): boolean {
    return this.value.status === AnalyticsReportStatus.PENDING;
  }

  /**
   * @method isProcessing
   * @description 判断是否为处理中状态
   * @returns {boolean} 是否为处理中状态
   */
  public isProcessing(): boolean {
    return this.value.status === AnalyticsReportStatus.PROCESSING;
  }

  /**
   * @method isCompleted
   * @description 判断是否为已完成状态
   * @returns {boolean} 是否为已完成状态
   */
  public isCompleted(): boolean {
    return this.value.status === AnalyticsReportStatus.COMPLETED;
  }

  /**
   * @method isFailed
   * @description 判断是否为失败状态
   * @returns {boolean} 是否为失败状态
   */
  public isFailed(): boolean {
    return this.value.status === AnalyticsReportStatus.FAILED;
  }

  /**
   * @method isExpired
   * @description 判断是否为过期状态
   * @returns {boolean} 是否为过期状态
   */
  public isExpired(): boolean {
    return this.value.status === AnalyticsReportStatus.EXPIRED;
  }

  /**
   * @method isExpiredByTime
   * @description 判断是否已过期（基于时间）
   * @returns {boolean} 是否已过期
   */
  public isExpiredByTime(): boolean {
    if (!this.value.expiresAt) {
      return false;
    }
    return new Date() > this.value.expiresAt;
  }

  /**
   * @method getMetricByType
   * @description 根据类型获取指标
   * @param {string} metricType 指标类型
   * @returns {AnalyticsMetric | undefined} 指标
   */
  public getMetricByType(metricType: string): AnalyticsMetric | undefined {
    return this.value.metrics.find(metric => metric.getType() === metricType);
  }

  /**
   * @method getDimensionByType
   * @description 根据类型获取维度
   * @param {string} dimensionType 维度类型
   * @returns {AnalyticsDimension | undefined} 维度
   */
  public getDimensionByType(
    dimensionType: string,
  ): AnalyticsDimension | undefined {
    return this.value.dimensions.find(
      dimension => dimension.getType() === dimensionType,
    );
  }

  /**
   * @method getMetricsByTimeRange
   * @description 根据时间范围获取指标
   * @param {Date} start 开始时间
   * @param {Date} end 结束时间
   * @returns {AnalyticsMetric[]} 指标列表
   */
  public getMetricsByTimeRange(start: Date, end: Date): AnalyticsMetric[] {
    return this.value.metrics.filter(metric => {
      const timestamp = metric.getTimestamp();
      return timestamp >= start && timestamp <= end;
    });
  }

  /**
   * @method getTotalMetrics
   * @description 获取指标总数
   * @returns {number} 指标总数
   */
  public getTotalMetrics(): number {
    return this.value.metrics.length;
  }

  /**
   * @method getTotalDimensions
   * @description 获取维度总数
   * @returns {number} 维度总数
   */
  public getTotalDimensions(): number {
    return this.value.dimensions.length;
  }

  /**
   * @method getDuration
   * @description 获取报告时间跨度（毫秒）
   * @returns {number} 时间跨度
   */
  public getDuration(): number {
    return (
      this.value.timeRange.end.getTime() - this.value.timeRange.start.getTime()
    );
  }

  /**
   * @method getDurationInDays
   * @description 获取报告时间跨度（天）
   * @returns {number} 时间跨度（天）
   */
  public getDurationInDays(): number {
    return Math.ceil(this.getDuration() / (1000 * 60 * 60 * 24));
  }

  /**
   * @method validateReport
   * @description 验证报告数据
   * @param {AnalyticsReportProps} props 报告属性
   * @throws {InvalidAnalyticsReportError} 当报告数据无效时抛出
   * @private
   * @static
   */
  private static validateReport(props: AnalyticsReportProps): void {
    // 验证报告标题
    if (!props.title || props.title.trim().length === 0) {
      throw new InvalidAnalyticsReportError('报告标题不能为空');
    }

    // 验证时间范围
    if (props.timeRange.start >= props.timeRange.end) {
      throw new InvalidAnalyticsReportError('开始时间不能晚于或等于结束时间');
    }

    // 验证指标列表
    if (!props.metrics || props.metrics.length === 0) {
      throw new InvalidAnalyticsReportError('报告必须包含至少一个指标');
    }

    // 验证过期时间
    if (props.expiresAt && props.expiresAt <= props.createdAt) {
      throw new InvalidAnalyticsReportError('过期时间不能早于或等于创建时间');
    }

    // 验证状态
    this.validateStatus(props.status);
  }

  /**
   * @method validateStatus
   * @description 验证报告状态
   * @param {AnalyticsReportStatus} status 报告状态
   * @throws {InvalidAnalyticsReportError} 当状态无效时抛出
   * @private
   * @static
   */
  private static validateStatus(status: AnalyticsReportStatus): void {
    const validStatuses = Object.values(AnalyticsReportStatus);
    if (!validStatuses.includes(status)) {
      throw new InvalidAnalyticsReportError(
        `无效的报告状态: ${status}，支持的状态: ${validStatuses.join(', ')}`,
      );
    }
  }
}

/**
 * @class InvalidAnalyticsReportError
 * @description 无效分析报告错误
 */
export class InvalidAnalyticsReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAnalyticsReportError';
  }
}
