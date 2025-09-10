import { DomainEvent } from '@aiofix/core';
import { RoleId } from '@aiofix/shared';
import { RoleStatus } from '../enums/role-status.enum';
import { TenantId } from '@aiofix/shared';

/**
 * @class RoleStatusChangedEvent
 * @description
 * 角色状态变更领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示角色状态已成功变更
 * 2. 包含状态变更时的关键信息
 * 3. 为其他聚合根提供角色状态变更通知
 *
 * 触发条件：
 * 1. 角色状态成功变更后自动触发
 * 2. 状态转换符合业务规则
 * 3. 角色状态允许变更
 * 4. 状态变更操作有效
 *
 * 影响范围：
 * 1. 通知权限管理模块更新角色状态
 * 2. 触发用户权限重新计算
 * 3. 更新角色统计信息
 * 4. 记录角色状态变更审计日志
 *
 * @property {RoleId} roleId 角色ID
 * @property {RoleStatus} previousStatus 之前的状态
 * @property {RoleStatus} newStatus 新的状态
 * @property {TenantId} tenantId 所属租户ID
 * @property {string} reason 状态变更原因
 * @property {string} changedBy 变更操作者
 * @property {Date} statusChangedAt 状态变更时间
 *
 * @example
 * ```typescript
 * const event = new RoleStatusChangedEvent(
 *   roleId,
 *   RoleStatus.INACTIVE,
 *   RoleStatus.ACTIVE,
 *   tenantId,
 *   '管理员激活角色',
 *   'admin-123'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class RoleStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly roleId: RoleId,
    public readonly previousStatus: RoleStatus,
    public readonly newStatus: RoleStatus,
    public readonly tenantId: TenantId,
    public readonly reason: string = '',
    public readonly changedBy: string = '',
    public readonly statusChangedAt: Date = new Date(),
  ) {
    super(roleId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'RoleStatusChanged';
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
      previousStatus: this.previousStatus,
      newStatus: this.newStatus,
      tenantId: this.tenantId.value,
      reason: this.reason,
      changedBy: this.changedBy,
      statusChangedAt: this.statusChangedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {RoleStatusChangedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): RoleStatusChangedEvent {
    return new RoleStatusChangedEvent(
      new RoleId(data.roleId as string),
      data.previousStatus as RoleStatus,
      data.newStatus as RoleStatus,
      new TenantId(data.tenantId as string),
      data.reason as string,
      data.changedBy as string,
      new Date(data.statusChangedAt as string),
    );
  }

  /**
   * @method isActivation
   * @description 检查是否为激活操作
   * @returns {boolean} 是否为激活操作
   */
  isActivation(): boolean {
    return this.newStatus === RoleStatus.ACTIVE;
  }

  /**
   * @method isDeactivation
   * @description 检查是否为停用操作
   * @returns {boolean} 是否为停用操作
   */
  isDeactivation(): boolean {
    return this.newStatus === RoleStatus.INACTIVE;
  }

  /**
   * @method isSuspension
   * @description 检查是否为暂停操作
   * @returns {boolean} 是否为暂停操作
   */
  isSuspension(): boolean {
    return this.newStatus === RoleStatus.SUSPENDED;
  }

  /**
   * @method isDeletion
   * @description 检查是否为删除操作
   * @returns {boolean} 是否为删除操作
   */
  isDeletion(): boolean {
    return this.newStatus === RoleStatus.DELETED;
  }

  /**
   * @method isExpiration
   * @description 检查是否为过期操作
   * @returns {boolean} 是否为过期操作
   */
  isExpiration(): boolean {
    return this.newStatus === RoleStatus.EXPIRED;
  }

  /**
   * @method isStatusIncrease
   * @description 检查是否为状态提升（从低权限到高权限）
   * @returns {boolean} 是否为状态提升
   */
  isStatusIncrease(): boolean {
    const statusLevels: Record<RoleStatus, number> = {
      [RoleStatus.DELETED]: 0,
      [RoleStatus.EXPIRED]: 1,
      [RoleStatus.PENDING]: 2,
      [RoleStatus.DISABLED]: 2,
      [RoleStatus.INACTIVE]: 3,
      [RoleStatus.SUSPENDED]: 4,
      [RoleStatus.ACTIVE]: 5,
    };
    return statusLevels[this.newStatus] > statusLevels[this.previousStatus];
  }

  /**
   * @method isStatusDecrease
   * @description 检查是否为状态降低（从高权限到低权限）
   * @returns {boolean} 是否为状态降低
   */
  isStatusDecrease(): boolean {
    const statusLevels: Record<RoleStatus, number> = {
      [RoleStatus.DELETED]: 0,
      [RoleStatus.EXPIRED]: 1,
      [RoleStatus.PENDING]: 2,
      [RoleStatus.DISABLED]: 2,
      [RoleStatus.INACTIVE]: 3,
      [RoleStatus.SUSPENDED]: 4,
      [RoleStatus.ACTIVE]: 5,
    };
    return statusLevels[this.newStatus] < statusLevels[this.previousStatus];
  }

  /**
   * @method getStatusChangeDescription
   * @description 获取状态变更描述
   * @returns {string} 状态变更描述
   */
  getStatusChangeDescription(): string {
    const statusNames: Record<RoleStatus, string> = {
      [RoleStatus.PENDING]: '待激活',
      [RoleStatus.ACTIVE]: '激活',
      [RoleStatus.INACTIVE]: '停用',
      [RoleStatus.DISABLED]: '禁用',
      [RoleStatus.SUSPENDED]: '暂停',
      [RoleStatus.DELETED]: '删除',
      [RoleStatus.EXPIRED]: '过期',
    };

    const previousName = statusNames[this.previousStatus] || '未知';
    const newName = statusNames[this.newStatus] || '未知';

    return `从${previousName}变更为${newName}`;
  }

  /**
   * @method hasReason
   * @description 检查是否有变更原因
   * @returns {boolean} 是否有变更原因
   */
  hasReason(): boolean {
    return this.reason.trim().length > 0;
  }

  /**
   * @method hasChangedBy
   * @description 检查是否有变更操作者
   * @returns {boolean} 是否有变更操作者
   */
  hasChangedBy(): boolean {
    return this.changedBy.trim().length > 0;
  }
}
