/**
 * @class EmailContent
 * @description
 * 邮件内容值对象，封装邮件主题、HTML内容和纯文本内容。
 *
 * 不变性约束：
 * 1. 邮件内容一旦创建不可变更
 * 2. 邮件主题长度必须在1-200字符之间
 * 3. 邮件内容长度必须在1-10000字符之间
 * 4. HTML内容必须包含有效的HTML标签
 *
 * 相等性判断：
 * 1. 基于邮件内容的完整比较
 * 2. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装邮件内容的验证逻辑
 * 2. 提供邮件内容的格式化方法
 * 3. 隐藏邮件内容的格式细节
 *
 * @property {string} subject 邮件主题
 * @property {string} htmlContent HTML内容
 * @property {string} textContent 纯文本内容
 *
 * @example
 * ```typescript
 * const content = new EmailContent(
 *   '系统维护通知',
 *   '<h1>系统维护通知</h1><p>系统将在今晚进行维护</p>',
 *   '系统维护通知\n\n系统将在今晚进行维护'
 * );
 * ```
 * @since 1.0.0
 */
export class EmailContent {
  private readonly _subject: string;
  private readonly _htmlContent: string;
  private readonly _textContent: string;

  constructor(subject: string, htmlContent: string, textContent: string) {
    this.validateEmailContent(subject, htmlContent, textContent);
    this._subject = subject.trim();
    this._htmlContent = htmlContent.trim();
    this._textContent = textContent.trim();
  }

  /**
   * @method create
   * @description 创建邮件内容值对象的静态工厂方法
   * @param {string} subject 邮件主题
   * @param {string} htmlContent HTML内容
   * @param {string} textContent 纯文本内容
   * @returns {EmailContent} 邮件内容值对象
   * @throws {InvalidEmailContentError} 当邮件内容无效时抛出
   */
  public static create(
    subject: string,
    htmlContent: string,
    textContent: string,
  ): EmailContent {
    return new EmailContent(subject, htmlContent, textContent);
  }

  /**
   * @method createFromTemplate
   * @description 从模板创建邮件内容
   * @param {string} subject 邮件主题
   * @param {string} htmlTemplate HTML模板
   * @param {string} textTemplate 纯文本模板
   * @param {Record<string, string>} variables 模板变量
   * @returns {EmailContent} 邮件内容值对象
   */
  public static createFromTemplate(
    subject: string,
    htmlTemplate: string,
    textTemplate: string,
    variables: Record<string, string> = {},
  ): EmailContent {
    const renderedSubject = this.renderTemplate(subject, variables);
    const renderedHtml = this.renderTemplate(htmlTemplate, variables);
    const renderedText = this.renderTemplate(textTemplate, variables);

    return new EmailContent(renderedSubject, renderedHtml, renderedText);
  }

  /**
   * @getter subject
   * @description 获取邮件主题
   * @returns {string} 邮件主题
   */
  public get subject(): string {
    return this._subject;
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
   * @method equals
   * @description 比较两个邮件内容对象是否相等
   * @param {EmailContent} other 另一个邮件内容对象
   * @returns {boolean} 是否相等
   */
  public equals(other: EmailContent): boolean {
    if (!other) {
      return false;
    }
    return (
      this._subject === other._subject &&
      this._htmlContent === other._htmlContent &&
      this._textContent === other._textContent
    );
  }

  /**
   * @method getContentLength
   * @description 获取邮件内容的总长度
   * @returns {number} 内容总长度
   */
  public getContentLength(): number {
    return (
      this._subject.length + this._htmlContent.length + this._textContent.length
    );
  }

  /**
   * @method getSubjectLength
   * @description 获取邮件主题长度
   * @returns {number} 主题长度
   */
  public getSubjectLength(): number {
    return this._subject.length;
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
   * @method isMultipart
   * @description 检查是否为多部分内容（同时包含HTML和纯文本）
   * @returns {boolean} 是否为多部分内容
   */
  public isMultipart(): boolean {
    return this.hasHtmlContent() && this.hasTextContent();
  }

  /**
   * @method validateEmailContent
   * @description 验证邮件内容的有效性
   * @param {string} subject 邮件主题
   * @param {string} htmlContent HTML内容
   * @param {string} textContent 纯文本内容
   * @returns {void}
   * @throws {InvalidEmailContentError} 当邮件内容无效时抛出
   * @private
   */
  private validateEmailContent(
    subject: string,
    htmlContent: string,
    textContent: string,
  ): void {
    // 验证主题
    if (!subject || typeof subject !== 'string') {
      throw new InvalidEmailContentError('邮件主题不能为空');
    }

    const trimmedSubject = subject.trim();
    if (trimmedSubject.length === 0) {
      throw new InvalidEmailContentError('邮件主题不能为空');
    }

    if (trimmedSubject.length > 200) {
      throw new InvalidEmailContentError('邮件主题长度不能超过200个字符');
    }

    // 验证HTML内容
    if (!htmlContent || typeof htmlContent !== 'string') {
      throw new InvalidEmailContentError('HTML内容不能为空');
    }

    const trimmedHtml = htmlContent.trim();
    if (trimmedHtml.length === 0) {
      throw new InvalidEmailContentError('HTML内容不能为空');
    }

    if (trimmedHtml.length > 10000) {
      throw new InvalidEmailContentError('HTML内容长度不能超过10000个字符');
    }

    // 验证HTML格式
    if (!this.isValidHtml(trimmedHtml)) {
      throw new InvalidEmailContentError('HTML内容格式无效');
    }

    // 验证纯文本内容
    if (!textContent || typeof textContent !== 'string') {
      throw new InvalidEmailContentError('纯文本内容不能为空');
    }

    const trimmedText = textContent.trim();
    if (trimmedText.length === 0) {
      throw new InvalidEmailContentError('纯文本内容不能为空');
    }

    if (trimmedText.length > 10000) {
      throw new InvalidEmailContentError('纯文本内容长度不能超过10000个字符');
    }
  }

  /**
   * @method isValidHtml
   * @description 验证HTML内容格式的有效性
   * @param {string} html HTML内容
   * @returns {boolean} 是否为有效的HTML
   * @private
   */
  private isValidHtml(html: string): boolean {
    // 简单的HTML标签验证
    const htmlTagRegex = /<[^>]+>/;
    return htmlTagRegex.test(html);
  }

  /**
   * @method renderTemplate
   * @description 渲染模板内容，替换变量
   * @param {string} template 模板内容
   * @param {Record<string, string>} variables 模板变量
   * @returns {string} 渲染后的内容
   * @private
   */
  private static renderTemplate(
    template: string,
    variables: Record<string, string>,
  ): string {
    let rendered = template;

    // 替换模板变量 {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      rendered = rendered.replace(regex, value);
    });

    return rendered;
  }
}

/**
 * @class InvalidEmailContentError
 * @description 无效邮件内容错误
 */
export class InvalidEmailContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailContentError';
  }
}
