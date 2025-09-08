import { DomainEvent } from '@aiofix/core';
import { UserId } from '@aiofix/shared';
import { UserProfile } from '../value-objects';

/**
 * @class UserProfileUpdatedEvent
 * @description
 * 用户档案更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示用户档案信息已成功更新
 * 2. 包含档案更新时的关键信息
 * 3. 为其他聚合根提供档案更新通知
 *
 * 触发条件：
 * 1. 用户档案信息成功更新后自动触发
 * 2. 档案信息验证通过
 * 3. 用户状态允许档案更新
 *
 * 影响范围：
 * 1. 通知相关模块更新用户显示信息
 * 2. 触发档案变更通知流程
 * 3. 更新用户统计信息
 * 4. 记录档案更新审计日志
 *
 * @property {UserId} userId 用户ID
 * @property {UserProfile} oldProfile 更新前的档案信息
 * @property {UserProfile} newProfile 更新后的档案信息
 * @property {string} updatedBy 更新者ID
 *
 * @example
 * ```typescript
 * const event = new UserProfileUpdatedEvent(
 *   new UserId('user-123'),
 *   oldProfile,
 *   newProfile,
 *   'user-456'
 * );
 * eventBus.publish(event);
 * ```
 * @extends DomainEvent
 * @since 1.0.0
 */
export class UserProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly oldProfile: UserProfile,
    public readonly newProfile: UserProfile,
    public readonly updatedBy: string,
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
      oldProfile: this.oldProfile.toJSON(),
      newProfile: this.newProfile.toJSON(),
      updatedBy: this.updatedBy,
    };
  }
}
