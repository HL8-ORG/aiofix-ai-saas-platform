import { IDomainEvent } from '@aiofix/core';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { SmsContent } from '../value-objects/sms-content.vo';
import { SmsProvider } from '../value-objects/sms-provider.vo';

/**
 * 短信通知已送达事件
 *
 * 表示短信通知已成功送达用户设备。
 *
 * 事件含义：
 * - 表示短信通知已成功送达用户设备
 * - 包含短信通知送达时的关键信息
 * - 为其他聚合根提供短信通知送达通知
 *
 * 触发条件：
 * - 短信通知聚合根成功送达后自动触发
 * - 短信通知状态从SENT转换为DELIVERED
 * - 短信服务提供商返回送达确认
 *
 * 影响范围：
 * - 通知短信发送服务送达成功
 * - 更新短信通知状态为已送达
 * - 记录短信送达时间
 * - 触发短信送达统计更新
 *
 * @class SmsNotifDeliveredEvent
 * @implements IDomainEvent
 */
export class SmsNotifDeliveredEvent implements IDomainEvent {
  public readonly occurredOn: Date = new Date();

  constructor(
    public readonly smsNotifId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly phoneNumber: PhoneNumber,
    public readonly content: SmsContent,
    public readonly provider: SmsProvider,
    public readonly deliveredAt: Date,
  ) {}

  /**
   * 获取事件类型
   *
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'SmsNotifDelivered';
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
    return this.smsNotifId;
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
      deliveredAt: this.deliveredAt,
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
}
