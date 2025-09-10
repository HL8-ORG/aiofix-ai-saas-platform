import { SetMetadata } from '@nestjs/common';

/**
 * @constant TENANT_KEY
 * @description 租户元数据键
 */
export const TENANT_KEY = 'tenant';

/**
 * @constant TENANT_REQUIRED_KEY
 * @description 租户必需元数据键
 */
export const TENANT_REQUIRED_KEY = 'tenant_required';

/**
 * @function RequireTenant
 * @description
 * 租户装饰器，用于指定访问控制器或方法所需的租户上下文。
 *
 * 装饰器功能：
 * 1. 指定访问所需的租户上下文
 * 2. 支持租户级权限控制
 * 3. 与TenantGuard配合使用
 * 4. 实现多租户数据隔离
 *
 * 租户验证：
 * 1. 检查请求中的租户信息
 * 2. 验证用户租户关联
 * 3. 检查租户状态和权限
 * 4. 设置租户上下文
 *
 * @param {boolean} required 是否必需租户上下文，默认为true
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @RequireTenant()
 * export class UserController {
 *   @Get()
 *   @RequireTenant(true)
 *   async getUsers() {}
 *
 *   @Post()
 *   @RequireTenant(false)
 *   async createUser() {}
 * }
 * ```
 * @since 1.0.0
 */
export const RequireTenant = (required: boolean = true) =>
  SetMetadata(TENANT_REQUIRED_KEY, required);

/**
 * @function TenantContext
 * @description
 * 租户上下文装饰器，用于指定租户相关的配置信息。
 *
 * 装饰器功能：
 * 1. 指定租户上下文配置
 * 2. 支持租户级数据隔离策略
 * 3. 配置租户级权限控制
 * 4. 设置租户级缓存策略
 *
 * @param {TenantConfig} config 租户配置
 * @returns {MethodDecorator & ClassDecorator} 装饰器函数
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @TenantContext({
 *   isolationStrategy: 'TABLE_LEVEL',
 *   cacheEnabled: true,
 *   auditEnabled: true
 * })
 * export class UserController {}
 * ```
 * @since 1.0.0
 */
export const TenantContext = (config: TenantConfig) =>
  SetMetadata(TENANT_KEY, config);

/**
 * 租户配置接口
 */
export interface TenantConfig {
  /** 数据隔离策略 */
  isolationStrategy?: 'DATABASE_LEVEL' | 'SCHEMA_LEVEL' | 'TABLE_LEVEL';
  /** 是否启用缓存 */
  cacheEnabled?: boolean;
  /** 是否启用审计 */
  auditEnabled?: boolean;
  /** 是否启用性能监控 */
  performanceMonitoring?: boolean;
  /** 租户级权限控制 */
  permissionControl?: boolean;
  /** 数据加密策略 */
  encryptionStrategy?: 'NONE' | 'FIELD_LEVEL' | 'ROW_LEVEL';
}
