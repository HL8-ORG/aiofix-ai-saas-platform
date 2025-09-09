/**
 * @class ContentPreference
 * @description
 * 内容偏好值对象，封装用户对通知内容的偏好设置。
 *
 * 内容偏好包含：
 * 1. 感兴趣的通知类型：用户希望接收的通知类型
 * 2. 过滤关键词：用户不希望接收包含特定关键词的通知
 * 3. 语言偏好：用户希望接收通知的语言
 * 4. 内容长度偏好：用户偏好的通知内容长度
 * 5. 个性化设置：用户个性化的内容偏好
 *
 * 业务规则：
 * 1. 通知类型必须是有效的类型
 * 2. 过滤关键词不能为空字符串
 * 3. 语言代码必须符合ISO 639-1标准
 * 4. 内容长度偏好必须是有效值
 *
 * @property {string[]} interestedTypes 感兴趣的通知类型
 * @property {string[]} filterKeywords 过滤关键词列表
 * @property {string} language 语言偏好
 * @property {string} contentLength 内容长度偏好
 * @property {Record<string, any>} personalization 个性化设置
 *
 * @example
 * ```typescript
 * const contentPreference = new ContentPreference(
 *   ['system', 'marketing', 'security'],
 *   ['spam', 'promotion'],
 *   'zh-CN',
 *   'medium',
 *   { showEmoji: true, showImages: false }
 * );
 * ```
 * @since 1.0.0
 */
export class ContentPreference {
  constructor(
    public readonly interestedTypes: string[],
    public readonly filterKeywords: string[],
    public readonly language: string,
    public readonly contentLength: string,
    public readonly personalization: Record<string, unknown> = {},
  ) {
    this.validateInterestedTypes(interestedTypes);
    this.validateFilterKeywords(filterKeywords);
    this.validateLanguage(language);
    this.validateContentLength(contentLength);
    this.validatePersonalization(personalization);
  }

  /**
   * @method equals
   * @description 比较两个内容偏好是否相等
   * @param {ContentPreference} other 另一个内容偏好对象
   * @returns {boolean} 是否相等
   */
  equals(other: ContentPreference): boolean {
    if (!other) return false;

    return (
      JSON.stringify(this.interestedTypes.sort()) ===
        JSON.stringify(other.interestedTypes.sort()) &&
      JSON.stringify(this.filterKeywords.sort()) ===
        JSON.stringify(other.filterKeywords.sort()) &&
      this.language === other.language &&
      this.contentLength === other.contentLength &&
      JSON.stringify(this.personalization) ===
        JSON.stringify(other.personalization)
    );
  }

  /**
   * @method isInterestedInType
   * @description 检查用户是否对指定通知类型感兴趣
   * @param {string} type 通知类型
   * @returns {boolean} 是否感兴趣
   */
  isInterestedInType(type: string): boolean {
    return this.interestedTypes.includes(type);
  }

  /**
   * @method shouldFilterContent
   * @description 检查内容是否应该被过滤
   * @param {string} content 通知内容
   * @returns {boolean} 是否应该被过滤
   */
  shouldFilterContent(content: string): boolean {
    if (!content || typeof content !== 'string') {
      return false;
    }

    const lowerContent = content.toLowerCase();

    return this.filterKeywords.some(keyword =>
      lowerContent.includes(keyword.toLowerCase()),
    );
  }

  /**
   * @method getPersonalizationValue
   * @description 获取个性化设置值
   * @param {string} key 设置键
   * @param {any} defaultValue 默认值
   * @returns {any} 设置值
   */
  getPersonalizationValue(key: string, defaultValue?: unknown): unknown {
    return this.personalization[key] ?? defaultValue;
  }

  /**
   * @method isShortContent
   * @description 检查是否偏好短内容
   * @returns {boolean} 是否偏好短内容
   */
  isShortContent(): boolean {
    return this.contentLength === 'short';
  }

  /**
   * @method isLongContent
   * @description 检查是否偏好长内容
   * @returns {boolean} 是否偏好长内容
   */
  isLongContent(): boolean {
    return this.contentLength === 'long';
  }

  /**
   * @method validateInterestedTypes
   * @description 验证感兴趣的通知类型
   * @param {string[]} types 通知类型列表
   * @returns {void}
   * @throws {Error} 当通知类型无效时抛出
   * @private
   */
  private validateInterestedTypes(types: string[]): void {
    const validTypes = [
      'system',
      'marketing',
      'security',
      'transaction',
      'social',
      'news',
      'reminder',
      'alert',
      'promotion',
    ];

    if (!Array.isArray(types)) {
      throw new Error('Interested types must be an array');
    }

    for (const type of types) {
      if (!validTypes.includes(type)) {
        throw new Error(
          `Invalid notification type: ${type}. Valid types are: ${validTypes.join(', ')}`,
        );
      }
    }
  }

  /**
   * @method validateFilterKeywords
   * @description 验证过滤关键词
   * @param {string[]} keywords 关键词列表
   * @returns {void}
   * @throws {Error} 当关键词无效时抛出
   * @private
   */
  private validateFilterKeywords(keywords: string[]): void {
    if (!Array.isArray(keywords)) {
      throw new Error('Filter keywords must be an array');
    }

    for (const keyword of keywords) {
      if (typeof keyword !== 'string' || keyword.trim() === '') {
        throw new Error('Filter keywords cannot be empty strings');
      }
    }
  }

  /**
   * @method validateLanguage
   * @description 验证语言代码
   * @param {string} language 语言代码
   * @returns {void}
   * @throws {Error} 当语言代码无效时抛出
   * @private
   */
  private validateLanguage(language: string): void {
    const validLanguages = [
      'zh-CN',
      'zh-TW',
      'en-US',
      'en-GB',
      'ja-JP',
      'ko-KR',
      'fr-FR',
      'de-DE',
      'es-ES',
      'pt-BR',
    ];

    if (!validLanguages.includes(language)) {
      throw new Error(
        `Invalid language code: ${language}. Valid languages are: ${validLanguages.join(', ')}`,
      );
    }
  }

  /**
   * @method validateContentLength
   * @description 验证内容长度偏好
   * @param {string} length 内容长度偏好
   * @returns {void}
   * @throws {Error} 当内容长度偏好无效时抛出
   * @private
   */
  private validateContentLength(length: string): void {
    const validLengths = ['short', 'medium', 'long'];

    if (!validLengths.includes(length)) {
      throw new Error(
        `Invalid content length: ${length}. Valid lengths are: ${validLengths.join(', ')}`,
      );
    }
  }

  /**
   * @method validatePersonalization
   * @description 验证个性化设置
   * @param {Record<string, any>} personalization 个性化设置
   * @returns {void}
   * @throws {Error} 当个性化设置无效时抛出
   * @private
   */
  private validatePersonalization(
    personalization: Record<string, unknown>,
  ): void {
    if (typeof personalization !== 'object' || personalization === null) {
      throw new Error('Personalization must be a valid object');
    }

    // 验证个性化设置不能包含循环引用
    try {
      JSON.stringify(personalization);
    } catch {
      throw new Error('Personalization contains circular references');
    }
  }

  /**
   * @method isContentTypeAllowed
   * @description 检查是否允许指定的内容类型
   * @param {string} contentType 内容类型
   * @returns {boolean} 是否允许
   */
  isContentTypeAllowed(contentType: string): boolean {
    return this.interestedTypes.includes(contentType);
  }

  /**
   * @method hasConflict
   * @description 检查与其他内容偏好是否有冲突
   * @param {ContentPreference} other 其他内容偏好
   * @returns {boolean} 是否有冲突
   */
  hasConflict(other: ContentPreference): boolean {
    // 检查语言冲突
    if (this.language !== other.language) {
      return true;
    }

    // 检查内容长度偏好冲突
    if (this.contentLength !== other.contentLength) {
      return true;
    }

    return false;
  }

  /**
   * @method get type
   * @description 获取偏好类型
   * @returns {string} 偏好类型
   */
  get type(): string {
    return 'content';
  }

  /**
   * @method get allowedTypes
   * @description 获取允许的类型列表
   * @returns {string[]} 允许的类型列表
   */
  get allowedTypes(): string[] {
    return this.interestedTypes;
  }

  /**
   * @method getSummary
   * @description 获取内容偏好摘要
   * @returns {object} 内容偏好摘要
   */
  getSummary(): object {
    return {
      interestedTypes: this.interestedTypes,
      filterKeywords: this.filterKeywords,
      language: this.language,
      contentLength: this.contentLength,
      personalization: this.personalization,
    };
  }
}
