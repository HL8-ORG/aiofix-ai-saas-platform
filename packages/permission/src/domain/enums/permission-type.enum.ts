/**
 * @enum PermissionType
 * @description 权限类型枚举
 * @since 1.0.0
 */
export enum PermissionType {
  /** 平台级权限 - 影响整个平台 */
  PLATFORM = 'PLATFORM',
  /** 租户级权限 - 影响特定租户 */
  TENANT = 'TENANT',
  /** 组织级权限 - 影响特定组织 */
  ORGANIZATION = 'ORGANIZATION',
  /** 部门级权限 - 影响特定部门 */
  DEPARTMENT = 'DEPARTMENT',
  /** 用户级权限 - 影响特定用户 */
  USER = 'USER',
  /** 系统级权限 - 系统内部使用 */
  SYSTEM = 'SYSTEM',
  /** 自定义权限 - 用户自定义 */
  CUSTOM = 'CUSTOM',
}

/**
 * @class PermissionTypeHelper
 * @description 权限类型辅助类，提供权限类型相关的业务逻辑
 * @since 1.0.0
 */
export class PermissionTypeHelper {
  /**
   * @method getAllTypes
   * @description 获取所有权限类型
   * @returns {PermissionType[]} 所有权限类型列表
   */
  static getAllTypes(): PermissionType[] {
    return Object.values(PermissionType);
  }

  /**
   * @method getHierarchicalTypes
   * @description 获取层级权限类型列表
   * @returns {PermissionType[]} 层级权限类型列表
   */
  static getHierarchicalTypes(): PermissionType[] {
    return [
      PermissionType.PLATFORM,
      PermissionType.TENANT,
      PermissionType.ORGANIZATION,
      PermissionType.DEPARTMENT,
      PermissionType.USER,
    ];
  }

  /**
   * @method getNonHierarchicalTypes
   * @description 获取非层级权限类型列表
   * @returns {PermissionType[]} 非层级权限类型列表
   */
  static getNonHierarchicalTypes(): PermissionType[] {
    return [PermissionType.SYSTEM, PermissionType.CUSTOM];
  }

  /**
   * @method isHierarchicalType
   * @description 检查是否为层级权限类型
   * @param {PermissionType} type 权限类型
   * @returns {boolean} 是否为层级权限类型
   */
  static isHierarchicalType(type: PermissionType): boolean {
    return this.getHierarchicalTypes().includes(type);
  }

  /**
   * @method isNonHierarchicalType
   * @description 检查是否为非层级权限类型
   * @param {PermissionType} type 权限类型
   * @returns {boolean} 是否为非层级权限类型
   */
  static isNonHierarchicalType(type: PermissionType): boolean {
    return this.getNonHierarchicalTypes().includes(type);
  }

  /**
   * @method isPlatformType
   * @description 检查是否为平台级权限类型
   * @param {PermissionType} type 权限类型
   * @returns {boolean} 是否为平台级权限类型
   */
  static isPlatformType(type: PermissionType): boolean {
    return type === PermissionType.PLATFORM;
  }

  /**
   * @method isTenantType
   * @description 检查是否为租户级权限类型
   * @param {PermissionType} type 权限类型
   * @returns {boolean} 是否为租户级权限类型
   */
  static isTenantType(type: PermissionType): boolean {
    return type === PermissionType.TENANT;
  }

  /**
   * @method isOrganizationType
   * @description 检查是否为组织级权限类型
   * @param {PermissionType} type 权限类型
   * @returns {boolean} 是否为组织级权限类型
   */
  static isOrganizationType(type: PermissionType): boolean {
    return type === PermissionType.ORGANIZATION;
  }

  /**
   * @method isDepartmentType
   * @description 检查是否为部门级权限类型
   * @param {PermissionType} type 权限类型
   * @returns {boolean} 是否为部门级权限类型
   */
  static isDepartmentType(type: PermissionType): boolean {
    return type === PermissionType.DEPARTMENT;
  }

  /**
   * @method isUserType
   * @description 检查是否为用户级权限类型
   * @param {PermissionType} type 权限类型
   * @returns {boolean} 是否为用户级权限类型
   */
  static isUserType(type: PermissionType): boolean {
    return type === PermissionType.USER;
  }

  /**
   * @method isSystemType
   * @description 检查是否为系统级权限类型
   * @param {PermissionType} type 权限类型
   * @returns {boolean} 是否为系统级权限类型
   */
  static isSystemType(type: PermissionType): boolean {
    return type === PermissionType.SYSTEM;
  }

  /**
   * @method isCustomType
   * @description 检查是否为自定义权限类型
   * @param {PermissionType} type 权限类型
   * @returns {boolean} 是否为自定义权限类型
   */
  static isCustomType(type: PermissionType): boolean {
    return type === PermissionType.CUSTOM;
  }

  /**
   * @method getLevel
   * @description 获取权限类型的层级
   * @param {PermissionType} type 权限类型
   * @returns {number} 层级（数字越大层级越高）
   */
  static getLevel(type: PermissionType): number {
    const levels: Record<PermissionType, number> = {
      [PermissionType.PLATFORM]: 5,
      [PermissionType.TENANT]: 4,
      [PermissionType.ORGANIZATION]: 3,
      [PermissionType.DEPARTMENT]: 2,
      [PermissionType.USER]: 1,
      [PermissionType.SYSTEM]: 6,
      [PermissionType.CUSTOM]: 0,
    };
    return levels[type] || 0;
  }

  /**
   * @method hasHigherLevel
   * @description 检查权限类型是否具有更高层级
   * @param {PermissionType} type1 权限类型1
   * @param {PermissionType} type2 权限类型2
   * @returns {boolean} 是否具有更高层级
   */
  static hasHigherLevel(type1: PermissionType, type2: PermissionType): boolean {
    return this.getLevel(type1) > this.getLevel(type2);
  }

  /**
   * @method hasLowerLevel
   * @description 检查权限类型是否具有更低层级
   * @param {PermissionType} type1 权限类型1
   * @param {PermissionType} type2 权限类型2
   * @returns {boolean} 是否具有更低层级
   */
  static hasLowerLevel(type1: PermissionType, type2: PermissionType): boolean {
    return this.getLevel(type1) < this.getLevel(type2);
  }

  /**
   * @method hasSameLevel
   * @description 检查权限类型是否具有相同层级
   * @param {PermissionType} type1 权限类型1
   * @param {PermissionType} type2 权限类型2
   * @returns {boolean} 是否具有相同层级
   */
  static hasSameLevel(type1: PermissionType, type2: PermissionType): boolean {
    return this.getLevel(type1) === this.getLevel(type2);
  }

  /**
   * @method canManage
   * @description 检查权限类型是否可以管理另一个权限类型
   * @param {PermissionType} managerType 管理权限类型
   * @param {PermissionType} targetType 目标权限类型
   * @returns {boolean} 是否可以管理
   */
  static canManage(
    managerType: PermissionType,
    targetType: PermissionType,
  ): boolean {
    // 系统级权限可以管理所有权限
    if (this.isSystemType(managerType)) {
      return true;
    }

    // 平台级权限可以管理除系统级外的所有权限
    if (this.isPlatformType(managerType)) {
      return !this.isSystemType(targetType);
    }

    // 层级权限只能管理同级或下级权限
    if (
      this.isHierarchicalType(managerType) &&
      this.isHierarchicalType(targetType)
    ) {
      return this.getLevel(managerType) >= this.getLevel(targetType);
    }

    // 自定义权限只能管理自定义权限
    if (this.isCustomType(managerType)) {
      return this.isCustomType(targetType);
    }

    return false;
  }

  /**
   * @method getTypeDisplayName
   * @description 获取权限类型的显示名称
   * @param {PermissionType} type 权限类型
   * @returns {string} 显示名称
   */
  static getTypeDisplayName(type: PermissionType): string {
    const displayNames: Record<PermissionType, string> = {
      [PermissionType.PLATFORM]: '平台级',
      [PermissionType.TENANT]: '租户级',
      [PermissionType.ORGANIZATION]: '组织级',
      [PermissionType.DEPARTMENT]: '部门级',
      [PermissionType.USER]: '用户级',
      [PermissionType.SYSTEM]: '系统级',
      [PermissionType.CUSTOM]: '自定义',
    };
    return displayNames[type] || '未知类型';
  }

  /**
   * @method getTypeDescription
   * @description 获取权限类型的描述
   * @param {PermissionType} type 权限类型
   * @returns {string} 类型描述
   */
  static getTypeDescription(type: PermissionType): string {
    const descriptions: Record<PermissionType, string> = {
      [PermissionType.PLATFORM]: '影响整个平台的权限',
      [PermissionType.TENANT]: '影响特定租户的权限',
      [PermissionType.ORGANIZATION]: '影响特定组织的权限',
      [PermissionType.DEPARTMENT]: '影响特定部门的权限',
      [PermissionType.USER]: '影响特定用户的权限',
      [PermissionType.SYSTEM]: '系统内部使用的权限',
      [PermissionType.CUSTOM]: '用户自定义的权限',
    };
    return descriptions[type] || '未知类型';
  }

  /**
   * @method getTypeColor
   * @description 获取权限类型的颜色标识
   * @param {PermissionType} type 权限类型
   * @returns {string} 颜色标识
   */
  static getTypeColor(type: PermissionType): string {
    const colors: Record<PermissionType, string> = {
      [PermissionType.PLATFORM]: 'purple',
      [PermissionType.TENANT]: 'blue',
      [PermissionType.ORGANIZATION]: 'green',
      [PermissionType.DEPARTMENT]: 'orange',
      [PermissionType.USER]: 'gray',
      [PermissionType.SYSTEM]: 'red',
      [PermissionType.CUSTOM]: 'teal',
    };
    return colors[type] || 'gray';
  }

  /**
   * @method getRequiredScopeLevel
   * @description 获取权限类型所需的作用域级别
   * @param {PermissionType} type 权限类型
   * @returns {string} 作用域级别
   */
  static getRequiredScopeLevel(type: PermissionType): string {
    const scopeLevels: Record<PermissionType, string> = {
      [PermissionType.PLATFORM]: 'platform',
      [PermissionType.TENANT]: 'tenant',
      [PermissionType.ORGANIZATION]: 'organization',
      [PermissionType.DEPARTMENT]: 'department',
      [PermissionType.USER]: 'user',
      [PermissionType.SYSTEM]: 'platform',
      [PermissionType.CUSTOM]: 'tenant',
    };
    return scopeLevels[type] || 'tenant';
  }

  /**
   * @method getInheritanceChain
   * @description 获取权限类型的继承链
   * @param {PermissionType} type 权限类型
   * @returns {PermissionType[]} 继承链（从高到低）
   */
  static getInheritanceChain(type: PermissionType): PermissionType[] {
    if (!this.isHierarchicalType(type)) {
      return [type];
    }

    const chain: PermissionType[] = [];
    const allHierarchicalTypes = this.getHierarchicalTypes().sort(
      (a, b) => this.getLevel(b) - this.getLevel(a),
    );

    for (const hierarchicalType of allHierarchicalTypes) {
      if (this.getLevel(hierarchicalType) >= this.getLevel(type)) {
        chain.push(hierarchicalType);
      }
    }

    return chain;
  }

  /**
   * @method canInheritFrom
   * @description 检查权限类型是否可以从另一个权限类型继承
   * @param {PermissionType} childType 子权限类型
   * @param {PermissionType} parentType 父权限类型
   * @returns {boolean} 是否可以继承
   */
  static canInheritFrom(
    childType: PermissionType,
    parentType: PermissionType,
  ): boolean {
    if (
      !this.isHierarchicalType(childType) ||
      !this.isHierarchicalType(parentType)
    ) {
      return false;
    }

    return this.getLevel(parentType) > this.getLevel(childType);
  }
}
