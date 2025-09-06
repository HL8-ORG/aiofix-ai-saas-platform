/**
 * 常量定义
 *
 * 定义系统中使用的各种常量，包括HTTP状态码、用户角色、权限等。
 * 使用const断言确保常量的不可变性。
 *
 * @fileoverview 系统常量定义
 * @author AI开发团队
 * @since 1.0.0
 */

/**
 * HTTP状态码常量
 *
 * 定义常用的HTTP状态码，用于API响应。
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * 用户角色常量
 *
 * 定义系统中的8种基础角色，对应业务需求文档中的角色定义。
 */
export const USER_ROLES = {
  // 平台级角色
  PLATFORM_ADMIN: 'platform_admin',

  // 租户级角色
  TENANT_ADMIN: 'tenant_admin',

  // 组织级角色
  ORGANIZATION_ADMIN: 'organization_admin',

  // 部门级角色
  DEPARTMENT_ADMIN: 'department_admin',

  // 普通用户角色
  PERSONAL_USER: 'personal_user',
  TENANT_USER: 'tenant_user',

  // 系统级角色
  SYSTEM_ADMIN: 'system_admin',
  SERVICE_ACCOUNT: 'service_account',
} as const;

/**
 * 权限常量
 *
 * 定义基础的CRUD权限操作。
 */
export const PERMISSIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
  EXECUTE: 'execute',
} as const;

/**
 * 数据隔离级别常量
 *
 * 定义多租户数据隔离的五个层级。
 */
export const ISOLATION_LEVELS = {
  PLATFORM: 'platform',
  TENANT: 'tenant',
  ORGANIZATION: 'organization',
  DEPARTMENT: 'department',
  USER: 'user',
} as const;

/**
 * 用户状态常量
 *
 * 定义用户的各种状态。
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  LOCKED: 'locked',
  EXPIRED: 'expired',
} as const;

/**
 * 租户类型常量
 *
 * 定义支持的租户类型。
 */
export const TENANT_TYPES = {
  ENTERPRISE: 'enterprise',
  COMMUNITY: 'community',
  TEAM: 'team',
  PERSONAL: 'personal',
} as const;

/**
 * 组织类型常量
 *
 * 定义组织架构中的组织类型。
 */
export const ORGANIZATION_TYPES = {
  COMMITTEE: 'committee',
  PROJECT_TEAM: 'project_team',
  QUALITY_CONTROL: 'quality_control',
  PERFORMANCE_MANAGEMENT: 'performance_management',
  OTHER: 'other',
} as const;

/**
 * 事件类型常量
 *
 * 定义系统事件的类型。
 */
export const EVENT_TYPES = {
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  TENANT_CREATED: 'tenant_created',
  TENANT_UPDATED: 'tenant_updated',
  TENANT_DELETED: 'tenant_deleted',
  ORGANIZATION_CREATED: 'organization_created',
  ORGANIZATION_UPDATED: 'organization_updated',
  ORGANIZATION_DELETED: 'organization_deleted',
  DEPARTMENT_CREATED: 'department_created',
  DEPARTMENT_UPDATED: 'department_updated',
  DEPARTMENT_DELETED: 'department_deleted',
} as const;

/**
 * 错误代码常量
 *
 * 定义系统错误代码。
 */
export const ERROR_CODES = {
  // 通用错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',

  // 业务错误
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_ALREADY_EXISTS: 'TENANT_ALREADY_EXISTS',
  ORGANIZATION_NOT_FOUND: 'ORGANIZATION_NOT_FOUND',
  DEPARTMENT_NOT_FOUND: 'DEPARTMENT_NOT_FOUND',

  // 权限错误
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  PERMISSION_NOT_FOUND: 'PERMISSION_NOT_FOUND',

  // 数据隔离错误
  DATA_ISOLATION_VIOLATION: 'DATA_ISOLATION_VIOLATION',
  CROSS_TENANT_ACCESS: 'CROSS_TENANT_ACCESS',
} as const;

/**
 * 缓存键前缀常量
 *
 * 定义缓存键的前缀，用于缓存管理。
 */
export const CACHE_PREFIXES = {
  USER: 'user:',
  TENANT: 'tenant:',
  ORGANIZATION: 'organization:',
  DEPARTMENT: 'department:',
  ROLE: 'role:',
  PERMISSION: 'permission:',
  SESSION: 'session:',
  TOKEN: 'token:',
} as const;

/**
 * 分页常量
 *
 * 定义分页相关的默认值。
 */
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

/**
 * 排序常量
 *
 * 定义排序相关的常量。
 */
export const SORT_ORDER = {
  ASC: 'ASC',
  DESC: 'DESC',
} as const;

/**
 * 时间常量
 *
 * 定义时间相关的常量。
 */
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
} as const;

/**
 * 正则表达式常量
 *
 * 定义常用的正则表达式。
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  STRONG_PASSWORD:
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
} as const;
