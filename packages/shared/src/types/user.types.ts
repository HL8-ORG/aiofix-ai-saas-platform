/**
 * @fileoverview 用户模块类型定义
 * @description 定义用户模块中使用的类型
 * @since 1.0.0
 */

import { UserId } from '../identifiers';
import { Email, PhoneNumber } from '../common';
import { UserStatus, UserRole, UserPermission } from '../enums/user.enum';

/**
 * 用户基本信息接口
 */
export interface UserBasicInfo {
  /** 用户ID */
  id: UserId;
  /** 用户邮箱 */
  email: Email;
  /** 用户状态 */
  status: UserStatus;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 用户资料接口
 */
export interface UserProfile {
  /** 用户ID */
  userId: UserId;
  /** 名字 */
  firstName: string;
  /** 姓氏 */
  lastName: string;
  /** 电话号码 */
  phoneNumber?: PhoneNumber;
  /** 头像URL */
  avatar?: string;
  /** 个人描述 */
  description?: string;
  /** 时区 */
  timezone?: string;
  /** 语言 */
  language?: string;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 用户偏好设置接口
 */
export interface UserPreferences {
  /** 用户ID */
  userId: UserId;
  /** 通知偏好 */
  notifications: NotificationPreferences;
  /** 隐私设置 */
  privacy: PrivacySettings;
  /** 界面设置 */
  ui: UISettings;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 通知偏好设置接口
 */
export interface NotificationPreferences {
  /** 邮件通知 */
  email: boolean;
  /** 短信通知 */
  sms: boolean;
  /** 推送通知 */
  push: boolean;
  /** 系统通知 */
  system: boolean;
  /** 营销通知 */
  marketing: boolean;
}

/**
 * 隐私设置接口
 */
export interface PrivacySettings {
  /** 个人资料可见性 */
  profileVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  /** 在线状态可见性 */
  onlineStatusVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  /** 活动状态可见性 */
  activityVisibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
  /** 数据共享设置 */
  dataSharing: boolean;
}

/**
 * 界面设置接口
 */
export interface UISettings {
  /** 主题 */
  theme: 'LIGHT' | 'DARK' | 'AUTO';
  /** 语言 */
  language: string;
  /** 时区 */
  timezone: string;
  /** 日期格式 */
  dateFormat: string;
  /** 时间格式 */
  timeFormat: '12H' | '24H';
}

/**
 * 用户角色信息接口
 */
export interface UserRoleInfo {
  /** 用户ID */
  userId: UserId;
  /** 角色 */
  role: UserRole;
  /** 分配时间 */
  assignedAt: Date;
  /** 分配者ID */
  assignedBy: UserId;
  /** 过期时间 */
  expiresAt?: Date;
}

/**
 * 用户权限信息接口
 */
export interface UserPermissionInfo {
  /** 用户ID */
  userId: UserId;
  /** 权限 */
  permission: UserPermission;
  /** 授予时间 */
  grantedAt: Date;
  /** 授予者ID */
  grantedBy: UserId;
  /** 过期时间 */
  expiresAt?: Date;
}

/**
 * 用户统计信息接口
 */
export interface UserStatistics {
  /** 总用户数 */
  totalUsers: number;
  /** 活跃用户数 */
  activeUsers: number;
  /** 待激活用户数 */
  pendingUsers: number;
  /** 禁用用户数 */
  disabledUsers: number;
  /** 最近30天新增用户数 */
  newUsersLast30Days: number;
  /** 最近7天新增用户数 */
  newUsersLast7Days: number;
  /** 最近24小时新增用户数 */
  newUsersLast24Hours: number;
}

/**
 * 用户查询过滤器接口
 */
export interface UserFilters {
  /** 邮箱过滤 */
  email?: string;
  /** 状态过滤 */
  status?: UserStatus;
  /** 角色过滤 */
  role?: UserRole;
  /** 创建时间范围 */
  createdAtRange?: {
    start: Date;
    end: Date;
  };
  /** 更新时间范围 */
  updatedAtRange?: {
    start: Date;
    end: Date;
  };
  /** 搜索关键词 */
  searchTerm?: string;
}

/**
 * 用户分页选项接口
 */
export interface UserPaginationOptions {
  /** 页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 排序字段 */
  sortBy?: string;
  /** 排序方向 */
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * 用户分页结果接口
 */
export interface UserPaginationResult<T> {
  /** 数据列表 */
  data: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 用户创建请求接口
 */
export interface CreateUserRequest {
  /** 用户邮箱 */
  email: Email;
  /** 用户密码 */
  password: string;
  /** 用户资料 */
  profile: Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>;
  /** 用户偏好设置 */
  preferences?: Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>;
  /** 用户角色 */
  roles?: UserRole[];
  /** 用户权限 */
  permissions?: UserPermission[];
}

/**
 * 用户更新请求接口
 */
export interface UpdateUserRequest {
  /** 用户ID */
  userId: UserId;
  /** 用户资料更新 */
  profile?: Partial<Omit<UserProfile, 'userId' | 'createdAt' | 'updatedAt'>>;
  /** 用户偏好设置更新 */
  preferences?: Partial<
    Omit<UserPreferences, 'userId' | 'createdAt' | 'updatedAt'>
  >;
  /** 用户状态更新 */
  status?: UserStatus;
}

/**
 * 用户密码更新请求接口
 */
export interface UpdateUserPasswordRequest {
  /** 用户ID */
  userId: UserId;
  /** 当前密码 */
  currentPassword: string;
  /** 新密码 */
  newPassword: string;
  /** 确认新密码 */
  confirmPassword: string;
}

/**
 * 用户角色分配请求接口
 */
export interface AssignUserRoleRequest {
  /** 用户ID */
  userId: UserId;
  /** 角色 */
  role: UserRole;
  /** 过期时间 */
  expiresAt?: Date;
}

/**
 * 用户权限授予请求接口
 */
export interface GrantUserPermissionRequest {
  /** 用户ID */
  userId: UserId;
  /** 权限 */
  permission: UserPermission;
  /** 过期时间 */
  expiresAt?: Date;
}

/**
 * 用户响应接口
 */
export interface UserResponse {
  /** 用户基本信息 */
  user: UserBasicInfo;
  /** 用户资料 */
  profile: UserProfile;
  /** 用户偏好设置 */
  preferences: UserPreferences;
  /** 用户角色列表 */
  roles: UserRoleInfo[];
  /** 用户权限列表 */
  permissions: UserPermissionInfo[];
}

/**
 * 用户列表响应接口
 */
export interface UserListResponse {
  /** 用户列表 */
  users: UserResponse[];
  /** 分页信息 */
  pagination: UserPaginationResult<UserResponse>;
}

/**
 * 用户统计响应接口
 */
export interface UserStatisticsResponse {
  /** 统计信息 */
  statistics: UserStatistics;
  /** 生成时间 */
  generatedAt: Date;
}
