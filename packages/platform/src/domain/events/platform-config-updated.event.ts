import { DomainEvent } from '@aiofix/core';
import { PlatformConfigType } from '../enums/platform-config-type.enum';

/**
 * @class PlatformConfigUpdatedEvent
 * @description
 * 平台配置更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示平台配置已成功更新
 * 2. 包含配置更新的关键信息
 * 3. 为其他聚合根提供平台配置更新通知
 *
 * 触发条件：
 * 1. 平台配置成功更新后自动触发
 * 2. 配置值发生变化
 * 3. 配置更新权限验证通过
 * 4. 配置值符合类型约束
 *
 * 影响范围：
 * 1. 通知系统更新相关模块配置
 * 2. 更新配置缓存
 * 3. 记录平台配置更新审计日志
 * 4. 发送平台配置更新通知
 * 5. 触发配置相关的业务流程（如需要重启服务的配置）
 *
 * @property {string} platformId 平台ID
 * @property {string} configKey 配置键
 * @property {unknown} configValue 配置值
 * @property {PlatformConfigType} configType 配置类型
 * @property {Date} occurredOn 事件发生时间
 * @property {string} updatedBy 更新者ID
 *
 * @example
 * ```typescript
 * const event = new PlatformConfigUpdatedEvent(
 *   'platform-123',
 *   'max_users',
 *   10000,
 *   PlatformConfigType.SYSTEM,
 *   new Date(),
 *   'admin-456'
 * );
 * ```
 * @since 1.0.0
 */
export class PlatformConfigUpdatedEvent extends DomainEvent {
  constructor(
    public readonly platformId: string,
    public readonly configKey: string,
    public readonly configValue: unknown,
    public readonly configType: PlatformConfigType,
    occurredOn: Date,
    public readonly updatedBy: string,
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
      configKey: this.configKey,
      configValue: this.configValue,
      configType: this.configType,
      updatedBy: this.updatedBy,
    };
  }
}
