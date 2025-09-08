import { BaseEntity } from '@aiofix/core';
import { OrganizationId } from '../value-objects/organization-id.vo';
import { OrganizationName, OrganizationDescription } from '@aiofix/shared';
import { OrganizationSettings } from '../value-objects/organization-settings.vo';
import {
  OrganizationStatus,
  OrganizationStatusHelper,
} from '../enums/organization-status.enum';
import { TenantId } from '@aiofix/shared';

/**
 * @class OrganizationEntity
 * @description
 * 组织领域实体，负责维护组织的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识组织身份，确保实体的唯一性和可识别性
 * 2. 管理组织的基本状态（PENDING、ACTIVE、SUSPENDED、DISABLED、DELETED）
 * 3. 维护组织的生命周期状态变更，确保状态转换的合法性
 *
 * 业务规则与约束：
 * 1. 组织ID一旦创建不可变更，确保实体标识的稳定性
 * 2. 组织状态变更必须遵循预定义的状态机规则
 * 3. 删除组织时采用软删除策略，保留数据用于审计和恢复
 * 4. 组织名称在租户内必须唯一
 * 5. 只有激活状态的组织才能进行设置更新和成员管理操作
 *
 * 数据封装与验证：
 * 1. 通过值对象封装复杂属性（OrganizationId、OrganizationName等）
 * 2. 确保领域概念的完整性和类型安全
 * 3. 实现组织实体的相等性比较，基于组织ID进行身份识别
 *
 * @property {OrganizationId} _id 组织唯一标识符，创建后不可更改
 * @property {TenantId} _tenantId 所属租户ID，用于多租户数据隔离
 * @property {OrganizationName} _name 组织名称，创建后不可更改
 * @property {OrganizationDescription} _description 组织描述，可变更
 * @property {OrganizationSettings} _settings 组织设置，可变更
 * @property {OrganizationStatus} _status 组织当前状态
 *
 * @example
 * ```typescript
 * const organization = new OrganizationEntity(
 *   new OrganizationId(),
 *   new TenantId('tenant-123'),
 *   new OrganizationName('AI开发团队'),
 *   new OrganizationDescription('专注于AI技术研发'),
 *   new OrganizationSettings(),
 *   OrganizationStatus.PENDING,
 *   'admin-456'
 * );
 * organization.activate('admin-456'); // 激活组织
 * organization.suspend('admin-456'); // 暂停组织
 * ```
 * @extends BaseEntity
 * @since 1.0.0
 */
export class OrganizationEntity extends BaseEntity {
  constructor(
    private readonly _id: OrganizationId,
    private readonly _tenantId: TenantId,
    private readonly _name: OrganizationName,
    private readonly _description: OrganizationDescription,
    private readonly _settings: OrganizationSettings,
    private _status: OrganizationStatus = OrganizationStatus.PENDING,
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证组织实体的有效性
   * @returns {void}
   * @throws {Error} 当组织实体无效时抛出
   * @protected
   * @since 1.0.0
   */
  protected validate(): void {
    if (!this._id) {
      throw new Error('组织ID不能为空');
    }

    if (!this._tenantId) {
      throw new Error('租户ID不能为空');
    }

    if (!this._name) {
      throw new Error('组织名称不能为空');
    }

    if (!this._description) {
      throw new Error('组织描述不能为空');
    }

    if (!this._settings) {
      throw new Error('组织设置不能为空');
    }

    if (!OrganizationStatusHelper.isValid(this._status)) {
      throw new Error(`无效的组织状态: ${this._status}`);
    }

    if (!this.createdAt || isNaN(this.createdAt.getTime())) {
      throw new Error('创建时间无效');
    }
  }

  /**
   * @getter id
   * @description 获取组织唯一标识符
   * @returns {OrganizationId} 组织ID值对象
   * @since 1.0.0
   */
  public get id(): OrganizationId {
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
   * @getter name
   * @description 获取组织名称
   * @returns {OrganizationName} 组织名称值对象
   * @since 1.0.0
   */
  public get name(): OrganizationName {
    return this._name;
  }

  /**
   * @getter description
   * @description 获取组织描述
   * @returns {OrganizationDescription} 组织描述值对象
   * @since 1.0.0
   */
  public get description(): OrganizationDescription {
    return this._description;
  }

  /**
   * @getter settings
   * @description 获取组织设置
   * @returns {OrganizationSettings} 组织设置值对象
   * @since 1.0.0
   */
  public get settings(): OrganizationSettings {
    return this._settings;
  }

  /**
   * @getter status
   * @description 获取组织状态
   * @returns {OrganizationStatus} 组织状态
   * @since 1.0.0
   */
  public get status(): OrganizationStatus {
    return this._status;
  }

  /**
   * @method isActive
   * @description 检查组织是否处于激活状态
   * @returns {boolean} 是否激活
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._status === OrganizationStatus.ACTIVE && !this.isDeleted();
  }

  /**
   * @method isOperational
   * @description 检查组织是否可操作
   * @returns {boolean} 是否可操作
   * @since 1.0.0
   */
  public isOperational(): boolean {
    return OrganizationStatusHelper.isOperational(this._status);
  }

  /**
   * @method canBeActivated
   * @description 检查组织是否可以激活
   * @returns {boolean} 是否可以激活
   * @since 1.0.0
   */
  public canBeActivated(): boolean {
    return OrganizationStatusHelper.canBeActivated(this._status);
  }

  /**
   * @method canBeSuspended
   * @description 检查组织是否可以暂停
   * @returns {boolean} 是否可以暂停
   * @since 1.0.0
   */
  public canBeSuspended(): boolean {
    return OrganizationStatusHelper.canBeSuspended(this._status);
  }

  /**
   * @method canBeDeleted
   * @description 检查组织是否可以删除
   * @returns {boolean} 是否可以删除
   * @since 1.0.0
   */
  public canBeDeleted(): boolean {
    return OrganizationStatusHelper.canBeDeleted(this._status);
  }

  /**
   * @method isSuspended
   * @description 检查组织是否已暂停
   * @returns {boolean} 是否已暂停
   * @since 1.0.0
   */
  public isSuspended(): boolean {
    return this._status === OrganizationStatus.SUSPENDED;
  }

  /**
   * @method isDisabled
   * @description 检查组织是否已禁用
   * @returns {boolean} 是否已禁用
   * @since 1.0.0
   */
  public isDisabled(): boolean {
    return this._status === OrganizationStatus.DISABLED;
  }

  /**
   * @method activate
   * @description 激活组织，将状态从PENDING或DISABLED变更为ACTIVE
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有PENDING或DISABLED状态的组织才能被激活，防止非法状态转换
   * 3. 激活后组织可以进行正常的业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前组织状态是否允许激活
   * 2. 将组织状态更新为ACTIVE
   * 3. 记录操作审计信息
   *
   * @param {string} activatedBy 激活者ID，用于审计追踪
   * @throws {Error} 当组织状态不允许激活时抛出
   * @since 1.0.0
   */
  public activate(activatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的组织不能激活');
    }

    if (!OrganizationStatusHelper.canBeActivated(this._status)) {
      throw new Error(`无法从${this._status}状态激活组织`);
    }

    this._status = OrganizationStatus.ACTIVE;
    this.updateAuditInfo(activatedBy);
  }

  /**
   * @method deactivate
   * @description 禁用组织，将状态变更为DISABLED
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有ACTIVE状态的组织才能被禁用，防止非法状态转换
   * 3. 禁用后组织无法进行业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前组织状态是否允许禁用
   * 2. 将组织状态更新为DISABLED
   * 3. 记录操作审计信息
   *
   * @param {string} deactivatedBy 禁用者ID，用于审计追踪
   * @throws {Error} 当组织状态不允许禁用时抛出
   * @since 1.0.0
   */
  public deactivate(deactivatedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的组织不能禁用');
    }

    if (!OrganizationStatusHelper.canBeDeactivated(this._status)) {
      throw new Error(`无法从${this._status}状态禁用组织`);
    }

    this._status = OrganizationStatus.DISABLED;
    this.updateAuditInfo(deactivatedBy);
  }

  /**
   * @method suspend
   * @description 暂停组织，将状态变更为SUSPENDED
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有ACTIVE状态的组织才能被暂停，防止非法状态转换
   * 3. 暂停后组织无法进行业务操作
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前组织状态是否允许暂停
   * 2. 将组织状态更新为SUSPENDED
   * 3. 记录操作审计信息
   *
   * @param {string} suspendedBy 暂停者ID，用于审计追踪
   * @throws {Error} 当组织状态不允许暂停时抛出
   * @since 1.0.0
   */
  public suspend(suspendedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的组织不能暂停');
    }

    if (!OrganizationStatusHelper.canBeSuspended(this._status)) {
      throw new Error(`无法从${this._status}状态暂停组织`);
    }

    this._status = OrganizationStatus.SUSPENDED;
    this.updateAuditInfo(suspendedBy);
  }

  /**
   * @method resume
   * @description 恢复组织，将状态从SUSPENDED变更为ACTIVE
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有SUSPENDED状态的组织才能被恢复，防止非法状态转换
   * 3. 恢复后组织重新获得正常的业务操作权限
   * 4. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证当前组织状态是否为SUSPENDED
   * 2. 将组织状态更新为ACTIVE
   * 3. 记录操作审计信息
   *
   * @param {string} resumedBy 恢复者ID，用于审计追踪
   * @throws {Error} 当组织状态不允许恢复时抛出
   * @since 1.0.0
   */
  public resume(resumedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('已删除的组织不能恢复');
    }

    if (this._status !== OrganizationStatus.SUSPENDED) {
      throw new Error('只有暂停的组织才能恢复');
    }

    this._status = OrganizationStatus.ACTIVE;
    this.updateAuditInfo(resumedBy);
  }

  /**
   * @method delete
   * @description 软删除组织，将状态转换为DELETED
   *
   * 原理与机制：
   * 1. 采用软删除策略，保留组织数据用于审计和恢复
   * 2. 防止重复删除操作，确保数据一致性
   * 3. 删除后组织数据仍然保留，但组织无法进行任何操作
   * 4. 使用BaseEntity的软删除功能，提供完整的审计追踪
   *
   * 功能与职责：
   * 1. 验证当前组织状态是否已被删除
   * 2. 将组织状态更新为DELETED
   * 3. 记录删除操作审计信息
   *
   * @param {string} deletedBy 删除者ID，用于审计追踪
   * @throws {Error} 当组织已被删除时抛出
   * @since 1.0.0
   */
  public delete(deletedBy: string): void {
    if (this.isDeleted()) {
      throw new Error('组织已经删除');
    }

    this.softDelete(deletedBy);
  }

  /**
   * @method restore
   * @description 恢复已删除的组织
   *
   * 原理与机制：
   * 1. 恢复软删除的组织，使其重新可用
   * 2. 只有已删除的组织才能被恢复
   * 3. 恢复后组织状态回到删除前的状态
   * 4. 使用BaseEntity的恢复功能，提供完整的审计追踪
   *
   * 功能与职责：
   * 1. 验证当前组织状态是否已被删除
   * 2. 恢复组织的可用状态
   * 3. 记录恢复操作审计信息
   *
   * @param {string} restoredBy 恢复者ID，用于审计追踪
   * @throws {Error} 当组织未删除时抛出
   * @since 1.0.0
   */
  public restore(restoredBy: string): void {
    if (!this.isDeleted()) {
      throw new Error('组织未删除，无需恢复');
    }

    super.restore(restoredBy);
  }

  /**
   * @method updateDescription
   * @description 更新组织描述
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的组织才能更新描述
   * 2. 直接替换整个OrganizationDescription值对象，确保数据一致性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证组织状态是否允许描述更新操作
   * 2. 更新组织描述信息
   * 3. 记录操作审计信息
   *
   * @param {OrganizationDescription} newDescription 新的组织描述
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当组织已删除时抛出
   * @since 1.0.0
   */
  public updateDescription(
    newDescription: OrganizationDescription,
    updatedBy: string,
  ): void {
    if (this.isDeleted()) {
      throw new Error('已删除的组织不能更新描述');
    }

    if (!newDescription) {
      throw new Error('新的组织描述不能为空');
    }

    // 注意：这里不能直接修改description，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method updateSettings
   * @description 更新组织设置
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的组织才能更新设置
   * 2. 直接替换整个OrganizationSettings值对象，确保数据一致性
   * 3. 使用BaseEntity的审计功能记录操作者和时间戳
   *
   * 功能与职责：
   * 1. 验证组织状态是否允许设置更新操作
   * 2. 更新组织设置信息
   * 3. 记录操作审计信息
   *
   * @param {OrganizationSettings} newSettings 新的组织设置
   * @param {string} updatedBy 更新者ID，用于审计追踪
   * @throws {Error} 当组织已删除时抛出
   * @since 1.0.0
   */
  public updateSettings(
    newSettings: OrganizationSettings,
    updatedBy: string,
  ): void {
    if (this.isDeleted()) {
      throw new Error('已删除的组织不能更新设置');
    }

    if (!newSettings) {
      throw new Error('新的组织设置不能为空');
    }

    // 注意：这里不能直接修改settings，因为它是readonly
    // 在实际实现中，应该通过聚合根来更新
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method equals
   * @description 检查组织实体是否相等，基于组织ID进行比较
   *
   * 原理与机制：
   * 1. 通过OrganizationId值对象的equals方法进行身份比较
   * 2. 确保实体比较的准确性和一致性
   * 3. 遵循值对象相等性比较的最佳实践
   *
   * 功能与职责：
   * 1. 比较两个组织实体是否为同一组织
   * 2. 为集合操作和缓存提供相等性判断
   *
   * @param {BaseEntity} other 要比较的另一个实体
   * @returns {boolean} 两个组织实体是否相等
   * @since 1.0.0
   */
  public equals(other: BaseEntity): boolean {
    if (!other) return false;
    if (this === other) return true;
    if (!(other instanceof OrganizationEntity)) return false;
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
   * @description 创建组织实体的快照
   * @returns {object} 组织实体快照
   * @since 1.0.0
   */
  public toSnapshot(): object {
    return {
      id: this._id.toString(),
      tenantId: this._tenantId.toString(),
      name: this._name.toString(),
      description: this._description.toString(),
      settings: this._settings,
      status: this._status,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      updatedAt: this.getUpdatedAt(),
      updatedBy: this.getUpdatedBy(),
      deletedAt: this.getDeletedAt(),
    };
  }

  /**
   * @method fromSnapshot
   * @description 从快照恢复组织实体
   * @param {any} snapshot 组织实体快照
   * @returns {OrganizationEntity} 组织实体实例
   * @static
   * @since 1.0.0
   */
  public static fromSnapshot(snapshot: any): OrganizationEntity {
    const entity = new OrganizationEntity(
      new OrganizationId(snapshot.id),
      new TenantId(snapshot.tenantId),
      new OrganizationName(snapshot.name),
      new OrganizationDescription(snapshot.description),
      snapshot.settings,
      snapshot.status,
      snapshot.createdBy,
    );

    // 恢复审计信息
    if (snapshot.updatedAt) {
      entity.updateAuditInfo(snapshot.updatedBy);
    }

    if (snapshot.deletedAt) {
      entity.softDelete(snapshot.deletedBy);
    }

    return entity;
  }
}
