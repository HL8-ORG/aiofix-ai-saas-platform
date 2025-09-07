/**
 * @enum SessionStatus
 * @description 会话状态枚举
 * @since 1.0.0
 */
export enum SessionStatus {
  /** 活跃状态 - 会话正常可用 */
  ACTIVE = 'ACTIVE',
  /** 非活跃状态 - 会话暂时不可用 */
  INACTIVE = 'INACTIVE',
  /** 暂停状态 - 会话被暂停使用 */
  SUSPENDED = 'SUSPENDED',
  /** 已过期状态 - 会话已过期 */
  EXPIRED = 'EXPIRED',
  /** 已终止状态 - 会话已被终止 */
  TERMINATED = 'TERMINATED',
  /** 已撤销状态 - 会话已被撤销 */
  REVOKED = 'REVOKED',
  /** 待验证状态 - 会话等待验证 */
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

/**
 * @class SessionStatusHelper
 * @description 会话状态辅助类，提供会话状态相关的业务逻辑
 * @since 1.0.0
 */
export class SessionStatusHelper {
  /**
   * @method getAllStatuses
   * @description 获取所有会话状态
   * @returns {SessionStatus[]} 所有会话状态列表
   */
  static getAllStatuses(): SessionStatus[] {
    return Object.values(SessionStatus);
  }

  /**
   * @method getActiveStatuses
   * @description 获取活跃状态列表
   * @returns {SessionStatus[]} 活跃状态列表
   */
  static getActiveStatuses(): SessionStatus[] {
    return [SessionStatus.ACTIVE];
  }

  /**
   * @method getInactiveStatuses
   * @description 获取非活跃状态列表
   * @returns {SessionStatus[]} 非活跃状态列表
   */
  static getInactiveStatuses(): SessionStatus[] {
    return [
      SessionStatus.INACTIVE,
      SessionStatus.SUSPENDED,
      SessionStatus.EXPIRED,
      SessionStatus.TERMINATED,
      SessionStatus.REVOKED,
    ];
  }

  /**
   * @method getPendingStatuses
   * @description 获取待处理状态列表
   * @returns {SessionStatus[]} 待处理状态列表
   */
  static getPendingStatuses(): SessionStatus[] {
    return [SessionStatus.PENDING_VERIFICATION];
  }

  /**
   * @method isActive
   * @description 检查会话状态是否为活跃状态
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否为活跃状态
   */
  static isActive(status: SessionStatus): boolean {
    return status === SessionStatus.ACTIVE;
  }

  /**
   * @method isInactive
   * @description 检查会话状态是否为非活跃状态
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否为非活跃状态
   */
  static isInactive(status: SessionStatus): boolean {
    return this.getInactiveStatuses().includes(status);
  }

  /**
   * @method isPending
   * @description 检查会话状态是否为待处理状态
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否为待处理状态
   */
  static isPending(status: SessionStatus): boolean {
    return status === SessionStatus.PENDING_VERIFICATION;
  }

  /**
   * @method isExpired
   * @description 检查会话状态是否为已过期状态
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否为已过期状态
   */
  static isExpired(status: SessionStatus): boolean {
    return status === SessionStatus.EXPIRED;
  }

  /**
   * @method isTerminated
   * @description 检查会话状态是否为已终止状态
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否为已终止状态
   */
  static isTerminated(status: SessionStatus): boolean {
    return status === SessionStatus.TERMINATED;
  }

  /**
   * @method isRevoked
   * @description 检查会话状态是否为已撤销状态
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否为已撤销状态
   */
  static isRevoked(status: SessionStatus): boolean {
    return status === SessionStatus.REVOKED;
  }

  /**
   * @method isSuspended
   * @description 检查会话状态是否为暂停状态
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否为暂停状态
   */
  static isSuspended(status: SessionStatus): boolean {
    return status === SessionStatus.SUSPENDED;
  }

  /**
   * @method canBeActivated
   * @description 检查会话状态是否可以激活
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否可以激活
   */
  static canBeActivated(status: SessionStatus): boolean {
    return [
      SessionStatus.INACTIVE,
      SessionStatus.SUSPENDED,
      SessionStatus.PENDING_VERIFICATION,
    ].includes(status);
  }

  /**
   * @method canBeDeactivated
   * @description 检查会话状态是否可以停用
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否可以停用
   */
  static canBeDeactivated(status: SessionStatus): boolean {
    return status === SessionStatus.ACTIVE;
  }

  /**
   * @method canBeSuspended
   * @description 检查会话状态是否可以暂停
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否可以暂停
   */
  static canBeSuspended(status: SessionStatus): boolean {
    return status === SessionStatus.ACTIVE;
  }

  /**
   * @method canBeRestored
   * @description 检查会话状态是否可以恢复
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否可以恢复
   */
  static canBeRestored(status: SessionStatus): boolean {
    return [SessionStatus.SUSPENDED, SessionStatus.INACTIVE].includes(status);
  }

  /**
   * @method canBeTerminated
   * @description 检查会话状态是否可以终止
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否可以终止
   */
  static canBeTerminated(status: SessionStatus): boolean {
    return [
      SessionStatus.ACTIVE,
      SessionStatus.INACTIVE,
      SessionStatus.SUSPENDED,
      SessionStatus.PENDING_VERIFICATION,
    ].includes(status);
  }

  /**
   * @method canBeRevoked
   * @description 检查会话状态是否可以撤销
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否可以撤销
   */
  static canBeRevoked(status: SessionStatus): boolean {
    return [
      SessionStatus.ACTIVE,
      SessionStatus.INACTIVE,
      SessionStatus.SUSPENDED,
      SessionStatus.PENDING_VERIFICATION,
    ].includes(status);
  }

  /**
   * @method canBeVerified
   * @description 检查会话状态是否可以验证
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否可以验证
   */
  static canBeVerified(status: SessionStatus): boolean {
    return status === SessionStatus.PENDING_VERIFICATION;
  }

  /**
   * @method canBeExpired
   * @description 检查会话状态是否可以过期
   * @param {SessionStatus} status 会话状态
   * @returns {boolean} 是否可以过期
   */
  static canBeExpired(status: SessionStatus): boolean {
    return [
      SessionStatus.ACTIVE,
      SessionStatus.INACTIVE,
      SessionStatus.SUSPENDED,
    ].includes(status);
  }

  /**
   * @method getStatusDisplayName
   * @description 获取会话状态的显示名称
   * @param {SessionStatus} status 会话状态
   * @returns {string} 显示名称
   */
  static getStatusDisplayName(status: SessionStatus): string {
    const displayNames: Record<SessionStatus, string> = {
      [SessionStatus.ACTIVE]: '活跃',
      [SessionStatus.INACTIVE]: '非活跃',
      [SessionStatus.SUSPENDED]: '暂停',
      [SessionStatus.EXPIRED]: '已过期',
      [SessionStatus.TERMINATED]: '已终止',
      [SessionStatus.REVOKED]: '已撤销',
      [SessionStatus.PENDING_VERIFICATION]: '待验证',
    };
    return displayNames[status] || '未知状态';
  }

  /**
   * @method getStatusDescription
   * @description 获取会话状态的描述
   * @param {SessionStatus} status 会话状态
   * @returns {string} 状态描述
   */
  static getStatusDescription(status: SessionStatus): string {
    const descriptions: Record<SessionStatus, string> = {
      [SessionStatus.ACTIVE]: '会话正常可用',
      [SessionStatus.INACTIVE]: '会话暂时不可用',
      [SessionStatus.SUSPENDED]: '会话被暂停使用',
      [SessionStatus.EXPIRED]: '会话已过期',
      [SessionStatus.TERMINATED]: '会话已被终止',
      [SessionStatus.REVOKED]: '会话已被撤销',
      [SessionStatus.PENDING_VERIFICATION]: '会话等待验证',
    };
    return descriptions[status] || '未知状态';
  }

  /**
   * @method getStatusColor
   * @description 获取会话状态的颜色标识
   * @param {SessionStatus} status 会话状态
   * @returns {string} 颜色标识
   */
  static getStatusColor(status: SessionStatus): string {
    const colors: Record<SessionStatus, string> = {
      [SessionStatus.ACTIVE]: 'green',
      [SessionStatus.INACTIVE]: 'gray',
      [SessionStatus.SUSPENDED]: 'orange',
      [SessionStatus.EXPIRED]: 'red',
      [SessionStatus.TERMINATED]: 'red',
      [SessionStatus.REVOKED]: 'red',
      [SessionStatus.PENDING_VERIFICATION]: 'blue',
    };
    return colors[status] || 'gray';
  }

  /**
   * @method getNextValidStatuses
   * @description 获取当前状态可以转换到的有效状态列表
   * @param {SessionStatus} currentStatus 当前状态
   * @returns {SessionStatus[]} 可转换的状态列表
   */
  static getNextValidStatuses(currentStatus: SessionStatus): SessionStatus[] {
    const transitions: Record<SessionStatus, SessionStatus[]> = {
      [SessionStatus.ACTIVE]: [
        SessionStatus.INACTIVE,
        SessionStatus.SUSPENDED,
        SessionStatus.EXPIRED,
        SessionStatus.TERMINATED,
        SessionStatus.REVOKED,
      ],
      [SessionStatus.INACTIVE]: [
        SessionStatus.ACTIVE,
        SessionStatus.EXPIRED,
        SessionStatus.TERMINATED,
        SessionStatus.REVOKED,
      ],
      [SessionStatus.SUSPENDED]: [
        SessionStatus.ACTIVE,
        SessionStatus.INACTIVE,
        SessionStatus.EXPIRED,
        SessionStatus.TERMINATED,
        SessionStatus.REVOKED,
      ],
      [SessionStatus.EXPIRED]: [],
      [SessionStatus.TERMINATED]: [],
      [SessionStatus.REVOKED]: [],
      [SessionStatus.PENDING_VERIFICATION]: [
        SessionStatus.ACTIVE,
        SessionStatus.TERMINATED,
        SessionStatus.REVOKED,
      ],
    };
    return transitions[currentStatus] || [];
  }

  /**
   * @method isValidTransition
   * @description 检查状态转换是否有效
   * @param {SessionStatus} fromStatus 源状态
   * @param {SessionStatus} toStatus 目标状态
   * @returns {boolean} 转换是否有效
   */
  static isValidTransition(
    fromStatus: SessionStatus,
    toStatus: SessionStatus,
  ): boolean {
    return this.getNextValidStatuses(fromStatus).includes(toStatus);
  }
}
