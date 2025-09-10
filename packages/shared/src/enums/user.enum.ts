/**
 * @fileoverview 用户相关枚举定义
 * @description 定义用户模块中使用的枚举
 * @since 1.0.0
 */

/**
 * 用户状态枚举
 */
export enum UserStatus {
  /** 待激活 */
  PENDING = 'PENDING',
  /** 已激活 */
  ACTIVE = 'ACTIVE',
  /** 已禁用 */
  DISABLED = 'DISABLED',
  /** 已删除 */
  DELETED = 'DELETED',
}

/**
 * 用户角色枚举
 */
export enum UserRole {
  /** 个人用户 */
  PERSONAL_USER = 'PERSONAL_USER',
  /** 租户管理员 */
  TENANT_ADMIN = 'TENANT_ADMIN',
  /** 组织管理员 */
  ORGANIZATION_ADMIN = 'ORGANIZATION_ADMIN',
  /** 部门管理员 */
  DEPARTMENT_ADMIN = 'DEPARTMENT_ADMIN',
  /** 平台管理员 */
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

/**
 * 用户权限枚举
 */
export enum UserPermission {
  // 用户管理权限
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_LIST = 'user:list',

  // 用户资料权限
  USER_PROFILE_READ = 'user:profile:read',
  USER_PROFILE_UPDATE = 'user:profile:update',

  // 用户密码权限
  USER_PASSWORD_UPDATE = 'user:password:update',
  USER_PASSWORD_RESET = 'user:password:reset',

  // 用户角色权限
  USER_ROLE_ASSIGN = 'user:role:assign',
  USER_ROLE_REVOKE = 'user:role:revoke',

  // 用户权限管理
  USER_PERMISSION_GRANT = 'user:permission:grant',
  USER_PERMISSION_REVOKE = 'user:permission:revoke',

  // 租户管理权限
  TENANT_READ = 'tenant:read',
  TENANT_CREATE = 'tenant:create',
  TENANT_UPDATE = 'tenant:update',
  TENANT_DELETE = 'tenant:delete',

  // 组织管理权限
  ORGANIZATION_READ = 'organization:read',
  ORGANIZATION_CREATE = 'organization:create',
  ORGANIZATION_UPDATE = 'organization:update',
  ORGANIZATION_DELETE = 'organization:delete',

  // 部门管理权限
  DEPARTMENT_READ = 'department:read',
  DEPARTMENT_CREATE = 'department:create',
  DEPARTMENT_UPDATE = 'department:update',
  DEPARTMENT_DELETE = 'department:delete',

  // 平台管理权限
  PLATFORM_READ = 'platform:read',
  PLATFORM_CREATE = 'platform:create',
  PLATFORM_UPDATE = 'platform:update',
  PLATFORM_DELETE = 'platform:delete',
}

/**
 * 用户事件类型枚举
 */
export enum UserEventType {
  /** 用户创建事件 */
  USER_CREATED = 'UserCreated',
  /** 用户更新事件 */
  USER_UPDATED = 'UserUpdated',
  /** 用户删除事件 */
  USER_DELETED = 'UserDeleted',
  /** 用户激活事件 */
  USER_ACTIVATED = 'UserActivated',
  /** 用户禁用事件 */
  USER_DEACTIVATED = 'UserDeactivated',
  /** 用户资料更新事件 */
  USER_PROFILE_UPDATED = 'UserProfileUpdated',
  /** 用户密码更新事件 */
  USER_PASSWORD_UPDATED = 'UserPasswordUpdated',
  /** 用户角色分配事件 */
  USER_ROLE_ASSIGNED = 'UserRoleAssigned',
  /** 用户角色撤销事件 */
  USER_ROLE_REVOKED = 'UserRoleRevoked',
  /** 用户权限授予事件 */
  USER_PERMISSION_GRANTED = 'UserPermissionGranted',
  /** 用户权限撤销事件 */
  USER_PERMISSION_REVOKED = 'UserPermissionRevoked',
}

/**
 * 用户命令类型枚举
 */
export enum UserCommandType {
  /** 创建用户命令 */
  CREATE_USER = 'CreateUser',
  /** 更新用户命令 */
  UPDATE_USER = 'UpdateUser',
  /** 删除用户命令 */
  DELETE_USER = 'DeleteUser',
  /** 激活用户命令 */
  ACTIVATE_USER = 'ActivateUser',
  /** 禁用用户命令 */
  DEACTIVATE_USER = 'DeactivateUser',
  /** 更新用户资料命令 */
  UPDATE_USER_PROFILE = 'UpdateUserProfile',
  /** 更新用户密码命令 */
  UPDATE_USER_PASSWORD = 'UpdateUserPassword',
  /** 分配用户角色命令 */
  ASSIGN_USER_ROLE = 'AssignUserRole',
  /** 撤销用户角色命令 */
  REVOKE_USER_ROLE = 'RevokeUserRole',
  /** 授予用户权限命令 */
  GRANT_USER_PERMISSION = 'GrantUserPermission',
  /** 撤销用户权限命令 */
  REVOKE_USER_PERMISSION = 'RevokeUserPermission',
}

/**
 * 用户查询类型枚举
 */
export enum UserQueryType {
  /** 获取用户查询 */
  GET_USER = 'GetUser',
  /** 获取用户列表查询 */
  GET_USERS = 'GetUsers',
  /** 获取用户资料查询 */
  GET_USER_PROFILE = 'GetUserProfile',
  /** 获取用户角色查询 */
  GET_USER_ROLES = 'GetUserRoles',
  /** 获取用户权限查询 */
  GET_USER_PERMISSIONS = 'GetUserPermissions',
  /** 搜索用户查询 */
  SEARCH_USERS = 'SearchUsers',
  /** 获取用户统计查询 */
  GET_USER_STATISTICS = 'GetUserStatistics',
}
