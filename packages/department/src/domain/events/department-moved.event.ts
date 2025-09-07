import { DomainEvent } from '@aiofix/core';
import { DepartmentId } from '../value-objects/department-id.vo';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/organization';

/**
 * @class DepartmentMovedEvent
 * @description
 * 部门移动领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示部门已成功移动到新的父部门
 * 2. 包含部门移动的关键信息
 * 3. 为其他聚合根提供部门移动通知
 *
 * 触发条件：
 * 1. 部门成功移动到新父部门后自动触发
 * 2. 新父部门验证通过
 * 3. 层级关系重新计算完成
 * 4. 移动操作权限验证通过
 *
 * 影响范围：
 * 1. 通知权限管理模块更新部门权限
 * 2. 更新部门层级关系
 * 3. 更新部门统计信息
 * 4. 记录部门移动审计日志
 * 5. 通知相关用户部门移动成功
 * 6. 触发子部门层级重新计算
 *
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {Date} occurredOn 事件发生时间
 * @property {number} eventVersion 事件版本号
 * @property {DepartmentId} departmentId 移动的部门ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationId} organizationId 所属组织ID
 * @property {DepartmentId} oldParentDepartmentId 原父部门ID
 * @property {DepartmentId} newParentDepartmentId 新父部门ID
 * @property {number} oldLevel 原层级
 * @property {number} newLevel 新层级
 * @property {Date} movedAt 移动时间
 *
 * @example
 * ```typescript
 * const event = new DepartmentMovedEvent(
 *   'dept-123',
 *   'tenant-456',
 *   'org-789',
 *   'old-parent-001',
 *   'new-parent-002',
 *   2,
 *   3
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class DepartmentMovedEvent extends DomainEvent {
  constructor(
    public readonly departmentId: DepartmentId,
    public readonly tenantId: TenantId,
    public readonly organizationId: OrganizationId,
    public readonly oldParentDepartmentId: DepartmentId | null,
    public readonly newParentDepartmentId: DepartmentId | null,
    public readonly oldLevel: number,
    public readonly newLevel: number,
    public readonly movedAt: Date = new Date(),
  ) {
    super(departmentId.value);
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
      departmentId: this.departmentId.value,
      tenantId: this.tenantId.value,
      organizationId: this.organizationId.value,
      oldParentDepartmentId: this.oldParentDepartmentId?.value || null,
      newParentDepartmentId: this.newParentDepartmentId?.value || null,
      oldLevel: this.oldLevel,
      newLevel: this.newLevel,
      movedAt: this.movedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {DepartmentMovedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): DepartmentMovedEvent {
    return new DepartmentMovedEvent(
      new DepartmentId(data.departmentId as string),
      new TenantId(data.tenantId as string),
      new OrganizationId(data.organizationId as string),
      data.oldParentDepartmentId
        ? new DepartmentId(data.oldParentDepartmentId as string)
        : null,
      data.newParentDepartmentId
        ? new DepartmentId(data.newParentDepartmentId as string)
        : null,
      data.oldLevel as number,
      data.newLevel as number,
      new Date(data.movedAt as string),
    );
  }

  /**
   * @method getDisplayName
   * @description 获取事件显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return `部门移动: ${this.departmentId.value}`;
  }

  /**
   * @method getDescription
   * @description 获取事件描述
   * @returns {string} 事件描述
   */
  getDescription(): string {
    const oldParent = this.oldParentDepartmentId
      ? this.oldParentDepartmentId.value
      : '根部门';
    const newParent = this.newParentDepartmentId
      ? this.newParentDepartmentId.value
      : '根部门';
    return `部门从 ${oldParent} 移动到 ${newParent}，层级从 ${this.oldLevel} 变更为 ${this.newLevel}`;
  }

  /**
   * @method getImpactScope
   * @description 获取事件影响范围
   * @returns {string[]} 影响范围列表
   */
  getImpactScope(): string[] {
    return [
      '权限管理模块',
      '部门层级服务',
      '部门统计服务',
      '审计日志服务',
      '用户通知服务',
      '组织架构服务',
    ];
  }

  /**
   * @method isLevelChanged
   * @description 判断层级是否发生变化
   * @returns {boolean} 层级是否变化
   */
  isLevelChanged(): boolean {
    return this.oldLevel !== this.newLevel;
  }

  /**
   * @method isMovedToRoot
   * @description 判断是否移动到根部门
   * @returns {boolean} 是否移动到根部门
   */
  isMovedToRoot(): boolean {
    return this.newParentDepartmentId === null;
  }

  /**
   * @method isMovedFromRoot
   * @description 判断是否从根部门移动
   * @returns {boolean} 是否从根部门移动
   */
  isMovedFromRoot(): boolean {
    return this.oldParentDepartmentId === null;
  }

  /**
   * @method getLevelChange
   * @description 获取层级变化
   * @returns {number} 层级变化量
   */
  getLevelChange(): number {
    return this.newLevel - this.oldLevel;
  }

  /**
   * @method getMoveDirection
   * @description 获取移动方向
   * @returns {string} 移动方向
   */
  getMoveDirection(): string {
    if (this.isMovedToRoot()) return 'TO_ROOT';
    if (this.isMovedFromRoot()) return 'FROM_ROOT';
    if (this.newLevel > this.oldLevel) return 'DOWN';
    if (this.newLevel < this.oldLevel) return 'UP';
    return 'SAME_LEVEL';
  }
}
