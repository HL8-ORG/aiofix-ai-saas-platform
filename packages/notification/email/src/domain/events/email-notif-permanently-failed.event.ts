import { DomainEvent } from '@aiofix/core';
import { NotifId, TenantId, UserId, Email } from '@aiofix/shared';
import { EmailProvider } from '../value-objects/email-provider.vo';

/**
 * @class EmailNotifPermanentlyFailedEvent
 * @description
 * 邮件通知永久失败领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示邮件通知发送永久失败
 * 2. 包含最终失败原因和重试次数
 * 3. 为其他聚合根提供邮件发送永久失败通知
 *
 * 触发条件：
 * 1. 邮件通知达到最大重试次数后仍然失败时触发
 * 2. 邮件地址无效或不存在时触发
 * 3. 邮件服务提供商返回永久性错误时触发
 *
 * 影响范围：
 * 1. 停止邮件重试机制
 * 2. 更新邮件发送统计信息
 * 3. 记录邮件发送永久失败审计日志
 * 4. 触发永久失败告警和通知
 * 5. 可能需要人工干预处理
 *
 * @property {NotifId} notifId 邮件通知ID
 * @property {TenantId} tenantId 租户ID
 * @property {UserId} recipientId 收件人用户ID
 * @property {Email} recipientEmail 收件人邮箱地址
 * @property {EmailProvider} provider 邮件服务提供商
 * @property {string} errorMessage 错误信息
 * @property {number} retryCount 重试次数
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new EmailNotifPermanentlyFailedEvent(
 *   notifId,
 *   tenantId,
 *   recipientId,
 *   emailAddress,
 *   EmailProvider.SENDGRID,
 *   'Invalid email address',
 *   3
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class EmailNotifPermanentlyFailedEvent extends DomainEvent {
  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly recipientEmail: Email,
    public readonly provider: EmailProvider,
    public readonly errorMessage: string,
    public readonly retryCount: number,
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
      errorMessage: this.errorMessage,
      retryCount: this.retryCount,
    };
  }
}
