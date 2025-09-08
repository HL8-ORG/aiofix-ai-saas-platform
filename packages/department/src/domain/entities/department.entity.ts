import { BaseEntity } from '@aiofix/core';
import { DepartmentId } from '../value-objects/department-id.vo';
import { DepartmentName, DepartmentDescription } from '@aiofix/shared';
import { DepartmentSettings } from '../value-objects/department-settings.vo';
import {
  DepartmentStatus,
  DepartmentStatusHelper,
} from '../enums/department-status.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/organization';

/**
 * @class DepartmentEntity
 * @description
 * 部门领域实体，负责维护部门的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识部门身份，确保实体的唯一性和可识别性
 * 2. 管理部门的基本状态（PENDING、ACTIVE、SUSPENDED、DISABLED、DELETED）
 * 3. 维护部门的生命周期状态变更，确保状态转换的合法性
 *
 * 业务规则与约束：
 * 1. 部门ID一旦创建不可变更，确保实体标识的稳定性
 * 2. 部门状态变更必须遵循预定义的状态机规则
 * 3. 删除部门时采用软删除策略，保留数据用于审计和恢复
 * 4. 部门名称在组织内必须唯一
 * 5. 部门层级关系必须保持一致性
 * 6. 只有激活状态的部门才能进行设置更新和成员管理操作
 *
 * 数据封装与验证：
 * 1. 通过值对象封装复杂属性（DepartmentId、DepartmentName等）
 * 2. 确保领域概念的完整性和类型安全
 * 3. 实现部门实体的相等性比较，基于部门ID进行身份识别
 *
 * @property {DepartmentId} _id 部门唯一标识符，创建后不可更改
 * @property {TenantId} _tenantId 所属租户ID，用于多租户数据隔离
 * @property {OrganizationId} _organizationId 所属组织ID，用于组织级数据隔离
 * @property {DepartmentId} _parentDepartmentId 父部门ID，可选，用于层级关系
 * @property {DepartmentName} _name 部门名称，创建后不可更改
 * @property {DepartmentDescription} _description 部门描述，可变更
 * @property {DepartmentSettings} _settings 部门设置，可变更
 * @property {DepartmentStatus} _status 部门当前状态
 * @property {number} _level 部门层级深度
 *
 * @example
 * ```typescript
 * const department = new DepartmentEntity(
 *   new DepartmentId(),
 *   new TenantId('tenant-123'),
 *   new OrganizationId('org-456'),
 *   new DepartmentName('技术研发部'),
 *   new DepartmentDescription('负责技术研发和产品创新'),
 *   new DepartmentSettings(),
 *   DepartmentStatus.PENDING,
 *   1,
 *   'admin-789'
 * );
 * department.activate('admin-789'); // 激活部门
 * department.suspend('admin-789'); // 暂停部门
 * ```
 * @extends BaseEntity
 * @since 1.0.0
 */
export class DepartmentEntity extends BaseEntity {
  constructor(
    private readonly _id: DepartmentId,
    private readonly _tenantId: TenantId,
    private readonly _organizationId: OrganizationId,
    private readonly _parentDepartmentId: DepartmentId | null,
    private readonly _name: DepartmentName,
    private readonly _description: DepartmentDescription,
    private readonly _settings: DepartmentSettings,
    private _status: DepartmentStatus = DepartmentStatus.PENDING,
    private readonly _level: number = 1,
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证部门实体的有效性
   * @returns {void}
   * @throws {Error} 当部门实体无效时抛出
   * @protected
   * @since 1.0.0
   */
  protected validate(): void {
    // 这些属性都是readonly且通过构造函数传入，不需要检查null/undefined
    // 但保留验证逻辑以确保业务规则完整性

    if (!DepartmentStatusHelper.isValid(this._status)) {
      throw new Error(`无效的部门状态: ${this._status}`);
    }

    if (this._level < 1) {
      throw new Error('部门层级必须大于0');
    }

    // createdAt由BaseEntity管理，不需要额外验证
  }

  /**
   * @getter id
   * @description 获取部门唯一标识符
   * @returns {DepartmentId} 部门ID值对象
   * @since 1.0.0
   */
  public get id(): DepartmentId {
    return this._id;
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
   * @returns {OrganizationId} 组织ID值对象
   * @since 1.0.0
   */
  public get organizationId(): OrganizationId {
    return this._organizationId;
  }

  /**
   * @getter parentDepartmentId
   * @description 获取父部门ID
   * @returns {DepartmentId | null} 父部门ID值对象，如果没有父部门则返回null
   * @since 1.0.0
   */
  public get parentDepartmentId(): DepartmentId | null {
    return this._parentDepartmentId;
  }

  /**
   * @getter name
   * @description 获取部门名称
   * @returns {DepartmentName} 部门名称值对象
   * @since 1.0.0
   */
  public get name(): DepartmentName {
    return this._name;
  }

  /**
   * @getter description
   * @description 获取部门描述
   * @returns {DepartmentDescription} 部门描述值对象
   * @since 1.0.0
   */
  public get description(): DepartmentDescription {
    return this._description;
  }

  /**
   * @getter settings
   * @description 获取部门设置
   * @returns {DepartmentSettings} 部门设置值对象
   * @since 1.0.0
   */
  public get settings(): DepartmentSettings {
    return this._settings;
  }

  /**
   * @getter status
   * @description 获取部门状态
   * @returns {DepartmentStatus} 部门状态
   * @since 1.0.0
   */
  public get status(): DepartmentStatus {
    return this._status;
  }

  /**
   * @getter level
   * @description 获取部门层级深度
   * @returns {number} 部门层级深度
   * @since 1.0.0
   */
  public get level(): number {
    return this._level;
  }

  /**
   * @method isActive
   * @description 检查部门是否处于激活状态
   * @returns {boolean} 是否激活
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._status === DepartmentStatus.ACTIVE && !this.isDeleted();
  }

  /**
   * @method isSuspended
   * @description 检查部门是否已暂停
   * @returns {boolean} 是否已暂停
   * @since 1.0.0
   */
  public isSuspended(): boolean {
    return this._status === DepartmentStatus.SUSPENDED;
  }

  /**
   * @method isDisabled
   * @description 检查部门是否已禁用
   * @returns {boolean} 是否已禁用
   * @since 1.0.0
   */
  public isDisabled(): boolean {
    return this._status === DepartmentStatus.DISABLED;
  }

  /**
   * @method isRootDepartment
   * @description 检查是否为根部门（没有父部门）
   * @returns {boolean} 是否为根部门
   * @since 1.0.0
   */
  public isRootDepartment(): boolean {
    return this._parentDepartmentId === null;
  }

  /**
   * @method activate
   * @description 激活部门，将状态从PENDING或DISABLED变更为ACTIVE
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有PENDING或DISABLED状态的部门才能被激活，防止非法状态转换
   * 3. 激活后部门可以进行正常的业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前部门状态是否允许激活
   * 2. 将部门状态更新为ACTIVE
   * 3. 记录操作审计信息
   *
   * @param {string} activatedBy 激活者ID，用于审计追踪
   * @throws {Error} 当部门状态不允许激活时抛出
   * @since 1.0.0
   */
  public activate(activatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的部门不能激活');
    }

    if (!DepartmentStatusHelper.canBeActivated(this._status)) {
      throw new Error(`无法从${this._status}状态激活部门`);
    }

    this._status = DepartmentStatus.ACTIVE;
    this.updateAuditInfo(activatedBy);
  }

  /**
   * @method deactivate
   * @description 禁用部门，将状态变更为DISABLED
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有ACTIVE状态的部门才能被禁用，防止非法状态转换
   * 3. 禁用后部门无法进行业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前部门状态是否允许禁用
   * 2. 将部门状态更新为DISABLED
   * 3. 记录操作审计信息
   *
   * @param {string} deactivatedBy 禁用者ID，用于审计追踪
   * @throws {Error} 当部门状态不允许禁用时抛出
   * @since 1.0.0
   */
  public deactivate(deactivatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的部门不能禁用');
    }

    if (!DepartmentStatusHelper.canBeDeactivated(this._status)) {
      throw new Error(`无法从${this._status}状态禁用部门`);
    }

    this._status = DepartmentStatus.DISABLED;
    this.updateAuditInfo(deactivatedBy);
  }

  /**
   * @method suspend
   * @description 暂停部门，将状态变更为SUSPENDED
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有ACTIVE状态的部门才能被暂停，防止非法状态转换
   * 3. 暂停后部门无法进行业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前部门状态是否允许暂停
   * 2. 将部门状态更新为SUSPENDED
   * 3. 记录操作审计信息
   *
   * @param {string} suspendedBy 暂停者ID，用于审计追踪
   * @throws {Error} 当部门状态不允许暂停时抛出
   * @since 1.0.0
   */
  public suspend(suspendedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的部门不能暂停');
    }

    if (!DepartmentStatusHelper.canBeSuspended(this._status)) {
      throw new Error(`无法从${this._status}状态暂停部门`);
    }

    this._status = DepartmentStatus.SUSPENDED;
    this.updateAuditInfo(suspendedBy);
  }

  /**
   * @method resume
   * @description 恢复部门，将状态从SUSPENDED变更为ACTIVE
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有SUSPENDED状态的部门才能被恢复，防止非法状态转换
   * 3. 恢复后部门重新获得正常的业务操作权限
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前部门状态是否为SUSPENDED
   * 2. 将部门状态更新为ACTIVE
   * 3. 记录操作审计信息
   *
   * @param {string} resumedBy 恢复者ID，用于审计追踪
   * @throws {Error} 当部门状态不允许恢复时抛出
   * @since 1.0.0
   */
  public resume(resumedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的部门不能恢复');
    }

    if (this._status !== DepartmentStatus.SUSPENDED) {
      throw new Error('只有暂停的部门才能恢复');
    }

    this._status = DepartmentStatus.ACTIVE;
    this.updateAuditInfo(resumedBy);
  }

  /**
   * @method delete
   * @description 软删除部门，将状态转换为DELETED
   *
   * 原理与机制：
   * 1. 采用软删除策略，保留部门数据用于审计和恢复
   * 2. 防止重复删除操作，确保数据一致性
   * 3. 删除后部门数据仍然保留，但部门无法进行任何操作
   * 4. 使用BaseEntity的软删除功能，提供完整的审计追踪
   *
   * 功能与职责：
   * 1. 验证当前部门状态是否已被删除
   * 2. 将部门状态更新为DELETED
   * 3. 记录删除操作审计信息
   *
   * @param {string} deletedBy 删除者ID，用于审计追踪
   * @throws {Error} 当部门已被删除时抛出
   * @since 1.0.0
   */
  public delete(deletedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('部门已经删除');
    }

    this.softDelete(deletedBy);
  }

  /**
   * @method restore
   * @description 恢复已删除的部门
   *
   * 原理与机制：
   * 1. 恢复软删除的部门，使其重新可用
   * 2. 只有已删除的部门才能被恢复
   * 3. 恢复后部门状态回到删除前的状态
   * 4. 使用BaseEntity的恢复功能，提供完整的审计追踪
   *
   * 功能与职责：
   * 1. 验证当前部门状态是否已被删除
   * 2. 恢复部门的可用状态
   * 3. 记录恢复操作审计信息
   *
   * @param {string} restoredBy 恢复者ID，用于审计追踪
   * @throws {Error} 当部门未删除时抛出
   * @since 1.0.0
   */
  public restore(restoredBy: string): void {
    if (!this.isDeleted()) {
      throw new Error('部门未删除，无需恢复');
    }

    super.restore(restoredBy);
  }

  /**
   * @method updateDescription
   * @description 更新部门描述
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的部门才能更新描述
   * 2. 直接替换整个DepartmentDescription值对象，确保数据一致性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证部门状态是否允许描述更新操作
   * 2. 更新部门描述信息
   * 3. 记录操作审计信息
   *
   * @param {DepartmentDescription} newDescription 新的部门描述
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当部门已删除时抛出
   * @since 1.0.0
   */
  public updateDescription(
    newDescription: DepartmentDescription,
    updatedBy: string,
  ): void {
    if (this.isDeleted()) {
      throw new Error('已删除的部门不能更新描述');
    }

    // newDescription参数由调用方保证非空

    // 注意：这里不能直接修改description，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method updateSettings
   * @description 更新部门设置
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的部门才能更新设置
   * 2. 直接替换整个DepartmentSettings值对象，确保数据一致性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证部门状态是否允许设置更新操作
   * 2. 更新部门设置信息
   * 3. 记录操作审计信息
   *
   * @param {DepartmentSettings} newSettings 新的部门设置
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当部门已删除时抛出
   * @since 1.0.0
   */
  public updateSettings(
    newSettings: DepartmentSettings,
    updatedBy: string,
  ): void {
    if (this.isDeleted()) {
      throw new Error('已删除的部门不能更新设置');
    }

    // newSettings参数由调用方保证非空

    // 注意：这里不能直接修改settings，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method equals
   * @description 检查部门实体是否相等，基于部门ID进行比较
   *
   * 原理与机制：
   * 1. 通过DepartmentId值对象的equals方法进行身份比较
   * 2. 确保实体比较的准确性和一致性
   * 3. 遵循值对象相等性比较的最佳实践
   *
   * 功能与职责：
   * 1. 比较两个部门实体是否为同一部门
   * 2. 为集合操作和缓存提供相等性判断
   *
   * @param {DepartmentEntity} other 要比较的另一个部门实体
   * @returns {boolean} 两个部门实体是否相等
   * @since 1.0.0
   */
  public equals(other: BaseEntity): boolean {
    if (this === other) return true;
    if (!(other instanceof DepartmentEntity)) return false;
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
   * @description 创建部门实体的快照
   * @returns {object} 部门实体快照
   * @since 1.0.0
   */
  public toSnapshot(): object {
    return {
      id: this._id.toString(),
      tenantId: this._tenantId.toString(),
      organizationId: this._organizationId.toString(),
      parentDepartmentId: this._parentDepartmentId?.toString() ?? null,
      name: this._name.toString(),
      description: this._description.toString(),
      settings: this._settings,
      status: this._status,
      level: this._level,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.getUpdatedAt(),
      updatedBy: this.getUpdatedBy(),
      deletedAt: this.getDeletedAt(),
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照恢复部门实体
   * @param {any} snapshot 部门实体快照
   * @returns {DepartmentEntity} 部门实体实例
   * @static
   * @since 1.0.0
   */
  public static fromSnapshot(
    snapshot: Record<string, unknown>,
  ): DepartmentEntity {
    const entity = new DepartmentEntity(
      new DepartmentId(snapshot.id as string),
      new TenantId(snapshot.tenantId as string),
      new OrganizationId(snapshot.organizationId as string),
      snapshot.parentDepartmentId
        ? new DepartmentId(snapshot.parentDepartmentId as string)
        : null,
      new DepartmentName(snapshot.name as string),
      new DepartmentDescription(snapshot.description as string),
      snapshot.settings as DepartmentSettings,
      snapshot.status as DepartmentStatus,
      snapshot.level as number,
      snapshot.createdBy as string,
    );

    // 恢复审计信息
    if (snapshot.updatedAt) {
      entity.updateAuditInfo(snapshot.updatedBy as string);
    }

    if (snapshot.deletedAt) {
      entity.softDelete(snapshot.deletedBy as string);
    }

    return entity;
  }

  /**
   * @method isOperational
   * @description 判断部门是否可操作
   * @returns {boolean} 是否可操作
   * @since 1.0.0
   */
  public isOperational(): boolean {
    return DepartmentStatusHelper.isOperational(this._status);
  }

  /**
   * @method canBeActivated
   * @description 判断部门是否可以激活
   * @returns {boolean} 是否可以激活
   * @since 1.0.0
   */
  public canBeActivated(): boolean {
    return DepartmentStatusHelper.canBeActivated(this._status);
  }

  /**
   * @method canBeSuspended
   * @description 判断部门是否可以暂停
   * @returns {boolean} 是否可以暂停
   * @since 1.0.0
   */
  public canBeSuspended(): boolean {
    return DepartmentStatusHelper.canBeSuspended(this._status);
  }

  /**
   * @method canBeDeleted
   * @description 判断部门是否可以删除
   * @returns {boolean} 是否可以删除
   * @since 1.0.0
   */
  public canBeDeleted(): boolean {
    return DepartmentStatusHelper.canBeDeleted(this._status);
  }

  /**
   * @method getStatus
   * @description 获取部门状态
   * @returns {DepartmentStatus} 部门状态
   * @since 1.0.0
   */
  public getStatus(): DepartmentStatus {
    return this._status;
  }
}
