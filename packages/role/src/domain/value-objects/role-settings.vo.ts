import { ValueObject } from '@aiofix/core';

/**
 * @interface RoleSettingsData
 * @description 角色设置数据接口
 */
export interface RoleSettingsData {
  readonly isSystemRole: boolean;
  readonly isDefaultRole: boolean;
  readonly canBeDeleted: boolean;
  readonly canBeModified: boolean;
  readonly maxUsers?: number;
  readonly expiresAt?: Date;
  readonly requiresApproval: boolean;
  readonly autoAssign: boolean;
}

/**
 * @class RoleSettings
 * @description
 * 角色设置值对象，封装角色配置的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 角色设置一旦创建不可变更
 * 2. 角色设置必须符合业务规则
 * 3. 系统角色和默认角色有特殊约束
 *
 * 相等性判断：
 * 1. 基于角色设置的完整数据进行比较
 * 2. 支持角色设置的精确匹配
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装角色设置验证逻辑
 * 2. 提供角色设置业务方法
 * 3. 隐藏角色设置格式细节
 *
 * @property {RoleSettingsData} value 角色设置数据
 *
 * @example
 * ```typescript
 * const settings = new RoleSettings({
 *   isSystemRole: false,
 *   isDefaultRole: true,
 *   canBeDeleted: false,
 *   canBeModified: true,
 *   requiresApproval: false,
 *   autoAssign: true
 * });
 * console.log(settings.canBeDeleted()); // false
 * ```
 * @since 1.0.0
 */
export class RoleSettings extends ValueObject<RoleSettingsData> {
  constructor(data: RoleSettingsData) {
    const validatedData = RoleSettings.validateAndNormalizeSettings(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizeSettings
   * @description 验证并标准化角色设置
   * @param {RoleSettingsData} data 原始设置数据
   * @returns {RoleSettingsData} 验证后的设置数据
   * @throws {InvalidRoleSettingsError} 当设置无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizeSettings(
    data: RoleSettingsData,
  ): RoleSettingsData {
    if (!data || typeof data !== 'object') {
      throw new InvalidRoleSettingsError('角色设置不能为空');
    }

    // 验证系统角色约束
    if (data.isSystemRole && data.canBeDeleted) {
      throw new InvalidRoleSettingsError('系统角色不能被删除');
    }

    if (data.isSystemRole && !data.canBeModified) {
      throw new InvalidRoleSettingsError('系统角色必须可以被修改');
    }

    // 验证默认角色约束
    if (data.isDefaultRole && data.canBeDeleted) {
      throw new InvalidRoleSettingsError('默认角色不能被删除');
    }

    // 验证最大用户数量
    if (data.maxUsers !== undefined && data.maxUsers < 0) {
      throw new InvalidRoleSettingsError('最大用户数量不能为负数');
    }

    // 验证过期时间
    if (data.expiresAt && data.expiresAt <= new Date()) {
      throw new InvalidRoleSettingsError('过期时间必须是未来时间');
    }

    return {
      isSystemRole: Boolean(data.isSystemRole),
      isDefaultRole: Boolean(data.isDefaultRole),
      canBeDeleted: Boolean(data.canBeDeleted),
      canBeModified: Boolean(data.canBeModified),
      maxUsers: data.maxUsers,
      expiresAt: data.expiresAt,
      requiresApproval: Boolean(data.requiresApproval),
      autoAssign: Boolean(data.autoAssign),
    };
  }

  /**
   * @method isSystemRole
   * @description 检查是否为系统角色
   * @returns {boolean} 是否为系统角色
   */
  isSystemRole(): boolean {
    return this.value.isSystemRole;
  }

  /**
   * @method isDefaultRole
   * @description 检查是否为默认角色
   * @returns {boolean} 是否为默认角色
   */
  isDefaultRole(): boolean {
    return this.value.isDefaultRole;
  }

  /**
   * @method canBeDeleted
   * @description 检查角色是否可以被删除
   * @returns {boolean} 是否可以被删除
   */
  canBeDeleted(): boolean {
    return this.value.canBeDeleted;
  }

  /**
   * @method canBeModified
   * @description 检查角色是否可以被修改
   * @returns {boolean} 是否可以被修改
   */
  canBeModified(): boolean {
    return this.value.canBeModified;
  }

  /**
   * @method getMaxUsers
   * @description 获取最大用户数量
   * @returns {number | undefined} 最大用户数量
   */
  getMaxUsers(): number | undefined {
    return this.value.maxUsers;
  }

  /**
   * @method getExpiresAt
   * @description 获取过期时间
   * @returns {Date | undefined} 过期时间
   */
  getExpiresAt(): Date | undefined {
    return this.value.expiresAt;
  }

  /**
   * @method requiresApproval
   * @description 检查是否需要审批
   * @returns {boolean} 是否需要审批
   */
  requiresApproval(): boolean {
    return this.value.requiresApproval;
  }

  /**
   * @method isAutoAssign
   * @description 检查是否自动分配
   * @returns {boolean} 是否自动分配
   */
  isAutoAssign(): boolean {
    return this.value.autoAssign;
  }

  /**
   * @method isExpired
   * @description 检查角色是否已过期
   * @returns {boolean} 是否已过期
   */
  isExpired(): boolean {
    if (!this.value.expiresAt) {
      return false;
    }
    return new Date() > this.value.expiresAt;
  }

  /**
   * @method hasUserLimit
   * @description 检查是否有用户数量限制
   * @returns {boolean} 是否有用户数量限制
   */
  hasUserLimit(): boolean {
    return this.value.maxUsers !== undefined;
  }

  /**
   * @method toJSON
   * @description 将角色设置转换为JSON格式
   * @returns {RoleSettingsData} 角色设置数据
   */
  toJSON(): RoleSettingsData {
    return {
      isSystemRole: this.value.isSystemRole,
      isDefaultRole: this.value.isDefaultRole,
      canBeDeleted: this.value.canBeDeleted,
      canBeModified: this.value.canBeModified,
      maxUsers: this.value.maxUsers,
      expiresAt: this.value.expiresAt,
      requiresApproval: this.value.requiresApproval,
      autoAssign: this.value.autoAssign,
    };
  }
}

/**
 * @class InvalidRoleSettingsError
 * @description 无效角色设置错误
 * @extends Error
 */
export class InvalidRoleSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleSettingsError';
  }
}
