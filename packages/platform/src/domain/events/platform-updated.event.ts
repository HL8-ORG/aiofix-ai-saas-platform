import { DomainEvent } from '@aiofix/core';
import { PlatformSettings } from '../value-objects/platform-settings.vo';

/**
 * @class PlatformUpdatedEvent
 * @description
 * 平台更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示平台聚合根已成功更新
 * 2. 包含平台更新时的关键信息
 * 3. 为其他聚合根提供平台更新通知
 *
 * 触发条件：
 * 1. 平台聚合根成功更新后自动触发
 * 2. 平台名称或描述发生变化
 * 3. 平台设置发生变化
 * 4. 更新者权限验证通过
 *
 * 影响范围：
 * 1. 通知系统更新模块更新平台配置
 * 2. 更新平台统计信息
 * 3. 记录平台更新审计日志
 * 4. 发送平台更新通知
 *
 * @property {string} platformId 更新的平台ID
 * @property {string} name 新平台名称
 * @property {string} description 新平台描述
 * @property {Date} occurredOn 事件发生时间
 * @property {string} updatedBy 更新者ID
 * @property {PlatformSettings} settings 新平台设置
 *
 * @example
 * ```typescript
 * const event = new PlatformUpdatedEvent(
 *   'platform-123',
 *   'New Platform Name',
 *   'Updated description',
 *   new Date(),
 *   'admin-456',
 *   newSettings
 * );
 * ```
 * @since 1.0.0
 */
export class PlatformUpdatedEvent extends DomainEvent {
  constructor(
    public readonly platformId: string,
    public readonly name: string,
    public readonly description: string | undefined,
    occurredOn: Date,
    public readonly updatedBy: string,
    public readonly settings?: PlatformSettings,
  ) {
    super(platformId, 1);
    // 注意：occurredOn 和 eventType 由基类构造函数设置
  }

  /**
   * 转换为JSON格式
   *
   * @returns {Record<string, unknown>} JSON数据
   */
  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn,
      platformId: this.platformId,
      name: this.name,
      description: this.description,
      updatedBy: this.updatedBy,
      settings: this.settings,
    };
  }
}
