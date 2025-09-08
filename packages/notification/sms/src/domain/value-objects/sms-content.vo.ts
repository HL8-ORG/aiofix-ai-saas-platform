import { ValueObject } from '@aiofix/core';

/**
 * 短信内容值对象
 *
 * 封装短信通知的内容信息，包括文本内容、模板参数、签名等。
 *
 * 业务规则：
 * - 短信内容长度必须符合运营商限制
 * - 支持模板参数替换
 * - 必须包含合法的短信签名
 * - 内容不能包含敏感信息
 *
 * @class SmsContent
 * @extends ValueObject
 */
export class SmsContent extends ValueObject<{
  readonly text: string;
  readonly templateId?: string;
  readonly templateParams?: Record<string, string>;
  readonly signature: string;
  readonly encoding: SmsEncoding;
  readonly language: string;
  readonly isTemplate: boolean;
}> {
  /**
   * 创建短信内容值对象
   *
   * @param {string} text 短信文本内容
   * @param {string} signature 短信签名
   * @param {string} [templateId] 模板ID
   * @param {Record<string, string>} [templateParams] 模板参数
   * @param {SmsEncoding} [encoding] 编码方式
   * @param {string} [language] 语言代码
   * @returns {SmsContent} 短信内容值对象
   * @throws {InvalidSmsContentError} 当短信内容无效时抛出
   */
  public static create(
    text: string,
    signature: string,
    templateId?: string,
    templateParams?: Record<string, string>,
    encoding: SmsEncoding = SmsEncoding.UTF8,
    language: string = 'zh-CN',
  ): SmsContent {
    const isTemplate = Boolean(templateId);
    const finalText = isTemplate
      ? SmsContent.processTemplate(text, templateParams || {})
      : text;

    SmsContent.validateContent(finalText, signature, encoding);

    return new SmsContent({
      text: finalText,
      templateId,
      templateParams,
      signature,
      encoding,
      language,
      isTemplate,
    });
  }

  /**
   * 从模板创建短信内容
   *
   * @param {string} templateId 模板ID
   * @param {Record<string, string>} templateParams 模板参数
   * @param {string} signature 短信签名
   * @param {SmsEncoding} [encoding] 编码方式
   * @param {string} [language] 语言代码
   * @returns {SmsContent} 短信内容值对象
   */
  public static createFromTemplate(
    templateId: string,
    templateParams: Record<string, string>,
    signature: string,
    encoding: SmsEncoding = SmsEncoding.UTF8,
    language: string = 'zh-CN',
  ): SmsContent {
    // 这里应该从模板服务获取模板内容
    // 为了演示，我们使用占位符
    const templateText = `【${signature}】您的验证码是{code}，请在{minutes}分钟内使用。`;

    return SmsContent.create(
      templateText,
      signature,
      templateId,
      templateParams,
      encoding,
      language,
    );
  }

  /**
   * 获取短信文本内容
   *
   * @returns {string} 短信文本内容
   */
  public getText(): string {
    return this.value.text;
  }

  /**
   * 获取模板ID
   *
   * @returns {string | undefined} 模板ID
   */
  public getTemplateId(): string | undefined {
    return this.value.templateId;
  }

  /**
   * 获取模板参数
   *
   * @returns {Record<string, string> | undefined} 模板参数
   */
  public getTemplateParams(): Record<string, string> | undefined {
    return this.value.templateParams;
  }

  /**
   * 获取短信签名
   *
   * @returns {string} 短信签名
   */
  public getSignature(): string {
    return this.value.signature;
  }

  /**
   * 获取编码方式
   *
   * @returns {SmsEncoding} 编码方式
   */
  public getEncoding(): SmsEncoding {
    return this.value.encoding;
  }

  /**
   * 获取语言代码
   *
   * @returns {string} 语言代码
   */
  public getLanguage(): string {
    return this.value.language;
  }

  /**
   * 是否为模板短信
   *
   * @returns {boolean} 是否为模板短信
   */
  public isTemplate(): boolean {
    return this.value.isTemplate;
  }

  /**
   * 获取完整短信内容（包含签名）
   *
   * @returns {string} 完整短信内容
   */
  public getFullContent(): string {
    return `${this.value.text}【${this.value.signature}】`;
  }

  /**
   * 获取短信长度
   *
   * @returns {number} 短信长度
   */
  public getLength(): number {
    return this.getFullContent().length;
  }

  /**
   * 获取短信段数
   *
   * @returns {number} 短信段数
   */
  public getSegmentCount(): number {
    const length = this.getLength();

    if (this.value.encoding === SmsEncoding.UTF8) {
      // UTF-8编码：70字符为一条短信
      return Math.ceil(length / 70);
    } else {
      // GSM编码：160字符为一条短信
      return Math.ceil(length / 160);
    }
  }

  /**
   * 检查是否超过单条短信限制
   *
   * @returns {boolean} 是否超过单条短信限制
   */
  public exceedsSingleSmsLimit(): boolean {
    return this.getSegmentCount() > 1;
  }

  /**
   * 检查是否超过最大长度限制
   *
   * @returns {boolean} 是否超过最大长度限制
   */
  public exceedsMaxLength(): boolean {
    const maxLength = this.value.encoding === SmsEncoding.UTF8 ? 1000 : 2000;
    return this.getLength() > maxLength;
  }

  /**
   * 获取短信内容摘要（用于日志记录）
   *
   * @param {number} [maxLength] 最大长度
   * @returns {string} 短信内容摘要
   */
  public getSummary(maxLength: number = 50): string {
    const content = this.value.text;
    if (content.length <= maxLength) {
      return content;
    }
    return `${content.substring(0, maxLength)}...`;
  }

  /**
   * 检查是否包含敏感词
   *
   * @param {string[]} sensitiveWords 敏感词列表
   * @returns {boolean} 是否包含敏感词
   */
  public containsSensitiveWords(sensitiveWords: string[]): boolean {
    const content = this.value.text.toLowerCase();
    return sensitiveWords.some(word => content.includes(word.toLowerCase()));
  }

  /**
   * 处理模板参数替换
   *
   * @param {string} template 模板文本
   * @param {Record<string, string>} params 模板参数
   * @returns {string} 处理后的文本
   * @private
   */
  private static processTemplate(
    template: string,
    params: Record<string, string>,
  ): string {
    let result = template;

    // 替换模板参数 {paramName}
    Object.entries(params).forEach(([key, value]) => {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });

    return result;
  }

  /**
   * 验证短信内容
   *
   * @param {string} text 短信文本
   * @param {string} signature 短信签名
   * @param {SmsEncoding} encoding 编码方式
   * @throws {InvalidSmsContentError} 当短信内容无效时抛出
   * @private
   */
  private static validateContent(
    text: string,
    signature: string,
    encoding: SmsEncoding,
  ): void {
    if (!text || text.trim().length === 0) {
      throw new InvalidSmsContentError('短信内容不能为空');
    }

    if (!signature || signature.trim().length === 0) {
      throw new InvalidSmsContentError('短信签名不能为空');
    }

    if (signature.length > 10) {
      throw new InvalidSmsContentError('短信签名长度不能超过10个字符');
    }

    // 检查签名格式（通常需要包含【】）
    if (!signature.startsWith('【') || !signature.endsWith('】')) {
      throw new InvalidSmsContentError('短信签名格式无效，应包含【】');
    }

    // 检查内容长度
    const fullContent = `${text}【${signature}】`;
    const maxLength = encoding === SmsEncoding.UTF8 ? 1000 : 2000;

    if (fullContent.length > maxLength) {
      throw new InvalidSmsContentError(
        `短信内容长度超过限制，最大${maxLength}个字符`,
      );
    }

    // 检查是否包含非法字符
    const illegalChars = /[<>{}]/;
    if (illegalChars.test(text)) {
      throw new InvalidSmsContentError('短信内容包含非法字符');
    }
  }
}

/**
 * 短信编码方式枚举
 */
export enum SmsEncoding {
  UTF8 = 'UTF8',
  GSM = 'GSM',
}

/**
 * 无效短信内容错误
 */
export class InvalidSmsContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSmsContentError';
  }
}
