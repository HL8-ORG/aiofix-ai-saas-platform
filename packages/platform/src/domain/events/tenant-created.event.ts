import { DomainEvent } from '@aiofix/core';
import { TenantId } from '@aiofix/shared';
import { TenantQuota } from '../value-objects/tenant-quota.vo';

/**
 * @class TenantCreatedEvent
 * @description
 * 租户创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示租户已成功创建
 * 2. 包含租户创建的关键信息
 * 3. 为其他聚合根提供租户创建通知
 *
 * 触发条件：
 * 1. 租户创建申请审批通过
 * 2. 租户基本信息验证通过
 * 3. 租户配额分配成功
 * 4. 租户管理员设置完成
 *
 * 影响范围：
 * 1. 通知权限管理模块创建租户权限
 * 2. 触发租户配置初始化流程
 * 3. 记录租户创建审计日志
 * 4. 更新系统容量统计
 * 5. 发送租户创建成功通知
 * 6. 初始化租户数据存储
 *
 * @property {string} tenantId 租户ID
 * @property {string} tenantName 租户名称
 * @property {string} tenantType 租户类型
 * @property {TenantQuota} quota 租户配额
 * @property {string} adminUserId 租户管理员用户ID
 * @property {string} createdBy 创建者用户ID
 * @property {Date} createdAt 创建时间
 *
 * @example
 * ```typescript
 * const event = new TenantCreatedEvent(
 *   'tenant-123',
 *   'Acme Corporation',
 *   'ENTERPRISE',
 *   tenantQuota,
 *   'user-456',
 *   'admin-789'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class TenantCreatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly tenantName: string,
    public readonly tenantType: string,
    public readonly quota: TenantQuota,
    public readonly adminUserId: string,
    public readonly createdBy: string,
    public readonly createdAt: Date = new Date(),
  ) {
    super(tenantId);
  }

  /**
   * 将事件转换为JSON格式
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      tenantId: this.tenantId,
      tenantName: this.tenantName,
      tenantType: this.tenantType,
      quota: this.quota.value,
      adminUserId: this.adminUserId,
      createdBy: this.createdBy,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {TenantCreatedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): TenantCreatedEvent {
    return new TenantCreatedEvent(
      data.tenantId as string,
      data.tenantName as string,
      data.tenantType as string,
      new TenantQuota(data.quota as any),
      data.adminUserId as string,
      data.createdBy as string,
      new Date(data.createdAt as string),
    );
  }
}
