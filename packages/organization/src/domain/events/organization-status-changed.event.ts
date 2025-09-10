import { DomainEvent } from '@aiofix/core';
import { OrganizationId } from '@aiofix/shared';
import { OrganizationStatus } from '../enums/organization-status.enum';
import { TenantId } from '@aiofix/shared';

/**
 * @class OrganizationStatusChangedEvent
 * @description
 * 组织状态变更领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示组织状态已成功变更
 * 2. 包含状态变更的关键信息
 * 3. 为其他聚合根提供组织状态变更通知
 *
 * 触发条件：
 * 1. 组织状态成功变更后自动触发
 * 2. 状态变更符合状态机规则
 * 3. 状态变更操作权限验证通过
 * 4. 状态变更数据验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块更新组织权限
 * 2. 更新组织缓存状态
 * 3. 记录组织状态变更审计日志
 * 4. 通知相关用户组织状态变更
 * 5. 触发状态相关的业务流程
 *
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {Date} occurredOn 事件发生时间
 * @property {number} eventVersion 事件版本号
 * @property {OrganizationId} organizationId 组织ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationStatus} previousStatus 之前的状态
 * @property {OrganizationStatus} newStatus 新的状态
 * @property {Date} statusChangedAt 状态变更时间
 * @property {string} reason 状态变更原因
 *
 * @example
 * ```typescript
 * const event = new OrganizationStatusChangedEvent(
 *   'org-123',
 *   'tenant-456',
 *   OrganizationStatus.INACTIVE,
 *   OrganizationStatus.ACTIVE,
 *   '管理员激活'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class OrganizationStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly organizationId: OrganizationId,
    public readonly tenantId: TenantId,
    public readonly previousStatus: OrganizationStatus,
    public readonly newStatus: OrganizationStatus,
    public readonly reason: string = '',
    public readonly statusChangedAt: Date = new Date(),
  ) {
    super(organizationId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return this.eventType;
  }

  /**
   * @method getAggregateId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  getAggregateId(): string {
    return this.aggregateId;
  }

  /**
   * @method getOccurredOn
   * @description 获取事件发生时间
   * @returns {Date} 事件发生时间
   */
  getOccurredOn(): Date {
    return this.occurredOn;
  }

  /**
   * @method getEventVersion
   * @description 获取事件版本号
   * @returns {number} 事件版本号
   */
  getEventVersion(): number {
    return this.eventVersion;
  }

  /**
   * @method getEventId
   * @description 获取事件唯一标识
   * @returns {string} 事件ID
   */
  getEventId(): string {
    return `${this.eventType}-${this.aggregateId}-${this.occurredOn.getTime()}`;
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式
   * @returns {Record<string, unknown>} JSON格式的事件数据
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      organizationId: this.organizationId.value,
      tenantId: this.tenantId.value,
      previousStatus: this.previousStatus,
      newStatus: this.newStatus,
      reason: this.reason,
      statusChangedAt: this.statusChangedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {OrganizationStatusChangedEvent} 事件实例
   * @static
   */
  static fromJSON(
    data: Record<string, unknown>,
  ): OrganizationStatusChangedEvent {
    return new OrganizationStatusChangedEvent(
      new OrganizationId(data.organizationId as string),
      new TenantId(data.tenantId as string),
      data.previousStatus as OrganizationStatus,
      data.newStatus as OrganizationStatus,
      data.reason as string,
      new Date(data.statusChangedAt as string),
    );
  }

  /**
   * @method getDisplayName
   * @description 获取事件显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return `组织状态变更: ${this.previousStatus} → ${this.newStatus}`;
  }

  /**
   * @method getDescription
   * @description 获取事件描述
   * @returns {string} 事件描述
   */
  getDescription(): string {
    const reasonText = this.reason ? `，原因：${this.reason}` : '';
    return `组织状态从 ${this.previousStatus} 变更为 ${this.newStatus}${reasonText}`;
  }

  /**
   * @method getImpactScope
   * @description 获取事件影响范围
   * @returns {string[]} 影响范围列表
   */
  getImpactScope(): string[] {
    return [
      '权限管理模块',
      '组织缓存服务',
      '审计日志服务',
      '用户通知服务',
      '业务流程服务',
    ];
  }

  /**
   * @method isActivation
   * @description 判断是否为激活操作
   * @returns {boolean} 是否为激活操作
   */
  isActivation(): boolean {
    return this.newStatus === OrganizationStatus.ACTIVE;
  }

  /**
   * @method isDeactivation
   * @description 判断是否为停用操作
   * @returns {boolean} 是否为停用操作
   */
  isDeactivation(): boolean {
    return this.newStatus === OrganizationStatus.INACTIVE;
  }

  /**
   * @method isSuspension
   * @description 判断是否为暂停操作
   * @returns {boolean} 是否为暂停操作
   */
  isSuspension(): boolean {
    return this.newStatus === OrganizationStatus.SUSPENDED;
  }

  /**
   * @method isDeletion
   * @description 判断是否为删除操作
   * @returns {boolean} 是否为删除操作
   */
  isDeletion(): boolean {
    return this.newStatus === OrganizationStatus.DELETED;
  }

  /**
   * @method getStatusTransitionType
   * @description 获取状态转换类型
   * @returns {string} 状态转换类型
   */
  getStatusTransitionType(): string {
    if (this.isActivation()) return 'ACTIVATION';
    if (this.isDeactivation()) return 'DEACTIVATION';
    if (this.isSuspension()) return 'SUSPENSION';
    if (this.isDeletion()) return 'DELETION';
    return 'UNKNOWN';
  }
}
