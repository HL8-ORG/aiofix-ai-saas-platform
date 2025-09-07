// 值对象导出
export { PlatformId } from './domain/value-objects/platform-id.vo';
export { PlatformConfig } from './domain/value-objects/platform-config.vo';
export { PlatformSettings } from './domain/value-objects/platform-settings.vo';

// 枚举导出
export {
  PlatformStatus,
  PLATFORM_STATUS_LABELS,
  isPlatformAccessible,
  isRegistrationAllowed,
} from './domain/enums/platform-status.enum';
export {
  PlatformConfigType,
  PLATFORM_CONFIG_TYPE_LABELS,
  requiresRestart,
  requiresAudit,
} from './domain/enums/platform-config-type.enum';

// 聚合根导出
export { PlatformAggregate } from './domain/aggregates/platform.aggregate';

// 领域事件导出
export { PlatformCreatedEvent } from './domain/events/platform-created.event';
export { PlatformUpdatedEvent } from './domain/events/platform-updated.event';
export { PlatformStatusChangedEvent } from './domain/events/platform-status-changed.event';
export { PlatformConfigUpdatedEvent } from './domain/events/platform-config-updated.event';

// 类型导出
export type { PlatformConfigData } from './domain/value-objects/platform-config.vo';
export type { PlatformSettingsData } from './domain/value-objects/platform-settings.vo';
export type { PlatformData } from './domain/aggregates/platform.aggregate';
