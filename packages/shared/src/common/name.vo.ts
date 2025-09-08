import { ValueObject } from '@aiofix/core';

/**
 * @interface NameOptions
 * @description 名称值对象配置选项
 */
export interface NameOptions {
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 无效字符正则表达式 */
  invalidCharsRegex?: RegExp;
  /** 是否允许空值 */
  allowEmpty?: boolean;
  /** 错误消息前缀 */
  errorPrefix?: string;
}

/**
 * @class Name
 * @description
 * 通用名称值对象基类，封装名称的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 名称一旦创建不可变更
 * 2. 名称长度必须在有效范围内
 * 3. 名称不能包含非法字符
 *
 * 相等性判断：
 * 1. 基于标准化后的名称进行相等性比较
 * 2. 忽略前后空格和大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装名称验证逻辑
 * 2. 提供名称标准化方法
 * 3. 隐藏名称格式细节
 *
 * @property {string} value 名称值
 * @property {NameOptions} options 配置选项
 *
 * @example
 * ```typescript
 * class RoleName extends Name {
 *   constructor(value: string) {
 *     super(value, {
 *       minLength: 1,
 *       maxLength: 50,
 *       invalidCharsRegex: /[<>"'&]/,
 *       errorPrefix: '角色名称'
 *     });
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class Name extends ValueObject<string> {
  protected readonly options: Required<NameOptions>;

  constructor(value: string, options: NameOptions = {}) {
    const normalizedValue = Name.normalizeName(value);
    super(normalizedValue);

    this.options = {
      minLength: options.minLength ?? 1,
      maxLength: options.maxLength ?? 100,
      invalidCharsRegex: options.invalidCharsRegex ?? /[<>"'&]/,
      allowEmpty: options.allowEmpty ?? false,
      errorPrefix: options.errorPrefix ?? '名称',
    };

    this.validateName(this.value);
  }

  /**
   * @method normalizeName
   * @description 标准化名称
   * @param {string} value 原始名称
   * @returns {string} 标准化后的名称
   * @private
   * @static
   */
  private static normalizeName(value: string): string {
    return value.trim();
  }

  /**
   * @method validateName
   * @description 验证名称的有效性
   * @param {string} value 名称值
   * @returns {void}
   * @throws {InvalidNameError} 当名称无效时抛出
   * @private
   */
  private validateName(value: string): void {
    if (!this.options.allowEmpty && (!value || typeof value !== 'string')) {
      throw new InvalidNameError(`${this.options.errorPrefix}不能为空`);
    }

    if (value && value.length < this.options.minLength) {
      throw new InvalidNameError(
        `${this.options.errorPrefix}长度不能少于${this.options.minLength}个字符`,
      );
    }

    if (value && value.length > this.options.maxLength) {
      throw new InvalidNameError(
        `${this.options.errorPrefix}长度不能超过${this.options.maxLength}个字符`,
      );
    }

    if (value && this.options.invalidCharsRegex.test(value)) {
      throw new InvalidNameError(
        `${this.options.errorPrefix}不能包含特殊字符: < > " ' &`,
      );
    }
  }

  /**
   * @method getDisplayName
   * @description 获取显示用的名称
   * @returns {string} 显示名称
   */
  getDisplayName(): string {
    return this.value;
  }

  /**
   * @method getShortName
   * @description 获取简称（前20个字符）
   * @param {number} maxLength 最大长度，默认20
   * @returns {string} 简称
   */
  getShortName(maxLength: number = 20): string {
    if (this.value.length <= maxLength) {
      return this.value;
    }
    return this.value.substring(0, maxLength) + '...';
  }

  /**
   * @method equals
   * @description 比较两个名称是否相等，忽略大小写
   * @param {Name} other 另一个名称对象
   * @returns {boolean} 是否相等
   */
  equals(other: Name): boolean {
    if (!(other instanceof Name)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * @method toString
   * @description 返回名称的字符串表示
   * @returns {string} 名称字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 将名称转换为JSON格式
   * @returns {string} 名称字符串
   */
  toJSON(): string {
    return this.value;
  }

  /**
   * @method isValid
   * @description 验证字符串是否为有效的名称格式
   * @param {string} value 待验证的字符串
   * @returns {boolean} 是否为有效格式
   * @static
   */
  static isValid(value: string, options: NameOptions = {}): boolean {
    try {
      // 创建临时实例进行验证
      const tempClass = class extends Name {
        constructor(val: string) {
          super(val, options);
        }
      };
      new tempClass(value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @class InvalidNameError
 * @description 无效名称异常类
 * @extends Error
 */
export class InvalidNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNameError';
  }
}
