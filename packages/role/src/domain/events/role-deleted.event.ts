import { DomainEvent } from '@aiofix/core';
import { RoleId } from '../value-objects/role-id.vo';
import { RoleStatus } from '../enums/role-status.enum';
import { TenantId } from '@aiofix/shared';

/**
 * @class RoleDeletedEvent
 * @description
 * 角色删除领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示角色已成功删除（软删除）
 * 2. 包含角色删除时的关键信息
 * 3. 为其他聚合根提供角色删除通知
 *
 * 触发条件：
 * 1. 角色成功删除后自动触发
 * 2. 角色状态允许删除
 * 3. 角色不是系统角色
 * 4. 删除操作有效
 *
 * 影响范围：
 * 1. 通知权限管理模块移除角色权限
 * 2. 触发用户角色重新分配
 * 3. 更新角色统计信息
 * 4. 记录角色删除审计日志
 *
 * @property {RoleId} roleId 删除的角色ID
 * @property {RoleStatus} status 删除时的角色状态
 * @property {TenantId} tenantId 所属租户ID
 * @property {string} reason 删除原因
 * @property {string} deletedBy 删除操作者
 * @property {Date} deletedAt 角色删除时间
 *
 * @example
 * ```typescript
 * const event = new RoleDeletedEvent(
 *   roleId,
 *   RoleStatus.ACTIVE,
 *   tenantId,
 *   '角色不再需要',
 *   'admin-123'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class RoleDeletedEvent extends DomainEvent {
  constructor(
    public readonly roleId: RoleId,
    public readonly status: RoleStatus,
    public readonly tenantId: TenantId,
    public readonly reason: string = '',
    public readonly deletedBy: string = '',
    public readonly deletedAt: Date = new Date(),
  ) {
    super(roleId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'RoleDeleted';
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
      roleId: this.roleId.value,
      status: this.status,
      tenantId: this.tenantId.value,
      reason: this.reason,
      deletedBy: this.deletedBy,
      deletedAt: this.deletedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {RoleDeletedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): RoleDeletedEvent {
    return new RoleDeletedEvent(
      new RoleId(data.roleId as string),
      data.status as RoleStatus,
      new TenantId(data.tenantId as string),
      data.reason as string,
      data.deletedBy as string,
      new Date(data.deletedAt as string),
    );
  }

  /**
   * @method getStatusDisplayName
   * @description 获取删除时状态的显示名称
   * @returns {string} 状态显示名称
   */
  getStatusDisplayName(): string {
    const statusNames: Record<RoleStatus, string> = {
      [RoleStatus.ACTIVE]: '激活',
      [RoleStatus.INACTIVE]: '非激活',
      [RoleStatus.SUSPENDED]: '暂停',
      [RoleStatus.DELETED]: '已删除',
      [RoleStatus.EXPIRED]: '已过期',
    };
    return statusNames[this.status] || '未知';
  }

  /**
   * @method hasReason
   * @description 检查是否有删除原因
   * @returns {boolean} 是否有删除原因
   */
  hasReason(): boolean {
    return this.reason.trim().length > 0;
  }

  /**
   * @method hasDeletedBy
   * @description 检查是否有删除操作者
   * @returns {boolean} 是否有删除操作者
   */
  hasDeletedBy(): boolean {
    return this.deletedBy.trim().length > 0;
  }

  /**
   * @method wasActiveWhenDeleted
   * @description 检查删除时角色是否为激活状态
   * @returns {boolean} 删除时是否为激活状态
   */
  wasActiveWhenDeleted(): boolean {
    return this.status === RoleStatus.ACTIVE;
  }

  /**
   * @method wasSuspendedWhenDeleted
   * @description 检查删除时角色是否为暂停状态
   * @returns {boolean} 删除时是否为暂停状态
   */
  wasSuspendedWhenDeleted(): boolean {
    return this.status === RoleStatus.SUSPENDED;
  }

  /**
   * @method wasInactiveWhenDeleted
   * @description 检查删除时角色是否为非激活状态
   * @returns {boolean} 删除时是否为非激活状态
   */
  wasInactiveWhenDeleted(): boolean {
    return this.status === RoleStatus.INACTIVE;
  }

  /**
   * @method wasExpiredWhenDeleted
   * @description 检查删除时角色是否为过期状态
   * @returns {boolean} 删除时是否为过期状态
   */
  wasExpiredWhenDeleted(): boolean {
    return this.status === RoleStatus.EXPIRED;
  }

  /**
   * @method getDeletionDescription
   * @description 获取删除描述
   * @returns {string} 删除描述
   */
  getDeletionDescription(): string {
    const statusName = this.getStatusDisplayName();
    const reasonText = this.hasReason() ? `，原因：${this.reason}` : '';
    const deletedByText = this.hasDeletedBy() ? `，操作者：${this.deletedBy}` : '';
    
    return `角色在${statusName}状态下被删除${reasonText}${deletedByText}`;
  }
}
