import { ValueObject } from '@aiofix/core';

/**
 * @class DepartmentDescription
 * @description
 * 部门描述值对象，封装部门描述信息的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 部门描述一旦创建不可变更
 * 2. 部门描述长度必须在有效范围内
 * 3. 部门描述可以为空（可选字段）
 *
 * 相等性判断：
 * 1. 基于标准化后的描述进行相等性比较
 * 2. 忽略前后空格差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装部门描述验证逻辑
 * 2. 提供描述标准化方法
 * 3. 隐藏描述格式细节
 *
 * @property {string} value 部门描述值
 *
 * @example
 * ```typescript
 * const desc1 = new DepartmentDescription('  负责技术研发和产品创新  ');
 * const desc2 = new DepartmentDescription('负责技术研发和产品创新');
 * console.log(desc1.equals(desc2)); // true (忽略空格)
 * ```
 * @since 1.0.0
 */
export class DepartmentDescription extends ValueObject<string> {
  private static readonly MAX_LENGTH = 500;

  constructor(value: string = '') {
    const normalizedValue = value.trim();
    super(normalizedValue);
    this.validateDepartmentDescription(this.value);
  }

  /**
   * @method validateDepartmentDescription
   * @description 验证部门描述的有效性
   * @param {string} value 部门描述值
   * @returns {void}
   * @throws {InvalidDepartmentDescriptionError} 当部门描述无效时抛出
   * @private
   */
  private validateDepartmentDescription(value: string): void {
    if (value.length > DepartmentDescription.MAX_LENGTH) {
      throw new InvalidDepartmentDescriptionError(
        `部门描述长度不能超过${DepartmentDescription.MAX_LENGTH}个字符`,
      );
    }
  }

  /**
   * @method normalizeDescription
   * @description 标准化部门描述
   * @param {string} value 原始描述
   * @returns {string} 标准化后的描述
   * @private
   */
  private normalizeDescription(value: string): string {
    return value.trim();
  }

  /**
   * @method isEmpty
   * @description 判断描述是否为空
   * @returns {boolean} 是否为空
   */
  isEmpty(): boolean {
    return this.value.length === 0;
  }

  /**
   * @method getSummary
   * @description 获取描述摘要（前100个字符）
   * @returns {string} 描述摘要
   */
  getSummary(): string {
    const maxLength = 100;
    if (this.value.length <= maxLength) {
      return this.value;
    }
    return this.value.substring(0, maxLength) + '...';
  }

  /**
   * @method getWordCount
   * @description 获取描述字数
   * @returns {number} 字数
   */
  getWordCount(): number {
    if (this.isEmpty()) {
      return 0;
    }
    return this.value.length;
  }

  /**
   * @method isValid
   * @description 验证字符串是否为有效的部门描述格式
   * @param {string} value 待验证的字符串
   * @returns {boolean} 是否为有效格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new DepartmentDescription(value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @class InvalidDepartmentDescriptionError
 * @description 无效部门描述异常类
 * @extends Error
 */
export class InvalidDepartmentDescriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDepartmentDescriptionError';
  }
}
