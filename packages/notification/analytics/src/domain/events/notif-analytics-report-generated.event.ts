import { DomainEvent } from '@aiofix/core';

/**
 * @interface NotifAnalyticsReportGeneratedEventProps
 * @description 通知分析报告生成事件属性接口
 */
export interface NotifAnalyticsReportGeneratedEventProps {
  readonly analyticsId: string;
  readonly tenantId: string;
  readonly reportType: string;
  readonly reportTitle: string;
  readonly reportStatus: string;
  readonly organizationId?: string;
  readonly departmentId?: string;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class NotifAnalyticsReportGeneratedEvent
 * @description 通知分析报告生成领域事件
 *
 * 事件含义：
 * 1. 表示通知分析报告已成功生成
 * 2. 包含报告生成的关键信息
 * 3. 为其他聚合根提供报告生成通知
 *
 * 触发条件：
 * 1. 分析报告成功生成
 * 2. 报告状态变更为已完成
 * 3. 报告数据验证通过
 *
 * 影响范围：
 * 1. 通知报告管理系统更新报告状态
 * 2. 触发报告分发流程
 * 3. 更新报告统计信息
 * 4. 记录报告生成审计日志
 */
export class NotifAnalyticsReportGeneratedEvent extends DomainEvent {
  constructor(
    public readonly analyticsId: string,
    public readonly tenantId: string,
    public readonly reportType: string,
    public readonly reportTitle: string,
    public readonly reportStatus: string,
    public readonly organizationId?: string,
    public readonly departmentId?: string,
    public readonly userId?: string,
  ) {
    super(analyticsId, 1, {
      tenantId,
      userId,
      source: 'notification-analytics',
    });
    this.validateEvent();
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  public getEventType(): string {
    return 'NotifAnalyticsReportGenerated';
  }

  /**
   * @method getEventId
   * @description 获取事件唯一标识
   * @returns {string} 事件ID
   */
  public getEventId(): string {
    return `${this.getEventType()}_${this.analyticsId}_${this.occurredOn.getTime()}`;
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  public getAggregateId(): string {
    return this.analyticsId;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.tenantId;
  }

  /**
   * @method getReportType
   * @description 获取报告类型
   * @returns {string} 报告类型
   */
  public getReportType(): string {
    return this.reportType;
  }

  /**
   * @method getReportTitle
   * @description 获取报告标题
   * @returns {string} 报告标题
   */
  public getReportTitle(): string {
    return this.reportTitle;
  }

  /**
   * @method getReportStatus
   * @description 获取报告状态
   * @returns {string} 报告状态
   */
  public getReportStatus(): string {
    return this.reportStatus;
  }

  /**
   * @method getOrganizationId
   * @description 获取组织ID
   * @returns {string | undefined} 组织ID
   */
  public getOrganizationId(): string | undefined {
    return this.organizationId;
  }

  /**
   * @method getDepartmentId
   * @description 获取部门ID
   * @returns {string | undefined} 部门ID
   */
  public getDepartmentId(): string | undefined {
    return this.departmentId;
  }

  /**
   * @method getUserId
   * @description 获取用户ID
   * @returns {string | undefined} 用户ID
   */
  public getUserId(): string | undefined {
    return this.userId;
  }

  /**
   * @method getMetadata
   * @description 获取元数据
   * @returns {Record<string, unknown> | undefined} 元数据
   */

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {Record<string, unknown>} JSON格式的事件数据
   */
  public toJSON(): Record<string, unknown> {
    return {
      eventType: this.getEventType(),
      eventId: this.getEventId(),
      aggregateId: this.getAggregateId(),
      occurredOn: this.occurredOn.toISOString(),
      eventVersion: this.eventVersion,
      analyticsId: this.analyticsId,
      tenantId: this.tenantId,
      reportType: this.reportType,
      reportTitle: this.reportTitle,
      reportStatus: this.reportStatus,
      organizationId: this.organizationId,
      departmentId: this.departmentId,
      userId: this.userId,
      metadata: this.metadata,
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON格式创建事件实例
   * @param {Record<string, unknown>} data JSON格式的事件数据
   * @returns {NotifAnalyticsReportGeneratedEvent} 事件实例
   * @throws {InvalidNotifAnalyticsEventError} 当事件数据无效时抛出
   * @static
   */
  public static fromJSON(
    data: Record<string, unknown>,
  ): NotifAnalyticsReportGeneratedEvent {
    const event = new NotifAnalyticsReportGeneratedEvent(
      data.analyticsId as string,
      data.tenantId as string,
      data.reportType as string,
      data.reportTitle as string,
      data.reportStatus as string,
      data.organizationId as string | undefined,
      data.departmentId as string | undefined,
      data.userId as string | undefined,
    );

    // 设置事件时间
    if (data.occurredOn) {
      (event as any).occurredOn = new Date(data.occurredOn as string);
    }

    return event;
  }

  /**
   * @method validateEvent
   * @description 验证事件数据
   * @throws {InvalidNotifAnalyticsEventError} 当事件数据无效时抛出
   * @private
   */
  private validateEvent(): void {
    if (!this.analyticsId || this.analyticsId.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('分析ID不能为空');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('租户ID不能为空');
    }

    if (!this.reportType || this.reportType.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('报告类型不能为空');
    }

    if (!this.reportTitle || this.reportTitle.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('报告标题不能为空');
    }

    if (!this.reportStatus || this.reportStatus.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('报告状态不能为空');
    }

    // 验证报告类型
    const validReportTypes = [
      'summary',
      'detailed',
      'comparative',
      'trend',
      'performance',
      'custom',
    ];

    if (!validReportTypes.includes(this.reportType)) {
      throw new InvalidNotifAnalyticsEventError(
        `无效的报告类型: ${this.reportType}，支持的报告类型: ${validReportTypes.join(', ')}`,
      );
    }

    // 验证报告状态
    const validReportStatuses = [
      'pending',
      'processing',
      'completed',
      'failed',
      'expired',
    ];

    if (!validReportStatuses.includes(this.reportStatus)) {
      throw new InvalidNotifAnalyticsEventError(
        `无效的报告状态: ${this.reportStatus}，支持的报告状态: ${validReportStatuses.join(', ')}`,
      );
    }
  }
}

/**
 * @class InvalidNotifAnalyticsEventError
 * @description 无效通知分析事件错误
 */
export class InvalidNotifAnalyticsEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifAnalyticsEventError';
  }
}
