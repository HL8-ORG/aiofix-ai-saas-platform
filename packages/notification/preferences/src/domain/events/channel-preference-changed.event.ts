import { DomainEvent } from '@aiofix/core';

/**
 * @class ChannelPreferenceChangedEvent
 * @description
 * 渠道偏好变更事件，表示用户对特定渠道的偏好设置已发生变更。
 *
 * 事件含义：
 * 1. 表示用户对特定渠道的偏好设置已发生变更
 * 2. 包含渠道偏好变更的详细信息
 * 3. 为其他聚合根提供渠道偏好变更通知
 *
 * 触发条件：
 * 1. 用户渠道偏好设置发生变更后自动触发
 * 2. 渠道偏好变更验证通过
 * 3. 渠道偏好实体状态更新完成
 *
 * 影响范围：
 * 1. 通知相关通知渠道偏好已变更
 * 2. 触发渠道偏好同步流程
 * 3. 更新渠道偏好统计信息
 * 4. 记录渠道偏好变更审计日志
 *
 * @property {string} userId 用户ID
 * @property {string} tenantId 租户ID
 * @property {string} channel 渠道名称
 * @property {ChannelPreferenceChangeData} changeData 变更数据
 * @property {Date} occurredOn 事件发生时间
 *
 * @example
 * ```typescript
 * const event = new ChannelPreferenceChangedEvent(
 *   'user-123',
 *   'tenant-456',
 *   'email',
 *   { enabled: true, priority: 'high', config: {} }
 * );
 * ```
 * @since 1.0.0
 */
export class ChannelPreferenceChangedEvent extends DomainEvent {
  public readonly occurredOn: Date = new Date();
  public readonly eventId: string = this.generateEventId();

  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly channel: string,
    public readonly changeData: ChannelPreferenceChangeData,
    public readonly changedBy: string,
  ) {
    super(userId, 1, {
      tenantId: tenantId,
      userId: changedBy,
      source: 'notification-preferences',
    });
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'ChannelPreferenceChanged';
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
   * @method getData
   * @description 获取事件数据
   * @returns {Record<string, unknown>} 事件数据
   */
  getData(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      channel: this.channel,
      changeData: this.changeData,
      changedBy: this.changedBy,
    };
  }

  /**
   * @method generateEventId
   * @description 生成事件ID
   * @returns {string} 事件ID
   * @private
   */
  private generateEventId(): string {
    return `channel-preference-changed-${this.userId}-${this.channel}-${Date.now()}`;
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式，用于序列化和存储
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      ...this.getData(),
    };
  }
}

/**
 * @interface ChannelPreferenceChangeData
 * @description 渠道偏好变更数据传输对象
 */
export interface ChannelPreferenceChangeData {
  enabled: boolean;
  priority: string;
  config: Record<string, unknown>;
}
