/**
 * @enum VariableType
 * @description
 * 变量类型枚举，定义模板变量支持的数据类型。
 *
 * 变量类型定义：
 * 1. STRING - 字符串类型
 * 2. NUMBER - 数字类型
 * 3. BOOLEAN - 布尔类型
 * 4. DATE - 日期类型
 * 5. OBJECT - 对象类型
 * 6. ARRAY - 数组类型
 *
 * @example
 * ```typescript
 * const type = VariableType.STRING;
 * console.log(type === VariableType.STRING); // true
 * ```
 * @since 1.0.0
 */
export enum VariableType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  DATE = 'DATE',
  OBJECT = 'OBJECT',
  ARRAY = 'ARRAY',
}

/**
 * @class TemplateVariable
 * @description
 * 模板变量值对象，封装模板变量的定义、验证和业务概念。
 *
 * 不变性约束：
 * 1. 变量名称一旦创建不可变更
 * 2. 变量类型必须符合预定义类型
 * 3. 变量描述不能为空
 *
 * 相等性判断：
 * 1. 基于变量名称进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装变量验证逻辑
 * 2. 提供变量类型检查
 * 3. 隐藏变量格式细节
 *
 * @property {string} name 变量名称
 * @property {VariableType} type 变量类型
 * @property {string} description 变量描述
 * @property {any} defaultValue 默认值
 * @property {boolean} required 是否必需
 *
 * @example
 * ```typescript
 * const variable = new TemplateVariable(
 *   'userName',
 *   VariableType.STRING,
 *   '用户姓名',
 *   'Guest',
 *   true
 * );
 * ```
 * @since 1.0.0
 */
export class TemplateVariable {
  private readonly _name: string;
  private readonly _type: VariableType;
  private readonly _description: string;
  private readonly _defaultValue: any;
  private readonly _required: boolean;

  constructor(
    name: string,
    type: VariableType,
    description: string,
    defaultValue?: any,
    required: boolean = false,
  ) {
    this.validateTemplateVariable(name, type, description, defaultValue);
    this._name = name.trim();
    this._type = type;
    this._description = description.trim();
    this._defaultValue = defaultValue;
    this._required = required;
  }

  /**
   * @method create
   * @description 创建模板变量值对象的静态工厂方法
   * @param {string} name 变量名称
   * @param {VariableType} type 变量类型
   * @param {string} description 变量描述
   * @param {any} defaultValue 默认值
   * @param {boolean} required 是否必需
   * @returns {TemplateVariable} 模板变量值对象
   * @throws {InvalidTemplateVariableError} 当变量定义无效时抛出
   */
  public static create(
    name: string,
    type: VariableType,
    description: string,
    defaultValue?: any,
    required: boolean = false,
  ): TemplateVariable {
    return new TemplateVariable(
      name,
      type,
      description,
      defaultValue,
      required,
    );
  }

  /**
   * @getter name
   * @description 获取变量名称
   * @returns {string} 变量名称
   */
  public get name(): string {
    return this._name;
  }

  /**
   * @getter type
   * @description 获取变量类型
   * @returns {VariableType} 变量类型
   */
  public get type(): VariableType {
    return this._type;
  }

  /**
   * @getter description
   * @description 获取变量描述
   * @returns {string} 变量描述
   */
  public get description(): string {
    return this._description;
  }

  /**
   * @getter defaultValue
   * @description 获取默认值
   * @returns {any} 默认值
   */
  public get defaultValue(): any {
    return this._defaultValue;
  }

  /**
   * @getter required
   * @description 获取是否必需
   * @returns {boolean} 是否必需
   */
  public get required(): boolean {
    return this._required;
  }

  /**
   * @method equals
   * @description 比较两个模板变量对象是否相等
   * @param {TemplateVariable} other 另一个模板变量对象
   * @returns {boolean} 是否相等
   */
  public equals(other: TemplateVariable): boolean {
    if (!other) {
      return false;
    }
    return this._name === other._name;
  }

  /**
   * @method toString
   * @description 返回模板变量的字符串表示
   * @returns {string} 模板变量字符串
   */
  public toString(): string {
    return `{{${this._name}}}`;
  }

  /**
   * @method validateValue
   * @description 验证变量值是否符合类型要求
   * @param {any} value 变量值
   * @returns {boolean} 是否符合类型要求
   */
  public validateValue(value: any): boolean {
    if (value === null || value === undefined) {
      return !this._required;
    }

    switch (this._type) {
      case VariableType.STRING:
        return typeof value === 'string';
      case VariableType.NUMBER:
        return typeof value === 'number' && !isNaN(value);
      case VariableType.BOOLEAN:
        return typeof value === 'boolean';
      case VariableType.DATE:
        return value instanceof Date || !isNaN(Date.parse(value));
      case VariableType.OBJECT:
        return typeof value === 'object' && !Array.isArray(value);
      case VariableType.ARRAY:
        return Array.isArray(value);
      default:
        return false;
    }
  }

  /**
   * @method getFormattedValue
   * @description 获取格式化后的变量值
   * @param {any} value 变量值
   * @returns {string} 格式化后的值
   */
  public getFormattedValue(value: any): string {
    if (value === null || value === undefined) {
      return this._defaultValue || '';
    }

    switch (this._type) {
      case VariableType.STRING:
        return String(value);
      case VariableType.NUMBER:
        return String(value);
      case VariableType.BOOLEAN:
        return String(value);
      case VariableType.DATE:
        const date = value instanceof Date ? value : new Date(value);
        return date.toISOString();
      case VariableType.OBJECT:
        return JSON.stringify(value);
      case VariableType.ARRAY:
        return JSON.stringify(value);
      default:
        return String(value);
    }
  }

  /**
   * @method validateTemplateVariable
   * @description 验证模板变量定义的有效性
   * @param {string} name 变量名称
   * @param {VariableType} type 变量类型
   * @param {string} description 变量描述
   * @param {any} defaultValue 默认值
   * @returns {void}
   * @throws {InvalidTemplateVariableError} 当变量定义无效时抛出
   * @private
   */
  private validateTemplateVariable(
    name: string,
    type: VariableType,
    description: string,
    defaultValue?: any,
  ): void {
    // 验证变量名称
    if (!name || typeof name !== 'string') {
      throw new InvalidTemplateVariableError('变量名称不能为空');
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new InvalidTemplateVariableError('变量名称不能为空');
    }

    if (trimmedName.length > 50) {
      throw new InvalidTemplateVariableError('变量名称长度不能超过50个字符');
    }

    // 验证变量名称格式（只能包含字母、数字、下划线）
    const nameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
    if (!nameRegex.test(trimmedName)) {
      throw new InvalidTemplateVariableError(
        '变量名称只能包含字母、数字、下划线，且必须以字母开头',
      );
    }

    // 验证变量类型
    if (!Object.values(VariableType).includes(type)) {
      throw new InvalidTemplateVariableError(`无效的变量类型: ${type}`);
    }

    // 验证变量描述
    if (!description || typeof description !== 'string') {
      throw new InvalidTemplateVariableError('变量描述不能为空');
    }

    const trimmedDescription = description.trim();
    if (trimmedDescription.length === 0) {
      throw new InvalidTemplateVariableError('变量描述不能为空');
    }

    if (trimmedDescription.length > 200) {
      throw new InvalidTemplateVariableError('变量描述长度不能超过200个字符');
    }

    // 验证默认值类型
    if (defaultValue !== undefined && !this.validateValue(defaultValue)) {
      throw new InvalidTemplateVariableError(
        `默认值类型与变量类型不匹配: ${type}`,
      );
    }
  }
}

/**
 * @class InvalidTemplateVariableError
 * @description 无效模板变量错误
 */
export class InvalidTemplateVariableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTemplateVariableError';
  }
}
