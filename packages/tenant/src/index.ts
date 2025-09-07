/**
 * @fileoverview 租户管理模块
 * @description
 * 租户管理模块，提供完整的租户管理功能，包括租户创建、配置、配额管理等。
 *
 * 架构组件：
 * 1. 领域层：租户实体、聚合根、值对象、领域事件、领域服务
 * 2. 应用层：租户命令、查询、应用服务
 * 3. 基础设施层：租户仓储、数据访问对象
 * 4. 接口层：租户控制器、DTO
 *
 * 核心特性：
 * 1. 多租户数据隔离
 * 2. 租户配额管理
 * 3. 租户配置管理
 * 4. 租户状态管理
 * 5. 事件溯源支持
 *
 * @example
 * ```typescript
 * import { TenantAggregate, TenantSettings, TenantQuota } from '@aiofix/tenant';
 *
 * // 创建租户
 * const tenantAggregate = new TenantAggregate();
 * await tenantAggregate.createTenant(
 *   'tenant-123',
 *   'Acme Corp',
 *   TenantType.ENTERPRISE,
 *   tenantQuota,
 *   tenantConfiguration,
 *   'admin-456'
 * );
 * ```
 * @since 1.0.0
 */

// 导出领域层组件
export * from './domain';

// 导出应用层组件（待实现）
// export * from './application';

// 导出基础设施层组件（待实现）
// export * from './infrastructure';

// 导出接口层组件（待实现）
// export * from './interfaces';
