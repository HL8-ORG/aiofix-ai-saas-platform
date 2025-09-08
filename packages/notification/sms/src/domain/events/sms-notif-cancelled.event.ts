import { IDomainEvent } from '@aiofix/core';
import { PhoneNumber } from '../value-objects/phone-number.vo';
import { SmsContent } from '../value-objects/sms-content.vo';
import { SmsProvider } from '../value-objects/sms-provider.vo';

/**
 * 短信通知取消事件
 *
 * 表示短信通知已被取消发送。
 *
 * 事件含义：
 * - 表示短信通知已被取消发送
 * - 包含短信通知取消时的关键信息
 * - 为其他聚合根提供短信通知取消通知
 *
 * 触发条件：
 * - 短信通知聚合根被取消后自动触发
 * - 短信通知状态转换为CANCELLED
 * - 用户主动取消或系统自动取消
 *
 * 影响范围：
 * - 通知短信发送服务取消发送
 * - 更新短信通知状态为已取消
 * - 记录短信取消原因
 * - 触发短信取消统计更新
 *
 * @class SmsNotifCancelledEvent
 * @implements IDomainEvent
 */
export class SmsNotifCancelledEvent implements IDomainEvent {
  public readonly occurredOn: Date = new Date();

  constructor(
    public readonly smsNotifId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly phoneNumber: PhoneNumber,
    public readonly content: SmsContent,
    public readonly provider: SmsProvider,
    public readonly cancelReason: string,
  ) {}

  /**
   * 获取事件类型
   *
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'SmsNotifCancelled';
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
      cancelReason: this.cancelReason,
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
