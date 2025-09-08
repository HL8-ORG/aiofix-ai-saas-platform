/**
 * @enum RoleStatus
 * @description
 * 角色状态枚举，定义角色在系统中的各种状态。
 *
 * 状态说明：
 * 1. ACTIVE: 激活状态，角色可以正常使用
 * 2. INACTIVE: 非激活状态，角色暂时不可用
 * 3. SUSPENDED: 暂停状态，角色被管理员暂停
 * 4. DELETED: 删除状态，角色已被删除（软删除）
 * 5. EXPIRED: 过期状态，角色已过期
 *
 * 状态转换规则：
 * - ACTIVE ↔ INACTIVE: 可以相互转换
 * - ACTIVE → SUSPENDED: 管理员可以暂停角色
 * - SUSPENDED → ACTIVE: 管理员可以恢复角色
 * - 任何状态 → DELETED: 可以删除角色
 * - ACTIVE → EXPIRED: 角色过期时自动转换
 *
 * @example
 * ```typescript
 * const status = RoleStatus.ACTIVE;
 * console.log(RoleStatus.isActive(status)); // true
 * ```
 * @since 1.0.0
 */
export enum RoleStatus {
  /**
   * 待激活状态
   * 角色已创建但尚未激活，不能使用
   */
  PENDING = 'PENDING',

  /**
   * 激活状态
   * 角色可以正常使用，用户可以分配到此角色
   */
  ACTIVE = 'ACTIVE',

  /**
   * 非激活状态
   * 角色暂时不可用，新用户不能分配到此角色
   */
  INACTIVE = 'INACTIVE',

  /**
   * 禁用状态
   * 角色被禁用，不能使用
   */
  DISABLED = 'DISABLED',

  /**
   * 暂停状态
   * 角色被管理员暂停，现有用户仍可使用但新用户不能分配
   */
  SUSPENDED = 'SUSPENDED',

  /**
   * 删除状态
   * 角色已被删除（软删除），不能使用
   */
  DELETED = 'DELETED',

  /**
   * 过期状态
   * 角色已过期，不能使用
   */
  EXPIRED = 'EXPIRED',
}

/**
 * @class RoleStatusHelper
 * @description 角色状态辅助类，提供状态相关的工具方法
 */
export class RoleStatusHelper {
  /**
   * @method isPending
   * @description 检查角色是否为待激活状态
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否为待激活状态
   */
  static isPending(status: RoleStatus): boolean {
    return status === RoleStatus.PENDING;
  }

  /**
   * @method isActive
   * @description 检查角色是否为激活状态
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否为激活状态
   */
  static isActive(status: RoleStatus): boolean {
    return status === RoleStatus.ACTIVE;
  }

  /**
   * @method isInactive
   * @description 检查角色是否为非激活状态
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否为非激活状态
   */
  static isInactive(status: RoleStatus): boolean {
    return status === RoleStatus.INACTIVE;
  }

  /**
   * @method isDisabled
   * @description 检查角色是否为禁用状态
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否为禁用状态
   */
  static isDisabled(status: RoleStatus): boolean {
    return status === RoleStatus.DISABLED;
  }

  /**
   * @method isSuspended
   * @description 检查角色是否为暂停状态
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否为暂停状态
   */
  static isSuspended(status: RoleStatus): boolean {
    return status === RoleStatus.SUSPENDED;
  }

  /**
   * @method isDeleted
   * @description 检查角色是否为删除状态
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否为删除状态
   */
  static isDeleted(status: RoleStatus): boolean {
    return status === RoleStatus.DELETED;
  }

  /**
   * @method isExpired
   * @description 检查角色是否为过期状态
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否为过期状态
   */
  static isExpired(status: RoleStatus): boolean {
    return status === RoleStatus.EXPIRED;
  }

  /**
   * @method isUsable
   * @description 检查角色是否可用（激活或暂停状态）
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否可用
   */
  static isUsable(status: RoleStatus): boolean {
    return status === RoleStatus.ACTIVE || status === RoleStatus.SUSPENDED;
  }

  /**
   * @method canBeAssigned
   * @description 检查角色是否可以分配给新用户
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否可以分配
   */
  static canBeAssigned(status: RoleStatus): boolean {
    return status === RoleStatus.ACTIVE;
  }

  /**
   * @method canBeModified
   * @description 检查角色是否可以修改
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否可以修改
   */
  static canBeModified(status: RoleStatus): boolean {
    return status !== RoleStatus.DELETED;
  }

  /**
   * @method canBeDeleted
   * @description 检查角色是否可以删除
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否可以删除
   */
  static canBeDeleted(status: RoleStatus): boolean {
    return status !== RoleStatus.DELETED;
  }

  /**
   * @method getDisplayName
   * @description 获取状态的显示名称
   * @param {RoleStatus} status 角色状态
   * @returns {string} 显示名称
   */
  static getDisplayName(status: RoleStatus): string {
    const displayNames: Record<RoleStatus, string> = {
      [RoleStatus.PENDING]: '待激活',
      [RoleStatus.ACTIVE]: '激活',
      [RoleStatus.INACTIVE]: '非激活',
      [RoleStatus.DISABLED]: '禁用',
      [RoleStatus.SUSPENDED]: '暂停',
      [RoleStatus.DELETED]: '已删除',
      [RoleStatus.EXPIRED]: '已过期',
    };
    return displayNames[status] || '未知';
  }

  /**
   * @method getAllStatuses
   * @description 获取所有状态
   * @returns {RoleStatus[]} 所有状态列表
   */
  static getAllStatuses(): RoleStatus[] {
    return Object.values(RoleStatus);
  }

  /**
   * @method getActiveStatuses
   * @description 获取可用状态列表
   * @returns {RoleStatus[]} 可用状态列表
   */
  static getActiveStatuses(): RoleStatus[] {
    return [RoleStatus.ACTIVE, RoleStatus.INACTIVE, RoleStatus.SUSPENDED];
  }

  /**
   * @method isValid
   * @description 检查状态是否有效
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否有效
   */
  static isValid(status: RoleStatus): boolean {
    return Object.values(RoleStatus).includes(status);
  }

  /**
   * @method canBeActivated
   * @description 检查状态是否可以激活
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否可以激活
   */
  static canBeActivated(status: RoleStatus): boolean {
    return status === RoleStatus.PENDING || status === RoleStatus.INACTIVE;
  }

  /**
   * @method canBeDeactivated
   * @description 检查状态是否可以停用
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否可以停用
   */
  static canBeDeactivated(status: RoleStatus): boolean {
    return status === RoleStatus.ACTIVE;
  }

  /**
   * @method canBeSuspended
   * @description 检查状态是否可以暂停
   * @param {RoleStatus} status 角色状态
   * @returns {boolean} 是否可以暂停
   */
  static canBeSuspended(status: RoleStatus): boolean {
    return status === RoleStatus.ACTIVE;
  }
}
