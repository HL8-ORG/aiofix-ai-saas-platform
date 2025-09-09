import { DomainEvent } from '@aiofix/core';
import { NotifId, TenantId, UserId, PhoneNumber } from '@aiofix/shared';
import { SmsContent } from '../value-objects/sms-content.vo';
import { SmsProvider } from '../value-objects/sms-provider.vo';

/**
 * 短信通知创建事件
 *
 * 表示短信通知已成功创建。
 *
 * 事件含义：
 * - 表示短信通知聚合根已成功创建
 * - 包含短信通知创建时的关键信息
 * - 为其他聚合根提供短信通知创建通知
 *
 * 触发条件：
 * - 短信通知聚合根成功创建后自动触发
 * - 手机号验证通过
 * - 短信内容验证通过
 * - 短信提供商验证通过
 *
 * 影响范围：
 * - 通知短信发送服务开始处理
 * - 触发短信发送流程
 * - 更新短信通知统计信息
 * - 记录短信通知创建审计日志
 *
 * @class SmsNotifCreatedEvent
 * @extends DomainEvent
 */
export class SmsNotifCreatedEvent extends DomainEvent {
  constructor(
    public readonly smsNotifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly userId: UserId,
    public readonly phoneNumber: PhoneNumber,
    public readonly content: SmsContent,
    public readonly provider: SmsProvider,
    public readonly createdBy: string,
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
    return 'SmsNotifCreated';
  }

  /**
   * 获取事件数据
   *
   * @returns {object} 事件数据
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      smsNotifId: this.smsNotifId.value,
      tenantId: this.tenantId.value,
      userId: this.userId.value,
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
      createdBy: this.createdBy,
    };
  }

  /**
   * 获取事件字符串表示
   *
   * @returns {string} 事件字符串表示
   */
  toString(): string {
    return `SmsNotifCreatedEvent(smsNotifId=${this.smsNotifId.value}, tenantId=${this.tenantId.value}, userId=${this.userId.value})`;
  }
}
