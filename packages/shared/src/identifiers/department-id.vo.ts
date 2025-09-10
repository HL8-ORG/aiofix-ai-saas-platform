import { UUIDIdentifier } from './base-identifier.vo';

/**
 * @class DepartmentId
 * @description
 * 部门ID值对象，封装部门唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 部门ID一旦创建不可变更
 * 2. 部门ID格式必须符合UUID v4标准
 * 3. 部门ID不能为空或无效值
 * 4. 部门ID必须全局唯一
 *
 * 相等性判断：
 * 1. 基于部门ID的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装部门ID验证逻辑
 * 2. 提供部门ID生成方法
 * 3. 隐藏部门ID格式细节
 *
 * @property {string} value 标准化的部门ID值
 *
 * @example
 * ```typescript
 * const departmentId1 = DepartmentId.generate();
 * const departmentId2 = DepartmentId.fromString('123e4567-e89b-12d3-a456-426614174000');
 * console.log(departmentId1.equals(departmentId2)); // false
 * ```
 * @since 1.0.0
 */
export class DepartmentId extends UUIDIdentifier {
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
   * @method fromString
   * @description 从字符串创建部门ID
   * @param {string} value 部门ID字符串
   * @returns {DepartmentId} 部门ID实例
   * @static
   */
  static fromString(value: string): DepartmentId {
    return new DepartmentId(value);
  }

  /**
   * @method isValid
   * @description 检查字符串是否为有效的部门ID格式
   * @param {string} value 要检查的字符串
   * @returns {boolean} 是否为有效的部门ID格式
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

  /**
   * @method create
   * @description 创建部门ID（与fromString功能相同，提供一致的接口）
   * @param {string} value 部门ID字符串
   * @returns {DepartmentId} 部门ID实例
   * @static
   */
  static create(value: string): DepartmentId {
    return DepartmentId.fromString(value);
  }
}

/**
 * @class InvalidDepartmentIdError
 * @description
 * 无效部门ID异常，当部门ID不符合业务规则时抛出。
 *
 * 业务规则：
 * 1. 当部门ID格式无效时抛出
 * 2. 当部门ID为空时抛出
 * 3. 提供清晰的错误信息
 *
 * @example
 * ```typescript
 * try {
 *   new DepartmentId('invalid-id');
 * } catch (error) {
 *   console.log(error instanceof InvalidDepartmentIdError); // true
 * }
 * ```
 * @since 1.0.0
 */
export class InvalidDepartmentIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDepartmentIdError';
  }
}
