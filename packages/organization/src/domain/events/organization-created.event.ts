import { DomainEvent } from '@aiofix/core';
import { OrganizationId } from '@aiofix/shared';
import { OrganizationName, OrganizationDescription } from '@aiofix/shared';
import {
  OrganizationSettings,
  OrganizationSettingsData,
} from '../value-objects/organization-settings.vo';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { TenantId } from '@aiofix/shared';

/**
 * @class OrganizationCreatedEvent
 * @description
 * 组织创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示组织聚合根已成功创建
 * 2. 包含组织创建时的关键信息
 * 3. 为其他聚合根提供组织创建通知
 *
 * 触发条件：
 * 1. 组织聚合根成功创建后自动触发
 * 2. 组织名称验证通过
 * 3. 租户关联建立成功
 * 4. 组织设置配置完成
 *
 * 影响范围：
 * 1. 通知权限管理模块创建组织权限
 * 2. 触发组织初始化流程
 * 3. 更新组织统计信息
 * 4. 记录组织创建审计日志
 * 5. 通知相关用户组织创建成功
 *
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {Date} occurredOn 事件发生时间
 * @property {number} eventVersion 事件版本号
 * @property {OrganizationId} organizationId 创建的组织ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationName} name 组织名称
 * @property {OrganizationDescription} description 组织描述
 * @property {OrganizationSettings} settings 组织设置
 * @property {OrganizationStatus} status 组织状态
 * @property {Date} createdAt 组织创建时间
 *
 * @example
 * ```typescript
 * const event = new OrganizationCreatedEvent(
 *   'org-123',
 *   'tenant-456',
 *   'AI开发团队',
 *   '专注于AI技术研发',
 *   settings
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class OrganizationCreatedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly tenantId: TenantId,
    public readonly name: OrganizationName,
    public readonly description: OrganizationDescription,
    public readonly settings: OrganizationSettings,
    public readonly status: OrganizationStatus = OrganizationStatus.INACTIVE,
    public readonly createdAt: Date = new Date(),
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
      status: this.status,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {OrganizationCreatedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): OrganizationCreatedEvent {
    return new OrganizationCreatedEvent(
      new OrganizationId(data.organizationId as string),
      new TenantId(data.tenantId as string),
      new OrganizationName(data.name as string),
      new OrganizationDescription(data.description as string),
      new OrganizationSettings(data.settings as OrganizationSettingsData),
      data.status as OrganizationStatus,
      new Date(data.createdAt as string),
    );
  }

  /**
   * @method getDisplayName
   * @description 获取事件显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return `组织创建: ${this.name.value}`;
  }

  /**
   * @method getDescription
   * @description 获取事件描述
   * @returns {string} 事件描述
   */
  getDescription(): string {
    return `组织 "${this.name.value}" 已成功创建，状态为 ${this.status}`;
  }

  /**
   * @method getImpactScope
   * @description 获取事件影响范围
   * @returns {string[]} 影响范围列表
   */
  getImpactScope(): string[] {
    return [
      '权限管理模块',
      '组织统计服务',
      '审计日志服务',
      '用户通知服务',
      '组织初始化服务',
    ];
  }
}
