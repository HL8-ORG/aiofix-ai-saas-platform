import { ValueObject } from '@aiofix/core';

/**
 * 租户配置数据接口
 */
export interface TenantConfigurationData {
  /** 租户主题配置 */
  theme: ThemeConfiguration;
  /** 租户功能配置 */
  features: FeatureConfiguration;
  /** 租户安全配置 */
  security: SecurityConfiguration;
  /** 租户通知配置 */
  notifications: NotificationConfiguration;
  /** 租户集成配置 */
  integrations: IntegrationConfiguration;
  /** 自定义配置 */
  custom: Record<string, unknown>;
}

/**
 * 主题配置接口
 */
export interface ThemeConfiguration {
  /** 主题名称 */
  name: string;
  /** 主色调 */
  primaryColor: string;
  /** 次要色调 */
  secondaryColor: string;
  /** 背景色 */
  backgroundColor: string;
  /** 文字颜色 */
  textColor: string;
  /** 字体大小 */
  fontSize: 'small' | 'medium' | 'large';
  /** 布局模式 */
  layout: 'compact' | 'comfortable' | 'spacious';
}

/**
 * 功能配置接口
 */
export interface FeatureConfiguration {
  /** 启用的功能模块 */
  enabledModules: string[];
  /** 功能开关 */
  featureFlags: Record<string, boolean>;
  /** 功能限制 */
  featureLimits: Record<string, number>;
  /** 功能权限 */
  featurePermissions: Record<string, string[]>;
}

/**
 * 安全配置接口
 */
export interface SecurityConfiguration {
  /** 密码策略 */
  passwordPolicy: PasswordPolicy;
  /** 会话配置 */
  session: SessionConfiguration;
  /** 访问控制 */
  accessControl: AccessControlConfiguration;
  /** 审计配置 */
  audit: AuditConfiguration;
}

/**
 * 密码策略接口
 */
export interface PasswordPolicy {
  /** 最小长度 */
  minLength: number;
  /** 最大长度 */
  maxLength: number;
  /** 需要大写字母 */
  requireUppercase: boolean;
  /** 需要小写字母 */
  requireLowercase: boolean;
  /** 需要数字 */
  requireNumbers: boolean;
  /** 需要特殊字符 */
  requireSpecialChars: boolean;
  /** 密码有效期（天） */
  expirationDays: number;
  /** 密码历史记录数量 */
  historyCount: number;
}

/**
 * 会话配置接口
 */
export interface SessionConfiguration {
  /** 会话超时时间（分钟） */
  timeoutMinutes: number;
  /** 最大并发会话数 */
  maxConcurrentSessions: number;
  /** 是否允许记住登录 */
  allowRememberMe: boolean;
  /** 记住登录天数 */
  rememberMeDays: number;
}

/**
 * 访问控制配置接口
 */
export interface AccessControlConfiguration {
  /** IP白名单 */
  ipWhitelist: string[];
  /** IP黑名单 */
  ipBlacklist: string[];
  /** 地理位置限制 */
  geoRestrictions: string[];
  /** 设备限制 */
  deviceRestrictions: string[];
}

/**
 * 审计配置接口
 */
export interface AuditConfiguration {
  /** 是否启用审计日志 */
  enabled: boolean;
  /** 审计日志保留天数 */
  retentionDays: number;
  /** 审计事件类型 */
  eventTypes: string[];
  /** 敏感操作审计 */
  sensitiveOperations: string[];
}

/**
 * 通知配置接口
 */
export interface NotificationConfiguration {
  /** 邮件通知配置 */
  email: EmailNotificationConfiguration;
  /** 短信通知配置 */
  sms: SmsNotificationConfiguration;
  /** 推送通知配置 */
  push: PushNotificationConfiguration;
  /** 站内信通知配置 */
  inApp: InAppNotificationConfiguration;
}

/**
 * 邮件通知配置接口
 */
export interface EmailNotificationConfiguration {
  /** 是否启用 */
  enabled: boolean;
  /** SMTP服务器 */
  smtpServer: string;
  /** SMTP端口 */
  smtpPort: number;
  /** 发件人邮箱 */
  fromEmail: string;
  /** 发件人名称 */
  fromName: string;
  /** 是否使用SSL */
  useSSL: boolean;
  /** 是否使用TLS */
  useTLS: boolean;
}

/**
 * 短信通知配置接口
 */
export interface SmsNotificationConfiguration {
  /** 是否启用 */
  enabled: boolean;
  /** 短信服务提供商 */
  provider: string;
  /** API密钥 */
  apiKey: string;
  /** 发送方号码 */
  fromNumber: string;
  /** 模板ID */
  templateId: string;
}

/**
 * 推送通知配置接口
 */
export interface PushNotificationConfiguration {
  /** 是否启用 */
  enabled: boolean;
  /** 推送服务提供商 */
  provider: string;
  /** 应用密钥 */
  appKey: string;
  /** 应用密钥ID */
  appKeyId: string;
  /** 主密钥 */
  masterSecret: string;
}

/**
 * 站内信通知配置接口
 */
export interface InAppNotificationConfiguration {
  /** 是否启用 */
  enabled: boolean;
  /** 通知保留天数 */
  retentionDays: number;
  /** 最大通知数量 */
  maxNotifications: number;
  /** 通知类型 */
  notificationTypes: string[];
}

/**
 * 集成配置接口
 */
export interface IntegrationConfiguration {
  /** 第三方服务集成 */
  thirdPartyServices: Record<string, ThirdPartyServiceConfiguration>;
  /** API集成 */
  apiIntegrations: Record<string, ApiIntegrationConfiguration>;
  /** Webhook配置 */
  webhooks: Record<string, WebhookConfiguration>;
}

/**
 * 第三方服务配置接口
 */
export interface ThirdPartyServiceConfiguration {
  /** 服务名称 */
  name: string;
  /** 是否启用 */
  enabled: boolean;
  /** 配置参数 */
  config: Record<string, unknown>;
  /** 认证信息 */
  credentials: Record<string, string>;
}

/**
 * API集成配置接口
 */
export interface ApiIntegrationConfiguration {
  /** API名称 */
  name: string;
  /** 基础URL */
  baseUrl: string;
  /** 认证方式 */
  authType: 'none' | 'basic' | 'bearer' | 'api-key';
  /** 认证配置 */
  authConfig: Record<string, string>;
  /** 请求头 */
  headers: Record<string, string>;
  /** 超时时间（毫秒） */
  timeout: number;
}

/**
 * Webhook配置接口
 */
export interface WebhookConfiguration {
  /** Webhook名称 */
  name: string;
  /** 目标URL */
  url: string;
  /** 是否启用 */
  enabled: boolean;
  /** 事件类型 */
  events: string[];
  /** 认证方式 */
  authType: 'none' | 'basic' | 'bearer' | 'signature';
  /** 认证配置 */
  authConfig: Record<string, string>;
  /** 重试次数 */
  retryCount: number;
  /** 重试间隔（毫秒） */
  retryInterval: number;
}

/**
 * @class TenantConfiguration
 * @description
 * 租户配置值对象，封装租户系统配置的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 配置值必须符合预定义的格式和范围
 * 2. 配置结构一旦创建不可变更
 * 3. 配置验证必须通过业务规则检查
 * 4. 敏感配置信息必须加密存储
 *
 * 相等性判断：
 * 1. 基于配置的标准化值进行相等性比较
 * 2. 忽略配置的顺序差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装配置验证和管理逻辑
 * 2. 提供配置访问和更新方法
 * 3. 隐藏配置实现细节
 *
 * @property {ThemeConfiguration} theme 主题配置
 * @property {FeatureConfiguration} features 功能配置
 * @property {SecurityConfiguration} security 安全配置
 * @property {NotificationConfiguration} notifications 通知配置
 * @property {IntegrationConfiguration} integrations 集成配置
 * @property {Record<string, unknown>} custom 自定义配置
 *
 * @example
 * ```typescript
 * const config = new TenantConfiguration({
 *   theme: { name: 'default', primaryColor: '#007bff' },
 *   features: { enabledModules: ['user', 'tenant'] },
 *   security: { passwordPolicy: { minLength: 8 } },
 *   notifications: { email: { enabled: true } },
 *   integrations: { thirdPartyServices: {} },
 *   custom: {}
 * });
 * ```
 * @since 1.0.0
 */
export class TenantConfiguration extends ValueObject<TenantConfigurationData> {
  constructor(data: TenantConfigurationData) {
    super(data);
    this.validate();
  }

  /**
   * @method validate
   * @description 验证租户配置数据的有效性
   * @returns {void}
   * @throws {Error} 当数据无效时抛出
   * @private
   */
  private validate(): void {
    this.validateThemeConfiguration();
    this.validateFeatureConfiguration();
    this.validateSecurityConfiguration();
    this.validateNotificationConfiguration();
    this.validateIntegrationConfiguration();
  }

  /**
   * @method validateThemeConfiguration
   * @description 验证主题配置
   * @returns {void}
   * @private
   */
  private validateThemeConfiguration(): void {
    const theme = this.value.theme;

    if (!theme.name || theme.name.trim().length === 0) {
      throw new Error('主题名称不能为空');
    }

    if (!this.isValidColor(theme.primaryColor)) {
      throw new Error('主色调格式无效');
    }

    if (!this.isValidColor(theme.secondaryColor)) {
      throw new Error('次要色调格式无效');
    }

    if (!this.isValidColor(theme.backgroundColor)) {
      throw new Error('背景色格式无效');
    }

    if (!this.isValidColor(theme.textColor)) {
      throw new Error('文字颜色格式无效');
    }

    if (!['small', 'medium', 'large'].includes(theme.fontSize)) {
      throw new Error('字体大小必须是 small、medium 或 large');
    }

    if (!['compact', 'comfortable', 'spacious'].includes(theme.layout)) {
      throw new Error('布局模式必须是 compact、comfortable 或 spacious');
    }
  }

  /**
   * @method validateFeatureConfiguration
   * @description 验证功能配置
   * @returns {void}
   * @private
   */
  private validateFeatureConfiguration(): void {
    const features = this.value.features;

    if (!Array.isArray(features.enabledModules)) {
      throw new Error('启用的功能模块必须是数组');
    }

    if (!features.featureFlags || typeof features.featureFlags !== 'object') {
      throw new Error('功能开关必须是对象');
    }

    if (!features.featureLimits || typeof features.featureLimits !== 'object') {
      throw new Error('功能限制必须是对象');
    }

    if (
      !features.featurePermissions ||
      typeof features.featurePermissions !== 'object'
    ) {
      throw new Error('功能权限必须是对象');
    }
  }

  /**
   * @method validateSecurityConfiguration
   * @description 验证安全配置
   * @returns {void}
   * @private
   */
  private validateSecurityConfiguration(): void {
    const security = this.value.security;
    const passwordPolicy = security.passwordPolicy;

    if (passwordPolicy.minLength < 6) {
      throw new Error('密码最小长度不能少于6位');
    }

    if (passwordPolicy.maxLength > 128) {
      throw new Error('密码最大长度不能超过128位');
    }

    if (passwordPolicy.minLength > passwordPolicy.maxLength) {
      throw new Error('密码最小长度不能大于最大长度');
    }

    if (passwordPolicy.expirationDays < 0) {
      throw new Error('密码有效期不能为负数');
    }

    if (passwordPolicy.historyCount < 0) {
      throw new Error('密码历史记录数量不能为负数');
    }

    if (security.session.timeoutMinutes < 1) {
      throw new Error('会话超时时间不能少于1分钟');
    }

    if (security.session.maxConcurrentSessions < 1) {
      throw new Error('最大并发会话数不能少于1');
    }
  }

  /**
   * @method validateNotificationConfiguration
   * @description 验证通知配置
   * @returns {void}
   * @private
   */
  private validateNotificationConfiguration(): void {
    const notifications = this.value.notifications;

    if (notifications.email.enabled) {
      if (
        !notifications.email.smtpServer ||
        notifications.email.smtpServer.trim().length === 0
      ) {
        throw new Error('SMTP服务器不能为空');
      }

      if (
        notifications.email.smtpPort < 1 ||
        notifications.email.smtpPort > 65535
      ) {
        throw new Error('SMTP端口必须在1-65535之间');
      }

      if (
        !notifications.email.fromEmail ||
        !this.isValidEmail(notifications.email.fromEmail)
      ) {
        throw new Error('发件人邮箱格式无效');
      }
    }

    if (notifications.sms.enabled) {
      if (
        !notifications.sms.provider ||
        notifications.sms.provider.trim().length === 0
      ) {
        throw new Error('短信服务提供商不能为空');
      }

      if (
        !notifications.sms.apiKey ||
        notifications.sms.apiKey.trim().length === 0
      ) {
        throw new Error('短信API密钥不能为空');
      }
    }

    if (notifications.push.enabled) {
      if (
        !notifications.push.provider ||
        notifications.push.provider.trim().length === 0
      ) {
        throw new Error('推送服务提供商不能为空');
      }

      if (
        !notifications.push.appKey ||
        notifications.push.appKey.trim().length === 0
      ) {
        throw new Error('推送应用密钥不能为空');
      }
    }
  }

  /**
   * @method validateIntegrationConfiguration
   * @description 验证集成配置
   * @returns {void}
   * @private
   */
  private validateIntegrationConfiguration(): void {
    const integrations = this.value.integrations;

    // 验证第三方服务配置
    for (const [key, service] of Object.entries(
      integrations.thirdPartyServices,
    )) {
      if (!service.name || service.name.trim().length === 0) {
        throw new Error(`第三方服务 ${key} 的名称不能为空`);
      }
    }

    // 验证API集成配置
    for (const [key, api] of Object.entries(integrations.apiIntegrations)) {
      if (!api.name || api.name.trim().length === 0) {
        throw new Error(`API集成 ${key} 的名称不能为空`);
      }

      if (!api.baseUrl || !this.isValidUrl(api.baseUrl)) {
        throw new Error(`API集成 ${key} 的基础URL格式无效`);
      }

      if (!['none', 'basic', 'bearer', 'api-key'].includes(api.authType)) {
        throw new Error(`API集成 ${key} 的认证方式无效`);
      }

      if (api.timeout < 1000) {
        throw new Error(`API集成 ${key} 的超时时间不能少于1000毫秒`);
      }
    }

    // 验证Webhook配置
    for (const [key, webhook] of Object.entries(integrations.webhooks)) {
      if (!webhook.name || webhook.name.trim().length === 0) {
        throw new Error(`Webhook ${key} 的名称不能为空`);
      }

      if (!webhook.url || !this.isValidUrl(webhook.url)) {
        throw new Error(`Webhook ${key} 的URL格式无效`);
      }

      if (
        !['none', 'basic', 'bearer', 'signature'].includes(webhook.authType)
      ) {
        throw new Error(`Webhook ${key} 的认证方式无效`);
      }

      if (webhook.retryCount < 0) {
        throw new Error(`Webhook ${key} 的重试次数不能为负数`);
      }

      if (webhook.retryInterval < 1000) {
        throw new Error(`Webhook ${key} 的重试间隔不能少于1000毫秒`);
      }
    }
  }

  /**
   * @method isValidColor
   * @description 验证颜色格式
   * @param {string} color 颜色值
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  /**
   * @method isValidEmail
   * @description 验证邮箱格式
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * @method isValidUrl
   * @description 验证URL格式
   * @param {string} url URL地址
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method getTheme
   * @description 获取主题配置
   * @returns {ThemeConfiguration} 主题配置
   */
  get theme(): ThemeConfiguration {
    return { ...this.value.theme };
  }

  /**
   * @method getFeatures
   * @description 获取功能配置
   * @returns {FeatureConfiguration} 功能配置
   */
  get features(): FeatureConfiguration {
    return {
      enabledModules: [...this.value.features.enabledModules],
      featureFlags: { ...this.value.features.featureFlags },
      featureLimits: { ...this.value.features.featureLimits },
      featurePermissions: { ...this.value.features.featurePermissions },
    };
  }

  /**
   * @method getSecurity
   * @description 获取安全配置
   * @returns {SecurityConfiguration} 安全配置
   */
  get security(): SecurityConfiguration {
    return {
      passwordPolicy: { ...this.value.security.passwordPolicy },
      session: { ...this.value.security.session },
      accessControl: {
        ipWhitelist: [...this.value.security.accessControl.ipWhitelist],
        ipBlacklist: [...this.value.security.accessControl.ipBlacklist],
        geoRestrictions: [...this.value.security.accessControl.geoRestrictions],
        deviceRestrictions: [
          ...this.value.security.accessControl.deviceRestrictions,
        ],
      },
      audit: { ...this.value.security.audit },
    };
  }

  /**
   * @method getNotifications
   * @description 获取通知配置
   * @returns {NotificationConfiguration} 通知配置
   */
  get notifications(): NotificationConfiguration {
    return {
      email: { ...this.value.notifications.email },
      sms: { ...this.value.notifications.sms },
      push: { ...this.value.notifications.push },
      inApp: { ...this.value.notifications.inApp },
    };
  }

  /**
   * @method getIntegrations
   * @description 获取集成配置
   * @returns {IntegrationConfiguration} 集成配置
   */
  get integrations(): IntegrationConfiguration {
    return {
      thirdPartyServices: { ...this.value.integrations.thirdPartyServices },
      apiIntegrations: { ...this.value.integrations.apiIntegrations },
      webhooks: { ...this.value.integrations.webhooks },
    };
  }

  /**
   * @method getCustom
   * @description 获取自定义配置
   * @returns {Record<string, unknown>} 自定义配置
   */
  get custom(): Record<string, unknown> {
    return { ...this.value.custom };
  }

  /**
   * @method isFeatureEnabled
   * @description 检查功能是否启用
   * @param {string} feature 功能名称
   * @returns {boolean} 是否启用
   */
  isFeatureEnabled(feature: string): boolean {
    return this.value.features.enabledModules.includes(feature);
  }

  /**
   * @method isFeatureFlagEnabled
   * @description 检查功能开关是否启用
   * @param {string} flag 功能开关名称
   * @returns {boolean} 是否启用
   */
  isFeatureFlagEnabled(flag: string): boolean {
    return this.value.features.featureFlags[flag] === true;
  }

  /**
   * @method getFeatureLimit
   * @description 获取功能限制
   * @param {string} feature 功能名称
   * @returns {number} 功能限制
   */
  getFeatureLimit(feature: string): number {
    return this.value.features.featureLimits[feature] || 0;
  }

  /**
   * @method getFeaturePermissions
   * @description 获取功能权限
   * @param {string} feature 功能名称
   * @returns {string[]} 功能权限列表
   */
  getFeaturePermissions(feature: string): string[] {
    return this.value.features.featurePermissions[feature] || [];
  }

  /**
   * @method updateTheme
   * @description 更新主题配置
   * @param {Partial<ThemeConfiguration>} themeUpdate 主题更新
   * @returns {TenantConfiguration} 新的配置实例
   */
  updateTheme(themeUpdate: Partial<ThemeConfiguration>): TenantConfiguration {
    return new TenantConfiguration({
      ...this.value,
      theme: { ...this.value.theme, ...themeUpdate },
    });
  }

  /**
   * @method updateFeatures
   * @description 更新功能配置
   * @param {Partial<FeatureConfiguration>} featuresUpdate 功能更新
   * @returns {TenantConfiguration} 新的配置实例
   */
  updateFeatures(
    featuresUpdate: Partial<FeatureConfiguration>,
  ): TenantConfiguration {
    return new TenantConfiguration({
      ...this.value,
      features: { ...this.value.features, ...featuresUpdate },
    });
  }

  /**
   * @method updateSecurity
   * @description 更新安全配置
   * @param {Partial<SecurityConfiguration>} securityUpdate 安全更新
   * @returns {TenantConfiguration} 新的配置实例
   */
  updateSecurity(
    securityUpdate: Partial<SecurityConfiguration>,
  ): TenantConfiguration {
    return new TenantConfiguration({
      ...this.value,
      security: { ...this.value.security, ...securityUpdate },
    });
  }

  /**
   * @method updateCustom
   * @description 更新自定义配置
   * @param {Record<string, unknown>} customUpdate 自定义更新
   * @returns {TenantConfiguration} 新的配置实例
   */
  updateCustom(customUpdate: Record<string, unknown>): TenantConfiguration {
    return new TenantConfiguration({
      ...this.value,
      custom: { ...this.value.custom, ...customUpdate },
    });
  }
}
