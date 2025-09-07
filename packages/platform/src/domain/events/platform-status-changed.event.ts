import { DomainEvent } from '@aiofix/core';
import { PlatformStatus } from '../enums/platform-status.enum';

/**
 * @class PlatformStatusChangedEvent
 * @description
 * 平台状态变更领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示平台状态已成功变更
 * 2. 包含状态变更的关键信息
 * 3. 为其他聚合根提供平台状态变更通知
 *
 * 触发条件：
 * 1. 平台状态成功变更后自动触发
 * 2. 新状态与当前状态不同
 * 3. 状态变更权限验证通过
 * 4. 状态变更符合业务规则
 *
 * 影响范围：
 * 1. 通知系统更新平台可用性状态
 * 2. 更新用户访问权限
 * 3. 记录平台状态变更审计日志
 * 4. 发送平台状态变更通知
 * 5. 触发相关业务流程（如维护模式下的用户通知）
 *
 * @property {string} platformId 平台ID
 * @property {PlatformStatus} oldStatus 原状态
 * @property {PlatformStatus} newStatus 新状态
 * @property {Date} occurredOn 事件发生时间
 * @property {string} updatedBy 更新者ID
 *
 * @example
 * ```typescript
 * const event = new PlatformStatusChangedEvent(
 *   'platform-123',
 *   PlatformStatus.ACTIVE,
 *   PlatformStatus.MAINTENANCE,
 *   new Date(),
 *   'admin-456'
 * );
 * ```
 * @since 1.0.0
 */
export class PlatformStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly platformId: string,
    public readonly oldStatus: PlatformStatus,
    public readonly newStatus: PlatformStatus,
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
      oldStatus: this.oldStatus,
      newStatus: this.newStatus,
      updatedBy: this.updatedBy,
    };
  }
}
