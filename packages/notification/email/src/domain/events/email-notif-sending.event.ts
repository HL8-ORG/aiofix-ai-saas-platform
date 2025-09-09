import { DomainEvent } from '@aiofix/core';
import { NotifId, TenantId, UserId, Email } from '@aiofix/shared';
import { EmailProvider } from '../value-objects/email-provider.vo';

/**
 * @class EmailNotifSendingEvent
 * @description
 * 邮件通知发送中领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示邮件通知开始发送过程
 * 2. 包含邮件发送的关键信息
 * 3. 为其他聚合根提供邮件发送状态通知
 *
 * 触发条件：
 * 1. 邮件通知状态从PENDING转换为SENDING时触发
 * 2. 邮件发送服务开始处理邮件时触发
 * 3. 重试发送邮件时触发
 *
 * 影响范围：
 * 1. 通知邮件发送服务开始发送流程
 * 2. 更新邮件发送统计信息
 * 3. 记录邮件发送审计日志
 * 4. 触发邮件发送监控和告警
 *
 * @property {NotifId} notifId 邮件通知ID
 * @property {TenantId} tenantId 租户ID
 * @property {UserId} recipientId 收件人用户ID
 * @property {Email} recipientEmail 收件人邮箱地址
 * @property {EmailProvider} provider 邮件服务提供商
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new EmailNotifSendingEvent(
 *   notifId,
 *   tenantId,
 *   recipientId,
 *   emailAddress,
 *   EmailProvider.SENDGRID
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class EmailNotifSendingEvent extends DomainEvent {
  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly recipientEmail: Email,
    public readonly provider: EmailProvider,
  ) {
    super(notifId.value, 1, {
      tenantId: tenantId.value,
      userId: recipientId.value,
      source: 'email-notification',
    });
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {object} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      notifId: this.notifId.value,
      tenantId: this.tenantId.value,
      recipientId: this.recipientId.value,
      recipientEmail: this.recipientEmail.value,
      provider: this.provider,
    };
  }
}
