import { DomainEvent } from '@aiofix/core';

/**
 * @class TenantDeletedEvent
 * @description
 * 租户删除领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示租户已成功删除
 * 2. 包含租户删除的关键信息
 * 3. 为其他聚合根提供租户删除通知
 *
 * 触发条件：
 * 1. 租户删除申请审批通过
 * 2. 租户数据备份完成
 * 3. 租户用户清理完成
 * 4. 租户资源释放完成
 *
 * 影响范围：
 * 1. 通知权限管理模块删除租户权限
 * 2. 清理租户相关缓存
 * 3. 记录租户删除审计日志
 * 4. 更新系统容量统计
 * 5. 通知相关用户租户删除
 * 6. 触发租户数据归档流程
 * 7. 释放租户占用的系统资源
 *
 * @property {string} tenantId 租户ID
 * @property {string} tenantName 租户名称
 * @property {string} deletedBy 删除者用户ID
 * @property {Date} deletedAt 删除时间
 * @property {string} reason 删除原因
 * @property {boolean} dataBackedUp 数据是否已备份
 *
 * @example
 * ```typescript
 * const event = new TenantDeletedEvent(
 *   'tenant-123',
 *   'Acme Corporation',
 *   'admin-789',
 *   '租户申请注销',
 *   true
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class TenantDeletedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: string,
    public readonly tenantName: string,
    public readonly deletedBy: string,
    public readonly reason: string,
    public readonly dataBackedUp: boolean,
    public readonly deletedAt: Date = new Date(),
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
      deletedBy: this.deletedBy,
      reason: this.reason,
      dataBackedUp: this.dataBackedUp,
      deletedAt: this.deletedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {TenantDeletedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): TenantDeletedEvent {
    return new TenantDeletedEvent(
      data.tenantId as string,
      data.tenantName as string,
      data.deletedBy as string,
      data.reason as string,
      data.dataBackedUp as boolean,
      new Date(data.deletedAt as string),
    );
  }
}
