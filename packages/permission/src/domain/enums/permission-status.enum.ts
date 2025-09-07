/**
 * @enum PermissionStatus
 * @description 权限状态枚举
 * @since 1.0.0
 */
export enum PermissionStatus {
  /** 活跃状态 - 权限正常可用 */
  ACTIVE = 'ACTIVE',
  /** 非活跃状态 - 权限暂时不可用 */
  INACTIVE = 'INACTIVE',
  /** 暂停状态 - 权限被暂停使用 */
  SUSPENDED = 'SUSPENDED',
  /** 已删除状态 - 权限已被删除 */
  DELETED = 'DELETED',
  /** 已过期状态 - 权限已过期 */
  EXPIRED = 'EXPIRED',
  /** 待审批状态 - 权限等待审批 */
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  /** 已拒绝状态 - 权限申请被拒绝 */
  REJECTED = 'REJECTED',
}

/**
 * @class PermissionStatusHelper
 * @description 权限状态辅助类，提供权限状态相关的业务逻辑
 * @since 1.0.0
 */
export class PermissionStatusHelper {
  /**
   * @method getAllStatuses
   * @description 获取所有权限状态
   * @returns {PermissionStatus[]} 所有权限状态列表
   */
  static getAllStatuses(): PermissionStatus[] {
    return Object.values(PermissionStatus);
  }

  /**
   * @method getActiveStatuses
   * @description 获取活跃状态列表
   * @returns {PermissionStatus[]} 活跃状态列表
   */
  static getActiveStatuses(): PermissionStatus[] {
    return [PermissionStatus.ACTIVE];
  }

  /**
   * @method getInactiveStatuses
   * @description 获取非活跃状态列表
   * @returns {PermissionStatus[]} 非活跃状态列表
   */
  static getInactiveStatuses(): PermissionStatus[] {
    return [
      PermissionStatus.INACTIVE,
      PermissionStatus.SUSPENDED,
      PermissionStatus.DELETED,
      PermissionStatus.EXPIRED,
      PermissionStatus.REJECTED,
    ];
  }

  /**
   * @method getPendingStatuses
   * @description 获取待处理状态列表
   * @returns {PermissionStatus[]} 待处理状态列表
   */
  static getPendingStatuses(): PermissionStatus[] {
    return [PermissionStatus.PENDING_APPROVAL];
  }

  /**
   * @method isActive
   * @description 检查权限状态是否为活跃状态
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否为活跃状态
   */
  static isActive(status: PermissionStatus): boolean {
    return status === PermissionStatus.ACTIVE;
  }

  /**
   * @method isInactive
   * @description 检查权限状态是否为非活跃状态
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否为非活跃状态
   */
  static isInactive(status: PermissionStatus): boolean {
    return this.getInactiveStatuses().includes(status);
  }

  /**
   * @method isPending
   * @description 检查权限状态是否为待处理状态
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否为待处理状态
   */
  static isPending(status: PermissionStatus): boolean {
    return status === PermissionStatus.PENDING_APPROVAL;
  }

  /**
   * @method isDeleted
   * @description 检查权限状态是否为已删除状态
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否为已删除状态
   */
  static isDeleted(status: PermissionStatus): boolean {
    return status === PermissionStatus.DELETED;
  }

  /**
   * @method isExpired
   * @description 检查权限状态是否为已过期状态
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否为已过期状态
   */
  static isExpired(status: PermissionStatus): boolean {
    return status === PermissionStatus.EXPIRED;
  }

  /**
   * @method isSuspended
   * @description 检查权限状态是否为暂停状态
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否为暂停状态
   */
  static isSuspended(status: PermissionStatus): boolean {
    return status === PermissionStatus.SUSPENDED;
  }

  /**
   * @method isRejected
   * @description 检查权限状态是否为已拒绝状态
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否为已拒绝状态
   */
  static isRejected(status: PermissionStatus): boolean {
    return status === PermissionStatus.REJECTED;
  }

  /**
   * @method canBeActivated
   * @description 检查权限状态是否可以激活
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否可以激活
   */
  static canBeActivated(status: PermissionStatus): boolean {
    return [
      PermissionStatus.INACTIVE,
      PermissionStatus.SUSPENDED,
      PermissionStatus.PENDING_APPROVAL,
    ].includes(status);
  }

  /**
   * @method canBeDeactivated
   * @description 检查权限状态是否可以停用
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否可以停用
   */
  static canBeDeactivated(status: PermissionStatus): boolean {
    return status === PermissionStatus.ACTIVE;
  }

  /**
   * @method canBeSuspended
   * @description 检查权限状态是否可以暂停
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否可以暂停
   */
  static canBeSuspended(status: PermissionStatus): boolean {
    return status === PermissionStatus.ACTIVE;
  }

  /**
   * @method canBeRestored
   * @description 检查权限状态是否可以恢复
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否可以恢复
   */
  static canBeRestored(status: PermissionStatus): boolean {
    return [PermissionStatus.SUSPENDED, PermissionStatus.INACTIVE].includes(
      status,
    );
  }

  /**
   * @method canBeDeleted
   * @description 检查权限状态是否可以删除
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否可以删除
   */
  static canBeDeleted(status: PermissionStatus): boolean {
    return [
      PermissionStatus.ACTIVE,
      PermissionStatus.INACTIVE,
      PermissionStatus.SUSPENDED,
      PermissionStatus.PENDING_APPROVAL,
      PermissionStatus.REJECTED,
    ].includes(status);
  }

  /**
   * @method canBeModified
   * @description 检查权限状态是否可以修改
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否可以修改
   */
  static canBeModified(status: PermissionStatus): boolean {
    return [
      PermissionStatus.ACTIVE,
      PermissionStatus.INACTIVE,
      PermissionStatus.SUSPENDED,
      PermissionStatus.PENDING_APPROVAL,
    ].includes(status);
  }

  /**
   * @method canBeApproved
   * @description 检查权限状态是否可以审批
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否可以审批
   */
  static canBeApproved(status: PermissionStatus): boolean {
    return status === PermissionStatus.PENDING_APPROVAL;
  }

  /**
   * @method canBeRejected
   * @description 检查权限状态是否可以拒绝
   * @param {PermissionStatus} status 权限状态
   * @returns {boolean} 是否可以拒绝
   */
  static canBeRejected(status: PermissionStatus): boolean {
    return status === PermissionStatus.PENDING_APPROVAL;
  }

  /**
   * @method getStatusDisplayName
   * @description 获取权限状态的显示名称
   * @param {PermissionStatus} status 权限状态
   * @returns {string} 显示名称
   */
  static getStatusDisplayName(status: PermissionStatus): string {
    const displayNames: Record<PermissionStatus, string> = {
      [PermissionStatus.ACTIVE]: '活跃',
      [PermissionStatus.INACTIVE]: '非活跃',
      [PermissionStatus.SUSPENDED]: '暂停',
      [PermissionStatus.DELETED]: '已删除',
      [PermissionStatus.EXPIRED]: '已过期',
      [PermissionStatus.PENDING_APPROVAL]: '待审批',
      [PermissionStatus.REJECTED]: '已拒绝',
    };
    return displayNames[status] || '未知状态';
  }

  /**
   * @method getStatusDescription
   * @description 获取权限状态的描述
   * @param {PermissionStatus} status 权限状态
   * @returns {string} 状态描述
   */
  static getStatusDescription(status: PermissionStatus): string {
    const descriptions: Record<PermissionStatus, string> = {
      [PermissionStatus.ACTIVE]: '权限正常可用',
      [PermissionStatus.INACTIVE]: '权限暂时不可用',
      [PermissionStatus.SUSPENDED]: '权限被暂停使用',
      [PermissionStatus.DELETED]: '权限已被删除',
      [PermissionStatus.EXPIRED]: '权限已过期',
      [PermissionStatus.PENDING_APPROVAL]: '权限等待审批',
      [PermissionStatus.REJECTED]: '权限申请被拒绝',
    };
    return descriptions[status] || '未知状态';
  }

  /**
   * @method getStatusColor
   * @description 获取权限状态的颜色标识
   * @param {PermissionStatus} status 权限状态
   * @returns {string} 颜色标识
   */
  static getStatusColor(status: PermissionStatus): string {
    const colors: Record<PermissionStatus, string> = {
      [PermissionStatus.ACTIVE]: 'green',
      [PermissionStatus.INACTIVE]: 'gray',
      [PermissionStatus.SUSPENDED]: 'orange',
      [PermissionStatus.DELETED]: 'red',
      [PermissionStatus.EXPIRED]: 'red',
      [PermissionStatus.PENDING_APPROVAL]: 'blue',
      [PermissionStatus.REJECTED]: 'red',
    };
    return colors[status] || 'gray';
  }

  /**
   * @method getNextValidStatuses
   * @description 获取当前状态可以转换到的有效状态列表
   * @param {PermissionStatus} currentStatus 当前状态
   * @returns {PermissionStatus[]} 可转换的状态列表
   */
  static getNextValidStatuses(
    currentStatus: PermissionStatus,
  ): PermissionStatus[] {
    const transitions: Record<PermissionStatus, PermissionStatus[]> = {
      [PermissionStatus.ACTIVE]: [
        PermissionStatus.INACTIVE,
        PermissionStatus.SUSPENDED,
        PermissionStatus.DELETED,
        PermissionStatus.EXPIRED,
      ],
      [PermissionStatus.INACTIVE]: [
        PermissionStatus.ACTIVE,
        PermissionStatus.DELETED,
        PermissionStatus.EXPIRED,
      ],
      [PermissionStatus.SUSPENDED]: [
        PermissionStatus.ACTIVE,
        PermissionStatus.INACTIVE,
        PermissionStatus.DELETED,
        PermissionStatus.EXPIRED,
      ],
      [PermissionStatus.DELETED]: [],
      [PermissionStatus.EXPIRED]: [],
      [PermissionStatus.PENDING_APPROVAL]: [
        PermissionStatus.ACTIVE,
        PermissionStatus.REJECTED,
        PermissionStatus.DELETED,
      ],
      [PermissionStatus.REJECTED]: [
        PermissionStatus.PENDING_APPROVAL,
        PermissionStatus.DELETED,
      ],
    };
    return transitions[currentStatus] || [];
  }

  /**
   * @method isValidTransition
   * @description 检查状态转换是否有效
   * @param {PermissionStatus} fromStatus 源状态
   * @param {PermissionStatus} toStatus 目标状态
   * @returns {boolean} 转换是否有效
   */
  static isValidTransition(
    fromStatus: PermissionStatus,
    toStatus: PermissionStatus,
  ): boolean {
    return this.getNextValidStatuses(fromStatus).includes(toStatus);
  }
}
