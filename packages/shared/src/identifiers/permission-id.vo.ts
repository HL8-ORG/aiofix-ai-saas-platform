import { UUIDIdentifier } from './base-identifier.vo';

/**
 * @class PermissionId
 * @description
 * 权限ID值对象，封装权限唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 权限ID一旦创建不可变更
 * 2. 权限ID格式必须符合UUID v4标准
 * 3. 权限ID不能为空或无效值
 * 4. 权限ID必须全局唯一
 *
 * 相等性判断：
 * 1. 基于权限ID的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装权限ID验证逻辑
 * 2. 提供权限ID生成方法
 * 3. 隐藏权限ID格式细节
 *
 * @property {string} value 标准化的权限ID值
 *
 * @example
 * ```typescript
 * const permissionId1 = PermissionId.generate();
 * const permissionId2 = PermissionId.fromString('123e4567-e89b-12d3-a456-426614174000');
 * console.log(permissionId1.equals(permissionId2)); // false
 * ```
 * @since 1.0.0
 */
export class PermissionId extends UUIDIdentifier {
  /**
   * @method generate
   * @description 生成新的权限ID
   * @returns {PermissionId} 新的权限ID实例
   * @static
   */
  static generate(): PermissionId {
    return new PermissionId();
  }

  /**
   * @method fromString
   * @description 从字符串创建权限ID
   * @param {string} value 权限ID字符串
   * @returns {PermissionId} 权限ID实例
   * @static
   */
  static fromString(value: string): PermissionId {
    return new PermissionId(value);
  }

  /**
   * @method isValid
   * @description 检查字符串是否为有效的权限ID格式
   * @param {string} value 要检查的字符串
   * @returns {boolean} 是否为有效的权限ID格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new PermissionId(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method create
   * @description 创建权限ID（与fromString功能相同，提供一致的接口）
   * @param {string} value 权限ID字符串
   * @returns {PermissionId} 权限ID实例
   * @static
   */
  static create(value: string): PermissionId {
    return PermissionId.fromString(value);
  }
}

/**
 * @class InvalidPermissionIdError
 * @description
 * 无效权限ID异常，当权限ID不符合业务规则时抛出。
 *
 * 业务规则：
 * 1. 当权限ID格式无效时抛出
 * 2. 当权限ID为空时抛出
 * 3. 提供清晰的错误信息
 *
 * @example
 * ```typescript
 * try {
 *   new PermissionId('invalid-id');
 * } catch (error) {
 *   console.log(error instanceof InvalidPermissionIdError); // true
 * }
 * ```
 * @since 1.0.0
 */
export class InvalidPermissionIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPermissionIdError';
  }
}
