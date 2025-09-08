import { NotifAnalyticsAggregate } from '../aggregates/notif-analytics.aggregate';
import {
  AnalyticsMetric,
  AnalyticsMetricType,
} from '../value-objects/analytics-metric.vo';
import {
  AnalyticsDimension,
  AnalyticsDimensionType,
} from '../value-objects/analytics-dimension.vo';
import {
  AnalyticsReport,
  AnalyticsReportType,
} from '../value-objects/analytics-report.vo';

/**
 * @interface NotifAnalyticsServiceProps
 * @description 通知分析服务属性接口
 */
export interface NotifAnalyticsServiceProps {
  readonly tenantId: string;
  readonly organizationId?: string;
  readonly departmentId?: string;
  readonly userId?: string;
}

/**
 * @interface NotifAnalyticsData
 * @description 通知分析数据接口
 */
export interface NotifAnalyticsData {
  readonly channel: string;
  readonly notificationType: string;
  readonly priority: string;
  readonly strategy: string;
  readonly metrics: AnalyticsMetric[];
  readonly dimensions: AnalyticsDimension[];
}

/**
 * @interface NotifAnalyticsReportRequest
 * @description 通知分析报告请求接口
 */
export interface NotifAnalyticsReportRequest {
  readonly reportType: AnalyticsReportType;
  readonly title: string;
  readonly description?: string;
  readonly timeRange: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly filters?: Record<string, unknown>;
  readonly metadata?: Record<string, unknown>;
}

/**
 * @interface NotifAnalyticsQuery
 * @description 通知分析查询接口
 */
export interface NotifAnalyticsQuery {
  readonly tenantId: string;
  readonly organizationId?: string;
  readonly departmentId?: string;
  readonly userId?: string;
  readonly channel?: string;
  readonly notificationType?: string;
  readonly priority?: string;
  readonly strategy?: string;
  readonly timeRange?: {
    readonly start: Date;
    readonly end: Date;
  };
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * @class NotifAnalyticsService
 * @description 通知分析领域服务，负责处理跨聚合的业务逻辑和无状态操作
 *
 * 跨聚合业务逻辑：
 * 1. 协调分析数据的收集和聚合
 * 2. 处理分析报告的生成和分发
 * 3. 管理分析数据的查询和统计
 * 4. 处理分析数据的验证和转换
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用
 *
 * 业务规则封装：
 * 1. 封装复杂的分析计算逻辑
 * 2. 提供可重用的分析规则验证
 * 3. 隔离跨聚合的复杂业务逻辑
 */
export class NotifAnalyticsService {
  /**
   * @method createAnalytics
   * @description 创建分析数据
   * @param {NotifAnalyticsServiceProps} props 服务属性
   * @param {NotifAnalyticsData} data 分析数据
   * @returns {NotifAnalyticsAggregate} 分析聚合根
   * @throws {InvalidNotifAnalyticsServiceError} 当服务操作无效时抛出
   */
  public createAnalytics(
    props: NotifAnalyticsServiceProps,
    data: NotifAnalyticsData,
  ): NotifAnalyticsAggregate {
    // 验证服务属性
    this.validateServiceProps(props);

    // 验证分析数据
    this.validateAnalyticsData(data);

    // 创建分析聚合根
    const aggregate = NotifAnalyticsAggregate.create({
      id: this.generateAnalyticsId(),
      tenantId: props.tenantId,
      organizationId: props.organizationId,
      departmentId: props.departmentId,
      userId: props.userId,
      channel: data.channel,
      notificationType: data.notificationType,
      priority: data.priority,
      strategy: data.strategy,
      metrics: data.metrics,
      dimensions: data.dimensions,
      reports: [],
    });

    return aggregate;
  }

  /**
   * @method processAnalyticsData
   * @description 处理分析数据
   * @param {NotifAnalyticsAggregate} aggregate 分析聚合根
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @param {AnalyticsDimension[]} dimensions 维度数据
   * @returns {void}
   * @throws {InvalidNotifAnalyticsServiceError} 当服务操作无效时抛出
   */
  public processAnalyticsData(
    aggregate: NotifAnalyticsAggregate,
    metrics: AnalyticsMetric[],
    dimensions: AnalyticsDimension[],
  ): void {
    // 验证聚合根
    if (!aggregate || !aggregate.isValid()) {
      throw new InvalidNotifAnalyticsServiceError('无效的分析聚合根');
    }

    // 验证指标数据
    this.validateMetrics(metrics);

    // 验证维度数据
    this.validateDimensions(dimensions);

    // 处理数据
    aggregate.processData(metrics, dimensions);
  }

  /**
   * @method generateReport
   * @description 生成分析报告
   * @param {NotifAnalyticsAggregate} aggregate 分析聚合根
   * @param {NotifAnalyticsReportRequest} request 报告请求
   * @returns {AnalyticsReport} 分析报告
   * @throws {InvalidNotifAnalyticsServiceError} 当服务操作无效时抛出
   */
  public generateReport(
    aggregate: NotifAnalyticsAggregate,
    request: NotifAnalyticsReportRequest,
  ): AnalyticsReport {
    // 验证聚合根
    if (!aggregate || !aggregate.isValid()) {
      throw new InvalidNotifAnalyticsServiceError('无效的分析聚合根');
    }

    // 验证报告请求
    this.validateReportRequest(request);

    // 获取分析数据
    const metrics = aggregate.getMetrics();
    const dimensions = aggregate.getDimensions();

    // 根据报告类型生成报告
    let report: AnalyticsReport;

    switch (request.reportType) {
      case AnalyticsReportType.SUMMARY:
        report = this.generateSummaryReport(request, metrics, dimensions);
        break;
      case AnalyticsReportType.DETAILED:
        report = this.generateDetailedReport(request, metrics, dimensions);
        break;
      case AnalyticsReportType.TREND:
        report = this.generateTrendReport(request, metrics, dimensions);
        break;
      case AnalyticsReportType.PERFORMANCE:
        report = this.generatePerformanceReport(request, metrics, dimensions);
        break;
      default:
        throw new InvalidNotifAnalyticsServiceError(
          `不支持的报告类型: ${request.reportType}`,
        );
    }

    // 添加报告到聚合根
    aggregate.generateReport(report);

    return report;
  }

  /**
   * @method queryAnalytics
   * @description 查询分析数据
   * @param {NotifAnalyticsQuery} query 查询条件
   * @returns {NotifAnalyticsAggregate[]} 分析聚合根列表
   * @throws {InvalidNotifAnalyticsServiceError} 当服务操作无效时抛出
   */
  public queryAnalytics(query: NotifAnalyticsQuery): NotifAnalyticsAggregate[] {
    // 验证查询条件
    this.validateQuery(query);

    // 这里应该调用仓储层进行实际查询
    // 为了演示，返回空数组
    return [];
  }

  /**
   * @method calculateMetrics
   * @description 计算分析指标
   * @param {AnalyticsMetric[]} metrics 原始指标数据
   * @param {AnalyticsDimension[]} dimensions 维度数据
   * @returns {AnalyticsMetric[]} 计算后的指标数据
   * @throws {InvalidNotifAnalyticsServiceError} 当服务操作无效时抛出
   */
  public calculateMetrics(
    metrics: AnalyticsMetric[],
    dimensions: AnalyticsDimension[],
  ): AnalyticsMetric[] {
    // 验证输入数据
    this.validateMetrics(metrics);
    this.validateDimensions(dimensions);

    // 计算聚合指标
    const calculatedMetrics: AnalyticsMetric[] = [];

    // 计算送达率
    const deliveryRate = this.calculateDeliveryRate(metrics);
    if (deliveryRate !== null) {
      calculatedMetrics.push(deliveryRate);
    }

    // 计算打开率
    const openRate = this.calculateOpenRate(metrics);
    if (openRate !== null) {
      calculatedMetrics.push(openRate);
    }

    // 计算点击率
    const clickRate = this.calculateClickRate(metrics);
    if (clickRate !== null) {
      calculatedMetrics.push(clickRate);
    }

    // 计算错误率
    const errorRate = this.calculateErrorRate(metrics);
    if (errorRate !== null) {
      calculatedMetrics.push(errorRate);
    }

    return calculatedMetrics;
  }

  /**
   * @method validateServiceProps
   * @description 验证服务属性
   * @param {NotifAnalyticsServiceProps} props 服务属性
   * @throws {InvalidNotifAnalyticsServiceError} 当属性无效时抛出
   * @private
   */
  private validateServiceProps(props: NotifAnalyticsServiceProps): void {
    if (!props.tenantId || props.tenantId.trim().length === 0) {
      throw new InvalidNotifAnalyticsServiceError('租户ID不能为空');
    }
  }

  /**
   * @method validateAnalyticsData
   * @description 验证分析数据
   * @param {NotifAnalyticsData} data 分析数据
   * @throws {InvalidNotifAnalyticsServiceError} 当数据无效时抛出
   * @private
   */
  private validateAnalyticsData(data: NotifAnalyticsData): void {
    if (!data.channel || data.channel.trim().length === 0) {
      throw new InvalidNotifAnalyticsServiceError('频道不能为空');
    }

    if (!data.notificationType || data.notificationType.trim().length === 0) {
      throw new InvalidNotifAnalyticsServiceError('通知类型不能为空');
    }

    if (!data.priority || data.priority.trim().length === 0) {
      throw new InvalidNotifAnalyticsServiceError('优先级不能为空');
    }

    if (!data.strategy || data.strategy.trim().length === 0) {
      throw new InvalidNotifAnalyticsServiceError('策略不能为空');
    }

    this.validateMetrics(data.metrics);
    this.validateDimensions(data.dimensions);
  }

  /**
   * @method validateMetrics
   * @description 验证指标数据
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @throws {InvalidNotifAnalyticsServiceError} 当指标无效时抛出
   * @private
   */
  private validateMetrics(metrics: AnalyticsMetric[]): void {
    if (!metrics || !Array.isArray(metrics)) {
      throw new InvalidNotifAnalyticsServiceError('指标数据必须是数组');
    }

    if (metrics.length === 0) {
      throw new InvalidNotifAnalyticsServiceError('指标数据不能为空');
    }

    metrics.forEach((metric, index) => {
      if (!metric) {
        throw new InvalidNotifAnalyticsServiceError(
          `指标数据第${index + 1}项不能为空`,
        );
      }
    });
  }

  /**
   * @method validateDimensions
   * @description 验证维度数据
   * @param {AnalyticsDimension[]} dimensions 维度数据
   * @throws {InvalidNotifAnalyticsServiceError} 当维度无效时抛出
   * @private
   */
  private validateDimensions(dimensions: AnalyticsDimension[]): void {
    if (!dimensions || !Array.isArray(dimensions)) {
      throw new InvalidNotifAnalyticsServiceError('维度数据必须是数组');
    }

    dimensions.forEach((dimension, index) => {
      if (!dimension) {
        throw new InvalidNotifAnalyticsServiceError(
          `维度数据第${index + 1}项不能为空`,
        );
      }
    });
  }

  /**
   * @method validateReportRequest
   * @description 验证报告请求
   * @param {NotifAnalyticsReportRequest} request 报告请求
   * @throws {InvalidNotifAnalyticsServiceError} 当请求无效时抛出
   * @private
   */
  private validateReportRequest(request: NotifAnalyticsReportRequest): void {
    if (!request.title || request.title.trim().length === 0) {
      throw new InvalidNotifAnalyticsServiceError('报告标题不能为空');
    }

    if (
      !request.timeRange ||
      !request.timeRange.start ||
      !request.timeRange.end
    ) {
      throw new InvalidNotifAnalyticsServiceError('时间范围不能为空');
    }

    if (request.timeRange.start >= request.timeRange.end) {
      throw new InvalidNotifAnalyticsServiceError(
        '开始时间不能晚于或等于结束时间',
      );
    }
  }

  /**
   * @method validateQuery
   * @description 验证查询条件
   * @param {NotifAnalyticsQuery} query 查询条件
   * @throws {InvalidNotifAnalyticsServiceError} 当查询无效时抛出
   * @private
   */
  private validateQuery(query: NotifAnalyticsQuery): void {
    if (!query.tenantId || query.tenantId.trim().length === 0) {
      throw new InvalidNotifAnalyticsServiceError('租户ID不能为空');
    }

    if (query.limit && query.limit <= 0) {
      throw new InvalidNotifAnalyticsServiceError('限制数量必须大于0');
    }

    if (query.offset && query.offset < 0) {
      throw new InvalidNotifAnalyticsServiceError('偏移量不能为负数');
    }
  }

  /**
   * @method generateAnalyticsId
   * @description 生成分析ID
   * @returns {string} 分析ID
   * @private
   */
  private generateAnalyticsId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * @method generateSummaryReport
   * @description 生成摘要报告
   * @param {NotifAnalyticsReportRequest} request 报告请求
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @param {AnalyticsDimension[]} dimensions 维度数据
   * @returns {AnalyticsReport} 摘要报告
   * @private
   */
  private generateSummaryReport(
    request: NotifAnalyticsReportRequest,
    metrics: AnalyticsMetric[],
    dimensions: AnalyticsDimension[],
  ): AnalyticsReport {
    return AnalyticsReport.createSummary(
      request.title,
      metrics,
      request.timeRange.start,
      request.timeRange.end,
    );
  }

  /**
   * @method generateDetailedReport
   * @description 生成详细报告
   * @param {NotifAnalyticsReportRequest} request 报告请求
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @param {AnalyticsDimension[]} dimensions 维度数据
   * @returns {AnalyticsReport} 详细报告
   * @private
   */
  private generateDetailedReport(
    request: NotifAnalyticsReportRequest,
    metrics: AnalyticsMetric[],
    dimensions: AnalyticsDimension[],
  ): AnalyticsReport {
    return AnalyticsReport.createDetailed(
      request.title,
      metrics,
      dimensions,
      request.timeRange.start,
      request.timeRange.end,
    );
  }

  /**
   * @method generateTrendReport
   * @description 生成趋势报告
   * @param {NotifAnalyticsReportRequest} request 报告请求
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @param {AnalyticsDimension[]} dimensions 维度数据
   * @returns {AnalyticsReport} 趋势报告
   * @private
   */
  private generateTrendReport(
    request: NotifAnalyticsReportRequest,
    metrics: AnalyticsMetric[],
    dimensions: AnalyticsDimension[],
  ): AnalyticsReport {
    return AnalyticsReport.createTrend(
      request.title,
      metrics,
      request.timeRange.start,
      request.timeRange.end,
    );
  }

  /**
   * @method generatePerformanceReport
   * @description 生成性能报告
   * @param {NotifAnalyticsReportRequest} request 报告请求
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @param {AnalyticsDimension[]} dimensions 维度数据
   * @returns {AnalyticsReport} 性能报告
   * @private
   */
  private generatePerformanceReport(
    request: NotifAnalyticsReportRequest,
    metrics: AnalyticsMetric[],
    dimensions: AnalyticsDimension[],
  ): AnalyticsReport {
    return AnalyticsReport.createPerformance(
      request.title,
      metrics,
      request.timeRange.start,
      request.timeRange.end,
    );
  }

  /**
   * @method calculateDeliveryRate
   * @description 计算送达率
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @returns {AnalyticsMetric | null} 送达率指标
   * @private
   */
  private calculateDeliveryRate(
    metrics: AnalyticsMetric[],
  ): AnalyticsMetric | null {
    const sentMetrics = metrics.filter(
      m =>
        m.getType() === AnalyticsMetricType.VOLUME &&
        m.getUnit() === 'messages',
    );
    const deliveredMetrics = metrics.filter(
      m => m.getType() === AnalyticsMetricType.DELIVERY_RATE,
    );

    if (sentMetrics.length === 0 || deliveredMetrics.length === 0) {
      return null;
    }

    const totalSent = sentMetrics.reduce(
      (sum, metric) => sum + metric.getValue(),
      0,
    );
    const totalDelivered = deliveredMetrics.reduce(
      (sum, metric) => sum + metric.getValue(),
      0,
    );

    if (totalSent === 0) {
      return null;
    }

    const deliveryRate = (totalDelivered / totalSent) * 100;
    return AnalyticsMetric.createDeliveryRate(
      deliveryRate,
      new Date(),
      'day' as any,
    );
  }

  /**
   * @method calculateOpenRate
   * @description 计算打开率
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @returns {AnalyticsMetric | null} 打开率指标
   * @private
   */
  private calculateOpenRate(
    metrics: AnalyticsMetric[],
  ): AnalyticsMetric | null {
    const openMetrics = metrics.filter(
      m => m.getType() === AnalyticsMetricType.OPEN_RATE,
    );

    if (openMetrics.length === 0) {
      return null;
    }

    const averageOpenRate =
      openMetrics.reduce((sum, metric) => sum + metric.getValue(), 0) /
      openMetrics.length;
    return AnalyticsMetric.createOpenRate(
      averageOpenRate,
      new Date(),
      'day' as any,
    );
  }

  /**
   * @method calculateClickRate
   * @description 计算点击率
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @returns {AnalyticsMetric | null} 点击率指标
   * @private
   */
  private calculateClickRate(
    metrics: AnalyticsMetric[],
  ): AnalyticsMetric | null {
    const clickMetrics = metrics.filter(
      m => m.getType() === AnalyticsMetricType.CLICK_RATE,
    );

    if (clickMetrics.length === 0) {
      return null;
    }

    const averageClickRate =
      clickMetrics.reduce((sum, metric) => sum + metric.getValue(), 0) /
      clickMetrics.length;
    return AnalyticsMetric.createClickRate(
      averageClickRate,
      new Date(),
      'day' as any,
    );
  }

  /**
   * @method calculateErrorRate
   * @description 计算错误率
   * @param {AnalyticsMetric[]} metrics 指标数据
   * @returns {AnalyticsMetric | null} 错误率指标
   * @private
   */
  private calculateErrorRate(
    metrics: AnalyticsMetric[],
  ): AnalyticsMetric | null {
    const errorMetrics = metrics.filter(
      m => m.getType() === AnalyticsMetricType.ERROR_RATE,
    );

    if (errorMetrics.length === 0) {
      return null;
    }

    const averageErrorRate =
      errorMetrics.reduce((sum, metric) => sum + metric.getValue(), 0) /
      errorMetrics.length;
    return AnalyticsMetric.create({
      type: AnalyticsMetricType.ERROR_RATE,
      value: averageErrorRate,
      unit: '%',
      timestamp: new Date(),
      timeRange: 'day' as any,
    });
  }
}

/**
 * @class InvalidNotifAnalyticsServiceError
 * @description 无效通知分析服务错误
 */
export class InvalidNotifAnalyticsServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifAnalyticsServiceError';
  }
}
