import { DomainEvent } from '@aiofix/core';
import { DepartmentId } from '@aiofix/shared';
import { DepartmentName, DepartmentDescription } from '@aiofix/shared';
import { DepartmentSettings } from '../value-objects/department-settings.vo';
import { DepartmentStatus } from '../enums/department-status.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/shared';

/**
 * @class DepartmentCreatedEvent
 * @description
 * 部门创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示部门聚合根已成功创建
 * 2. 包含部门创建时的关键信息
 * 3. 为其他聚合根提供部门创建通知
 *
 * 触发条件：
 * 1. 部门聚合根成功创建后自动触发
 * 2. 部门名称验证通过
 * 3. 组织关联建立成功
 * 4. 部门设置配置完成
 *
 * 影响范围：
 * 1. 通知权限管理模块创建部门权限
 * 2. 触发部门初始化流程
 * 3. 更新部门统计信息
 * 4. 记录部门创建审计日志
 * 5. 通知相关用户部门创建成功
 *
 * @property {string} eventType 事件类型标识
 * @property {string} aggregateId 聚合根ID
 * @property {Date} occurredOn 事件发生时间
 * @property {number} eventVersion 事件版本号
 * @property {DepartmentId} departmentId 创建的部门ID
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationId} organizationId 所属组织ID
 * @property {DepartmentId} parentDepartmentId 父部门ID
 * @property {DepartmentName} name 部门名称
 * @property {DepartmentDescription} description 部门描述
 * @property {DepartmentSettings} settings 部门设置
 * @property {DepartmentStatus} status 部门状态
 * @property {number} level 部门层级
 * @property {Date} createdAt 部门创建时间
 *
 * @example
 * ```typescript
 * const event = new DepartmentCreatedEvent(
 *   'dept-123',
 *   'tenant-456',
 *   'org-789',
 *   '技术研发部',
 *   '负责技术研发和产品创新',
 *   settings
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class DepartmentCreatedEvent extends DomainEvent {
  constructor(
    public readonly departmentId: DepartmentId,
    public readonly tenantId: TenantId,
    public readonly organizationId: OrganizationId,
    public readonly parentDepartmentId: DepartmentId | null,
    public readonly name: DepartmentName,
    public readonly description: DepartmentDescription,
    public readonly settings: DepartmentSettings,
    public readonly status: DepartmentStatus = DepartmentStatus.INACTIVE,
    public readonly level: number = 1,
    public readonly createdAt: Date = new Date(),
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
      parentDepartmentId: this.parentDepartmentId?.value || null,
      name: this.name.value,
      description: this.description.value,
      settings: this.settings.value,
      status: this.status,
      level: this.level,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {DepartmentCreatedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): DepartmentCreatedEvent {
    return new DepartmentCreatedEvent(
      new DepartmentId(data.departmentId as string),
      new TenantId(data.tenantId as string),
      new OrganizationId(data.organizationId as string),
      data.parentDepartmentId
        ? new DepartmentId(data.parentDepartmentId as string)
        : null,
      new DepartmentName(data.name as string),
      new DepartmentDescription(data.description as string),
      new DepartmentSettings(data.settings as any),
      data.status as DepartmentStatus,
      data.level as number,
      new Date(data.createdAt as string),
    );
  }

  /**
   * @method getDisplayName
   * @description 获取事件显示名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return `部门创建: ${this.name.value}`;
  }

  /**
   * @method getDescription
   * @description 获取事件描述
   * @returns {string} 事件描述
   */
  getDescription(): string {
    const parentInfo = this.parentDepartmentId
      ? `，父部门: ${this.parentDepartmentId.value}`
      : '，根部门';
    return `部门 "${this.name.value}" 已成功创建，状态为 ${this.status}，层级: ${this.level}${parentInfo}`;
  }

  /**
   * @method getImpactScope
   * @description 获取事件影响范围
   * @returns {string[]} 影响范围列表
   */
  getImpactScope(): string[] {
    return [
      '权限管理模块',
      '部门统计服务',
      '审计日志服务',
      '用户通知服务',
      '部门初始化服务',
      '组织架构服务',
    ];
  }

  /**
   * @method isRootDepartment
   * @description 判断是否为根部门创建事件
   * @returns {boolean} 是否为根部门
   */
  isRootDepartment(): boolean {
    return this.parentDepartmentId === null;
  }

  /**
   * @method getHierarchyInfo
   * @description 获取层级信息
   * @returns {object} 层级信息
   */
  getHierarchyInfo(): {
    level: number;
    isRoot: boolean;
    parentId: string | null;
  } {
    return {
      level: this.level,
      isRoot: this.isRootDepartment(),
      parentId: this.parentDepartmentId?.value || null,
    };
  }
}
