import { v4 as uuidv4 } from 'uuid';
import { ValueObject } from '@aiofix/core';

/**
 * @interface RefreshTokenData
 * @description 刷新令牌数据接口
 */
export interface RefreshTokenData {
  readonly token: string;
  readonly expiresAt: Date;
  readonly issuedAt: Date;
  readonly accessTokenId?: string;
  readonly scope?: string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class RefreshToken
 * @description
 * 刷新令牌值对象，封装刷新令牌的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 刷新令牌一旦创建不可变更
 * 2. 刷新令牌必须符合安全格式
 * 3. 刷新令牌必须包含过期时间
 *
 * 相等性判断：
 * 1. 基于刷新令牌的完整数据进行比较
 * 2. 支持刷新令牌的精确匹配
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装刷新令牌验证逻辑
 * 2. 提供刷新令牌状态检查方法
 * 3. 隐藏刷新令牌格式细节
 *
 * @property {RefreshTokenData} value 刷新令牌数据
 *
 * @example
 * ```typescript
 * const refreshToken = new RefreshToken({
 *   token: 'rt_1234567890abcdef',
 *   expiresAt: new Date(Date.now() + 7 * 24 * 3600000),
 *   issuedAt: new Date(),
 *   accessTokenId: 'at_1234567890abcdef'
 * });
 * console.log(refreshToken.isExpired()); // false
 * ```
 * @since 1.0.0
 */
export class RefreshToken extends ValueObject<RefreshTokenData> {
  private static readonly TOKEN_PREFIX = 'rt_';
  private static readonly MIN_LENGTH = 32;
  private static readonly MAX_LENGTH = 128;

  constructor(data: RefreshTokenData) {
    const validatedData = RefreshToken.validateAndNormalizeToken(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizeToken
   * @description 验证并标准化刷新令牌数据
   * @param {RefreshTokenData} data 原始令牌数据
   * @returns {RefreshTokenData} 验证后的令牌数据
   * @throws {InvalidRefreshTokenError} 当令牌数据无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizeToken(
    data: RefreshTokenData,
  ): RefreshTokenData {
    if (!data || typeof data !== 'object') {
      throw new InvalidRefreshTokenError('刷新令牌数据不能为空');
    }

    if (!data.token || typeof data.token !== 'string') {
      throw new InvalidRefreshTokenError('刷新令牌不能为空');
    }

    if (!data.expiresAt || !(data.expiresAt instanceof Date)) {
      throw new InvalidRefreshTokenError('刷新令牌过期时间不能为空');
    }

    if (!data.issuedAt || !(data.issuedAt instanceof Date)) {
      throw new InvalidRefreshTokenError('刷新令牌签发时间不能为空');
    }

    if (data.expiresAt <= data.issuedAt) {
      throw new InvalidRefreshTokenError('刷新令牌过期时间必须晚于签发时间');
    }

    // 验证令牌格式
    if (!RefreshToken.isValidTokenFormat(data.token)) {
      throw new InvalidRefreshTokenError('刷新令牌格式不正确');
    }

    return {
      token: data.token.trim(),
      expiresAt: data.expiresAt,
      issuedAt: data.issuedAt,
      accessTokenId: data.accessTokenId,
      scope: data.scope || [],
      metadata: data.metadata || {},
    };
  }

  /**
   * @method isValidTokenFormat
   * @description 验证令牌格式
   * @param {string} token 刷新令牌
   * @returns {boolean} 是否为有效的令牌格式
   * @private
   * @static
   */
  private static isValidTokenFormat(token: string): boolean {
    // 检查长度
    if (
      token.length < RefreshToken.MIN_LENGTH ||
      token.length > RefreshToken.MAX_LENGTH
    ) {
      return false;
    }

    // 检查前缀
    if (!token.startsWith(RefreshToken.TOKEN_PREFIX)) {
      return false;
    }

    // 检查字符（只允许字母、数字、下划线、连字符）
    const validCharsRegex = /^[a-zA-Z0-9_-]+$/;
    return validCharsRegex.test(token);
  }

  /**
   * @method generateToken
   * @description 生成新的刷新令牌
   * @returns {string} 新的刷新令牌
   * @static
   */
  static generateToken(): string {
    const uuid = uuidv4().replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${RefreshToken.TOKEN_PREFIX}${uuid}${randomSuffix}`;
  }

  /**
   * @method getToken
   * @description 获取刷新令牌
   * @returns {string} 刷新令牌
   */
  getToken(): string {
    return this.value.token;
  }

  /**
   * @method getExpiresAt
   * @description 获取过期时间
   * @returns {Date} 过期时间
   */
  getExpiresAt(): Date {
    return this.value.expiresAt;
  }

  /**
   * @method getIssuedAt
   * @description 获取签发时间
   * @returns {Date} 签发时间
   */
  getIssuedAt(): Date {
    return this.value.issuedAt;
  }

  /**
   * @method getAccessTokenId
   * @description 获取关联的访问令牌ID
   * @returns {string | undefined} 访问令牌ID
   */
  getAccessTokenId(): string | undefined {
    return this.value.accessTokenId;
  }

  /**
   * @method getScope
   * @description 获取访问范围
   * @returns {string[]} 访问范围列表
   */
  getScope(): string[] {
    return this.value.scope ?? [];
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
   * @method isExpired
   * @description 检查刷新令牌是否已过期
   * @returns {boolean} 是否已过期
   */
  isExpired(): boolean {
    return new Date() > this.value.expiresAt;
  }

  /**
   * @method isActive
   * @description 检查刷新令牌是否处于活跃状态
   * @returns {boolean} 是否处于活跃状态
   */
  isActive(): boolean {
    return !this.isExpired();
  }

  /**
   * @method getTimeToExpiry
   * @description 获取距离过期的时间（毫秒）
   * @returns {number} 距离过期的时间
   */
  getTimeToExpiry(): number {
    return this.value.expiresAt.getTime() - new Date().getTime();
  }

  /**
   * @method getAge
   * @description 获取令牌年龄（毫秒）
   * @returns {number} 令牌年龄
   */
  getAge(): number {
    return new Date().getTime() - this.value.issuedAt.getTime();
  }

  /**
   * @method hasScope
   * @description 检查是否具有指定范围
   * @param {string} scope 访问范围
   * @returns {boolean} 是否具有指定范围
   */
  hasScope(scope: string): boolean {
    return this.value.scope?.includes(scope) || false;
  }

  /**
   * @method hasAnyScope
   * @description 检查是否具有任意一个指定范围
   * @param {string[]} scopes 访问范围列表
   * @returns {boolean} 是否具有任意一个指定范围
   */
  hasAnyScope(scopes: string[]): boolean {
    return scopes.some(scope => this.hasScope(scope));
  }

  /**
   * @method hasAllScopes
   * @description 检查是否具有所有指定范围
   * @param {string[]} scopes 访问范围列表
   * @returns {boolean} 是否具有所有指定范围
   */
  hasAllScopes(scopes: string[]): boolean {
    return scopes.every(scope => this.hasScope(scope));
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
   * @method isAssociatedWithAccessToken
   * @description 检查是否与访问令牌关联
   * @returns {boolean} 是否与访问令牌关联
   */
  isAssociatedWithAccessToken(): boolean {
    return !!this.value.accessTokenId;
  }

  /**
   * @method canRefreshAccessToken
   * @description 检查是否可以刷新访问令牌
   * @returns {boolean} 是否可以刷新访问令牌
   */
  canRefreshAccessToken(): boolean {
    return this.isActive() && this.isAssociatedWithAccessToken();
  }

  /**
   * @method getTokenType
   * @description 获取令牌类型
   * @returns {string} 令牌类型
   */
  getTokenType(): string {
    return 'RefreshToken';
  }

  /**
   * @method toString
   * @description 将刷新令牌转换为字符串
   * @returns {string} 刷新令牌字符串表示
   */
  toString(): string {
    return this.value.token;
  }

  /**
   * @method toJSON
   * @description 将刷新令牌转换为JSON格式
   * @returns {RefreshTokenData} 刷新令牌数据
   */
  toJSON(): RefreshTokenData {
    return {
      token: this.value.token,
      expiresAt: this.value.expiresAt,
      issuedAt: this.value.issuedAt,
      accessTokenId: this.value.accessTokenId,
      scope: this.value.scope,
      metadata: this.value.metadata,
    };
  }
}

/**
 * @class InvalidRefreshTokenError
 * @description 无效刷新令牌错误
 * @extends Error
 */
export class InvalidRefreshTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRefreshTokenError';
  }
}
