import { DomainEvent } from '@aiofix/core';
import { PermissionId } from '@aiofix/shared';

/**
 * @class PermissionDeletedEvent
 * @description
 * 权限删除领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示权限已成功删除（软删除）
 * 2. 包含权限删除时的关键信息
 * 3. 为其他聚合根提供权限删除通知
 *
 * 触发条件：
 * 1. 权限成功删除后自动触发
 * 2. 删除操作验证通过
 * 3. 业务规则验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块删除权限记录
 * 2. 触发权限缓存更新
 * 3. 更新权限统计信息
 * 4. 记录权限删除审计日志
 *
 * @property {PermissionId} permissionId 删除的权限ID
 * @property {string} deletedBy 删除者ID
 *
 * @example
 * ```typescript
 * const event = new PermissionDeletedEvent(
 *   permissionId,
 *   'admin-456'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class PermissionDeletedEvent extends DomainEvent {
  constructor(
    public readonly permissionId: PermissionId,
    public readonly deletedBy: string,
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
      deletedBy: this.deletedBy,
    };
  }
}
