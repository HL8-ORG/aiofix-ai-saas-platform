import { IDomainEvent } from '@aiofix/core/src/domain/base/domain-event';
import { TemplateId } from '../value-objects/template-id.vo';
import { TemplateType } from '../value-objects/template-type.vo';
import { TemplateVariable } from '../value-objects/template-variable.vo';
import { TemplateContent } from '../value-objects/template-content.vo';
import { TenantId } from '@aiofix/core/src/domain/value-objects/tenant-id.vo';
import { UserId } from '@aiofix/core/src/domain/value-objects/user-id.vo';

/**
 * @class TemplateCreatedEvent
 * @description
 * 模板创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示通知模板聚合根已成功创建
 * 2. 包含模板创建时的关键信息
 * 3. 为其他聚合根提供模板创建通知
 *
 * 触发条件：
 * 1. 模板聚合根成功创建后自动触发
 * 2. 模板内容验证通过
 * 3. 模板变量验证通过
 * 4. 模板名称在租户内唯一性验证通过
 *
 * 影响范围：
 * 1. 通知模板管理服务更新模板列表
 * 2. 触发模板索引更新
 * 3. 更新模板统计信息
 * 4. 记录模板创建审计日志
 *
 * @property {TemplateId} templateId 模板ID
 * @property {TenantId} tenantId 租户ID
 * @property {TemplateType} templateType 模板类型
 * @property {string} name 模板名称
 * @property {string} displayName 模板显示名称
 * @property {TemplateContent} content 模板内容
 * @property {TemplateVariable[]} variables 模板变量列表
 * @property {string} category 模板分类
 * @property {string} description 模板描述
 * @property {Record<string, unknown>} metadata 元数据
 * @property {UserId} createdBy 创建者用户ID
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new TemplateCreatedEvent(
 *   templateId,
 *   tenantId,
 *   TemplateType.EMAIL,
 *   'welcome-email',
 *   '欢迎邮件',
 *   templateContent,
 *   variables,
 *   'system',
 *   '系统邮件模板',
 *   { source: 'admin' },
 *   userId
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class TemplateCreatedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'TemplateCreated';

  constructor(
    public readonly templateId: TemplateId,
    public readonly tenantId: TenantId,
    public readonly templateType: TemplateType,
    public readonly name: string,
    public readonly displayName: string,
    public readonly content: TemplateContent,
    public readonly variables: TemplateVariable[],
    public readonly category: string,
    public readonly description: string,
    public readonly metadata: Record<string, unknown>,
    public readonly createdBy: UserId,
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
      content: {
        title: this.content.title,
        htmlContent: this.content.htmlContent,
        textContent: this.content.textContent,
        jsonContent: this.content.jsonContent,
        variables: this.content.variables.map(v => ({
          name: v.name,
          type: v.type,
          description: v.description,
          defaultValue: v.defaultValue,
          required: v.required,
        })),
      },
      variables: this.variables.map(v => ({
        name: v.name,
        type: v.type,
        description: v.description,
        defaultValue: v.defaultValue,
        required: v.required,
      })),
      category: this.category,
      description: this.description,
      metadata: this.metadata,
      createdBy: this.createdBy.value,
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
