import { DomainEvent } from '@aiofix/core';
import { UserId } from '@aiofix/shared';

/**
 * @class UserAssignedToTenantEvent
 * @description
 * 用户分配到租户领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示平台用户已成功分配到特定租户
 * 2. 包含用户分配时的关键信息
 * 3. 为其他聚合根提供用户分配通知
 *
 * 触发条件：
 * 1. 平台用户成功分配到租户后自动触发
 * 2. 用户邮箱验证通过
 * 3. 租户关联建立成功
 *
 * 影响范围：
 * 1. 通知权限管理模块创建用户权限
 * 2. 触发欢迎邮件发送流程
 * 3. 更新用户统计信息
 * 4. 记录用户分配审计日志
 *
 * @property {UserId} userId 被分配的用户ID
 * @property {string} tenantId 目标租户ID
 * @property {string} assignedBy 分配操作的用户ID
 * @property {string} [organizationId] 所属组织ID，可选
 * @property {string} [departmentId] 所属部门ID，可选
 * @property {string} [role] 用户角色，可选
 *
 * @example
 * ```typescript
 * const event = new UserAssignedToTenantEvent(
 *   new UserId('user-123'),
 *   'tenant-456',
 *   'admin-789',
 *   'org-101',
 *   'dept-202',
 *   'USER'
 * );
 * eventBus.publish(event);
 * ```
 * @extends DomainEvent
 * @since 1.0.0
 */
export class UserAssignedToTenantEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly tenantId: string,
    public readonly assignedBy: string, // 分配操作的用户ID
    public readonly organizationId?: string,
    public readonly departmentId?: string,
    public readonly role?: string,
  ) {
    super(userId.toString());
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式，用于事件序列化和存储
   * @returns {Record<string, unknown>} 事件的JSON表示
   * @since 1.0.0
   */
  public toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      userId: this.userId.toString(),
      tenantId: this.tenantId,
      assignedBy: this.assignedBy,
      organizationId: this.organizationId,
      departmentId: this.departmentId,
      role: this.role,
    };
  }
}
