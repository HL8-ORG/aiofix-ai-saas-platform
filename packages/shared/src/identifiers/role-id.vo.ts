import { UUIDIdentifier } from './base-identifier.vo';

/**
 * @class RoleId
 * @description
 * 角色ID值对象，封装角色唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 角色ID一旦创建不可变更
 * 2. 角色ID格式必须符合UUID v4标准
 * 3. 角色ID不能为空或无效值
 * 4. 角色ID必须全局唯一
 *
 * 相等性判断：
 * 1. 基于角色ID的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装角色ID验证逻辑
 * 2. 提供角色ID生成方法
 * 3. 隐藏角色ID格式细节
 *
 * @property {string} value 标准化的角色ID值
 *
 * @example
 * ```typescript
 * const roleId1 = RoleId.generate();
 * const roleId2 = RoleId.fromString('123e4567-e89b-12d3-a456-426614174000');
 * console.log(roleId1.equals(roleId2)); // false
 * ```
 * @since 1.0.0
 */
export class RoleId extends UUIDIdentifier {
  /**
   * @method generate
   * @description 生成新的角色ID
   * @returns {RoleId} 新的角色ID实例
   * @static
   */
  static generate(): RoleId {
    return new RoleId();
  }

  /**
   * @method fromString
   * @description 从字符串创建角色ID
   * @param {string} value 角色ID字符串
   * @returns {RoleId} 角色ID实例
   * @static
   */
  static fromString(value: string): RoleId {
    return new RoleId(value);
  }

  /**
   * @method isValid
   * @description 检查字符串是否为有效的角色ID格式
   * @param {string} value 要检查的字符串
   * @returns {boolean} 是否为有效的角色ID格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new RoleId(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method create
   * @description 创建角色ID（与fromString功能相同，提供一致的接口）
   * @param {string} value 角色ID字符串
   * @returns {RoleId} 角色ID实例
   * @static
   */
  static create(value: string): RoleId {
    return RoleId.fromString(value);
  }
}

/**
 * @class InvalidRoleIdError
 * @description
 * 无效角色ID异常，当角色ID不符合业务规则时抛出。
 *
 * 业务规则：
 * 1. 当角色ID格式无效时抛出
 * 2. 当角色ID为空时抛出
 * 3. 提供清晰的错误信息
 *
 * @example
 * ```typescript
 * try {
 *   new RoleId('invalid-id');
 * } catch (error) {
 *   console.log(error instanceof InvalidRoleIdError); // true
 * }
 * ```
 * @since 1.0.0
 */
export class InvalidRoleIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleIdError';
  }
}
