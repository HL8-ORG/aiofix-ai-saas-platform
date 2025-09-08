import { IDomainEvent } from '@aiofix/core';

/**
 * @interface NotifAnalyticsCreatedEventProps
 * @description 通知分析创建事件属性接口
 */
export interface NotifAnalyticsCreatedEventProps {
  readonly analyticsId: string;
  readonly tenantId: string;
  readonly channel: string;
  readonly notificationType: string;
  readonly priority: string;
  readonly strategy: string;
  readonly organizationId?: string;
  readonly departmentId?: string;
  readonly userId?: string;
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class NotifAnalyticsCreatedEvent
 * @description 通知分析创建领域事件
 *
 * 事件含义：
 * 1. 表示通知分析数据已成功创建
 * 2. 包含分析创建时的关键信息
 * 3. 为其他聚合根提供分析创建通知
 *
 * 触发条件：
 * 1. 通知分析聚合根成功创建后自动触发
 * 2. 分析数据验证通过
 * 3. 租户关联建立成功
 *
 * 影响范围：
 * 1. 通知分析统计模块更新统计信息
 * 2. 触发分析报告生成流程
 * 3. 更新分析仪表板数据
 * 4. 记录分析创建审计日志
 */
export class NotifAnalyticsCreatedEvent implements IDomainEvent {
  public readonly occurredOn: Date = new Date();
  public readonly eventVersion: number = 1;

  constructor(
    public readonly analyticsId: string,
    public readonly tenantId: string,
    public readonly channel: string,
    public readonly notificationType: string,
    public readonly priority: string,
    public readonly strategy: string,
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
    return 'NotifAnalyticsCreated';
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
   * @method getPriority
   * @description 获取优先级
   * @returns {string} 优先级
   */
  public getPriority(): string {
    return this.priority;
  }

  /**
   * @method getStrategy
   * @description 获取策略
   * @returns {string} 策略
   */
  public getStrategy(): string {
    return this.strategy;
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
      channel: this.channel,
      notificationType: this.notificationType,
      priority: this.priority,
      strategy: this.strategy,
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
   * @returns {NotifAnalyticsCreatedEvent} 事件实例
   * @throws {InvalidNotifAnalyticsEventError} 当事件数据无效时抛出
   * @static
   */
  public static fromJSON(
    data: Record<string, unknown>,
  ): NotifAnalyticsCreatedEvent {
    const event = new NotifAnalyticsCreatedEvent(
      data.analyticsId as string,
      data.tenantId as string,
      data.channel as string,
      data.notificationType as string,
      data.priority as string,
      data.strategy as string,
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

    if (!this.channel || this.channel.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('频道不能为空');
    }

    if (!this.notificationType || this.notificationType.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('通知类型不能为空');
    }

    if (!this.priority || this.priority.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('优先级不能为空');
    }

    if (!this.strategy || this.strategy.trim().length === 0) {
      throw new InvalidNotifAnalyticsEventError('策略不能为空');
    }

    // 验证优先级
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(this.priority)) {
      throw new InvalidNotifAnalyticsEventError(
        `无效的优先级: ${this.priority}，支持的优先级: ${validPriorities.join(', ')}`,
      );
    }

    // 验证策略
    const validStrategies = ['immediate', 'delayed', 'batch'];
    if (!validStrategies.includes(this.strategy)) {
      throw new InvalidNotifAnalyticsEventError(
        `无效的策略: ${this.strategy}，支持的策略: ${validStrategies.join(', ')}`,
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
