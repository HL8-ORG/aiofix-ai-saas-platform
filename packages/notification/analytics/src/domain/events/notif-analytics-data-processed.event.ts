import { IDomainEvent } from '@aiofix/core';

/**
 * @interface NotifAnalyticsDataProcessedEventProps
 * @description 通知分析数据处理事件属性接口
 */
export interface NotifAnalyticsDataProcessedEventProps {
  readonly analyticsId: string;
  readonly tenantId: string;
  readonly metricsCount: number;
  readonly dimensionsCount: number;
  readonly channel: string;
  readonly notificationType: string;
  readonly organizationId?: string;
  readonly departmentId?: string;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class NotifAnalyticsDataProcessedEvent
 * @description 通知分析数据处理领域事件
 *
 * 事件含义：
 * 1. 表示通知分析数据已成功处理
 * 2. 包含数据处理的关键信息
 * 3. 为其他聚合根提供数据处理通知
 *
 * 触发条件：
 * 1. 分析指标数据成功处理
 * 2. 分析维度数据成功处理
 * 3. 数据聚合计算完成
 * 4. 数据验证通过
 *
 * 影响范围：
 * 1. 更新分析统计信息
 * 2. 触发相关报告生成
 * 3. 更新分析仪表板数据
 * 4. 记录数据处理审计日志
 */
export class NotifAnalyticsDataProcessedEvent implements IDomainEvent {
  public readonly occurredOn: Date = new Date();
  public readonly eventVersion: number = 1;

  constructor(
    public readonly analyticsId: string,
    public readonly tenantId: string,
    public readonly metricsCount: number,
    public readonly dimensionsCount: number,
    public readonly channel: string,
    public readonly notificationType: string,
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
    return 'NotifAnalyticsDataProcessed';
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
   * @method getMetricsCount
   * @description 获取指标数量
   * @returns {number} 指标数量
   */
  public getMetricsCount(): number {
    return this.metricsCount;
  }

  /**
   * @method getDimensionsCount
   * @description 获取维度数量
   * @returns {number} 维度数量
   */
  public getDimensionsCount(): number {
    return this.dimensionsCount;
  }

  /**
   * @method getChannel
   * @description 获取频道
   * @returns {string} 频道
   */
  public getChannel(): string {
    return this.channel;
  }

  /**
   * @method getNotificationType
   * @description 获取通知类型
   * @returns {string} 通知类型
   */
  public getNotificationType(): string {
    return this.notificationType;
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
   * @method getTotalDataCount
   * @description 获取总数据数量
   * @returns {number} 总数据数量
   */
  public getTotalDataCount(): number {
    return this.metricsCount + this.dimensionsCount;
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
      metricsCount: this.metricsCount,
      dimensionsCount: this.dimensionsCount,
      channel: this.channel,
      notificationType: this.notificationType,
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
   * @returns {NotifAnalyticsDataProcessedEvent} 事件实例
   * @throws {InvalidNotifAnalyticsEventError} 当事件数据无效时抛出
   * @static
   */
  public static fromJSON(
    data: Record<string, unknown>,
  ): NotifAnalyticsDataProcessedEvent {
    const event = new NotifAnalyticsDataProcessedEvent(
      data.analyticsId as string,
      data.tenantId as string,
      data.metricsCount as number,
      data.dimensionsCount as number,
      data.channel as string,
      data.notificationType as string,
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

    if (this.metricsCount < 0) {
      throw new InvalidNotifAnalyticsEventError('指标数量不能为负数');
    }

    if (this.dimensionsCount < 0) {
      throw new InvalidNotifAnalyticsEventError('维度数量不能为负数');
    }

    if (this.metricsCount === 0 && this.dimensionsCount === 0) {
      throw new InvalidNotifAnalyticsEventError(
        '指标数量和维度数量不能同时为0',
      );
    }

    if (!this.channel || this.channel.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('频道不能为空');
    }

    if (!this.notificationType || this.notificationType.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('通知类型不能为空');
    }

    // 验证频道类型
    const validChannels = ['email', 'push', 'sms', 'in-app'];
    if (!validChannels.includes(this.channel)) {
      throw new InvalidNotifAnalyticsEventError(
        `无效的频道: ${this.channel}，支持的频道: ${validChannels.join(', ')}`,
      );
    }

    // 验证通知类型
    const validNotificationTypes = ['system', 'marketing', 'transactional'];
    if (!validNotificationTypes.includes(this.notificationType)) {
      throw new InvalidNotifAnalyticsEventError(
        `无效的通知类型: ${this.notificationType}，支持的通知类型: ${validNotificationTypes.join(', ')}`,
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
