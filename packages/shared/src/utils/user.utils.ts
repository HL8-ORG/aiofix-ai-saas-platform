/**
 * @fileoverview 用户模块工具函数
 * @description 提供用户模块中使用的工具函数
 * @since 1.0.0
 */

import { UserId } from '../identifiers';
import { UserStatus, UserRole, UserPermission } from '../enums/user.enum';
import { UserFilters, UserPaginationOptions } from '../types/user.types';

/**
 * @function generateUserId
 * @description 生成用户ID
 * @returns {UserId} 用户ID
 * @example
 * ```typescript
 * const userId = generateUserId();
 * console.log(userId.value); // "user_1234567890abcdef"
 * ```
 */
export function generateUserId(): UserId {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return new UserId(`user_${timestamp}${random}`);
}

/**
 * @function validateUserStatus
 * @description 验证用户状态
 * @param {string} status 用户状态
 * @returns {boolean} 是否有效
 * @example
 * ```typescript
 * const isValid = validateUserStatus('ACTIVE'); // true
 * const isInvalid = validateUserStatus('INVALID'); // false
 * ```
 */
export function validateUserStatus(status: string): boolean {
  return Object.values(UserStatus).includes(status as UserStatus);
}

/**
 * @function validateUserRole
 * @description 验证用户角色
 * @param {string} role 用户角色
 * @returns {boolean} 是否有效
 * @example
 * ```typescript
 * const isValid = validateUserRole('USER'); // true
 * const isInvalid = validateUserRole('INVALID'); // false
 * ```
 */
export function validateUserRole(role: string): boolean {
  return Object.values(UserRole).includes(role as UserRole);
}

/**
 * @function validateUserPermission
 * @description 验证用户权限
 * @param {string} permission 用户权限
 * @returns {boolean} 是否有效
 * @example
 * ```typescript
 * const isValid = validateUserPermission('user:read'); // true
 * const isInvalid = validateUserPermission('invalid:permission'); // false
 * ```
 */
export function validateUserPermission(permission: string): boolean {
  return Object.values(UserPermission).includes(permission as UserPermission);
}

/**
 * @function buildUserFilters
 * @description 构建用户查询过滤器
 * @param {Partial<UserFilters>} filters 过滤器参数
 * @returns {UserFilters} 完整的过滤器对象
 * @example
 * ```typescript
 * const filters = buildUserFilters({
 *   status: UserStatus.ACTIVE,
 *   searchTerm: 'john'
 * });
 * ```
 */
export function buildUserFilters(filters: Partial<UserFilters>): UserFilters {
  return {
    email: filters.email,
    status: filters.status,
    role: filters.role,
    createdAtRange: filters.createdAtRange,
    updatedAtRange: filters.updatedAtRange,
    searchTerm: filters.searchTerm,
  };
}

/**
 * @function buildPaginationOptions
 * @description 构建分页选项
 * @param {Partial<UserPaginationOptions>} options 分页参数
 * @returns {UserPaginationOptions} 完整的分页选项对象
 * @example
 * ```typescript
 * const pagination = buildPaginationOptions({
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'createdAt',
 *   sortOrder: 'DESC'
 * });
 * ```
 */
export function buildPaginationOptions(
  options: Partial<UserPaginationOptions>,
): UserPaginationOptions {
  return {
    page: options.page || 1,
    limit: options.limit || 20,
    sortBy: options.sortBy || 'createdAt',
    sortOrder: options.sortOrder || 'DESC',
  };
}

/**
 * @function calculatePagination
 * @description 计算分页信息
 * @param {number} total 总数量
 * @param {number} page 当前页码
 * @param {number} limit 每页数量
 * @returns {object} 分页信息
 * @example
 * ```typescript
 * const pagination = calculatePagination(100, 1, 20);
 * // { totalPages: 5, hasNext: true, hasPrev: false }
 * ```
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number,
): {
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    totalPages,
    hasNext,
    hasPrev,
  };
}

/**
 * @function sanitizeUserData
 * @description 清理用户数据，移除敏感信息
 * @param {any} userData 用户数据
 * @returns {any} 清理后的用户数据
 * @example
 * ```typescript
 * const sanitized = sanitizeUserData(userData);
 * // 移除密码等敏感信息
 * ```
 */
export function sanitizeUserData(userData: any): any {
  if (!userData || typeof userData !== 'object') {
    return userData;
  }

  const sensitiveFields = [
    'password',
    'passwordHash',
    'passwordSalt',
    'refreshToken',
    'accessToken',
    'secretKey',
    'privateKey',
  ];

  const sanitized = { ...userData };

  sensitiveFields.forEach(field => {
    if (field in sanitized) {
      delete sanitized[field];
    }
  });

  return sanitized;
}

/**
 * @function formatUserDisplayName
 * @description 格式化用户显示名称
 * @param {string} firstName 名字
 * @param {string} lastName 姓氏
 * @param {string} email 邮箱
 * @returns {string} 格式化后的显示名称
 * @example
 * ```typescript
 * const displayName = formatUserDisplayName('John', 'Doe', 'john@example.com');
 * // "John Doe" 或 "john@example.com"
 * ```
 */
export function formatUserDisplayName(
  firstName?: string,
  lastName?: string,
  email?: string,
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  if (lastName) {
    return lastName;
  }

  return email || 'Unknown User';
}

/**
 * @function generateUserAvatarUrl
 * @description 生成用户头像URL
 * @param {UserId} userId 用户ID
 * @param {string} [baseUrl] 基础URL
 * @returns {string} 头像URL
 * @example
 * ```typescript
 * const avatarUrl = generateUserAvatarUrl(userId, 'https://api.example.com');
 * // "https://api.example.com/avatars/user_1234567890abcdef"
 * ```
 */
export function generateUserAvatarUrl(
  userId: UserId,
  baseUrl: string = 'https://api.example.com',
): string {
  return `${baseUrl}/avatars/${userId.value}`;
}

/**
 * @function validateUserEmail
 * @description 验证用户邮箱格式
 * @param {string} email 邮箱地址
 * @returns {boolean} 是否有效
 * @example
 * ```typescript
 * const isValid = validateUserEmail('user@example.com'); // true
 * const isInvalid = validateUserEmail('invalid-email'); // false
 * ```
 */
export function validateUserEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * @function validateUserPassword
 * @description 验证用户密码强度
 * @param {string} password 密码
 * @returns {object} 验证结果
 * @example
 * ```typescript
 * const result = validateUserPassword('MyPassword123!');
 * // { isValid: true, score: 4, feedback: [] }
 * ```
 */
export function validateUserPassword(password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // 长度检查
  if (password.length < 8) {
    feedback.push('密码长度至少8位');
  } else {
    score += 1;
  }

  // 包含小写字母
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码应包含小写字母');
  }

  // 包含大写字母
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码应包含大写字母');
  }

  // 包含数字
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码应包含数字');
  }

  // 包含特殊字符
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('密码应包含特殊字符');
  }

  return {
    isValid: score >= 3,
    score,
    feedback,
  };
}

/**
 * @function generateUserSearchQuery
 * @description 生成用户搜索查询
 * @param {string} searchTerm 搜索关键词
 * @returns {object} 搜索查询对象
 * @example
 * ```typescript
 * const query = generateUserSearchQuery('john doe');
 * // { $or: [{ firstName: /john/i }, { lastName: /doe/i }, { email: /john/i }] }
 * ```
 */
export function generateUserSearchQuery(
  searchTerm: string,
): Record<string, unknown> {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return {};
  }

  const terms = searchTerm.trim().split(/\s+/);
  const searchConditions: Record<string, unknown>[] = [];

  terms.forEach(term => {
    const regex = new RegExp(term, 'i');
    searchConditions.push(
      { firstName: regex },
      { lastName: regex },
      { email: regex },
    );
  });

  return {
    $or: searchConditions,
  };
}

/**
 * @function sortUserRoles
 * @description 对用户角色进行排序
 * @param {UserRole[]} roles 角色列表
 * @returns {UserRole[]} 排序后的角色列表
 * @example
 * ```typescript
 * const sortedRoles = sortUserRoles([UserRole.USER, UserRole.ADMIN]);
 * // [UserRole.ADMIN, UserRole.USER]
 * ```
 */
export function sortUserRoles(roles: UserRole[]): UserRole[] {
  const roleOrder = {
    [UserRole.PLATFORM_ADMIN]: 1,
    [UserRole.TENANT_ADMIN]: 2,
    [UserRole.ORGANIZATION_ADMIN]: 3,
    [UserRole.DEPARTMENT_ADMIN]: 4,
    [UserRole.PERSONAL_USER]: 5,
  };

  return roles.sort((a, b) => {
    const orderA = roleOrder[a] || 999;
    const orderB = roleOrder[b] || 999;
    return orderA - orderB;
  });
}

/**
 * @function sortUserPermissions
 * @description 对用户权限进行排序
 * @param {UserPermission[]} permissions 权限列表
 * @returns {UserPermission[]} 排序后的权限列表
 * @example
 * ```typescript
 * const sortedPermissions = sortUserPermissions([UserPermission.USER_READ, UserPermission.USER_CREATE]);
 * // 按权限名称排序
 * ```
 */
export function sortUserPermissions(
  permissions: UserPermission[],
): UserPermission[] {
  return permissions.sort((a, b) => a.localeCompare(b));
}
