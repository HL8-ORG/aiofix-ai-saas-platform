import { DomainEvent } from '@aiofix/core';
import { NotifChannel } from '../value-objects/notif-channel.vo';
import { NotifStrategy } from '../value-objects/notif-strategy.vo';

/**
 * 通知编排取消事件
 * 当通知编排被取消时发布此事件
 *
 * 事件含义：
 * 1. 表示通知编排已被取消
 * 2. 包含编排取消时的关键信息
 * 3. 为其他聚合根提供编排取消通知
 *
 * 触发条件：
 * 1. 通知编排聚合根被取消后自动触发
 * 2. 编排状态转换到CANCELLED
 * 3. 用户主动取消或系统自动取消
 *
 * 影响范围：
 * 1. 通知编排管理模块记录编排取消
 * 2. 触发编排取消处理流程
 * 3. 更新编排取消统计
 * 4. 记录编排取消审计日志
 *
 * @property {string} orchestrationId 编排ID
 * @property {string} tenantId 租户ID
 * @property {string} userId 用户ID
 * @property {string} notificationId 通知ID
 * @property {NotifStrategy} strategy 通知策略
 * @property {NotifChannel[]} channels 通知渠道列表
 * @property {Record<string, unknown>} context 上下文信息
 * @property {string} cancelReason 取消原因
 * @property {Date} occurredOn 事件发生时间
 */
export class NotifOrchestrationCancelledEvent extends DomainEvent {
  constructor(
    public readonly orchestrationId: string,
    public readonly tenantId: string,
    public readonly userId: string,
    public readonly notificationId: string,
    public readonly strategy: NotifStrategy,
    public readonly channels: NotifChannel[],
    public readonly context: Record<string, unknown>,
    public readonly cancelReason?: string,
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
      cancelReason: this.cancelReason,
    };
  }
}
