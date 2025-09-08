import { DomainEvent } from '@aiofix/core';
import { TenantId } from '@aiofix/shared';

/**
 * @class TenantUpdatedEvent
 * @description
 * 租户更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示租户聚合根已成功更新
 * 2. 包含租户更新时的关键信息
 * 3. 为其他聚合根提供租户更新通知
 *
 * 触发条件：
 * 1. 租户聚合根成功更新后自动触发
 * 2. 租户数据验证通过
 * 3. 租户设置、配额或配置更新成功
 *
 * 影响范围：
 * 1. 通知相关模块更新租户信息
 * 2. 触发租户配置同步流程
 * 3. 更新租户缓存信息
 * 4. 记录租户更新审计日志
 *
 * @property {TenantId} tenantId 更新的租户ID
 * @property {string} updateType 更新类型（settings、quota、configuration）
 * @property {Record<string, unknown>} updateData 更新数据
 * @property {string} updatedBy 更新者ID
 * @property {string} eventId 事件唯一标识符
 * @property {Date} occurredOn 事件发生时间
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {number} eventVersion 事件版本号
 *
 * @example
 * ```typescript
 * const event = new TenantUpdatedEvent(
 *   new TenantId('tenant-123'),
 *   'settings',
 *   { oldSettings: oldSettings, newSettings: newSettings },
 *   'admin-456'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class TenantUpdatedEvent extends DomainEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly updateType: string,
    public readonly updateData: Record<string, unknown>,
    public readonly updatedBy: string,
  ) {
    super(tenantId.toString(), 1);
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  public toJSON(): Record<string, unknown> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      eventVersion: this.eventVersion,
      occurredOn: this.occurredOn,
      tenantId: this.tenantId.toString(),
      updateType: this.updateType,
      updateData: this.updateData,
      updatedBy: this.updatedBy,
    };
  }

  /**
   * @method isSettingsUpdate
   * @description 检查是否为设置更新
   * @returns {boolean} 是否为设置更新
   */
  public isSettingsUpdate(): boolean {
    return this.updateType === 'settings';
  }

  /**
   * @method isQuotaUpdate
   * @description 检查是否为配额更新
   * @returns {boolean} 是否为配额更新
   */
  public isQuotaUpdate(): boolean {
    return this.updateType === 'quota';
  }

  /**
   * @method isConfigurationUpdate
   * @description 检查是否为配置更新
   * @returns {boolean} 是否为配置更新
   */
  public isConfigurationUpdate(): boolean {
    return this.updateType === 'configuration';
  }

  /**
   * @method getOldValue
   * @description 获取更新前的值
   * @returns {unknown} 更新前的值
   */
  public getOldValue(): unknown {
    const key = `old${this.updateType.charAt(0).toUpperCase() + this.updateType.slice(1)}`;
    return this.updateData[key];
  }

  /**
   * @method getNewValue
   * @description 获取更新后的值
   * @returns {unknown} 更新后的值
   */
  public getNewValue(): unknown {
    const key = `new${this.updateType.charAt(0).toUpperCase() + this.updateType.slice(1)}`;
    return this.updateData[key];
  }
}
