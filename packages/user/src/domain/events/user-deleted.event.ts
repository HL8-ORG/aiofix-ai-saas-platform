import { DomainEvent } from '@aiofix/core';
import { UserId } from '@aiofix/shared';

/**
 * @class UserDeletedEvent
 * @description
 * 用户删除领域事件，表示用户已成功删除。
 *
 * 事件职责：
 * 1. 记录用户删除操作
 * 2. 提供删除原因和类型信息
 * 3. 支持事件溯源和审计
 * 4. 触发相关的清理流程
 *
 * 事件触发条件：
 * 1. 用户软删除成功
 * 2. 用户硬删除成功
 * 3. 用户账户注销成功
 * 4. 管理员删除用户成功
 *
 * 影响范围：
 * 1. 清理用户相关数据
 * 2. 发送删除通知
 * 3. 记录审计日志
 * 4. 更新用户统计信息
 * 5. 处理用户关联数据
 *
 * @property {UserId} userId 用户ID
 * @property {string} tenantId 租户ID
 * @property {string} [reason] 删除原因
 * @property {boolean} hardDelete 是否硬删除
 * @property {string} deletedBy 删除者ID
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new UserDeletedEvent(
 *   new UserId('user-123'),
 *   'tenant-456',
 *   'Account deactivated by user request',
 *   false,
 *   'admin-789'
 * );
 * ```
 * @since 1.0.0
 */
export class UserDeletedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly tenantId: string,
    public readonly reason: string | undefined,
    public readonly hardDelete: boolean,
    public readonly deletedBy: string,
    occurredOn: Date = new Date(),
  ) {
    super(userId.value, 1, { timestamp: occurredOn });
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'UserDeleted';
  }

  /**
   * @method getEventVersion
   * @description 获取事件版本
   * @returns {number} 事件版本
   */
  getEventVersion(): number {
    return 1;
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式，用于序列化和存储
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      eventVersion: this.eventVersion,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn,
      userId: this.userId.value,
      tenantId: this.tenantId,
      reason: this.reason,
      hardDelete: this.hardDelete,
      deletedBy: this.deletedBy,
    };
  }
}
