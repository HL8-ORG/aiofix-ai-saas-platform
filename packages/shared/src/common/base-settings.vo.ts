import { ValueObject } from '@aiofix/core';

/**
 * @interface BaseSettingsData
 * @description 基础设置数据接口
 */
export interface BaseSettingsData {
  readonly [key: string]: unknown;
}

/**
 * @interface SettingsValidationRule
 * @description 设置验证规则接口
 */
export interface SettingsValidationRule {
  /** 字段名称 */
  field: string;
  /** 是否必填 */
  required?: boolean;
  /** 数据类型 */
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  /** 最小值（数字类型） */
  min?: number;
  /** 最大值（数字类型） */
  max?: number;
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
 * @class BaseSettings
 * @description
 * 基础设置值对象，提供通用的设置验证和管理功能。
 *
 * 功能特性：
 * 1. 提供通用的设置验证框架
 * 2. 支持多种数据类型的验证
 * 3. 提供设置更新和合并功能
 * 4. 支持设置默认值管理
 *
 * 验证规则：
 * 1. 必填字段验证
 * 2. 数据类型验证
 * 3. 数值范围验证
 * 4. 字符串长度验证
 * 5. 正则表达式验证
 * 6. 枚举值验证
 * 7. 自定义验证函数
 *
 * @example
 * ```typescript
 * class MySettings extends BaseSettings<MySettingsData> {
 *   protected getValidationRules(): SettingsValidationRule[] {
 *     return [
 *       { field: 'name', required: true, type: 'string', minLength: 1, maxLength: 100 },
 *       { field: 'maxUsers', type: 'number', min: 1, max: 10000 }
 *     ];
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class BaseSettings<
  T extends BaseSettingsData,
> extends ValueObject<T> {
  /**
   * @constructor
   * @description 创建基础设置值对象
   * @param {T} data 设置数据
   * @throws {InvalidSettingsError} 当设置数据无效时抛出
   */
  constructor(data: T) {
    // 注意：这里不能调用 this.getValidationRules()，因为 super() 还没有调用
    // 子类需要在构造函数中先验证数据，然后调用 super()
    super(data);
  }

  /**
   * @method validateAndNormalize
   * @description 验证并标准化设置数据
   * @param {T} data 原始设置数据
   * @param {SettingsValidationRule[]} rules 验证规则
   * @returns {T} 验证后的设置数据
   * @throws {InvalidSettingsError} 当设置数据无效时抛出
   * @static
   */
  private static validateAndNormalize<T extends BaseSettingsData>(
    data: T,
    rules: SettingsValidationRule[],
  ): T {
    if (!data || typeof data !== 'object') {
      throw new InvalidSettingsError('设置数据不能为空');
    }

    const validatedData = { ...data };

    for (const rule of rules) {
      BaseSettings.validateField(validatedData, rule);
    }

    return validatedData;
  }

  /**
   * @method validateField
   * @description 验证单个字段
   * @param {T} data 设置数据
   * @param {SettingsValidationRule} rule 验证规则
   * @throws {InvalidSettingsError} 当字段验证失败时抛出
   * @static
   * @private
   */
  private static validateField<T extends BaseSettingsData>(
    data: T,
    rule: SettingsValidationRule,
  ): void {
    const value = data[rule.field];

    // 必填验证
    if (
      rule.required &&
      (value === undefined || value === null || value === '')
    ) {
      throw new InvalidSettingsError(
        rule.errorMessage || `字段 ${rule.field} 是必填的`,
      );
    }

    // 如果值为空且不是必填，跳过其他验证
    if (value === undefined || value === null || value === '') {
      return;
    }

    // 数据类型验证
    if (rule.type && !BaseSettings.validateType(value, rule.type)) {
      throw new InvalidSettingsError(
        rule.errorMessage || `字段 ${rule.field} 必须是 ${rule.type} 类型`,
      );
    }

    // 数值范围验证
    if (rule.type === 'number' && typeof value === 'number') {
      if (rule.min !== undefined && value < rule.min) {
        throw new InvalidSettingsError(
          rule.errorMessage || `字段 ${rule.field} 不能小于 ${rule.min}`,
        );
      }
      if (rule.max !== undefined && value > rule.max) {
        throw new InvalidSettingsError(
          rule.errorMessage || `字段 ${rule.field} 不能大于 ${rule.max}`,
        );
      }
    }

    // 字符串长度验证
    if (rule.type === 'string' && typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        throw new InvalidSettingsError(
          rule.errorMessage ||
            `字段 ${rule.field} 长度不能少于 ${rule.minLength} 个字符`,
        );
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        throw new InvalidSettingsError(
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
      throw new InvalidSettingsError(
        rule.errorMessage || `字段 ${rule.field} 格式无效`,
      );
    }

    // 枚举值验证
    if (rule.allowedValues && !rule.allowedValues.includes(value)) {
      throw new InvalidSettingsError(
        rule.errorMessage || `字段 ${rule.field} 的值不在允许的范围内`,
      );
    }

    // 自定义验证函数
    if (rule.validator && !rule.validator(value)) {
      throw new InvalidSettingsError(
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
   * @returns {SettingsValidationRule[]} 验证规则列表
   * @abstract
   */
  protected abstract getValidationRules(): SettingsValidationRule[];

  /**
   * @method get
   * @description 获取设置值
   * @param {string} key 设置键
   * @returns {unknown} 设置值
   */
  public get(key: string): unknown {
    return this.value[key];
  }

  /**
   * @method has
   * @description 检查是否包含指定键
   * @param {string} key 设置键
   * @returns {boolean} 是否包含
   */
  public has(key: string): boolean {
    return key in this.value;
  }

  /**
   * @method getKeys
   * @description 获取所有设置键
   * @returns {string[]} 设置键列表
   */
  public getKeys(): string[] {
    return Object.keys(this.value);
  }

  /**
   * @method getValues
   * @description 获取所有设置值
   * @returns {unknown[]} 设置值列表
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
   * @method update
   * @description 更新设置值
   * @param {Partial<T>} updates 更新数据
   * @returns {BaseSettings<T>} 新的设置实例
   * @throws {InvalidSettingsError} 当更新数据无效时抛出
   */
  public update(updates: Partial<T>): BaseSettings<T> {
    const newData = { ...this.value, ...updates };
    return new (this.constructor as new (data: T) => BaseSettings<T>)(newData);
  }

  /**
   * @method merge
   * @description 合并设置值
   * @param {Partial<T>} other 其他设置数据
   * @returns {BaseSettings<T>} 新的设置实例
   * @throws {InvalidSettingsError} 当合并数据无效时抛出
   */
  public merge(other: Partial<T>): BaseSettings<T> {
    const mergedData = BaseSettings.deepMerge(this.value, other);
    return new (this.constructor as new (data: T) => BaseSettings<T>)(
      mergedData,
    );
  }

  /**
   * @method deepMerge
   * @description 深度合并对象
   * @param {T} target 目标对象
   * @param {Partial<T>} source 源对象
   * @returns {T} 合并后的对象
   * @static
   * @private
   */
  private static deepMerge<T extends BaseSettingsData>(
    target: T,
    source: Partial<T>,
  ): T {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key];
        const targetValue = result[key];

        if (
          sourceValue &&
          typeof sourceValue === 'object' &&
          !Array.isArray(sourceValue) &&
          targetValue &&
          typeof targetValue === 'object' &&
          !Array.isArray(targetValue)
        ) {
          result[key] = BaseSettings.deepMerge(
            targetValue as Record<string, unknown>,
            sourceValue as Record<string, unknown>,
          ) as T[Extract<keyof T, string>];
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }

    return result;
  }

  /**
   * @method toJSON
   * @description 转换为JSON格式
   * @returns {Record<string, unknown>} JSON格式的设置数据
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
    return JSON.stringify(this.value, null, 2);
  }

  /**
   * @method equals
   * @description 比较两个设置是否相等
   * @param {BaseSettings<T>} other 其他设置实例
   * @returns {boolean} 是否相等
   */
  public equals(other: BaseSettings<T>): boolean {
    if (!other || !(other instanceof BaseSettings)) {
      return false;
    }

    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }

  /**
   * @method clone
   * @description 克隆设置实例
   * @returns {BaseSettings<T>} 新的设置实例
   */
  public clone(): BaseSettings<T> {
    return new (this.constructor as new (data: T) => BaseSettings<T>)({
      ...this.value,
    });
  }
}

/**
 * @class InvalidSettingsError
 * @description 无效设置错误
 */
export class InvalidSettingsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSettingsError';
  }
}
