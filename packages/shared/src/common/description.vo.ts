import { ValueObject } from '@aiofix/core';

/**
 * @interface DescriptionOptions
 * @description 描述值对象配置选项
 */
export interface DescriptionOptions {
  /** 最小长度 */
  minLength?: number;
  /** 最大长度 */
  maxLength?: number;
  /** 是否允许空值 */
  allowEmpty?: boolean;
  /** 错误消息前缀 */
  errorPrefix?: string;
}

/**
 * @class Description
 * @description
 * 通用描述值对象基类，封装描述的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 描述一旦创建不可变更
 * 2. 描述长度必须在有效范围内
 * 3. 描述可以包含多行文本
 *
 * 相等性判断：
 * 1. 基于标准化后的描述进行相等性比较
 * 2. 忽略前后空格差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装描述验证逻辑
 * 2. 提供描述标准化方法
 * 3. 隐藏描述格式细节
 *
 * @property {string} value 描述值
 * @property {DescriptionOptions} options 配置选项
 *
 * @example
 * ```typescript
 * class RoleDescription extends Description {
 *   constructor(value: string) {
 *     super(value, {
 *       minLength: 0,
 *       maxLength: 500,
 *       allowEmpty: true,
 *       errorPrefix: '角色描述'
 *     });
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class Description extends ValueObject<string> {
  protected readonly options: Required<DescriptionOptions>;

  constructor(value: string, options: DescriptionOptions = {}) {
    const normalizedValue = Description.normalizeDescription(value);
    super(normalizedValue);

    this.options = {
      minLength: options.minLength ?? 0,
      maxLength: options.maxLength ?? 1000,
      allowEmpty: options.allowEmpty ?? true,
      errorPrefix: options.errorPrefix ?? '描述',
    };

    this.validateDescription(this.value);
  }

  /**
   * @method normalizeDescription
   * @description 标准化描述
   * @param {string} value 原始描述
   * @returns {string} 标准化后的描述
   * @private
   * @static
   */
  private static normalizeDescription(value: string): string {
    if (!value) {
      return '';
    }
    return value.trim();
  }

  /**
   * @method validateDescription
   * @description 验证描述的有效性
   * @param {string} value 描述值
   * @returns {void}
   * @throws {InvalidDescriptionError} 当描述无效时抛出
   * @private
   */
  private validateDescription(value: string): void {
    if (!this.options.allowEmpty && (!value || value.length === 0)) {
      throw new InvalidDescriptionError(`${this.options.errorPrefix}不能为空`);
    }

    if (value && value.length < this.options.minLength) {
      throw new InvalidDescriptionError(
        `${this.options.errorPrefix}长度不能少于${this.options.minLength}个字符`,
      );
    }

    if (value && value.length > this.options.maxLength) {
      throw new InvalidDescriptionError(
        `${this.options.errorPrefix}长度不能超过${this.options.maxLength}个字符`,
      );
    }
  }

  /**
   * @method getDisplayDescription
   * @description 获取显示用的描述
   * @returns {string} 显示描述
   */
  getDisplayDescription(): string {
    return this.value;
  }

  /**
   * @method getSummary
   * @description 获取描述摘要（前100个字符）
   * @param {number} maxLength 最大长度，默认100
   * @returns {string} 描述摘要
   */
  getSummary(maxLength: number = 100): string {
    if (!this.value || this.value.length <= maxLength) {
      return this.value;
    }
    return this.value.substring(0, maxLength) + '...';
  }

  /**
   * @method getWordCount
   * @description 获取描述词数
   * @returns {number} 词数
   */
  getWordCount(): number {
    if (!this.value) {
      return 0;
    }
    return this.value.split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * @method getLineCount
   * @description 获取描述行数
   * @returns {number} 行数
   */
  getLineCount(): number {
    if (!this.value) {
      return 0;
    }
    return this.value.split('\n').length;
  }

  /**
   * @method isEmpty
   * @description 检查描述是否为空
   * @returns {boolean} 是否为空
   */
  isEmpty(): boolean {
    return !this.value || this.value.trim().length === 0;
  }

  /**
   * @method equals
   * @description 比较两个描述是否相等
   * @param {Description} other 另一个描述对象
   * @returns {boolean} 是否相等
   */
  equals(other: Description): boolean {
    if (!(other instanceof Description)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * @method toString
   * @description 返回描述的字符串表示
   * @returns {string} 描述字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 将描述转换为JSON格式
   * @returns {string} 描述字符串
   */
  toJSON(): string {
    return this.value;
  }

  /**
   * @method isValid
   * @description 验证字符串是否为有效的描述格式
   * @param {string} value 待验证的字符串
   * @returns {boolean} 是否为有效格式
   * @static
   */
  static isValid(value: string, options: DescriptionOptions = {}): boolean {
    try {
      // 创建临时实例进行验证
      const tempClass = class extends Description {
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
 * @class InvalidDescriptionError
 * @description 无效描述异常类
 * @extends Error
 */
export class InvalidDescriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidDescriptionError';
  }
}
