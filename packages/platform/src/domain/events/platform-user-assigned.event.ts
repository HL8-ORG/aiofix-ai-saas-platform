import { DomainEvent } from '@aiofix/core';

/**
 * @class PlatformUserAssignedEvent
 * @description
 * 平台用户分配领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示平台用户已成功分配到租户
 * 2. 包含用户分配的关键信息
 * 3. 为其他聚合根提供用户分配通知
 *
 * 触发条件：
 * 1. 平台用户分配到租户申请审批通过
 * 2. 用户资格验证通过
 * 3. 租户容量检查通过
 * 4. 用户角色分配完成
 *
 * 影响范围：
 * 1. 通知权限管理模块创建用户租户权限
 * 2. 更新用户状态和归属信息
 * 3. 记录用户分配审计日志
 * 4. 更新租户用户统计
 * 5. 发送用户分配成功通知
 * 6. 初始化用户租户相关数据
 * 7. 触发用户权限同步流程
 *
 * @property {string} userId 用户ID
 * @property {string} tenantId 租户ID
 * @property {string} assignedBy 分配者用户ID
 * @property {Date} assignedAt 分配时间
 * @property {string} role 分配的角色
 * @property {string} reason 分配原因
 *
 * @example
 * ```typescript
 * const event = new PlatformUserAssignedEvent(
 *   'user-123',
 *   'tenant-456',
 *   'admin-789',
 *   'TENANT_ADMIN',
 *   '新员工入职'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class PlatformUserAssignedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly assignedBy: string,
    public readonly role: string,
    public readonly reason: string,
    public readonly assignedAt: Date = new Date(),
  ) {
    super(userId);
  }

  /**
   * 将事件转换为JSON格式
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      userId: this.userId,
      tenantId: this.tenantId,
      assignedBy: this.assignedBy,
      role: this.role,
      reason: this.reason,
      assignedAt: this.assignedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {PlatformUserAssignedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): PlatformUserAssignedEvent {
    return new PlatformUserAssignedEvent(
      data.userId as string,
      data.tenantId as string,
      data.assignedBy as string,
      data.role as string,
      data.reason as string,
      new Date(data.assignedAt as string),
    );
  }
}
