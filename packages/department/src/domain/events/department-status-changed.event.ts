import { IDomainEvent } from '@aiofix/core';
import { DepartmentId } from '../value-objects/department-id.vo';
import { DepartmentStatus } from '../enums/department-status.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/organization';

/**
 * @class DepartmentStatusChangedEvent
 * @description
 * 部门状态变更领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示部门状态已成功变更
 * 2. 包含状态变更的关键信息
 * 3. 为其他聚合根提供部门状态变更通知
 *
 * 触发条件：
 * 1. 部门状态成功变更后自动触发
 * 2. 状态变更符合状态机规则
 * 3. 状态变更操作权限验证通过
 * 4. 状态变更数据验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块更新部门权限
 * 2. 更新部门缓存状态
 * 3. 记录部门状态变更审计日志
 * 4. 通知相关用户部门状态变更
 * 5. 触发状态相关的业务流程
 *
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {Date} occurredOn 事件发生时间
 * @property {number} eventVersion 事件版本号
 * @property {DepartmentId} departmentId 部门ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationId} organizationId 所属组织ID
 * @property {DepartmentStatus} previousStatus 之前的状态
 * @property {DepartmentStatus} newStatus 新的状态
 * @property {Date} statusChangedAt 状态变更时间
 * @property {string} reason 状态变更原因
 *
 * @example
 * ```typescript
 * const event = new DepartmentStatusChangedEvent(
 *   'dept-123',
 *   'tenant-456',
 *   'org-789',
 *   DepartmentStatus.INACTIVE,
 *   DepartmentStatus.ACTIVE,
 *   '管理员激活'
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class DepartmentStatusChangedEvent implements IDomainEvent {
  public readonly eventType: string = 'DepartmentStatusChanged';
  public readonly aggregateId: string;
  public readonly occurredOn: Date = new Date();
  public readonly eventVersion: number = 1;
  public readonly eventId: string;

  constructor(
    public readonly departmentId: DepartmentId,
    public readonly tenantId: TenantId,
    public readonly organizationId: OrganizationId,
    public readonly previousStatus: DepartmentStatus,
    public readonly newStatus: DepartmentStatus,
    public readonly reason: string = '',
    public readonly statusChangedAt: Date = new Date(),
  ) {
    this.aggregateId = this.departmentId.value;
    this.eventId = `${this.eventType}-${this.aggregateId}-${this.occurredOn.getTime()}`;
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
      eventType: this.eventType,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      eventVersion: this.eventVersion,
      departmentId: this.departmentId.value,
      tenantId: this.tenantId.value,
      organizationId: this.organizationId.value,
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
   * @returns {DepartmentStatusChangedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): DepartmentStatusChangedEvent {
    return new DepartmentStatusChangedEvent(
      new DepartmentId(data.departmentId as string),
      new TenantId(data.tenantId as string),
      new OrganizationId(data.organizationId as string),
      data.previousStatus as DepartmentStatus,
      data.newStatus as DepartmentStatus,
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
    return `部门状态变更: ${this.previousStatus} → ${this.newStatus}`;
  }

  /**
   * @method getDescription
   * @description 获取事件描述
   * @returns {string} 事件描述
   */
  getDescription(): string {
    const reasonText = this.reason ? `，原因：${this.reason}` : '';
    return `部门状态从 ${this.previousStatus} 变更为 ${this.newStatus}${reasonText}`;
  }

  /**
   * @method getImpactScope
   * @description 获取事件影响范围
   * @returns {string[]} 影响范围列表
   */
  getImpactScope(): string[] {
    return [
      '权限管理模块',
      '部门缓存服务',
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
    return this.newStatus === DepartmentStatus.ACTIVE;
  }

  /**
   * @method isDeactivation
   * @description 判断是否为停用操作
   * @returns {boolean} 是否为停用操作
   */
  isDeactivation(): boolean {
    return this.newStatus === DepartmentStatus.INACTIVE;
  }

  /**
   * @method isSuspension
   * @description 判断是否为暂停操作
   * @returns {boolean} 是否为暂停操作
   */
  isSuspension(): boolean {
    return this.newStatus === DepartmentStatus.SUSPENDED;
  }

  /**
   * @method isDeletion
   * @description 判断是否为删除操作
   * @returns {boolean} 是否为删除操作
   */
  isDeletion(): boolean {
    return this.newStatus === DepartmentStatus.DELETED;
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

  /**
   * @method isOperationalChange
   * @description 判断是否为可操作性变更
   * @returns {boolean} 是否为可操作性变更
   */
  isOperationalChange(): boolean {
    const wasOperational = this.previousStatus !== DepartmentStatus.DELETED;
    const isOperational = this.newStatus !== DepartmentStatus.DELETED;
    return wasOperational !== isOperational;
  }
}
