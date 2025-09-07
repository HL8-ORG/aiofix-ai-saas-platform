import { v4 as uuidv4 } from 'uuid';
import { ValueObject } from '@aiofix/core';

/**
 * @class RoleId
 * @description
 * 角色ID值对象，封装角色唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 角色ID一旦创建不可变更
 * 2. 角色ID必须符合UUID格式
 * 3. 角色ID在系统内必须唯一
 *
 * 相等性判断：
 * 1. 基于角色ID的字符串值进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 * 3. 确保角色ID的唯一性验证
 *
 * 业务概念封装：
 * 1. 封装角色标识符的生成逻辑
 * 2. 提供角色ID的验证方法
 * 3. 隐藏角色ID格式细节
 *
 * @property {string} value 角色ID的字符串值
 *
 * @example
 * ```typescript
 * const roleId1 = new RoleId();
 * const roleId2 = new RoleId('550e8400-e29b-41d4-a716-446655440000');
 * console.log(roleId1.equals(roleId2)); // false
 * ```
 * @since 1.0.0
 */
export class RoleId extends ValueObject<string> {
  constructor(value?: string) {
    const id = value ?? uuidv4();
    super(id);
    this.validateRoleId(this.value);
  }

  /**
   * @method validateRoleId
   * @description 验证角色ID的有效性
   * @param {string} value 角色ID值
   * @returns {void}
   * @throws {InvalidRoleIdError} 当角色ID格式无效时抛出
   * @private
   */
  private validateRoleId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidRoleIdError('角色ID不能为空');
    }

    // 验证UUID格式
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new InvalidRoleIdError('角色ID格式不正确，必须是有效的UUID');
    }
  }

  /**
   * @method toString
   * @description 将角色ID转换为字符串
   * @returns {string} 角色ID字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 将角色ID转换为JSON格式
   * @returns {string} 角色ID字符串
   */
  toJSON(): string {
    return this.value;
  }
}

/**
 * @class InvalidRoleIdError
 * @description 无效角色ID错误
 * @extends Error
 */
export class InvalidRoleIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRoleIdError';
  }
}
