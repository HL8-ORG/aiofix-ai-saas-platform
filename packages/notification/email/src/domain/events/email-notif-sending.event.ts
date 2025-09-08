import { IDomainEvent } from '@aiofix/core/src/domain/base/domain-event';
import { NotifId } from '@aiofix/core/src/domain/value-objects/notif-id.vo';
import { TenantId } from '@aiofix/core/src/domain/value-objects/tenant-id.vo';
import { UserId } from '@aiofix/core/src/domain/value-objects/user-id.vo';
import { EmailAddress } from '../value-objects/email-address.vo';
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
 * 1. 通知邮件发送服务更新发送状态
 * 2. 触发邮件发送监控和日志记录
 * 3. 更新邮件通知统计信息
 * 4. 记录邮件发送审计日志
 *
 * @property {NotifId} notifId 邮件通知ID
 * @property {TenantId} tenantId 租户ID
 * @property {UserId} recipientId 收件人用户ID
 * @property {EmailAddress} recipientEmail 收件人邮箱地址
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
export class EmailNotifSendingEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'EmailNotifSending';

  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly recipientEmail: EmailAddress,
    public readonly provider: EmailProvider,
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
      provider: this.provider,
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
