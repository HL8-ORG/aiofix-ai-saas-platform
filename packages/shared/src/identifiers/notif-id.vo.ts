import { UUIDIdentifier } from './base-identifier.vo';

/**
 * @class NotifId
 * @description
 * 通知ID值对象，封装通知唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 通知ID一旦创建不可变更
 * 2. 通知ID格式必须符合UUID v4标准
 * 3. 通知ID不能为空或无效值
 * 4. 通知ID必须全局唯一
 *
 * 相等性判断：
 * 1. 基于通知ID的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装通知ID验证逻辑
 * 2. 提供通知ID生成方法
 * 3. 隐藏通知ID格式细节
 *
 * @property {string} value 标准化的通知ID值
 *
 * @example
 * ```typescript
 * const notifId1 = NotifId.generate();
 * const notifId2 = NotifId.fromString('123e4567-e89b-12d3-a456-426614174000');
 * console.log(notifId1.equals(notifId2)); // false
 * ```
 * @since 1.0.0
 */
export class NotifId extends UUIDIdentifier {
  /**
   * @method generate
   * @description 生成新的通知ID
   * @returns {NotifId} 新的通知ID实例
   * @static
   */
  static generate(): NotifId {
    return new NotifId();
  }

  /**
   * @method fromString
   * @description 从字符串创建通知ID
   * @param {string} value 通知ID字符串
   * @returns {NotifId} 通知ID实例
   * @static
   */
  static fromString(value: string): NotifId {
    return new NotifId(value);
  }

  /**
   * @method isValid
   * @description 检查字符串是否为有效的通知ID格式
   * @param {string} value 要检查的字符串
   * @returns {boolean} 是否为有效的通知ID格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new NotifId(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method create
   * @description 创建通知ID（与fromString功能相同，提供一致的接口）
   * @param {string} value 通知ID字符串
   * @returns {NotifId} 通知ID实例
   * @static
   */
  static create(value: string): NotifId {
    return NotifId.fromString(value);
  }
}

/**
 * @class InvalidNotifIdError
 * @description
 * 无效通知ID异常，当通知ID不符合业务规则时抛出。
 *
 * 业务规则：
 * 1. 当通知ID格式无效时抛出
 * 2. 当通知ID为空时抛出
 * 3. 提供清晰的错误信息
 *
 * @example
 * ```typescript
 * try {
 *   new NotifId('invalid-id');
 * } catch (error) {
 *   console.log(error instanceof InvalidNotifIdError); // true
 * }
 * ```
 * @since 1.0.0
 */
export class InvalidNotifIdError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidNotifIdError';
  }
}
