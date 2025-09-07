import { ValueObject } from '@aiofix/core';

/**
 * @class Action
 * @description
 * 操作值对象，封装权限操作的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 操作名称一旦创建不可变更
 * 2. 操作名称必须符合命名规范
 * 3. 操作名称在系统内必须唯一
 *
 * 相等性判断：
 * 1. 基于操作名称的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装操作名称验证逻辑
 * 2. 提供操作名称标准化方法
 * 3. 隐藏操作名称格式细节
 *
 * @property {string} value 标准化的操作名称值
 *
 * @example
 * ```typescript
 * const action1 = new Action('Read');
 * const action2 = new Action('read');
 * console.log(action1.equals(action2)); // true
 * ```
 * @since 1.0.0
 */
export class Action extends ValueObject<string> {
  private static readonly MIN_LENGTH = 1;
  private static readonly MAX_LENGTH = 50;
  private static readonly VALID_CHARS_REGEX = /^[a-zA-Z][a-zA-Z0-9._-]*$/;
  private static readonly STANDARD_ACTIONS = [
    'create',
    'read',
    'update',
    'delete',
    'list',
    'search',
    'export',
    'import',
    'approve',
    'reject',
    'assign',
    'revoke',
    'activate',
    'deactivate',
    'suspend',
    'restore',
    'archive',
  ];

  constructor(value: string) {
    const normalizedValue = Action.normalizeAction(value);
    super(normalizedValue);
    this.validateAction(this.value);
  }

  /**
   * @method normalizeAction
   * @description 标准化操作名称
   * @param {string} value 原始操作名称
   * @returns {string} 标准化后的操作名称
   * @private
   * @static
   */
  private static normalizeAction(value: string): string {
    return value.trim().toLowerCase();
  }

  /**
   * @method validateAction
   * @description 验证操作名称的有效性
   * @param {string} value 操作名称值
   * @returns {void}
   * @throws {InvalidActionError} 当操作名称无效时抛出
   * @private
   */
  private validateAction(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new InvalidActionError('操作名称不能为空');
    }

    if (value.length < Action.MIN_LENGTH) {
      throw new InvalidActionError(
        `操作名称长度不能少于${Action.MIN_LENGTH}个字符`,
      );
    }

    if (value.length > Action.MAX_LENGTH) {
      throw new InvalidActionError(
        `操作名称长度不能超过${Action.MAX_LENGTH}个字符`,
      );
    }

    if (!Action.VALID_CHARS_REGEX.test(value)) {
      throw new InvalidActionError(
        '操作名称只能包含字母、数字、点、下划线和连字符，且必须以字母开头',
      );
    }
  }

  /**
   * @method isStandardAction
   * @description 检查是否为标准操作
   * @returns {boolean} 是否为标准操作
   */
  isStandardAction(): boolean {
    return Action.STANDARD_ACTIONS.includes(this.value);
  }

  /**
   * @method isReadAction
   * @description 检查是否为读操作
   * @returns {boolean} 是否为读操作
   */
  isReadAction(): boolean {
    return ['read', 'list', 'search', 'export'].includes(this.value);
  }

  /**
   * @method isWriteAction
   * @description 检查是否为写操作
   * @returns {boolean} 是否为写操作
   */
  isWriteAction(): boolean {
    return ['create', 'update', 'delete', 'import'].includes(this.value);
  }

  /**
   * @method isAdminAction
   * @description 检查是否为管理操作
   * @returns {boolean} 是否为管理操作
   */
  isAdminAction(): boolean {
    return [
      'approve',
      'reject',
      'assign',
      'revoke',
      'activate',
      'deactivate',
      'suspend',
      'restore',
    ].includes(this.value);
  }

  /**
   * @method getActionCategory
   * @description 获取操作分类
   * @returns {string} 操作分类
   */
  getActionCategory(): string {
    if (this.isReadAction()) {
      return 'read';
    }
    if (this.isWriteAction()) {
      return 'write';
    }
    if (this.isAdminAction()) {
      return 'admin';
    }
    return 'custom';
  }

  /**
   * @method getActionPriority
   * @description 获取操作优先级
   * @returns {number} 操作优先级（数字越大优先级越高）
   */
  getActionPriority(): number {
    const priorities: Record<string, number> = {
      read: 1,
      list: 1,
      search: 1,
      export: 2,
      create: 3,
      update: 4,
      delete: 5,
      import: 3,
      approve: 6,
      reject: 6,
      assign: 7,
      revoke: 7,
      activate: 8,
      deactivate: 8,
      suspend: 9,
      restore: 9,
      archive: 10,
    };
    return priorities[this.value] || 0;
  }

  /**
   * @method requiresConfirmation
   * @description 检查操作是否需要确认
   * @returns {boolean} 是否需要确认
   */
  requiresConfirmation(): boolean {
    return ['delete', 'revoke', 'suspend', 'archive'].includes(this.value);
  }

  /**
   * @method isDestructive
   * @description 检查操作是否具有破坏性
   * @returns {boolean} 是否具有破坏性
   */
  isDestructive(): boolean {
    return ['delete', 'revoke', 'suspend', 'archive'].includes(this.value);
  }

  /**
   * @method toString
   * @description 将操作名称转换为字符串
   * @returns {string} 操作名称字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method toJSON
   * @description 将操作名称转换为JSON格式
   * @returns {string} 操作名称字符串
   */
  toJSON(): string {
    return this.value;
  }
}

/**
 * @class InvalidActionError
 * @description 无效操作错误
 * @extends Error
 */
export class InvalidActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidActionError';
  }
}
