import { DomainEvent } from '@aiofix/core';
import { PermissionId } from '@aiofix/shared';

/**
 * @class PermissionRestoredEvent
 * @description
 * 权限恢复领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示权限已成功恢复（从软删除状态恢复）
 * 2. 包含权限恢复时的关键信息
 * 3. 为其他聚合根提供权限恢复通知
 *
 * 触发条件：
 * 1. 权限成功恢复后自动触发
 * 2. 恢复操作验证通过
 * 3. 业务规则验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块恢复权限记录
 * 2. 触发权限缓存更新
 * 3. 更新权限统计信息
 * 4. 记录权限恢复审计日志
 *
 * @property {PermissionId} permissionId 恢复的权限ID
 * @property {string} restoredBy 恢复者ID
 *
 * @example
 * ```typescript
 * const event = new PermissionRestoredEvent(
 *   permissionId,
 *   'admin-456'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class PermissionRestoredEvent extends DomainEvent {
  constructor(
    public readonly permissionId: PermissionId,
    public readonly restoredBy: string,
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
      restoredBy: this.restoredBy,
    };
  }
}
