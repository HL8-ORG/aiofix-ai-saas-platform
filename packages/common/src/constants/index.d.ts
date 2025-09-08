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
export declare const HTTP_STATUS: {
    readonly OK: 200;
    readonly CREATED: 201;
    readonly NO_CONTENT: 204;
    readonly BAD_REQUEST: 400;
    readonly UNAUTHORIZED: 401;
    readonly FORBIDDEN: 403;
    readonly NOT_FOUND: 404;
    readonly CONFLICT: 409;
    readonly UNPROCESSABLE_ENTITY: 422;
    readonly INTERNAL_SERVER_ERROR: 500;
    readonly SERVICE_UNAVAILABLE: 503;
};
/**
 * 用户角色常量
 *
 * 定义系统中的8种基础角色，对应业务需求文档中的角色定义。
 */
export declare const USER_ROLES: {
    readonly PLATFORM_ADMIN: "platform_admin";
    readonly TENANT_ADMIN: "tenant_admin";
    readonly ORGANIZATION_ADMIN: "organization_admin";
    readonly DEPARTMENT_ADMIN: "department_admin";
    readonly PERSONAL_USER: "personal_user";
    readonly TENANT_USER: "tenant_user";
    readonly SYSTEM_ADMIN: "system_admin";
    readonly SERVICE_ACCOUNT: "service_account";
};
/**
 * 权限常量
 *
 * 定义基础的CRUD权限操作。
 */
export declare const PERMISSIONS: {
    readonly CREATE: "create";
    readonly READ: "read";
    readonly UPDATE: "update";
    readonly DELETE: "delete";
    readonly MANAGE: "manage";
    readonly EXECUTE: "execute";
};
/**
 * 数据隔离级别常量
 *
 * 定义多租户数据隔离的五个层级。
 */
export declare const ISOLATION_LEVELS: {
    readonly PLATFORM: "platform";
    readonly TENANT: "tenant";
    readonly ORGANIZATION: "organization";
    readonly DEPARTMENT: "department";
    readonly USER: "user";
};
/**
 * 用户状态常量
 *
 * 定义用户的各种状态。
 */
export declare const USER_STATUS: {
    readonly ACTIVE: "active";
    readonly INACTIVE: "inactive";
    readonly PENDING: "pending";
    readonly LOCKED: "locked";
    readonly EXPIRED: "expired";
};
/**
 * 租户类型常量
 *
 * 定义支持的租户类型。
 */
export declare const TENANT_TYPES: {
    readonly ENTERPRISE: "enterprise";
    readonly COMMUNITY: "community";
    readonly TEAM: "team";
    readonly PERSONAL: "personal";
};
/**
 * 组织类型常量
 *
 * 定义组织架构中的组织类型。
 */
export declare const ORGANIZATION_TYPES: {
    readonly COMMITTEE: "committee";
    readonly PROJECT_TEAM: "project_team";
    readonly QUALITY_CONTROL: "quality_control";
    readonly PERFORMANCE_MANAGEMENT: "performance_management";
    readonly OTHER: "other";
};
/**
 * 事件类型常量
 *
 * 定义系统事件的类型。
 */
export declare const EVENT_TYPES: {
    readonly USER_CREATED: "user_created";
    readonly USER_UPDATED: "user_updated";
    readonly USER_DELETED: "user_deleted";
    readonly TENANT_CREATED: "tenant_created";
    readonly TENANT_UPDATED: "tenant_updated";
    readonly TENANT_DELETED: "tenant_deleted";
    readonly ORGANIZATION_CREATED: "organization_created";
    readonly ORGANIZATION_UPDATED: "organization_updated";
    readonly ORGANIZATION_DELETED: "organization_deleted";
    readonly DEPARTMENT_CREATED: "department_created";
    readonly DEPARTMENT_UPDATED: "department_updated";
    readonly DEPARTMENT_DELETED: "department_deleted";
};
/**
 * 错误代码常量
 *
 * 定义系统错误代码。
 */
export declare const ERROR_CODES: {
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly NOT_FOUND: "NOT_FOUND";
    readonly UNAUTHORIZED: "UNAUTHORIZED";
    readonly FORBIDDEN: "FORBIDDEN";
    readonly CONFLICT: "CONFLICT";
    readonly USER_NOT_FOUND: "USER_NOT_FOUND";
    readonly USER_ALREADY_EXISTS: "USER_ALREADY_EXISTS";
    readonly TENANT_NOT_FOUND: "TENANT_NOT_FOUND";
    readonly TENANT_ALREADY_EXISTS: "TENANT_ALREADY_EXISTS";
    readonly ORGANIZATION_NOT_FOUND: "ORGANIZATION_NOT_FOUND";
    readonly DEPARTMENT_NOT_FOUND: "DEPARTMENT_NOT_FOUND";
    readonly INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS";
    readonly ROLE_NOT_FOUND: "ROLE_NOT_FOUND";
    readonly PERMISSION_NOT_FOUND: "PERMISSION_NOT_FOUND";
    readonly DATA_ISOLATION_VIOLATION: "DATA_ISOLATION_VIOLATION";
    readonly CROSS_TENANT_ACCESS: "CROSS_TENANT_ACCESS";
};
/**
 * 缓存键前缀常量
 *
 * 定义缓存键的前缀，用于缓存管理。
 */
export declare const CACHE_PREFIXES: {
    readonly USER: "user:";
    readonly TENANT: "tenant:";
    readonly ORGANIZATION: "organization:";
    readonly DEPARTMENT: "department:";
    readonly ROLE: "role:";
    readonly PERMISSION: "permission:";
    readonly SESSION: "session:";
    readonly TOKEN: "token:";
};
/**
 * 分页常量
 *
 * 定义分页相关的默认值。
 */
export declare const PAGINATION: {
    readonly DEFAULT_PAGE: 1;
    readonly DEFAULT_LIMIT: 20;
    readonly MAX_LIMIT: 100;
    readonly MIN_LIMIT: 1;
};
/**
 * 排序常量
 *
 * 定义排序相关的常量。
 */
export declare const SORT_ORDER: {
    readonly ASC: "ASC";
    readonly DESC: "DESC";
};
/**
 * 时间常量
 *
 * 定义时间相关的常量。
 */
export declare const TIME_CONSTANTS: {
    readonly SECOND: 1000;
    readonly MINUTE: number;
    readonly HOUR: number;
    readonly DAY: number;
    readonly WEEK: number;
    readonly MONTH: number;
    readonly YEAR: number;
};
/**
 * 正则表达式常量
 *
 * 定义常用的正则表达式。
 */
export declare const REGEX_PATTERNS: {
    readonly EMAIL: RegExp;
    readonly PHONE: RegExp;
    readonly UUID: RegExp;
    readonly STRONG_PASSWORD: RegExp;
};
//# sourceMappingURL=index.d.ts.map