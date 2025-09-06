/**
 * 用户状态枚举
 *
 * 设计原理：
 * - 定义用户账户的生命周期状态
 * - 支持用户状态转换的业务规则
 * - 提供状态验证和转换方法
 *
 * 业务规则：
 * - 用户状态必须明确且有效
 * - 状态转换必须符合业务逻辑
 * - 某些状态转换需要特殊权限
 */
export enum UserStatus {
  /**
   * 待激活状态
   * - 用户已注册但未激活
   * - 需要邮箱验证或管理员激活
   */
  PENDING = 'pending',

  /**
   * 激活状态
   * - 用户账户正常可用
   * - 可以正常登录和使用系统
   */
  ACTIVE = 'active',

  /**
   * 禁用状态
   * - 用户账户被管理员禁用
   * - 不能登录但数据保留
   */
  DISABLED = 'disabled',

  /**
   * 锁定状态
   * - 用户账户因安全原因被锁定
   * - 通常因多次登录失败触发
   */
  LOCKED = 'locked',

  /**
   * 暂停状态
   * - 用户账户被临时暂停
   * - 可以恢复但需要管理员操作
   */
  SUSPENDED = 'suspended',

  /**
   * 已删除状态
   * - 用户账户已被删除
   * - 数据可能被软删除或硬删除
   */
  DELETED = 'deleted',
}

/**
 * 用户状态转换规则
 *
 * 业务规则：
 * - 定义允许的状态转换
 * - 确保状态转换的合法性
 */
export class UserStatusTransition {
  private static readonly allowedTransitions: Map<UserStatus, UserStatus[]> =
    new Map([
      [UserStatus.PENDING, [UserStatus.ACTIVE, UserStatus.DELETED]],
      [
        UserStatus.ACTIVE,
        [
          UserStatus.DISABLED,
          UserStatus.LOCKED,
          UserStatus.SUSPENDED,
          UserStatus.DELETED,
        ],
      ],
      [UserStatus.DISABLED, [UserStatus.ACTIVE, UserStatus.DELETED]],
      [UserStatus.LOCKED, [UserStatus.ACTIVE, UserStatus.DISABLED]],
      [UserStatus.SUSPENDED, [UserStatus.ACTIVE, UserStatus.DELETED]],
      [UserStatus.DELETED, []], // 已删除状态不能转换到其他状态
    ]);

  /**
   * 检查状态转换是否允许
   *
   * @param fromStatus 当前状态
   * @param toStatus 目标状态
   * @returns 是否允许转换
   */
  public static isTransitionAllowed(
    fromStatus: UserStatus,
    toStatus: UserStatus,
  ): boolean {
    if (fromStatus === toStatus) {
      return true; // 相同状态转换总是允许的
    }

    const allowedTargets = this.allowedTransitions.get(fromStatus);
    return allowedTargets ? allowedTargets.includes(toStatus) : false;
  }

  /**
   * 获取允许的状态转换列表
   *
   * @param currentStatus 当前状态
   * @returns 允许转换到的状态列表
   */
  public static getAllowedTransitions(currentStatus: UserStatus): UserStatus[] {
    const allowedTargets = this.allowedTransitions.get(currentStatus);
    return allowedTargets ? [...allowedTargets] : [];
  }

  /**
   * 验证状态转换
   *
   * @param fromStatus 当前状态
   * @param toStatus 目标状态
   * @throws InvalidStatusTransitionError 如果转换不允许
   */
  public static validateTransition(
    fromStatus: UserStatus,
    toStatus: UserStatus,
  ): void {
    if (!this.isTransitionAllowed(fromStatus, toStatus)) {
      throw new InvalidStatusTransitionError(
        `Invalid status transition from ${fromStatus} to ${toStatus}`,
      );
    }
  }
}

/**
 * 用户状态工具类
 *
 * 提供用户状态相关的业务逻辑方法
 */
export class UserStatusUtils {
  /**
   * 检查用户是否可以登录
   *
   * @param status 用户状态
   * @returns 是否可以登录
   */
  public static canLogin(status: UserStatus): boolean {
    return status === UserStatus.ACTIVE;
  }

  /**
   * 检查用户是否被禁用
   *
   * @param status 用户状态
   * @returns 是否被禁用
   */
  public static isDisabled(status: UserStatus): boolean {
    return [
      UserStatus.DISABLED,
      UserStatus.LOCKED,
      UserStatus.SUSPENDED,
      UserStatus.DELETED,
    ].includes(status);
  }

  /**
   * 检查用户是否需要激活
   *
   * @param status 用户状态
   * @returns 是否需要激活
   */
  public static needsActivation(status: UserStatus): boolean {
    return status === UserStatus.PENDING;
  }

  /**
   * 检查用户是否已删除
   *
   * @param status 用户状态
   * @returns 是否已删除
   */
  public static isDeleted(status: UserStatus): boolean {
    return status === UserStatus.DELETED;
  }

  /**
   * 获取状态显示名称
   *
   * @param status 用户状态
   * @returns 显示名称
   */
  public static getDisplayName(status: UserStatus): string {
    const displayNames: Record<UserStatus, string> = {
      [UserStatus.PENDING]: '待激活',
      [UserStatus.ACTIVE]: '正常',
      [UserStatus.DISABLED]: '已禁用',
      [UserStatus.LOCKED]: '已锁定',
      [UserStatus.SUSPENDED]: '已暂停',
      [UserStatus.DELETED]: '已删除',
    };

    return displayNames[status] || status;
  }

  /**
   * 获取状态描述
   *
   * @param status 用户状态
   * @returns 状态描述
   */
  public static getDescription(status: UserStatus): string {
    const descriptions: Record<UserStatus, string> = {
      [UserStatus.PENDING]: '用户已注册但未激活，需要邮箱验证或管理员激活',
      [UserStatus.ACTIVE]: '用户账户正常可用，可以正常登录和使用系统',
      [UserStatus.DISABLED]: '用户账户被管理员禁用，不能登录但数据保留',
      [UserStatus.LOCKED]: '用户账户因安全原因被锁定，通常因多次登录失败触发',
      [UserStatus.SUSPENDED]: '用户账户被临时暂停，可以恢复但需要管理员操作',
      [UserStatus.DELETED]: '用户账户已被删除，数据可能被软删除或硬删除',
    };

    return descriptions[status] || '未知状态';
  }
}

/**
 * 无效状态转换异常
 *
 * 业务规则：
 * - 当状态转换不符合业务规则时抛出
 */
export class InvalidStatusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidStatusTransitionError';
  }
}
