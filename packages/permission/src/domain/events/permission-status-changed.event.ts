import { DomainEvent } from '@aiofix/core';
import { PermissionId } from '../value-objects/permission-id.vo';
import { PermissionStatus } from '../enums';

/**
 * @class PermissionStatusChangedEvent
 * @description
 * 权限状态变更领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示权限状态已成功变更
 * 2. 包含权限状态变更时的关键信息
 * 3. 为其他聚合根提供权限状态变更通知
 *
 * 触发条件：
 * 1. 权限状态成功变更后自动触发
 * 2. 状态转换验证通过
 * 3. 业务规则验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块更新权限状态
 * 2. 触发权限缓存更新
 * 3. 更新权限统计信息
 * 4. 记录权限状态变更审计日志
 *
 * @property {PermissionId} permissionId 权限ID
 * @property {PermissionStatus} oldStatus 旧的状态
 * @property {PermissionStatus} newStatus 新的状态
 * @property {string} changedBy 变更者ID
 *
 * @example
 * ```typescript
 * const event = new PermissionStatusChangedEvent(
 *   permissionId,
 *   PermissionStatus.ACTIVE,
 *   PermissionStatus.SUSPENDED,
 *   'admin-456'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class PermissionStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly permissionId: PermissionId,
    public readonly oldStatus: PermissionStatus,
    public readonly newStatus: PermissionStatus,
    public readonly changedBy: string,
  ) {
    super(permissionId.toString(), 1);
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
      permissionId: this.permissionId.toString(),
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      changedBy: this.changedBy,
    };
  }
}
