import { OrganizationId } from '../value-objects/organization-id.vo';
import { OrganizationName } from '../value-objects/organization-name.vo';
import { OrganizationDescription } from '../value-objects/organization-description.vo';
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
 * 1. 通过唯一ID标识组织身份
 * 2. 管理组织的基本状态（活跃、非活跃、暂停、删除）
 * 3. 维护组织的生命周期状态变更
 *
 * 业务规则与约束：
 * 1. 组织ID一旦创建不可变更
 * 2. 组织状态变更必须遵循预定义的状态机
 * 3. 删除组织时采用软删除策略
 * 4. 组织名称在租户内必须唯一
 *
 * @property {OrganizationId} id 组织唯一标识符，不可变更
 * @property {TenantId} tenantId 所属租户ID，不可变更
 * @property {OrganizationName} name 组织名称，不可变更
 * @property {OrganizationDescription} description 组织描述，可变更
 * @property {OrganizationSettings} settings 组织设置，可变更
 * @property {OrganizationStatus} status 组织当前状态
 * @property {Date} createdAt 组织创建时间
 * @property {Date} updatedAt 组织最后更新时间
 * @property {Date} deletedAt 组织删除时间（软删除）
 *
 * @example
 * ```typescript
 * const organization = new OrganizationEntity(
 *   new OrganizationId(),
 *   new TenantId('tenant-123'),
 *   new OrganizationName('AI开发团队'),
 *   new OrganizationDescription('专注于AI技术研发')
 * );
 * organization.activate(); // 激活组织
 * organization.suspend(); // 暂停组织
 * ```
 * @since 1.0.0
 */
export class OrganizationEntity {
  constructor(
    public readonly id: OrganizationId,
    public readonly tenantId: TenantId,
    public readonly name: OrganizationName,
    public readonly description: OrganizationDescription,
    public readonly settings: OrganizationSettings,
    private status: OrganizationStatus = OrganizationStatus.INACTIVE,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly deletedAt: Date | null = null,
  ) {
    this.validateOrganizationEntity();
  }

  /**
   * @method validateOrganizationEntity
   * @description 验证组织实体的有效性
   * @returns {void}
   * @throws {InvalidOrganizationEntityError} 当组织实体无效时抛出
   * @private
   */
  private validateOrganizationEntity(): void {
    if (!this.id) {
      throw new InvalidOrganizationEntityError('组织ID不能为空');
    }

    if (!this.tenantId) {
      throw new InvalidOrganizationEntityError('租户ID不能为空');
    }

    if (!this.name) {
      throw new InvalidOrganizationEntityError('组织名称不能为空');
    }

    if (!this.settings) {
      throw new InvalidOrganizationEntityError('组织设置不能为空');
    }

    if (!OrganizationStatusHelper.isValid(this.status)) {
      throw new InvalidOrganizationEntityError(
        `无效的组织状态: ${this.status}`,
      );
    }
  }

  /**
   * @method activate
   * @description 激活组织，将状态从INACTIVE或SUSPENDED变更为ACTIVE
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  activate(): void {
    if (!OrganizationStatusHelper.canBeActivated(this.status)) {
      throw new InvalidStateTransitionError(`无法从${this.status}状态激活组织`);
    }

    this.status = OrganizationStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * @method deactivate
   * @description 停用组织，将状态从ACTIVE变更为INACTIVE
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  deactivate(): void {
    if (this.status !== OrganizationStatus.ACTIVE) {
      throw new InvalidStateTransitionError(`无法从${this.status}状态停用组织`);
    }

    this.status = OrganizationStatus.INACTIVE;
    this.updateTimestamp();
  }

  /**
   * @method suspend
   * @description 暂停组织，将状态从ACTIVE或INACTIVE变更为SUSPENDED
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  suspend(): void {
    if (!OrganizationStatusHelper.canBeSuspended(this.status)) {
      throw new InvalidStateTransitionError(`无法从${this.status}状态暂停组织`);
    }

    this.status = OrganizationStatus.SUSPENDED;
    this.updateTimestamp();
  }

  /**
   * @method delete
   * @description 删除组织，将状态变更为DELETED（软删除）
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  delete(): void {
    if (!OrganizationStatusHelper.canBeDeleted(this.status)) {
      throw new InvalidStateTransitionError(`无法从${this.status}状态删除组织`);
    }

    this.status = OrganizationStatus.DELETED;
    this.updateTimestamp();
  }

  /**
   * @method isActive
   * @description 判断组织是否为活跃状态
   * @returns {boolean} 是否为活跃状态
   */
  isActive(): boolean {
    return OrganizationStatusHelper.isActive(this.status);
  }

  /**
   * @method isOperational
   * @description 判断组织是否可操作（非删除状态）
   * @returns {boolean} 是否可操作
   */
  isOperational(): boolean {
    return OrganizationStatusHelper.isOperational(this.status);
  }

  /**
   * @method canBeActivated
   * @description 判断组织是否可以激活
   * @returns {boolean} 是否可以激活
   */
  canBeActivated(): boolean {
    return OrganizationStatusHelper.canBeActivated(this.status);
  }

  /**
   * @method canBeSuspended
   * @description 判断组织是否可以暂停
   * @returns {boolean} 是否可以暂停
   */
  canBeSuspended(): boolean {
    return OrganizationStatusHelper.canBeSuspended(this.status);
  }

  /**
   * @method canBeDeleted
   * @description 判断组织是否可以删除
   * @returns {boolean} 是否可以删除
   */
  canBeDeleted(): boolean {
    return OrganizationStatusHelper.canBeDeleted(this.status);
  }

  /**
   * @method getStatus
   * @description 获取组织当前状态
   * @returns {OrganizationStatus} 组织状态
   */
  getStatus(): OrganizationStatus {
    return this.status;
  }

  /**
   * @method getStatusDisplayName
   * @description 获取状态显示名称
   * @returns {string} 状态显示名称
   */
  getStatusDisplayName(): string {
    return OrganizationStatusHelper.getDisplayName(this.status);
  }

  /**
   * @method updateTimestamp
   * @description 更新时间戳
   * @returns {void}
   * @private
   */
  private updateTimestamp(): void {
    (this as any).updatedAt = new Date();
  }

  /**
   * @method equals
   * @description 比较两个组织实体是否相等
   * @param {OrganizationEntity} other 另一个组织实体
   * @returns {boolean} 是否相等
   */
  equals(other: OrganizationEntity): boolean {
    if (!other) return false;
    return this.id.equals(other.id);
  }

  /**
   * @method clone
   * @description 克隆组织实体
   * @returns {OrganizationEntity} 克隆的组织实体
   */
  clone(): OrganizationEntity {
    return new OrganizationEntity(
      this.id,
      this.tenantId,
      this.name,
      this.description,
      this.settings,
      this.status,
      this.createdAt,
      this.updatedAt,
      this.deletedAt,
    );
  }
}

/**
 * @class InvalidOrganizationEntityError
 * @description 无效组织实体异常类
 * @extends Error
 */
export class InvalidOrganizationEntityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrganizationEntityError';
  }
}

/**
 * @class InvalidStateTransitionError
 * @description 无效状态转换异常类
 * @extends Error
 */
export class InvalidStateTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStateTransitionError';
  }
}
