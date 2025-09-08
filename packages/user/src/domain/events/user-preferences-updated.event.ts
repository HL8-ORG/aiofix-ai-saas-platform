import { DomainEvent } from '@aiofix/core';
import { UserId } from '@aiofix/shared';
import { UserPreferences } from '../value-objects';

/**
 * @class UserPreferencesUpdatedEvent
 * @description
 * 用户偏好更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示用户偏好设置已成功更新
 * 2. 包含偏好更新时的关键信息
 * 3. 为其他聚合根提供偏好更新通知
 *
 * 触发条件：
 * 1. 用户偏好设置成功更新后自动触发
 * 2. 偏好设置验证通过
 * 3. 偏好设置格式正确
 *
 * 影响范围：
 * 1. 通知界面模块更新用户界面设置
 * 2. 触发偏好变更通知流程
 * 3. 更新用户行为统计信息
 * 4. 记录偏好更新审计日志
 *
 * @property {UserId} userId 用户ID
 * @property {UserPreferences} oldPreferences 更新前的偏好设置
 * @property {UserPreferences} newPreferences 更新后的偏好设置
 * @property {string} updatedBy 更新者ID
 *
 * @example
 * ```typescript
 * const event = new UserPreferencesUpdatedEvent(
 *   new UserId('user-123'),
 *   oldPreferences,
 *   newPreferences,
 *   'user-456'
 * );
 * eventBus.publish(event);
 * ```
 * @extends DomainEvent
 * @since 1.0.0
 */
export class UserPreferencesUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly oldPreferences: UserPreferences,
    public readonly newPreferences: UserPreferences,
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
      oldPreferences: this.oldPreferences.toJSON(),
      newPreferences: this.newPreferences.toJSON(),
      updatedBy: this.updatedBy,
    };
  }
}
