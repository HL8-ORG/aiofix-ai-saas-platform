import { DomainEvent } from '@aiofix/core';
import { TenantId } from '@aiofix/shared';
import { TenantQuota } from '../value-objects/tenant-quota.vo';
import { TenantConfiguration } from '../value-objects/tenant-configuration.vo';

/**
 * @class TenantCreatedEvent
 * @description
 * 租户创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示租户聚合根已成功创建
 * 2. 包含租户创建时的关键信息
 * 3. 为其他聚合根提供租户创建通知
 *
 * 触发条件：
 * 1. 租户聚合根成功创建后自动触发
 * 2. 租户数据验证通过
 * 3. 租户设置、配额、配置建立成功
 *
 * 影响范围：
 * 1. 通知权限管理模块创建租户权限
 * 2. 触发租户初始化流程
 * 3. 更新租户统计信息
 * 4. 记录租户创建审计日志
 *
 * @property {TenantId} tenantId 创建的租户ID
 * @property {string} name 租户名称
 * @property {string} type 租户类型
 * @property {TenantQuota} quota 租户配额
 * @property {TenantConfiguration} configuration 租户配置
 * @property {string} createdBy 创建者ID
 * @property {string} eventId 事件唯一标识符
 * @property {Date} occurredOn 事件发生时间
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {number} eventVersion 事件版本号
 *
 * @example
 * ```typescript
 * const event = new TenantCreatedEvent(
 *   new TenantId('tenant-123'),
 *   'Acme Corp',
 *   'ENTERPRISE',
 *   tenantQuota,
 *   tenantConfiguration,
 *   'admin-456'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class TenantCreatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly name: string,
    public readonly type: string,
    public readonly quota: TenantQuota,
    public readonly configuration: TenantConfiguration,
    public readonly createdBy: string,
  ) {
    super(tenantId.toString(), 1);
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn,
      tenantId: this.tenantId.toString(),
      name: this.name,
      type: this.type,
      quota: this.quota,
      configuration: this.configuration,
      createdBy: this.createdBy,
    };
  }
}
