import { BaseEntity } from '@aiofix/core';
import { AnalyticsMetric } from '../value-objects/analytics-metric.vo';
import { AnalyticsDimension } from '../value-objects/analytics-dimension.vo';
import { AnalyticsReport } from '../value-objects/analytics-report.vo';

/**
 * @interface NotifAnalyticsProps
 * @description 通知分析实体属性接口
 */
export interface NotifAnalyticsProps {
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
 * @class NotifAnalyticsEntity
 * @description 通知分析实体，负责管理通知分析数据和状态
 *
 * 业务规则：
 * 1. 租户ID必须存在
 * 2. 频道类型必须有效
 * 3. 通知类型必须有效
 * 4. 优先级必须在有效范围内
 * 5. 策略类型必须有效
 * 6. 指标数据必须完整
 * 7. 维度数据必须有效
 *
 * 状态管理：
 * 1. 分析数据创建和更新
 * 2. 指标数据聚合和计算
 * 3. 维度数据管理和查询
 * 4. 报告生成和状态跟踪
 */
export class NotifAnalyticsEntity extends BaseEntity {
  private props: NotifAnalyticsProps;

  constructor(props: NotifAnalyticsProps) {
    super();
    this.props = props;
    this.validateProps();
  }

  /**
   * @method getEntityId
   * @description 获取实体ID
   * @returns {string} 实体ID
   */
  public getEntityId(): string {
    return this.props.id;
  }

  /**
   * @method create
   * @description 创建通知分析实体实例
   * @param {Omit<NotifAnalyticsProps, 'createdAt' | 'updatedAt'>} props 实体属性
   * @returns {NotifAnalyticsEntity} 通知分析实体实例
   * @throws {InvalidNotifAnalyticsError} 当实体数据无效时抛出
   */
  public static create(
    props: Omit<NotifAnalyticsProps, 'createdAt' | 'updatedAt'>,
  ): NotifAnalyticsEntity {
    const now = new Date();
    return new NotifAnalyticsEntity({
      ...props,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * @method getId
   * @description 获取实体ID
   * @returns {string} 实体ID
   */
  public getId(): string {
    return this.props.id;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.props.tenantId;
  }

  /**
   * @method getOrganizationId
   * @description 获取组织ID
   * @returns {string | undefined} 组织ID
   */
  public getOrganizationId(): string | undefined {
    return this.props.organizationId;
  }

  /**
   * @method getDepartmentId
   * @description 获取部门ID
   * @returns {string | undefined} 部门ID
   */
  public getDepartmentId(): string | undefined {
    return this.props.departmentId;
  }

  /**
   * @method getUserId
   * @description 获取用户ID
   * @returns {string | undefined} 用户ID
   */
  public getUserId(): string | undefined {
    return this.props.userId;
  }

  /**
   * @method getChannel
   * @description 获取频道
   * @returns {string} 频道
   */
  public getChannel(): string {
    return this.props.channel;
  }

  /**
   * @method getNotificationType
   * @description 获取通知类型
   * @returns {string} 通知类型
   */
  public getNotificationType(): string {
    return this.props.notificationType;
  }

  /**
   * @method getPriority
   * @description 获取优先级
   * @returns {string} 优先级
   */
  public getPriority(): string {
    return this.props.priority;
  }

  /**
   * @method getStrategy
   * @description 获取策略
   * @returns {string} 策略
   */
  public getStrategy(): string {
    return this.props.strategy;
  }

  /**
   * @method getMetrics
   * @description 获取指标列表
   * @returns {AnalyticsMetric[]} 指标列表
   */
  public getMetrics(): AnalyticsMetric[] {
    return [...this.props.metrics];
  }

  /**
   * @method getDimensions
   * @description 获取维度列表
   * @returns {AnalyticsDimension[]} 维度列表
   */
  public getDimensions(): AnalyticsDimension[] {
    return [...this.props.dimensions];
  }

  /**
   * @method getReports
   * @description 获取报告列表
   * @returns {AnalyticsReport[]} 报告列表
   */
  public getReports(): AnalyticsReport[] {
    return [...this.props.reports];
  }

  /**
   * @method getCreatedAt
   * @description 获取创建时间
   * @returns {Date} 创建时间
   */
  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  /**
   * @method getUpdatedAt
   * @description 获取更新时间
   * @returns {Date} 更新时间
   */
  public getUpdatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * @method addMetric
   * @description 添加指标
   * @param {AnalyticsMetric} metric 指标
   * @returns {void}
   * @throws {InvalidNotifAnalyticsError} 当指标无效时抛出
   */
  public addMetric(metric: AnalyticsMetric): void {
    this.validateMetric(metric);
    this.props = {
      ...this.props,
      metrics: [...this.props.metrics, metric],
      updatedAt: new Date(),
    };
  }

  /**
   * @method addMetrics
   * @description 批量添加指标
   * @param {AnalyticsMetric[]} metrics 指标列表
   * @returns {void}
   * @throws {InvalidNotifAnalyticsError} 当指标无效时抛出
   */
  public addMetrics(metrics: AnalyticsMetric[]): void {
    metrics.forEach(metric => this.validateMetric(metric));
    this.props = {
      ...this.props,
      metrics: [...this.props.metrics, ...metrics],
      updatedAt: new Date(),
    };
  }

  /**
   * @method addDimension
   * @description 添加维度
   * @param {AnalyticsDimension} dimension 维度
   * @returns {void}
   * @throws {InvalidNotifAnalyticsError} 当维度无效时抛出
   */
  public addDimension(dimension: AnalyticsDimension): void {
    this.validateDimension(dimension);
    this.props = {
      ...this.props,
      dimensions: [...this.props.dimensions, dimension],
      updatedAt: new Date(),
    };
  }

  /**
   * @method addDimensions
   * @description 批量添加维度
   * @param {AnalyticsDimension[]} dimensions 维度列表
   * @returns {void}
   * @throws {InvalidNotifAnalyticsError} 当维度无效时抛出
   */
  public addDimensions(dimensions: AnalyticsDimension[]): void {
    dimensions.forEach(dimension => this.validateDimension(dimension));
    this.props = {
      ...this.props,
      dimensions: [...this.props.dimensions, ...dimensions],
      updatedAt: new Date(),
    };
  }

  /**
   * @method addReport
   * @description 添加报告
   * @param {AnalyticsReport} report 报告
   * @returns {void}
   * @throws {InvalidNotifAnalyticsError} 当报告无效时抛出
   */
  public addReport(report: AnalyticsReport): void {
    this.validateReport(report);
    this.props = {
      ...this.props,
      reports: [...this.props.reports, report],
      updatedAt: new Date(),
    };
  }

  /**
   * @method updateMetric
   * @description 更新指标
   * @param {string} metricType 指标类型
   * @param {AnalyticsMetric} newMetric 新指标
   * @returns {boolean} 是否更新成功
   * @throws {InvalidNotifAnalyticsError} 当指标无效时抛出
   */
  public updateMetric(metricType: string, newMetric: AnalyticsMetric): boolean {
    this.validateMetric(newMetric);

    const index = this.props.metrics.findIndex(
      metric => metric.getType() === metricType,
    );
    if (index === -1) {
      return false;
    }

    const updatedMetrics = [...this.props.metrics];
    updatedMetrics[index] = newMetric;

    this.props = {
      ...this.props,
      metrics: updatedMetrics,
      updatedAt: new Date(),
    };

    return true;
  }

  /**
   * @method removeMetric
   * @description 移除指标
   * @param {string} metricType 指标类型
   * @returns {boolean} 是否移除成功
   */
  public removeMetric(metricType: string): boolean {
    const index = this.props.metrics.findIndex(
      metric => metric.getType() === metricType,
    );
    if (index === -1) {
      return false;
    }

    const updatedMetrics = [...this.props.metrics];
    updatedMetrics.splice(index, 1);

    this.props = {
      ...this.props,
      metrics: updatedMetrics,
      updatedAt: new Date(),
    };

    return true;
  }

  /**
   * @method getMetricByType
   * @description 根据类型获取指标
   * @param {string} metricType 指标类型
   * @returns {AnalyticsMetric | undefined} 指标
   */
  public getMetricByType(metricType: string): AnalyticsMetric | undefined {
    return this.props.metrics.find(metric => metric.getType() === metricType);
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
    return this.props.dimensions.find(
      dimension => dimension.getType() === dimensionType,
    );
  }

  /**
   * @method getReportByType
   * @description 根据类型获取报告
   * @param {string} reportType 报告类型
   * @returns {AnalyticsReport | undefined} 报告
   */
  public getReportByType(reportType: string): AnalyticsReport | undefined {
    return this.props.reports.find(report => report.getType() === reportType);
  }

  /**
   * @method getTotalMetrics
   * @description 获取指标总数
   * @returns {number} 指标总数
   */
  public getTotalMetrics(): number {
    return this.props.metrics.length;
  }

  /**
   * @method getTotalDimensions
   * @description 获取维度总数
   * @returns {number} 维度总数
   */
  public getTotalDimensions(): number {
    return this.props.dimensions.length;
  }

  /**
   * @method getTotalReports
   * @description 获取报告总数
   * @returns {number} 报告总数
   */
  public getTotalReports(): number {
    return this.props.reports.length;
  }

  /**
   * @method getActiveReports
   * @description 获取活跃报告（非过期状态）
   * @returns {AnalyticsReport[]} 活跃报告列表
   */
  public getActiveReports(): AnalyticsReport[] {
    return this.props.reports.filter(report => !report.isExpired());
  }

  /**
   * @method getCompletedReports
   * @description 获取已完成报告
   * @returns {AnalyticsReport[]} 已完成报告列表
   */
  public getCompletedReports(): AnalyticsReport[] {
    return this.props.reports.filter(report => report.isCompleted());
  }

  /**
   * @method getFailedReports
   * @description 获取失败报告
   * @returns {AnalyticsReport[]} 失败报告列表
   */
  public getFailedReports(): AnalyticsReport[] {
    return this.props.reports.filter(report => report.isFailed());
  }

  /**
   * @method clearExpiredReports
   * @description 清理过期报告
   * @returns {number} 清理的报告数量
   */
  public clearExpiredReports(): number {
    const activeReports = this.getActiveReports();
    const clearedCount = this.props.reports.length - activeReports.length;

    this.props = {
      ...this.props,
      reports: activeReports,
      updatedAt: new Date(),
    };

    return clearedCount;
  }

  /**
   * @method validateProps
   * @description 验证实体属性
   * @throws {InvalidNotifAnalyticsError} 当属性无效时抛出
   * @private
   */
  private validateProps(): void {
    // 验证租户ID
    if (!this.props.tenantId || this.props.tenantId.trim().length === 0) {
      throw new InvalidNotifAnalyticsError('租户ID不能为空');
    }

    // 验证频道
    if (!this.props.channel || this.props.channel.trim().length === 0) {
      throw new InvalidNotifAnalyticsError('频道不能为空');
    }

    // 验证通知类型
    if (
      !this.props.notificationType ||
      this.props.notificationType.trim().length === 0
    ) {
      throw new InvalidNotifAnalyticsError('通知类型不能为空');
    }

    // 验证优先级
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(this.props.priority)) {
      throw new InvalidNotifAnalyticsError(
        `无效的优先级: ${this.props.priority}，支持的优先级: ${validPriorities.join(', ')}`,
      );
    }

    // 验证策略
    const validStrategies = ['immediate', 'delayed', 'batch'];
    if (!validStrategies.includes(this.props.strategy)) {
      throw new InvalidNotifAnalyticsError(
        `无效的策略: ${this.props.strategy}，支持的策略: ${validStrategies.join(', ')}`,
      );
    }

    // 验证指标
    this.props.metrics.forEach(metric => this.validateMetric(metric));

    // 验证维度
    this.props.dimensions.forEach(dimension =>
      this.validateDimension(dimension),
    );

    // 验证报告
    this.props.reports.forEach(report => this.validateReport(report));
  }

  /**
   * @method validateMetric
   * @description 验证指标
   * @param {AnalyticsMetric} metric 指标
   * @throws {InvalidNotifAnalyticsError} 当指标无效时抛出
   * @private
   */
  private validateMetric(metric: AnalyticsMetric): void {
    if (!metric) {
      throw new InvalidNotifAnalyticsError('指标不能为空');
    }
  }

  /**
   * @method validateDimension
   * @description 验证维度
   * @param {AnalyticsDimension} dimension 维度
   * @throws {InvalidNotifAnalyticsError} 当维度无效时抛出
   * @private
   */
  private validateDimension(dimension: AnalyticsDimension): void {
    if (!dimension) {
      throw new InvalidNotifAnalyticsError('维度不能为空');
    }
  }

  /**
   * @method validateReport
   * @description 验证报告
   * @param {AnalyticsReport} report 报告
   * @throws {InvalidNotifAnalyticsError} 当报告无效时抛出
   * @private
   */
  private validateReport(report: AnalyticsReport): void {
    if (!report) {
      throw new InvalidNotifAnalyticsError('报告不能为空');
    }
  }
}

/**
 * @class InvalidNotifAnalyticsError
 * @description 无效通知分析错误
 */
export class InvalidNotifAnalyticsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifAnalyticsError';
  }
}
