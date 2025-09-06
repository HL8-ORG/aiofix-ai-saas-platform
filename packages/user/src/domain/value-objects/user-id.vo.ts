import { ValueObject } from '@aiofix/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * 用户ID值对象
 *
 * 设计原理：
 * - 封装用户标识符的业务规则
 * - 确保用户ID的唯一性和有效性
 * - 提供类型安全的用户标识
 *
 * 业务规则：
 * - 用户ID必须是有效的UUID格式
 * - 用户ID不能为空或无效字符串
 * - 用户ID在系统中必须唯一
 */
export class UserId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }

  /**
   * 验证用户ID的有效性
   *
   * 业务规则：
   * - 必须是有效的UUID格式
   * - 不能为空或无效字符串
   */
  private validate(): void {
    if (!this._value || this._value.trim().length === 0) {
      throw new InvalidUserIdError('User ID cannot be empty');
    }

    // UUID格式验证
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(this._value)) {
      throw new InvalidUserIdError(`Invalid UUID format: ${this._value}`);
    }
  }

  /**
   * 生成新的用户ID
   *
   * 业务规则：
   * - 使用UUID v4生成唯一标识符
   * - 确保全局唯一性
   */
  public static generate(): UserId {
    return new UserId(uuidv4());
  }

  /**
   * 从字符串创建用户ID
   *
   * @param value 用户ID字符串
   * @returns 用户ID值对象
   */
  public static fromString(value: string): UserId {
    return new UserId(value);
  }

  /**
   * 获取用户ID的字符串表示
   *
   * @returns 用户ID字符串
   */
  public toString(): string {
    return this._value;
  }
}

/**
 * 无效用户ID异常
 *
 * 业务规则：
 * - 当用户ID不符合业务规则时抛出
 * - 提供清晰的错误信息
 */
export class InvalidUserIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserIdError';
  }
}
