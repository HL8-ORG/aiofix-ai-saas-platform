import { ValueObject } from '@aiofix/core';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class PlatformId
 * @description
 * 平台ID值对象，封装平台唯一标识符的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 平台ID一旦创建不可变更
 * 2. 平台ID必须符合UUID格式
 * 3. 平台ID在全局范围内唯一
 *
 * 相等性判断：
 * 1. 基于平台ID的字符串值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装平台ID验证逻辑
 * 2. 提供平台ID标准化方法
 * 3. 隐藏平台ID格式细节
 *
 * @property {string} value 平台ID的字符串值
 *
 * @example
 * ```typescript
 * const platformId1 = new PlatformId('123e4567-e89b-12d3-a456-426614174000');
 * const platformId2 = new PlatformId('123e4567-e89b-12d3-a456-426614174000');
 * console.log(platformId1.equals(platformId2)); // true
 * ```
 * @since 1.0.0
 */
export class PlatformId extends ValueObject<string> {
  /**
   * UUID格式验证正则表达式
   */
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /**
   * 构造函数
   *
   * @param {string} value - 平台ID值，如果为空则自动生成UUID
   * @throws {Error} 当平台ID格式无效时抛出错误
   */
  constructor(value?: string) {
    const platformId = value ?? (uuidv4() as string);
    super(platformId);
    this.validatePlatformId(platformId);
  }

  /**
   * 验证平台ID格式
   *
   * @param {string} value - 平台ID值
   * @throws {Error} 当平台ID格式无效时抛出错误
   * @private
   */
  private validatePlatformId(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('平台ID不能为空');
    }

    if (!PlatformId.UUID_REGEX.test(value)) {
      throw new Error('平台ID格式无效，必须是有效的UUID格式');
    }
  }

  /**
   * 获取平台ID的字符串表示
   *
   * @returns {string} 平台ID字符串
   */
  public toString(): string {
    return this.value;
  }

  /**
   * 从字符串创建平台ID
   *
   * @param {string} value - 平台ID字符串
   * @returns {PlatformId} 平台ID实例
   * @throws {Error} 当平台ID格式无效时抛出错误
   */
  public static fromString(value: string): PlatformId {
    return new PlatformId(value);
  }

  /**
   * 生成新的平台ID
   *
   * @returns {PlatformId} 新的平台ID实例
   */
  public static generate(): PlatformId {
    return new PlatformId();
  }

  /**
   * 检查平台ID是否有效
   *
   * @param {string} value - 平台ID字符串
   * @returns {boolean} 是否有效
   */
  public static isValid(value: string): boolean {
    try {
      new PlatformId(value);
      return true;
    } catch (_error) {
      return false;
    }
  }
}
