/**
 * 测试数据工厂
 *
 * 提供统一的测试数据创建方法，确保测试数据的一致性和可维护性。
 * 使用工厂模式创建测试对象，支持自定义覆盖和批量创建。
 *
 * @fileoverview 测试数据工厂
 * @author AI开发团队
 * @since 1.0.0
 */

import { v4 as uuidv4 } from 'uuid';

// Jest类型声明
declare const jest:
  | {
      clearAllMocks: () => void;
      restoreAllMocks: () => void;
    }
  | undefined;

/**
 * 用户测试数据接口
 */
export interface UserTestData {
  id?: string;
  email: string;
  password: string;
  name: string;
  phone?: string;
  avatar?: string;
  status?: 'active' | 'inactive' | 'locked';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 租户测试数据接口
 */
export interface TenantTestData {
  id?: string;
  name: string;
  type: 'enterprise' | 'community' | 'team' | 'personal';
  status: 'active' | 'inactive' | 'suspended';
  settings?: Record<string, any>;
  quota?: {
    users: number;
    storage: number;
    apiCalls: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 组织测试数据接口
 */
export interface OrganizationTestData {
  id?: string;
  name: string;
  type:
    | 'committee'
    | 'project_team'
    | 'quality_control'
    | 'performance_management'
    | 'other';
  description?: string;
  tenantId: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 部门测试数据接口
 */
export interface DepartmentTestData {
  id?: string;
  name: string;
  description?: string;
  organizationId: string;
  parentId?: string;
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 角色测试数据接口
 */
export interface RoleTestData {
  id?: string;
  name: string;
  description?: string;
  permissions: string[];
  level: 'platform' | 'tenant' | 'organization' | 'department' | 'user';
  status: 'active' | 'inactive';
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 用户测试数据工厂
 */
export class UserTestFactory {
  /**
   * 创建单个用户测试数据
   *
   * @param {Partial<UserTestData>} overrides - 覆盖默认值的属性
   * @returns {UserTestData} 用户测试数据
   */
  static create(overrides: Partial<UserTestData> = {}): UserTestData {
    const now = new Date();
    return {
      id: uuidv4(),
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      phone: '+1234567890',
      avatar: 'https://example.com/avatar.jpg',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * 创建多个用户测试数据
   *
   * @param {number} count - 创建数量
   * @param {Partial<UserTestData>} overrides - 覆盖默认值的属性
   * @returns {UserTestData[]} 用户测试数据数组
   */
  static createMany(
    count: number,
    overrides: Partial<UserTestData> = {},
  ): UserTestData[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        email: `test${index}@example.com`,
        name: `Test User ${index}`,
        ...overrides,
      }),
    );
  }

  /**
   * 创建活跃用户
   *
   * @param {Partial<UserTestData>} overrides - 覆盖默认值的属性
   * @returns {UserTestData} 活跃用户测试数据
   */
  static createActive(overrides: Partial<UserTestData> = {}): UserTestData {
    return this.create({
      status: 'active',
      ...overrides,
    });
  }

  /**
   * 创建非活跃用户
   *
   * @param {Partial<UserTestData>} overrides - 覆盖默认值的属性
   * @returns {UserTestData} 非活跃用户测试数据
   */
  static createInactive(overrides: Partial<UserTestData> = {}): UserTestData {
    return this.create({
      status: 'inactive',
      ...overrides,
    });
  }

  /**
   * 创建锁定用户
   *
   * @param {Partial<UserTestData>} overrides - 覆盖默认值的属性
   * @returns {UserTestData} 锁定用户测试数据
   */
  static createLocked(overrides: Partial<UserTestData> = {}): UserTestData {
    return this.create({
      status: 'locked',
      ...overrides,
    });
  }
}

/**
 * 租户测试数据工厂
 */
export class TenantTestFactory {
  /**
   * 创建单个租户测试数据
   *
   * @param {Partial<TenantTestData>} overrides - 覆盖默认值的属性
   * @returns {TenantTestData} 租户测试数据
   */
  static create(overrides: Partial<TenantTestData> = {}): TenantTestData {
    const now = new Date();
    return {
      id: uuidv4(),
      name: 'Test Tenant',
      type: 'enterprise',
      status: 'active',
      settings: {
        theme: 'light',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
      },
      quota: {
        users: 100,
        storage: 1024 * 1024 * 1024, // 1GB
        apiCalls: 10000,
      },
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * 创建多个租户测试数据
   *
   * @param {number} count - 创建数量
   * @param {Partial<TenantTestData>} overrides - 覆盖默认值的属性
   * @returns {TenantTestData[]} 租户测试数据数组
   */
  static createMany(
    count: number,
    overrides: Partial<TenantTestData> = {},
  ): TenantTestData[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        name: `Test Tenant ${index}`,
        ...overrides,
      }),
    );
  }

  /**
   * 创建企业租户
   *
   * @param {Partial<TenantTestData>} overrides - 覆盖默认值的属性
   * @returns {TenantTestData} 企业租户测试数据
   */
  static createEnterprise(
    overrides: Partial<TenantTestData> = {},
  ): TenantTestData {
    return this.create({
      type: 'enterprise',
      quota: {
        users: 1000,
        storage: 10 * 1024 * 1024 * 1024, // 10GB
        apiCalls: 100000,
      },
      ...overrides,
    });
  }

  /**
   * 创建个人租户
   *
   * @param {Partial<TenantTestData>} overrides - 覆盖默认值的属性
   * @returns {TenantTestData} 个人租户测试数据
   */
  static createPersonal(
    overrides: Partial<TenantTestData> = {},
  ): TenantTestData {
    return this.create({
      type: 'personal',
      quota: {
        users: 1,
        storage: 1024 * 1024 * 100, // 100MB
        apiCalls: 1000,
      },
      ...overrides,
    });
  }
}

/**
 * 组织测试数据工厂
 */
export class OrganizationTestFactory {
  /**
   * 创建单个组织测试数据
   *
   * @param {Partial<OrganizationTestData>} overrides - 覆盖默认值的属性
   * @returns {OrganizationTestData} 组织测试数据
   */
  static create(
    overrides: Partial<OrganizationTestData> = {},
  ): OrganizationTestData {
    const now = new Date();
    return {
      id: uuidv4(),
      name: 'Test Organization',
      type: 'project_team',
      description: 'Test organization description',
      tenantId: uuidv4(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * 创建多个组织测试数据
   *
   * @param {number} count - 创建数量
   * @param {Partial<OrganizationTestData>} overrides - 覆盖默认值的属性
   * @returns {OrganizationTestData[]} 组织测试数据数组
   */
  static createMany(
    count: number,
    overrides: Partial<OrganizationTestData> = {},
  ): OrganizationTestData[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        name: `Test Organization ${index}`,
        ...overrides,
      }),
    );
  }
}

/**
 * 部门测试数据工厂
 */
export class DepartmentTestFactory {
  /**
   * 创建单个部门测试数据
   *
   * @param {Partial<DepartmentTestData>} overrides - 覆盖默认值的属性
   * @returns {DepartmentTestData} 部门测试数据
   */
  static create(
    overrides: Partial<DepartmentTestData> = {},
  ): DepartmentTestData {
    const now = new Date();
    return {
      id: uuidv4(),
      name: 'Test Department',
      description: 'Test department description',
      organizationId: uuidv4(),
      status: 'active',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * 创建多个部门测试数据
   *
   * @param {number} count - 创建数量
   * @param {Partial<DepartmentTestData>} overrides - 覆盖默认值的属性
   * @returns {DepartmentTestData[]} 部门测试数据数组
   */
  static createMany(
    count: number,
    overrides: Partial<DepartmentTestData> = {},
  ): DepartmentTestData[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        name: `Test Department ${index}`,
        ...overrides,
      }),
    );
  }
}

/**
 * 角色测试数据工厂
 */
export class RoleTestFactory {
  /**
   * 创建单个角色测试数据
   *
   * @param {Partial<RoleTestData>} overrides - 覆盖默认值的属性
   * @returns {RoleTestData} 角色测试数据
   */
  static create(overrides: Partial<RoleTestData> = {}): RoleTestData {
    const now = new Date();
    return {
      id: uuidv4(),
      name: 'Test Role',
      description: 'Test role description',
      permissions: ['read', 'write'],
      level: 'user',
      status: 'active',
      createdAt: now,
      updatedAt: now,
      ...overrides,
    };
  }

  /**
   * 创建多个角色测试数据
   *
   * @param {number} count - 创建数量
   * @param {Partial<RoleTestData>} overrides - 覆盖默认值的属性
   * @returns {RoleTestData[]} 角色测试数据数组
   */
  static createMany(
    count: number,
    overrides: Partial<RoleTestData> = {},
  ): RoleTestData[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        name: `Test Role ${index}`,
        ...overrides,
      }),
    );
  }

  /**
   * 创建平台管理员角色
   *
   * @param {Partial<RoleTestData>} overrides - 覆盖默认值的属性
   * @returns {RoleTestData} 平台管理员角色测试数据
   */
  static createPlatformAdmin(
    overrides: Partial<RoleTestData> = {},
  ): RoleTestData {
    return this.create({
      name: 'Platform Admin',
      permissions: ['*'], // 所有权限
      level: 'platform',
      ...overrides,
    });
  }

  /**
   * 创建租户管理员角色
   *
   * @param {Partial<RoleTestData>} overrides - 覆盖默认值的属性
   * @returns {RoleTestData} 租户管理员角色测试数据
   */
  static createTenantAdmin(
    overrides: Partial<RoleTestData> = {},
  ): RoleTestData {
    return this.create({
      name: 'Tenant Admin',
      permissions: ['tenant:read', 'tenant:write', 'user:read', 'user:write'],
      level: 'tenant',
      ...overrides,
    });
  }
}

/**
 * 测试数据工厂集合
 */
export const TestFactories = {
  User: UserTestFactory,
  Tenant: TenantTestFactory,
  Organization: OrganizationTestFactory,
  Department: DepartmentTestFactory,
  Role: RoleTestFactory,
};

/**
 * 测试数据清理工具
 */
export class TestDataCleaner {
  /**
   * 清理测试数据
   *
   * @param {any[]} data - 要清理的测试数据数组
   */
  static cleanup(data: any[]): void {
    // 清理测试数据，避免内存泄漏
    data.forEach(item => {
      if (item && typeof item === 'object') {
        Object.keys(item).forEach(key => {
          delete item[key];
        });
      }
    });
  }

  /**
   * 重置测试环境
   */
  static reset(): void {
    // 重置全局测试状态
    if (typeof jest !== 'undefined') {
      jest.clearAllMocks();
      jest.restoreAllMocks();
    }
  }
}
