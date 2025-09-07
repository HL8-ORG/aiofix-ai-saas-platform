import { v4 as uuidv4 } from 'uuid';
import { ValueObject } from '@aiofix/core';

/**
 * @class SessionId
 * @description
 * 会话ID值对象，封装会话唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 会话ID一旦创建不可变更
 * 2. 会话ID必须符合UUID格式
 * 3. 会话ID在系统内必须唯一
 *
 * 相等性判断：
 * 1. 基于会话ID的字符串值进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 * 3. 确保会话ID的唯一性验证
 *
 * 业务概念封装：
 * 1. 封装会话标识符的生成逻辑
 * 2. 提供会话ID的验证方法
 * 3. 隐藏会话ID格式细节
 *
 * @property {string} value 会话ID的字符串值
 *
 * @example
 * ```typescript
 * const sessionId1 = new SessionId();
 * const sessionId2 = new SessionId('550e8400-e29b-41d4-a716-446655440000');
 * console.log(sessionId1.equals(sessionId2)); // false
 * ```
 * @since 1.0.0
 */
export class SessionId extends ValueObject<string> {
  constructor(value?: string) {
    const id = value ?? uuidv4();
    super(id);
    this.validateSessionId(this.value);
  }

  /**
   * @method validateSessionId
   * @description 验证会话ID的有效性
   * @param {string} value 会话ID值
   * @returns {void}
   * @throws {InvalidSessionIdError} 当会话ID格式无效时抛出
   * @private
   */
  private validateSessionId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidSessionIdError('会话ID不能为空');
    }

    // 验证UUID格式
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new InvalidSessionIdError('会话ID格式不正确，必须是有效的UUID');
    }
  }

  /**
   * @method toString
   * @description 将会话ID转换为字符串
   * @returns {string} 会话ID字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 将会话ID转换为JSON格式
   * @returns {string} 会话ID字符串
   */
  toJSON(): string {
    return this.value;
  }
}

/**
 * @class InvalidSessionIdError
 * @description 无效会话ID错误
 * @extends Error
 */
export class InvalidSessionIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSessionIdError';
  }
}
