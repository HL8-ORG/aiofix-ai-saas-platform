import { IDomainEvent } from '@aiofix/core/src/domain/base/domain-event';
import { TemplateId } from '../value-objects/template-id.vo';
import { TemplateType } from '../value-objects/template-type.vo';
import { TenantId } from '@aiofix/core/src/domain/value-objects/tenant-id.vo';
import { UserId } from '@aiofix/core/src/domain/value-objects/user-id.vo';

/**
 * @class TemplateDeletedEvent
 * @description
 * 模板删除领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示通知模板已成功删除
 * 2. 包含模板删除时的关键信息
 * 3. 为其他聚合根提供模板删除通知
 *
 * 触发条件：
 * 1. 模板状态转换为DELETED时触发
 * 2. 模板删除权限验证通过
 * 3. 确认模板未被正在使用
 * 4. 只有草稿或归档状态的模板才能删除
 *
 * 影响范围：
 * 1. 通知模板管理服务更新模板状态
 * 2. 触发模板索引更新
 * 3. 更新模板可用性状态
 * 4. 记录模板删除审计日志
 * 5. 可能触发模板使用统计更新
 * 6. 清理相关的缓存和索引
 *
 * @property {TemplateId} templateId 模板ID
 * @property {TenantId} tenantId 租户ID
 * @property {TemplateType} templateType 模板类型
 * @property {string} name 模板名称
 * @property {string} displayName 模板显示名称
 * @property {number} version 删除版本号
 * @property {UserId} deletedBy 删除者用户ID
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new TemplateDeletedEvent(
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
export class TemplateDeletedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'TemplateDeleted';

  constructor(
    public readonly templateId: TemplateId,
    public readonly tenantId: TenantId,
    public readonly templateType: TemplateType,
    public readonly name: string,
    public readonly displayName: string,
    public readonly version: number,
    public readonly deletedBy: UserId,
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
      version: this.version,
      deletedBy: this.deletedBy.value,
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
