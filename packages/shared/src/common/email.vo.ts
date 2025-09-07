import { ValueObject } from '@aiofix/core';

/**
 * @class Email
 * @description
 * 邮箱值对象，封装邮箱地址的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 邮箱地址一旦创建不可变更
 * 2. 邮箱格式必须符合RFC 5322标准
 * 3. 邮箱地址不区分大小写
 * 4. 邮箱地址必须有效且完整
 *
 * 相等性判断：
 * 1. 基于邮箱地址的标准化值进行相等性比较
 * 2. 忽略大小写差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装邮箱验证逻辑
 * 2. 提供邮箱标准化方法
 * 3. 隐藏邮箱格式细节
 *
 * @property {string} value 标准化的邮箱地址值
 *
 * @example
 * ```typescript
 * const email1 = new Email('User@Example.COM');
 * const email2 = new Email('user@example.com');
 * console.log(email1.equals(email2)); // true
 * ```
 * @since 1.0.0
 */
export class Email extends ValueObject<string> {
  constructor(value: string) {
    super(value.toLowerCase().trim());
    this.validate();
  }

  /**
   * @method validate
   * @description 验证邮箱格式的有效性
   * @returns {void}
   * @throws {InvalidEmailError} 当邮箱格式无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.value || this.value.trim().length === 0) {
      throw new InvalidEmailError('邮箱地址不能为空');
    }

    // 基础格式验证
    if (!this.value.includes('@')) {
      throw new InvalidEmailError('邮箱地址必须包含@符号');
    }

    // RFC 5322 邮箱格式验证
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(this.value)) {
      throw new InvalidEmailError(`无效的邮箱格式: ${this.value}`);
    }

    // 长度验证
    if (this.value.length > 254) {
      throw new InvalidEmailError('邮箱地址过长');
    }

    // 本地部分长度验证
    const [localPart] = this.value.split('@');
    if (localPart.length > 64) {
      throw new InvalidEmailError('邮箱本地部分过长');
    }
  }

  /**
   * @method equals
   * @description 比较两个邮箱对象是否相等，忽略大小写
   * @param {Email} other 另一个邮箱对象
   * @returns {boolean} 是否相等
   */
  equals(other: Email): boolean {
    if (!(other instanceof Email)) {
      return false;
    }
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * @method getLocalPart
   * @description 获取邮箱的本地部分（@符号前的部分）
   * @returns {string} 邮箱本地部分
   */
  getLocalPart(): string {
    return this.value.split('@')[0];
  }

  /**
   * @method getDomain
   * @description 获取邮箱的域名部分（@符号后的部分）
   * @returns {string} 邮箱域名部分
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * @method isFromDomain
   * @description 检查邮箱是否为特定域名
   * @param {string} domain 要检查的域名
   * @returns {boolean} 是否为指定域名
   */
  isFromDomain(domain: string): boolean {
    return this.getDomain().toLowerCase() === domain.toLowerCase();
  }

  /**
   * @method isGmail
   * @description 检查是否为Gmail邮箱
   * @returns {boolean} 是否为Gmail邮箱
   */
  isGmail(): boolean {
    return this.isFromDomain('gmail.com');
  }

  /**
   * @method isOutlook
   * @description 检查是否为Outlook邮箱
   * @returns {boolean} 是否为Outlook邮箱
   */
  isOutlook(): boolean {
    return this.isFromDomain('outlook.com') || this.isFromDomain('hotmail.com');
  }

  /**
   * @method isCorporate
   * @description 检查是否为企业邮箱（非公共邮箱服务）
   * @returns {boolean} 是否为企业邮箱
   */
  isCorporate(): boolean {
    const publicDomains = [
      'gmail.com',
      'outlook.com',
      'hotmail.com',
      'yahoo.com',
      'qq.com',
      '163.com',
      '126.com',
    ];
    return !publicDomains.includes(this.getDomain().toLowerCase());
  }

  /**
   * @method toString
   * @description 返回邮箱地址的字符串表示
   * @returns {string} 邮箱地址字符串
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method fromString
   * @description 从字符串创建邮箱值对象
   * @param {string} value 邮箱字符串
   * @returns {Email} 邮箱值对象
   * @static
   */
  static fromString(value: string): Email {
    return new Email(value);
  }

  /**
   * @method isValid
   * @description 检查字符串是否为有效的邮箱格式
   * @param {string} value 要检查的字符串
   * @returns {boolean} 是否为有效的邮箱格式
   * @static
   */
  static isValid(value: string): boolean {
    try {
      new Email(value);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @class InvalidEmailError
 * @description
 * 无效邮箱异常，当邮箱格式不符合业务规则时抛出。
 *
 * 业务规则：
 * 1. 当邮箱格式无效时抛出
 * 2. 当邮箱为空时抛出
 * 3. 提供清晰的错误信息
 *
 * @example
 * ```typescript
 * try {
 *   new Email('invalid-email');
 * } catch (error) {
 *   console.log(error instanceof InvalidEmailError); // true
 * }
 * ```
 * @since 1.0.0
 */
export class InvalidEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailError';
  }
}
