import { DomainEvent } from '@aiofix/core';
import { TenantQuota } from '../value-objects/tenant-quota.vo';

/**
 * @class TenantUpdatedEvent
 * @description
 * 租户更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示租户信息已成功更新
 * 2. 包含租户更新的关键信息
 * 3. 为其他聚合根提供租户更新通知
 *
 * 触发条件：
 * 1. 租户基本信息更新完成
 * 2. 租户配额调整完成
 * 3. 租户配置变更完成
 * 4. 租户状态变更完成
 *
 * 影响范围：
 * 1. 通知权限管理模块更新租户权限
 * 2. 更新租户相关缓存
 * 3. 记录租户更新审计日志
 * 4. 更新系统容量统计
 * 5. 通知相关用户租户信息变更
 * 6. 触发租户配置同步流程
 *
 * @property {string} tenantId 租户ID
 * @property {string} tenantName 租户名称
 * @property {TenantQuota} quota 租户配额
 * @property {string} updatedBy 更新者用户ID
 * @property {Date} updatedAt 更新时间
 * @property {string[]} changedFields 变更字段列表
 *
 * @example
 * ```typescript
 * const event = new TenantUpdatedEvent(
 *   'tenant-123',
 *   'Acme Corporation Updated',
 *   updatedQuota,
 *   'admin-789',
 *   ['tenantName', 'quota']
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class TenantUpdatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly tenantName: string,
    public readonly quota: TenantQuota,
    public readonly updatedBy: string,
    public readonly changedFields: string[],
    public readonly updatedAt: Date = new Date(),
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
      quota: this.quota.value,
      updatedBy: this.updatedBy,
      changedFields: this.changedFields,
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {TenantUpdatedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): TenantUpdatedEvent {
    return new TenantUpdatedEvent(
      data.tenantId as string,
      data.tenantName as string,
      new TenantQuota(data.quota as any),
      data.updatedBy as string,
      data.changedFields as string[],
      new Date(data.updatedAt as string),
    );
  }
}
