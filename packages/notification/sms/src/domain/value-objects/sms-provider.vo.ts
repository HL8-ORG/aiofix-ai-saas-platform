import { ValueObject } from '@aiofix/core';

/**
 * 短信提供商值对象
 *
 * 封装短信服务提供商的信息，包括提供商类型、配置参数等。
 *
 * 业务规则：
 * - 提供商必须支持指定的地区
 * - 提供商必须支持指定的编码方式
 * - 提供商配置参数必须有效
 *
 * @class SmsProvider
 * @extends ValueObject
 */
export class SmsProvider extends ValueObject<{
  readonly providerType: SmsProviderType;
  readonly providerName: string;
  readonly supportedRegions: string[];
  readonly supportedEncodings: SmsEncoding[];
  readonly priority: number;
  readonly isActive: boolean;
  readonly config: Record<string, unknown>;
}> {
  /**
   * 创建短信提供商值对象
   *
   * @param {SmsProviderType} providerType 提供商类型
   * @param {string} providerName 提供商名称
   * @param {string[]} supportedRegions 支持的地区列表
   * @param {SmsEncoding[]} supportedEncodings 支持的编码方式列表
   * @param {number} priority 优先级
   * @param {boolean} isActive 是否激活
   * @param {Record<string, unknown>} config 配置参数
   * @returns {SmsProvider} 短信提供商值对象
   * @throws {InvalidSmsProviderError} 当提供商配置无效时抛出
   */
  public static create(
    providerType: SmsProviderType,
    providerName: string,
    supportedRegions: string[],
    supportedEncodings: SmsEncoding[],
    priority: number = 1,
    isActive: boolean = true,
    config: Record<string, unknown> = {},
  ): SmsProvider {
    SmsProvider.validateProvider(
      providerType,
      providerName,
      supportedRegions,
      supportedEncodings,
      priority,
      config,
    );

    return new SmsProvider({
      providerType,
      providerName,
      supportedRegions,
      supportedEncodings,
      priority,
      isActive,
      config,
    });
  }

  /**
   * 获取提供商类型
   *
   * @returns {SmsProviderType} 提供商类型
   */
  public getProviderType(): SmsProviderType {
    return this.value.providerType;
  }

  /**
   * 获取提供商名称
   *
   * @returns {string} 提供商名称
   */
  public getProviderName(): string {
    return this.value.providerName;
  }

  /**
   * 获取支持的地区列表
   *
   * @returns {string[]} 支持的地区列表
   */
  public getSupportedRegions(): string[] {
    return [...this.value.supportedRegions];
  }

  /**
   * 获取支持的编码方式列表
   *
   * @returns {SmsEncoding[]} 支持的编码方式列表
   */
  public getSupportedEncodings(): SmsEncoding[] {
    return [...this.value.supportedEncodings];
  }

  /**
   * 获取优先级
   *
   * @returns {number} 优先级
   */
  public getPriority(): number {
    return this.value.priority;
  }

  /**
   * 是否激活
   *
   * @returns {boolean} 是否激活
   */
  public isActive(): boolean {
    return this.value.isActive;
  }

  /**
   * 获取配置参数
   *
   * @returns {Record<string, unknown>} 配置参数
   */
  public getConfig(): Record<string, unknown> {
    return { ...this.value.config };
  }

  /**
   * 获取指定配置参数
   *
   * @param {string} key 配置键
   * @returns {unknown} 配置值
   */
  public getConfigValue(key: string): unknown {
    return this.value.config[key];
  }

  /**
   * 检查是否支持指定地区
   *
   * @param {string} region 地区代码
   * @returns {boolean} 是否支持
   */
  public supportsRegion(region: string): boolean {
    return this.value.supportedRegions.includes(region);
  }

  /**
   * 检查是否支持指定编码方式
   *
   * @param {SmsEncoding} encoding 编码方式
   * @returns {boolean} 是否支持
   */
  public supportsEncoding(encoding: SmsEncoding): boolean {
    return this.value.supportedEncodings.includes(encoding);
  }

  /**
   * 检查是否可用
   *
   * @returns {boolean} 是否可用
   */
  public isAvailable(): boolean {
    return this.value.isActive && this.value.priority > 0;
  }

  /**
   * 获取提供商描述
   *
   * @returns {string} 提供商描述
   */
  public getDescription(): string {
    const regions = this.value.supportedRegions.join(', ');
    const encodings = this.value.supportedEncodings.join(', ');
    return `${this.value.providerName} (${this.value.providerType}) - 支持地区: ${regions}, 支持编码: ${encodings}`;
  }

  /**
   * 比较优先级
   *
   * @param {SmsProvider} other 其他提供商
   * @returns {number} 比较结果
   */
  public comparePriority(other: SmsProvider): number {
    return this.value.priority - other.value.priority;
  }

  /**
   * 验证提供商配置
   *
   * @param {SmsProviderType} providerType 提供商类型
   * @param {string} providerName 提供商名称
   * @param {string[]} supportedRegions 支持的地区列表
   * @param {SmsEncoding[]} supportedEncodings 支持的编码方式列表
   * @param {number} priority 优先级
   * @param {Record<string, unknown>} config 配置参数
   * @throws {InvalidSmsProviderError} 当提供商配置无效时抛出
   * @private
   */
  private static validateProvider(
    providerType: SmsProviderType,
    providerName: string,
    supportedRegions: string[],
    supportedEncodings: SmsEncoding[],
    priority: number,
    config: Record<string, unknown>,
  ): void {
    if (!providerName || providerName.trim().length === 0) {
      throw new InvalidSmsProviderError('提供商名称不能为空');
    }

    if (supportedRegions.length === 0) {
      throw new InvalidSmsProviderError('必须至少支持一个地区');
    }

    if (supportedEncodings.length === 0) {
      throw new InvalidSmsProviderError('必须至少支持一种编码方式');
    }

    if (priority < 0) {
      throw new InvalidSmsProviderError('优先级不能为负数');
    }

    // 验证提供商特定配置
    SmsProvider.validateProviderSpecificConfig(providerType, config);
  }

  /**
   * 验证提供商特定配置
   *
   * @param {SmsProviderType} providerType 提供商类型
   * @param {Record<string, unknown>} config 配置参数
   * @throws {InvalidSmsProviderError} 当提供商配置无效时抛出
   * @private
   */
  private static validateProviderSpecificConfig(
    providerType: SmsProviderType,
    config: Record<string, unknown>,
  ): void {
    switch (providerType) {
      case SmsProviderType.ALIYUN:
        if (!config.apiKey || !config.apiSecret) {
          throw new InvalidSmsProviderError(
            '阿里云短信需要配置apiKey和apiSecret',
          );
        }
        break;
      case SmsProviderType.TENCENT:
        if (!config.secretId || !config.secretKey) {
          throw new InvalidSmsProviderError(
            '腾讯云短信需要配置secretId和secretKey',
          );
        }
        break;
      case SmsProviderType.HUAWEI:
        if (!config.appKey || !config.appSecret) {
          throw new InvalidSmsProviderError(
            '华为云短信需要配置appKey和appSecret',
          );
        }
        break;
      case SmsProviderType.TWILIO:
        if (!config.accountSid || !config.authToken) {
          throw new InvalidSmsProviderError(
            'Twilio短信需要配置accountSid和authToken',
          );
        }
        break;
      case SmsProviderType.AWS_SNS:
        if (!config.accessKeyId || !config.secretAccessKey || !config.region) {
          throw new InvalidSmsProviderError(
            'AWS SNS需要配置accessKeyId、secretAccessKey和region',
          );
        }
        break;
      case SmsProviderType.CUSTOM:
        // 自定义提供商需要至少有一个配置参数
        if (Object.keys(config).length === 0) {
          throw new InvalidSmsProviderError('自定义提供商需要至少一个配置参数');
        }
        break;
      default:
        throw new InvalidSmsProviderError(
          `不支持的提供商类型: ${providerType}`,
        );
    }
  }
}

/**
 * 短信提供商类型枚举
 */
export enum SmsProviderType {
  ALIYUN = 'ALIYUN',
  TENCENT = 'TENCENT',
  HUAWEI = 'HUAWEI',
  TWILIO = 'TWILIO',
  AWS_SNS = 'AWS_SNS',
  CUSTOM = 'CUSTOM',
}

/**
 * 短信编码方式枚举
 */
export enum SmsEncoding {
  UTF8 = 'UTF8',
  GSM = 'GSM',
}

/**
 * 无效短信提供商错误
 */
export class InvalidSmsProviderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSmsProviderError';
  }
}
