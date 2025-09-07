/**
 * @enum RoleType
 * @description
 * 角色类型枚举，定义角色在系统中的不同类型。
 *
 * 类型说明：
 * 1. PLATFORM: 平台级角色，影响整个平台
 * 2. TENANT: 租户级角色，影响特定租户
 * 3. ORGANIZATION: 组织级角色，影响特定组织
 * 4. DEPARTMENT: 部门级角色，影响特定部门
 * 5. USER: 用户级角色，影响特定用户
 * 6. SYSTEM: 系统角色，系统内置角色
 * 7. CUSTOM: 自定义角色，用户自定义角色
 *
 * 权限继承规则：
 * - PLATFORM > TENANT > ORGANIZATION > DEPARTMENT > USER
 * - SYSTEM 角色具有特殊权限
 * - CUSTOM 角色遵循层级权限规则
 *
 * @example
 * ```typescript
 * const roleType = RoleType.TENANT;
 * console.log(RoleTypeHelper.getScope(roleType)); // 'tenant'
 * ```
 * @since 1.0.0
 */
export enum RoleType {
  /**
   * 平台级角色
   * 影响整个平台，具有最高权限
   */
  PLATFORM = 'PLATFORM',

  /**
   * 租户级角色
   * 影响特定租户内的所有数据
   */
  TENANT = 'TENANT',

  /**
   * 组织级角色
   * 影响特定组织内的数据
   */
  ORGANIZATION = 'ORGANIZATION',

  /**
   * 部门级角色
   * 影响特定部门内的数据
   */
  DEPARTMENT = 'DEPARTMENT',

  /**
   * 用户级角色
   * 影响特定用户的数据
   */
  USER = 'USER',

  /**
   * 系统角色
   * 系统内置角色，具有特殊权限
   */
  SYSTEM = 'SYSTEM',

  /**
   * 自定义角色
   * 用户自定义角色，遵循层级权限规则
   */
  CUSTOM = 'CUSTOM',
}

/**
 * @class RoleTypeHelper
 * @description 角色类型辅助类，提供类型相关的工具方法
 */
export class RoleTypeHelper {
  /**
   * @method getScope
   * @description 获取角色类型的作用域
   * @param {RoleType} roleType 角色类型
   * @returns {string} 作用域名称
   */
  static getScope(roleType: RoleType): string {
    const scopes: Record<RoleType, string> = {
      [RoleType.PLATFORM]: 'platform',
      [RoleType.TENANT]: 'tenant',
      [RoleType.ORGANIZATION]: 'organization',
      [RoleType.DEPARTMENT]: 'department',
      [RoleType.USER]: 'user',
      [RoleType.SYSTEM]: 'system',
      [RoleType.CUSTOM]: 'custom',
    };
    return scopes[roleType] || 'unknown';
  }

  /**
   * @method getLevel
   * @description 获取角色类型的权限级别
   * @param {RoleType} roleType 角色类型
   * @returns {number} 权限级别（数字越大权限越高）
   */
  static getLevel(roleType: RoleType): number {
    const levels: Record<RoleType, number> = {
      [RoleType.PLATFORM]: 5,
      [RoleType.TENANT]: 4,
      [RoleType.ORGANIZATION]: 3,
      [RoleType.DEPARTMENT]: 2,
      [RoleType.USER]: 1,
      [RoleType.SYSTEM]: 6, // 系统角色具有最高权限
      [RoleType.CUSTOM]: 0, // 自定义角色权限级别由具体配置决定
    };
    return levels[roleType] || 0;
  }

  /**
   * @method isSystemRole
   * @description 检查是否为系统角色
   * @param {RoleType} roleType 角色类型
   * @returns {boolean} 是否为系统角色
   */
  static isSystemRole(roleType: RoleType): boolean {
    return roleType === RoleType.SYSTEM;
  }

  /**
   * @method isCustomRole
   * @description 检查是否为自定义角色
   * @param {RoleType} roleType 角色类型
   * @returns {boolean} 是否为自定义角色
   */
  static isCustomRole(roleType: RoleType): boolean {
    return roleType === RoleType.CUSTOM;
  }

  /**
   * @method isHierarchicalRole
   * @description 检查是否为层级角色
   * @param {RoleType} roleType 角色类型
   * @returns {boolean} 是否为层级角色
   */
  static isHierarchicalRole(roleType: RoleType): boolean {
    return [
      RoleType.PLATFORM,
      RoleType.TENANT,
      RoleType.ORGANIZATION,
      RoleType.DEPARTMENT,
      RoleType.USER,
    ].includes(roleType);
  }

  /**
   * @method hasHigherPermission
   * @description 检查一个角色类型是否比另一个具有更高权限
   * @param {RoleType} roleType1 第一个角色类型
   * @param {RoleType} roleType2 第二个角色类型
   * @returns {boolean} 是否具有更高权限
   */
  static hasHigherPermission(
    roleType1: RoleType,
    roleType2: RoleType,
  ): boolean {
    return this.getLevel(roleType1) > this.getLevel(roleType2);
  }

  /**
   * @method canManage
   * @description 检查一个角色类型是否可以管理另一个角色类型
   * @param {RoleType} managerType 管理者角色类型
   * @param {RoleType} targetType 目标角色类型
   * @returns {boolean} 是否可以管理
   */
  static canManage(managerType: RoleType, targetType: RoleType): boolean {
    // 系统角色可以管理所有角色
    if (managerType === RoleType.SYSTEM) {
      return true;
    }

    // 层级角色只能管理同级或下级角色
    if (
      this.isHierarchicalRole(managerType) &&
      this.isHierarchicalRole(targetType)
    ) {
      return this.getLevel(managerType) >= this.getLevel(targetType);
    }

    // 自定义角色不能管理其他角色
    return false;
  }

  /**
   * @method getDisplayName
   * @description 获取角色类型的显示名称
   * @param {RoleType} roleType 角色类型
   * @returns {string} 显示名称
   */
  static getDisplayName(roleType: RoleType): string {
    const displayNames: Record<RoleType, string> = {
      [RoleType.PLATFORM]: '平台角色',
      [RoleType.TENANT]: '租户角色',
      [RoleType.ORGANIZATION]: '组织角色',
      [RoleType.DEPARTMENT]: '部门角色',
      [RoleType.USER]: '用户角色',
      [RoleType.SYSTEM]: '系统角色',
      [RoleType.CUSTOM]: '自定义角色',
    };
    return displayNames[roleType] || '未知类型';
  }

  /**
   * @method getAllTypes
   * @description 获取所有角色类型
   * @returns {RoleType[]} 所有角色类型列表
   */
  static getAllTypes(): RoleType[] {
    return Object.values(RoleType);
  }

  /**
   * @method getHierarchicalTypes
   * @description 获取层级角色类型
   * @returns {RoleType[]} 层级角色类型列表
   */
  static getHierarchicalTypes(): RoleType[] {
    return [
      RoleType.PLATFORM,
      RoleType.TENANT,
      RoleType.ORGANIZATION,
      RoleType.DEPARTMENT,
      RoleType.USER,
    ];
  }
}
