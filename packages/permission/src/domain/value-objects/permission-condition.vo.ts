import { ValueObject } from '@aiofix/core';

/**
 * @interface PermissionConditionData
 * @description 权限条件数据接口
 */
export interface PermissionConditionData {
  readonly field: string;
  readonly operator: string;
  readonly value: string | number | boolean | string[] | number[];
  readonly description?: string;
}

/**
 * @class PermissionCondition
 * @description
 * 权限条件值对象，封装权限条件的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 权限条件一旦创建不可变更
 * 2. 权限条件必须符合业务规则
 * 3. 权限条件操作符必须有效
 *
 * 相等性判断：
 * 1. 基于权限条件的完整数据进行比较
 * 2. 支持权限条件的精确匹配
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装权限条件验证逻辑
 * 2. 提供权限条件评估方法
 * 3. 隐藏权限条件格式细节
 *
 * @property {string} field 条件字段
 * @property {string} operator 条件操作符
 * @property {string | number | boolean | string[] | number[]} value 条件值
 * @property {string} description 条件描述
 *
 * @example
 * ```typescript
 * const condition = new PermissionCondition({
 *   field: 'tenantId',
 *   operator: 'equals',
 *   value: 'tenant-123',
 *   description: '只能访问指定租户的数据'
 * });
 * console.log(condition.evaluate({ tenantId: 'tenant-123' })); // true
 * ```
 * @since 1.0.0
 */
export class PermissionCondition extends ValueObject<PermissionConditionData> {
  private static readonly VALID_OPERATORS = [
    'equals',
    'not_equals',
    'in',
    'not_in',
    'contains',
    'not_contains',
    'starts_with',
    'ends_with',
    'greater_than',
    'less_than',
    'greater_than_or_equal',
    'less_than_or_equal',
    'is_null',
    'is_not_null',
    'regex',
    'custom',
  ];

  constructor(data: PermissionConditionData) {
    const validatedData =
      PermissionCondition.validateAndNormalizeCondition(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizeCondition
   * @description 验证并标准化权限条件数据
   * @param {PermissionConditionData} data 原始条件数据
   * @returns {PermissionConditionData} 验证后的条件数据
   * @throws {InvalidPermissionConditionError} 当条件数据无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizeCondition(
    data: PermissionConditionData,
  ): PermissionConditionData {
    if (!data || typeof data !== 'object') {
      throw new InvalidPermissionConditionError('权限条件数据不能为空');
    }

    if (!data.field || typeof data.field !== 'string') {
      throw new InvalidPermissionConditionError('条件字段不能为空');
    }

    if (!data.operator || typeof data.operator !== 'string') {
      throw new InvalidPermissionConditionError('条件操作符不能为空');
    }

    if (!PermissionCondition.VALID_OPERATORS.includes(data.operator)) {
      throw new InvalidPermissionConditionError(
        `无效的条件操作符：${data.operator}。支持的操作符：${PermissionCondition.VALID_OPERATORS.join(', ')}`,
      );
    }

    // 验证操作符与值的兼容性
    if (
      ['is_null', 'is_not_null'].includes(data.operator) &&
      data.value !== null
    ) {
      throw new InvalidPermissionConditionError(
        `${data.operator} 操作符的值必须为 null`,
      );
    }

    if (
      !['is_null', 'is_not_null'].includes(data.operator) &&
      data.value === null
    ) {
      throw new InvalidPermissionConditionError(
        `${data.operator} 操作符的值不能为 null`,
      );
    }

    return {
      field: data.field.trim(),
      operator: data.operator.trim(),
      value: data.value,
      description: data.description?.trim(),
    };
  }

  /**
   * @method getField
   * @description 获取条件字段
   * @returns {string} 条件字段
   */
  getField(): string {
    return this.value.field;
  }

  /**
   * @method getOperator
   * @description 获取条件操作符
   * @returns {string} 条件操作符
   */
  getOperator(): string {
    return this.value.operator;
  }

  /**
   * @method getValue
   * @description 获取条件值
   * @returns {string | number | boolean | string[] | number[]} 条件值
   */
  getValue(): string | number | boolean | string[] | number[] {
    return this.value.value;
  }

  /**
   * @method getDescription
   * @description 获取条件描述
   * @returns {string | undefined} 条件描述
   */
  getDescription(): string | undefined {
    return this.value.description;
  }

  /**
   * @method evaluate
   * @description 评估权限条件
   * @param {Record<string, unknown>} context 评估上下文
   * @returns {boolean} 条件是否满足
   */
  evaluate(context: Record<string, unknown>): boolean {
    const fieldValue = context[this.value.field];

    switch (this.value.operator) {
      case 'equals':
        return fieldValue === this.value.value;
      case 'not_equals':
        return fieldValue !== this.value.value;
      case 'in':
        return (
          Array.isArray(this.value.value) &&
          this.value.value.includes(fieldValue as never)
        );
      case 'not_in':
        return (
          Array.isArray(this.value.value) &&
          !this.value.value.includes(fieldValue as never)
        );
      case 'contains':
        return (
          typeof fieldValue === 'string' &&
          typeof this.value.value === 'string' &&
          fieldValue.includes(this.value.value)
        );
      case 'not_contains':
        return (
          typeof fieldValue === 'string' &&
          typeof this.value.value === 'string' &&
          !fieldValue.includes(this.value.value)
        );
      case 'starts_with':
        return (
          typeof fieldValue === 'string' &&
          typeof this.value.value === 'string' &&
          fieldValue.startsWith(this.value.value)
        );
      case 'ends_with':
        return (
          typeof fieldValue === 'string' &&
          typeof this.value.value === 'string' &&
          fieldValue.endsWith(this.value.value)
        );
      case 'greater_than':
        return (fieldValue as number) > (this.value.value as number);
      case 'less_than':
        return (fieldValue as number) < (this.value.value as number);
      case 'greater_than_or_equal':
        return (fieldValue as number) >= (this.value.value as number);
      case 'less_than_or_equal':
        return (fieldValue as number) <= (this.value.value as number);
      case 'is_null':
        return fieldValue === null || fieldValue === undefined;
      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined;
      case 'regex':
        return (
          typeof fieldValue === 'string' &&
          typeof this.value.value === 'string' &&
          new RegExp(this.value.value).test(fieldValue)
        );
      case 'custom':
        // 自定义操作符需要特殊处理
        return this.evaluateCustomCondition(
          fieldValue as string | number | boolean,
          context,
        );
      default:
        return false;
    }
  }

  /**
   * @method evaluateCustomCondition
   * @description 评估自定义条件
   * @param {string | number | boolean} _fieldValue 字段值
   * @param {Record<string, unknown>} _context 评估上下文
   * @returns {boolean} 条件是否满足
   * @private
   */
  private evaluateCustomCondition(
    _fieldValue: string | number | boolean,
    _context: Record<string, unknown>,
  ): boolean {
    // 这里可以实现自定义条件的评估逻辑
    // 暂时返回 false
    return false;
  }

  /**
   * @method isNullCheck
   * @description 检查是否为空值检查条件
   * @returns {boolean} 是否为空值检查条件
   */
  isNullCheck(): boolean {
    return ['is_null', 'is_not_null'].includes(this.value.operator);
  }

  /**
   * @method isComparison
   * @description 检查是否为比较条件
   * @returns {boolean} 是否为比较条件
   */
  isComparison(): boolean {
    return [
      'greater_than',
      'less_than',
      'greater_than_or_equal',
      'less_than_or_equal',
    ].includes(this.value.operator);
  }

  /**
   * @method isStringOperation
   * @description 检查是否为字符串操作条件
   * @returns {boolean} 是否为字符串操作条件
   */
  isStringOperation(): boolean {
    return [
      'contains',
      'not_contains',
      'starts_with',
      'ends_with',
      'regex',
    ].includes(this.value.operator);
  }

  /**
   * @method isArrayOperation
   * @description 检查是否为数组操作条件
   * @returns {boolean} 是否为数组操作条件
   */
  isArrayOperation(): boolean {
    return ['in', 'not_in'].includes(this.value.operator);
  }

  /**
   * @method toString
   * @description 将权限条件转换为字符串
   * @returns {string} 权限条件字符串表示
   */
  toString(): string {
    const { field, operator, value } = this.value;
    return `${field} ${operator} ${JSON.stringify(value)}`;
  }

  /**
   * @method toJSON
   * @description 将权限条件转换为JSON格式
   * @returns {PermissionConditionData} 权限条件数据
   */
  toJSON(): PermissionConditionData {
    return {
      field: this.value.field,
      operator: this.value.operator,
      value: this.value.value,
      description: this.value.description,
    };
  }
}

/**
 * @class InvalidPermissionConditionError
 * @description 无效权限条件错误
 * @extends Error
 */
export class InvalidPermissionConditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPermissionConditionError';
  }
}
