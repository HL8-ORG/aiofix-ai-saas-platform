import { DomainEvent } from '@aiofix/core';
import { SystemMetrics } from '../value-objects/system-metrics.vo';

/**
 * @class SystemMetricsRecordedEvent
 * @description
 * 系统指标记录领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示系统指标已成功记录
 * 2. 包含系统监控的关键信息
 * 3. 为其他聚合根提供系统状态通知
 *
 * 触发条件：
 * 1. 系统性能指标收集完成
 * 2. 用户活动数据统计完成
 * 3. 系统容量数据更新完成
 * 4. 监控数据验证通过
 *
 * 影响范围：
 * 1. 更新系统监控仪表板
 * 2. 触发系统告警检查
 * 3. 记录系统性能历史数据
 * 4. 更新系统容量统计
 * 5. 生成系统健康报告
 * 6. 触发系统优化建议
 * 7. 通知管理员系统状态变更
 *
 * @property {SystemMetrics} metrics 系统指标
 * @property {string} recordedBy 记录者
 * @property {Date} recordedAt 记录时间
 * @property {string} dataSource 数据源
 *
 * @example
 * ```typescript
 * const event = new SystemMetricsRecordedEvent(
 *   systemMetrics,
 *   'monitoring-service',
 *   'system-monitor'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class SystemMetricsRecordedEvent extends DomainEvent {
  constructor(
    public readonly metrics: SystemMetrics,
    public readonly recordedBy: string,
    public readonly dataSource: string,
    public readonly recordedAt: Date = new Date(),
  ) {
    super('system-metrics');
  }

  /**
   * 将事件转换为JSON格式
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      metrics: this.metrics.value,
      recordedBy: this.recordedBy,
      dataSource: this.dataSource,
      recordedAt: this.recordedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {SystemMetricsRecordedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): SystemMetricsRecordedEvent {
    return new SystemMetricsRecordedEvent(
      new SystemMetrics(data.metrics as any),
      data.recordedBy as string,
      data.dataSource as string,
      new Date(data.recordedAt as string),
    );
  }
}
