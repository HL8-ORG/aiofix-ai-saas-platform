/**
 * @fileoverview 测试工具函数
 * @description 提供测试中使用的工具函数
 * @since 1.0.0
 */

import { UserId, Email } from '@aiofix/shared';
import {
  UserStatus,
  UserRole,
  UserPermission,
} from '../../src/shared/constants/user.constants';
import {
  UserProfile,
  UserPreferences,
} from '../../src/shared/types/user.types';

/**
 * 创建测试用户ID
 */
export function createTestUserId(): UserId {
  return new UserId('test-user-123');
}

/**
 * 创建测试邮箱
 */
export function createTestEmail(): Email {
  return new Email('test@example.com');
}

/**
 * 创建测试用户资料
 */
export function createTestUserProfile(): UserProfile {
  return {
    userId: createTestUserId(),
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890',
    avatar: 'https://example.com/avatar.jpg',
    description: 'Test user description',
    timezone: 'UTC',
    language: 'en',
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };
}

/**
 * 创建测试用户偏好设置
 */
export function createTestUserPreferences(): UserPreferences {
  return {
    userId: createTestUserId(),
    notifications: {
      email: true,
      sms: false,
      push: true,
      system: true,
      marketing: false,
    },
    privacy: {
      profileVisibility: 'PUBLIC',
      onlineStatusVisibility: 'FRIENDS',
      activityVisibility: 'PRIVATE',
      dataSharing: false,
    },
    ui: {
      theme: 'LIGHT',
      language: 'en',
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: '24H',
    },
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };
}

/**
 * 创建测试用户数据
 */
export function createTestUserData() {
  return {
    id: createTestUserId(),
    email: createTestEmail(),
    status: UserStatus.ACTIVE,
    profile: createTestUserProfile(),
    preferences: createTestUserPreferences(),
    roles: [UserRole.PERSONAL_USER],
    permissions: [UserPermission.USER_READ, UserPermission.USER_UPDATE],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };
}

/**
 * 创建测试用户列表
 */
export function createTestUserList(count: number = 5) {
  return Array.from({ length: count }, (_, index) => ({
    ...createTestUserData(),
    id: new UserId(`test-user-${index + 1}`),
    email: new Email(`test${index + 1}@example.com`),
    profile: {
      ...createTestUserProfile(),
      userId: new UserId(`test-user-${index + 1}`),
      firstName: `Test${index + 1}`,
      lastName: 'User',
    },
  }));
}

/**
 * 等待指定时间
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 生成随机字符串
 */
export function generateRandomString(length: number = 10): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 生成随机邮箱
 */
export function generateRandomEmail(): Email {
  const randomString = generateRandomString(8);
  return new Email(`${randomString}@example.com`);
}

/**
 * 生成随机用户ID
 */
export function generateRandomUserId(): UserId {
  const randomString = generateRandomString(16);
  return new UserId(`user_${randomString}`);
}

/**
 * 创建测试JWT载荷
 */
export function createTestJwtPayload() {
  return {
    sub: createTestUserId().value,
    email: createTestEmail().value,
    roles: [UserRole.PERSONAL_USER],
    permissions: [UserPermission.USER_READ, UserPermission.USER_UPDATE],
    tenantId: 'test-tenant-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
  };
}

/**
 * 创建测试请求对象
 */
export function createTestRequest() {
  return {
    user: {
      id: createTestUserId().value,
      email: createTestEmail().value,
      roles: [UserRole.PERSONAL_USER],
      permissions: [UserPermission.USER_READ, UserPermission.USER_UPDATE],
    },
    tenant: {
      id: 'test-tenant-123',
      name: 'Test Tenant',
      status: 'ACTIVE',
    },
    headers: {
      authorization: 'Bearer test-jwt-token',
      'x-tenant-id': 'test-tenant-123',
    },
    params: {},
    query: {},
    body: {},
  };
}

/**
 * 创建测试响应对象
 */
export function createTestResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
  };
}

/**
 * 创建测试执行上下文
 */
export function createTestExecutionContext() {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(createTestRequest()),
      getResponse: jest.fn().mockReturnValue(createTestResponse()),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  };
}

/**
 * 创建测试调用处理器
 */
export function createTestCallHandler(data: any = {}) {
  return {
    handle: jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    }),
  };
}
