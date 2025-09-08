/**
 * @enum EmailProvider
 * @description
 * 邮件服务商枚举，定义支持的邮件服务提供商。
 *
 * 服务商类型：
 * 1. SMTP - SMTP服务器：使用标准SMTP协议发送邮件
 * 2. SENDGRID - SendGrid服务：使用SendGrid API发送邮件
 * 3. MAILGUN - Mailgun服务：使用Mailgun API发送邮件
 * 4. SES - AWS SES服务：使用Amazon SES发送邮件
 * 5. CUSTOM - 自定义服务：使用自定义邮件服务
 *
 * 服务商特性：
 * 1. 每个服务商有不同的配置要求
 * 2. 每个服务商有不同的发送限制
 * 3. 每个服务商有不同的错误处理策略
 * 4. 每个服务商有不同的成本结构
 *
 * @example
 * ```typescript
 * const provider = EmailProvider.SENDGRID;
 * console.log(provider === EmailProvider.SENDGRID); // true
 * ```
 * @since 1.0.0
 */
export enum EmailProvider {
  SMTP = 'SMTP',
  SENDGRID = 'SENDGRID',
  MAILGUN = 'MAILGUN',
  SES = 'SES',
  CUSTOM = 'CUSTOM',
}

/**
 * @class EmailProviderValidator
 * @description
 * 邮件服务商验证器，负责验证邮件服务商的合法性和提供服务商相关的业务规则。
 *
 * 验证职责：
 * 1. 验证邮件服务商的有效性
 * 2. 提供服务商配置验证功能
 * 3. 确保服务商配置符合要求
 *
 * @example
 * ```typescript
 * const validator = new EmailProviderValidator();
 * const isValid = validator.isValid(EmailProvider.SENDGRID);
 * const config = validator.getProviderConfig(EmailProvider.SENDGRID);
 * ```
 * @since 1.0.0
 */
export class EmailProviderValidator {
  /**
   * @method isValid
   * @description 检查邮件服务商是否有效
   * @param {string} provider 邮件服务商字符串
   * @returns {boolean} 是否有效
   */
  public isValid(provider: string): boolean {
    return Object.values(EmailProvider).includes(provider as EmailProvider);
  }

  /**
   * @method validate
   * @description 验证邮件服务商的合法性，如果无效则抛出异常
   * @param {string} provider 邮件服务商字符串
   * @returns {void}
   * @throws {InvalidEmailProviderError} 当邮件服务商无效时抛出
   */
  public validate(provider: string): void {
    if (!this.isValid(provider)) {
      throw new InvalidEmailProviderError(
        `Invalid email provider: ${provider}`,
      );
    }
  }

  /**
   * @method getProviderConfig
   * @description 获取服务商的配置要求
   * @param {EmailProvider} provider 邮件服务商
   * @returns {EmailProviderConfig} 服务商配置
   */
  public getProviderConfig(provider: EmailProvider): EmailProviderConfig {
    const configs: Record<EmailProvider, EmailProviderConfig> = {
      [EmailProvider.SMTP]: {
        name: 'SMTP',
        displayName: 'SMTP服务器',
        requiresAuth: true,
        supportsTLS: true,
        supportsSSL: true,
        maxRecipients: 1000,
        rateLimit: 100, // 每分钟
        costPerEmail: 0,
        features: ['basic', 'tls', 'ssl'],
      },
      [EmailProvider.SENDGRID]: {
        name: 'SendGrid',
        displayName: 'SendGrid',
        requiresAuth: true,
        supportsTLS: true,
        supportsSSL: true,
        maxRecipients: 1000,
        rateLimit: 600, // 每分钟
        costPerEmail: 0.0001,
        features: ['api', 'analytics', 'templates', 'tracking'],
      },
      [EmailProvider.MAILGUN]: {
        name: 'Mailgun',
        displayName: 'Mailgun',
        requiresAuth: true,
        supportsTLS: true,
        supportsSSL: true,
        maxRecipients: 1000,
        rateLimit: 1000, // 每分钟
        costPerEmail: 0.00008,
        features: ['api', 'analytics', 'templates', 'tracking'],
      },
      [EmailProvider.SES]: {
        name: 'AWS SES',
        displayName: 'Amazon SES',
        requiresAuth: true,
        supportsTLS: true,
        supportsSSL: true,
        maxRecipients: 50,
        rateLimit: 14, // 每秒
        costPerEmail: 0.0001,
        features: ['api', 'analytics', 'templates', 'tracking'],
      },
      [EmailProvider.CUSTOM]: {
        name: 'Custom',
        displayName: '自定义服务',
        requiresAuth: false,
        supportsTLS: false,
        supportsSSL: false,
        maxRecipients: 100,
        rateLimit: 10, // 每分钟
        costPerEmail: 0,
        features: ['basic'],
      },
    };

    return configs[provider];
  }

  /**
   * @method isCloudProvider
   * @description 检查是否为云服务提供商
   * @param {EmailProvider} provider 邮件服务商
   * @returns {boolean} 是否为云服务提供商
   */
  public isCloudProvider(provider: EmailProvider): boolean {
    return [
      EmailProvider.SENDGRID,
      EmailProvider.MAILGUN,
      EmailProvider.SES,
    ].includes(provider);
  }

  /**
   * @method isSelfHostedProvider
   * @description 检查是否为自托管服务提供商
   * @param {EmailProvider} provider 邮件服务商
   * @returns {boolean} 是否为自托管服务提供商
   */
  public isSelfHostedProvider(provider: EmailProvider): boolean {
    return provider === EmailProvider.SMTP;
  }

  /**
   * @method supportsAnalytics
   * @description 检查服务商是否支持分析功能
   * @param {EmailProvider} provider 邮件服务商
   * @returns {boolean} 是否支持分析功能
   */
  public supportsAnalytics(provider: EmailProvider): boolean {
    const config = this.getProviderConfig(provider);
    return config.features.includes('analytics');
  }

  /**
   * @method supportsTemplates
   * @description 检查服务商是否支持模板功能
   * @param {EmailProvider} provider 邮件服务商
   * @returns {boolean} 是否支持模板功能
   */
  public supportsTemplates(provider: EmailProvider): boolean {
    const config = this.getProviderConfig(provider);
    return config.features.includes('templates');
  }

  /**
   * @method supportsTracking
   * @description 检查服务商是否支持跟踪功能
   * @param {EmailProvider} provider 邮件服务商
   * @returns {boolean} 是否支持跟踪功能
   */
  public supportsTracking(provider: EmailProvider): boolean {
    const config = this.getProviderConfig(provider);
    return config.features.includes('tracking');
  }

  /**
   * @method getRateLimit
   * @description 获取服务商的发送频率限制
   * @param {EmailProvider} provider 邮件服务商
   * @returns {number} 每分钟发送限制
   */
  public getRateLimit(provider: EmailProvider): number {
    const config = this.getProviderConfig(provider);
    return config.rateLimit;
  }

  /**
   * @method getMaxRecipients
   * @description 获取服务商的最大收件人数量
   * @param {EmailProvider} provider 邮件服务商
   * @returns {number} 最大收件人数量
   */
  public getMaxRecipients(provider: EmailProvider): number {
    const config = this.getProviderConfig(provider);
    return config.maxRecipients;
  }

  /**
   * @method getCostPerEmail
   * @description 获取服务商的每封邮件成本
   * @param {EmailProvider} provider 邮件服务商
   * @returns {number} 每封邮件成本（美元）
   */
  public getCostPerEmail(provider: EmailProvider): number {
    const config = this.getProviderConfig(provider);
    return config.costPerEmail;
  }

  /**
   * @method getProviderDisplayName
   * @description 获取服务商的显示名称
   * @param {EmailProvider} provider 邮件服务商
   * @returns {string} 服务商显示名称
   */
  public getProviderDisplayName(provider: EmailProvider): string {
    const config = this.getProviderConfig(provider);
    return config.displayName;
  }
}

/**
 * @interface EmailProviderConfig
 * @description 邮件服务商配置接口
 */
export interface EmailProviderConfig {
  name: string;
  displayName: string;
  requiresAuth: boolean;
  supportsTLS: boolean;
  supportsSSL: boolean;
  maxRecipients: number;
  rateLimit: number; // 每分钟
  costPerEmail: number; // 美元
  features: string[];
}

/**
 * @class InvalidEmailProviderError
 * @description 无效邮件服务商错误
 */
export class InvalidEmailProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailProviderError';
  }
}
