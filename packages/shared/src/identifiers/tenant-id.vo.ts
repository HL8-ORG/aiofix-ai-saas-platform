import {
  CustomIdentifier,
  CustomFormatValidationRule,
} from './base-identifier.vo';

/**
 * @class TenantId
 * @description
 * 租户ID值对象，封装租户唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 租户ID一旦创建不可变更
 * 2. 租户ID格式必须符合预定义规则
 * 3. 租户ID不能为空或无效值
 * 4. 租户ID必须全局唯一
 *
 * 相等性判断：
 * 1. 基于租户ID的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装租户ID验证逻辑
 * 2. 提供租户ID标准化方法
 * 3. 隐藏租户ID格式细节
 *
 * @property {string} value 标准化的租户ID值
 *
 * @example
 * ```typescript
 * const tenantId1 = new TenantId('tenant-123');
 * const tenantId2 = new TenantId('TENANT-123');
 * console.log(tenantId1.equals(tenantId2)); // true
 * ```
 * @since 1.0.0
 */
export class TenantId extends CustomIdentifier {
  constructor(value: string) {
    super(
      value,
      new CustomFormatValidationRule(
        /^[a-zA-Z0-9_-]+$/,
        '租户ID只能包含字母、数字、连字符和下划线',
        3,
        50,
      ),
    );
    this.validateTenantIdSpecificRules();
  }

  /**
   * @method validateTenantIdSpecificRules
   * @description 验证租户ID特定的业务规则
   * @returns {void}
   * @throws {InvalidTenantIdError} 当租户ID无效时抛出
   * @private
   */
  private validateTenantIdSpecificRules(): void {
    // 验证租户ID不能以连字符或下划线开头或结尾
    if (/^[-_]|[-_]$/.test(this.value)) {
      throw new InvalidTenantIdError('租户ID不能以连字符或下划线开头或结尾');
    }
  }

  /**
   * @method toLowerCase
   * @description 返回小写的租户ID
   * @returns {string} 小写的租户ID
   */
  toLowerCase(): string {
    return this.value.toLowerCase();
  }

  /**
   * @method toUpperCase
   * @description 返回大写的租户ID
   * @returns {string} 大写的租户ID
   */
  toUpperCase(): string {
    return this.value.toUpperCase();
  }

  /**
   * @method startsWith
   * @description 检查租户ID是否以指定前缀开始
   * @param {string} prefix 前缀
   * @returns {boolean} 是否以指定前缀开始
   */
  startsWith(prefix: string): boolean {
    return this.value.toLowerCase().startsWith(prefix.toLowerCase());
  }

  /**
   * @method endsWith
   * @description 检查租户ID是否以指定后缀结束
   * @param {string} suffix 后缀
   * @returns {boolean} 是否以指定后缀结束
   */
  endsWith(suffix: string): boolean {
    return this.value.toLowerCase().endsWith(suffix.toLowerCase());
  }

  /**
   * @method contains
   * @description 检查租户ID是否包含指定子字符串
   * @param {string} substring 子字符串
   * @returns {boolean} 是否包含指定子字符串
   */
  contains(substring: string): boolean {
    return this.value.toLowerCase().includes(substring.toLowerCase());
  }

  /**
   * @method getLength
   * @description 获取租户ID长度
   * @returns {number} 租户ID长度
   */
  getLength(): number {
    return this.value.length;
  }

  /**
   * @method isEnterprise
   * @description 检查是否为企业租户ID（以enterprise-开头）
   * @returns {boolean} 是否为企业租户ID
   */
  isEnterprise(): boolean {
    return this.startsWith('enterprise-');
  }

  /**
   * @method isCommunity
   * @description 检查是否为社群租户ID（以community-开头）
   * @returns {boolean} 是否为社群租户ID
   */
  isCommunity(): boolean {
    return this.startsWith('community-');
  }

  /**
   * @method isTeam
   * @description 检查是否为团队租户ID（以team-开头）
   * @returns {boolean} 是否为团队租户ID
   */
  isTeam(): boolean {
    return this.startsWith('team-');
  }

  /**
   * @method isPersonal
   * @description 检查是否为个人租户ID（以personal-开头）
   * @returns {boolean} 是否为个人租户ID
   */
  isPersonal(): boolean {
    return this.startsWith('personal-');
  }

  /**
   * @method getType
   * @description 获取租户ID类型
   * @returns {string | null} 租户ID类型，如果无法识别则返回null
   */
  getType(): string | null {
    if (this.isEnterprise()) return 'enterprise';
    if (this.isCommunity()) return 'community';
    if (this.isTeam()) return 'team';
    if (this.isPersonal()) return 'personal';
    return null;
  }

  /**
   * @method getIdentifier
   * @description 获取租户ID的标识符部分（去除类型前缀）
   * @returns {string} 租户ID标识符
   */
  getIdentifier(): string {
    const type = this.getType();
    if (type) {
      return this.value.substring(type.length + 1); // 去除类型前缀和连字符
    }
    return this.value;
  }

  /**
   * @method create
   * @description 创建新的租户ID
   * @param {string} type 租户类型
   * @param {string} identifier 标识符
   * @returns {TenantId} 新的租户ID实例
   * @static
   */
  static create(type: string, identifier: string): TenantId {
    const prefix = type.toLowerCase();
    const id = `${prefix}-${identifier}`;
    return new TenantId(id);
  }

  /**
   * @method generate
   * @description 生成新的租户ID（使用默认类型和随机标识符）
   * @returns {TenantId} 新的租户ID实例
   * @static
   */
  static generate(): TenantId {
    return TenantId.random('tenant', 8);
  }

  /**
   * @method fromString
   * @description 从字符串创建租户ID
   * @param {string} value 租户ID字符串
   * @returns {TenantId} 租户ID实例
   * @static
   */
  static fromString(value: string): TenantId {
    return new TenantId(value);
  }

  /**
   * @method random
   * @description 生成随机的租户ID
   * @param {string} type 租户类型
   * @param {number} length 标识符长度
   * @returns {TenantId} 随机的租户ID实例
   * @static
   */
  static random(type: string, length: number = 8): TenantId {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let identifier = '';

    for (let i = 0; i < length; i++) {
      identifier += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return TenantId.create(type, identifier);
  }

  /**
   * @method isValid
   * @description 检查字符串是否为有效的租户ID格式
   * @param {string} value 要检查的字符串
   * @returns {boolean} 是否为有效的租户ID格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new TenantId(value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @class InvalidTenantIdError
 * @description
 * 无效租户ID异常，当租户ID不符合业务规则时抛出。
 *
 * 业务规则：
 * 1. 当租户ID格式无效时抛出
 * 2. 当租户ID为空时抛出
 * 3. 提供清晰的错误信息
 *
 * @example
 * ```typescript
 * try {
 *   new TenantId('invalid-id!');
 * } catch (error) {
 *   console.log(error instanceof InvalidTenantIdError); // true
 * }
 * ```
 * @since 1.0.0
 */
export class InvalidTenantIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTenantIdError';
  }
}
