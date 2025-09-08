import { ValueObject } from '@aiofix/core';

/**
 * @interface SystemParametersData
 * @description 系统参数数据结构
 */
export interface SystemParametersData {
  readonly sessionTimeout: number; // 分钟
  readonly maxLoginAttempts: number;
  readonly lockoutDuration: number; // 分钟
  readonly passwordMinLength: number;
  readonly passwordRequireUppercase: boolean;
  readonly passwordRequireLowercase: boolean;
  readonly passwordRequireNumbers: boolean;
  readonly passwordRequireSpecialChars: boolean;
  readonly passwordExpiryDays: number;
  readonly twoFactorRequired: boolean;
  readonly apiRateLimit: number; // requests per minute
  readonly fileUploadMaxSize: number; // MB
  readonly supportedFileTypes: string[];
  readonly backupRetentionDays: number;
  readonly logRetentionDays: number;
}

/**
 * @interface FeatureFlagsData
 * @description 功能开关数据结构
 */
export interface FeatureFlagsData {
  readonly multiTenantEnabled: boolean;
  readonly ssoEnabled: boolean;
  readonly auditLogEnabled: boolean;
  readonly realTimeNotifications: boolean;
  readonly advancedAnalytics: boolean;
  readonly customBranding: boolean;
  readonly apiAccess: boolean;
  readonly webhookSupport: boolean;
  readonly dataExport: boolean;
  readonly dataImport: boolean;
  readonly mobileApp: boolean;
  readonly desktopApp: boolean;
}

/**
 * @interface ThemeSettingsData
 * @description 主题设置数据结构
 */
export interface ThemeSettingsData {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly accentColor: string;
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly fontFamily: string;
  readonly fontSize: string;
  readonly borderRadius: string;
  readonly logoUrl?: string;
  readonly faviconUrl?: string;
  readonly customCss?: string;
}

/**
 * @interface SystemConfigurationData
 * @description 系统配置数据结构
 */
export interface SystemConfigurationData {
  readonly systemParameters: SystemParametersData;
  readonly featureFlags: FeatureFlagsData;
  readonly themeSettings: ThemeSettingsData;
  readonly maintenanceMode: boolean;
  readonly maintenanceMessage?: string;
  readonly systemVersion: string;
  readonly lastUpdated: Date;
  readonly updatedBy: string;
}

/**
 * @class SystemConfiguration
 * @description
 * 系统配置值对象，封装平台系统配置的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 系统参数必须符合安全策略要求
 * 2. 功能开关必须为布尔值
 * 3. 主题设置必须符合设计规范
 * 4. 系统版本必须符合语义化版本规范
 *
 * 相等性判断：
 * 1. 基于配置内容进行相等性比较
 * 2. 忽略更新时间的变化
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装配置验证逻辑
 * 2. 提供配置比较和合并方法
 * 3. 隐藏配置格式细节
 *
 * @property {SystemConfigurationData} value 配置数据
 *
 * @example
 * ```typescript
 * const config = new SystemConfiguration({
 *   systemParameters: {
 *     sessionTimeout: 30,
 *     maxLoginAttempts: 5,
 *     lockoutDuration: 15,
 *     // ...
 *   },
 *   featureFlags: {
 *     multiTenantEnabled: true,
 *     ssoEnabled: false,
 *     // ...
 *   },
 *   themeSettings: {
 *     primaryColor: '#1976d2',
 *     secondaryColor: '#dc004e',
 *     // ...
 *   },
 *   maintenanceMode: false,
 *   systemVersion: '1.0.0',
 *   lastUpdated: new Date(),
 *   updatedBy: 'admin-123'
 * });
 * ```
 * @since 1.0.0
 */
export class SystemConfiguration extends ValueObject<SystemConfigurationData> {
  constructor(data: SystemConfigurationData) {
    super(data);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证配置数据的有效性
   * @returns {void}
   * @throws {Error} 当配置数据无效时抛出
   * @private
   */
  private validate(): void {
    const { systemParameters, featureFlags, themeSettings, systemVersion } =
      this.value;

    // 验证系统参数
    if (
      systemParameters.sessionTimeout < 5 ||
      systemParameters.sessionTimeout > 1440
    ) {
      throw new Error('会话超时时间必须在5-1440分钟之间');
    }

    if (
      systemParameters.maxLoginAttempts < 3 ||
      systemParameters.maxLoginAttempts > 10
    ) {
      throw new Error('最大登录尝试次数必须在3-10次之间');
    }

    if (
      systemParameters.passwordMinLength < 6 ||
      systemParameters.passwordMinLength > 32
    ) {
      throw new Error('密码最小长度必须在6-32位之间');
    }

    if (
      systemParameters.apiRateLimit < 10 ||
      systemParameters.apiRateLimit > 10000
    ) {
      throw new Error('API速率限制必须在10-10000次/分钟之间');
    }

    // 验证系统版本
    if (!this.isValidVersion(systemVersion)) {
      throw new Error('系统版本必须符合语义化版本规范');
    }

    // 验证主题设置
    if (!this.isValidColor(themeSettings.primaryColor)) {
      throw new Error('主色调必须是有效的十六进制颜色值');
    }
  }

  /**
   * @method isValidVersion
   * @description 验证版本号格式
   * @param {string} version 版本号
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidVersion(version: string): boolean {
    const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/;
    return versionRegex.test(version);
  }

  /**
   * @method isValidColor
   * @description 验证颜色值格式
   * @param {string} color 颜色值
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidColor(color: string): boolean {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return colorRegex.test(color);
  }

  /**
   * @getter systemParameters
   * @description 获取系统参数
   * @returns {SystemParametersData} 系统参数
   */
  get systemParameters(): SystemParametersData {
    return this.value.systemParameters;
  }

  /**
   * @getter featureFlags
   * @description 获取功能开关
   * @returns {FeatureFlagsData} 功能开关
   */
  get featureFlags(): FeatureFlagsData {
    return this.value.featureFlags;
  }

  /**
   * @getter themeSettings
   * @description 获取主题设置
   * @returns {ThemeSettingsData} 主题设置
   */
  get themeSettings(): ThemeSettingsData {
    return this.value.themeSettings;
  }

  /**
   * @getter maintenanceMode
   * @description 获取维护模式状态
   * @returns {boolean} 维护模式状态
   */
  get maintenanceMode(): boolean {
    return this.value.maintenanceMode;
  }

  /**
   * @getter maintenanceMessage
   * @description 获取维护模式消息
   * @returns {string | undefined} 维护模式消息
   */
  get maintenanceMessage(): string | undefined {
    return this.value.maintenanceMessage;
  }

  /**
   * @getter systemVersion
   * @description 获取系统版本
   * @returns {string} 系统版本
   */
  get systemVersion(): string {
    return this.value.systemVersion;
  }

  /**
   * @getter lastUpdated
   * @description 获取最后更新时间
   * @returns {Date} 最后更新时间
   */
  get lastUpdated(): Date {
    return this.value.lastUpdated;
  }

  /**
   * @getter updatedBy
   * @description 获取更新者
   * @returns {string} 更新者
   */
  get updatedBy(): string {
    return this.value.updatedBy;
  }

  /**
   * @method isFeatureEnabled
   * @description 检查功能是否启用
   * @param {keyof FeatureFlagsData} feature 功能名称
   * @returns {boolean} 是否启用
   */
  isFeatureEnabled(feature: keyof FeatureFlagsData): boolean {
    return this.featureFlags[feature];
  }

  /**
   * @method isMultiTenantEnabled
   * @description 检查多租户是否启用
   * @returns {boolean} 是否启用
   */
  isMultiTenantEnabled(): boolean {
    return this.isFeatureEnabled('multiTenantEnabled');
  }

  /**
   * @method isSsoEnabled
   * @description 检查SSO是否启用
   * @returns {boolean} 是否启用
   */
  isSsoEnabled(): boolean {
    return this.isFeatureEnabled('ssoEnabled');
  }

  /**
   * @method isAuditLogEnabled
   * @description 检查审计日志是否启用
   * @returns {boolean} 是否启用
   */
  isAuditLogEnabled(): boolean {
    return this.isFeatureEnabled('auditLogEnabled');
  }

  /**
   * @method getPasswordPolicy
   * @description 获取密码策略
   * @returns {object} 密码策略
   */
  getPasswordPolicy(): object {
    const params = this.systemParameters;
    return {
      minLength: params.passwordMinLength,
      requireUppercase: params.passwordRequireUppercase,
      requireLowercase: params.passwordRequireLowercase,
      requireNumbers: params.passwordRequireNumbers,
      requireSpecialChars: params.passwordRequireSpecialChars,
      expiryDays: params.passwordExpiryDays,
    };
  }

  /**
   * @method getSecuritySettings
   * @description 获取安全设置
   * @returns {object} 安全设置
   */
  getSecuritySettings(): object {
    const params = this.systemParameters;
    return {
      sessionTimeout: params.sessionTimeout,
      maxLoginAttempts: params.maxLoginAttempts,
      lockoutDuration: params.lockoutDuration,
      twoFactorRequired: params.twoFactorRequired,
    };
  }

  /**
   * @method getApiSettings
   * @description 获取API设置
   * @returns {object} API设置
   */
  getApiSettings(): object {
    const params = this.systemParameters;
    return {
      rateLimit: params.apiRateLimit,
      fileUploadMaxSize: params.fileUploadMaxSize,
      supportedFileTypes: params.supportedFileTypes,
    };
  }

  /**
   * @method getSummary
   * @description 获取配置摘要信息
   * @returns {string} 配置摘要
   */
  getSummary(): string {
    const enabledFeatures = Object.entries(this.featureFlags)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature)
      .join(', ');

    return `版本: ${this.systemVersion}, 维护模式: ${this.maintenanceMode ? '开启' : '关闭'}, 启用功能: ${enabledFeatures || '无'}`;
  }

  /**
   * @method equals
   * @description 比较两个配置对象是否相等
   * @param {SystemConfiguration} other 另一个配置对象
   * @returns {boolean} 是否相等
   */
  equals(other: SystemConfiguration): boolean {
    if (!(other instanceof SystemConfiguration)) {
      return false;
    }

    return JSON.stringify(this.value) === JSON.stringify(other.value);
  }
}
