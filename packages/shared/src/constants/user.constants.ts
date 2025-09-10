/**
 * @fileoverview 用户模块常量定义
 * @description 定义用户模块中使用的常量
 * @since 1.0.0
 */

/**
 * 用户配置常量
 */
export const USER_CONFIG = {
  /** 默认密码最小长度 */
  MIN_PASSWORD_LENGTH: 8,
  /** 默认密码最大长度 */
  MAX_PASSWORD_LENGTH: 128,
  /** 默认用户名最小长度 */
  MIN_USERNAME_LENGTH: 3,
  /** 默认用户名最大长度 */
  MAX_USERNAME_LENGTH: 50,
  /** 默认邮箱最大长度 */
  MAX_EMAIL_LENGTH: 255,
  /** 默认名字最大长度 */
  MAX_FIRST_NAME_LENGTH: 50,
  /** 默认姓氏最大长度 */
  MAX_LAST_NAME_LENGTH: 50,
  /** 默认电话号码最大长度 */
  MAX_PHONE_LENGTH: 20,
  /** 默认头像URL最大长度 */
  MAX_AVATAR_URL_LENGTH: 500,
  /** 默认用户描述最大长度 */
  MAX_DESCRIPTION_LENGTH: 1000,
} as const;

/**
 * 用户缓存常量
 */
export const USER_CACHE = {
  /** 用户信息缓存TTL（秒） */
  USER_INFO_TTL: 300,
  /** 用户权限缓存TTL（秒） */
  USER_PERMISSIONS_TTL: 600,
  /** 用户角色缓存TTL（秒） */
  USER_ROLES_TTL: 600,
  /** 用户列表缓存TTL（秒） */
  USER_LIST_TTL: 180,
  /** 用户统计缓存TTL（秒） */
  USER_STATISTICS_TTL: 900,
} as const;

/**
 * 用户事件常量
 */
export const USER_EVENTS = {
  /** 用户创建事件 */
  USER_CREATED: 'user.created',
  /** 用户更新事件 */
  USER_UPDATED: 'user.updated',
  /** 用户删除事件 */
  USER_DELETED: 'user.deleted',
  /** 用户激活事件 */
  USER_ACTIVATED: 'user.activated',
  /** 用户禁用事件 */
  USER_DEACTIVATED: 'user.deactivated',
  /** 用户资料更新事件 */
  USER_PROFILE_UPDATED: 'user.profile.updated',
  /** 用户密码更新事件 */
  USER_PASSWORD_UPDATED: 'user.password.updated',
  /** 用户角色分配事件 */
  USER_ROLE_ASSIGNED: 'user.role.assigned',
  /** 用户角色撤销事件 */
  USER_ROLE_REVOKED: 'user.role.revoked',
  /** 用户权限授予事件 */
  USER_PERMISSION_GRANTED: 'user.permission.granted',
  /** 用户权限撤销事件 */
  USER_PERMISSION_REVOKED: 'user.permission.revoked',
} as const;

/**
 * 用户错误常量
 */
export const USER_ERRORS = {
  /** 用户不存在 */
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  /** 用户已存在 */
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  /** 用户邮箱已存在 */
  USER_EMAIL_ALREADY_EXISTS: 'USER_EMAIL_ALREADY_EXISTS',
  /** 用户状态无效 */
  USER_STATUS_INVALID: 'USER_STATUS_INVALID',
  /** 用户密码无效 */
  USER_PASSWORD_INVALID: 'USER_PASSWORD_INVALID',
  /** 用户权限不足 */
  USER_PERMISSION_DENIED: 'USER_PERMISSION_DENIED',
  /** 用户角色无效 */
  USER_ROLE_INVALID: 'USER_ROLE_INVALID',
  /** 用户资料无效 */
  USER_PROFILE_INVALID: 'USER_PROFILE_INVALID',
  /** 用户操作失败 */
  USER_OPERATION_FAILED: 'USER_OPERATION_FAILED',
} as const;
