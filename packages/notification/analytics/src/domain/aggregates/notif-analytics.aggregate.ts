import { EventSourcedAggregateRoot } from '@aiofix/core';
import { NotifAnalyticsEntity } from '../entities/notif-analytics.entity';
import { AnalyticsMetric } from '../value-objects/analytics-metric.vo';
import { AnalyticsDimension } from '../value-objects/analytics-dimension.vo';
import { AnalyticsReport } from '../value-objects/analytics-report.vo';
import { NotifAnalyticsCreatedEvent } from '../events/notif-analytics-created.event';
import { NotifAnalyticsUpdatedEvent } from '../events/notif-analytics-updated.event';
import { NotifAnalyticsReportGeneratedEvent } from '../events/notif-analytics-report-generated.event';
import { NotifAnalyticsReportFailedEvent } from '../events/notif-analytics-report-failed.event';
import { NotifAnalyticsDataProcessedEvent } from '../events/notif-analytics-data-processed.event';

/**
 * @interface NotifAnalyticsAggregateProps
 * @description 通知分析聚合根属性接口
 */
export interface NotifAnalyticsAggregateProps {
  readonly id: string;
  readonly tenantId: string;
  readonly organizationId?: string;
  readonly departmentId?: string;
  readonly userId?: string;
  readonly channel: string;
  readonly notificationType: string;
  readonly priority: string;
  readonly strategy: string;
  readonly metrics: AnalyticsMetric[];
  readonly dimensions: AnalyticsDimension[];
  readonly reports: AnalyticsReport[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * @class NotifAnalyticsAggregate
 * @description 通知分析聚合根，负责协调通知分析业务逻辑和事件发布
 *
 * 业务协调职责：
 * 1. 管理通知分析数据的生命周期
 * 2. 协调指标数据的收集和聚合
 * 3. 管理分析报告的生成和分发
 * 4. 处理分析数据的查询和统计
 *
 * 事件发布：
 * 1. 分析数据创建事件
 * 2. 分析数据更新事件
 * 3. 报告生成事件
 * 4. 报告失败事件
 * 5. 数据处理事件
 *
 * 不变性约束：
 * 1. 分析数据必须属于有效租户
 * 2. 指标数据必须完整和准确
 * 3. 报告生成必须基于有效数据
 * 4. 数据更新必须保持一致性
 */
export class NotifAnalyticsAggregate extends EventSourcedAggregateRoot {
  private analytics: NotifAnalyticsEntity;

  constructor(analytics: NotifAnalyticsEntity) {
    super();
    this.analytics = analytics;
  }

  /**
   * @method create
   * @description 创建通知分析聚合根实例
   * @param {Omit<NotifAnalyticsAggregateProps, 'createdAt' | 'updatedAt'>} props 聚合根属性
   * @returns {NotifAnalyticsAggregate} 通知分析聚合根实例
   * @throws {InvalidNotifAnalyticsOperationError} 当操作无效时抛出
   */
  public static create(
    props: Omit<NotifAnalyticsAggregateProps, 'createdAt' | 'updatedAt'>,
  ): NotifAnalyticsAggregate {
    const analytics = NotifAnalyticsEntity.create(props);
    const aggregate = new NotifAnalyticsAggregate(analytics);

    // 发布创建事件
    aggregate.publishEvent(
      new NotifAnalyticsCreatedEvent(
        analytics.getId(),
        analytics.getTenantId(),
        analytics.getChannel(),
        analytics.getNotificationType(),
        analytics.getPriority(),
        analytics.getStrategy(),
      ),
    );

    return aggregate;
  }

  /**
   * @method fromEntity
   * @description 从实体创建聚合根
   * @param {NotifAnalyticsEntity} analytics 分析实体
   * @returns {NotifAnalyticsAggregate} 通知分析聚合根实例
   */
  public static fromEntity(
    analytics: NotifAnalyticsEntity,
  ): NotifAnalyticsAggregate {
    return new NotifAnalyticsAggregate(analytics);
  }

  /**
   * @method getId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  public getId(): string {
    return this.analytics.getId();
  }

  /**
   * @method getAnalytics
   * @description 获取分析实体
   * @returns {NotifAnalyticsEntity} 分析实体
   */
  public getAnalytics(): NotifAnalyticsEntity {
    return this.analytics;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.analytics.getTenantId();
  }

  /**
   * @method getChannel
   * @description 获取频道
   * @returns {string} 频道
   */
  public getChannel(): string {
    return this.analytics.getChannel();
  }

  /**
   * @method getNotificationType
   * @description 获取通知类型
   * @returns {string} 通知类型
   */
  public getNotificationType(): string {
    return this.analytics.getNotificationType();
  }

  /**
   * @method getPriority
   * @description 获取优先级
   * @returns {string} 优先级
   */
  public getPriority(): string {
    return this.analytics.getPriority();
  }

  /**
   * @method getStrategy
   * @description 获取策略
   * @returns {string} 策略
   */
  public getStrategy(): string {
    return this.analytics.getStrategy();
  }

  /**
   * @method addMetric
   * @description 添加指标
   * @param {AnalyticsMetric} metric 指标
   * @returns {void}
   * @throws {InvalidNotifAnalyticsOperationError} 当操作无效时抛出
   */
  public addMetric(metric: AnalyticsMetric): void {
    this.analytics.addMetric(metric);

    // 发布更新事件
    this.publishEvent(
      new NotifAnalyticsUpdatedEvent(
        this.analytics.getId(),
        this.analytics.getTenantId(),
        'metric_added',
        { metricType: metric.getType(), metricValue: metric.getValue() },
      ),
    );
  }

  /**
   * @method addMetrics
   * @description 批量添加指标
   * @param {AnalyticsMetric[]} metrics 指标列表
   * @returns {void}
   * @throws {InvalidNotifAnalyticsOperationError} 当操作无效时抛出
   */
  public addMetrics(metrics: AnalyticsMetric[]): void {
    this.analytics.addMetrics(metrics);

    // 发布更新事件
    this.publishEvent(
      new NotifAnalyticsUpdatedEvent(
        this.analytics.getId(),
        this.analytics.getTenantId(),
        'metrics_added',
        { metricsCount: metrics.length },
      ),
    );
  }

  /**
   * @method addDimension
   * @description 添加维度
   * @param {AnalyticsDimension} dimension 维度
   * @returns {void}
   * @throws {InvalidNotifAnalyticsOperationError} 当操作无效时抛出
   */
  public addDimension(dimension: AnalyticsDimension): void {
    this.analytics.addDimension(dimension);

    // 发布更新事件
    this.publishEvent(
      new NotifAnalyticsUpdatedEvent(
        this.analytics.getId(),
        this.analytics.getTenantId(),
        'dimension_added',
        {
          dimensionType: dimension.getType(),
          dimensionValue: dimension.getStringValue(),
        },
      ),
    );
  }

  /**
   * @method addDimensions
   * @description 批量添加维度
   * @param {AnalyticsDimension[]} dimensions 维度列表
   * @returns {void}
   * @throws {InvalidNotifAnalyticsOperationError} 当操作无效时抛出
   */
  public addDimensions(dimensions: AnalyticsDimension[]): void {
    this.analytics.addDimensions(dimensions);

    // 发布更新事件
    this.publishEvent(
      new NotifAnalyticsUpdatedEvent(
        this.analytics.getId(),
        this.analytics.getTenantId(),
        'dimensions_added',
        { dimensionsCount: dimensions.length },
      ),
    );
  }

  /**
   * @method generateReport
   * @description 生成分析报告
   * @param {AnalyticsReport} report 报告
   * @returns {void}
   * @throws {InvalidNotifAnalyticsOperationError} 当操作无效时抛出
   */
  public generateReport(report: AnalyticsReport): void {
    this.analytics.addReport(report);

    // 发布报告生成事件
    this.publishEvent(
      new NotifAnalyticsReportGeneratedEvent(
        this.analytics.getId(),
        this.analytics.getTenantId(),
        report.getType(),
        report.getTitle(),
        report.getStatus(),
      ),
    );
  }

  /**
   * @method processData
   * @description 处理分析数据
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @param {AnalyticsDimension[]} dimensions 维度数据
   * @returns {void}
   * @throws {InvalidNotifAnalyticsOperationError} 当操作无效时抛出
   */
  public processData(
    metrics: AnalyticsMetric[],
    dimensions: AnalyticsDimension[],
  ): void {
    // 添加指标和维度
    this.analytics.addMetrics(metrics);
    this.analytics.addDimensions(dimensions);

    // 发布数据处理事件
    this.publishEvent(
      new NotifAnalyticsDataProcessedEvent(
        this.analytics.getId(),
        this.analytics.getTenantId(),
        metrics.length,
        dimensions.length,
        this.analytics.getChannel(),
        this.analytics.getNotificationType(),
      ),
    );
  }

  /**
   * @method updateMetric
   * @description 更新指标
   * @param {string} metricType 指标类型
   * @param {AnalyticsMetric} newMetric 新指标
   * @returns {boolean} 是否更新成功
   * @throws {InvalidNotifAnalyticsOperationError} 当操作无效时抛出
   */
  public updateMetric(metricType: string, newMetric: AnalyticsMetric): boolean {
    const success = this.analytics.updateMetric(metricType, newMetric);

    if (success) {
      // 发布更新事件
      this.publishEvent(
        new NotifAnalyticsUpdatedEvent(
          this.analytics.getId(),
          this.analytics.getTenantId(),
          'metric_updated',
          { metricType, newValue: newMetric.getValue() },
        ),
      );
    }

    return success;
  }

  /**
   * @method removeMetric
   * @description 移除指标
   * @param {string} metricType 指标类型
   * @returns {boolean} 是否移除成功
   */
  public removeMetric(metricType: string): boolean {
    const success = this.analytics.removeMetric(metricType);

    if (success) {
      // 发布更新事件
      this.publishEvent(
        new NotifAnalyticsUpdatedEvent(
          this.analytics.getId(),
          this.analytics.getTenantId(),
          'metric_removed',
          { metricType },
        ),
      );
    }

    return success;
  }

  /**
   * @method clearExpiredReports
   * @description 清理过期报告
   * @returns {number} 清理的报告数量
   */
  public clearExpiredReports(): number {
    const clearedCount = this.analytics.clearExpiredReports();

    if (clearedCount > 0) {
      // 发布更新事件
      this.publishEvent(
        new NotifAnalyticsUpdatedEvent(
          this.analytics.getId(),
          this.analytics.getTenantId(),
          'reports_cleared',
          { clearedCount },
        ),
      );
    }

    return clearedCount;
  }

  /**
   * @method getMetrics
   * @description 获取指标列表
   * @returns {AnalyticsMetric[]} 指标列表
   */
  public getMetrics(): AnalyticsMetric[] {
    return this.analytics.getMetrics();
  }

  /**
   * @method getDimensions
   * @description 获取维度列表
   * @returns {AnalyticsDimension[]} 维度列表
   */
  public getDimensions(): AnalyticsDimension[] {
    return this.analytics.getDimensions();
  }

  /**
   * @method getReports
   * @description 获取报告列表
   * @returns {AnalyticsReport[]} 报告列表
   */
  public getReports(): AnalyticsReport[] {
    return this.analytics.getReports();
  }

  /**
   * @method getActiveReports
   * @description 获取活跃报告
   * @returns {AnalyticsReport[]} 活跃报告列表
   */
  public getActiveReports(): AnalyticsReport[] {
    return this.analytics.getActiveReports();
  }

  /**
   * @method getCompletedReports
   * @description 获取已完成报告
   * @returns {AnalyticsReport[]} 已完成报告列表
   */
  public getCompletedReports(): AnalyticsReport[] {
    return this.analytics.getCompletedReports();
  }

  /**
   * @method getFailedReports
   * @description 获取失败报告
   * @returns {AnalyticsReport[]} 失败报告列表
   */
  public getFailedReports(): AnalyticsReport[] {
    return this.analytics.getFailedReports();
  }

  /**
   * @method getMetricByType
   * @description 根据类型获取指标
   * @param {string} metricType 指标类型
   * @returns {AnalyticsMetric | undefined} 指标
   */
  public getMetricByType(metricType: string): AnalyticsMetric | undefined {
    return this.analytics.getMetricByType(metricType);
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
    return this.analytics.getDimensionByType(dimensionType);
  }

  /**
   * @method getReportByType
   * @description 根据类型获取报告
   * @param {string} reportType 报告类型
   * @returns {AnalyticsReport | undefined} 报告
   */
  public getReportByType(reportType: string): AnalyticsReport | undefined {
    return this.analytics.getReportByType(reportType);
  }

  /**
   * @method getTotalMetrics
   * @description 获取指标总数
   * @returns {number} 指标总数
   */
  public getTotalMetrics(): number {
    return this.analytics.getTotalMetrics();
  }

  /**
   * @method getTotalDimensions
   * @description 获取维度总数
   * @returns {number} 维度总数
   */
  public getTotalDimensions(): number {
    return this.analytics.getTotalDimensions();
  }

  /**
   * @method getTotalReports
   * @description 获取报告总数
   * @returns {number} 报告总数
   */
  public getTotalReports(): number {
    return this.analytics.getTotalReports();
  }

  /**
   * @method getCreatedAt
   * @description 获取创建时间
   * @returns {Date} 创建时间
   */
  public getCreatedAt(): Date {
    return this.analytics.getCreatedAt();
  }

  /**
   * @method getUpdatedAt
   * @description 获取更新时间
   * @returns {Date} 更新时间
   */
  public getUpdatedAt(): Date {
    return this.analytics.getUpdatedAt();
  }

  /**
   * @method isValid
   * @description 验证聚合根是否有效
   * @returns {boolean} 是否有效
   */
  public isValid(): boolean {
    try {
      // 验证分析实体
      if (!this.analytics) {
        return false;
      }

      // 验证基本属性
      if (!this.analytics.getId() || !this.analytics.getTenantId()) {
        return false;
      }

      // 验证指标和维度
      const metrics = this.analytics.getMetrics();
      const dimensions = this.analytics.getDimensions();

      if (metrics.length === 0 && dimensions.length === 0) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * @class InvalidNotifAnalyticsOperationError
 * @description 无效通知分析操作错误
 */
export class InvalidNotifAnalyticsOperationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifAnalyticsOperationError';
  }
}
