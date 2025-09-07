import { IDomainEvent } from '@aiofix/core';
import { UserId } from '../value-objects';

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
 * @property {string} eventId 事件唯一标识符
 * @property {Date} occurredOn 事件发生时间
 * @property {string} eventType 事件类型标识
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
 * @since 1.0.0
 */
export class UserAssignedToTenantEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'UserAssignedToTenant';
  public readonly aggregateId: string;
  public readonly eventVersion: number = 1;

  constructor(
    public readonly userId: UserId,
    public readonly tenantId: string,
    public readonly assignedBy: string, // 分配操作的用户ID
    public readonly organizationId?: string,
    public readonly departmentId?: string,
    public readonly role?: string,
  ) {
    this.eventId = crypto.randomUUID();
    this.occurredOn = new Date();
    this.aggregateId = this.userId.value;
  }

  /**
   * 获取事件数据
   * 用于事件存储和序列化
   */
  public getEventData(): Record<string, unknown> {
    return {
      userId: this.userId.value,
      tenantId: this.tenantId,
      assignedBy: this.assignedBy,
      organizationId: this.organizationId,
      departmentId: this.departmentId,
      role: this.role,
    };
  }

  /**
   * 将事件转换为JSON格式
   * 用于事件序列化和存储
   */
  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn.toISOString(),
      ...this.getEventData(),
    };
  }
}
