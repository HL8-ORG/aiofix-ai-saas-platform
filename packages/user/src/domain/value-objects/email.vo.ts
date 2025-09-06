import { ValueObject } from '@aiofix/core';

/**
 * 邮箱值对象
 *
 * 设计原理：
 * - 封装邮箱地址的业务规则和验证逻辑
 * - 确保邮箱格式的正确性和有效性
 * - 提供类型安全的邮箱标识
 *
 * 业务规则：
 * - 邮箱必须符合RFC 5322标准格式
 * - 邮箱不能为空或无效字符串
 * - 邮箱在系统中必须唯一（通过领域服务验证）
 * - 邮箱地址不区分大小写
 */
export class Email extends ValueObject<string> {
  constructor(value: string) {
    super(value.toLowerCase().trim());
    this.validate();
  }

  /**
   * 验证邮箱格式的有效性
   *
   * 业务规则：
   * - 必须符合RFC 5322标准格式
   * - 不能为空或无效字符串
   * - 必须包含@符号和有效的域名
   */
  private validate(): void {
    if (!this._value || this._value.trim().length === 0) {
      throw new InvalidEmailError('Email cannot be empty');
    }

    // 基础格式验证
    if (!this._value.includes('@')) {
      throw new InvalidEmailError('Email must contain @ symbol');
    }

    // RFC 5322 邮箱格式验证
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(this._value)) {
      throw new InvalidEmailError(`Invalid email format: ${this._value}`);
    }

    // 长度验证
    if (this._value.length > 254) {
      throw new InvalidEmailError('Email address is too long');
    }

    // 本地部分长度验证
    const [localPart] = this._value.split('@');
    if (localPart.length > 64) {
      throw new InvalidEmailError('Email local part is too long');
    }
  }

  /**
   * 获取邮箱的本地部分（@符号前的部分）
   *
   * @returns 邮箱本地部分
   */
  public getLocalPart(): string {
    return this._value.split('@')[0];
  }

  /**
   * 获取邮箱的域名部分（@符号后的部分）
   *
   * @returns 邮箱域名部分
   */
  public getDomain(): string {
    return this._value.split('@')[1];
  }

  /**
   * 检查邮箱是否为特定域名
   *
   * @param domain 要检查的域名
   * @returns 是否为指定域名
   */
  public isFromDomain(domain: string): boolean {
    return this.getDomain().toLowerCase() === domain.toLowerCase();
  }

  /**
   * 获取邮箱的字符串表示
   *
   * @returns 邮箱字符串
   */
  public toString(): string {
    return this._value;
  }

  /**
   * 从字符串创建邮箱值对象
   *
   * @param value 邮箱字符串
   * @returns 邮箱值对象
   */
  public static fromString(value: string): Email {
    return new Email(value);
  }
}

/**
 * 无效邮箱异常
 *
 * 业务规则：
 * - 当邮箱格式不符合业务规则时抛出
 * - 提供清晰的错误信息
 */
export class InvalidEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailError';
  }
}
