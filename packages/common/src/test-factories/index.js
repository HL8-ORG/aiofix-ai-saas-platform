"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestDataCleaner = exports.TestFactories = exports.RoleTestFactory = exports.DepartmentTestFactory = exports.OrganizationTestFactory = exports.TenantTestFactory = exports.UserTestFactory = void 0;
const uuid_1 = require("uuid");
/**
 * 用户测试数据工厂
 */
class UserTestFactory {
    /**
     * 创建单个用户测试数据
     *
     * @param {Partial<UserTestData>} overrides - 覆盖默认值的属性
     * @returns {UserTestData} 用户测试数据
     */
    static create(overrides = {}) {
        const now = new Date();
        return {
            id: (0, uuid_1.v4)(),
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
    static createMany(count, overrides = {}) {
        return Array.from({ length: count }, (_, index) => this.create({
            email: `test${index}@example.com`,
            name: `Test User ${index}`,
            ...overrides,
        }));
    }
    /**
     * 创建活跃用户
     *
     * @param {Partial<UserTestData>} overrides - 覆盖默认值的属性
     * @returns {UserTestData} 活跃用户测试数据
     */
    static createActive(overrides = {}) {
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
    static createInactive(overrides = {}) {
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
    static createLocked(overrides = {}) {
        return this.create({
            status: 'locked',
            ...overrides,
        });
    }
}
exports.UserTestFactory = UserTestFactory;
/**
 * 租户测试数据工厂
 */
class TenantTestFactory {
    /**
     * 创建单个租户测试数据
     *
     * @param {Partial<TenantTestData>} overrides - 覆盖默认值的属性
     * @returns {TenantTestData} 租户测试数据
     */
    static create(overrides = {}) {
        const now = new Date();
        return {
            id: (0, uuid_1.v4)(),
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
    static createMany(count, overrides = {}) {
        return Array.from({ length: count }, (_, index) => this.create({
            name: `Test Tenant ${index}`,
            ...overrides,
        }));
    }
    /**
     * 创建企业租户
     *
     * @param {Partial<TenantTestData>} overrides - 覆盖默认值的属性
     * @returns {TenantTestData} 企业租户测试数据
     */
    static createEnterprise(overrides = {}) {
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
    static createPersonal(overrides = {}) {
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
exports.TenantTestFactory = TenantTestFactory;
/**
 * 组织测试数据工厂
 */
class OrganizationTestFactory {
    /**
     * 创建单个组织测试数据
     *
     * @param {Partial<OrganizationTestData>} overrides - 覆盖默认值的属性
     * @returns {OrganizationTestData} 组织测试数据
     */
    static create(overrides = {}) {
        const now = new Date();
        return {
            id: (0, uuid_1.v4)(),
            name: 'Test Organization',
            type: 'project_team',
            description: 'Test organization description',
            tenantId: (0, uuid_1.v4)(),
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
    static createMany(count, overrides = {}) {
        return Array.from({ length: count }, (_, index) => this.create({
            name: `Test Organization ${index}`,
            ...overrides,
        }));
    }
}
exports.OrganizationTestFactory = OrganizationTestFactory;
/**
 * 部门测试数据工厂
 */
class DepartmentTestFactory {
    /**
     * 创建单个部门测试数据
     *
     * @param {Partial<DepartmentTestData>} overrides - 覆盖默认值的属性
     * @returns {DepartmentTestData} 部门测试数据
     */
    static create(overrides = {}) {
        const now = new Date();
        return {
            id: (0, uuid_1.v4)(),
            name: 'Test Department',
            description: 'Test department description',
            organizationId: (0, uuid_1.v4)(),
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
    static createMany(count, overrides = {}) {
        return Array.from({ length: count }, (_, index) => this.create({
            name: `Test Department ${index}`,
            ...overrides,
        }));
    }
}
exports.DepartmentTestFactory = DepartmentTestFactory;
/**
 * 角色测试数据工厂
 */
class RoleTestFactory {
    /**
     * 创建单个角色测试数据
     *
     * @param {Partial<RoleTestData>} overrides - 覆盖默认值的属性
     * @returns {RoleTestData} 角色测试数据
     */
    static create(overrides = {}) {
        const now = new Date();
        return {
            id: (0, uuid_1.v4)(),
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
    static createMany(count, overrides = {}) {
        return Array.from({ length: count }, (_, index) => this.create({
            name: `Test Role ${index}`,
            ...overrides,
        }));
    }
    /**
     * 创建平台管理员角色
     *
     * @param {Partial<RoleTestData>} overrides - 覆盖默认值的属性
     * @returns {RoleTestData} 平台管理员角色测试数据
     */
    static createPlatformAdmin(overrides = {}) {
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
    static createTenantAdmin(overrides = {}) {
        return this.create({
            name: 'Tenant Admin',
            permissions: ['tenant:read', 'tenant:write', 'user:read', 'user:write'],
            level: 'tenant',
            ...overrides,
        });
    }
}
exports.RoleTestFactory = RoleTestFactory;
/**
 * 测试数据工厂集合
 */
exports.TestFactories = {
    User: UserTestFactory,
    Tenant: TenantTestFactory,
    Organization: OrganizationTestFactory,
    Department: DepartmentTestFactory,
    Role: RoleTestFactory,
};
/**
 * 测试数据清理工具
 */
class TestDataCleaner {
    /**
     * 清理测试数据
     *
     * @param {any[]} data - 要清理的测试数据数组
     */
    static cleanup(data) {
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
    static reset() {
        // 重置全局测试状态
        if (typeof jest !== 'undefined') {
            jest.clearAllMocks();
            jest.restoreAllMocks();
        }
    }
}
exports.TestDataCleaner = TestDataCleaner;
//# sourceMappingURL=index.js.map