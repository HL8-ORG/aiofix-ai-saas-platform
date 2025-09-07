import { ValueObject } from '@aiofix/core';

/**
 * @class RoleDescription
 * @description
 * 角色描述值对象，封装角色描述的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 角色描述一旦创建不可变更
 * 2. 角色描述长度必须在合理范围内
 * 3. 角色描述可以为空
 *
 * 相等性判断：
 * 1. 基于角色描述的标准化值进行相等性比较
 * 2. 忽略前后空格差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装角色描述验证逻辑
 * 2. 提供角色描述标准化方法
 * 3. 隐藏角色描述格式细节
 *
 * @property {string} value 标准化的角色描述值
 *
 * @example
 * ```typescript
 * const description1 = new RoleDescription('系统管理员角色');
 * const description2 = new RoleDescription(' 系统管理员角色 ');
 * console.log(description1.equals(description2)); // true
 * ```
 * @since 1.0.0
 */
export class RoleDescription extends ValueObject<string> {
  private static readonly MAX_LENGTH = 500;

  constructor(value: string = '') {
    const normalizedValue = value.trim();
    super(normalizedValue);
    this.validateRoleDescription(this.value);
  }

  /**
   * @method validateRoleDescription
   * @description 验证角色描述的有效性
   * @param {string} value 角色描述值
   * @returns {void}
   * @throws {InvalidRoleDescriptionError} 当角色描述无效时抛出
   * @private
   */
  private validateRoleDescription(value: string): void {
    if (value.length > RoleDescription.MAX_LENGTH) {
      throw new InvalidRoleDescriptionError(
        `角色描述长度不能超过${RoleDescription.MAX_LENGTH}个字符`,
      );
    }
  }

  /**
   * @method isEmpty
   * @description 检查角色描述是否为空
   * @returns {boolean} 是否为空
   */
  isEmpty(): boolean {
    return this.value.length === 0;
  }

  /**
   * @method toString
   * @description 将角色描述转换为字符串
   * @returns {string} 角色描述字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 将角色描述转换为JSON格式
   * @returns {string} 角色描述字符串
   */
  toJSON(): string {
    return this.value;
  }
}

/**
 * @class InvalidRoleDescriptionError
 * @description 无效角色描述错误
 * @extends Error
 */
export class InvalidRoleDescriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleDescriptionError';
  }
}
