/**
 * @class ValueObject
 * @description
 * 值对象基类，封装不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 值对象一旦创建不可变更
 * 2. 所有属性都是只读的
 * 3. 通过Object.freeze确保不可变性
 *
 * 相等性判断：
 * 1. 基于值而不是引用进行相等性比较
 * 2. 支持深度比较复杂对象
 * 3. 提供哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装业务概念和验证逻辑
 * 2. 提供类型安全的业务操作
 * 3. 隐藏实现细节，暴露业务接口
 *
 * @property {T} _value 值对象的内部值，不可变
 *
 * @example
 * ```typescript
 * class Email extends ValueObject<string> {
 *   constructor(value: string) {
 *     super(value);
 *     this.validateEmail(value);
 *   }
 *
 *   private validateEmail(email: string): void {
 *     if (!email.includes('@')) {
 *       throw new Error('Invalid email format');
 *     }
 *   }
 * }
 *
 * const email1 = new Email('user@example.com');
 * const email2 = new Email('user@example.com');
 * console.log(email1.equals(email2)); // true
 * ```
 * @template T 值对象的类型
 * @abstract
 * @since 1.0.0
 */
export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = Object.freeze(value);
  }

  /**
   * 获取值对象的值
   *
   * @returns 值对象的值
   */
  public get value(): T {
    return this._value;
  }

  /**
   * 比较两个值对象是否相等
   *
   * @param other 另一个值对象
   * @returns 是否相等
   */
  public equals(other: ValueObject<T>): boolean {
    if (this === other) {
      return true;
    }

    return this.deepEquals(this._value, other._value);
  }

  /**
   * 深度比较两个值是否相等
   *
   * @param a 第一个值
   * @param b 第二个值
   * @returns 是否相等
   */
  private deepEquals(a: unknown, b: unknown): boolean {
    if (a === b) {
      return true;
    }

    if (a === null || b === null || a === undefined || b === undefined) {
      return false;
    }

    if (typeof a !== typeof b) {
      return false;
    }

    if (typeof a === 'object') {
      if (Array.isArray(a) !== Array.isArray(b)) {
        return false;
      }

      if (Array.isArray(a)) {
        if (!Array.isArray(b) || a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEquals(a[i], b[i])) {
            return false;
          }
        }
        return true;
      }

      const keysA = Object.keys(a as Record<string, unknown>);
      const keysB = Object.keys(b as Record<string, unknown>);

      if (keysA.length !== keysB.length) {
        return false;
      }

      for (const key of keysA) {
        if (!keysB.includes(key)) {
          return false;
        }
        if (
          !this.deepEquals(
            (a as Record<string, unknown>)[key],
            (b as Record<string, unknown>)[key],
          )
        ) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * 获取值对象的字符串表示
   *
   * @returns 字符串表示
   */
  public toString(): string {
    if (typeof this._value === 'string') {
      return this._value;
    }
    return JSON.stringify(this._value);
  }

  /**
   * 获取值对象的哈希码
   *
   * @returns 哈希码
   */
  public hashCode(): string {
    return this.toString();
  }
}
