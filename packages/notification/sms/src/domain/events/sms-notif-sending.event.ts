import { DomainEvent } from '@aiofix/core';
import { PhoneNumber, NotifId, TenantId, UserId } from '@aiofix/shared';
import { SmsContent } from '../value-objects/sms-content.vo';
import { SmsProvider } from '../value-objects/sms-provider.vo';

/**
 * 短信通知发送中事件
 *
 * 表示短信通知正在发送过程中。
 *
 * 事件含义：
 * - 表示短信通知已开始发送流程
 * - 包含短信通知发送时的关键信息
 * - 为其他聚合根提供短信通知发送通知
 *
 * 触发条件：
 * - 短信通知聚合根开始发送后自动触发
 * - 短信通知状态从PENDING或SCHEDULED转换为SENDING
 * - 短信提供商验证通过
 *
 * 影响范围：
 * - 通知短信发送服务开始处理
 * - 更新短信通知状态为发送中
 * - 记录短信发送开始时间
 * - 触发短信发送监控
 *
 * @class SmsNotifSendingEvent
 * @implements IDomainEvent
 */
export class SmsNotifSendingEvent extends DomainEvent {
  constructor(
    public readonly smsNotifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly userId: UserId,
    public readonly phoneNumber: PhoneNumber,
    public readonly content: SmsContent,
    public readonly provider: SmsProvider,
  ) {
    super(smsNotifId.value, 1, {
      tenantId: tenantId.value,
      userId: userId.value,
      source: 'sms-notification',
    });
  }

  /**
   * 获取事件类型
   *
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'SmsNotifSending';
  }

  /**
   * 获取事件ID
   *
   * @returns {string} 事件ID
   */
  getEventId(): string {
    return `${this.getEventType()}-${this.smsNotifId}-${this.occurredOn.getTime()}`;
  }

  /**
   * 获取聚合根ID
   *
   * @returns {string} 聚合根ID
   */
  getAggregateId(): string {
    return this.smsNotifId.value;
  }

  /**
   * 获取事件版本
   *
   * @returns {number} 事件版本
   */
  getEventVersion(): number {
    return 1;
  }

  /**
   * 获取事件数据
   *
   * @returns {object} 事件数据
   */
  getEventData(): object {
    return {
      smsNotifId: this.smsNotifId,
      tenantId: this.tenantId,
      userId: this.userId,
      phoneNumber: {
        number: this.phoneNumber.getNumber(),
        countryCode: this.phoneNumber.getCountryCode(),
        region: this.phoneNumber.getRegion(),
        internationalFormat: this.phoneNumber.getInternationalFormat(),
      },
      content: {
        text: this.content.getText(),
        templateId: this.content.getTemplateId(),
        templateParams: this.content.getTemplateParams(),
        signature: this.content.getSignature(),
        encoding: this.content.getEncoding(),
        language: this.content.getLanguage(),
        isTemplate: this.content.isTemplate(),
        fullContent: this.content.getFullContent(),
        length: this.content.getLength(),
        segmentCount: this.content.getSegmentCount(),
      },
      provider: {
        providerType: this.provider.getProviderType(),
        providerName: this.provider.getProviderName(),
        supportedRegions: this.provider.getSupportedRegions(),
        supportedEncodings: this.provider.getSupportedEncodings(),
        priority: this.provider.getPriority(),
        isActive: this.provider.isAvailable(),
      },
      occurredOn: this.occurredOn,
    };
  }

  /**
   * 获取事件元数据
   *
   * @returns {object} 事件元数据
   */
  getEventMetadata(): object {
    return {
      eventType: this.getEventType(),
      eventId: this.getEventId(),
      aggregateId: this.getAggregateId(),
      eventVersion: this.getEventVersion(),
      occurredOn: this.occurredOn,
      tenantId: this.tenantId,
      userId: this.userId,
    };
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
