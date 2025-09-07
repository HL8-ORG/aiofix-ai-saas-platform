import { RoleId } from '../value-objects/role-id.vo';
import { RoleName } from '../value-objects/role-name.vo';
import { Permission } from '../value-objects/permission.vo';
import { RoleType, RoleTypeHelper } from '../enums/role-type.enum';
import { RoleStatus, RoleStatusHelper } from '../enums/role-status.enum';
import { TenantId } from '@aiofix/shared';
import { OrganizationId } from '@aiofix/organization';
import { DepartmentId } from '@aiofix/department';

/**
 * @interface RoleHierarchy
 * @description 角色层级关系接口
 */
export interface RoleHierarchy {
  readonly roleId: RoleId;
  readonly roleName: RoleName;
  readonly roleType: RoleType;
  readonly level: number;
  readonly parentRoles: RoleId[];
  readonly childRoles: RoleId[];
  readonly inheritedPermissions: Permission[];
}

/**
 * @interface ValidationResult
 * @description 验证结果接口
 */
export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
}

/**
 * @interface PermissionConflict
 * @description 权限冲突接口
 */
export interface PermissionConflict {
  readonly permission: Permission;
  readonly conflictingRoles: RoleId[];
  readonly conflictType: 'duplicate' | 'contradictory' | 'redundant';
  readonly severity: 'low' | 'medium' | 'high';
}

/**
 * @class RoleDomainService
 * @description
 * 角色领域服务，负责处理跨聚合的业务逻辑和无状态操作。
 *
 * 跨聚合业务逻辑：
 * 1. 协调角色和权限之间的业务规则
 * 2. 处理角色层级关系和权限继承
 * 3. 管理角色冲突检测和解决
 *
 * 无状态操作：
 * 1. 不维护任何内部状态
 * 2. 所有方法都是纯函数
 * 3. 可以安全地在多个聚合根之间共享
 * 4. 支持并发调用
 *
 * 业务规则封装：
 * 1. 封装复杂的角色计算逻辑
 * 2. 提供可重用的角色验证规则
 * 3. 隔离跨聚合的复杂业务逻辑
 *
 * @example
 * ```typescript
 * const roleService = new RoleDomainService();
 * const canManage = roleService.canRoleManageRole(managerRoleType, targetRoleType);
 * const conflicts = roleService.detectPermissionConflicts(permissions);
 * ```
 * @since 1.0.0
 */
export class RoleDomainService {
  /**
   * @method canRoleManageRole
   * @description 判断一个角色类型是否可以管理另一个角色类型
   * @param {RoleType} managerRoleType 管理者角色类型
   * @param {RoleType} targetRoleType 目标角色类型
   * @returns {boolean} 是否可以管理
   *
   * 业务逻辑：
   * 1. 系统角色可以管理所有角色
   * 2. 层级角色只能管理同级或下级角色
   * 3. 自定义角色不能管理其他角色
   */
  canRoleManageRole(managerRoleType: RoleType, targetRoleType: RoleType): boolean {
    return RoleTypeHelper.canManage(managerRoleType, targetRoleType);
  }

  /**
   * @method calculateRoleHierarchy
   * @description 计算角色层级关系
   * @param {RoleType} roleType 角色类型
   * @param {TenantId} tenantId 租户ID
   * @param {OrganizationId} [organizationId] 组织ID（可选）
   * @param {DepartmentId} [departmentId] 部门ID（可选）
   * @returns {RoleHierarchy} 角色层级关系
   */
  calculateRoleHierarchy(
    roleType: RoleType,
    tenantId: TenantId,
    organizationId?: OrganizationId,
    departmentId?: DepartmentId,
  ): RoleHierarchy {
    const level = RoleTypeHelper.getLevel(roleType);
    
    // 计算父角色
    const parentRoles: RoleId[] = [];
    if (departmentId && organizationId) {
      // 部门角色的父角色是组织角色
      parentRoles.push(new RoleId()); // 这里应该查询实际的父角色ID
    }
    if (organizationId) {
      // 组织角色的父角色是租户角色
      parentRoles.push(new RoleId()); // 这里应该查询实际的父角色ID
    }

    // 计算子角色
    const childRoles: RoleId[] = [];
    // 这里应该查询实际的子角色ID

    return {
      roleId: new RoleId(),
      roleName: new RoleName(''),
      roleType,
      level,
      parentRoles,
      childRoles,
      inheritedPermissions: [],
    };
  }

  /**
   * @method detectPermissionConflicts
   * @description 检测权限冲突
   * @param {Permission[]} permissions 权限列表
   * @returns {PermissionConflict[]} 权限冲突列表
   */
  detectPermissionConflicts(permissions: Permission[]): PermissionConflict[] {
    const conflicts: PermissionConflict[] = [];
    const permissionMap = new Map<string, Permission[]>();

    // 按资源和操作分组权限
    for (const permission of permissions) {
      const key = `${permission.getResource()}:${permission.getAction()}`;
      if (!permissionMap.has(key)) {
        permissionMap.set(key, []);
      }
      permissionMap.get(key)!.push(permission);
    }

    // 检测重复权限
    for (const [key, perms] of permissionMap) {
      if (perms.length > 1) {
        for (const permission of perms) {
          conflicts.push({
            permission,
            conflictingRoles: perms.map(p => new RoleId()),
            conflictType: 'duplicate',
            severity: 'medium',
          });
        }
      }
    }

    return conflicts;
  }

  /**
   * @method validateRoleName
   * @description 验证角色名称
   * @param {string} name 角色名称
   * @param {RoleType} roleType 角色类型
   * @returns {ValidationResult} 验证结果
   */
  validateRoleName(name: string, roleType: RoleType): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本验证
    if (!name || name.trim().length === 0) {
      errors.push('角色名称不能为空');
    }

    if (name.length > 50) {
      errors.push('角色名称长度不能超过50个字符');
    }

    // 角色类型特定验证
    if (roleType === RoleType.SYSTEM) {
      if (!name.toLowerCase().includes('system')) {
        warnings.push('系统角色名称建议包含"system"关键字');
      }
    }

    if (roleType === RoleType.CUSTOM) {
      if (name.toLowerCase().includes('admin') || name.toLowerCase().includes('system')) {
        warnings.push('自定义角色名称不建议包含"admin"或"system"关键字');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * @method validateRolePermissions
   * @description 验证角色权限
   * @param {Permission[]} permissions 权限列表
   * @param {RoleType} roleType 角色类型
   * @returns {ValidationResult} 验证结果
   */
  validateRolePermissions(permissions: Permission[], roleType: RoleType): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 基本验证
    if (!Array.isArray(permissions)) {
      errors.push('权限列表必须是数组');
      return { isValid: false, errors, warnings };
    }

    // 权限数量验证
    if (permissions.length === 0) {
      warnings.push('角色没有分配任何权限');
    }

    if (permissions.length > 100) {
      warnings.push('角色权限数量过多，建议拆分角色');
    }

    // 角色类型特定验证
    if (roleType === RoleType.SYSTEM) {
      const hasSystemPermissions = permissions.some(p => 
        p.getResource().startsWith('system') || p.getResource().startsWith('platform')
      );
      if (!hasSystemPermissions) {
        warnings.push('系统角色建议包含系统级权限');
      }
    }

    // 检测权限冲突
    const conflicts = this.detectPermissionConflicts(permissions);
    for (const conflict of conflicts) {
      if (conflict.severity === 'high') {
        errors.push(`权限冲突：${conflict.permission.toString()}`);
      } else {
        warnings.push(`权限冲突：${conflict.permission.toString()}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * @method calculateEffectivePermissions
   * @description 计算有效权限（包括继承的权限）
   * @param {Permission[]} directPermissions 直接权限
   * @param {Permission[]} inheritedPermissions 继承权限
   * @returns {Permission[]} 有效权限列表
   */
  calculateEffectivePermissions(
    directPermissions: Permission[],
    inheritedPermissions: Permission[] = [],
  ): Permission[] {
    const effectivePermissions = new Map<string, Permission>();

    // 添加继承的权限
    for (const permission of inheritedPermissions) {
      const key = permission.toString();
      effectivePermissions.set(key, permission);
    }

    // 添加直接权限（会覆盖继承的权限）
    for (const permission of directPermissions) {
      const key = permission.toString();
      effectivePermissions.set(key, permission);
    }

    return Array.from(effectivePermissions.values());
  }

  /**
   * @method canUserAccessResource
   * @description 判断用户是否可以访问指定资源
   * @param {Permission[]} userPermissions 用户权限列表
   * @param {string} resource 资源名称
   * @param {string} action 操作名称
   * @param {Record<string, any>} [context] 访问上下文
   * @returns {boolean} 是否可以访问
   */
  canUserAccessResource(
    userPermissions: Permission[],
    resource: string,
    action: string,
    context?: Record<string, any>,
  ): boolean {
    for (const permission of userPermissions) {
      if (permission.matches(resource, action)) {
        // 检查权限条件
        if (context && permission.getConditions()) {
          const conditions = permission.getConditions();
          for (const [key, value] of Object.entries(conditions)) {
            if (context[key] !== value) {
              return false;
            }
          }
        }
        return true;
      }
    }
    return false;
  }

  /**
   * @method getRoleScope
   * @description 获取角色作用域
   * @param {RoleType} roleType 角色类型
   * @param {TenantId} tenantId 租户ID
   * @param {OrganizationId} [organizationId] 组织ID（可选）
   * @param {DepartmentId} [departmentId] 部门ID（可选）
   * @returns {string} 角色作用域
   */
  getRoleScope(
    roleType: RoleType,
    tenantId: TenantId,
    organizationId?: OrganizationId,
    departmentId?: DepartmentId,
  ): string {
    switch (roleType) {
      case RoleType.PLATFORM:
        return 'platform';
      case RoleType.TENANT:
        return `tenant:${tenantId.value}`;
      case RoleType.ORGANIZATION:
        return `organization:${organizationId?.value}`;
      case RoleType.DEPARTMENT:
        return `department:${departmentId?.value}`;
      case RoleType.USER:
        return `user:${tenantId.value}`;
      case RoleType.SYSTEM:
        return 'system';
      case RoleType.CUSTOM:
        return `custom:${tenantId.value}`;
      default:
        return 'unknown';
    }
  }

  /**
   * @method isRoleExpired
   * @description 检查角色是否已过期
   * @param {Date} expiresAt 过期时间
   * @returns {boolean} 是否已过期
   */
  isRoleExpired(expiresAt?: Date): boolean {
    if (!expiresAt) {
      return false;
    }
    return new Date() > expiresAt;
  }

  /**
   * @method calculateRolePriority
   * @description 计算角色优先级
   * @param {RoleType} roleType 角色类型
   * @param {boolean} isSystemRole 是否为系统角色
   * @param {boolean} isDefaultRole 是否为默认角色
   * @returns {number} 角色优先级（数字越大优先级越高）
   */
  calculateRolePriority(
    roleType: RoleType,
    isSystemRole: boolean,
    isDefaultRole: boolean,
  ): number {
    let priority = RoleTypeHelper.getLevel(roleType);

    // 系统角色优先级最高
    if (isSystemRole) {
      priority += 100;
    }

    // 默认角色优先级较高
    if (isDefaultRole) {
      priority += 50;
    }

    return priority;
  }
}
