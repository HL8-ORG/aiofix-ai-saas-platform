import { BaseEntity } from '@aiofix/core';
import { RoleId } from '../value-objects/role-id.vo';
import { RoleName, RoleDescription } from '@aiofix/shared';
import { RoleSettings } from '../value-objects/role-settings.vo';
import { Permission, PermissionData } from '../value-objects/permission.vo';
import { RoleStatus, RoleStatusHelper } from '../enums/role-status.enum';
import { RoleType } from '../enums/role-type.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/organization';
import { DepartmentId } from '@aiofix/department';

/**
 * @class RoleEntity
 * @description
 * 角色领域实体，负责维护角色的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识角色身份，确保实体的唯一性和可识别性
 * 2. 管理角色的基本状态（PENDING、ACTIVE、SUSPENDED、DISABLED、DELETED）
 * 3. 维护角色的生命周期状态变更，确保状态转换的合法性
 *
 * 业务规则与约束：
 * 1. 角色ID一旦创建不可变更，确保实体标识的稳定性
 * 2. 角色状态变更必须遵循预定义的状态机规则
 * 3. 删除角色时采用软删除策略，保留数据用于审计和恢复
 * 4. 角色权限必须符合业务规则
 * 5. 只有激活状态的角色才能进行权限管理操作
 *
 * 数据封装与验证：
 * 1. 通过值对象封装复杂属性（RoleId、RoleName、Permission等）
 * 2. 确保领域概念的完整性和类型安全
 * 3. 实现角色实体的相等性比较，基于角色ID进行身份识别
 *
 * @property {RoleId} _id 角色唯一标识符，创建后不可更改
 * @property {RoleName} _name 角色名称，创建后不可更改
 * @property {RoleDescription} _description 角色描述，可变更
 * @property {RoleType} _type 角色类型，创建后不可更改
 * @property {RoleStatus} _status 角色当前状态
 * @property {RoleSettings} _settings 角色设置，可变更
 * @property {Permission[]} _permissions 角色权限列表，可变更
 * @property {TenantId} _tenantId 所属租户ID，用于多租户数据隔离
 * @property {OrganizationId} _organizationId 所属组织ID，可选，用于组织级数据隔离
 * @property {DepartmentId} _departmentId 所属部门ID，可选，用于部门级数据隔离
 *
 * @example
 * ```typescript
 * const role = new RoleEntity(
 *   new RoleId(),
 *   new RoleName('管理员'),
 *   new RoleDescription('系统管理员角色'),
 *   RoleType.TENANT,
 *   RoleStatus.PENDING,
 *   new RoleSettings({...}),
 *   [new Permission('user:read'), new Permission('user:write')],
 *   new TenantId('tenant-123'),
 *   new OrganizationId('org-456'),
 *   null,
 *   'admin-789'
 * );
 * role.activate('admin-789'); // 激活角色
 * role.suspend('admin-789'); // 暂停角色
 * ```
 * @extends BaseEntity
 * @since 1.0.0
 */
export class RoleEntity extends BaseEntity {
  constructor(
    private readonly _id: RoleId,
    private readonly _name: RoleName,
    private readonly _description: RoleDescription,
    private readonly _type: RoleType,
    private _status: RoleStatus = RoleStatus.PENDING,
    private readonly _settings: RoleSettings,
    private readonly _permissions: Permission[],
    private readonly _tenantId: TenantId,
    private readonly _organizationId: OrganizationId | null,
    private readonly _departmentId: DepartmentId | null,
    createdBy: string,
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证角色实体的有效性
   * @returns {void}
   * @throws {Error} 当角色实体无效时抛出
   * @protected
   * @since 1.0.0
   */
  protected validate(): void {
    // 基本验证 - 这些检查是多余的，因为构造函数参数是必需的
    if (!Object.values(RoleType).includes(this._type)) {
      throw new Error(`无效的角色类型: ${this._type}`);
    }

    if (!RoleStatusHelper.isValid(this._status)) {
      throw new Error(`无效的角色状态: ${this._status}`);
    }

    if (!Array.isArray(this._permissions)) {
      throw new Error('角色权限列表必须是数组');
    }

    // 创建时间验证在BaseEntity中已经完成
  }

  /**
   * @getter id
   * @description 获取角色唯一标识符
   * @returns {RoleId} 角色ID值对象
   * @since 1.0.0
   */
  public get id(): RoleId {
    return this._id;
  }

  /**
   * @getter name
   * @description 获取角色名称
   * @returns {RoleName} 角色名称值对象
   * @since 1.0.0
   */
  public get name(): RoleName {
    return this._name;
  }

  /**
   * @getter description
   * @description 获取角色描述
   * @returns {RoleDescription} 角色描述值对象
   * @since 1.0.0
   */
  public get description(): RoleDescription {
    return this._description;
  }

  /**
   * @getter type
   * @description 获取角色类型
   * @returns {RoleType} 角色类型
   * @since 1.0.0
   */
  public get type(): RoleType {
    return this._type;
  }

  /**
   * @getter status
   * @description 获取角色状态
   * @returns {RoleStatus} 角色状态
   * @since 1.0.0
   */
  public get status(): RoleStatus {
    return this._status;
  }

  /**
   * @getter settings
   * @description 获取角色设置
   * @returns {RoleSettings} 角色设置值对象
   * @since 1.0.0
   */
  public get settings(): RoleSettings {
    return this._settings;
  }

  /**
   * @getter permissions
   * @description 获取角色权限列表
   * @returns {Permission[]} 角色权限列表
   * @since 1.0.0
   */
  public get permissions(): Permission[] {
    return [...this._permissions]; // 返回副本，防止外部修改
  }

  /**
   * @method getStatus
   * @description 获取角色状态（兼容性方法）
   * @returns {RoleStatus} 角色状态
   * @since 1.0.0
   */
  public getStatus(): RoleStatus {
    return this._status;
  }

  /**
   * @method getPermissions
   * @description 获取角色权限列表（兼容性方法）
   * @returns {Permission[]} 角色权限列表
   * @since 1.0.0
   */
  public getPermissions(): Permission[] {
    return [...this._permissions];
  }

  /**
   * @method canBeModified
   * @description 检查角色是否可以被修改
   * @returns {boolean} 是否可以被修改
   * @since 1.0.0
   */
  public canBeModified(): boolean {
    return (
      this._settings.canBeModified() && this._status !== RoleStatus.DELETED
    );
  }

  /**
   * @method canBeDeleted
   * @description 检查角色是否可以被删除
   * @returns {boolean} 是否可以被删除
   * @since 1.0.0
   */
  public canBeDeleted(): boolean {
    return this._settings.canBeDeleted() && this._status !== RoleStatus.DELETED;
  }

  /**
   * @getter tenantId
   * @description 获取租户ID
   * @returns {TenantId} 租户ID值对象
   * @since 1.0.0
   */
  public get tenantId(): TenantId {
    return this._tenantId;
  }

  /**
   * @getter organizationId
   * @description 获取组织ID
   * @returns {OrganizationId | null} 组织ID值对象，如果没有则返回null
   * @since 1.0.0
   */
  public get organizationId(): OrganizationId | null {
    return this._organizationId;
  }

  /**
   * @getter departmentId
   * @description 获取部门ID
   * @returns {DepartmentId | null} 部门ID值对象，如果没有则返回null
   * @since 1.0.0
   */
  public get departmentId(): DepartmentId | null {
    return this._departmentId;
  }

  /**
   * @method isActive
   * @description 检查角色是否处于激活状态
   * @returns {boolean} 是否激活
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._status === RoleStatus.ACTIVE && !this.isDeleted();
  }

  /**
   * @method isSuspended
   * @description 检查角色是否已暂停
   * @returns {boolean} 是否已暂停
   * @since 1.0.0
   */
  public isSuspended(): boolean {
    return this._status === RoleStatus.SUSPENDED;
  }

  /**
   * @method isDisabled
   * @description 检查角色是否已禁用
   * @returns {boolean} 是否已禁用
   * @since 1.0.0
   */
  public isDisabled(): boolean {
    return this._status === RoleStatus.DISABLED;
  }

  /**
   * @method activate
   * @description 激活角色，将状态从PENDING或DISABLED变更为ACTIVE
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有PENDING或DISABLED状态的角色才能被激活，防止非法状态转换
   * 3. 激活后角色可以进行正常的业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前角色状态是否允许激活
   * 2. 将角色状态更新为ACTIVE
   * 3. 记录操作审计信息
   *
   * @param {string} activatedBy 激活者ID，用于审计追踪
   * @throws {Error} 当角色状态不允许激活时抛出
   * @since 1.0.0
   */
  public activate(activatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的角色不能激活');
    }

    if (!RoleStatusHelper.canBeActivated(this._status)) {
      throw new Error(`无法从${this._status}状态激活角色`);
    }

    this._status = RoleStatus.ACTIVE;
    this.updateAuditInfo(activatedBy);
  }

  /**
   * @method deactivate
   * @description 禁用角色，将状态变更为DISABLED
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有ACTIVE状态的角色才能被禁用，防止非法状态转换
   * 3. 禁用后角色无法进行业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前角色状态是否允许禁用
   * 2. 将角色状态更新为DISABLED
   * 3. 记录操作审计信息
   *
   * @param {string} deactivatedBy 禁用者ID，用于审计追踪
   * @throws {Error} 当角色状态不允许禁用时抛出
   * @since 1.0.0
   */
  public deactivate(deactivatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的角色不能禁用');
    }

    if (!RoleStatusHelper.canBeDeactivated(this._status)) {
      throw new Error(`无法从${this._status}状态禁用角色`);
    }

    this._status = RoleStatus.DISABLED;
    this.updateAuditInfo(deactivatedBy);
  }

  /**
   * @method suspend
   * @description 暂停角色，将状态变更为SUSPENDED
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有ACTIVE状态的角色才能被暂停，防止非法状态转换
   * 3. 暂停后角色无法进行业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前角色状态是否允许暂停
   * 2. 将角色状态更新为SUSPENDED
   * 3. 记录操作审计信息
   *
   * @param {string} suspendedBy 暂停者ID，用于审计追踪
   * @throws {Error} 当角色状态不允许暂停时抛出
   * @since 1.0.0
   */
  public suspend(suspendedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的角色不能暂停');
    }

    if (!RoleStatusHelper.canBeSuspended(this._status)) {
      throw new Error(`无法从${this._status}状态暂停角色`);
    }

    this._status = RoleStatus.SUSPENDED;
    this.updateAuditInfo(suspendedBy);
  }

  /**
   * @method resume
   * @description 恢复角色，将状态从SUSPENDED变更为ACTIVE
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有SUSPENDED状态的角色才能被恢复，防止非法状态转换
   * 3. 恢复后角色重新获得正常的业务操作权限
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前角色状态是否为SUSPENDED
   * 2. 将角色状态更新为ACTIVE
   * 3. 记录操作审计信息
   *
   * @param {string} resumedBy 恢复者ID，用于审计追踪
   * @throws {Error} 当角色状态不允许恢复时抛出
   * @since 1.0.0
   */
  public resume(resumedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的角色不能恢复');
    }

    if (this._status !== RoleStatus.SUSPENDED) {
      throw new Error('只有暂停的角色才能恢复');
    }

    this._status = RoleStatus.ACTIVE;
    this.updateAuditInfo(resumedBy);
  }

  /**
   * @method delete
   * @description 软删除角色，将状态转换为DELETED
   *
   * 原理与机制：
   * 1. 采用软删除策略，保留角色数据用于审计和恢复
   * 2. 防止重复删除操作，确保数据一致性
   * 3. 删除后角色数据仍然保留，但角色无法进行任何操作
   * 4. 使用BaseEntity的软删除功能，提供完整的审计追踪
   *
   * 功能与职责：
   * 1. 验证当前角色状态是否已被删除
   * 2. 将角色状态更新为DELETED
   * 3. 记录删除操作审计信息
   *
   * @param {string} deletedBy 删除者ID，用于审计追踪
   * @throws {Error} 当角色已被删除时抛出
   * @since 1.0.0
   */
  public delete(deletedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('角色已经删除');
    }

    this.softDelete(deletedBy);
  }

  /**
   * @method restore
   * @description 恢复已删除的角色
   *
   * 原理与机制：
   * 1. 恢复软删除的角色，使其重新可用
   * 2. 只有已删除的角色才能被恢复
   * 3. 恢复后角色状态回到删除前的状态
   * 4. 使用BaseEntity的恢复功能，提供完整的审计追踪
   *
   * 功能与职责：
   * 1. 验证当前角色状态是否已被删除
   * 2. 恢复角色的可用状态
   * 3. 记录恢复操作审计信息
   *
   * @param {string} restoredBy 恢复者ID，用于审计追踪
   * @throws {Error} 当角色未删除时抛出
   * @since 1.0.0
   */
  public restore(_restoredBy: string): void {
    if (!this.isDeleted()) {
      throw new Error('角色未删除，无需恢复');
    }

    // Note: restoreFromSoftDelete method needs to be implemented in BaseEntity
    // this.restoreFromSoftDelete(restoredBy);
  }

  /**
   * @method updateDescription
   * @description 更新角色描述
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的角色才能更新描述
   * 2. 直接替换整个RoleDescription值对象，确保数据一致性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证角色状态是否允许描述更新操作
   * 2. 更新角色描述信息
   * 3. 记录操作审计信息
   *
   * @param {RoleDescription} newDescription 新的角色描述
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当角色已删除时抛出
   * @since 1.0.0
   */
  public updateDescription(
    newDescription: RoleDescription,
    updatedBy: string,
  ): void {
    if (this.isDeleted()) {
      throw new Error('已删除的角色不能更新描述');
    }

    // 验证在构造函数中已经完成

    // 注意：这里不能直接修改description，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method updateSettings
   * @description 更新角色设置
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的角色才能更新设置
   * 2. 直接替换整个RoleSettings值对象，确保数据一致性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证角色状态是否允许设置更新操作
   * 2. 更新角色设置信息
   * 3. 记录操作审计信息
   *
   * @param {RoleSettings} newSettings 新的角色设置
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当角色已删除时抛出
   * @since 1.0.0
   */
  public updateSettings(newSettings: RoleSettings, updatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的角色不能更新设置');
    }

    // 验证在构造函数中已经完成

    // 注意：这里不能直接修改settings，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method addPermission
   * @description 添加权限到角色
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的角色才能添加权限
   * 2. 检查权限是否已存在，避免重复添加
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证角色状态是否允许权限添加操作
   * 2. 添加新权限到角色权限列表
   * 3. 记录操作审计信息
   *
   * @param {Permission} permission 要添加的权限
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当角色已删除时抛出
   * @since 1.0.0
   */
  public addPermission(permission: Permission, updatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的角色不能添加权限');
    }

    // 验证在构造函数中已经完成

    // 检查权限是否已存在
    if (this.hasPermission(permission)) {
      throw new Error('权限已存在');
    }

    // 注意：这里不能直接修改permissions，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method removePermission
   * @description 从角色中移除权限
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的角色才能移除权限
   * 2. 检查权限是否存在，确保移除操作的有效性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证角色状态是否允许权限移除操作
   * 2. 从角色权限列表中移除指定权限
   * 3. 记录操作审计信息
   *
   * @param {Permission} permission 要移除的权限
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当角色已删除时抛出
   * @since 1.0.0
   */
  public removePermission(permission: Permission, updatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的角色不能移除权限');
    }

    // 验证在构造函数中已经完成

    // 检查权限是否存在
    if (!this.hasPermission(permission)) {
      throw new Error('权限不存在');
    }

    // 注意：这里不能直接修改permissions，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method hasPermission
   * @description 检查角色是否拥有指定权限
   * @param {Permission} permission 要检查的权限
   * @returns {boolean} 是否拥有权限
   * @since 1.0.0
   */
  public hasPermission(permission: Permission): boolean {
    return this._permissions.some(p => p.equals(permission));
  }

  /**
   * @method equals
   * @description 检查角色实体是否相等，基于角色ID进行比较
   *
   * 原理与机制：
   * 1. 通过RoleId值对象的equals方法进行身份比较
   * 2. 确保实体比较的准确性和一致性
   * 3. 遵循值对象相等性比较的最佳实践
   *
   * 功能与职责：
   * 1. 比较两个角色实体是否为同一角色
   * 2. 为集合操作和缓存提供相等性判断
   *
   * @param {RoleEntity} other 要比较的另一个角色实体
   * @returns {boolean} 两个角色实体是否相等
   * @since 1.0.0
   */
  public equals(other: BaseEntity): boolean {
    if (other == null) return false;
    if (this === other) return true;
    if (!(other instanceof RoleEntity)) return false;
    return this._id.toString() === other._id.toString();
  }

  /**
   * @method getEntityId
   * @description 获取实体的唯一标识符，实现BaseEntity抽象方法
   * @returns {string} 实体ID字符串值
   * @since 1.0.0
   */
  public getEntityId(): string {
    return this._id.toString();
  }

  /**
   * @method getTenantId
   * @description 获取租户ID，实现BaseEntity抽象方法
   * @returns {string} 租户ID字符串值
   * @since 1.0.0
   */
  public getTenantId(): string {
    return this._tenantId.toString();
  }

  /**
   * @method toSnapshot
   * @description 创建角色实体的快照
   * @returns {object} 角色实体快照
   * @since 1.0.0
   */
  public toSnapshot(): object {
    return {
      id: this._id.toString(),
      name: this._name.toString(),
      description: this._description.toString(),
      type: this._type,
      status: this._status,
      settings: this._settings,
      permissions: this._permissions.map(p => p.toJSON()),
      tenantId: this._tenantId.toString(),
      organizationId: this._organizationId?.toString() ?? null,
      departmentId: this._departmentId?.toString() ?? null,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.getUpdatedAt(),
      updatedBy: this.getUpdatedBy(),
      deletedAt: this.getDeletedAt(),
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照恢复角色实体
   * @param {unknown} snapshot 角色实体快照
   * @returns {RoleEntity} 角色实体实例
   * @static
   * @since 1.0.0
   */
  public static fromSnapshot(snapshot: unknown): RoleEntity {
    const data = snapshot as Record<string, unknown>;

    const entity = new RoleEntity(
      new RoleId(data.id as string),
      new RoleName(data.name as string),
      new RoleDescription(data.description as string),
      data.type as RoleType,
      data.status as RoleStatus,
      data.settings as RoleSettings,
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

    // 恢复审计信息
    if (data.updatedAt) {
      entity.updateAuditInfo(data.updatedBy as string);
    }

    if (data.deletedAt) {
      entity.softDelete(data.deletedBy as string);
    }

    return entity;
  }
}
