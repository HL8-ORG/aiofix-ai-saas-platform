import { ValueObject } from '@aiofix/core';

/**
 * @interface PermissionScopeData
 * @description 权限范围数据接口
 */
export interface PermissionScopeData {
  readonly level:
    | 'platform'
    | 'tenant'
    | 'organization'
    | 'department'
    | 'user';
  readonly tenantId?: string;
  readonly organizationId?: string;
  readonly departmentId?: string;
  readonly userId?: string;
}

/**
 * @class PermissionScope
 * @description
 * 权限范围值对象，封装权限作用域的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 权限范围一旦创建不可变更
 * 2. 权限范围必须符合层级关系
 * 3. 权限范围ID必须有效
 *
 * 相等性判断：
 * 1. 基于权限范围的完整数据进行比较
 * 2. 支持权限范围的精确匹配
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装权限范围验证逻辑
 * 2. 提供权限范围比较方法
 * 3. 隐藏权限范围格式细节
 *
 * @property {PermissionScopeData} value 权限范围数据
 *
 * @example
 * ```typescript
 * const scope = new PermissionScope({
 *   level: 'tenant',
 *   tenantId: 'tenant-123'
 * });
 * console.log(scope.includes(organizationScope)); // true
 * ```
 * @since 1.0.0
 */
export class PermissionScope extends ValueObject<PermissionScopeData> {
  constructor(data: PermissionScopeData) {
    const validatedData = PermissionScope.validateAndNormalizeScope(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizeScope
   * @description 验证并标准化权限范围数据
   * @param {PermissionScopeData} data 原始范围数据
   * @returns {PermissionScopeData} 验证后的范围数据
   * @throws {InvalidPermissionScopeError} 当范围数据无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizeScope(
    data: PermissionScopeData,
  ): PermissionScopeData {
    if (!data || typeof data !== 'object') {
      throw new InvalidPermissionScopeError('权限范围数据不能为空');
    }

    const validLevels = [
      'platform',
      'tenant',
      'organization',
      'department',
      'user',
    ];
    if (!data.level || !validLevels.includes(data.level)) {
      throw new InvalidPermissionScopeError(
        `无效的权限范围级别：${data.level}。支持的级别：${validLevels.join(', ')}`,
      );
    }

    // 验证层级关系
    if (data.level === 'tenant' && !data.tenantId) {
      throw new InvalidPermissionScopeError('租户级权限范围必须指定租户ID');
    }

    if (
      data.level === 'organization' &&
      (!data.tenantId || !data.organizationId)
    ) {
      throw new InvalidPermissionScopeError(
        '组织级权限范围必须指定租户ID和组织ID',
      );
    }

    if (
      data.level === 'department' &&
      (!data.tenantId || !data.organizationId || !data.departmentId)
    ) {
      throw new InvalidPermissionScopeError(
        '部门级权限范围必须指定租户ID、组织ID和部门ID',
      );
    }

    if (data.level === 'user' && (!data.tenantId || !data.userId)) {
      throw new InvalidPermissionScopeError(
        '用户级权限范围必须指定租户ID和用户ID',
      );
    }

    return {
      level: data.level,
      tenantId: data.tenantId,
      organizationId: data.organizationId,
      departmentId: data.departmentId,
      userId: data.userId,
    };
  }

  /**
   * @method getLevel
   * @description 获取权限范围级别
   * @returns {string} 权限范围级别
   */
  getLevel(): string {
    return this.value.level;
  }

  /**
   * @method getTenantId
   * @description 获取租户ID
   * @returns {string | undefined} 租户ID
   */
  getTenantId(): string | undefined {
    return this.value.tenantId;
  }

  /**
   * @method getOrganizationId
   * @description 获取组织ID
   * @returns {string | undefined} 组织ID
   */
  getOrganizationId(): string | undefined {
    return this.value.organizationId;
  }

  /**
   * @method getDepartmentId
   * @description 获取部门ID
   * @returns {string | undefined} 部门ID
   */
  getDepartmentId(): string | undefined {
    return this.value.departmentId;
  }

  /**
   * @method getUserId
   * @description 获取用户ID
   * @returns {string | undefined} 用户ID
   */
  getUserId(): string | undefined {
    return this.value.userId;
  }

  /**
   * @method isPlatformLevel
   * @description 检查是否为平台级权限范围
   * @returns {boolean} 是否为平台级权限范围
   */
  isPlatformLevel(): boolean {
    return this.value.level === 'platform';
  }

  /**
   * @method isTenantLevel
   * @description 检查是否为租户级权限范围
   * @returns {boolean} 是否为租户级权限范围
   */
  isTenantLevel(): boolean {
    return this.value.level === 'tenant';
  }

  /**
   * @method isOrganizationLevel
   * @description 检查是否为组织级权限范围
   * @returns {boolean} 是否为组织级权限范围
   */
  isOrganizationLevel(): boolean {
    return this.value.level === 'organization';
  }

  /**
   * @method isDepartmentLevel
   * @description 检查是否为部门级权限范围
   * @returns {boolean} 是否为部门级权限范围
   */
  isDepartmentLevel(): boolean {
    return this.value.level === 'department';
  }

  /**
   * @method isUserLevel
   * @description 检查是否为用户级权限范围
   * @returns {boolean} 是否为用户级权限范围
   */
  isUserLevel(): boolean {
    return this.value.level === 'user';
  }

  /**
   * @method getLevelPriority
   * @description 获取权限范围级别优先级
   * @returns {number} 级别优先级（数字越大优先级越高）
   */
  getLevelPriority(): number {
    const priorities: Record<string, number> = {
      platform: 5,
      tenant: 4,
      organization: 3,
      department: 2,
      user: 1,
    };
    return priorities[this.value.level] || 0;
  }

  /**
   * @method includes
   * @description 检查当前权限范围是否包含另一个权限范围
   * @param {PermissionScope} otherScope 另一个权限范围
   * @returns {boolean} 是否包含
   */
  includes(otherScope: PermissionScope): boolean {
    // 平台级包含所有级别
    if (this.isPlatformLevel()) {
      return true;
    }

    // 租户级包含组织级、部门级和用户级
    if (this.isTenantLevel()) {
      if (otherScope.isPlatformLevel()) {
        return false;
      }
      return this.value.tenantId === otherScope.value.tenantId;
    }

    // 组织级包含部门级和用户级
    if (this.isOrganizationLevel()) {
      if (otherScope.isPlatformLevel() || otherScope.isTenantLevel()) {
        return false;
      }
      return (
        this.value.tenantId === otherScope.value.tenantId &&
        this.value.organizationId === otherScope.value.organizationId
      );
    }

    // 部门级包含用户级
    if (this.isDepartmentLevel()) {
      if (otherScope.isUserLevel()) {
        return (
          this.value.tenantId === otherScope.value.tenantId &&
          this.value.organizationId === otherScope.value.organizationId &&
          this.value.departmentId === otherScope.value.departmentId
        );
      }
      return false;
    }

    // 用户级只能包含自己
    if (this.isUserLevel()) {
      return (
        this.value.tenantId === otherScope.value.tenantId &&
        this.value.userId === otherScope.value.userId
      );
    }

    return false;
  }

  /**
   * @method intersects
   * @description 检查当前权限范围是否与另一个权限范围相交
   * @param {PermissionScope} otherScope 另一个权限范围
   * @returns {boolean} 是否相交
   */
  intersects(otherScope: PermissionScope): boolean {
    return this.includes(otherScope) || otherScope.includes(this);
  }

  /**
   * @method equals
   * @description 检查两个权限范围是否相等
   * @param {PermissionScope} otherScope 另一个权限范围
   * @returns {boolean} 是否相等
   */
  equals(otherScope: PermissionScope): boolean {
    return (
      this.value.level === otherScope.value.level &&
      this.value.tenantId === otherScope.value.tenantId &&
      this.value.organizationId === otherScope.value.organizationId &&
      this.value.departmentId === otherScope.value.departmentId &&
      this.value.userId === otherScope.value.userId
    );
  }

  /**
   * @method toString
   * @description 将权限范围转换为字符串
   * @returns {string} 权限范围字符串表示
   */
  toString(): string {
    const { level, tenantId, organizationId, departmentId, userId } =
      this.value;
    const parts: string[] = [level];

    if (tenantId) parts.push(`tenant:${tenantId}`);
    if (organizationId) parts.push(`org:${organizationId}`);
    if (departmentId) parts.push(`dept:${departmentId}`);
    if (userId) parts.push(`user:${userId}`);

    return parts.join(':');
  }

  /**
   * @method toJSON
   * @description 将权限范围转换为JSON格式
   * @returns {PermissionScopeData} 权限范围数据
   */
  toJSON(): PermissionScopeData {
    return {
      level: this.value.level,
      tenantId: this.value.tenantId,
      organizationId: this.value.organizationId,
      departmentId: this.value.departmentId,
      userId: this.value.userId,
    };
  }
}

/**
 * @class InvalidPermissionScopeError
 * @description 无效权限范围错误
 * @extends Error
 */
export class InvalidPermissionScopeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPermissionScopeError';
  }
}
