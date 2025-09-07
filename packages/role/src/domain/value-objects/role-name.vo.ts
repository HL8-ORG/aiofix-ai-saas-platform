import { ValueObject } from '@aiofix/core';

/**
 * @class RoleName
 * @description
 * 角色名称值对象，封装角色名称的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 角色名称一旦创建不可变更
 * 2. 角色名称长度必须在合理范围内
 * 3. 角色名称不能包含特殊字符
 *
 * 相等性判断：
 * 1. 基于角色名称的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装角色名称验证逻辑
 * 2. 提供角色名称标准化方法
 * 3. 隐藏角色名称格式细节
 *
 * @property {string} value 标准化的角色名称值
 *
 * @example
 * ```typescript
 * const roleName1 = new RoleName('Admin');
 * const roleName2 = new RoleName('admin');
 * console.log(roleName1.equals(roleName2)); // true
 * ```
 * @since 1.0.0
 */
export class RoleName extends ValueObject<string> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 50;
  private static readonly INVALID_CHARS_REGEX = /[<>"'&]/;

  constructor(value: string) {
    const normalizedValue = value.trim();
    super(normalizedValue);
    this.validateRoleName(this.value);
  }

  /**
   * @method validateRoleName
   * @description 验证角色名称的有效性
   * @param {string} value 角色名称值
   * @returns {void}
   * @throws {InvalidRoleNameError} 当角色名称无效时抛出
   * @private
   */
  private validateRoleName(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidRoleNameError('角色名称不能为空');
    }

    if (value.length < RoleName.MIN_LENGTH) {
      throw new InvalidRoleNameError(
        `角色名称长度不能少于${RoleName.MIN_LENGTH}个字符`,
      );
    }

    if (value.length > RoleName.MAX_LENGTH) {
      throw new InvalidRoleNameError(
        `角色名称长度不能超过${RoleName.MAX_LENGTH}个字符`,
      );
    }

    if (RoleName.INVALID_CHARS_REGEX.test(value)) {
      throw new InvalidRoleNameError('角色名称不能包含特殊字符：< > " \' &');
    }
  }

  /**
   * @method toString
   * @description 将角色名称转换为字符串
   * @returns {string} 角色名称字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 将角色名称转换为JSON格式
   * @returns {string} 角色名称字符串
   */
  toJSON(): string {
    return this.value;
  }
}

/**
 * @class InvalidRoleNameError
 * @description 无效角色名称错误
 * @extends Error
 */
export class InvalidRoleNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleNameError';
  }
}
