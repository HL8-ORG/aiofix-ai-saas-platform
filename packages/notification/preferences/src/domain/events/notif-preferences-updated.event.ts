import { IDomainEvent } from '@aiofix/core';

/**
 * 用户通知偏好更新事件
 * 当用户通知偏好被更新时发布此事件
 *
 * 事件含义：
 * 1. 表示用户通知偏好已成功更新
 * 2. 包含偏好更新时的关键信息
 * 3. 为其他聚合根提供偏好更新通知
 *
 * 触发条件：
 * 1. 用户偏好聚合根成功更新后自动触发
 * 2. 偏好数据验证通过
 * 3. 更新操作符合业务规则
 *
 * 影响范围：
 * 1. 通知偏好管理模块记录偏好更新
 * 2. 触发偏好同步流程
 * 3. 更新用户偏好统计信息
 * 4. 记录偏好更新审计日志
 *
 * @property {string} userId 用户ID
 * @property {string} tenantId 租户ID
 * @property {string} preferenceType 偏好类型
 * @property {unknown} newValue 新值
 * @property {string} updatedBy 更新者
 * @property {Date} occurredOn 事件发生时间
 */
export class NotifPreferencesUpdatedEvent implements IDomainEvent {
  public readonly occurredOn: Date = new Date();

  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly preferenceType: string,
    public readonly newValue: unknown,
    public readonly updatedBy: string,
  ) {}

  /**
   * 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'NotifPreferencesUpdated';
  }

  /**
   * 获取事件ID
   * @returns {string} 事件ID
   */
  getEventId(): string {
    return `notif-preferences-updated-${this.userId}-${this.tenantId}-${this.preferenceType}-${this.occurredOn.getTime()}`;
  }

  /**
   * 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  getAggregateId(): string {
    return `${this.userId}-${this.tenantId}`;
  }

  /**
   * 获取事件版本
   * @returns {number} 事件版本
   */
  getEventVersion(): number {
    return 1;
  }

  /**
   * 获取事件元数据
   * @returns {Record<string, unknown>} 事件元数据
   */
  getMetadata(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      preferenceType: this.preferenceType,
      updatedBy: this.updatedBy,
      eventType: this.getEventType(),
      eventVersion: this.getEventVersion(),
    };
  }

  /**
   * 获取事件数据
   * @returns {Record<string, unknown>} 事件数据
   */
  getData(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      preferenceType: this.preferenceType,
      newValue: this.newValue,
      updatedBy: this.updatedBy,
      occurredOn: this.occurredOn,
    };
  }
}
