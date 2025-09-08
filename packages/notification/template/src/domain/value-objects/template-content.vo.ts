import { TemplateType, TemplateTypeValidator } from './template-type.vo';
import { TemplateVariable } from './template-variable.vo';

/**
 * @class TemplateContent
 * @description
 * 模板内容值对象，封装通知模板的内容结构和验证。
 *
 * 不变性约束：
 * 1. 模板内容一旦创建不可变更
 * 2. 模板标题长度必须在限制范围内
 * 3. 模板内容长度必须在限制范围内
 * 4. 模板变量必须预定义
 *
 * 相等性判断：
 * 1. 基于模板内容的完整比较
 * 2. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装模板内容的验证逻辑
 * 2. 提供模板变量替换功能
 * 3. 隐藏模板内容的格式细节
 *
 * @property {string} title 模板标题
 * @property {string} htmlContent HTML内容
 * @property {string} textContent 纯文本内容
 * @property {string} jsonContent JSON内容
 * @property {TemplateVariable[]} variables 模板变量列表
 *
 * @example
 * ```typescript
 * const content = new TemplateContent(
 *   '欢迎邮件模板',
 *   '<h1>欢迎 {{userName}}</h1>',
 *   '欢迎 {{userName}}',
 *   undefined,
 *   [TemplateVariable.create('userName', VariableType.STRING, '用户姓名')]
 * );
 * ```
 * @since 1.0.0
 */
export class TemplateContent {
  private readonly _title: string;
  private readonly _htmlContent: string;
  private readonly _textContent: string;
  private readonly _jsonContent: string;
  private readonly _variables: TemplateVariable[];

  constructor(
    title: string,
    htmlContent: string,
    textContent: string,
    jsonContent?: string,
    variables: TemplateVariable[] = [],
  ) {
    this.validateTemplateContent(title, htmlContent, textContent, jsonContent);
    this._title = title.trim();
    this._htmlContent = htmlContent.trim();
    this._textContent = textContent.trim();
    this._jsonContent = jsonContent?.trim() || '';
    this._variables = [...variables];
  }

  /**
   * @method create
   * @description 创建模板内容值对象的静态工厂方法
   * @param {string} title 模板标题
   * @param {string} htmlContent HTML内容
   * @param {string} textContent 纯文本内容
   * @param {string} jsonContent JSON内容
   * @param {TemplateVariable[]} variables 模板变量列表
   * @returns {TemplateContent} 模板内容值对象
   * @throws {InvalidTemplateContentError} 当模板内容无效时抛出
   */
  public static create(
    title: string,
    htmlContent: string,
    textContent: string,
    jsonContent?: string,
    variables: TemplateVariable[] = [],
  ): TemplateContent {
    return new TemplateContent(
      title,
      htmlContent,
      textContent,
      jsonContent,
      variables,
    );
  }

  /**
   * @method createForType
   * @description 根据模板类型创建模板内容
   * @param {TemplateType} type 模板类型
   * @param {string} title 模板标题
   * @param {string} content 模板内容
   * @param {TemplateVariable[]} variables 模板变量列表
   * @returns {TemplateContent} 模板内容值对象
   */
  public static createForType(
    type: TemplateType,
    title: string,
    content: string,
    variables: TemplateVariable[] = [],
  ): TemplateContent {
    const typeValidator = new TemplateTypeValidator();

    switch (type) {
      case TemplateType.EMAIL:
        return new TemplateContent(
          title,
          content,
          content,
          undefined,
          variables,
        );
      case TemplateType.PUSH:
        return new TemplateContent(title, '', content, undefined, variables);
      case TemplateType.SMS:
        return new TemplateContent('', '', content, undefined, variables);
      case TemplateType.WEBHOOK:
        return new TemplateContent(title, '', content, content, variables);
      default:
        throw new InvalidTemplateContentError(`不支持的模板类型: ${type}`);
    }
  }

  /**
   * @getter title
   * @description 获取模板标题
   * @returns {string} 模板标题
   */
  public get title(): string {
    return this._title;
  }

  /**
   * @getter htmlContent
   * @description 获取HTML内容
   * @returns {string} HTML内容
   */
  public get htmlContent(): string {
    return this._htmlContent;
  }

  /**
   * @getter textContent
   * @description 获取纯文本内容
   * @returns {string} 纯文本内容
   */
  public get textContent(): string {
    return this._textContent;
  }

  /**
   * @getter jsonContent
   * @description 获取JSON内容
   * @returns {string} JSON内容
   */
  public get jsonContent(): string {
    return this._jsonContent;
  }

  /**
   * @getter variables
   * @description 获取模板变量列表
   * @returns {TemplateVariable[]} 模板变量列表
   */
  public get variables(): TemplateVariable[] {
    return [...this._variables];
  }

  /**
   * @method equals
   * @description 比较两个模板内容对象是否相等
   * @param {TemplateContent} other 另一个模板内容对象
   * @returns {boolean} 是否相等
   */
  public equals(other: TemplateContent): boolean {
    if (!other) {
      return false;
    }
    return (
      this._title === other._title &&
      this._htmlContent === other._htmlContent &&
      this._textContent === other._textContent &&
      this._jsonContent === other._jsonContent &&
      this._variables.length === other._variables.length &&
      this._variables.every((v, i) => v.equals(other._variables[i]))
    );
  }

  /**
   * @method getContentLength
   * @description 获取模板内容的总长度
   * @returns {number} 内容总长度
   */
  public getContentLength(): number {
    return (
      this._title.length +
      this._htmlContent.length +
      this._textContent.length +
      this._jsonContent.length
    );
  }

  /**
   * @method getTitleLength
   * @description 获取模板标题长度
   * @returns {number} 标题长度
   */
  public getTitleLength(): number {
    return this._title.length;
  }

  /**
   * @method getHtmlContentLength
   * @description 获取HTML内容长度
   * @returns {number} HTML内容长度
   */
  public getHtmlContentLength(): number {
    return this._htmlContent.length;
  }

  /**
   * @method getTextContentLength
   * @description 获取纯文本内容长度
   * @returns {number} 纯文本内容长度
   */
  public getTextContentLength(): number {
    return this._textContent.length;
  }

  /**
   * @method getJsonContentLength
   * @description 获取JSON内容长度
   * @returns {number} JSON内容长度
   */
  public getJsonContentLength(): number {
    return this._jsonContent.length;
  }

  /**
   * @method hasHtmlContent
   * @description 检查是否包含HTML内容
   * @returns {boolean} 是否包含HTML内容
   */
  public hasHtmlContent(): boolean {
    return this._htmlContent.length > 0;
  }

  /**
   * @method hasTextContent
   * @description 检查是否包含纯文本内容
   * @returns {boolean} 是否包含纯文本内容
   */
  public hasTextContent(): boolean {
    return this._textContent.length > 0;
  }

  /**
   * @method hasJsonContent
   * @description 检查是否包含JSON内容
   * @returns {boolean} 是否包含JSON内容
   */
  public hasJsonContent(): boolean {
    return this._jsonContent.length > 0;
  }

  /**
   * @method hasVariables
   * @description 检查是否包含模板变量
   * @returns {boolean} 是否包含模板变量
   */
  public hasVariables(): boolean {
    return this._variables.length > 0;
  }

  /**
   * @method getVariableNames
   * @description 获取模板变量名称列表
   * @returns {string[]} 变量名称列表
   */
  public getVariableNames(): string[] {
    return this._variables.map(v => v.name);
  }

  /**
   * @method getVariableByName
   * @description 根据名称获取模板变量
   * @param {string} name 变量名称
   * @returns {TemplateVariable | undefined} 模板变量
   */
  public getVariableByName(name: string): TemplateVariable | undefined {
    return this._variables.find(v => v.name === name);
  }

  /**
   * @method validateForType
   * @description 验证模板内容是否符合指定类型的要求
   * @param {TemplateType} type 模板类型
   * @returns {boolean} 是否符合要求
   */
  public validateForType(type: TemplateType): boolean {
    const typeValidator = new TemplateTypeValidator();

    // 验证标题长度
    if (this._title.length > 0) {
      if (!typeValidator.validateTitleLength(type, this._title)) {
        return false;
      }
    }

    // 验证内容长度
    const contentToValidate = this.getContentForType(type);
    if (!typeValidator.validateContentLength(type, contentToValidate)) {
      return false;
    }

    // 验证必需字段
    const requiredFields = typeValidator.getRequiredFields(type);
    for (const field of requiredFields) {
      if (!this.hasRequiredField(field)) {
        return false;
      }
    }

    return true;
  }

  /**
   * @method getContentForType
   * @description 根据模板类型获取相应的内容
   * @param {TemplateType} type 模板类型
   * @returns {string} 相应类型的内容
   * @private
   */
  private getContentForType(type: TemplateType): string {
    switch (type) {
      case TemplateType.EMAIL:
        return this._htmlContent || this._textContent;
      case TemplateType.PUSH:
        return this._textContent;
      case TemplateType.SMS:
        return this._textContent;
      case TemplateType.WEBHOOK:
        return this._jsonContent || this._textContent;
      default:
        return this._textContent;
    }
  }

  /**
   * @method hasRequiredField
   * @description 检查是否包含必需字段
   * @param {string} field 字段名称
   * @returns {boolean} 是否包含必需字段
   * @private
   */
  private hasRequiredField(field: string): boolean {
    switch (field) {
      case 'title':
        return this._title.length > 0;
      case 'htmlContent':
        return this._htmlContent.length > 0;
      case 'textContent':
        return this._textContent.length > 0;
      case 'content':
        return this._textContent.length > 0 || this._htmlContent.length > 0;
      default:
        return false;
    }
  }

  /**
   * @method validateTemplateContent
   * @description 验证模板内容的有效性
   * @param {string} title 模板标题
   * @param {string} htmlContent HTML内容
   * @param {string} textContent 纯文本内容
   * @param {string} jsonContent JSON内容
   * @returns {void}
   * @throws {InvalidTemplateContentError} 当模板内容无效时抛出
   * @private
   */
  private validateTemplateContent(
    title: string,
    htmlContent: string,
    textContent: string,
    jsonContent?: string,
  ): void {
    // 验证标题
    if (title && typeof title === 'string') {
      const trimmedTitle = title.trim();
      if (trimmedTitle.length > 200) {
        throw new InvalidTemplateContentError('模板标题长度不能超过200个字符');
      }
    }

    // 验证HTML内容
    if (htmlContent && typeof htmlContent === 'string') {
      const trimmedHtml = htmlContent.trim();
      if (trimmedHtml.length > 10000) {
        throw new InvalidTemplateContentError(
          'HTML内容长度不能超过10000个字符',
        );
      }
    }

    // 验证纯文本内容
    if (textContent && typeof textContent === 'string') {
      const trimmedText = textContent.trim();
      if (trimmedText.length > 10000) {
        throw new InvalidTemplateContentError(
          '纯文本内容长度不能超过10000个字符',
        );
      }
    }

    // 验证JSON内容
    if (jsonContent && typeof jsonContent === 'string') {
      const trimmedJson = jsonContent.trim();
      if (trimmedJson.length > 10000) {
        throw new InvalidTemplateContentError(
          'JSON内容长度不能超过10000个字符',
        );
      }

      // 验证JSON格式
      try {
        JSON.parse(trimmedJson);
      } catch (error) {
        throw new InvalidTemplateContentError('JSON内容格式无效');
      }
    }

    // 至少要有一种内容
    if (
      (!htmlContent || htmlContent.trim().length === 0) &&
      (!textContent || textContent.trim().length === 0) &&
      (!jsonContent || jsonContent.trim().length === 0)
    ) {
      throw new InvalidTemplateContentError('模板内容不能为空');
    }
  }
}

/**
 * @class InvalidTemplateContentError
 * @description 无效模板内容错误
 */
export class InvalidTemplateContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTemplateContentError';
  }
}
