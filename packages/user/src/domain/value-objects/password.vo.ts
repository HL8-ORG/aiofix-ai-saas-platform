import { ValueObject } from '@aiofix/core';
import * as bcrypt from 'bcrypt';

/**
 * 密码值对象
 *
 * 设计原理：
 * - 封装密码的业务规则和安全要求
 * - 确保密码符合安全策略
 * - 提供密码加密和验证功能
 *
 * 业务规则：
 * - 密码必须符合安全强度要求
 * - 密码必须经过加密存储
 * - 密码验证必须使用安全的比较方法
 * - 密码不能为空或无效字符串
 */
export class Password extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  /**
   * 创建新的密码值对象
   *
   * 业务规则：
   * - 验证密码强度
   * - 自动加密密码
   *
   * @param plainPassword 明文密码
   * @returns 加密后的密码值对象
   */
  public static async create(plainPassword: string): Promise<Password> {
    if (!plainPassword || plainPassword.trim().length === 0) {
      throw new InvalidPasswordError('Password cannot be empty');
    }

    // 验证密码强度
    Password.validateStrength(plainPassword);

    // 加密密码
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    return new Password(hashedPassword);
  }

  /**
   * 从已加密的密码创建值对象
   *
   * @param hashedPassword 已加密的密码
   * @returns 密码值对象
   */
  public static fromHashed(hashedPassword: string): Password {
    if (!hashedPassword || hashedPassword.trim().length === 0) {
      throw new InvalidPasswordError('Hashed password cannot be empty');
    }

    return new Password(hashedPassword);
  }

  /**
   * 验证密码强度
   *
   * 业务规则：
   * - 至少8个字符
   * - 至少包含一个大写字母
   * - 至少包含一个小写字母
   * - 至少包含一个数字
   * - 至少包含一个特殊字符
   * - 不能包含常见弱密码
   */
  private static validateStrength(plainPassword: string): void {
    if (plainPassword.length < 8) {
      throw new WeakPasswordError(
        'Password must be at least 8 characters long',
      );
    }

    if (plainPassword.length > 128) {
      throw new WeakPasswordError('Password is too long');
    }

    // 检查是否包含大写字母
    if (!/[A-Z]/.test(plainPassword)) {
      throw new WeakPasswordError(
        'Password must contain at least one uppercase letter',
      );
    }

    // 检查是否包含小写字母
    if (!/[a-z]/.test(plainPassword)) {
      throw new WeakPasswordError(
        'Password must contain at least one lowercase letter',
      );
    }

    // 检查是否包含数字
    if (!/\d/.test(plainPassword)) {
      throw new WeakPasswordError('Password must contain at least one number');
    }

    // 检查是否包含特殊字符
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(plainPassword)) {
      throw new WeakPasswordError(
        'Password must contain at least one special character',
      );
    }

    // 检查常见弱密码
    const commonPasswords = [
      'password',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password123',
      'admin',
      'letmein',
      'welcome',
      'monkey',
    ];

    if (commonPasswords.includes(plainPassword.toLowerCase())) {
      throw new WeakPasswordError(
        'Password is too common, please choose a stronger password',
      );
    }
  }

  /**
   * 验证密码是否匹配
   *
   * 业务规则：
   * - 使用安全的比较方法
   * - 防止时序攻击
   *
   * @param plainPassword 明文密码
   * @returns 是否匹配
   */
  public async verify(plainPassword: string): Promise<boolean> {
    if (!plainPassword) {
      return false;
    }

    try {
      return await bcrypt.compare(plainPassword, this._value);
    } catch (error) {
      throw new PasswordVerificationError('Password verification failed');
    }
  }

  /**
   * 检查密码是否需要重新加密
   *
   * 业务规则：
   * - 检查加密轮数是否足够
   * - 确保密码安全性
   *
   * @returns 是否需要重新加密
   */
  public needsRehash(): boolean {
    try {
      const salt = this._value.split('$')[2];
      const rounds = parseInt(salt, 10);
      return rounds < 12;
    } catch {
      return true;
    }
  }

  /**
   * 获取密码的字符串表示（已加密）
   *
   * @returns 加密后的密码字符串
   */
  public toString(): string {
    return this._value;
  }
}

/**
 * 无效密码异常
 *
 * 业务规则：
 * - 当密码不符合基本要求时抛出
 */
export class InvalidPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPasswordError';
  }
}

/**
 * 弱密码异常
 *
 * 业务规则：
 * - 当密码强度不足时抛出
 */
export class WeakPasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeakPasswordError';
  }
}

/**
 * 密码验证异常
 *
 * 业务规则：
 * - 当密码验证过程出错时抛出
 */
export class PasswordVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PasswordVerificationError';
  }
}
