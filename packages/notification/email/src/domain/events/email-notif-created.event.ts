import { DomainEvent } from '@aiofix/core';
import { NotifId, TenantId, UserId, Email, NotifStatus } from '@aiofix/shared';
import { EmailContent } from '../value-objects/email-content.vo';
import { EmailProvider } from '../value-objects/email-provider.vo';
import { TemplateId } from '../value-objects/template-id.vo';
import { EmailPriority } from '../value-objects/email-priority.vo';

/**
 * @class EmailNotifCreatedEvent
 * @description
 * 邮件通知创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示邮件通知聚合根已成功创建
 * 2. 包含邮件通知创建时的关键信息
 * 3. 为其他聚合根提供邮件通知创建通知
 *
 * 触发条件：
 * 1. 邮件通知聚合根成功创建后自动触发
 * 2. 邮件地址验证通过
 * 3. 邮件内容验证通过
 * 4. 模板ID验证通过
 *
 * 影响范围：
 * 1. 通知邮件发送服务开始发送流程
 * 2. 触发邮件模板渲染
 * 3. 更新邮件通知统计信息
 * 4. 记录邮件通知创建审计日志
 *
 * @property {NotifId} notifId 邮件通知ID
 * @property {TenantId} tenantId 租户ID
 * @property {UserId} recipientId 收件人用户ID
 * @property {Email} recipientEmail 收件人邮箱地址
 * @property {EmailContent} content 邮件内容
 * @property {TemplateId} templateId 邮件模板ID
 * @property {EmailProvider} provider 邮件服务提供商
 * @property {EmailPriority} priority 邮件优先级
 * @property {Record<string, unknown>} metadata 元数据
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new EmailNotifCreatedEvent(
 *   notifId,
 *   tenantId,
 *   recipientId,
 *   emailAddress,
 *   emailContent,
 *   templateId,
 *   EmailProvider.SENDGRID,
 *   new EmailPriority(EmailPriorityType.HIGH),
 *   { source: 'system' }
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class EmailNotifCreatedEvent extends DomainEvent {
  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly recipientEmail: Email,
    public readonly content: EmailContent,
    public readonly templateId: TemplateId,
    public readonly provider: EmailProvider,
    public readonly priority: EmailPriority,
    public readonly notifMetadata: Record<string, unknown>,
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
      content: {
        subject: this.content.subject,
        htmlContent: this.content.htmlContent,
        textContent: this.content.textContent,
      },
      templateId: this.templateId.value,
      provider: this.provider,
      priority: this.priority.value,
      metadata: this.notifMetadata,
    };
  }
}
