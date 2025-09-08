import { DomainEvent } from '@aiofix/core';
import { UserId, Email } from '@aiofix/shared';
import { UserProfile, UserStatus } from '../value-objects';

/**
 * @class UserCreatedEvent
 * @description
 * 用户创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示用户聚合根已成功创建
 * 2. 包含用户创建时的关键信息
 * 3. 为其他聚合根提供用户创建通知
 *
 * 触发条件：
 * 1. 用户聚合根成功创建后自动触发
 * 2. 用户邮箱验证通过
 * 3. 用户基本信息验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块创建用户权限
 * 2. 触发欢迎邮件发送流程
 * 3. 更新用户统计信息
 * 4. 记录用户创建审计日志
 *
 * @property {UserId} userId 创建的用户ID
 * @property {Email} email 用户邮箱地址
 * @property {UserProfile} profile 用户档案信息
 * @property {UserStatus} status 用户初始状态
 * @property {string} tenantId 所属租户ID
 * @property {string} platformId 所属平台ID
 * @property {string} createdBy 创建者ID
 *
 * @example
 * ```typescript
 * const event = new UserCreatedEvent(
 *   new UserId('user-123'),
 *   new Email('user@example.com'),
 *   new UserProfile('John', 'Doe'),
 *   UserStatus.PENDING,
 *   'tenant-456',
 *   'platform-789',
 *   'admin-001'
 * );
 * eventBus.publish(event);
 * ```
 * @extends DomainEvent
 * @since 1.0.0
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly email: Email,
    public readonly profile: UserProfile,
    public readonly status: UserStatus,
    public readonly tenantId: string,
    public readonly platformId: string,
    public readonly createdBy: string,
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
      email: this.email.toString(),
      profile: this.profile.toJSON(),
      status: this.status.toString(),
      tenantId: this.tenantId,
      platformId: this.platformId,
      createdBy: this.createdBy,
    };
  }
}
