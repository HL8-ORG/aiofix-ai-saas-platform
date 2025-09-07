import { ValueObject } from '@aiofix/core';
import * as bcrypt from 'bcryptjs';

/**
 * @interface CredentialsData
 * @description 认证凭据数据接口
 */
export interface CredentialsData {
  readonly username: string;
  readonly password: string;
  readonly type: 'password' | 'api_key' | 'oauth' | 'sso';
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class Credentials
 * @description
 * 认证凭据值对象，封装用户认证凭据的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 认证凭据一旦创建不可变更
 * 2. 密码必须经过哈希处理
 * 3. 用户名必须符合格式要求
 *
 * 相等性判断：
 * 1. 基于认证凭据的完整数据进行比较
 * 2. 支持认证凭据的精确匹配
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装认证凭据验证逻辑
 * 2. 提供密码验证和哈希方法
 * 3. 隐藏认证凭据格式细节
 *
 * @property {CredentialsData} value 认证凭据数据
 *
 * @example
 * ```typescript
 * const credentials = new Credentials({
 *   username: 'user@example.com',
 *   password: 'hashedPassword',
 *   type: 'password'
 * });
 * console.log(credentials.verifyPassword('plainPassword')); // true/false
 * ```
 * @since 1.0.0
 */
export class Credentials extends ValueObject<CredentialsData> {
  private static readonly MIN_USERNAME_LENGTH = 3;
  private static readonly MAX_USERNAME_LENGTH = 100;
  private static readonly USERNAME_REGEX =
    /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$|^[a-zA-Z0-9._-]{3,}$/;
  private static readonly VALID_TYPES = ['password', 'api_key', 'oauth', 'sso'];

  constructor(data: CredentialsData) {
    const validatedData = Credentials.validateAndNormalizeCredentials(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizeCredentials
   * @description 验证并标准化认证凭据数据
   * @param {CredentialsData} data 原始凭据数据
   * @returns {CredentialsData} 验证后的凭据数据
   * @throws {InvalidCredentialsError} 当凭据数据无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizeCredentials(
    data: CredentialsData,
  ): CredentialsData {
    if (!data || typeof data !== 'object') {
      throw new InvalidCredentialsError('认证凭据数据不能为空');
    }

    if (!data.username || typeof data.username !== 'string') {
      throw new InvalidCredentialsError('用户名不能为空');
    }

    if (!data.password || typeof data.password !== 'string') {
      throw new InvalidCredentialsError('密码不能为空');
    }

    if (!data.type || !Credentials.VALID_TYPES.includes(data.type)) {
      throw new InvalidCredentialsError(
        `认证类型必须是以下之一：${Credentials.VALID_TYPES.join(', ')}`,
      );
    }

    // 验证用户名格式
    if (!Credentials.isValidUsername(data.username)) {
      throw new InvalidCredentialsError('用户名格式不正确');
    }

    // 验证密码格式（根据类型）
    if (!Credentials.isValidPassword(data.password, data.type)) {
      throw new InvalidCredentialsError('密码格式不正确');
    }

    return {
      username: data.username.trim().toLowerCase(),
      password: data.password,
      type: data.type,
      metadata: data.metadata || {},
    };
  }

  /**
   * @method isValidUsername
   * @description 验证用户名格式
   * @param {string} username 用户名
   * @returns {boolean} 是否为有效的用户名格式
   * @private
   * @static
   */
  private static isValidUsername(username: string): boolean {
    if (
      username.length < Credentials.MIN_USERNAME_LENGTH ||
      username.length > Credentials.MAX_USERNAME_LENGTH
    ) {
      return false;
    }

    return Credentials.USERNAME_REGEX.test(username);
  }

  /**
   * @method isValidPassword
   * @description 验证密码格式
   * @param {string} password 密码
   * @param {string} type 认证类型
   * @returns {boolean} 是否为有效的密码格式
   * @private
   * @static
   */
  private static isValidPassword(password: string, type: string): boolean {
    switch (type) {
      case 'password':
        // 密码类型：检查是否为哈希格式
        return (
          password.startsWith('$2a$') ||
          password.startsWith('$2b$') ||
          password.startsWith('$2y$')
        );
      case 'api_key':
        // API密钥类型：检查长度和格式
        return password.length >= 32 && /^[a-zA-Z0-9_-]+$/.test(password);
      case 'oauth':
        // OAuth类型：检查是否为有效的OAuth令牌格式
        return password.length >= 20 && /^[a-zA-Z0-9._-]+$/.test(password);
      case 'sso':
        // SSO类型：检查是否为有效的SSO令牌格式
        return password.length >= 16 && /^[a-zA-Z0-9._-]+$/.test(password);
      default:
        return false;
    }
  }

  /**
   * @method hashPassword
   * @description 哈希密码
   * @param {string} plainPassword 明文密码
   * @returns {Promise<string>} 哈希后的密码
   * @static
   */
  static async hashPassword(plainPassword: string): Promise<string> {
    if (!plainPassword || plainPassword.length < 8) {
      throw new InvalidCredentialsError('密码长度不能少于8位');
    }

    const saltRounds = 12;
    return await bcrypt.hash(plainPassword, saltRounds);
  }

  /**
   * @method verifyPassword
   * @description 验证密码
   * @param {string} plainPassword 明文密码
   * @param {string} hashedPassword 哈希密码
   * @returns {Promise<boolean>} 密码是否正确
   * @static
   */
  static async verifyPassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (_error) {
      return false;
    }
  }

  /**
   * @method getUsername
   * @description 获取用户名
   * @returns {string} 用户名
   */
  getUsername(): string {
    return this.value.username;
  }

  /**
   * @method getPassword
   * @description 获取密码
   * @returns {string} 密码
   */
  getPassword(): string {
    return this.value.password;
  }

  /**
   * @method getType
   * @description 获取认证类型
   * @returns {string} 认证类型
   */
  getType(): string {
    return this.value.type;
  }

  /**
   * @method getMetadata
   * @description 获取元数据
   * @returns {Record<string, unknown>} 元数据
   */
  getMetadata(): Record<string, unknown> {
    return this.value.metadata ?? {};
  }

  /**
   * @method verifyPassword
   * @description 验证密码
   * @param {string} plainPassword 明文密码
   * @returns {Promise<boolean>} 密码是否正确
   */
  async verifyPassword(plainPassword: string): Promise<boolean> {
    if (this.value.type !== 'password') {
      throw new InvalidCredentialsError('只有密码类型才能验证密码');
    }

    return await Credentials.verifyPassword(plainPassword, this.value.password);
  }

  /**
   * @method isPasswordType
   * @description 检查是否为密码类型
   * @returns {boolean} 是否为密码类型
   */
  isPasswordType(): boolean {
    return this.value.type === 'password';
  }

  /**
   * @method isApiKeyType
   * @description 检查是否为API密钥类型
   * @returns {boolean} 是否为API密钥类型
   */
  isApiKeyType(): boolean {
    return this.value.type === 'api_key';
  }

  /**
   * @method isOAuthType
   * @description 检查是否为OAuth类型
   * @returns {boolean} 是否为OAuth类型
   */
  isOAuthType(): boolean {
    return this.value.type === 'oauth';
  }

  /**
   * @method isSsoType
   * @description 检查是否为SSO类型
   * @returns {boolean} 是否为SSO类型
   */
  isSsoType(): boolean {
    return this.value.type === 'sso';
  }

  /**
   * @method getMetadataValue
   * @description 获取元数据值
   * @param {string} key 元数据键
   * @returns {unknown} 元数据值
   */
  getMetadataValue(key: string): unknown {
    return this.value.metadata?.[key];
  }

  /**
   * @method isEmailUsername
   * @description 检查用户名是否为邮箱格式
   * @returns {boolean} 是否为邮箱格式
   */
  isEmailUsername(): boolean {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.value.username);
  }

  /**
   * @method getDomainFromEmail
   * @description 从邮箱用户名中获取域名
   * @returns {string | undefined} 域名
   */
  getDomainFromEmail(): string | undefined {
    if (!this.isEmailUsername()) {
      return undefined;
    }

    const parts = this.value.username.split('@');
    return parts.length === 2 ? parts[1] : undefined;
  }

  /**
   * @method maskPassword
   * @description 掩码密码（用于日志记录）
   * @returns {string} 掩码后的密码
   */
  maskPassword(): string {
    const password = this.value.password;
    if (password.length <= 4) {
      return '*'.repeat(password.length);
    }
    return (
      password.substring(0, 2) +
      '*'.repeat(password.length - 4) +
      password.substring(password.length - 2)
    );
  }

  /**
   * @method toString
   * @description 将认证凭据转换为字符串
   * @returns {string} 认证凭据字符串表示
   */
  toString(): string {
    return `${this.value.type}:${this.value.username}`;
  }

  /**
   * @method toJSON
   * @description 将认证凭据转换为JSON格式
   * @returns {CredentialsData} 认证凭据数据
   */
  toJSON(): CredentialsData {
    return {
      username: this.value.username,
      password: this.maskPassword(), // 返回掩码后的密码
      type: this.value.type,
      metadata: this.value.metadata,
    };
  }
}

/**
 * @class InvalidCredentialsError
 * @description 无效认证凭据错误
 * @extends Error
 */
export class InvalidCredentialsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCredentialsError';
  }
}
