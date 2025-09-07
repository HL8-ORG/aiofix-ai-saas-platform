import { v4 as uuidv4 } from 'uuid';
import { ValueObject } from '@aiofix/core';

/**
 * @class PermissionId
 * @description
 * 权限ID值对象，封装权限唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 权限ID一旦创建不可变更
 * 2. 权限ID必须符合UUID格式
 * 3. 权限ID在系统内必须唯一
 *
 * 相等性判断：
 * 1. 基于权限ID的字符串值进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 * 3. 确保权限ID的唯一性验证
 *
 * 业务概念封装：
 * 1. 封装权限标识符的生成逻辑
 * 2. 提供权限ID的验证方法
 * 3. 隐藏权限ID格式细节
 *
 * @property {string} value 权限ID的字符串值
 *
 * @example
 * ```typescript
 * const permissionId1 = new PermissionId();
 * const permissionId2 = new PermissionId('550e8400-e29b-41d4-a716-446655440000');
 * console.log(permissionId1.equals(permissionId2)); // false
 * ```
 * @since 1.0.0
 */
export class PermissionId extends ValueObject<string> {
  constructor(value?: string) {
    const id = value || uuidv4();
    super(id);
    this.validatePermissionId(this.value);
  }

  /**
   * @method validatePermissionId
   * @description 验证权限ID的有效性
   * @param {string} value 权限ID值
   * @returns {void}
   * @throws {InvalidPermissionIdError} 当权限ID格式无效时抛出
   * @private
   */
  private validatePermissionId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidPermissionIdError('权限ID不能为空');
    }

    // 验证UUID格式
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new InvalidPermissionIdError('权限ID格式不正确，必须是有效的UUID');
    }
  }

  /**
   * @method toString
   * @description 将权限ID转换为字符串
   * @returns {string} 权限ID字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 将权限ID转换为JSON格式
   * @returns {string} 权限ID字符串
   */
  toJSON(): string {
    return this.value;
  }
}

/**
 * @class InvalidPermissionIdError
 * @description 无效权限ID错误
 * @extends Error
 */
export class InvalidPermissionIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPermissionIdError';
  }
}
