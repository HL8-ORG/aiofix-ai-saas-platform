/**
 * @enum DepartmentStatus
 * @description 部门状态枚举
 *
 * 部门状态定义：
 * 1. ACTIVE: 活跃状态，部门正常运行
 * 2. INACTIVE: 非活跃状态，部门暂停使用
 * 3. SUSPENDED: 暂停状态，部门被管理员暂停
 * 4. DELETED: 删除状态，部门已删除（软删除）
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
 * const status = DepartmentStatus.ACTIVE;
 * console.log(DepartmentStatus.isActive(status)); // true
 * ```
 * @since 1.0.0
 */
export enum DepartmentStatus {
  /** 活跃状态 */
  ACTIVE = 'ACTIVE',
  /** 非活跃状态 */
  INACTIVE = 'INACTIVE',
  /** 暂停状态 */
  SUSPENDED = 'SUSPENDED',
  /** 删除状态 */
  DELETED = 'DELETED',
}

/**
 * @class DepartmentStatusHelper
 * @description 部门状态辅助工具类
 *
 * 提供部门状态相关的工具方法：
 * 1. 状态验证和转换
 * 2. 状态显示名称
 * 3. 状态权限检查
 * 4. 状态业务逻辑判断
 */
export class DepartmentStatusHelper {
  /**
   * @method isActive
   * @description 判断部门是否为活跃状态
   * @param {DepartmentStatus} status 部门状态
   * @returns {boolean} 是否为活跃状态
   * @static
   */
  static isActive(status: DepartmentStatus): boolean {
    return status === DepartmentStatus.ACTIVE;
  }

  /**
   * @method isInactive
   * @description 判断部门是否为非活跃状态
   * @param {DepartmentStatus} status 部门状态
   * @returns {boolean} 是否为非活跃状态
   * @static
   */
  static isInactive(status: DepartmentStatus): boolean {
    return status === DepartmentStatus.INACTIVE;
  }

  /**
   * @method isSuspended
   * @description 判断部门是否为暂停状态
   * @param {DepartmentStatus} status 部门状态
   * @returns {boolean} 是否为暂停状态
   * @static
   */
  static isSuspended(status: DepartmentStatus): boolean {
    return status === DepartmentStatus.SUSPENDED;
  }

  /**
   * @method isDeleted
   * @description 判断部门是否为删除状态
   * @param {DepartmentStatus} status 部门状态
   * @returns {boolean} 是否为删除状态
   * @static
   */
  static isDeleted(status: DepartmentStatus): boolean {
    return status === DepartmentStatus.DELETED;
  }

  /**
   * @method isOperational
   * @description 判断部门是否可操作（非删除状态）
   * @param {DepartmentStatus} status 部门状态
   * @returns {boolean} 是否可操作
   * @static
   */
  static isOperational(status: DepartmentStatus): boolean {
    return status !== DepartmentStatus.DELETED;
  }

  /**
   * @method canBeActivated
   * @description 判断部门是否可以激活
   * @param {DepartmentStatus} status 部门状态
   * @returns {boolean} 是否可以激活
   * @static
   */
  static canBeActivated(status: DepartmentStatus): boolean {
    return (
      status === DepartmentStatus.INACTIVE ||
      status === DepartmentStatus.SUSPENDED
    );
  }

  /**
   * @method canBeSuspended
   * @description 判断部门是否可以暂停
   * @param {DepartmentStatus} status 部门状态
   * @returns {boolean} 是否可以暂停
   * @static
   */
  static canBeSuspended(status: DepartmentStatus): boolean {
    return (
      status === DepartmentStatus.ACTIVE || status === DepartmentStatus.INACTIVE
    );
  }

  /**
   * @method canBeDeleted
   * @description 判断部门是否可以删除
   * @param {DepartmentStatus} status 部门状态
   * @returns {boolean} 是否可以删除
   * @static
   */
  static canBeDeleted(status: DepartmentStatus): boolean {
    return status !== DepartmentStatus.DELETED;
  }

  /**
   * @method getDisplayName
   * @description 获取状态显示名称
   * @param {DepartmentStatus} status 部门状态
   * @returns {string} 显示名称
   * @static
   */
  static getDisplayName(status: DepartmentStatus): string {
    const displayNames: Record<DepartmentStatus, string> = {
      [DepartmentStatus.ACTIVE]: '活跃',
      [DepartmentStatus.INACTIVE]: '非活跃',
      [DepartmentStatus.SUSPENDED]: '已暂停',
      [DepartmentStatus.DELETED]: '已删除',
    };
    return displayNames[status] || '未知状态';
  }

  /**
   * @method getDescription
   * @description 获取状态描述
   * @param {DepartmentStatus} status 部门状态
   * @returns {string} 状态描述
   * @static
   */
  static getDescription(status: DepartmentStatus): string {
    const descriptions: Record<DepartmentStatus, string> = {
      [DepartmentStatus.ACTIVE]: '部门正常运行，所有功能可用',
      [DepartmentStatus.INACTIVE]: '部门暂停使用，功能受限',
      [DepartmentStatus.SUSPENDED]: '部门被管理员暂停，需要恢复',
      [DepartmentStatus.DELETED]: '部门已删除，不可恢复',
    };
    return descriptions[status] || '未知状态';
  }

  /**
   * @method getAllStatuses
   * @description 获取所有状态列表
   * @returns {DepartmentStatus[]} 所有状态
   * @static
   */
  static getAllStatuses(): DepartmentStatus[] {
    return Object.values(DepartmentStatus);
  }

  /**
   * @method getOperationalStatuses
   * @description 获取可操作状态列表
   * @returns {DepartmentStatus[]} 可操作状态
   * @static
   */
  static getOperationalStatuses(): DepartmentStatus[] {
    return [
      DepartmentStatus.ACTIVE,
      DepartmentStatus.INACTIVE,
      DepartmentStatus.SUSPENDED,
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
    return Object.values(DepartmentStatus).includes(value as DepartmentStatus);
  }

  /**
   * @method fromString
   * @description 从字符串创建状态
   * @param {string} value 状态字符串
   * @returns {DepartmentStatus} 部门状态
   * @throws {InvalidDepartmentStatusError} 当状态值无效时抛出
   * @static
   */
  static fromString(value: string): DepartmentStatus {
    if (!DepartmentStatusHelper.isValid(value)) {
      throw new InvalidDepartmentStatusError(`无效的部门状态: ${value}`);
    }
    return value as DepartmentStatus;
  }
}

/**
 * @class InvalidDepartmentStatusError
 * @description 无效部门状态异常类
 * @extends Error
 */
export class InvalidDepartmentStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDepartmentStatusError';
  }
}
