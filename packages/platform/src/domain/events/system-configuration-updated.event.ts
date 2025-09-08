import { DomainEvent } from '@aiofix/core';
import { SystemConfiguration } from '../value-objects/system-configuration.vo';

/**
 * @class SystemConfigurationUpdatedEvent
 * @description
 * 系统配置更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示系统配置已成功更新
 * 2. 包含配置更新的关键信息
 * 3. 为其他聚合根提供配置变更通知
 *
 * 触发条件：
 * 1. 系统参数配置更新完成
 * 2. 功能开关状态变更完成
 * 3. 主题设置更新完成
 * 4. 配置验证通过
 *
 * 影响范围：
 * 1. 通知所有服务更新配置
 * 2. 更新系统配置缓存
 * 3. 记录配置变更审计日志
 * 4. 触发配置同步流程
 * 5. 通知管理员配置变更
 * 6. 更新系统功能可用性
 * 7. 触发相关业务流程调整
 *
 * @property {SystemConfiguration} configuration 系统配置
 * @property {string} updatedBy 更新者用户ID
 * @property {Date} updatedAt 更新时间
 * @property {string[]} changedSections 变更的配置节
 * @property {string} reason 更新原因
 *
 * @example
 * ```typescript
 * const event = new SystemConfigurationUpdatedEvent(
 *   systemConfiguration,
 *   'admin-789',
 *   ['systemParameters', 'featureFlags'],
 *   '系统安全策略更新'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class SystemConfigurationUpdatedEvent extends DomainEvent {
  constructor(
    public readonly configuration: SystemConfiguration,
    public readonly updatedBy: string,
    public readonly changedSections: string[],
    public readonly reason: string,
    public readonly updatedAt: Date = new Date(),
  ) {
    super('system-configuration');
  }

  /**
   * 将事件转换为JSON格式
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      configuration: this.configuration.value,
      updatedBy: this.updatedBy,
      changedSections: this.changedSections,
      reason: this.reason,
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {SystemConfigurationUpdatedEvent} 事件实例
   * @static
   */
  static fromJSON(
    data: Record<string, unknown>,
  ): SystemConfigurationUpdatedEvent {
    return new SystemConfigurationUpdatedEvent(
      new SystemConfiguration(data.configuration as any),
      data.updatedBy as string,
      data.changedSections as string[],
      data.reason as string,
      new Date(data.updatedAt as string),
    );
  }
}
