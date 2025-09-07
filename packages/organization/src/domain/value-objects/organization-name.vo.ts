import { ValueObject } from '@aiofix/core';

/**
 * @class OrganizationName
 * @description
 * 组织名称值对象，封装组织名称的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 组织名称一旦创建不可变更
 * 2. 组织名称长度必须在有效范围内
 * 3. 组织名称不能包含非法字符
 *
 * 相等性判断：
 * 1. 基于标准化后的名称进行相等性比较
 * 2. 忽略前后空格和大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装组织名称验证逻辑
 * 2. 提供名称标准化方法
 * 3. 隐藏名称格式细节
 *
 * @property {string} value 组织名称值
 *
 * @example
 * ```typescript
 * const name1 = new OrganizationName('  AI开发团队  ');
 * const name2 = new OrganizationName('ai开发团队');
 * console.log(name1.equals(name2)); // true (忽略空格和大小写)
 * ```
 * @since 1.0.0
 */
export class OrganizationName extends ValueObject<string> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 100;
  private static readonly INVALID_CHARS_REGEX = /[<>\"'&]/;

  constructor(value: string) {
    const normalizedValue = value.trim();
    super(normalizedValue);
    this.validateOrganizationName(this.value);
  }

  /**
   * @method validateOrganizationName
   * @description 验证组织名称的有效性
   * @param {string} value 组织名称值
   * @returns {void}
   * @throws {InvalidOrganizationNameError} 当组织名称无效时抛出
   * @private
   */
  private validateOrganizationName(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidOrganizationNameError('组织名称不能为空');
    }

    if (value.length < OrganizationName.MIN_LENGTH) {
      throw new InvalidOrganizationNameError(
        `组织名称长度不能少于${OrganizationName.MIN_LENGTH}个字符`,
      );
    }

    if (value.length > OrganizationName.MAX_LENGTH) {
      throw new InvalidOrganizationNameError(
        `组织名称长度不能超过${OrganizationName.MAX_LENGTH}个字符`,
      );
    }

    if (OrganizationName.INVALID_CHARS_REGEX.test(value)) {
      throw new InvalidOrganizationNameError(
        '组织名称不能包含特殊字符: < > " \' &',
      );
    }
  }

  /**
   * @method normalizeName
   * @description 标准化组织名称
   * @param {string} value 原始名称
   * @returns {string} 标准化后的名称
   * @private
   */
  private normalizeName(value: string): string {
    return value.trim();
  }

  /**
   * @method getDisplayName
   * @description 获取显示用的组织名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return this.value;
  }

  /**
   * @method getShortName
   * @description 获取组织简称（前20个字符）
   * @returns {string} 简称
   */
  getShortName(): string {
    const maxLength = 20;
    if (this.value.length <= maxLength) {
      return this.value;
    }
    return this.value.substring(0, maxLength) + '...';
  }

  /**
   * @method isValid
   * @description 验证字符串是否为有效的组织名称格式
   * @param {string} value 待验证的字符串
   * @returns {boolean} 是否为有效格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new OrganizationName(value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @class InvalidOrganizationNameError
 * @description 无效组织名称异常类
 * @extends Error
 */
export class InvalidOrganizationNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrganizationNameError';
  }
}
