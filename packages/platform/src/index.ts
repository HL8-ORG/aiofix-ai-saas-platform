// 值对象导出
// 注意：已删除无意义的平台自身配置值对象
// 平台是服务提供者，不是可配置的实例对象
export {
  TenantQuota,
  type TenantQuotaData,
} from './domain/value-objects/tenant-quota.vo';
export {
  SystemConfiguration,
  type SystemConfigurationData,
} from './domain/value-objects/system-configuration.vo';
export {
  SystemMetrics,
  type SystemMetricsData,
} from './domain/value-objects/system-metrics.vo';

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

// 领域服务导出
export {
  PlatformManagementService,
  type CreateTenantData,
  type TenantUpdates,
  type SystemCapacity,
} from './domain/services/platform-management.service';
export {
  PlatformUserManagementService,
  type UserAssignmentData,
  type UserEligibilityCheck,
  type TenantCapacityCheck,
} from './domain/services/platform-user-management.service';

// 领域事件导出
// 租户管理事件
export { TenantCreatedEvent } from './domain/events/tenant-created.event';
export { TenantUpdatedEvent } from './domain/events/tenant-updated.event';
export { TenantDeletedEvent } from './domain/events/tenant-deleted.event';

// 用户管理事件
export { PlatformUserAssignedEvent } from './domain/events/platform-user-assigned.event';

// 系统监控事件
export { SystemMetricsRecordedEvent } from './domain/events/system-metrics-recorded.event';

// 系统配置事件
export { SystemConfigurationUpdatedEvent } from './domain/events/system-configuration-updated.event';

// 注意：已删除无意义的平台自身事件
// 平台是服务提供者，不是可创建、更新、删除的实例对象

// 类型导出
// 注意：已删除无意义的平台自身配置类型
// 平台是服务提供者，不是可配置的实例对象
