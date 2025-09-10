import { UUIDIdentifier } from './base-identifier.vo';

/**
 * @class OrganizationId
 * @description
 * 组织ID值对象，封装组织唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 组织ID一旦创建不可变更
 * 2. 组织ID格式必须符合UUID v4标准
 * 3. 组织ID不能为空或无效值
 * 4. 组织ID必须全局唯一
 *
 * 相等性判断：
 * 1. 基于组织ID的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装组织ID验证逻辑
 * 2. 提供组织ID生成方法
 * 3. 隐藏组织ID格式细节
 *
 * @property {string} value 标准化的组织ID值
 *
 * @example
 * ```typescript
 * const organizationId1 = OrganizationId.generate();
 * const organizationId2 = OrganizationId.fromString('123e4567-e89b-12d3-a456-426614174000');
 * console.log(organizationId1.equals(organizationId2)); // false
 * ```
 * @since 1.0.0
 */
export class OrganizationId extends UUIDIdentifier {
  /**
   * @method generate
   * @description 生成新的组织ID
   * @returns {OrganizationId} 新的组织ID实例
   * @static
   */
  static generate(): OrganizationId {
    return new OrganizationId();
  }

  /**
   * @method fromString
   * @description 从字符串创建组织ID
   * @param {string} value 组织ID字符串
   * @returns {OrganizationId} 组织ID实例
   * @static
   */
  static fromString(value: string): OrganizationId {
    return new OrganizationId(value);
  }

  /**
   * @method isValid
   * @description 检查字符串是否为有效的组织ID格式
   * @param {string} value 要检查的字符串
   * @returns {boolean} 是否为有效的组织ID格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new OrganizationId(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method create
   * @description 创建组织ID（与fromString功能相同，提供一致的接口）
   * @param {string} value 组织ID字符串
   * @returns {OrganizationId} 组织ID实例
   * @static
   */
  static create(value: string): OrganizationId {
    return OrganizationId.fromString(value);
  }
}

/**
 * @class InvalidOrganizationIdError
 * @description
 * 无效组织ID异常，当组织ID不符合业务规则时抛出。
 *
 * 业务规则：
 * 1. 当组织ID格式无效时抛出
 * 2. 当组织ID为空时抛出
 * 3. 提供清晰的错误信息
 *
 * @example
 * ```typescript
 * try {
 *   new OrganizationId('invalid-id');
 * } catch (error) {
 *   console.log(error instanceof InvalidOrganizationIdError); // true
 * }
 * ```
 * @since 1.0.0
 */
export class InvalidOrganizationIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrganizationIdError';
  }
}
