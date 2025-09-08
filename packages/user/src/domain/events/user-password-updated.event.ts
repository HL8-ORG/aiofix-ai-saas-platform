import { DomainEvent } from '@aiofix/core';
import { UserId } from '@aiofix/shared';

/**
 * @class UserPasswordUpdatedEvent
 * @description
 * 用户密码更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示用户密码已成功更新
 * 2. 包含密码更新时的关键信息
 * 3. 为其他聚合根提供密码更新通知
 *
 * 触发条件：
 * 1. 用户密码成功更新后自动触发
 * 2. 密码强度验证通过
 * 3. 用户状态允许密码更新
 *
 * 影响范围：
 * 1. 通知安全模块记录密码变更
 * 2. 触发密码变更通知流程
 * 3. 更新用户安全统计信息
 * 4. 记录密码更新审计日志
 *
 * @property {UserId} userId 用户ID
 * @property {string} updatedBy 更新者ID
 * @property {string} [reason] 密码更新原因，可选
 * @property {boolean} [forceLogout] 是否强制登出，可选
 *
 * @example
 * ```typescript
 * const event = new UserPasswordUpdatedEvent(
 *   new UserId('user-123'),
 *   'user-456',
 *   '定期密码更新',
 *   true
 * );
 * eventBus.publish(event);
 * ```
 * @extends DomainEvent
 * @since 1.0.0
 */
export class UserPasswordUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly updatedBy: string,
    public readonly reason?: string,
    public readonly forceLogout?: boolean,
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
      updatedBy: this.updatedBy,
      reason: this.reason,
      forceLogout: this.forceLogout,
    };
  }
}
