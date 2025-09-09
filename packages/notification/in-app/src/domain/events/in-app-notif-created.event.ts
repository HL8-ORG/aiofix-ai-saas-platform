import { DomainEvent } from '@aiofix/core';
import { NotifId } from '@aiofix/shared';
import { TenantId } from '@aiofix/shared';
import { UserId } from '@aiofix/shared';
import { NotifType } from '../value-objects/notif-type.vo';
import { NotifPriority } from '../value-objects/notif-priority.vo';

/**
 * @class InAppNotifCreatedEvent
 * @description
 * 站内通知创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示站内通知聚合根已成功创建
 * 2. 包含通知创建时的关键信息
 * 3. 为其他聚合根提供通知创建通知
 *
 * 触发条件：
 * 1. 站内通知聚合根成功创建后自动触发
 * 2. 通知内容验证通过
 * 3. 租户和用户关联建立成功
 *
 * 影响范围：
 * 1. 通知用户偏好管理模块更新通知设置
 * 2. 触发通知统计更新
 * 3. 更新用户未读通知计数
 * 4. 记录通知创建审计日志
 *
 * @property {NotifId} notifId 创建的通知ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {UserId} recipientId 接收者用户ID
 * @property {NotifType} type 通知类型
 * @property {string} title 通知标题
 * @property {string} content 通知内容
 * @property {NotifPriority} priority 通知优先级
 * @property {Record<string, any>} metadata 通知元数据
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new InAppNotifCreatedEvent(
 *   notifId,
 *   tenantId,
 *   recipientId,
 *   NotifType.SYSTEM,
 *   '系统通知',
 *   '系统将在今晚进行维护',
 *   NotifPriority.HIGH,
 *   { maintenanceTime: '2024-01-01 02:00:00' }
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class InAppNotifCreatedEvent extends DomainEvent {
  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly priority: NotifPriority,
    public readonly notifMetadata: Record<string, unknown> = {},
  ) {
    super(notifId.value, 1, {
      tenantId: tenantId.value,
      userId: recipientId.value,
      source: 'in-app-notification',
    });
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

    if (!this.type) {
      throw new InvalidEventDataError('Notification type is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new InvalidEventDataError('Notification title is required');
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new InvalidEventDataError('Notification content is required');
    }

    if (!this.priority) {
      throw new InvalidEventDataError('Notification priority is required');
    }

    if (this.title.length > 200) {
      throw new InvalidEventDataError(
        'Notification title cannot exceed 200 characters',
      );
    }

    if (this.content.length > 5000) {
      throw new InvalidEventDataError(
        'Notification content cannot exceed 5000 characters',
      );
    }
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {object} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      notifId: this.notifId.value,
      tenantId: this.tenantId.value,
      recipientId: this.recipientId.value,
      type: this.type,
      title: this.title,
      content: this.content,
      priority: this.priority,
      metadata: this.notifMetadata,
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
