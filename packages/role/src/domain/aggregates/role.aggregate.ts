import { EventSourcedAggregateRoot, DomainEvent } from '@aiofix/core';
import { RoleEntity } from '../entities/role.entity';
import { RoleId } from '@aiofix/shared';
import { RoleName, RoleDescription } from '@aiofix/shared';
import {
  RoleSettings,
  RoleSettingsData,
} from '../value-objects/role-settings.vo';
import { Permission, PermissionData } from '../value-objects/permission.vo';
import { RoleStatus } from '../enums/role-status.enum';
import { RoleType } from '../enums/role-type.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/shared';
import { DepartmentId } from '@aiofix/shared';

/**
 * @class RoleAggregate
 * @description
 * 角色聚合根，负责管理角色相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供角色创建、更新、删除等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 *
 * 不变性约束：
 * 1. 角色名称在租户内必须唯一
 * 2. 角色权限必须符合业务规则
 * 3. 角色删除前必须清理所有关联数据
 * 4. 系统角色不能被删除或修改
 *
 * @property {RoleEntity} role 角色实体
 * @property {DomainEvent[]} uncommittedEvents 未提交的领域事件
 *
 * @example
 * ```typescript
 * const roleAggregate = new RoleAggregate();
 * await roleAggregate.createRole('管理员', '系统管理员角色', RoleType.TENANT, tenantId);
 * // 自动发布 RoleCreatedEvent
 * ```
 * @since 1.0.0
 */
export class RoleAggregate extends EventSourcedAggregateRoot {
  private role?: RoleEntity;

  constructor(role?: RoleEntity) {
    super();
    this.role = role;
  }

  /**
   * @method getId
   * @description 获取聚合根ID
   * @returns {string} 聚合根ID
   */
  get id(): string {
    return this.role?.id.toString() ?? '';
  }

  /**
   * @method createRole
   * @description 创建新角色，发布角色创建事件
   * @param {string} name 角色名称
   * @param {string} description 角色描述
   * @param {RoleType} type 角色类型
   * @param {TenantId} tenantId 租户ID
   * @param {RoleSettings} settings 角色设置
   * @param {Permission[]} permissions 权限列表
   * @param {OrganizationId} [organizationId] 组织ID（可选）
   * @param {DepartmentId} [departmentId] 部门ID（可选）
   * @returns {Promise<void>}
   * @throws {DuplicateRoleNameError} 当角色名称已存在时抛出
   * @throws {InvalidRoleTypeError} 当角色类型无效时抛出
   * @throws {InvalidPermissionError} 当权限无效时抛出
   */
  async createRole(
    name: string,
    description: string,
    type: RoleType,
    tenantId: TenantId,
    settings: RoleSettings,
    permissions: Permission[] = [],
    organizationId?: OrganizationId,
    departmentId?: DepartmentId,
  ): Promise<void> {
    // 验证角色创建数据
    await this.validateRoleCreationData(
      name,
      type,
      tenantId,
      organizationId,
      departmentId,
    );

    // 创建角色实体
    const roleId = new RoleId();
    const roleName = new RoleName(name);
    const roleDescription = new RoleDescription(description);

    this.role = new RoleEntity(
      roleId,
      roleName,
      roleDescription,
      type,
      RoleStatus.PENDING,
      settings,
      permissions,
      tenantId,
      organizationId ?? null,
      departmentId ?? null,
      'system',
    );

    // 发布角色创建事件
    // TODO: 创建RoleCreatedEvent类
    // const event = new RoleCreatedEvent(...);
    // this.apply(event);
  }

  /**
   * @method updateRole
   * @description 更新角色信息，发布角色更新事件
   * @param {string} name 新角色名称
   * @param {string} description 新角色描述
   * @param {RoleSettings} settings 新角色设置
   * @returns {Promise<void>}
   * @throws {RoleNotFoundError} 当角色不存在时抛出
   * @throws {InvalidStateError} 当角色状态不允许修改时抛出
   * @throws {DuplicateRoleNameError} 当角色名称已存在时抛出
   */
  async updateRole(
    name: string,
    description: string,
    settings: RoleSettings,
  ): Promise<void> {
    if (!this.role) {
      throw new RoleNotFoundError('角色不存在');
    }

    if (!this.role.canBeModified()) {
      throw new InvalidStateError('角色状态不允许修改');
    }

    // 验证角色名称唯一性（如果名称发生变化）
    if (this.role.name.value !== name) {
      await this.validateRoleNameUniqueness(name, this.role.tenantId);
    }

    // 创建更新后的角色实体
    const updatedRole = new RoleEntity(
      this.role.id,
      new RoleName(name),
      new RoleDescription(description),
      this.role.type,
      this.role.getStatus(),
      settings,
      this.role.getPermissions(),
      this.role.tenantId,
      this.role.organizationId,
      this.role.departmentId,
      this.role.createdBy,
    );

    this.role = updatedRole;

    // 发布角色更新事件
    // TODO: 创建RoleUpdatedEvent类
    // const event = new RoleUpdatedEvent(...);
    // this.apply(event);
  }

  /**
   * @method addPermission
   * @description 添加权限到角色，发布权限添加事件
   * @param {Permission} permission 要添加的权限
   * @returns {Promise<void>}
   * @throws {RoleNotFoundError} 当角色不存在时抛出
   * @throws {InvalidStateError} 当角色状态不允许修改时抛出
   * @throws {DuplicatePermissionError} 当权限已存在时抛出
   */
  async addPermission(permission: Permission): Promise<void> {
    if (!this.role) {
      throw new RoleNotFoundError('角色不存在');
    }

    if (!this.role.canBeModified()) {
      throw new InvalidStateError('角色状态不允许修改');
    }

    this.role.addPermission(permission, 'system');

    // 发布权限添加事件
    // TODO: 创建PermissionAddedEvent类
    // const event = new PermissionAddedEvent(...);
    // this.apply(event);
  }

  /**
   * @method removePermission
   * @description 从角色中移除权限，发布权限移除事件
   * @param {Permission} permission 要移除的权限
   * @returns {Promise<void>}
   * @throws {RoleNotFoundError} 当角色不存在时抛出
   * @throws {InvalidStateError} 当角色状态不允许修改时抛出
   * @throws {PermissionNotFoundError} 当权限不存在时抛出
   */
  async removePermission(permission: Permission): Promise<void> {
    if (!this.role) {
      throw new RoleNotFoundError('角色不存在');
    }

    if (!this.role.canBeModified()) {
      throw new InvalidStateError('角色状态不允许修改');
    }

    this.role.removePermission(permission, 'system');

    // 发布权限移除事件
    // TODO: 创建PermissionRemovedEvent类
    // const event = new PermissionRemovedEvent(...);
    // this.apply(event);
  }

  /**
   * @method activateRole
   * @description 激活角色，发布角色激活事件
   * @returns {Promise<void>}
   * @throws {RoleNotFoundError} 当角色不存在时抛出
   * @throws {InvalidStateTransitionError} 当角色状态不允许激活时抛出
   */
  async activateRole(): Promise<void> {
    if (!this.role) {
      throw new RoleNotFoundError('角色不存在');
    }

    this.role.activate('system');

    // 发布角色激活事件
    // TODO: 创建RoleActivatedEvent类
    // const event = new RoleActivatedEvent(...);
    // this.apply(event);
  }

  /**
   * @method deactivateRole
   * @description 停用角色，发布角色停用事件
   * @returns {Promise<void>}
   * @throws {RoleNotFoundError} 当角色不存在时抛出
   * @throws {InvalidStateTransitionError} 当角色状态不允许停用时抛出
   */
  async deactivateRole(): Promise<void> {
    if (!this.role) {
      throw new RoleNotFoundError('角色不存在');
    }

    this.role.deactivate('system');

    // 发布角色停用事件
    // TODO: 创建RoleDeactivatedEvent类
    // const event = new RoleDeactivatedEvent(...);
    // this.apply(event);
  }

  /**
   * @method suspendRole
   * @description 暂停角色，发布角色暂停事件
   * @returns {Promise<void>}
   * @throws {RoleNotFoundError} 当角色不存在时抛出
   * @throws {InvalidStateTransitionError} 当角色状态不允许暂停时抛出
   */
  async suspendRole(): Promise<void> {
    if (!this.role) {
      throw new RoleNotFoundError('角色不存在');
    }

    this.role.suspend('system');

    // 发布角色暂停事件
    // TODO: 创建RoleSuspendedEvent类
    // const event = new RoleSuspendedEvent(...);
    // this.apply(event);
  }

  /**
   * @method deleteRole
   * @description 删除角色，发布角色删除事件
   * @returns {Promise<void>}
   * @throws {RoleNotFoundError} 当角色不存在时抛出
   * @throws {InvalidStateTransitionError} 当角色状态不允许删除时抛出
   */
  async deleteRole(): Promise<void> {
    if (!this.role) {
      throw new RoleNotFoundError('角色不存在');
    }

    if (!this.role.canBeDeleted()) {
      throw new InvalidStateTransitionError('角色不能被删除');
    }

    this.role.delete('system');

    // 发布角色删除事件
    // TODO: 创建RoleDeletedEvent类
    // const event = new RoleDeletedEvent(...);
    // this.apply(event);
  }

  /**
   * @method getRole
   * @description 获取角色实体
   * @returns {RoleEntity | undefined} 角色实体
   */
  getRole(): RoleEntity | undefined {
    return this.role;
  }

  /**
   * @method getId
   * @description 获取角色ID
   * @returns {RoleId | undefined} 角色ID
   */
  getId(): RoleId | undefined {
    return this.role?.id;
  }

  /**
   * @method getVersion
   * @description 获取聚合根版本号
   * @returns {number} 版本号
   */
  getVersion(): number {
    return 0; // TODO: Implement proper version tracking
  }

  /**
   * @method handleEvent
   * @description 处理领域事件，更新聚合根状态
   * @param {DomainEvent} event 领域事件
   * @param {boolean} isFromHistory 是否来自历史事件重放
   * @returns {void}
   * @protected
   */
  protected handleEvent(
    event: DomainEvent,
    _isFromHistory: boolean = false,
  ): void {
    switch (event.eventType) {
      case 'RoleCreated':
        this.handleRoleCreatedEvent(event);
        break;
      case 'RoleUpdated':
        this.handleRoleUpdatedEvent(event);
        break;
      case 'PermissionAdded':
        this.handlePermissionAddedEvent(event);
        break;
      case 'PermissionRemoved':
        this.handlePermissionRemovedEvent(event);
        break;
      case 'RoleActivated':
        this.handleRoleActivatedEvent(event);
        break;
      case 'RoleDeactivated':
        this.handleRoleDeactivatedEvent(event);
        break;
      case 'RoleSuspended':
        this.handleRoleSuspendedEvent(event);
        break;
      case 'RoleDeleted':
        this.handleRoleDeletedEvent(event);
        break;
      default:
        // 忽略不相关的事件
        break;
    }
  }

  /**
   * @method toSnapshot
   * @description 创建聚合根快照
   * @returns {Record<string, unknown>} 快照数据
   */
  toSnapshot(): Record<string, unknown> {
    return {
      role: this.role,
      version: 0, // TODO: Implement proper version tracking
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照重建聚合根
   * @param {Record<string, unknown>} snapshot 快照数据
   * @returns {void}
   */
  fromSnapshot(snapshot: Record<string, unknown>): void {
    this.role = snapshot.role as RoleEntity;
    // 注意：_version是私有属性，需要通过其他方式设置
    // 这里暂时注释掉，等待EventSourcedAggregateRoot提供公共方法
    // this._version = snapshot.version || 0;
  }

  // 私有辅助方法
  private async validateRoleCreationData(
    name: string,
    type: RoleType,
    tenantId: TenantId,
    organizationId?: OrganizationId,
    departmentId?: DepartmentId,
  ): Promise<void> {
    // 验证角色名称唯一性
    await this.validateRoleNameUniqueness(name, tenantId);

    // 验证角色类型与组织/部门ID的一致性
    if (type === RoleType.ORGANIZATION && !organizationId) {
      throw new InvalidRoleTypeError('组织角色必须指定组织ID');
    }

    if (type === RoleType.DEPARTMENT && !departmentId) {
      throw new InvalidRoleTypeError('部门角色必须指定部门ID');
    }
  }

  private async validateRoleNameUniqueness(
    _name: string,
    _tenantId: TenantId,
  ): Promise<void> {
    // TODO: 实现角色名称唯一性验证
    // 这里应该查询数据库检查角色名称是否已存在
    // 暂时跳过验证
  }

  // 事件处理方法
  private handleRoleCreatedEvent(event: DomainEvent): void {
    const data = event.toJSON();
    this.role = new RoleEntity(
      new RoleId(data.roleId as string),
      new RoleName(data.name as string),
      new RoleDescription(data.description as string),
      data.type as RoleType,
      data.status as RoleStatus,
      new RoleSettings(data.settings as RoleSettingsData),
      (data.permissions as unknown[]).map(
        (p: unknown) => new Permission(p as PermissionData),
      ),
      new TenantId(data.tenantId as string),
      data.organizationId
        ? new OrganizationId(data.organizationId as string)
        : null,
      data.departmentId ? new DepartmentId(data.departmentId as string) : null,
      data.createdBy as string,
    );
  }

  private handleRoleUpdatedEvent(event: DomainEvent): void {
    const data = event.toJSON();
    if (this.role) {
      this.role = new RoleEntity(
        this.role.id,
        new RoleName(data.name as string),
        new RoleDescription(data.description as string),
        this.role.type,
        this.role.getStatus(),
        new RoleSettings(data.settings as RoleSettingsData),
        this.role.getPermissions(),
        this.role.tenantId,
        this.role.organizationId,
        this.role.departmentId,
        this.role.createdBy,
      );
    }
  }

  private handlePermissionAddedEvent(event: DomainEvent): void {
    const data = event.toJSON();
    if (this.role) {
      const newPermission = new Permission(data.permission as PermissionData);
      this.role.addPermission(newPermission, 'system');
    }
  }

  private handlePermissionRemovedEvent(event: DomainEvent): void {
    const data = event.toJSON();
    if (this.role) {
      const permission = new Permission(data.permission as PermissionData);
      this.role.removePermission(permission, 'system');
    }
  }

  private handleRoleActivatedEvent(_event: DomainEvent): void {
    if (this.role) {
      this.role.activate('system');
    }
  }

  private handleRoleDeactivatedEvent(_event: DomainEvent): void {
    if (this.role) {
      this.role.deactivate('system');
    }
  }

  private handleRoleSuspendedEvent(_event: DomainEvent): void {
    if (this.role) {
      this.role.suspend('system');
    }
  }

  private handleRoleDeletedEvent(_event: DomainEvent): void {
    if (this.role) {
      this.role.delete('system');
    }
  }
}

/**
 * @class RoleNotFoundError
 * @description 角色未找到错误
 * @extends Error
 */
export class RoleNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoleNotFoundError';
  }
}

/**
 * @class DuplicateRoleNameError
 * @description 重复角色名称错误
 * @extends Error
 */
export class DuplicateRoleNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateRoleNameError';
  }
}

/**
 * @class InvalidRoleTypeError
 * @description 无效角色类型错误
 * @extends Error
 */
export class InvalidRoleTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleTypeError';
  }
}

/**
 * @class InvalidStateError
 * @description 无效状态错误
 * @extends Error
 */
export class InvalidStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateError';
  }
}

/**
 * @class InvalidStateTransitionError
 * @description 无效状态转换错误
 * @extends Error
 */
export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}

/**
 * @class DuplicatePermissionError
 * @description 重复权限错误
 * @extends Error
 */
export class DuplicatePermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicatePermissionError';
  }
}

/**
 * @class PermissionNotFoundError
 * @description 权限未找到错误
 * @extends Error
 */
export class PermissionNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionNotFoundError';
  }
}
