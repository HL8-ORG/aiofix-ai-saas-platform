import { DomainEvent } from '@aiofix/core';
import { NotifId } from '@aiofix/shared';
import { TenantId } from '@aiofix/shared';
import { UserId } from '@aiofix/shared';
import { ReadStatus } from '../value-objects/read-status.vo';

/**
 * @class InAppNotifReadEvent
 * @description
 * 站内通知已读领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示站内通知已被用户标记为已读
 * 2. 包含通知状态变更的关键信息
 * 3. 为其他聚合根提供通知状态变更通知
 *
 * 触发条件：
 * 1. 用户主动标记通知为已读
 * 2. 通知状态从UNREAD变更为READ
 * 3. 状态变更验证通过
 *
 * 影响范围：
 * 1. 更新用户未读通知计数
 * 2. 触发通知统计更新
 * 3. 更新用户通知偏好分析
 * 4. 记录通知状态变更审计日志
 *
 * @property {NotifId} notifId 通知ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {UserId} recipientId 接收者用户ID
 * @property {ReadStatus} oldStatus 原状态
 * @property {ReadStatus} newStatus 新状态
 * @property {Date} readAt 阅读时间
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new InAppNotifReadEvent(
 *   notifId,
 *   tenantId,
 *   recipientId,
 *   ReadStatus.UNREAD,
 *   ReadStatus.READ,
 *   new Date()
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class InAppNotifReadEvent extends DomainEvent {
  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly oldStatus: ReadStatus,
    public readonly newStatus: ReadStatus,
    public readonly readAt: Date,
  ) {
    super(notifId.value);
    this.validateEvent();
  }

  /**
   * @method validateEvent
   * @description 验证事件数据的有效性
   * @returns {void}
   * @throws {InvalidEventDataError} 当事件数据无效时抛出
   * @private
   */
  private validateEvent(): void {
    if (!this.notifId) {
      throw new InvalidEventDataError('Notif ID is required');
    }

    if (!this.tenantId) {
      throw new InvalidEventDataError('Tenant ID is required');
    }

    if (!this.recipientId) {
      throw new InvalidEventDataError('Recipient ID is required');
    }

    if (!this.oldStatus) {
      throw new InvalidEventDataError('Old status is required');
    }

    if (!this.newStatus) {
      throw new InvalidEventDataError('New status is required');
    }

    if (!this.readAt) {
      throw new InvalidEventDataError('Read time is required');
    }

    // 验证状态转换的合法性
    if (this.oldStatus === this.newStatus) {
      throw new InvalidEventDataError('Status must change');
    }

    if (this.newStatus !== ReadStatus.READ) {
      throw new InvalidEventDataError('New status must be READ');
    }

    // 验证时间合理性
    if (this.readAt > this.occurredOn) {
      throw new InvalidEventDataError('Read time cannot be in the future');
    }
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {object} 事件的JSON表示
   */
  toJSON(): object {
    return {
      ...this.getBaseEventData(),
      notifId: this.notifId.value,
      tenantId: this.tenantId.value,
      recipientId: this.recipientId.value,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      readAt: this.readAt.toISOString(),
    };
  }
}

/**
 * @class InvalidEventDataError
 * @description 无效事件数据错误
 */
export class InvalidEventDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEventDataError';
  }
}
