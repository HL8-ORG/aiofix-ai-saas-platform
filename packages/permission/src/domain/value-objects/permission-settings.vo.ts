import { ValueObject } from '@aiofix/core';

/**
 * @interface PermissionSettingsData
 * @description 权限设置数据接口
 */
export interface PermissionSettingsData {
  readonly isSystemPermission: boolean;
  readonly isDefaultPermission: boolean;
  readonly canBeDeleted: boolean;
  readonly canBeModified: boolean;
  readonly requiresApproval: boolean;
  readonly isSensitive: boolean;
  readonly maxUsageCount?: number;
  readonly expiresAt?: Date;
  readonly effectiveFrom?: Date;
  readonly effectiveTo?: Date;
}

/**
 * @class PermissionSettings
 * @description
 * 权限设置值对象，封装权限配置的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 权限设置一旦创建不可变更
 * 2. 权限设置必须符合业务规则
 * 3. 系统权限和默认权限有特殊约束
 *
 * 相等性判断：
 * 1. 基于权限设置的完整数据进行比较
 * 2. 支持权限设置的精确匹配
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装权限设置验证逻辑
 * 2. 提供权限设置业务方法
 * 3. 隐藏权限设置格式细节
 *
 * @property {PermissionSettingsData} value 权限设置数据
 *
 * @example
 * ```typescript
 * const settings = new PermissionSettings({
 *   isSystemPermission: false,
 *   isDefaultPermission: true,
 *   canBeDeleted: false,
 *   canBeModified: true,
 *   requiresApproval: false,
 *   isSensitive: true
 * });
 * console.log(settings.canBeDeleted()); // false
 * ```
 * @since 1.0.0
 */
export class PermissionSettings extends ValueObject<PermissionSettingsData> {
  constructor(data: PermissionSettingsData) {
    const validatedData = PermissionSettings.validateAndNormalizeSettings(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizeSettings
   * @description 验证并标准化权限设置
   * @param {PermissionSettingsData} data 原始设置数据
   * @returns {PermissionSettingsData} 验证后的设置数据
   * @throws {InvalidPermissionSettingsError} 当设置无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizeSettings(
    data: PermissionSettingsData,
  ): PermissionSettingsData {
    if (!data || typeof data !== 'object') {
      throw new InvalidPermissionSettingsError('权限设置不能为空');
    }

    // 验证系统权限约束
    if (data.isSystemPermission && data.canBeDeleted) {
      throw new InvalidPermissionSettingsError('系统权限不能被删除');
    }

    if (data.isSystemPermission && !data.canBeModified) {
      throw new InvalidPermissionSettingsError('系统权限必须可以被修改');
    }

    // 验证默认权限约束
    if (data.isDefaultPermission && data.canBeDeleted) {
      throw new InvalidPermissionSettingsError('默认权限不能被删除');
    }

    // 验证最大使用次数
    if (data.maxUsageCount !== undefined && data.maxUsageCount < 0) {
      throw new InvalidPermissionSettingsError('最大使用次数不能为负数');
    }

    // 验证时间范围
    if (
      data.effectiveFrom &&
      data.effectiveTo &&
      data.effectiveFrom >= data.effectiveTo
    ) {
      throw new InvalidPermissionSettingsError('生效开始时间必须早于结束时间');
    }

    if (data.expiresAt && data.expiresAt <= new Date()) {
      throw new InvalidPermissionSettingsError('过期时间必须是未来时间');
    }

    return {
      isSystemPermission: Boolean(data.isSystemPermission),
      isDefaultPermission: Boolean(data.isDefaultPermission),
      canBeDeleted: Boolean(data.canBeDeleted),
      canBeModified: Boolean(data.canBeModified),
      requiresApproval: Boolean(data.requiresApproval),
      isSensitive: Boolean(data.isSensitive),
      maxUsageCount: data.maxUsageCount,
      expiresAt: data.expiresAt,
      effectiveFrom: data.effectiveFrom,
      effectiveTo: data.effectiveTo,
    };
  }

  /**
   * @method isSystemPermission
   * @description 检查是否为系统权限
   * @returns {boolean} 是否为系统权限
   */
  isSystemPermission(): boolean {
    return this.value.isSystemPermission;
  }

  /**
   * @method isDefaultPermission
   * @description 检查是否为默认权限
   * @returns {boolean} 是否为默认权限
   */
  isDefaultPermission(): boolean {
    return this.value.isDefaultPermission;
  }

  /**
   * @method canBeDeleted
   * @description 检查权限是否可以被删除
   * @returns {boolean} 是否可以被删除
   */
  canBeDeleted(): boolean {
    return this.value.canBeDeleted;
  }

  /**
   * @method canBeModified
   * @description 检查权限是否可以被修改
   * @returns {boolean} 是否可以被修改
   */
  canBeModified(): boolean {
    return this.value.canBeModified;
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
   * @method isSensitive
   * @description 检查是否为敏感权限
   * @returns {boolean} 是否为敏感权限
   */
  isSensitive(): boolean {
    return this.value.isSensitive;
  }

  /**
   * @method getMaxUsageCount
   * @description 获取最大使用次数
   * @returns {number | undefined} 最大使用次数
   */
  getMaxUsageCount(): number | undefined {
    return this.value.maxUsageCount;
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
   * @method getEffectiveFrom
   * @description 获取生效开始时间
   * @returns {Date | undefined} 生效开始时间
   */
  getEffectiveFrom(): Date | undefined {
    return this.value.effectiveFrom;
  }

  /**
   * @method getEffectiveTo
   * @description 获取生效结束时间
   * @returns {Date | undefined} 生效结束时间
   */
  getEffectiveTo(): Date | undefined {
    return this.value.effectiveTo;
  }

  /**
   * @method isExpired
   * @description 检查权限是否已过期
   * @returns {boolean} 是否已过期
   */
  isExpired(): boolean {
    if (!this.value.expiresAt) {
      return false;
    }
    return new Date() > this.value.expiresAt;
  }

  /**
   * @method isEffective
   * @description 检查权限是否在有效期内
   * @returns {boolean} 是否在有效期内
   */
  isEffective(): boolean {
    const now = new Date();

    if (this.value.effectiveFrom && now < this.value.effectiveFrom) {
      return false;
    }

    if (this.value.effectiveTo && now > this.value.effectiveTo) {
      return false;
    }

    return true;
  }

  /**
   * @method hasUsageLimit
   * @description 检查是否有使用次数限制
   * @returns {boolean} 是否有使用次数限制
   */
  hasUsageLimit(): boolean {
    return this.value.maxUsageCount !== undefined;
  }

  /**
   * @method hasTimeRestriction
   * @description 检查是否有时间限制
   * @returns {boolean} 是否有时间限制
   */
  hasTimeRestriction(): boolean {
    return !!(
      this.value.effectiveFrom ??
      this.value.effectiveTo ??
      this.value.expiresAt
    );
  }

  /**
   * @method isRestricted
   * @description 检查权限是否有限制
   * @returns {boolean} 是否有限制
   */
  isRestricted(): boolean {
    return (
      this.hasUsageLimit() ||
      this.hasTimeRestriction() ||
      this.requiresApproval() ||
      this.isSensitive()
    );
  }

  /**
   * @method getRestrictionDescription
   * @description 获取限制描述
   * @returns {string} 限制描述
   */
  getRestrictionDescription(): string {
    const restrictions: string[] = [];

    if (this.hasUsageLimit()) {
      restrictions.push(`最大使用次数：${this.value.maxUsageCount}`);
    }

    if (this.hasTimeRestriction()) {
      if (this.value.effectiveFrom) {
        restrictions.push(
          `生效时间：${this.value.effectiveFrom.toISOString()}`,
        );
      }
      if (this.value.effectiveTo) {
        restrictions.push(`失效时间：${this.value.effectiveTo.toISOString()}`);
      }
      if (this.value.expiresAt) {
        restrictions.push(`过期时间：${this.value.expiresAt.toISOString()}`);
      }
    }

    if (this.requiresApproval()) {
      restrictions.push('需要审批');
    }

    if (this.isSensitive()) {
      restrictions.push('敏感权限');
    }

    return restrictions.length > 0 ? restrictions.join('，') : '无限制';
  }

  /**
   * @method toJSON
   * @description 将权限设置转换为JSON格式
   * @returns {PermissionSettingsData} 权限设置数据
   */
  toJSON(): PermissionSettingsData {
    return {
      isSystemPermission: this.value.isSystemPermission,
      isDefaultPermission: this.value.isDefaultPermission,
      canBeDeleted: this.value.canBeDeleted,
      canBeModified: this.value.canBeModified,
      requiresApproval: this.value.requiresApproval,
      isSensitive: this.value.isSensitive,
      maxUsageCount: this.value.maxUsageCount,
      expiresAt: this.value.expiresAt,
      effectiveFrom: this.value.effectiveFrom,
      effectiveTo: this.value.effectiveTo,
    };
  }
}

/**
 * @class InvalidPermissionSettingsError
 * @description 无效权限设置错误
 * @extends Error
 */
export class InvalidPermissionSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPermissionSettingsError';
  }
}
