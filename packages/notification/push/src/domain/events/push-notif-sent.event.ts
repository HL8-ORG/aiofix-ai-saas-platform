import { IDomainEvent } from '@aiofix/core';
import { PushToken } from '../value-objects/push-token.vo';
import { PushContent } from '../value-objects/push-content.vo';
import { PushPriorityLevel } from '../value-objects/push-priority.vo';

/**
 * @class PushNotifSentEvent
 * @description
 * 推送通知已发送事件，表示推送通知已成功发送到推送服务。
 *
 * 事件含义：
 * 1. 表示推送通知已成功发送到推送服务
 * 2. 包含推送通知发送时的关键信息
 * 3. 为其他聚合根提供推送通知发送成功通知
 * 4. 触发推送通知的送达监控和跟踪
 *
 * 触发条件：
 * 1. 推送通知聚合根发送成功后自动触发
 * 2. 推送服务确认接收推送通知
 * 3. 推送通知状态更新为已发送
 * 4. 推送通知发送时间记录完成
 *
 * 影响范围：
 * 1. 通知推送服务开始监控送达状态
 * 2. 触发推送通知的送达跟踪
 * 3. 更新推送通知发送统计
 * 4. 记录推送通知发送成功审计日志
 *
 * @property {string} pushNotifId 推送通知ID
 * @property {string} tenantId 租户ID
 * @property {string} userId 用户ID
 * @property {PushToken} pushToken 推送令牌
 * @property {PushContent} content 推送内容
 * @property {PushPriorityLevel} priority 推送优先级
 * @property {Date} sentAt 发送时间
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new PushNotifSentEvent(
 *   'push-123',
 *   'tenant-456',
 *   'user-789',
 *   pushToken,
 *   pushContent,
 *   PushPriorityLevel.NORMAL,
 *   new Date()
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class PushNotifSentEvent implements IDomainEvent {
  public readonly occurredOn: Date = new Date();

  constructor(
    public readonly pushNotifId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly pushToken: PushToken,
    public readonly content: PushContent,
    public readonly priority: PushPriorityLevel,
    public readonly sentAt: Date,
  ) {}

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'PushNotifSent';
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  getAggregateId(): string {
    return this.pushNotifId;
  }

  /**
   * @method getEventId
   * @description 获取事件ID
   * @returns {string} 事件ID
   */
  getEventId(): string {
    return `${this.getEventType()}-${this.pushNotifId}-${this.occurredOn.getTime()}`;
  }

  /**
   * @method getEventVersion
   * @description 获取事件版本
   * @returns {number} 事件版本
   */
  getEventVersion(): number {
    return 1;
  }

  /**
   * @method getEventData
   * @description 获取事件数据
   * @returns {Record<string, any>} 事件数据
   */
  getEventData(): Record<string, any> {
    return {
      pushNotifId: this.pushNotifId,
      tenantId: this.tenantId,
      userId: this.userId,
      pushToken: this.pushToken.toString(),
      content: this.content.toPlainObject(),
      priority: this.priority,
      sentAt: this.sentAt,
      occurredOn: this.occurredOn,
    };
  }

  /**
   * @method getEventMetadata
   * @description 获取事件元数据
   * @returns {Record<string, any>} 事件元数据
   */
  getEventMetadata(): Record<string, any> {
    return {
      eventType: this.getEventType(),
      eventId: this.getEventId(),
      eventVersion: this.getEventVersion(),
      aggregateId: this.getAggregateId(),
      tenantId: this.tenantId,
      userId: this.userId,
      occurredOn: this.occurredOn,
      pushPlatform: this.pushToken.getPlatform(),
      priority: this.priority,
      sentAt: this.sentAt,
    };
  }

  /**
   * @method toString
   * @description 返回事件的字符串表示
   * @returns {string} 事件字符串
   */
  toString(): string {
    return `PushNotifSentEvent: ${this.pushNotifId} for user ${this.userId} in tenant ${this.tenantId} at ${this.sentAt}`;
  }
}
