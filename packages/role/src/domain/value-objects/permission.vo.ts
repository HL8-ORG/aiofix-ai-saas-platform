import { ValueObject } from '@aiofix/core';

/**
 * @interface PermissionData
 * @description 权限数据接口
 */
export interface PermissionData {
  readonly resource: string;
  readonly action: string;
  readonly conditions?: Record<string, unknown>;
}

/**
 * @class Permission
 * @description
 * 权限值对象，封装权限的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 权限一旦创建不可变更
 * 2. 权限资源必须存在
 * 3. 权限操作必须有效
 *
 * 相等性判断：
 * 1. 基于权限的资源、操作和条件进行相等性比较
 * 2. 支持权限的精确匹配
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装权限验证逻辑
 * 2. 提供权限匹配方法
 * 3. 隐藏权限格式细节
 *
 * @property {string} resource 权限资源
 * @property {string} action 权限操作
 * @property {Record<string, any>} conditions 权限条件
 *
 * @example
 * ```typescript
 * const permission1 = new Permission('user', 'read');
 * const permission2 = new Permission('user', 'read', { tenantId: 'tenant-123' });
 * console.log(permission1.equals(permission2)); // false
 * ```
 * @since 1.0.0
 */
export class Permission extends ValueObject<PermissionData> {
  constructor(data: PermissionData) {
    const validatedData = Permission.validateAndNormalizePermission(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizePermission
   * @description 验证并标准化权限数据
   * @param {PermissionData} data 原始权限数据
   * @returns {PermissionData} 验证后的权限数据
   * @throws {InvalidPermissionError} 当权限数据无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizePermission(
    data: PermissionData,
  ): PermissionData {
    if (!data || typeof data !== 'object') {
      throw new InvalidPermissionError('权限数据不能为空');
    }

    if (!data.resource || typeof data.resource !== 'string') {
      throw new InvalidPermissionError('权限资源不能为空');
    }

    if (!data.action || typeof data.action !== 'string') {
      throw new InvalidPermissionError('权限操作不能为空');
    }

    // 标准化资源名称
    const normalizedResource = data.resource.trim().toLowerCase();
    if (normalizedResource.length === 0) {
      throw new InvalidPermissionError('权限资源不能为空');
    }

    // 标准化操作名称
    const normalizedAction = data.action.trim().toLowerCase();
    if (normalizedAction.length === 0) {
      throw new InvalidPermissionError('权限操作不能为空');
    }

    return {
      resource: normalizedResource,
      action: normalizedAction,
      conditions: data.conditions || {},
    };
  }

  /**
   * @method getResource
   * @description 获取权限资源
   * @returns {string} 权限资源
   */
  getResource(): string {
    return this.value.resource;
  }

  /**
   * @method getAction
   * @description 获取权限操作
   * @returns {string} 权限操作
   */
  getAction(): string {
    return this.value.action;
  }

  /**
   * @method getConditions
   * @description 获取权限条件
   * @returns {Record<string, unknown>} 权限条件
   */
  getConditions(): Record<string, unknown> {
    return this.value.conditions ?? {};
  }

  /**
   * @method matches
   * @description 检查权限是否匹配指定的资源和操作
   * @param {string} resource 资源名称
   * @param {string} action 操作名称
   * @returns {boolean} 是否匹配
   */
  matches(resource: string, action: string): boolean {
    return (
      this.value.resource === resource.trim().toLowerCase() &&
      this.value.action === action.trim().toLowerCase()
    );
  }

  /**
   * @method hasCondition
   * @description 检查权限是否包含指定条件
   * @param {string} key 条件键
   * @param {any} value 条件值
   * @returns {boolean} 是否包含条件
   */
  hasCondition(key: string, value: unknown): boolean {
    return this.value.conditions?.[key] === value;
  }

  /**
   * @method toString
   * @description 将权限转换为字符串
   * @returns {string} 权限字符串表示
   */
  toString(): string {
    const conditionsStr =
      Object.keys(this.value.conditions ?? {}).length > 0
        ? `:${JSON.stringify(this.value.conditions)}`
        : '';
    return `${this.value.resource}:${this.value.action}${conditionsStr}`;
  }

  /**
   * @method toJSON
   * @description 将权限转换为JSON格式
   * @returns {PermissionData} 权限数据
   */
  toJSON(): PermissionData {
    return {
      resource: this.value.resource,
      action: this.value.action,
      conditions: this.value.conditions,
    };
  }
}

/**
 * @class InvalidPermissionError
 * @description 无效权限错误
 * @extends Error
 */
export class InvalidPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPermissionError';
  }
}
