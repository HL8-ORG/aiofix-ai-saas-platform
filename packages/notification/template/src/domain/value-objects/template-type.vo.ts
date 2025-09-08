/**
 * @enum TemplateType
 * @description
 * 模板类型枚举，定义支持的通知模板类型。
 *
 * 模板类型定义：
 * 1. EMAIL - 邮件模板：用于邮件通知的模板
 * 2. PUSH - 推送模板：用于推送通知的模板
 * 3. SMS - 短信模板：用于短信通知的模板
 * 4. WEBHOOK - Webhook模板：用于Webhook通知的模板
 *
 * 模板类型特性：
 * 1. 每种类型有不同的内容格式要求
 * 2. 每种类型有不同的长度限制
 * 3. 每种类型有不同的变量支持
 * 4. 每种类型有不同的渲染规则
 *
 * @example
 * ```typescript
 * const type = TemplateType.EMAIL;
 * console.log(type === TemplateType.EMAIL); // true
 * ```
 * @since 1.0.0
 */
export enum TemplateType {
  EMAIL = 'EMAIL',
  PUSH = 'PUSH',
  SMS = 'SMS',
  WEBHOOK = 'WEBHOOK',
}

/**
 * @class TemplateTypeValidator
 * @description
 * 模板类型验证器，负责验证模板类型的合法性和提供类型相关的业务规则。
 *
 * 验证职责：
 * 1. 验证模板类型的有效性
 * 2. 提供类型配置验证功能
 * 3. 确保类型配置符合要求
 *
 * @example
 * ```typescript
 * const validator = new TemplateTypeValidator();
 * const isValid = validator.isValid(TemplateType.EMAIL);
 * const config = validator.getTypeConfig(TemplateType.EMAIL);
 * ```
 * @since 1.0.0
 */
export class TemplateTypeValidator {
  /**
   * @method isValid
   * @description 检查模板类型是否有效
   * @param {string} type 模板类型字符串
   * @returns {boolean} 是否有效
   */
  public isValid(type: string): boolean {
    return Object.values(TemplateType).includes(type as TemplateType);
  }

  /**
   * @method validate
   * @description 验证模板类型的合法性，如果无效则抛出异常
   * @param {string} type 模板类型字符串
   * @returns {void}
   * @throws {InvalidTemplateTypeError} 当模板类型无效时抛出
   */
  public validate(type: string): void {
    if (!this.isValid(type)) {
      throw new InvalidTemplateTypeError(`Invalid template type: ${type}`);
    }
  }

  /**
   * @method getTypeConfig
   * @description 获取模板类型的配置要求
   * @param {TemplateType} type 模板类型
   * @returns {TemplateTypeConfig} 模板类型配置
   */
  public getTypeConfig(type: TemplateType): TemplateTypeConfig {
    const configs: Record<TemplateType, TemplateTypeConfig> = {
      [TemplateType.EMAIL]: {
        name: 'Email',
        displayName: '邮件模板',
        maxTitleLength: 200,
        maxContentLength: 10000,
        supportsHtml: true,
        supportsText: true,
        supportsVariables: true,
        requiredFields: ['title', 'htmlContent', 'textContent'],
        features: ['html', 'text', 'variables', 'attachments'],
      },
      [TemplateType.PUSH]: {
        name: 'Push',
        displayName: '推送模板',
        maxTitleLength: 50,
        maxContentLength: 200,
        supportsHtml: false,
        supportsText: true,
        supportsVariables: true,
        requiredFields: ['title', 'content'],
        features: ['text', 'variables', 'actions', 'badge'],
      },
      [TemplateType.SMS]: {
        name: 'SMS',
        displayName: '短信模板',
        maxTitleLength: 0, // 短信通常没有标题
        maxContentLength: 160,
        supportsHtml: false,
        supportsText: true,
        supportsVariables: true,
        requiredFields: ['content'],
        features: ['text', 'variables'],
      },
      [TemplateType.WEBHOOK]: {
        name: 'Webhook',
        displayName: 'Webhook模板',
        maxTitleLength: 100,
        maxContentLength: 5000,
        supportsHtml: false,
        supportsText: true,
        supportsVariables: true,
        requiredFields: ['content'],
        features: ['json', 'xml', 'variables', 'headers'],
      },
    };

    return configs[type];
  }

  /**
   * @method supportsHtml
   * @description 检查模板类型是否支持HTML
   * @param {TemplateType} type 模板类型
   * @returns {boolean} 是否支持HTML
   */
  public supportsHtml(type: TemplateType): boolean {
    const config = this.getTypeConfig(type);
    return config.supportsHtml;
  }

  /**
   * @method supportsText
   * @description 检查模板类型是否支持纯文本
   * @param {TemplateType} type 模板类型
   * @returns {boolean} 是否支持纯文本
   */
  public supportsText(type: TemplateType): boolean {
    const config = this.getTypeConfig(type);
    return config.supportsText;
  }

  /**
   * @method supportsVariables
   * @description 检查模板类型是否支持变量
   * @param {TemplateType} type 模板类型
   * @returns {boolean} 是否支持变量
   */
  public supportsVariables(type: TemplateType): boolean {
    const config = this.getTypeConfig(type);
    return config.supportsVariables;
  }

  /**
   * @method getMaxTitleLength
   * @description 获取模板类型的最大标题长度
   * @param {TemplateType} type 模板类型
   * @returns {number} 最大标题长度
   */
  public getMaxTitleLength(type: TemplateType): number {
    const config = this.getTypeConfig(type);
    return config.maxTitleLength;
  }

  /**
   * @method getMaxContentLength
   * @description 获取模板类型的最大内容长度
   * @param {TemplateType} type 模板类型
   * @returns {number} 最大内容长度
   */
  public getMaxContentLength(type: TemplateType): number {
    const config = this.getTypeConfig(type);
    return config.maxContentLength;
  }

  /**
   * @method getRequiredFields
   * @description 获取模板类型的必需字段
   * @param {TemplateType} type 模板类型
   * @returns {string[]} 必需字段列表
   */
  public getRequiredFields(type: TemplateType): string[] {
    const config = this.getTypeConfig(type);
    return config.requiredFields;
  }

  /**
   * @method getFeatures
   * @description 获取模板类型支持的功能
   * @param {TemplateType} type 模板类型
   * @returns {string[]} 功能列表
   */
  public getFeatures(type: TemplateType): string[] {
    const config = this.getTypeConfig(type);
    return config.features;
  }

  /**
   * @method getTypeDisplayName
   * @description 获取模板类型的显示名称
   * @param {TemplateType} type 模板类型
   * @returns {string} 显示名称
   */
  public getTypeDisplayName(type: TemplateType): string {
    const config = this.getTypeConfig(type);
    return config.displayName;
  }

  /**
   * @method validateContentLength
   * @description 验证内容长度是否符合模板类型要求
   * @param {TemplateType} type 模板类型
   * @param {string} content 内容
   * @returns {boolean} 是否符合长度要求
   */
  public validateContentLength(type: TemplateType, content: string): boolean {
    const maxLength = this.getMaxContentLength(type);
    return content.length <= maxLength;
  }

  /**
   * @method validateTitleLength
   * @description 验证标题长度是否符合模板类型要求
   * @param {TemplateType} type 模板类型
   * @param {string} title 标题
   * @returns {boolean} 是否符合长度要求
   */
  public validateTitleLength(type: TemplateType, title: string): boolean {
    const maxLength = this.getMaxTitleLength(type);
    return title.length <= maxLength;
  }
}

/**
 * @interface TemplateTypeConfig
 * @description 模板类型配置接口
 */
export interface TemplateTypeConfig {
  name: string;
  displayName: string;
  maxTitleLength: number;
  maxContentLength: number;
  supportsHtml: boolean;
  supportsText: boolean;
  supportsVariables: boolean;
  requiredFields: string[];
  features: string[];
}

/**
 * @class InvalidTemplateTypeError
 * @description 无效模板类型错误
 */
export class InvalidTemplateTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidTemplateTypeError';
  }
}
