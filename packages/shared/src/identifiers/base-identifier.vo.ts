import { ValueObject } from '@aiofix/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * @interface IdentifierValidationRule
 * @description 标识符验证规则接口
 */
export interface IdentifierValidationRule {
  /**
   * 验证标识符格式
   * @param value 标识符值
   * @throws {Error} 当格式无效时抛出
   */
  validate(value: string): void;
}

/**
 * @class UUIDv4ValidationRule
 * @description UUID v4 验证规则
 */
export class UUIDv4ValidationRule implements IdentifierValidationRule {
  validate(value: string): void {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new Error(`无效的UUID格式: ${value}`);
    }
  }
}

/**
 * @class CustomFormatValidationRule
 * @description 自定义格式验证规则
 */
export class CustomFormatValidationRule implements IdentifierValidationRule {
  constructor(
    private readonly regex: RegExp,
    private readonly errorMessage: string,
    private readonly minLength?: number,
    private readonly maxLength?: number,
  ) {}

  validate(value: string): void {
    if (this.minLength && value.length < this.minLength) {
      throw new Error(`长度不能少于${this.minLength}个字符`);
    }

    if (this.maxLength && value.length > this.maxLength) {
      throw new Error(`长度不能超过${this.maxLength}个字符`);
    }

    if (!this.regex.test(value)) {
      throw new Error(this.errorMessage);
    }
  }
}

/**
 * @abstract class BaseIdentifier
 * @description
 * 标识符值对象基类，提供通用的标识符功能。
 *
 * 通用功能：
 * 1. 基础的验证和相等性判断
 * 2. 统一的错误处理机制
 * 3. 可扩展的验证规则系统
 *
 * @property {string} value 标识符值
 *
 * @example
 * ```typescript
 * class UserId extends BaseIdentifier {
 *   constructor(value?: string) {
 *     super(value, new UUIDv4ValidationRule(), uuidv4);
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class BaseIdentifier extends ValueObject<string> {
  constructor(
    value: string,
    private readonly validationRule: IdentifierValidationRule,
    private readonly generator?: () => string,
  ) {
    super(value);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证标识符的有效性
   * @returns {void}
   * @throws {Error} 当标识符无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new Error('标识符不能为空');
    }

    this.validationRule.validate(this.value);
  }

  /**
   * @method equals
   * @description 比较两个标识符是否相等，忽略大小写
   * @param {BaseIdentifier} other 另一个标识符对象
   * @returns {boolean} 是否相等
   */
  equals(other: BaseIdentifier): boolean {
    if (!(other instanceof this.constructor)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * @method toString
   * @description 返回标识符的字符串表示
   * @returns {string} 标识符字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method getValidationRule
   * @description 获取验证规则
   * @returns {IdentifierValidationRule} 验证规则
   * @protected
   */
  protected getValidationRule(): IdentifierValidationRule {
    return this.validationRule;
  }

  /**
   * @method getGenerator
   * @description 获取生成器函数
   * @returns {(() => string) | undefined} 生成器函数
   * @protected
   */
  protected getGenerator(): (() => string) | undefined {
    return this.generator;
  }
}

/**
 * @abstract class UUIDIdentifier
 * @description
 * UUID类型标识符基类，专门用于UUID v4格式的标识符。
 *
 * 特性：
 * 1. 自动使用UUID v4验证规则
 * 2. 自动使用uuidv4生成器
 * 3. 提供标准的UUID操作方法
 *
 * @example
 * ```typescript
 * class UserId extends UUIDIdentifier {
 *   constructor(value?: string) {
 *     super(value);
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class UUIDIdentifier extends BaseIdentifier {
  constructor(value?: string) {
    super(value ?? uuidv4(), new UUIDv4ValidationRule(), uuidv4);
  }
}

/**
 * @abstract class CustomIdentifier
 * @description
 * 自定义格式标识符基类，用于非UUID格式的标识符。
 *
 * 特性：
 * 1. 使用自定义验证规则
 * 2. 支持长度限制
 * 3. 支持正则表达式验证
 *
 * @example
 * ```typescript
 * class TenantId extends CustomIdentifier {
 *   constructor(value: string) {
 *     super(
 *       value,
 *       new CustomFormatValidationRule(
 *         /^[a-zA-Z0-9_-]+$/,
 *         '只能包含字母、数字、连字符和下划线',
 *         3,
 *         50
 *       )
 *     );
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class CustomIdentifier extends BaseIdentifier {
  constructor(value: string, validationRule: IdentifierValidationRule) {
    super(value, validationRule);
  }
}
