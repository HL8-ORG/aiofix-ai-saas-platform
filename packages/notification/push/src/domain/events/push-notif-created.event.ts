import { DomainEvent } from '@aiofix/core';
import { NotifId, TenantId, UserId } from '@aiofix/shared';
import { PushToken } from '../value-objects/push-token.vo';
import { PushContent } from '../value-objects/push-content.vo';
import { PushPriorityLevel } from '../value-objects/push-priority.vo';

/**
 * @class PushNotifCreatedEvent
 * @description
 * 推送通知创建事件，表示推送通知已成功创建。
 *
 * 事件含义：
 * 1. 表示推送通知聚合根已成功创建
 * 2. 包含推送通知创建时的关键信息
 * 3. 为其他聚合根提供推送通知创建通知
 * 4. 触发推送通知的后续处理流程
 *
 * 触发条件：
 * 1. 推送通知聚合根成功创建后自动触发
 * 2. 推送令牌验证通过
 * 3. 推送内容验证通过
 * 4. 推送优先级设置成功
 *
 * 影响范围：
 * 1. 通知推送服务开始处理推送通知
 * 2. 触发推送通知的调度和发送流程
 * 3. 更新推送通知统计信息
 * 4. 记录推送通知创建审计日志
 *
 * @property {string} pushNotifId 推送通知ID
 * @property {string} tenantId 租户ID
 * @property {string} userId 用户ID
 * @property {PushToken} pushToken 推送令牌
 * @property {PushContent} content 推送内容
 * @property {PushPriorityLevel} priority 推送优先级
 * @property {Date} [scheduledAt] 计划发送时间，可选
 * @property {Record<string, any>} [metadata] 元数据，可选
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new PushNotifCreatedEvent(
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
export class PushNotifCreatedEvent extends DomainEvent {
  constructor(
    public readonly pushNotifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly userId: UserId,
    public readonly pushToken: PushToken,
    public readonly content: PushContent,
    public readonly priority: PushPriorityLevel,
    public readonly scheduledAt?: Date,
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
    return 'PushNotifCreated';
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式，用于序列化和存储
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      pushNotifId: this.pushNotifId.value,
      tenantId: this.tenantId.value,
      userId: this.userId.value,
      pushToken: this.pushToken.toString(),
      content: this.content.toPlainObject(),
      priority: this.priority,
      scheduledAt: this.scheduledAt,
      metadata: this.metadata,
    };
  }

  /**
   * @method toString
   * @description 返回事件的字符串表示
   * @returns {string} 事件字符串
   */
  toString(): string {
    return `PushNotifCreatedEvent: ${this.pushNotifId.value} for user ${this.userId.value} in tenant ${this.tenantId.value}`;
  }
}
