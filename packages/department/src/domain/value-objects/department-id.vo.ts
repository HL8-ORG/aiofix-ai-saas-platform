import { ValueObject } from '@aiofix/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class DepartmentId
 * @description
 * 部门ID值对象，封装部门标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 部门ID一旦创建不可变更
 * 2. 部门ID必须是有效的UUID格式
 * 3. 部门ID在组织内必须唯一
 *
 * 相等性判断：
 * 1. 基于UUID值进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 * 3. 忽略大小写差异
 *
 * 业务概念封装：
 * 1. 封装部门标识符验证逻辑
 * 2. 提供部门ID生成方法
 * 3. 隐藏UUID格式细节
 *
 * @property {string} value 部门ID的UUID值
 *
 * @example
 * ```typescript
 * const deptId1 = new DepartmentId('123e4567-e89b-12d3-a456-426614174000');
 * const deptId2 = new DepartmentId(); // 自动生成UUID
 * console.log(deptId1.equals(deptId2)); // false
 * ```
 * @since 1.0.0
 */
export class DepartmentId extends ValueObject<string> {
  constructor(value?: string) {
    super(value ?? uuidv4());
    this.validateDepartmentId(this.value);
  }

  /**
   * @method validateDepartmentId
   * @description 验证部门ID格式的有效性
   * @param {string} value 部门ID值
   * @returns {void}
   * @throws {InvalidDepartmentIdError} 当部门ID格式无效时抛出
   * @private
   */
  private validateDepartmentId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidDepartmentIdError('部门ID不能为空');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new InvalidDepartmentIdError(`无效的部门ID格式: ${value}`);
    }
  }

  /**
   * @method fromString
   * @description 从字符串创建部门ID
   * @param {string} value 部门ID字符串
   * @returns {DepartmentId} 部门ID实例
   * @throws {InvalidDepartmentIdError} 当字符串格式无效时抛出
   * @static
   */
  static fromString(value: string): DepartmentId {
    return new DepartmentId(value);
  }

  /**
   * @method generate
   * @description 生成新的部门ID
   * @returns {DepartmentId} 新的部门ID实例
   * @static
   */
  static generate(): DepartmentId {
    return new DepartmentId();
  }

  /**
   * @method isValid
   * @description 验证字符串是否为有效的部门ID格式
   * @param {string} value 待验证的字符串
   * @returns {boolean} 是否为有效格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new DepartmentId(value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @class InvalidDepartmentIdError
 * @description 无效部门ID异常类
 * @extends Error
 */
export class InvalidDepartmentIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDepartmentIdError';
  }
}
