/**
 * @file status.enum.ts
 * @description 通用状态枚举和转换逻辑
 *
 * 提供系统中通用的状态定义和状态转换规则
 */

/**
 * @enum Status
 * @description 通用状态枚举
 *
 * 定义系统中通用的状态值，适用于各种实体
 */
export enum Status {
  /** 待激活状态 */
  PENDING = 'PENDING',
  /** 激活状态 */
  ACTIVE = 'ACTIVE',
  /** 禁用状态 */
  DISABLED = 'DISABLED',
  /** 锁定状态 */
  LOCKED = 'LOCKED',
  /** 暂停状态 */
  SUSPENDED = 'SUSPENDED',
  /** 已删除状态 */
  DELETED = 'DELETED',
}

/**
 * @class StatusTransition
 * @description 状态转换规则管理
 *
 * 定义允许的状态转换和转换规则
 */
export class StatusTransition {
  private static readonly allowedTransitions: Map<Status, Status[]> = new Map([
    [Status.PENDING, [Status.ACTIVE, Status.DELETED]],
    [
      Status.ACTIVE,
      [Status.DISABLED, Status.LOCKED, Status.SUSPENDED, Status.DELETED],
    ],
    [Status.DISABLED, [Status.ACTIVE, Status.DELETED]],
    [Status.LOCKED, [Status.ACTIVE, Status.DISABLED]],
    [Status.SUSPENDED, [Status.ACTIVE, Status.DELETED]],
    [Status.DELETED, []], // 已删除状态不能转换到其他状态
  ]);

  /**
   * @method isTransitionAllowed
   * @description 检查状态转换是否允许
   * @param {Status} fromStatus 当前状态
   * @param {Status} toStatus 目标状态
   * @returns {boolean} 是否允许转换
   */
  public static isTransitionAllowed(
    fromStatus: Status,
    toStatus: Status,
  ): boolean {
    if (fromStatus === toStatus) {
      return true; // 相同状态转换总是允许的
    }

    const allowedTargets = this.allowedTransitions.get(fromStatus);
    return allowedTargets ? allowedTargets.includes(toStatus) : false;
  }

  /**
   * @method getAllowedTransitions
   * @description 获取允许的状态转换列表
   * @param {Status} currentStatus 当前状态
   * @returns {Status[]} 允许转换到的状态列表
   */
  public static getAllowedTransitions(currentStatus: Status): Status[] {
    const allowedTargets = this.allowedTransitions.get(currentStatus);
    return allowedTargets ? [...allowedTargets] : [];
  }

  /**
   * @method validateTransition
   * @description 验证状态转换
   * @param {Status} fromStatus 当前状态
   * @param {Status} toStatus 目标状态
   * @throws {InvalidStatusTransitionError} 如果转换不允许
   */
  public static validateTransition(fromStatus: Status, toStatus: Status): void {
    if (!this.isTransitionAllowed(fromStatus, toStatus)) {
      throw new InvalidStatusTransitionError(
        `Invalid status transition from ${fromStatus} to ${toStatus}`,
      );
    }
  }
}

/**
 * @class StatusUtils
 * @description 状态工具类
 *
 * 提供状态相关的业务逻辑方法
 */
export class StatusUtils {
  /**
   * @method canLogin
   * @description 检查是否可以登录
   * @param {Status} status 状态
   * @returns {boolean} 是否可以登录
   */
  public static canLogin(status: Status): boolean {
    return status === Status.ACTIVE;
  }

  /**
   * @method isDisabled
   * @description 检查是否被禁用
   * @param {Status} status 状态
   * @returns {boolean} 是否被禁用
   */
  public static isDisabled(status: Status): boolean {
    return [
      Status.DISABLED,
      Status.LOCKED,
      Status.SUSPENDED,
      Status.DELETED,
    ].includes(status);
  }

  /**
   * @method needsActivation
   * @description 检查是否需要激活
   * @param {Status} status 状态
   * @returns {boolean} 是否需要激活
   */
  public static needsActivation(status: Status): boolean {
    return status === Status.PENDING;
  }

  /**
   * @method isDeleted
   * @description 检查是否已删除
   * @param {Status} status 状态
   * @returns {boolean} 是否已删除
   */
  public static isDeleted(status: Status): boolean {
    return status === Status.DELETED;
  }

  /**
   * @method getDisplayName
   * @description 获取状态显示名称
   * @param {Status} status 状态
   * @returns {string} 显示名称
   */
  public static getDisplayName(status: Status): string {
    const displayNames: Record<Status, string> = {
      [Status.PENDING]: '待激活',
      [Status.ACTIVE]: '正常',
      [Status.DISABLED]: '已禁用',
      [Status.LOCKED]: '已锁定',
      [Status.SUSPENDED]: '已暂停',
      [Status.DELETED]: '已删除',
    };

    return displayNames[status] || status;
  }

  /**
   * @method getDescription
   * @description 获取状态描述
   * @param {Status} status 状态
   * @returns {string} 状态描述
   */
  public static getDescription(status: Status): string {
    const descriptions: Record<Status, string> = {
      [Status.PENDING]: '已注册但未激活，需要邮箱验证或管理员激活',
      [Status.ACTIVE]: '账户正常可用，可以正常登录和使用系统',
      [Status.DISABLED]: '账户被管理员禁用，不能登录但数据保留',
      [Status.LOCKED]: '账户因安全原因被锁定，通常因多次登录失败触发',
      [Status.SUSPENDED]: '账户被临时暂停，可以恢复但需要管理员操作',
      [Status.DELETED]: '账户已被删除，数据可能被软删除或硬删除',
    };

    return descriptions[status] || '未知状态';
  }
}

/**
 * @class InvalidStatusTransitionError
 * @description 无效状态转换异常
 *
 * 当状态转换不符合业务规则时抛出
 */
export class InvalidStatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}
