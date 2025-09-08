import { ValueObject } from '@aiofix/core';

/**
 * @interface BaseContentData
 * @description 基础内容数据接口
 */
export interface BaseContentData {
  readonly [key: string]: unknown;
}

/**
 * @interface ContentValidationRule
 * @description 内容验证规则接口
 */
export interface ContentValidationRule {
  /** 字段名称 */
  field: string;
  /** 是否必填 */
  required?: boolean;
  /** 数据类型 */
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** 最小长度（字符串类型） */
  minLength?: number;
  /** 最大长度（字符串类型） */
  maxLength?: number;
  /** 正则表达式（字符串类型） */
  pattern?: RegExp;
  /** 允许的值列表 */
  allowedValues?: unknown[];
  /** 自定义验证函数 */
  validator?: (value: unknown) => boolean;
  /** 错误消息 */
  errorMessage?: string;
}

/**
 * @class BaseContent
 * @description
 * 基础内容值对象，提供通用的内容验证和管理功能。
 *
 * 功能特性：
 * 1. 提供通用的内容验证框架
 * 2. 支持多种内容类型的验证
 * 3. 提供内容模板和变量替换功能
 * 4. 支持内容过滤和敏感词检测
 *
 * 验证规则：
 * 1. 必填字段验证
 * 2. 数据类型验证
 * 3. 字符串长度验证
 * 4. 正则表达式验证
 * 5. 枚举值验证
 * 6. 自定义验证函数
 *
 * 内容特性：
 * 1. 模板变量替换
 * 2. 敏感词过滤
 * 3. 内容长度统计
 * 4. 内容摘要生成
 * 5. 多语言支持
 *
 * @example
 * ```typescript
 * class MyContent extends BaseContent<MyContentData> {
 *   protected getValidationRules(): ContentValidationRule[] {
 *     return [
 *       { field: 'title', required: true, type: 'string', minLength: 1, maxLength: 100 },
 *       { field: 'body', required: true, type: 'string', minLength: 1, maxLength: 1000 }
 *     ];
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class BaseContent<
  T extends BaseContentData,
> extends ValueObject<T> {
  /**
   * @constructor
   * @description 创建基础内容值对象
   * @param {T} data 内容数据
   * @throws {InvalidContentError} 当内容数据无效时抛出
   */
  constructor(data: T) {
    // 注意：这里不能调用 this.getValidationRules()，因为 super() 还没有调用
    // 子类需要在构造函数中先验证数据，然后调用 super()
    super(data);
  }

  /**
   * @method validateAndNormalize
   * @description 验证并标准化内容数据
   * @param {T} data 原始内容数据
   * @param {ContentValidationRule[]} rules 验证规则
   * @returns {T} 验证后的内容数据
   * @throws {InvalidContentError} 当内容数据无效时抛出
   * @static
   */
  private static validateAndNormalize<T extends BaseContentData>(
    data: T,
    rules: ContentValidationRule[],
  ): T {
    if (!data || typeof data !== 'object') {
      throw new InvalidContentError('内容数据不能为空');
    }

    const validatedData = { ...data };

    for (const rule of rules) {
      BaseContent.validateField(validatedData, rule);
    }

    return validatedData;
  }

  /**
   * @method validateField
   * @description 验证单个字段
   * @param {T} data 内容数据
   * @param {ContentValidationRule} rule 验证规则
   * @throws {InvalidContentError} 当字段验证失败时抛出
   * @static
   * @private
   */
  private static validateField<T extends BaseContentData>(
    data: T,
    rule: ContentValidationRule,
  ): void {
    const value = data[rule.field];

    // 必填验证
    if (
      rule.required &&
      (value === undefined || value === null || value === '')
    ) {
      throw new InvalidContentError(
        rule.errorMessage || `字段 ${rule.field} 是必填的`,
      );
    }

    // 如果值为空且不是必填，跳过其他验证
    if (value === undefined || value === null || value === '') {
      return;
    }

    // 数据类型验证
    if (rule.type && !BaseContent.validateType(value, rule.type)) {
      throw new InvalidContentError(
        rule.errorMessage || `字段 ${rule.field} 必须是 ${rule.type} 类型`,
      );
    }

    // 字符串长度验证
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        throw new InvalidContentError(
          rule.errorMessage ||
            `字段 ${rule.field} 长度不能少于 ${rule.minLength} 个字符`,
        );
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        throw new InvalidContentError(
          rule.errorMessage ||
            `字段 ${rule.field} 长度不能超过 ${rule.maxLength} 个字符`,
        );
      }
    }

    // 正则表达式验证
    if (
      rule.pattern &&
      typeof value === 'string' &&
      !rule.pattern.test(value)
    ) {
      throw new InvalidContentError(
        rule.errorMessage || `字段 ${rule.field} 格式无效`,
      );
    }

    // 枚举值验证
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      throw new InvalidContentError(
        rule.errorMessage || `字段 ${rule.field} 的值不在允许的范围内`,
      );
    }

    // 自定义验证函数
    if (rule.validator && !rule.validator(value)) {
      throw new InvalidContentError(
        rule.errorMessage || `字段 ${rule.field} 验证失败`,
      );
    }
  }

  /**
   * @method validateType
   * @description 验证数据类型
   * @param {unknown} value 值
   * @param {string} expectedType 期望类型
   * @returns {boolean} 类型是否匹配
   * @static
   * @private
   */
  private static validateType(value: unknown, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return (
          typeof value === 'object' && value !== null && !Array.isArray(value)
        );
      case 'array':
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * @method getValidationRules
   * @description 获取验证规则列表
   * @returns {ContentValidationRule[]} 验证规则列表
   * @abstract
   */
  protected abstract getValidationRules(): ContentValidationRule[];

  /**
   * @method get
   * @description 获取内容值
   * @param {string} key 内容键
   * @returns {unknown} 内容值
   */
  public get(key: string): unknown {
    return this.value[key];
  }

  /**
   * @method has
   * @description 检查是否包含指定键
   * @param {string} key 内容键
   * @returns {boolean} 是否包含
   */
  public has(key: string): boolean {
    return key in this.value;
  }

  /**
   * @method getKeys
   * @description 获取所有内容键
   * @returns {string[]} 内容键列表
   */
  public getKeys(): string[] {
    return Object.keys(this.value);
  }

  /**
   * @method getValues
   * @description 获取所有内容值
   * @returns {unknown[]} 内容值列表
   */
  public getValues(): unknown[] {
    return Object.values(this.value);
  }

  /**
   * @method getEntries
   * @description 获取所有键值对
   * @returns {[string, unknown][]} 键值对列表
   */
  public getEntries(): [string, unknown][] {
    return Object.entries(this.value);
  }

  /**
   * @method renderTemplate
   * @description 渲染模板内容，替换变量
   * @param {string} template 模板内容
   * @param {Record<string, string>} variables 模板变量
   * @returns {string} 渲染后的内容
   */
  public static renderTemplate(
    template: string,
    variables: Record<string, string>,
  ): string {
    let rendered = template;

    // 替换模板变量 {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    // 替换模板变量 {variableName}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    return rendered;
  }

  /**
   * @method containsSensitiveWords
   * @description 检查内容是否包含敏感词
   * @param {string[]} sensitiveWords 敏感词列表
   * @returns {boolean} 是否包含敏感词
   */
  public containsSensitiveWords(sensitiveWords: string[]): boolean {
    const textFields = this.getTextFields();
    const content = textFields.join(' ').toLowerCase();

    return sensitiveWords.some(word => content.includes(word.toLowerCase()));
  }

  /**
   * @method getTextFields
   * @description 获取所有文本字段
   * @returns {string[]} 文本字段列表
   * @protected
   */
  protected getTextFields(): string[] {
    const textFields: string[] = [];

    for (const [key, value] of Object.entries(this.value)) {
      if (typeof value === 'string') {
        textFields.push(value);
      }
    }

    return textFields;
  }

  /**
   * @method getContentLength
   * @description 获取内容长度统计
   * @returns {Record<string, number>} 内容长度统计
   */
  public getContentLength(): Record<string, number> {
    const lengths: Record<string, number> = {};
    let totalLength = 0;

    for (const [key, value] of Object.entries(this.value)) {
      if (typeof value === 'string') {
        lengths[key] = value.length;
        totalLength += value.length;
      }
    }

    lengths.total = totalLength;
    return lengths;
  }

  /**
   * @method getSummary
   * @description 获取内容摘要
   * @param {number} [maxLength] 最大长度
   * @returns {string} 内容摘要
   */
  public getSummary(maxLength: number = 100): string {
    const textFields = this.getTextFields();
    const content = textFields.join(' ');

    if (content.length <= maxLength) {
      return content;
    }

    return `${content.substring(0, maxLength)}...`;
  }

  /**
   * @method toJSON
   * @description 转换为JSON格式
   * @returns {Record<string, unknown>} JSON格式的内容数据
   */
  public toJSON(): Record<string, unknown> {
    return { ...this.value };
  }

  /**
   * @method toString
   * @description 转换为字符串表示
   * @returns {string} 字符串表示
   */
  public toString(): string {
    return this.getSummary(200);
  }

  /**
   * @method equals
   * @description 比较两个内容是否相等
   * @param {BaseContent<T>} other 其他内容实例
   * @returns {boolean} 是否相等
   */
  public equals(other: BaseContent<T>): boolean {
    if (!other || !(other instanceof BaseContent)) {
      return false;
    }

    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }

  /**
   * @method clone
   * @description 克隆内容实例
   * @returns {BaseContent<T>} 新的内容实例
   */
  public clone(): BaseContent<T> {
    return new (this.constructor as new (data: T) => BaseContent<T>)({
      ...this.value,
    });
  }
}

/**
 * @class InvalidContentError
 * @description 无效内容错误
 */
export class InvalidContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidContentError';
  }
}
