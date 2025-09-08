import { IDomainEvent } from '@aiofix/core';

/**
 * @interface NotifAnalyticsUpdatedEventProps
 * @description 通知分析更新事件属性接口
 */
export interface NotifAnalyticsUpdatedEventProps {
  readonly analyticsId: string;
  readonly tenantId: string;
  readonly updateType: string;
  readonly updateData: Record<string, unknown>;
  readonly organizationId?: string;
  readonly departmentId?: string;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class NotifAnalyticsUpdatedEvent
 * @description 通知分析更新领域事件
 *
 * 事件含义：
 * 1. 表示通知分析数据已成功更新
 * 2. 包含更新操作的类型和详细信息
 * 3. 为其他聚合根提供分析更新通知
 *
 * 触发条件：
 * 1. 分析指标数据更新
 * 2. 分析维度数据更新
 * 3. 分析报告状态变更
 * 4. 分析配置参数修改
 *
 * 影响范围：
 * 1. 更新分析统计信息
 * 2. 触发相关报告重新计算
 * 3. 更新分析仪表板显示
 * 4. 记录分析更新审计日志
 */
export class NotifAnalyticsUpdatedEvent implements IDomainEvent {
  public readonly occurredOn: Date = new Date();
  public readonly eventVersion: number = 1;

  constructor(
    public readonly analyticsId: string,
    public readonly tenantId: string,
    public readonly updateType: string,
    public readonly updateData: Record<string, unknown>,
    public readonly organizationId?: string,
    public readonly departmentId?: string,
    public readonly userId?: string,
    public readonly metadata?: Record<string, unknown>,
  ) {
    this.validateEvent();
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  public getEventType(): string {
    return 'NotifAnalyticsUpdated';
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
   * @method getUpdateType
   * @description 获取更新类型
   * @returns {string} 更新类型
   */
  public getUpdateType(): string {
    return this.updateType;
  }

  /**
   * @method getUpdateData
   * @description 获取更新数据
   * @returns {Record<string, unknown>} 更新数据
   */
  public getUpdateData(): Record<string, unknown> {
    return { ...this.updateData };
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
  public getMetadata(): Record<string, unknown> | undefined {
    return this.metadata;
  }

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
      updateType: this.updateType,
      updateData: this.updateData,
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
   * @returns {NotifAnalyticsUpdatedEvent} 事件实例
   * @throws {InvalidNotifAnalyticsEventError} 当事件数据无效时抛出
   * @static
   */
  public static fromJSON(
    data: Record<string, unknown>,
  ): NotifAnalyticsUpdatedEvent {
    const event = new NotifAnalyticsUpdatedEvent(
      data.analyticsId as string,
      data.tenantId as string,
      data.updateType as string,
      data.updateData as Record<string, unknown>,
      data.organizationId as string | undefined,
      data.departmentId as string | undefined,
      data.userId as string | undefined,
      data.metadata as Record<string, unknown> | undefined,
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

    if (!this.updateType || this.updateType.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('更新类型不能为空');
    }

    if (!this.updateData || typeof this.updateData !== 'object') {
      throw new InvalidNotifAnalyticsEventError('更新数据不能为空且必须是对象');
    }

    // 验证更新类型
    const validUpdateTypes = [
      'metric_added',
      'metrics_added',
      'dimension_added',
      'dimensions_added',
      'metric_updated',
      'metric_removed',
      'reports_cleared',
      'data_processed',
    ];

    if (!validUpdateTypes.includes(this.updateType)) {
      throw new InvalidNotifAnalyticsEventError(
        `无效的更新类型: ${this.updateType}，支持的更新类型: ${validUpdateTypes.join(', ')}`,
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
