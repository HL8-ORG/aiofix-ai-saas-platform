import { DomainEvent } from '@aiofix/core';
import { RoleId } from '../value-objects/role-id.vo';
import { RoleName, RoleDescription } from '@aiofix/shared';
import { RoleSettings } from '../value-objects/role-settings.vo';
import { Permission } from '../value-objects/permission.vo';
import { RoleStatus } from '../enums/role-status.enum';
import { RoleType } from '../enums/role-type.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/organization';
import { DepartmentId } from '@aiofix/department';

/**
 * @class RoleCreatedEvent
 * @description
 * 角色创建领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示角色聚合根已成功创建
 * 2. 包含角色创建时的关键信息
 * 3. 为其他聚合根提供角色创建通知
 *
 * 触发条件：
 * 1. 角色聚合根成功创建后自动触发
 * 2. 角色名称验证通过
 * 3. 角色权限验证通过
 * 4. 租户关联建立成功
 *
 * 影响范围：
 * 1. 通知权限管理模块创建角色权限
 * 2. 触发角色分配流程
 * 3. 更新角色统计信息
 * 4. 记录角色创建审计日志
 *
 * @property {RoleId} roleId 创建的角色ID
 * @property {RoleName} name 角色名称
 * @property {RoleDescription} description 角色描述
 * @property {RoleType} type 角色类型
 * @property {RoleStatus} status 角色状态
 * @property {RoleSettings} settings 角色设置
 * @property {Permission[]} permissions 权限列表
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationId} organizationId 所属组织ID（可选）
 * @property {DepartmentId} departmentId 所属部门ID（可选）
 * @property {Date} createdAt 角色创建时间
 *
 * @example
 * ```typescript
 * const event = new RoleCreatedEvent(
 *   roleId,
 *   roleName,
 *   roleDescription,
 *   RoleType.TENANT,
 *   RoleStatus.ACTIVE,
 *   roleSettings,
 *   permissions,
 *   tenantId
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class RoleCreatedEvent extends DomainEvent {
  constructor(
    public readonly roleId: RoleId,
    public readonly name: RoleName,
    public readonly description: RoleDescription,
    public readonly type: RoleType,
    public readonly status: RoleStatus,
    public readonly settings: RoleSettings,
    public readonly permissions: Permission[],
    public readonly tenantId: TenantId,
    public readonly organizationId?: OrganizationId,
    public readonly departmentId?: DepartmentId,
    public readonly createdAt: Date = new Date(),
  ) {
    super(roleId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'RoleCreated';
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
      roleId: this.roleId.value,
      name: this.name.value,
      description: this.description.value,
      type: this.type,
      status: this.status,
      settings: this.settings.toJSON(),
      permissions: this.permissions.map(p => p.toJSON()),
      tenantId: this.tenantId.value,
      organizationId: this.organizationId?.value,
      departmentId: this.departmentId?.value,
      createdAt: this.createdAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {RoleCreatedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): RoleCreatedEvent {
    return new RoleCreatedEvent(
      new RoleId(data.roleId as string),
      new RoleName(data.name as string),
      new RoleDescription(data.description as string),
      data.type as RoleType,
      data.status as RoleStatus,
      new RoleSettings(data.settings as any),
      (data.permissions as any[]).map(p => new Permission(p)),
      new TenantId(data.tenantId as string),
      data.organizationId
        ? new OrganizationId(data.organizationId as string)
        : undefined,
      data.departmentId
        ? new DepartmentId(data.departmentId as string)
        : undefined,
      new Date(data.createdAt as string),
    );
  }

  /**
   * @method getRoleScope
   * @description 获取角色作用域
   * @returns {string} 角色作用域
   */
  getRoleScope(): string {
    if (this.organizationId) {
      return `organization:${this.organizationId.value}`;
    }
    if (this.departmentId) {
      return `department:${this.departmentId.value}`;
    }
    return `tenant:${this.tenantId.value}`;
  }

  /**
   * @method isSystemRole
   * @description 检查是否为系统角色
   * @returns {boolean} 是否为系统角色
   */
  isSystemRole(): boolean {
    return this.settings.isSystemRole();
  }

  /**
   * @method isDefaultRole
   * @description 检查是否为默认角色
   * @returns {boolean} 是否为默认角色
   */
  isDefaultRole(): boolean {
    return this.settings.isDefaultRole();
  }

  /**
   * @method getPermissionCount
   * @description 获取权限数量
   * @returns {number} 权限数量
   */
  getPermissionCount(): number {
    return this.permissions.length;
  }

  /**
   * @method hasPermissionFor
   * @description 检查角色是否具有指定资源和操作的权限
   * @param {string} resource 资源名称
   * @param {string} action 操作名称
   * @returns {boolean} 是否具有权限
   */
  hasPermissionFor(resource: string, action: string): boolean {
    return this.permissions.some(p => p.matches(resource, action));
  }
}
