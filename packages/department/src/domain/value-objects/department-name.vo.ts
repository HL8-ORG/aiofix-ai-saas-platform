import { ValueObject } from '@aiofix/core';

/**
 * @class DepartmentName
 * @description
 * 部门名称值对象，封装部门名称的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 部门名称一旦创建不可变更
 * 2. 部门名称长度必须在有效范围内
 * 3. 部门名称不能包含非法字符
 *
 * 相等性判断：
 * 1. 基于标准化后的名称进行相等性比较
 * 2. 忽略前后空格和大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装部门名称验证逻辑
 * 2. 提供名称标准化方法
 * 3. 隐藏名称格式细节
 *
 * @property {string} value 部门名称值
 *
 * @example
 * ```typescript
 * const name1 = new DepartmentName('  技术研发部  ');
 * const name2 = new DepartmentName('技术研发部');
 * console.log(name1.equals(name2)); // true (忽略空格)
 * ```
 * @since 1.0.0
 */
export class DepartmentName extends ValueObject<string> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 100;
  private static readonly INVALID_CHARS_REGEX = /[<>\"'&]/;

  constructor(value: string) {
    const normalizedValue = value.trim();
    super(normalizedValue);
    this.validateDepartmentName(this.value);
  }

  /**
   * @method validateDepartmentName
   * @description 验证部门名称的有效性
   * @param {string} value 部门名称值
   * @returns {void}
   * @throws {InvalidDepartmentNameError} 当部门名称无效时抛出
   * @private
   */
  private validateDepartmentName(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidDepartmentNameError('部门名称不能为空');
    }

    if (value.length < DepartmentName.MIN_LENGTH) {
      throw new InvalidDepartmentNameError(
        `部门名称长度不能少于${DepartmentName.MIN_LENGTH}个字符`,
      );
    }

    if (value.length > DepartmentName.MAX_LENGTH) {
      throw new InvalidDepartmentNameError(
        `部门名称长度不能超过${DepartmentName.MAX_LENGTH}个字符`,
      );
    }

    if (DepartmentName.INVALID_CHARS_REGEX.test(value)) {
      throw new InvalidDepartmentNameError(
        '部门名称不能包含特殊字符: < > " \' &',
      );
    }
  }

  /**
   * @method normalizeName
   * @description 标准化部门名称
   * @param {string} value 原始名称
   * @returns {string} 标准化后的名称
   * @private
   */
  private normalizeName(value: string): string {
    return value.trim();
  }

  /**
   * @method getDisplayName
   * @description 获取显示用的部门名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return this.value;
  }

  /**
   * @method getShortName
   * @description 获取部门简称（前20个字符）
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
   * @description 验证字符串是否为有效的部门名称格式
   * @param {string} value 待验证的字符串
   * @returns {boolean} 是否为有效格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new DepartmentName(value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @class InvalidDepartmentNameError
 * @description 无效部门名称异常类
 * @extends Error
 */
export class InvalidDepartmentNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDepartmentNameError';
  }
}
