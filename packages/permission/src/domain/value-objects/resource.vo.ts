import { ValueObject } from '@aiofix/core';

/**
 * @class Resource
 * @description
 * 资源值对象，封装权限资源的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 资源名称一旦创建不可变更
 * 2. 资源名称必须符合命名规范
 * 3. 资源名称在系统内必须唯一
 *
 * 相等性判断：
 * 1. 基于资源名称的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装资源名称验证逻辑
 * 2. 提供资源名称标准化方法
 * 3. 隐藏资源名称格式细节
 *
 * @property {string} value 标准化的资源名称值
 *
 * @example
 * ```typescript
 * const resource1 = new Resource('User');
 * const resource2 = new Resource('user');
 * console.log(resource1.equals(resource2)); // true
 * ```
 * @since 1.0.0
 */
export class Resource extends ValueObject<string> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 100;
  private static readonly VALID_CHARS_REGEX = /^[a-zA-Z][a-zA-Z0-9._-]*$/;
  private static readonly RESERVED_WORDS = [
    'system',
    'admin',
    'root',
    'api',
    'internal',
  ];

  constructor(value: string) {
    const normalizedValue = Resource.normalizeResource(value);
    super(normalizedValue);
    this.validateResource(this.value);
  }

  /**
   * @method normalizeResource
   * @description 标准化资源名称
   * @param {string} value 原始资源名称
   * @returns {string} 标准化后的资源名称
   * @private
   * @static
   */
  private static normalizeResource(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * @method validateResource
   * @description 验证资源名称的有效性
   * @param {string} value 资源名称值
   * @returns {void}
   * @throws {InvalidResourceError} 当资源名称无效时抛出
   * @private
   */
  private validateResource(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidResourceError('资源名称不能为空');
    }

    if (value.length < Resource.MIN_LENGTH) {
      throw new InvalidResourceError(
        `资源名称长度不能少于${Resource.MIN_LENGTH}个字符`,
      );
    }

    if (value.length > Resource.MAX_LENGTH) {
      throw new InvalidResourceError(
        `资源名称长度不能超过${Resource.MAX_LENGTH}个字符`,
      );
    }

    if (!Resource.VALID_CHARS_REGEX.test(value)) {
      throw new InvalidResourceError(
        '资源名称只能包含字母、数字、点、下划线和连字符，且必须以字母开头',
      );
    }

    if (Resource.RESERVED_WORDS.includes(value)) {
      throw new InvalidResourceError(
        `资源名称不能使用保留字：${Resource.RESERVED_WORDS.join(', ')}`,
      );
    }
  }

  /**
   * @method getResourceType
   * @description 获取资源类型
   * @returns {string} 资源类型
   */
  getResourceType(): string {
    const parts = this.value.split('.');
    return parts[0] || this.value;
  }

  /**
   * @method getResourceSubType
   * @description 获取资源子类型
   * @returns {string | undefined} 资源子类型
   */
  getResourceSubType(): string | undefined {
    const parts = this.value.split('.');
    return parts.length > 1 ? parts[1] : undefined;
  }

  /**
   * @method isSystemResource
   * @description 检查是否为系统资源
   * @returns {boolean} 是否为系统资源
   */
  isSystemResource(): boolean {
    return this.value.startsWith('system.');
  }

  /**
   * @method isPlatformResource
   * @description 检查是否为平台资源
   * @returns {boolean} 是否为平台资源
   */
  isPlatformResource(): boolean {
    return this.value.startsWith('platform.');
  }

  /**
   * @method isTenantResource
   * @description 检查是否为租户资源
   * @returns {boolean} 是否为租户资源
   */
  isTenantResource(): boolean {
    return this.value.startsWith('tenant.');
  }

  /**
   * @method isOrganizationResource
   * @description 检查是否为组织资源
   * @returns {boolean} 是否为组织资源
   */
  isOrganizationResource(): boolean {
    return this.value.startsWith('organization.');
  }

  /**
   * @method isDepartmentResource
   * @description 检查是否为部门资源
   * @returns {boolean} 是否为部门资源
   */
  isDepartmentResource(): boolean {
    return this.value.startsWith('department.');
  }

  /**
   * @method isUserResource
   * @description 检查是否为用户资源
   * @returns {boolean} 是否为用户资源
   */
  isUserResource(): boolean {
    return this.value.startsWith('user.');
  }

  /**
   * @method toString
   * @description 将资源名称转换为字符串
   * @returns {string} 资源名称字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 将资源名称转换为JSON格式
   * @returns {string} 资源名称字符串
   */
  toJSON(): string {
    return this.value;
  }
}

/**
 * @class InvalidResourceError
 * @description 无效资源错误
 * @extends Error
 */
export class InvalidResourceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResourceError';
  }
}
