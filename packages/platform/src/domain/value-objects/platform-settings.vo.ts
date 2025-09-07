import { ValueObject } from '@aiofix/core';

/**
 * @interface PlatformSettingsData
 * @description 平台设置数据结构
 */
export interface PlatformSettingsData {
  readonly name: string;
  readonly description?: string;
  readonly version: string;
  readonly environment: string;
  readonly timezone: string;
  readonly language: string;
  readonly currency: string;
  readonly dateFormat: string;
  readonly timeFormat: string;
  readonly maxUsers?: number;
  readonly maxTenants?: number;
  readonly maxOrganizations?: number;
  readonly maxDepartments?: number;
  readonly maxRoles?: number;
  readonly maxPermissions?: number;
  readonly sessionTimeout?: number;
  readonly passwordPolicy?: Record<string, unknown>;
  readonly securitySettings?: Record<string, unknown>;
  readonly notificationSettings?: Record<string, unknown>;
  readonly featureFlags?: Record<string, boolean>;
}

/**
 * @class PlatformSettings
 * @description
 * 平台设置值对象，封装平台全局设置的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 平台名称一旦设置不可为空
 * 2. 版本号必须符合语义化版本规范
 * 3. 时区必须是有效的IANA时区标识符
 * 4. 语言代码必须符合ISO 639-1标准
 *
 * 相等性判断：
 * 1. 基于平台名称和版本进行相等性比较
 * 2. 忽略可选字段的变化
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装平台设置验证逻辑
 * 2. 提供设置默认值管理
 * 3. 隐藏设置格式细节
 *
 * @property {string} name 平台名称
 * @property {string} description 平台描述
 * @property {string} version 平台版本
 * @property {string} environment 运行环境
 * @property {string} timezone 时区
 * @property {string} language 语言
 * @property {string} currency 货币
 * @property {string} dateFormat 日期格式
 * @property {string} timeFormat 时间格式
 * @property {number} maxUsers 最大用户数
 * @property {number} maxTenants 最大租户数
 * @property {number} maxOrganizations 最大组织数
 * @property {number} maxDepartments 最大部门数
 * @property {number} maxRoles 最大角色数
 * @property {number} maxPermissions 最大权限数
 * @property {number} sessionTimeout 会话超时时间（秒）
 * @property {Record<string, unknown>} passwordPolicy 密码策略
 * @property {Record<string, unknown>} securitySettings 安全设置
 * @property {Record<string, unknown>} notificationSettings 通知设置
 * @property {Record<string, boolean>} featureFlags 功能开关
 *
 * @example
 * ```typescript
 * const settings = new PlatformSettings({
 *   name: 'AIOFIX Platform',
 *   version: '1.0.0',
 *   environment: 'production',
 *   timezone: 'Asia/Shanghai',
 *   language: 'zh-CN'
 * });
 * ```
 * @since 1.0.0
 */
export class PlatformSettings extends ValueObject<PlatformSettingsData> {
  /**
   * 语义化版本正则表达式
   */
  private static readonly VERSION_REGEX =
    /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;

  /**
   * 语言代码正则表达式（ISO 639-1）
   */
  private static readonly LANGUAGE_REGEX = /^[a-z]{2}(-[A-Z]{2})?$/;

  /**
   * 货币代码正则表达式（ISO 4217）
   */
  private static readonly CURRENCY_REGEX = /^[A-Z]{3}$/;

  /**
   * 构造函数
   *
   * @param {PlatformSettingsData} data - 设置数据
   * @throws {Error} 当设置数据无效时抛出错误
   */
  constructor(data: PlatformSettingsData) {
    super(data);
    this.validateSettings(data);
  }

  /**
   * 获取平台名称
   *
   * @returns {string} 平台名称
   */
  public get name(): string {
    return this.value.name;
  }

  /**
   * 获取平台描述
   *
   * @returns {string | undefined} 平台描述
   */
  public get description(): string | undefined {
    return this.value.description;
  }

  /**
   * 获取平台版本
   *
   * @returns {string} 平台版本
   */
  public get version(): string {
    return this.value.version;
  }

  /**
   * 获取运行环境
   *
   * @returns {string} 运行环境
   */
  public get environment(): string {
    return this.value.environment;
  }

  /**
   * 获取时区
   *
   * @returns {string} 时区
   */
  public get timezone(): string {
    return this.value.timezone;
  }

  /**
   * 获取语言
   *
   * @returns {string} 语言
   */
  public get language(): string {
    return this.value.language;
  }

  /**
   * 获取货币
   *
   * @returns {string} 货币
   */
  public get currency(): string {
    return this.value.currency;
  }

  /**
   * 获取日期格式
   *
   * @returns {string} 日期格式
   */
  public get dateFormat(): string {
    return this.value.dateFormat;
  }

  /**
   * 获取时间格式
   *
   * @returns {string} 时间格式
   */
  public get timeFormat(): string {
    return this.value.timeFormat;
  }

  /**
   * 获取最大用户数
   *
   * @returns {number | undefined} 最大用户数
   */
  public get maxUsers(): number | undefined {
    return this.value.maxUsers;
  }

  /**
   * 获取最大租户数
   *
   * @returns {number | undefined} 最大租户数
   */
  public get maxTenants(): number | undefined {
    return this.value.maxTenants;
  }

  /**
   * 获取最大组织数
   *
   * @returns {number | undefined} 最大组织数
   */
  public get maxOrganizations(): number | undefined {
    return this.value.maxOrganizations;
  }

  /**
   * 获取最大部门数
   *
   * @returns {number | undefined} 最大部门数
   */
  public get maxDepartments(): number | undefined {
    return this.value.maxDepartments;
  }

  /**
   * 获取最大角色数
   *
   * @returns {number | undefined} 最大角色数
   */
  public get maxRoles(): number | undefined {
    return this.value.maxRoles;
  }

  /**
   * 获取最大权限数
   *
   * @returns {number | undefined} 最大权限数
   */
  public get maxPermissions(): number | undefined {
    return this.value.maxPermissions;
  }

  /**
   * 获取会话超时时间
   *
   * @returns {number | undefined} 会话超时时间（秒）
   */
  public get sessionTimeout(): number | undefined {
    return this.value.sessionTimeout;
  }

  /**
   * 获取密码策略
   *
   * @returns {Record<string, unknown> | undefined} 密码策略
   */
  public get passwordPolicy(): Record<string, unknown> | undefined {
    return this.value.passwordPolicy;
  }

  /**
   * 获取安全设置
   *
   * @returns {Record<string, unknown> | undefined} 安全设置
   */
  public get securitySettings(): Record<string, unknown> | undefined {
    return this.value.securitySettings;
  }

  /**
   * 获取通知设置
   *
   * @returns {Record<string, unknown> | undefined} 通知设置
   */
  public get notificationSettings(): Record<string, unknown> | undefined {
    return this.value.notificationSettings;
  }

  /**
   * 获取功能开关
   *
   * @returns {Record<string, boolean> | undefined} 功能开关
   */
  public get featureFlags(): Record<string, boolean> | undefined {
    return this.value.featureFlags;
  }

  /**
   * 验证设置数据
   *
   * @param {PlatformSettingsData} data - 设置数据
   * @throws {Error} 当设置数据无效时抛出错误
   * @private
   */
  private validateSettings(data: PlatformSettingsData): void {
    if (
      !data.name ||
      typeof data.name !== 'string' ||
      data.name.trim().length === 0
    ) {
      throw new Error('平台名称不能为空');
    }

    if (!data.version || typeof data.version !== 'string') {
      throw new Error('平台版本不能为空');
    }

    if (!PlatformSettings.VERSION_REGEX.test(data.version)) {
      throw new Error('平台版本格式无效，必须符合语义化版本规范');
    }

    if (!data.environment || typeof data.environment !== 'string') {
      throw new Error('运行环境不能为空');
    }

    if (!data.timezone || typeof data.timezone !== 'string') {
      throw new Error('时区不能为空');
    }

    if (!data.language || typeof data.language !== 'string') {
      throw new Error('语言不能为空');
    }

    if (!PlatformSettings.LANGUAGE_REGEX.test(data.language)) {
      throw new Error('语言代码格式无效，必须符合ISO 639-1标准');
    }

    if (!data.currency || typeof data.currency !== 'string') {
      throw new Error('货币不能为空');
    }

    if (!PlatformSettings.CURRENCY_REGEX.test(data.currency)) {
      throw new Error('货币代码格式无效，必须符合ISO 4217标准');
    }

    if (!data.dateFormat || typeof data.dateFormat !== 'string') {
      throw new Error('日期格式不能为空');
    }

    if (!data.timeFormat || typeof data.timeFormat !== 'string') {
      throw new Error('时间格式不能为空');
    }

    // 验证数值限制
    this.validateNumericLimits(data);
  }

  /**
   * 验证数值限制
   *
   * @param {PlatformSettingsData} data - 设置数据
   * @throws {Error} 当数值限制无效时抛出错误
   * @private
   */
  private validateNumericLimits(data: PlatformSettingsData): void {
    const limits = [
      { key: 'maxUsers', value: data.maxUsers, min: 1 },
      { key: 'maxTenants', value: data.maxTenants, min: 1 },
      { key: 'maxOrganizations', value: data.maxOrganizations, min: 1 },
      { key: 'maxDepartments', value: data.maxDepartments, min: 1 },
      { key: 'maxRoles', value: data.maxRoles, min: 1 },
      { key: 'maxPermissions', value: data.maxPermissions, min: 1 },
      { key: 'sessionTimeout', value: data.sessionTimeout, min: 60 },
    ];

    for (const limit of limits) {
      if (limit.value !== undefined) {
        if (typeof limit.value !== 'number' || limit.value < limit.min) {
          throw new Error(`${limit.key}必须大于等于${limit.min}`);
        }
      }
    }
  }

  /**
   * 更新设置值
   *
   * @param {Partial<PlatformSettingsData>} updates - 更新数据
   * @returns {PlatformSettings} 新的设置实例
   * @throws {Error} 当更新数据无效时抛出错误
   */
  public updateSettings(
    updates: Partial<PlatformSettingsData>,
  ): PlatformSettings {
    const newData = { ...this.value, ...updates };
    return new PlatformSettings(newData);
  }

  /**
   * 检查功能是否启用
   *
   * @param {string} featureName - 功能名称
   * @returns {boolean} 是否启用
   */
  public isFeatureEnabled(featureName: string): boolean {
    return this.featureFlags?.[featureName] ?? false;
  }

  /**
   * 获取设置的字符串表示
   *
   * @returns {string} 设置字符串表示
   */
  public toString(): string {
    return `${this.name} v${this.version} (${this.environment})`;
  }

  /**
   * 创建默认平台设置
   *
   * @param {string} name - 平台名称
   * @param {string} version - 平台版本
   * @returns {PlatformSettings} 默认设置实例
   */
  public static createDefault(name: string, version: string): PlatformSettings {
    return new PlatformSettings({
      name,
      version,
      environment: 'development',
      timezone: 'Asia/Shanghai',
      language: 'zh-CN',
      currency: 'CNY',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm:ss',
      maxUsers: 10000,
      maxTenants: 1000,
      maxOrganizations: 10000,
      maxDepartments: 50000,
      maxRoles: 1000,
      maxPermissions: 10000,
      sessionTimeout: 3600,
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      },
      securitySettings: {
        enableTwoFactor: false,
        maxLoginAttempts: 5,
        lockoutDuration: 900,
        requireEmailVerification: true,
      },
      notificationSettings: {
        enableEmail: true,
        enableSms: false,
        enablePush: true,
      },
      featureFlags: {
        enableMultiTenant: true,
        enableOrganization: true,
        enableDepartment: true,
        enableRole: true,
        enablePermission: true,
      },
    });
  }
}
