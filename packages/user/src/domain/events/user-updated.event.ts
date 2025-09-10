import { DomainEvent } from '@aiofix/core';
import { UserId } from '@aiofix/shared';

/**
 * @interface UserUpdateData
 * @description 用户更新数据接口
 */
export interface UserUpdateData {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  avatar?: string;
  status?: string;
  organizationId?: string;
  departmentId?: string;
}

/**
 * @class UserUpdatedEvent
 * @description
 * 用户更新领域事件，表示用户信息已成功更新。
 *
 * 事件职责：
 * 1. 记录用户信息更新操作
 * 2. 提供更新前后的数据对比
 * 3. 支持事件溯源和审计
 * 4. 触发相关的业务流程
 *
 * 事件触发条件：
 * 1. 用户基本信息更新成功
 * 2. 用户状态变更成功
 * 3. 用户权限分配成功
 * 4. 用户资料修改成功
 *
 * 影响范围：
 * 1. 更新用户缓存
 * 2. 发送通知给相关用户
 * 3. 记录审计日志
 * 4. 更新用户统计信息
 *
 * @property {UserId} userId 用户ID
 * @property {string} tenantId 租户ID
 * @property {UserUpdateData} updateData 更新数据
 * @property {string} updatedBy 更新者ID
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new UserUpdatedEvent(
 *   new UserId('user-123'),
 *   'tenant-456',
 *   { firstName: 'John', lastName: 'Doe' },
 *   'admin-789'
 * );
 * ```
 * @since 1.0.0
 */
export class UserUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: UserId,
    public readonly tenantId: string,
    public readonly updateData: UserUpdateData,
    public readonly updatedBy: string,
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
    return 'UserUpdated';
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
      updateData: this.updateData,
      updatedBy: this.updatedBy,
    };
  }
}
