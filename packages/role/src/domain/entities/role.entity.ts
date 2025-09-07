import { RoleId } from '../value-objects/role-id.vo';
import { RoleName } from '../value-objects/role-name.vo';
import { RoleDescription } from '../value-objects/role-description.vo';
import { RoleSettings } from '../value-objects/role-settings.vo';
import { Permission } from '../value-objects/permission.vo';
import { RoleStatus, RoleStatusHelper } from '../enums/role-status.enum';
import { RoleType, RoleTypeHelper } from '../enums/role-type.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/organization';
import { DepartmentId } from '@aiofix/department';

/**
 * @class RoleEntity
 * @description
 * 角色领域实体，负责维护角色的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识角色身份
 * 2. 管理角色的基本状态（激活、暂停、删除）
 * 3. 维护角色的生命周期状态变更
 *
 * 业务规则与约束：
 * 1. 角色ID一旦创建不可变更
 * 2. 角色状态变更必须遵循预定义的状态机
 * 3. 删除角色时采用软删除策略
 * 4. 角色权限必须符合业务规则
 *
 * @property {RoleId} id 角色唯一标识符，不可变更
 * @property {RoleName} name 角色名称
 * @property {RoleDescription} description 角色描述
 * @property {RoleType} type 角色类型
 * @property {RoleStatus} status 角色当前状态
 * @property {RoleSettings} settings 角色设置
 * @property {Permission[]} permissions 角色权限列表
 * @property {TenantId} tenantId 所属租户ID
 * @property {OrganizationId} organizationId 所属组织ID（可选）
 * @property {DepartmentId} departmentId 所属部门ID（可选）
 * @property {Date} createdAt 角色创建时间
 * @property {Date} updatedAt 角色最后更新时间
 * @property {Date} deletedAt 角色删除时间（软删除）
 *
 * @example
 * ```typescript
 * const role = new RoleEntity(
 *   new RoleId(),
 *   new RoleName('管理员'),
 *   new RoleDescription('系统管理员角色'),
 *   RoleType.TENANT,
 *   RoleStatus.ACTIVE,
 *   new RoleSettings({...}),
 *   [new Permission('user', 'read')],
 *   new TenantId('tenant-123')
 * );
 * role.activate(); // 激活角色
 * role.suspend(); // 暂停角色
 * ```
 * @since 1.0.0
 */
export class RoleEntity {
  constructor(
    public readonly id: RoleId,
    public readonly name: RoleName,
    public readonly description: RoleDescription,
    public readonly type: RoleType,
    private status: RoleStatus,
    public readonly settings: RoleSettings,
    private permissions: Permission[],
    public readonly tenantId: TenantId,
    public readonly organizationId?: OrganizationId,
    public readonly departmentId?: DepartmentId,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly deletedAt?: Date,
  ) {
    this.validateRoleEntity();
  }

  /**
   * @method getStatus
   * @description 获取角色当前状态
   * @returns {RoleStatus} 角色状态
   */
  getStatus(): RoleStatus {
    return this.status;
  }

  /**
   * @method getPermissions
   * @description 获取角色权限列表
   * @returns {Permission[]} 权限列表的副本
   */
  getPermissions(): Permission[] {
    return [...this.permissions];
  }

  /**
   * @method activate
   * @description 激活角色，将状态从INACTIVE或SUSPENDED变更为ACTIVE
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当角色状态不允许激活时抛出
   */
  activate(): void {
    if (this.status === RoleStatus.DELETED) {
      throw new InvalidStateTransitionError('已删除的角色不能激活');
    }

    if (this.status === RoleStatus.EXPIRED) {
      throw new InvalidStateTransitionError('已过期的角色不能激活');
    }

    this.status = RoleStatus.ACTIVE;
  }

  /**
   * @method deactivate
   * @description 停用角色，将状态从ACTIVE变更为INACTIVE
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当角色状态不允许停用时抛出
   */
  deactivate(): void {
    if (this.status === RoleStatus.DELETED) {
      throw new InvalidStateTransitionError('已删除的角色不能停用');
    }

    if (this.status === RoleStatus.EXPIRED) {
      throw new InvalidStateTransitionError('已过期的角色不能停用');
    }

    this.status = RoleStatus.INACTIVE;
  }

  /**
   * @method suspend
   * @description 暂停角色，将状态从ACTIVE变更为SUSPENDED
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当角色状态不允许暂停时抛出
   */
  suspend(): void {
    if (this.status === RoleStatus.DELETED) {
      throw new InvalidStateTransitionError('已删除的角色不能暂停');
    }

    if (this.status === RoleStatus.EXPIRED) {
      throw new InvalidStateTransitionError('已过期的角色不能暂停');
    }

    this.status = RoleStatus.SUSPENDED;
  }

  /**
   * @method delete
   * @description 删除角色，将状态变更为DELETED（软删除）
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当角色状态不允许删除时抛出
   */
  delete(): void {
    if (this.status === RoleStatus.DELETED) {
      throw new InvalidStateTransitionError('角色已经被删除');
    }

    if (this.settings.isSystemRole()) {
      throw new InvalidStateTransitionError('系统角色不能被删除');
    }

    this.status = RoleStatus.DELETED;
  }

  /**
   * @method expire
   * @description 使角色过期，将状态变更为EXPIRED
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当角色状态不允许过期时抛出
   */
  expire(): void {
    if (this.status === RoleStatus.DELETED) {
      throw new InvalidStateTransitionError('已删除的角色不能过期');
    }

    this.status = RoleStatus.EXPIRED;
  }

  /**
   * @method addPermission
   * @description 添加权限到角色
   * @param {Permission} permission 要添加的权限
   * @returns {void}
   * @throws {InvalidStateError} 当角色状态不允许修改权限时抛出
   * @throws {DuplicatePermissionError} 当权限已存在时抛出
   */
  addPermission(permission: Permission): void {
    if (!RoleStatusHelper.canBeModified(this.status)) {
      throw new InvalidStateError('角色状态不允许修改权限');
    }

    if (this.hasPermission(permission)) {
      throw new DuplicatePermissionError('权限已存在');
    }

    this.permissions.push(permission);
  }

  /**
   * @method removePermission
   * @description 从角色中移除权限
   * @param {Permission} permission 要移除的权限
   * @returns {void}
   * @throws {InvalidStateError} 当角色状态不允许修改权限时抛出
   * @throws {PermissionNotFoundError} 当权限不存在时抛出
   */
  removePermission(permission: Permission): void {
    if (!RoleStatusHelper.canBeModified(this.status)) {
      throw new InvalidStateError('角色状态不允许修改权限');
    }

    const index = this.permissions.findIndex(p => p.equals(permission));
    if (index === -1) {
      throw new PermissionNotFoundError('权限不存在');
    }

    this.permissions.splice(index, 1);
  }

  /**
   * @method hasPermission
   * @description 检查角色是否具有指定权限
   * @param {Permission} permission 要检查的权限
   * @returns {boolean} 是否具有权限
   */
  hasPermission(permission: Permission): boolean {
    return this.permissions.some(p => p.equals(permission));
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

  /**
   * @method isActive
   * @description 检查角色是否为激活状态
   * @returns {boolean} 是否为激活状态
   */
  isActive(): boolean {
    return RoleStatusHelper.isActive(this.status);
  }

  /**
   * @method isUsable
   * @description 检查角色是否可用
   * @returns {boolean} 是否可用
   */
  isUsable(): boolean {
    return RoleStatusHelper.isUsable(this.status);
  }

  /**
   * @method canBeAssigned
   * @description 检查角色是否可以分配给新用户
   * @returns {boolean} 是否可以分配
   */
  canBeAssigned(): boolean {
    return RoleStatusHelper.canBeAssigned(this.status);
  }

  /**
   * @method canBeModified
   * @description 检查角色是否可以修改
   * @returns {boolean} 是否可以修改
   */
  canBeModified(): boolean {
    return (
      RoleStatusHelper.canBeModified(this.status) &&
      this.settings.canBeModified()
    );
  }

  /**
   * @method canBeDeleted
   * @description 检查角色是否可以删除
   * @returns {boolean} 是否可以删除
   */
  canBeDeleted(): boolean {
    return (
      RoleStatusHelper.canBeDeleted(this.status) && this.settings.canBeDeleted()
    );
  }

  /**
   * @method isExpired
   * @description 检查角色是否已过期
   * @returns {boolean} 是否已过期
   */
  isExpired(): boolean {
    return this.settings.isExpired();
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
   * @method validateRoleEntity
   * @description 验证角色实体的有效性
   * @returns {void}
   * @throws {InvalidRoleEntityError} 当角色实体无效时抛出
   * @private
   */
  private validateRoleEntity(): void {
    if (!this.id) {
      throw new InvalidRoleEntityError('角色ID不能为空');
    }

    if (!this.name) {
      throw new InvalidRoleEntityError('角色名称不能为空');
    }

    if (!this.type) {
      throw new InvalidRoleEntityError('角色类型不能为空');
    }

    if (!this.settings) {
      throw new InvalidRoleEntityError('角色设置不能为空');
    }

    if (!this.tenantId) {
      throw new InvalidRoleEntityError('租户ID不能为空');
    }

    // 验证角色类型与组织/部门ID的一致性
    if (this.type === RoleType.ORGANIZATION && !this.organizationId) {
      throw new InvalidRoleEntityError('组织角色必须指定组织ID');
    }

    if (this.type === RoleType.DEPARTMENT && !this.departmentId) {
      throw new InvalidRoleEntityError('部门角色必须指定部门ID');
    }

    // 验证权限列表
    if (!Array.isArray(this.permissions)) {
      throw new InvalidRoleEntityError('权限列表必须是数组');
    }
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

/**
 * @class InvalidRoleEntityError
 * @description 无效角色实体错误
 * @extends Error
 */
export class InvalidRoleEntityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleEntityError';
  }
}
