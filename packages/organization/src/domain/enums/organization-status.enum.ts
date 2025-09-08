/**
 * @enum OrganizationStatus
 * @description 组织状态枚举
 *
 * 组织状态定义：
 * 1. ACTIVE: 活跃状态，组织正常运行
 * 2. INACTIVE: 非活跃状态，组织暂停使用
 * 3. SUSPENDED: 暂停状态，组织被管理员暂停
 * 4. DELETED: 删除状态，组织已删除（软删除）
 *
 * 状态转换规则：
 * - ACTIVE ↔ INACTIVE: 可以相互转换
 * - ACTIVE/INACTIVE → SUSPENDED: 管理员可以暂停
 * - SUSPENDED → ACTIVE: 管理员可以恢复
 * - 任何状态 → DELETED: 可以删除
 * - DELETED: 终态，不可转换
 *
 * @example
 * ```typescript
 * const status = OrganizationStatus.ACTIVE;
 * console.log(OrganizationStatus.isActive(status)); // true
 * ```
 * @since 1.0.0
 */
export enum OrganizationStatus {
  /** 待激活状态 */
  PENDING = 'PENDING',
  /** 活跃状态 */
  ACTIVE = 'ACTIVE',
  /** 非活跃状态 */
  INACTIVE = 'INACTIVE',
  /** 暂停状态 */
  SUSPENDED = 'SUSPENDED',
  /** 禁用状态 */
  DISABLED = 'DISABLED',
  /** 删除状态 */
  DELETED = 'DELETED',
}

/**
 * @class OrganizationStatusHelper
 * @description 组织状态辅助工具类
 *
 * 提供组织状态相关的工具方法：
 * 1. 状态验证和转换
 * 2. 状态显示名称
 * 3. 状态权限检查
 * 4. 状态业务逻辑判断
 */
export class OrganizationStatusHelper {
  /**
   * @method isActive
   * @description 判断组织是否为活跃状态
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否为活跃状态
   * @static
   */
  static isActive(status: OrganizationStatus): boolean {
    return status === OrganizationStatus.ACTIVE;
  }

  /**
   * @method isPending
   * @description 判断组织是否为待激活状态
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否为待激活状态
   * @static
   */
  static isPending(status: OrganizationStatus): boolean {
    return status === OrganizationStatus.PENDING;
  }

  /**
   * @method isInactive
   * @description 判断组织是否为非活跃状态
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否为非活跃状态
   * @static
   */
  static isInactive(status: OrganizationStatus): boolean {
    return status === OrganizationStatus.INACTIVE;
  }

  /**
   * @method isSuspended
   * @description 判断组织是否为暂停状态
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否为暂停状态
   * @static
   */
  static isSuspended(status: OrganizationStatus): boolean {
    return status === OrganizationStatus.SUSPENDED;
  }

  /**
   * @method isDisabled
   * @description 判断组织是否为禁用状态
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否为禁用状态
   * @static
   */
  static isDisabled(status: OrganizationStatus): boolean {
    return status === OrganizationStatus.DISABLED;
  }

  /**
   * @method isDeleted
   * @description 判断组织是否为删除状态
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否为删除状态
   * @static
   */
  static isDeleted(status: OrganizationStatus): boolean {
    return status === OrganizationStatus.DELETED;
  }

  /**
   * @method isOperational
   * @description 判断组织是否可操作（非删除状态）
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否可操作
   * @static
   */
  static isOperational(status: OrganizationStatus): boolean {
    return status !== OrganizationStatus.DELETED;
  }

  /**
   * @method canBeActivated
   * @description 判断组织是否可以激活
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否可以激活
   * @static
   */
  static canBeActivated(status: OrganizationStatus): boolean {
    return (
      status === OrganizationStatus.PENDING ||
      status === OrganizationStatus.INACTIVE ||
      status === OrganizationStatus.SUSPENDED ||
      status === OrganizationStatus.DISABLED
    );
  }

  /**
   * @method canBeSuspended
   * @description 判断组织是否可以暂停
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否可以暂停
   * @static
   */
  static canBeSuspended(status: OrganizationStatus): boolean {
    return (
      status === OrganizationStatus.ACTIVE ||
      status === OrganizationStatus.INACTIVE
    );
  }

  /**
   * @method canBeDeactivated
   * @description 判断组织是否可以禁用
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否可以禁用
   * @static
   */
  static canBeDeactivated(status: OrganizationStatus): boolean {
    return status === OrganizationStatus.ACTIVE;
  }

  /**
   * @method canBeDeleted
   * @description 判断组织是否可以删除
   * @param {OrganizationStatus} status 组织状态
   * @returns {boolean} 是否可以删除
   * @static
   */
  static canBeDeleted(status: OrganizationStatus): boolean {
    return status !== OrganizationStatus.DELETED;
  }

  /**
   * @method getDisplayName
   * @description 获取状态显示名称
   * @param {OrganizationStatus} status 组织状态
   * @returns {string} 显示名称
   * @static
   */
  static getDisplayName(status: OrganizationStatus): string {
    const displayNames: Record<OrganizationStatus, string> = {
      [OrganizationStatus.PENDING]: '待激活',
      [OrganizationStatus.ACTIVE]: '活跃',
      [OrganizationStatus.INACTIVE]: '非活跃',
      [OrganizationStatus.SUSPENDED]: '已暂停',
      [OrganizationStatus.DISABLED]: '已禁用',
      [OrganizationStatus.DELETED]: '已删除',
    };
    return displayNames[status] || '未知状态';
  }

  /**
   * @method getDescription
   * @description 获取状态描述
   * @param {OrganizationStatus} status 组织状态
   * @returns {string} 状态描述
   * @static
   */
  static getDescription(status: OrganizationStatus): string {
    const descriptions: Record<OrganizationStatus, string> = {
      [OrganizationStatus.PENDING]: '组织已创建，等待激活',
      [OrganizationStatus.ACTIVE]: '组织正常运行，所有功能可用',
      [OrganizationStatus.INACTIVE]: '组织暂停使用，功能受限',
      [OrganizationStatus.SUSPENDED]: '组织被管理员暂停，需要恢复',
      [OrganizationStatus.DISABLED]: '组织被禁用，无法使用',
      [OrganizationStatus.DELETED]: '组织已删除，不可恢复',
    };
    return descriptions[status] || '未知状态';
  }

  /**
   * @method getAllStatuses
   * @description 获取所有状态列表
   * @returns {OrganizationStatus[]} 所有状态
   * @static
   */
  static getAllStatuses(): OrganizationStatus[] {
    return Object.values(OrganizationStatus);
  }

  /**
   * @method getOperationalStatuses
   * @description 获取可操作状态列表
   * @returns {OrganizationStatus[]} 可操作状态
   * @static
   */
  static getOperationalStatuses(): OrganizationStatus[] {
    return [
      OrganizationStatus.PENDING,
      OrganizationStatus.ACTIVE,
      OrganizationStatus.INACTIVE,
      OrganizationStatus.SUSPENDED,
      OrganizationStatus.DISABLED,
    ];
  }

  /**
   * @method isValid
   * @description 验证状态值是否有效
   * @param {string} value 状态值
   * @returns {boolean} 是否有效
   * @static
   */
  static isValid(value: string): boolean {
    return Object.values(OrganizationStatus).includes(
      value as OrganizationStatus,
    );
  }

  /**
   * @method fromString
   * @description 从字符串创建状态
   * @param {string} value 状态字符串
   * @returns {OrganizationStatus} 组织状态
   * @throws {InvalidOrganizationStatusError} 当状态值无效时抛出
   * @static
   */
  static fromString(value: string): OrganizationStatus {
    if (!OrganizationStatusHelper.isValid(value)) {
      throw new InvalidOrganizationStatusError(`无效的组织状态: ${value}`);
    }
    return value as OrganizationStatus;
  }
}

/**
 * @class InvalidOrganizationStatusError
 * @description 无效组织状态异常类
 * @extends Error
 */
export class InvalidOrganizationStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrganizationStatusError';
  }
}
