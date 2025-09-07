import { DepartmentId } from '../value-objects/department-id.vo';
import { DepartmentName } from '../value-objects/department-name.vo';
import { DepartmentDescription } from '../value-objects/department-description.vo';
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
 * 1. 通过唯一ID标识部门身份
 * 2. 管理部门的基本状态（活跃、非活跃、暂停、删除）
 * 3. 维护部门的生命周期状态变更
 *
 * 业务规则与约束：
 * 1. 部门ID一旦创建不可变更
 * 2. 部门状态变更必须遵循预定义的状态机
 * 3. 删除部门时采用软删除策略
 * 4. 部门名称在组织内必须唯一
 * 5. 部门层级关系必须保持一致性
 *
 * @property {DepartmentId} id 部门唯一标识符，不可变更
 * @property {TenantId} tenantId 所属租户ID，不可变更
 * @property {OrganizationId} organizationId 所属组织ID，不可变更
 * @property {DepartmentId} parentDepartmentId 父部门ID，可选
 * @property {DepartmentName} name 部门名称，不可变更
 * @property {DepartmentDescription} description 部门描述，可变更
 * @property {DepartmentSettings} settings 部门设置，可变更
 * @property {DepartmentStatus} status 部门当前状态
 * @property {number} level 部门层级深度
 * @property {Date} createdAt 部门创建时间
 * @property {Date} updatedAt 部门最后更新时间
 * @property {Date} deletedAt 部门删除时间（软删除）
 *
 * @example
 * ```typescript
 * const department = new DepartmentEntity(
 *   new DepartmentId(),
 *   new TenantId('tenant-123'),
 *   new OrganizationId('org-456'),
 *   new DepartmentName('技术研发部'),
 *   new DepartmentDescription('负责技术研发和产品创新')
 * );
 * department.activate(); // 激活部门
 * department.suspend(); // 暂停部门
 * ```
 * @since 1.0.0
 */
export class DepartmentEntity {
  constructor(
    public readonly id: DepartmentId,
    public readonly tenantId: TenantId,
    public readonly organizationId: OrganizationId,
    public readonly parentDepartmentId: DepartmentId | null,
    public readonly name: DepartmentName,
    public readonly description: DepartmentDescription,
    public readonly settings: DepartmentSettings,
    private status: DepartmentStatus = DepartmentStatus.INACTIVE,
    public readonly level: number = 1,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date(),
    public readonly deletedAt: Date | null = null,
  ) {
    this.validateDepartmentEntity();
  }

  /**
   * @method validateDepartmentEntity
   * @description 验证部门实体的有效性
   * @returns {void}
   * @throws {InvalidDepartmentEntityError} 当部门实体无效时抛出
   * @private
   */
  private validateDepartmentEntity(): void {
    if (!this.id) {
      throw new InvalidDepartmentEntityError('部门ID不能为空');
    }

    if (!this.tenantId) {
      throw new InvalidDepartmentEntityError('租户ID不能为空');
    }

    if (!this.organizationId) {
      throw new InvalidDepartmentEntityError('组织ID不能为空');
    }

    if (!this.name) {
      throw new InvalidDepartmentEntityError('部门名称不能为空');
    }

    if (!this.settings) {
      throw new InvalidDepartmentEntityError('部门设置不能为空');
    }

    if (!DepartmentStatusHelper.isValid(this.status)) {
      throw new InvalidDepartmentEntityError(`无效的部门状态: ${this.status}`);
    }

    if (this.level < 1 || this.level > 10) {
      throw new InvalidDepartmentEntityError('部门层级必须在1-10之间');
    }
  }

  /**
   * @method activate
   * @description 激活部门，将状态从INACTIVE或SUSPENDED变更为ACTIVE
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  activate(): void {
    if (!DepartmentStatusHelper.canBeActivated(this.status)) {
      throw new InvalidStateTransitionError(`无法从${this.status}状态激活部门`);
    }

    this.status = DepartmentStatus.ACTIVE;
    this.updateTimestamp();
  }

  /**
   * @method deactivate
   * @description 停用部门，将状态从ACTIVE变更为INACTIVE
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  deactivate(): void {
    if (this.status !== DepartmentStatus.ACTIVE) {
      throw new InvalidStateTransitionError(`无法从${this.status}状态停用部门`);
    }

    this.status = DepartmentStatus.INACTIVE;
    this.updateTimestamp();
  }

  /**
   * @method suspend
   * @description 暂停部门，将状态从ACTIVE或INACTIVE变更为SUSPENDED
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  suspend(): void {
    if (!DepartmentStatusHelper.canBeSuspended(this.status)) {
      throw new InvalidStateTransitionError(`无法从${this.status}状态暂停部门`);
    }

    this.status = DepartmentStatus.SUSPENDED;
    this.updateTimestamp();
  }

  /**
   * @method delete
   * @description 删除部门，将状态变更为DELETED（软删除）
   * @returns {void}
   * @throws {InvalidStateTransitionError} 当状态转换无效时抛出
   */
  delete(): void {
    if (!DepartmentStatusHelper.canBeDeleted(this.status)) {
      throw new InvalidStateTransitionError(`无法从${this.status}状态删除部门`);
    }

    this.status = DepartmentStatus.DELETED;
    this.updateTimestamp();
  }

  /**
   * @method isActive
   * @description 判断部门是否为活跃状态
   * @returns {boolean} 是否为活跃状态
   */
  isActive(): boolean {
    return DepartmentStatusHelper.isActive(this.status);
  }

  /**
   * @method isOperational
   * @description 判断部门是否可操作（非删除状态）
   * @returns {boolean} 是否可操作
   */
  isOperational(): boolean {
    return DepartmentStatusHelper.isOperational(this.status);
  }

  /**
   * @method canBeActivated
   * @description 判断部门是否可以激活
   * @returns {boolean} 是否可以激活
   */
  canBeActivated(): boolean {
    return DepartmentStatusHelper.canBeActivated(this.status);
  }

  /**
   * @method canBeSuspended
   * @description 判断部门是否可以暂停
   * @returns {boolean} 是否可以暂停
   */
  canBeSuspended(): boolean {
    return DepartmentStatusHelper.canBeSuspended(this.status);
  }

  /**
   * @method canBeDeleted
   * @description 判断部门是否可以删除
   * @returns {boolean} 是否可以删除
   */
  canBeDeleted(): boolean {
    return DepartmentStatusHelper.canBeDeleted(this.status);
  }

  /**
   * @method isRootDepartment
   * @description 判断是否为根部门（无父部门）
   * @returns {boolean} 是否为根部门
   */
  isRootDepartment(): boolean {
    return this.parentDepartmentId === null;
  }

  /**
   * @method isLeafDepartment
   * @description 判断是否为叶子部门（无子部门）
   * @returns {boolean} 是否为叶子部门
   */
  isLeafDepartment(): boolean {
    // 这里需要根据实际业务逻辑判断
    // 暂时返回false作为占位符
    return false;
  }

  /**
   * @method getStatus
   * @description 获取部门当前状态
   * @returns {DepartmentStatus} 部门状态
   */
  getStatus(): DepartmentStatus {
    return this.status;
  }

  /**
   * @method getStatusDisplayName
   * @description 获取状态显示名称
   * @returns {string} 状态显示名称
   */
  getStatusDisplayName(): string {
    return DepartmentStatusHelper.getDisplayName(this.status);
  }

  /**
   * @method getHierarchyPath
   * @description 获取部门层级路径
   * @returns {string} 层级路径
   */
  getHierarchyPath(): string {
    // 这里需要根据实际业务逻辑构建层级路径
    // 暂时返回部门名称作为占位符
    return this.name.value;
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
   * @description 比较两个部门实体是否相等
   * @param {DepartmentEntity} other 另一个部门实体
   * @returns {boolean} 是否相等
   */
  equals(other: DepartmentEntity): boolean {
    if (!other) return false;
    return this.id.equals(other.id);
  }

  /**
   * @method clone
   * @description 克隆部门实体
   * @returns {DepartmentEntity} 克隆的部门实体
   */
  clone(): DepartmentEntity {
    return new DepartmentEntity(
      this.id,
      this.tenantId,
      this.organizationId,
      this.parentDepartmentId,
      this.name,
      this.description,
      this.settings,
      this.status,
      this.level,
      this.createdAt,
      this.updatedAt,
      this.deletedAt,
    );
  }
}

/**
 * @class InvalidDepartmentEntityError
 * @description 无效部门实体异常类
 * @extends Error
 */
export class InvalidDepartmentEntityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDepartmentEntityError';
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
