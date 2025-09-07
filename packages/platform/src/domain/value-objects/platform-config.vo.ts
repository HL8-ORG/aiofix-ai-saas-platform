import { ValueObject } from '@aiofix/core';
import { PlatformConfigType } from '../enums/platform-config-type.enum';

/**
 * @interface PlatformConfigData
 * @description 平台配置数据结构
 */
export interface PlatformConfigData {
  readonly key: string;
  readonly value: unknown;
  readonly type: PlatformConfigType;
  readonly description?: string;
  readonly isEncrypted?: boolean;
  readonly isReadOnly?: boolean;
  readonly validationRules?: Record<string, unknown>;
}

/**
 * @class PlatformConfig
 * @description
 * 平台配置值对象，封装平台配置的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 配置键一旦创建不可变更
 * 2. 配置类型必须与值匹配
 * 3. 只读配置的值不可修改
 *
 * 相等性判断：
 * 1. 基于配置键进行相等性比较
 * 2. 忽略值的变化
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装配置验证逻辑
 * 2. 提供配置类型检查
 * 3. 隐藏配置格式细节
 *
 * @property {string} key 配置键
 * @property {unknown} value 配置值
 * @property {PlatformConfigType} type 配置类型
 * @property {string} description 配置描述
 * @property {boolean} isEncrypted 是否加密
 * @property {boolean} isReadOnly 是否只读
 * @property {Record<string, unknown>} validationRules 验证规则
 *
 * @example
 * ```typescript
 * const config = new PlatformConfig({
 *   key: 'max_users',
 *   value: 1000,
 *   type: PlatformConfigType.SYSTEM,
 *   description: '最大用户数限制'
 * });
 * ```
 * @since 1.0.0
 */
export class PlatformConfig extends ValueObject<PlatformConfigData> {
  /**
   * 构造函数
   *
   * @param {PlatformConfigData} data - 配置数据
   * @throws {Error} 当配置数据无效时抛出错误
   */
  constructor(data: PlatformConfigData) {
    super(data);
    this.validateConfig(data);
  }

  /**
   * 获取配置键
   *
   * @returns {string} 配置键
   */
  public get key(): string {
    return this.value.key;
  }

  /**
   * 获取配置值
   *
   * @returns {unknown} 配置值
   */
  public get configValue(): unknown {
    return this.value.value;
  }

  /**
   * 获取配置类型
   *
   * @returns {PlatformConfigType} 配置类型
   */
  public get type(): PlatformConfigType {
    return this.value.type;
  }

  /**
   * 获取配置描述
   *
   * @returns {string | undefined} 配置描述
   */
  public get description(): string | undefined {
    return this.value.description;
  }

  /**
   * 是否加密
   *
   * @returns {boolean} 是否加密
   */
  public get isEncrypted(): boolean {
    return this.value.isEncrypted ?? false;
  }

  /**
   * 是否只读
   *
   * @returns {boolean} 是否只读
   */
  public get isReadOnly(): boolean {
    return this.value.isReadOnly ?? false;
  }

  /**
   * 获取验证规则
   *
   * @returns {Record<string, unknown> | undefined} 验证规则
   */
  public get validationRules(): Record<string, unknown> | undefined {
    return this.value.validationRules;
  }

  /**
   * 验证配置数据
   *
   * @param {PlatformConfigData} data - 配置数据
   * @throws {Error} 当配置数据无效时抛出错误
   * @private
   */
  private validateConfig(data: PlatformConfigData): void {
    if (!data.key || typeof data.key !== 'string') {
      throw new Error('配置键不能为空');
    }

    if (data.key.trim().length === 0) {
      throw new Error('配置键不能为空字符串');
    }

    if (!Object.values(PlatformConfigType).includes(data.type)) {
      throw new Error('配置类型无效');
    }

    this.validateConfigValue(data.value, data.type);
  }

  /**
   * 验证配置值
   *
   * @param {unknown} value - 配置值
   * @param {PlatformConfigType} type - 配置类型
   * @throws {Error} 当配置值无效时抛出错误
   * @private
   */
  private validateConfigValue(value: unknown, type: PlatformConfigType): void {
    switch (type) {
      case PlatformConfigType.SYSTEM:
        if (
          typeof value !== 'string' &&
          typeof value !== 'number' &&
          typeof value !== 'boolean'
        ) {
          throw new Error('系统配置值必须是字符串、数字或布尔值');
        }
        break;
      case PlatformConfigType.SECURITY:
        if (typeof value !== 'string' && typeof value !== 'boolean') {
          throw new Error('安全配置值必须是字符串或布尔值');
        }
        break;
      case PlatformConfigType.PERFORMANCE:
        if (typeof value !== 'number' && typeof value !== 'string') {
          throw new Error('性能配置值必须是数字或字符串');
        }
        break;
      case PlatformConfigType.FEATURE:
        if (typeof value !== 'boolean') {
          throw new Error('功能配置值必须是布尔值');
        }
        break;
      case PlatformConfigType.NOTIFICATION:
        if (typeof value !== 'string' && typeof value !== 'boolean') {
          throw new Error('通知配置值必须是字符串或布尔值');
        }
        break;
      case PlatformConfigType.STORAGE:
        if (typeof value !== 'string' && typeof value !== 'number') {
          throw new Error('存储配置值必须是字符串或数字');
        }
        break;
      case PlatformConfigType.NETWORK:
        if (typeof value !== 'string' && typeof value !== 'number') {
          throw new Error('网络配置值必须是字符串或数字');
        }
        break;
    }
  }

  /**
   * 更新配置值
   *
   * @param {unknown} newValue - 新值
   * @returns {PlatformConfig} 新的配置实例
   * @throws {Error} 当配置为只读或新值无效时抛出错误
   */
  public updateValue(newValue: unknown): PlatformConfig {
    if (this.isReadOnly) {
      throw new Error('只读配置不能修改');
    }

    this.validateConfigValue(newValue, this.type);

    return new PlatformConfig({
      ...this.value,
      value: newValue,
    });
  }

  /**
   * 获取配置的字符串表示
   *
   * @returns {string} 配置字符串表示
   */
  public toString(): string {
    return `${this.key}: ${String(this.configValue)} (${this.type})`;
  }

  /**
   * 检查配置是否匹配键
   *
   * @param {string} key - 配置键
   * @returns {boolean} 是否匹配
   */
  public matchesKey(key: string): boolean {
    return this.key === key;
  }

  /**
   * 检查配置是否匹配类型
   *
   * @param {PlatformConfigType} type - 配置类型
   * @returns {boolean} 是否匹配
   */
  public matchesType(type: PlatformConfigType): boolean {
    return this.type === type;
  }
}
