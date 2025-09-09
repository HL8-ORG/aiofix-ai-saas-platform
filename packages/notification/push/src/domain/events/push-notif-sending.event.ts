import { DomainEvent } from '@aiofix/core';
import { NotifId, TenantId, UserId } from '@aiofix/shared';
import { PushToken } from '../value-objects/push-token.vo';
import { PushContent } from '../value-objects/push-content.vo';
import { PushPriorityLevel } from '../value-objects/push-priority.vo';

/**
 * @class PushNotifSendingEvent
 * @description
 * 推送通知发送中事件，表示推送通知正在发送过程中。
 *
 * 事件含义：
 * 1. 表示推送通知已开始发送流程
 * 2. 包含推送通知发送时的关键信息
 * 3. 为其他聚合根提供推送通知发送状态通知
 * 4. 触发推送通知的发送监控和跟踪
 *
 * 触发条件：
 * 1. 推送通知聚合根开始发送后自动触发
 * 2. 推送令牌验证通过
 * 3. 推送内容准备就绪
 * 4. 推送服务开始处理
 *
 * 影响范围：
 * 1. 通知推送服务开始实际发送
 * 2. 触发推送通知的发送监控
 * 3. 更新推送通知发送状态
 * 4. 记录推送通知发送审计日志
 *
 * @property {string} pushNotifId 推送通知ID
 * @property {string} tenantId 租户ID
 * @property {string} userId 用户ID
 * @property {PushToken} pushToken 推送令牌
 * @property {PushContent} content 推送内容
 * @property {PushPriorityLevel} priority 推送优先级
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new PushNotifSendingEvent(
 *   'push-123',
 *   'tenant-456',
 *   'user-789',
 *   pushToken,
 *   pushContent,
 *   PushPriorityLevel.NORMAL
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class PushNotifSendingEvent extends DomainEvent {
  constructor(
    public readonly pushNotifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly userId: UserId,
    public readonly pushToken: PushToken,
    public readonly content: PushContent,
    public readonly priority: PushPriorityLevel,
  ) {
    super(pushNotifId.value, 1, {
      tenantId: tenantId.value,
      userId: userId.value,
      source: 'push-notification',
    });
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'PushNotifSending';
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  getAggregateId(): string {
    return this.pushNotifId.value;
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
      tenantId: this.tenantId.value,
      userId: this.userId.value,
      pushToken: this.pushToken.toString(),
      content: this.content.toPlainObject(),
      priority: this.priority,
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
      tenantId: this.tenantId.value,
      userId: this.userId.value,
      occurredOn: this.occurredOn,
      pushPlatform: this.pushToken.getPlatform(),
      priority: this.priority,
    };
  }

  /**
   * @method toString
   * @description 返回事件的字符串表示
   * @returns {string} 事件字符串
   */
  toString(): string {
    return `PushNotifSendingEvent: ${this.pushNotifId.value} for user ${this.userId.value} in tenant ${this.tenantId.value}`;
  }

  /**
   * 将事件转换为JSON格式
   *
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getEventMetadata(),
      ...this.getEventData(),
    };
  }
}
