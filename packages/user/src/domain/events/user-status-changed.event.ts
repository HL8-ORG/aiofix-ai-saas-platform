import { DomainEvent } from '@aiofix/core';
import { UserId } from '@aiofix/shared';
import { UserStatus } from '../value-objects';

/**
 * @class UserStatusChangedEvent
 * @description
 * 用户状态变更领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示用户状态已成功变更
 * 2. 包含状态变更时的关键信息
 * 3. 为其他聚合根提供状态变更通知
 *
 * 触发条件：
 * 1. 用户状态成功变更后自动触发
 * 2. 状态变更符合状态机规则
 * 3. 状态变更验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块更新用户权限
 * 2. 触发状态变更通知流程
 * 3. 更新用户统计信息
 * 4. 记录状态变更审计日志
 *
 * @property {UserId} userId 用户ID
 * @property {UserStatus} oldStatus 变更前的状态
 * @property {UserStatus} newStatus 变更后的状态
 * @property {string} changedBy 变更者ID
 * @property {string} [reason] 状态变更原因，可选
 *
 * @example
 * ```typescript
 * const event = new UserStatusChangedEvent(
 *   new UserId('user-123'),
 *   UserStatus.PENDING,
 *   UserStatus.ACTIVE,
 *   'admin-456',
 *   '用户激活'
 * );
 * eventBus.publish(event);
 * ```
 * @extends DomainEvent
 * @since 1.0.0
 */
export class UserStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly oldStatus: UserStatus,
    public readonly newStatus: UserStatus,
    public readonly changedBy: string,
    public readonly reason?: string,
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
      oldStatus: this.oldStatus.toString(),
      newStatus: this.newStatus.toString(),
      changedBy: this.changedBy,
      reason: this.reason,
    };
  }
}
