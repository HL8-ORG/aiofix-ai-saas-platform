import { DomainEvent } from '@aiofix/core';
import { NotifChannel } from '../value-objects/notif-channel.vo';
import { NotifStrategy } from '../value-objects/notif-strategy.vo';

/**
 * 通知编排创建事件
 * 当通知编排被创建时发布此事件
 *
 * 事件含义：
 * 1. 表示通知编排已成功创建
 * 2. 包含编排创建时的关键信息
 * 3. 为其他聚合根提供编排创建通知
 *
 * 触发条件：
 * 1. 通知编排聚合根成功创建后自动触发
 * 2. 编排配置验证通过
 * 3. 租户关联建立成功
 *
 * 影响范围：
 * 1. 通知编排管理模块记录编排创建
 * 2. 触发编排执行流程
 * 3. 更新编排统计信息
 * 4. 记录编排创建审计日志
 *
 * @property {string} orchestrationId 编排ID
 * @property {string} tenantId 租户ID
 * @property {string} userId 用户ID
 * @property {string} notificationId 通知ID
 * @property {NotifStrategy} strategy 通知策略
 * @property {NotifChannel[]} channels 通知渠道列表
 * @property {Record<string, unknown>} context 上下文信息
 * @property {string} createdBy 创建者
 * @property {Date} occurredOn 事件发生时间
 */
export class NotifOrchestrationCreatedEvent extends DomainEvent {
  constructor(
    public readonly orchestrationId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly notificationId: string,
    public readonly strategy: NotifStrategy,
    public readonly channels: NotifChannel[],
    public readonly context: Record<string, unknown>,
    public readonly createdBy: string,
  ) {
    super(orchestrationId);
  }

  /**
   * 将事件转换为JSON格式
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      orchestrationId: this.orchestrationId,
      tenantId: this.tenantId,
      userId: this.userId,
      notificationId: this.notificationId,
      strategy: this.strategy.getSummary(),
      channels: this.channels.map(c => c.getSummary()),
      context: this.context,
      createdBy: this.createdBy,
    };
  }
}
