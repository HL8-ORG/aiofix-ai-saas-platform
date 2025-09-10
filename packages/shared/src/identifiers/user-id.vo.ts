import { UUIDIdentifier } from './base-identifier.vo';

/**
 * @class UserId
 * @description
 * 用户ID值对象，封装用户唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 用户ID一旦创建不可变更
 * 2. 用户ID格式必须符合UUID v4标准
 * 3. 用户ID不能为空或无效值
 * 4. 用户ID必须全局唯一
 *
 * 相等性判断：
 * 1. 基于用户ID的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装用户ID验证逻辑
 * 2. 提供用户ID生成方法
 * 3. 隐藏用户ID格式细节
 *
 * @property {string} value 标准化的用户ID值
 *
 * @example
 * ```typescript
 * const userId1 = UserId.generate();
 * const userId2 = UserId.fromString('123e4567-e89b-12d3-a456-426614174000');
 * console.log(userId1.equals(userId2)); // false
 * ```
 * @since 1.0.0
 */
export class UserId extends UUIDIdentifier {
  /**
   * @method generate
   * @description 生成新的用户ID
   * @returns {UserId} 新的用户ID实例
   * @static
   */
  static generate(): UserId {
    return new UserId();
  }

  /**
   * @method fromString
   * @description 从字符串创建用户ID
   * @param {string} value 用户ID字符串
   * @returns {UserId} 用户ID实例
   * @static
   */
  static fromString(value: string): UserId {
    return new UserId(value);
  }

  /**
   * @method isValid
   * @description 检查字符串是否为有效的用户ID格式
   * @param {string} value 要检查的字符串
   * @returns {boolean} 是否为有效的用户ID格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new UserId(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method create
   * @description 创建用户ID（与fromString功能相同，提供一致的接口）
   * @param {string} value 用户ID字符串
   * @returns {UserId} 用户ID实例
   * @static
   */
  static create(value: string): UserId {
    return UserId.fromString(value);
  }
}

/**
 * @class InvalidUserIdError
 * @description
 * 无效用户ID异常，当用户ID不符合业务规则时抛出。
 *
 * 业务规则：
 * 1. 当用户ID格式无效时抛出
 * 2. 当用户ID为空时抛出
 * 3. 提供清晰的错误信息
 *
 * @example
 * ```typescript
 * try {
 *   new UserId('invalid-id');
 * } catch (error) {
 *   console.log(error instanceof InvalidUserIdError); // true
 * }
 * ```
 * @since 1.0.0
 */
export class InvalidUserIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserIdError';
  }
}
