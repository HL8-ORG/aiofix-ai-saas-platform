import { IDomainEvent } from '@aiofix/core';
import { ChannelPreference } from '../value-objects/channel-preference.vo';
import { TimePreference } from '../value-objects/time-preference.vo';
import { ContentPreference } from '../value-objects/content-preference.vo';
import { FrequencyPreference } from '../value-objects/frequency-preference.vo';

/**
 * 用户通知偏好创建事件
 * 当用户通知偏好被创建时发布此事件
 *
 * 事件含义：
 * 1. 表示用户通知偏好已成功创建
 * 2. 包含偏好创建时的关键信息
 * 3. 为其他聚合根提供偏好创建通知
 *
 * 触发条件：
 * 1. 用户偏好聚合根成功创建后自动触发
 * 2. 偏好数据验证通过
 * 3. 租户关联建立成功
 *
 * 影响范围：
 * 1. 通知偏好管理模块记录偏好创建
 * 2. 触发偏好同步流程
 * 3. 更新用户偏好统计信息
 * 4. 记录偏好创建审计日志
 *
 * @property {string} userId 用户ID
 * @property {string} tenantId 租户ID
 * @property {ChannelPreference[]} channelPreferences 渠道偏好列表
 * @property {TimePreference[]} timePreferences 时间偏好列表
 * @property {ContentPreference[]} contentPreferences 内容偏好列表
 * @property {FrequencyPreference[]} frequencyPreferences 频率偏好列表
 * @property {string} createdBy 创建者
 * @property {Date} occurredOn 事件发生时间
 */
export class NotifPreferencesCreatedEvent implements IDomainEvent {
  public readonly occurredOn: Date = new Date();

  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly channelPreferences: ChannelPreference[],
    public readonly timePreferences: TimePreference[],
    public readonly contentPreferences: ContentPreference[],
    public readonly frequencyPreferences: FrequencyPreference[],
    public readonly createdBy: string,
  ) {}

  /**
   * 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'NotifPreferencesCreated';
  }

  /**
   * 获取事件ID
   * @returns {string} 事件ID
   */
  getEventId(): string {
    return `notif-preferences-created-${this.userId}-${this.tenantId}-${this.occurredOn.getTime()}`;
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
      createdBy: this.createdBy,
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
      channelPreferences: this.channelPreferences.map(p => p.getSummary()),
      timePreferences: this.timePreferences.map(p => p.getSummary()),
      contentPreferences: this.contentPreferences.map(p => p.getSummary()),
      frequencyPreferences: this.frequencyPreferences.map(p => p.getSummary()),
      createdBy: this.createdBy,
      occurredOn: this.occurredOn,
    };
  }
}
