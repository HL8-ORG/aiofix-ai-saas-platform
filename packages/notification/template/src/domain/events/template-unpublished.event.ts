import { DomainEvent } from '@aiofix/core';
import { TemplateId } from '../value-objects/template-id.vo';
import { TemplateType } from '../value-objects/template-type.vo';
import { TenantId, UserId } from '@aiofix/shared';

/**
 * @class TemplateUnpublishedEvent
 * @description
 * 模板下线领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示通知模板已成功下线
 * 2. 包含模板下线时的关键信息
 * 3. 为其他聚合根提供模板下线通知
 *
 * 触发条件：
 * 1. 模板状态从PUBLISHED转换为DRAFT时触发
 * 2. 模板下线权限验证通过
 * 3. 确认模板未被正在使用
 *
 * 影响范围：
 * 1. 通知模板管理服务更新模板状态
 * 2. 触发模板索引更新
 * 3. 更新模板可用性状态
 * 4. 记录模板下线审计日志
 * 5. 可能触发模板使用统计更新
 *
 * @property {TemplateId} templateId 模板ID
 * @property {TenantId} tenantId 租户ID
 * @property {TemplateType} templateType 模板类型
 * @property {string} name 模板名称
 * @property {string} displayName 模板显示名称
 * @property {number} version 下线版本号
 * @property {UserId} unpublishedBy 下线者用户ID
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new TemplateUnpublishedEvent(
 *   templateId,
 *   tenantId,
 *   TemplateType.EMAIL,
 *   'welcome-email',
 *   '欢迎邮件',
 *   1,
 *   userId
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class TemplateUnpublishedEvent extends DomainEvent {
  constructor(
    public readonly templateId: TemplateId,
    public readonly tenantId: TenantId,
    public readonly templateType: TemplateType,
    public readonly name: string,
    public readonly displayName: string,
    public readonly version: number,
    public readonly unpublishedBy: UserId,
  ) {
    super(templateId.value, 1, {
      tenantId: tenantId.value,
      userId: unpublishedBy.value,
      source: 'template-notification',
    });
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  public getAggregateId(): string {
    return this.templateId.value;
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
      templateId: this.templateId.value,
      tenantId: this.tenantId.value,
      templateType: this.templateType,
      name: this.name,
      displayName: this.displayName,
      version: this.version,
      unpublishedBy: this.unpublishedBy.value,
    };
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式，用于序列化和存储
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      ...this.getEventData(),
    };
  }
}
