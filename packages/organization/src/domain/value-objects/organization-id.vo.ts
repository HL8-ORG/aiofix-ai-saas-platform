import { ValueObject } from '@aiofix/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class OrganizationId
 * @description
 * 组织ID值对象，封装组织标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 组织ID一旦创建不可变更
 * 2. 组织ID必须是有效的UUID格式
 * 3. 组织ID在租户内必须唯一
 *
 * 相等性判断：
 * 1. 基于UUID值进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 * 3. 忽略大小写差异
 *
 * 业务概念封装：
 * 1. 封装组织标识符验证逻辑
 * 2. 提供组织ID生成方法
 * 3. 隐藏UUID格式细节
 *
 * @property {string} value 组织ID的UUID值
 *
 * @example
 * ```typescript
 * const orgId1 = new OrganizationId('123e4567-e89b-12d3-a456-426614174000');
 * const orgId2 = new OrganizationId(); // 自动生成UUID
 * console.log(orgId1.equals(orgId2)); // false
 * ```
 * @since 1.0.0
 */
export class OrganizationId extends ValueObject<string> {
  constructor(value?: string) {
    super(value ?? uuidv4());
    this.validateOrganizationId(this.value);
  }

  /**
   * @method validateOrganizationId
   * @description 验证组织ID格式的有效性
   * @param {string} value 组织ID值
   * @returns {void}
   * @throws {InvalidOrganizationIdError} 当组织ID格式无效时抛出
   * @private
   */
  private validateOrganizationId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidOrganizationIdError('组织ID不能为空');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new InvalidOrganizationIdError(`无效的组织ID格式: ${value}`);
    }
  }

  /**
   * @method fromString
   * @description 从字符串创建组织ID
   * @param {string} value 组织ID字符串
   * @returns {OrganizationId} 组织ID实例
   * @throws {InvalidOrganizationIdError} 当字符串格式无效时抛出
   * @static
   */
  static fromString(value: string): OrganizationId {
    return new OrganizationId(value);
  }

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
   * @method isValid
   * @description 验证字符串是否为有效的组织ID格式
   * @param {string} value 待验证的字符串
   * @returns {boolean} 是否为有效格式
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
}

/**
 * @class InvalidOrganizationIdError
 * @description 无效组织ID异常类
 * @extends Error
 */
export class InvalidOrganizationIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrganizationIdError';
  }
}
