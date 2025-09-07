import { ValueObject } from '@aiofix/core';

/**
 * @interface AccessTokenData
 * @description 访问令牌数据接口
 */
export interface AccessTokenData {
  readonly token: string;
  readonly type: 'Bearer' | 'Basic' | 'ApiKey';
  readonly expiresAt: Date;
  readonly issuedAt: Date;
  readonly scope?: string[];
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class AccessToken
 * @description
 * 访问令牌值对象，封装访问令牌的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 访问令牌一旦创建不可变更
 * 2. 访问令牌必须符合JWT格式或API密钥格式
 * 3. 访问令牌必须包含过期时间
 *
 * 相等性判断：
 * 1. 基于访问令牌的完整数据进行比较
 * 2. 支持访问令牌的精确匹配
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装访问令牌验证逻辑
 * 2. 提供访问令牌状态检查方法
 * 3. 隐藏访问令牌格式细节
 *
 * @property {AccessTokenData} value 访问令牌数据
 *
 * @example
 * ```typescript
 * const accessToken = new AccessToken({
 *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   type: 'Bearer',
 *   expiresAt: new Date(Date.now() + 3600000),
 *   issuedAt: new Date(),
 *   scope: ['read', 'write']
 * });
 * console.log(accessToken.isExpired()); // false
 * ```
 * @since 1.0.0
 */
export class AccessToken extends ValueObject<AccessTokenData> {
  constructor(data: AccessTokenData) {
    const validatedData = AccessToken.validateAndNormalizeToken(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizeToken
   * @description 验证并标准化访问令牌数据
   * @param {AccessTokenData} data 原始令牌数据
   * @returns {AccessTokenData} 验证后的令牌数据
   * @throws {InvalidAccessTokenError} 当令牌数据无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizeToken(
    data: AccessTokenData,
  ): AccessTokenData {
    if (!data || typeof data !== 'object') {
      throw new InvalidAccessTokenError('访问令牌数据不能为空');
    }

    if (!data.token || typeof data.token !== 'string') {
      throw new InvalidAccessTokenError('访问令牌不能为空');
    }

    if (!data.type || !['Bearer', 'Basic', 'ApiKey'].includes(data.type)) {
      throw new InvalidAccessTokenError(
        '访问令牌类型必须是 Bearer、Basic 或 ApiKey',
      );
    }

    if (!data.expiresAt || !(data.expiresAt instanceof Date)) {
      throw new InvalidAccessTokenError('访问令牌过期时间不能为空');
    }

    if (!data.issuedAt || !(data.issuedAt instanceof Date)) {
      throw new InvalidAccessTokenError('访问令牌签发时间不能为空');
    }

    if (data.expiresAt <= data.issuedAt) {
      throw new InvalidAccessTokenError('访问令牌过期时间必须晚于签发时间');
    }

    // 验证JWT格式（如果是Bearer类型）
    if (data.type === 'Bearer' && !AccessToken.isValidJWT(data.token)) {
      throw new InvalidAccessTokenError('Bearer令牌格式不正确');
    }

    return {
      token: data.token.trim(),
      type: data.type,
      expiresAt: data.expiresAt,
      issuedAt: data.issuedAt,
      scope: data.scope || [],
      metadata: data.metadata || {},
    };
  }

  /**
   * @method isValidJWT
   * @description 验证JWT格式
   * @param {string} token JWT令牌
   * @returns {boolean} 是否为有效的JWT格式
   * @private
   * @static
   */
  private static isValidJWT(token: string): boolean {
    const parts = token.split('.');
    return parts.length === 3 && parts.every(part => part.length > 0);
  }

  /**
   * @method getToken
   * @description 获取访问令牌
   * @returns {string} 访问令牌
   */
  getToken(): string {
    return this.value.token;
  }

  /**
   * @method getType
   * @description 获取访问令牌类型
   * @returns {string} 访问令牌类型
   */
  getType(): string {
    return this.value.type;
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
   * @description 检查访问令牌是否已过期
   * @returns {boolean} 是否已过期
   */
  isExpired(): boolean {
    return new Date() > this.value.expiresAt;
  }

  /**
   * @method isActive
   * @description 检查访问令牌是否处于活跃状态
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
   * @method isBearerToken
   * @description 检查是否为Bearer令牌
   * @returns {boolean} 是否为Bearer令牌
   */
  isBearerToken(): boolean {
    return this.value.type === 'Bearer';
  }

  /**
   * @method isBasicToken
   * @description 检查是否为Basic令牌
   * @returns {boolean} 是否为Basic令牌
   */
  isBasicToken(): boolean {
    return this.value.type === 'Basic';
  }

  /**
   * @method isApiKeyToken
   * @description 检查是否为API密钥令牌
   * @returns {boolean} 是否为API密钥令牌
   */
  isApiKeyToken(): boolean {
    return this.value.type === 'ApiKey';
  }

  /**
   * @method getAuthorizationHeader
   * @description 获取Authorization头值
   * @returns {string} Authorization头值
   */
  getAuthorizationHeader(): string {
    return `${this.value.type} ${this.value.token}`;
  }

  /**
   * @method toString
   * @description 将访问令牌转换为字符串
   * @returns {string} 访问令牌字符串表示
   */
  toString(): string {
    return `${this.value.type} ${this.value.token}`;
  }

  /**
   * @method toJSON
   * @description 将访问令牌转换为JSON格式
   * @returns {AccessTokenData} 访问令牌数据
   */
  toJSON(): AccessTokenData {
    return {
      token: this.value.token,
      type: this.value.type,
      expiresAt: this.value.expiresAt,
      issuedAt: this.value.issuedAt,
      scope: this.value.scope,
      metadata: this.value.metadata,
    };
  }
}

/**
 * @class InvalidAccessTokenError
 * @description 无效访问令牌错误
 * @extends Error
 */
export class InvalidAccessTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidAccessTokenError';
  }
}
