// 租户值对象导出 - TenantId现在来自@aiofix/shared
export { TenantSettings, TenantType, TenantStatus } from './tenant-settings.vo';
export { TenantQuota, QuotaType } from './tenant-quota.vo';
export { TenantConfiguration } from './tenant-configuration.vo';

// 导出类型定义
export type { TenantSettingsData } from './tenant-settings.vo';
export type { TenantQuotaData } from './tenant-quota.vo';
export type { TenantConfigurationData } from './tenant-configuration.vo';
export type { ThemeConfiguration } from './tenant-configuration.vo';
export type { FeatureConfiguration } from './tenant-configuration.vo';
export type { SecurityConfiguration } from './tenant-configuration.vo';
export type { NotificationConfiguration } from './tenant-configuration.vo';
export type { IntegrationConfiguration } from './tenant-configuration.vo';
