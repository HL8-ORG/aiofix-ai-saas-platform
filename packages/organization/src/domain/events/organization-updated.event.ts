import { DomainEvent } from '@aiofix/core';
import { OrganizationId } from '../value-objects/organization-id.vo';
import { OrganizationName, OrganizationDescription } from '@aiofix/shared';
import { OrganizationSettings } from '../value-objects/organization-settings.vo';
import { TenantId } from '@aiofix/shared';

/**
 * @class OrganizationUpdatedEvent
 * @description
 * 组织更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示组织信息已成功更新
 * 2. 包含组织更新的关键信息
 * 3. 为其他聚合根提供组织更新通知
 *
 * 触发条件：
 * 1. 组织信息成功更新后自动触发
 * 2. 组织名称、描述或设置发生变更
 * 3. 组织状态允许更新操作
 * 4. 更新数据验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块更新组织权限
 * 2. 更新组织缓存信息
 * 3. 记录组织更新审计日志
 * 4. 通知相关用户组织信息变更
 * 5. 更新组织统计信息
 *
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {Date} occurredOn 事件发生时间
 * @property {number} eventVersion 事件版本号
 * @property {OrganizationId} organizationId 更新的组织ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationName} name 新组织名称
 * @property {OrganizationDescription} description 新组织描述
 * @property {OrganizationSettings} settings 新组织设置
 * @property {Date} updatedAt 组织更新时间
 *
 * @example
 * ```typescript
 * const event = new OrganizationUpdatedEvent(
 *   'org-123',
 *   'tenant-456',
 *   'AI开发团队',
 *   '专注于AI技术研发和产品创新',
 *   newSettings
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class OrganizationUpdatedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly tenantId: TenantId,
    public readonly name: OrganizationName,
    public readonly description: OrganizationDescription,
    public readonly settings: OrganizationSettings,
    public readonly updatedAt: Date = new Date(),
  ) {
    super(organizationId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return this.eventType;
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  getAggregateId(): string {
    return this.aggregateId;
  }

  /**
   * @method getOccurredOn
   * @description 获取事件发生时间
   * @returns {Date} 事件发生时间
   */
  getOccurredOn(): Date {
    return this.occurredOn;
  }

  /**
   * @method getEventVersion
   * @description 获取事件版本号
   * @returns {number} 事件版本号
   */
  getEventVersion(): number {
    return this.eventVersion;
  }

  /**
   * @method getEventId
   * @description 获取事件唯一标识
   * @returns {string} 事件ID
   */
  getEventId(): string {
    return `${this.eventType}-${this.aggregateId}-${this.occurredOn.getTime()}`;
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {Record<string, unknown>} JSON格式的事件数据
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      organizationId: this.organizationId.value,
      tenantId: this.tenantId.value,
      name: this.name.value,
      description: this.description.value,
      settings: this.settings.value,
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {OrganizationUpdatedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): OrganizationUpdatedEvent {
    return new OrganizationUpdatedEvent(
      new OrganizationId(data.organizationId as string),
      new TenantId(data.tenantId as string),
      new OrganizationName(data.name as string),
      new OrganizationDescription(data.description as string),
      new OrganizationSettings(data.settings as any),
      new Date(data.updatedAt as string),
    );
  }

  /**
   * @method getDisplayName
   * @description 获取事件显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return `组织更新: ${this.name.value}`;
  }

  /**
   * @method getDescription
   * @description 获取事件描述
   * @returns {string} 事件描述
   */
  getDescription(): string {
    return `组织 "${this.name.value}" 信息已更新`;
  }

  /**
   * @method getImpactScope
   * @description 获取事件影响范围
   * @returns {string[]} 影响范围列表
   */
  getImpactScope(): string[] {
    return [
      '权限管理模块',
      '组织缓存服务',
      '审计日志服务',
      '用户通知服务',
      '组织统计服务',
    ];
  }

  /**
   * @method getChangedFields
   * @description 获取变更的字段信息
   * @returns {string[]} 变更字段列表
   */
  getChangedFields(): string[] {
    // 这里可以根据实际需要返回具体变更的字段
    return ['name', 'description', 'settings'];
  }
}
