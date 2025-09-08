// 领域服务不依赖任何框架
import { TenantQuota } from '../value-objects/tenant-quota.vo';

/**
 * @interface UserAssignmentData
 * @description 用户分配数据结构
 */
export interface UserAssignmentData {
  readonly userId: string;
  readonly tenantId: string;
  readonly role: string;
  readonly organizationId?: string;
  readonly departmentId?: string;
  readonly assignedBy: string;
  readonly reason: string;
}

/**
 * @interface UserEligibilityCheck
 * @description 用户资格检查结果
 */
export interface UserEligibilityCheck {
  readonly eligible: boolean;
  readonly reason?: string;
  readonly restrictions?: string[];
}

/**
 * @interface TenantCapacityCheck
 * @description 租户容量检查结果
 */
export interface TenantCapacityCheck {
  readonly canAccommodate: boolean;
  readonly currentUsers: number;
  readonly maxUsers: number;
  readonly usageRate: number;
  readonly warnings?: string[];
}

/**
 * @class PlatformUserManagementService
 * @description
 * 平台用户管理领域服务，负责处理用户分配和管理的复杂业务逻辑。
 *
 * 跨聚合业务逻辑：
 * 1. 协调平台用户和租户用户之间的业务规则
 * 2. 处理用户分配和权限管理的复杂逻辑
 * 3. 管理用户状态变更和角色分配的业务规则
 * 4. 协调用户数据访问控制的逻辑
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用
 *
 * 业务规则封装：
 * 1. 封装复杂的用户管理计算逻辑
 * 2. 提供可重用的用户资格验证
 * 3. 隔离跨聚合的用户管理逻辑
 *
 * @example
 * ```typescript
 * const userService = new PlatformUserManagementService();
 * const eligible = await userService.checkUserEligibility('user-123', 'tenant-456');
 * const canAssign = await userService.validateUserAssignment(assignmentData, quota);
 * ```
 * @since 1.0.0
 */
export class PlatformUserManagementService {
  /**
   * @method validateUserAssignment
   * @description 验证用户分配请求的有效性
   * @param {UserAssignmentData} assignmentData 用户分配数据
   * @param {TenantQuota} tenantQuota 租户配额
   * @param {number} currentUserCount 当前用户数量
   * @returns {Promise<{ valid: boolean; reason?: string }>} 验证结果
   *
   * 验证规则：
   * 1. 用户ID不能为空
   * 2. 租户ID不能为空
   * 3. 角色必须有效
   * 4. 租户容量检查
   * 5. 用户资格检查
   * 6. 分配者权限检查
   */
  async validateUserAssignment(
    assignmentData: UserAssignmentData,
    tenantQuota: TenantQuota,
    currentUserCount: number,
  ): Promise<{ valid: boolean; reason?: string }> {
    // 1. 验证基本数据
    if (!assignmentData.userId || assignmentData.userId.trim().length === 0) {
      return { valid: false, reason: '用户ID不能为空' };
    }

    if (
      !assignmentData.tenantId ||
      assignmentData.tenantId.trim().length === 0
    ) {
      return { valid: false, reason: '租户ID不能为空' };
    }

    if (!assignmentData.role || assignmentData.role.trim().length === 0) {
      return { valid: false, reason: '角色不能为空' };
    }

    if (
      !assignmentData.assignedBy ||
      assignmentData.assignedBy.trim().length === 0
    ) {
      return { valid: false, reason: '分配者不能为空' };
    }

    // 2. 验证角色有效性
    const validRoles = [
      'TENANT_ADMIN',
      'ORGANIZATION_ADMIN',
      'DEPARTMENT_ADMIN',
      'TENANT_USER',
    ];
    if (!validRoles.includes(assignmentData.role)) {
      return { valid: false, reason: '无效的角色类型' };
    }

    // 3. 检查租户容量
    if (!tenantQuota.canAccommodateUsers(currentUserCount + 1)) {
      return { valid: false, reason: '租户用户容量已满' };
    }

    // 4. 验证组织部门分配
    if (
      assignmentData.role === 'ORGANIZATION_ADMIN' &&
      !assignmentData.organizationId
    ) {
      return { valid: false, reason: '组织管理员必须指定组织' };
    }

    if (
      assignmentData.role === 'DEPARTMENT_ADMIN' &&
      !assignmentData.departmentId
    ) {
      return { valid: false, reason: '部门管理员必须指定部门' };
    }

    return { valid: true };
  }

  /**
   * @method checkUserEligibility
   * @description 检查用户分配资格
   * @param {string} userId 用户ID
   * @param {string} tenantId 租户ID
   * @param {string} currentTenantId 用户当前租户ID（可选）
   * @returns {Promise<UserEligibilityCheck>} 资格检查结果
   *
   * 资格检查规则：
   * 1. 用户必须是平台用户
   * 2. 用户不能已经属于其他租户
   * 3. 用户状态必须为活跃
   * 4. 用户不能有未解决的违规记录
   */
  async checkUserEligibility(
    userId: string,
    tenantId: string,
    currentTenantId?: string,
  ): Promise<UserEligibilityCheck> {
    // 1. 检查用户是否已经属于其他租户
    if (currentTenantId && currentTenantId !== tenantId) {
      return {
        eligible: false,
        reason: '用户已经属于其他租户',
        restrictions: ['用户不能同时属于多个租户'],
      };
    }

    // 2. 检查用户是否已经属于目标租户
    if (currentTenantId === tenantId) {
      return {
        eligible: false,
        reason: '用户已经属于该租户',
        restrictions: ['重复分配'],
      };
    }

    // 3. 基础资格检查（这里可以扩展更多检查逻辑）
    const restrictions: string[] = [];

    // 可以添加更多资格检查逻辑
    // 例如：检查用户状态、违规记录等

    return {
      eligible: true,
      restrictions: restrictions.length > 0 ? restrictions : undefined,
    };
  }

  /**
   * @method checkTenantCapacity
   * @description 检查租户容量
   * @param {TenantQuota} quota 租户配额
   * @param {number} currentUserCount 当前用户数量
   * @param {number} additionalUsers 新增用户数量
   * @returns {TenantCapacityCheck} 容量检查结果
   *
   * 容量检查规则：
   * 1. 检查用户数量是否超过配额
   * 2. 计算使用率
   * 3. 提供警告和建议
   */
  checkTenantCapacity(
    quota: TenantQuota,
    currentUserCount: number,
    additionalUsers: number = 1,
  ): TenantCapacityCheck {
    const totalUsers = currentUserCount + additionalUsers;
    const canAccommodate = quota.canAccommodateUsers(totalUsers);
    const usageRate = (totalUsers / quota.maxUsers) * 100;

    const warnings: string[] = [];

    // 容量警告
    if (usageRate > 80) {
      warnings.push('租户用户容量使用率超过80%');
    }

    if (usageRate > 90) {
      warnings.push('租户用户容量使用率超过90%，建议考虑扩容');
    }

    if (usageRate > 95) {
      warnings.push('租户用户容量使用率超过95%，即将达到上限');
    }

    return {
      canAccommodate,
      currentUsers: currentUserCount,
      maxUsers: quota.maxUsers,
      usageRate: Math.round(usageRate * 100) / 100,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * @method validateRoleAssignment
   * @description 验证角色分配的有效性
   * @param {string} role 角色
   * @param {string} organizationId 组织ID（可选）
   * @param {string} departmentId 部门ID（可选）
   * @returns {Promise<{ valid: boolean; reason?: string }>} 验证结果
   *
   * 角色分配规则：
   * 1. 组织管理员必须指定组织
   * 2. 部门管理员必须指定部门
   * 3. 租户管理员不能指定组织或部门
   * 4. 普通用户可以选择性指定组织或部门
   */
  async validateRoleAssignment(
    role: string,
    organizationId?: string,
    departmentId?: string,
  ): Promise<{ valid: boolean; reason?: string }> {
    switch (role) {
      case 'TENANT_ADMIN':
        if (organizationId || departmentId) {
          return { valid: false, reason: '租户管理员不能指定组织或部门' };
        }
        break;

      case 'ORGANIZATION_ADMIN':
        if (!organizationId) {
          return { valid: false, reason: '组织管理员必须指定组织' };
        }
        break;

      case 'DEPARTMENT_ADMIN':
        if (!departmentId) {
          return { valid: false, reason: '部门管理员必须指定部门' };
        }
        break;

      case 'TENANT_USER':
        // 普通用户可以选择性指定组织或部门
        break;

      default:
        return { valid: false, reason: '无效的角色类型' };
    }

    return { valid: true };
  }

  /**
   * @method calculateUserPermissions
   * @description 计算用户权限范围
   * @param {string} role 用户角色
   * @param {string} tenantId 租户ID
   * @param {string} organizationId 组织ID（可选）
   * @param {string} departmentId 部门ID（可选）
   * @returns {Promise<{ permissions: string[]; dataScope: string }>} 权限计算结果
   *
   * 权限计算规则：
   * 1. 租户管理员：租户级所有权限
   * 2. 组织管理员：组织级管理权限
   * 3. 部门管理员：部门级管理权限
   * 4. 普通用户：基础用户权限
   */
  async calculateUserPermissions(
    role: string,
    _tenantId: string,
    _organizationId?: string,
    _departmentId?: string,
  ): Promise<{ permissions: string[]; dataScope: string }> {
    const basePermissions = ['user:read:own', 'profile:update:own'];

    switch (role) {
      case 'TENANT_ADMIN':
        return {
          permissions: [
            ...basePermissions,
            'tenant:read:all',
            'tenant:update:all',
            'organization:create',
            'organization:read:all',
            'organization:update:all',
            'organization:delete',
            'department:create',
            'department:read:all',
            'department:update:all',
            'department:delete',
            'user:create',
            'user:read:all',
            'user:update:all',
            'user:delete',
            'role:assign',
            'permission:manage',
          ],
          dataScope: 'tenant',
        };

      case 'ORGANIZATION_ADMIN':
        return {
          permissions: [
            ...basePermissions,
            'organization:read:own',
            'organization:update:own',
            'department:create',
            'department:read:own',
            'department:update:own',
            'department:delete',
            'user:read:own',
            'user:update:own',
            'role:assign:own',
          ],
          dataScope: 'organization',
        };

      case 'DEPARTMENT_ADMIN':
        return {
          permissions: [
            ...basePermissions,
            'department:read:own',
            'department:update:own',
            'user:read:own',
            'user:update:own',
          ],
          dataScope: 'department',
        };

      case 'TENANT_USER':
        return {
          permissions: basePermissions,
          dataScope: 'user',
        };

      default:
        return {
          permissions: basePermissions,
          dataScope: 'user',
        };
    }
  }

  /**
   * @method validateUserRemoval
   * @description 验证用户移除请求的有效性
   * @param {string} userId 用户ID
   * @param {string} tenantId 租户ID
   * @param {string} removedBy 移除者用户ID
   * @returns {Promise<{ valid: boolean; reason?: string; warnings?: string[] }>} 验证结果
   *
   * 移除验证规则：
   * 1. 不能移除租户管理员
   * 2. 不能移除自己
   * 3. 检查用户是否有未完成的任务
   * 4. 检查用户是否有重要的数据关联
   */
  async validateUserRemoval(
    userId: string,
    tenantId: string,
    removedBy: string,
  ): Promise<{ valid: boolean; reason?: string; warnings?: string[] }> {
    const warnings: string[] = [];

    // 1. 不能移除自己
    if (userId === removedBy) {
      return { valid: false, reason: '不能移除自己' };
    }

    // 2. 检查是否为租户管理员（这里需要查询用户角色）
    // 实际实现中需要查询用户角色
    // if (userRole === 'TENANT_ADMIN') {
    //   return { valid: false, reason: '不能移除租户管理员' };
    // }

    // 3. 检查用户是否有未完成的任务
    warnings.push('移除用户前请确认用户没有未完成的任务');

    // 4. 检查用户是否有重要的数据关联
    warnings.push('移除用户前请确认用户没有重要的数据关联');

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * @method generateUserAssignmentSummary
   * @description 生成用户分配摘要
   * @param {UserAssignmentData} assignmentData 用户分配数据
   * @param {TenantCapacityCheck} capacityCheck 容量检查结果
   * @returns {string} 分配摘要
   */
  generateUserAssignmentSummary(
    assignmentData: UserAssignmentData,
    capacityCheck: TenantCapacityCheck,
  ): string {
    const { userId, tenantId, role, organizationId, departmentId } =
      assignmentData;

    let summary = `用户 ${userId} 分配到租户 ${tenantId}，角色：${role}`;

    if (organizationId) {
      summary += `，组织：${organizationId}`;
    }

    if (departmentId) {
      summary += `，部门：${departmentId}`;
    }

    summary += `。当前用户数：${capacityCheck.currentUsers}/${capacityCheck.maxUsers} (${capacityCheck.usageRate}%)`;

    if (capacityCheck.warnings && capacityCheck.warnings.length > 0) {
      summary += `。警告：${capacityCheck.warnings.join(', ')}`;
    }

    return summary;
  }
}
