/**
 * 值对象基类
 *
 * 设计原理：
 * - 值对象是不可变的
 * - 值对象通过值相等性进行比较
 * - 值对象不包含标识符
 * - 值对象封装业务概念和规则
 *
 * 业务规则：
 * - 值对象一旦创建就不能修改
 * - 值对象通过值而不是引用进行比较
 * - 值对象可以包含验证逻辑
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
    if (other === null || other === undefined) {
      return false;
    }

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
  private deepEquals(a: any, b: any): boolean {
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
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (!this.deepEquals(a[i], b[i])) {
            return false;
          }
        }
        return true;
      }

      const keysA = Object.keys(a);
      const keysB = Object.keys(b);

      if (keysA.length !== keysB.length) {
        return false;
      }

      for (const key of keysA) {
        if (!keysB.includes(key)) {
          return false;
        }
        if (!this.deepEquals(a[key], b[key])) {
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
