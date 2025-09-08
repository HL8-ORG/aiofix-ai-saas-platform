import { DomainEvent } from '@aiofix/core';
import { RoleId } from '../value-objects/role-id.vo';
import { RoleName, RoleDescription } from '@aiofix/shared';
import {
  RoleSettings,
  RoleSettingsData,
} from '../value-objects/role-settings.vo';
import { RoleType } from '../enums/role-type.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/organization';
import { DepartmentId } from '@aiofix/department';

/**
 * @class RoleUpdatedEvent
 * @description
 * 角色更新领域事件，描述事件含义、触发条件和影响范围。
 *
 * 事件含义：
 * 1. 表示角色聚合根已成功更新
 * 2. 包含角色更新时的关键信息
 * 3. 为其他聚合根提供角色更新通知
 *
 * 触发条件：
 * 1. 角色聚合根成功更新后自动触发
 * 2. 角色名称验证通过
 * 3. 角色设置验证通过
 * 4. 角色状态允许修改
 *
 * 影响范围：
 * 1. 通知权限管理模块更新角色权限
 * 2. 触发角色重新分配流程
 * 3. 更新角色统计信息
 * 4. 记录角色更新审计日志
 *
 * @property {RoleId} roleId 更新的角色ID
 * @property {RoleName} name 新角色名称
 * @property {RoleDescription} description 新角色描述
 * @property {RoleType} type 角色类型
 * @property {RoleSettings} settings 新角色设置
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationId} organizationId 所属组织ID（可选）
 * @property {DepartmentId} departmentId 所属部门ID（可选）
 * @property {Date} updatedAt 角色更新时间
 *
 * @example
 * ```typescript
 * const event = new RoleUpdatedEvent(
 *   roleId,
 *   newRoleName,
 *   newRoleDescription,
 *   RoleType.TENANT,
 *   newRoleSettings,
 *   tenantId
 * );
 * eventBus.publish(event);
 * ```
 * @since 1.0.0
 */
export class RoleUpdatedEvent extends DomainEvent {
  constructor(
    public readonly roleId: RoleId,
    public readonly name: RoleName,
    public readonly description: RoleDescription,
    public readonly type: RoleType,
    public readonly settings: RoleSettings,
    public readonly tenantId: TenantId,
    public readonly organizationId?: OrganizationId,
    public readonly departmentId?: DepartmentId,
    public readonly updatedAt: Date = new Date(),
  ) {
    super(roleId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'RoleUpdated';
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
      settings: this.settings.toJSON(),
      tenantId: this.tenantId.value,
      organizationId: this.organizationId?.value,
      departmentId: this.departmentId?.value,
      updatedAt: this.updatedAt.toISOString(),
    };
  }

  /**
   * @method fromJSON
   * @description 从JSON数据创建事件实例
   * @param {Record<string, unknown>} data JSON数据
   * @returns {RoleUpdatedEvent} 事件实例
   * @static
   */
  static fromJSON(data: Record<string, unknown>): RoleUpdatedEvent {
    return new RoleUpdatedEvent(
      new RoleId(data.roleId as string),
      new RoleName(data.name as string),
      new RoleDescription(data.description as string),
      data.type as RoleType,
      new RoleSettings(data.settings as unknown as RoleSettingsData),
      new TenantId(data.tenantId as string),
      data.organizationId
        ? new OrganizationId(data.organizationId as string)
        : undefined,
      data.departmentId
        ? new DepartmentId(data.departmentId as string)
        : undefined,
      new Date(data.updatedAt as string),
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
   * @method hasUserLimit
   * @description 检查是否有用户数量限制
   * @returns {boolean} 是否有用户数量限制
   */
  hasUserLimit(): boolean {
    return this.settings.hasUserLimit();
  }

  /**
   * @method getMaxUsers
   * @description 获取最大用户数量
   * @returns {number | undefined} 最大用户数量
   */
  getMaxUsers(): number | undefined {
    return this.settings.getMaxUsers();
  }

  /**
   * @method requiresApproval
   * @description 检查是否需要审批
   * @returns {boolean} 是否需要审批
   */
  requiresApproval(): boolean {
    return this.settings.requiresApproval();
  }

  /**
   * @method isAutoAssign
   * @description 检查是否自动分配
   * @returns {boolean} 是否自动分配
   */
  isAutoAssign(): boolean {
    return this.settings.isAutoAssign();
  }
}
