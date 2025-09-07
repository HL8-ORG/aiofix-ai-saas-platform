import { DomainEvent } from '@aiofix/core';
import { PlatformStatus } from '../enums/platform-status.enum';
import { PlatformSettings } from '../value-objects/platform-settings.vo';

/**
 * @class PlatformCreatedEvent
 * @description
 * 平台创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示平台聚合根已成功创建
 * 2. 包含平台创建时的关键信息
 * 3. 为其他聚合根提供平台创建通知
 *
 * 触发条件：
 * 1. 平台聚合根成功创建后自动触发
 * 2. 平台名称验证通过
 * 3. 平台设置验证通过
 * 4. 创建者权限验证通过
 *
 * 影响范围：
 * 1. 通知系统初始化模块创建平台配置
 * 2. 触发平台统计信息初始化
 * 3. 记录平台创建审计日志
 * 4. 发送平台创建通知
 *
 * @property {string} platformId 创建的平台ID
 * @property {string} name 平台名称
 * @property {string} description 平台描述
 * @property {PlatformStatus} status 平台状态
 * @property {PlatformSettings} settings 平台设置
 * @property {Date} occurredOn 事件发生时间
 * @property {string} createdBy 创建者ID
 *
 * @example
 * ```typescript
 * const event = new PlatformCreatedEvent(
 *   'platform-123',
 *   'AIOFIX Platform',
 *   'AI-powered SAAS platform',
 *   PlatformStatus.ACTIVE,
 *   settings,
 *   new Date(),
 *   'admin-456'
 * );
 * ```
 * @since 1.0.0
 */
export class PlatformCreatedEvent extends DomainEvent {
  constructor(
    public readonly platformId: string,
    public readonly name: string,
    public readonly description: string | undefined,
    public readonly status: PlatformStatus,
    public readonly settings: PlatformSettings,
    occurredOn: Date,
    public readonly createdBy: string,
  ) {
    super(platformId, 1);
    // 注意：occurredOn 和 eventType 由基类构造函数设置
    // 如果需要自定义时间，需要在构造函数中处理
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
      status: this.status,
      settings: this.settings,
      createdBy: this.createdBy,
    };
  }
}
