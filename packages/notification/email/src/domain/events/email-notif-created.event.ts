import { IDomainEvent } from '@aiofix/core/src/domain/base/domain-event';
import { NotifId } from '@aiofix/core/src/domain/value-objects/notif-id.vo';
import { TenantId } from '@aiofix/core/src/domain/value-objects/tenant-id.vo';
import { UserId } from '@aiofix/core/src/domain/value-objects/user-id.vo';
import { NotifPriority } from '@aiofix/core/src/domain/value-objects/notif-priority.vo';
import { EmailAddress } from '../value-objects/email-address.vo';
import { EmailContent } from '../value-objects/email-content.vo';
import { EmailProvider } from '../value-objects/email-provider.vo';
import { TemplateId } from '../value-objects/template-id.vo';

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
 * @property {EmailAddress} recipientEmail 收件人邮箱地址
 * @property {EmailContent} content 邮件内容
 * @property {TemplateId} templateId 邮件模板ID
 * @property {EmailProvider} provider 邮件服务提供商
 * @property {NotifPriority} priority 通知优先级
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
 *   NotifPriority.HIGH,
 *   { source: 'system' }
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class EmailNotifCreatedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'EmailNotifCreated';

  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly recipientEmail: EmailAddress,
    public readonly content: EmailContent,
    public readonly templateId: TemplateId,
    public readonly provider: EmailProvider,
    public readonly priority: NotifPriority,
    public readonly metadata: Record<string, unknown>,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = this.generateEventId();
    this.occurredOn = occurredOn;
  }

  /**
   * @method getEventId
   * @description 获取事件ID
   * @returns {string} 事件ID
   */
  public getEventId(): string {
    return this.eventId;
  }

  /**
   * @method getEventType
   * @description 获取事件类型
   * @returns {string} 事件类型
   */
  public getEventType(): string {
    return this.eventType;
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  public getAggregateId(): string {
    return this.notifId.value;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {string} 租户ID
   */
  public getTenantId(): string {
    return this.tenantId.value;
  }

  /**
   * @method getEventData
   * @description 获取事件数据
   * @returns {object} 事件数据
   */
  public getEventData(): object {
    return {
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
      priority: this.priority,
      metadata: this.metadata,
      occurredOn: this.occurredOn,
    };
  }

  /**
   * @method generateEventId
   * @description 生成事件ID
   * @returns {string} 事件ID
   * @private
   */
  private generateEventId(): string {
    // 简化的UUID v4生成器
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  }
}
