import { IDomainEvent } from '@aiofix/core';

/**
 * @class TimePreferenceChangedEvent
 * @description
 * 时间偏好变更事件，表示用户的时间偏好设置已发生变更。
 *
 * 事件含义：
 * 1. 表示用户的时间偏好设置已发生变更
 * 2. 包含时间偏好变更的详细信息
 * 3. 为其他聚合根提供时间偏好变更通知
 *
 * 触发条件：
 * 1. 用户时间偏好设置发生变更后自动触发
 * 2. 时间偏好变更验证通过
 * 3. 时间偏好实体状态更新完成
 *
 * 影响范围：
 * 1. 通知相关通知渠道时间偏好已变更
 * 2. 触发时间偏好同步流程
 * 3. 更新时间偏好统计信息
 * 4. 记录时间偏好变更审计日志
 *
 * @property {string} userId 用户ID
 * @property {string} tenantId 租户ID
 * @property {TimePreferenceChangeData} changeData 变更数据
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new TimePreferenceChangedEvent(
 *   'user-123',
 *   'tenant-456',
 *   { startTime: '09:00', endTime: '18:00', workDays: ['monday', 'tuesday'] }
 * );
 * ```
 * @since 1.0.0
 */
export class TimePreferenceChangedEvent implements IDomainEvent {
  public readonly occurredOn: Date = new Date();
  public readonly eventId: string = this.generateEventId();

  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly changeData: TimePreferenceChangeData,
  ) {}

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'TimePreferenceChanged';
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  getAggregateId(): string {
    return this.userId;
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
   * @method generateEventId
   * @description 生成事件ID
   * @returns {string} 事件ID
   * @private
   */
  private generateEventId(): string {
    return `time-preference-changed-${this.userId}-${Date.now()}`;
  }
}

/**
 * @interface TimePreferenceChangeData
 * @description 时间偏好变更数据传输对象
 */
export interface TimePreferenceChangeData {
  startTime: string;
  endTime: string;
  workDays: string[];
  timezone: string;
  doNotDisturb: boolean;
}
