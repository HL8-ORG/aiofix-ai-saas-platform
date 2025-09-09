import { DomainEvent } from '@aiofix/core';
import { NotifId, TenantId, UserId, Email } from '@aiofix/shared';
import { EmailProvider } from '../value-objects/email-provider.vo';

/**
 * @class EmailNotifSentEvent
 * @description
 * 邮件通知已发送领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示邮件通知已成功发送
 * 2. 包含邮件发送的关键信息
 * 3. 为其他聚合根提供邮件发送完成通知
 *
 * 触发条件：
 * 1. 邮件通知状态从SENDING转换为SENT时触发
 * 2. 邮件发送服务成功发送邮件时触发
 *
 * 影响范围：
 * 1. 更新邮件发送统计信息
 * 2. 记录邮件发送审计日志
 * 3. 触发邮件发送完成通知
 * 4. 更新用户通知状态
 *
 * @property {NotifId} notifId 邮件通知ID
 * @property {TenantId} tenantId 租户ID
 * @property {UserId} recipientId 收件人用户ID
 * @property {Email} recipientEmail 收件人邮箱地址
 * @property {EmailProvider} provider 邮件服务提供商
 * @property {Date} sentAt 发送时间
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new EmailNotifSentEvent(
 *   notifId,
 *   tenantId,
 *   recipientId,
 *   emailAddress,
 *   EmailProvider.SENDGRID,
 *   new Date()
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class EmailNotifSentEvent extends DomainEvent {
  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly recipientEmail: Email,
    public readonly provider: EmailProvider,
    public readonly sentAt: Date,
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
      sentAt: this.sentAt.toISOString(),
    };
  }
}
