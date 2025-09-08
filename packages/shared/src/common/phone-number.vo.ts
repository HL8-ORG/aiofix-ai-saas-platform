import { ValueObject } from '@aiofix/core';

/**
 * @enum PhoneRegion
 * @description 手机号地区枚举
 */
export enum PhoneRegion {
  CHINA_MAINLAND = 'CHINA_MAINLAND',
  HONG_KONG = 'HONG_KONG',
  MACAU = 'MACAU',
  TAIWAN = 'TAIWAN',
  USA = 'USA',
  UK = 'UK',
  JAPAN = 'JAPAN',
  SOUTH_KOREA = 'SOUTH_KOREA',
  SINGAPORE = 'SINGAPORE',
  MALAYSIA = 'MALAYSIA',
  THAILAND = 'THAILAND',
  VIETNAM = 'VIETNAM',
  PHILIPPINES = 'PHILIPPINES',
  INDONESIA = 'INDONESIA',
  INDIA = 'INDIA',
  AUSTRALIA = 'AUSTRALIA',
  GERMANY = 'GERMANY',
  FRANCE = 'FRANCE',
  ITALY = 'ITALY',
  SPAIN = 'SPAIN',
  RUSSIA = 'RUSSIA',
  BRAZIL = 'BRAZIL',
  MEXICO = 'MEXICO',
  ARGENTINA = 'ARGENTINA',
  CHILE = 'CHILE',
  COLOMBIA = 'COLOMBIA',
  PERU = 'PERU',
  VENEZUELA = 'VENEZUELA',
  SOUTH_AFRICA = 'SOUTH_AFRICA',
  EGYPT = 'EGYPT',
  NIGERIA = 'NIGERIA',
  KENYA = 'KENYA',
  GHANA = 'GHANA',
  LANDLINE = 'LANDLINE',
  OTHER = 'OTHER',
}

/**
 * @interface PhoneNumberData
 * @description 手机号数据接口
 */
export interface PhoneNumberData {
  readonly number: string;
  readonly countryCode: string;
  readonly region: PhoneRegion;
}

/**
 * @class PhoneNumber
 * @description
 * 通用手机号值对象，封装手机号码的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 手机号一旦创建不可变更
 * 2. 手机号格式必须符合国际标准
 * 3. 支持多地区号码格式验证
 * 4. 手机号必须有效且可接收短信
 *
 * 相等性判断：
 * 1. 基于标准化后的手机号进行相等性比较
 * 2. 忽略格式差异
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装手机号验证逻辑
 * 2. 提供手机号标准化方法
 * 3. 隐藏手机号格式细节
 *
 * @property {PhoneNumberData} value 手机号数据
 *
 * @example
 * ```typescript
 * const phone1 = PhoneNumber.create('13800138000', '+86');
 * const phone2 = PhoneNumber.create('+86 138 0013 8000');
 * console.log(phone1.equals(phone2)); // true
 * ```
 * @since 1.0.0
 */
export class PhoneNumber extends ValueObject<PhoneNumberData> {
  constructor(data: PhoneNumberData) {
    super(data);
    this.validate();
  }

  /**
   * @method create
   * @description 创建手机号值对象的静态工厂方法
   * @param {string} number 手机号码
   * @param {string} [countryCode] 国家代码，默认为中国大陆
   * @returns {PhoneNumber} 手机号值对象
   * @throws {InvalidPhoneNumberError} 当手机号格式无效时抛出
   * @static
   */
  public static create(
    number: string,
    countryCode: string = '+86',
  ): PhoneNumber {
    const region = PhoneNumber.detectRegion(countryCode);
    const normalizedNumber = PhoneNumber.normalizeNumber(number, region);

    PhoneNumber.validateNumber(normalizedNumber, region);

    return new PhoneNumber({
      number: normalizedNumber,
      countryCode,
      region,
    });
  }

  /**
   * @method fromInternationalFormat
   * @description 从国际格式创建手机号
   * @param {string} internationalNumber 国际格式号码（如：+86 138 0013 8000）
   * @returns {PhoneNumber} 手机号值对象
   * @static
   */
  public static fromInternationalFormat(
    internationalNumber: string,
  ): PhoneNumber {
    // 提取国家代码和号码
    const match = internationalNumber.match(/^\+(\d{1,4})\s*(.+)$/);
    if (!match) {
      throw new InvalidPhoneNumberError('无效的国际格式号码');
    }

    const countryCode = `+${match[1]}`;
    const number = match[2].replace(/\s/g, '');

    return PhoneNumber.create(number, countryCode);
  }

  /**
   * @method getNumber
   * @description 获取手机号码
   * @returns {string} 手机号码
   */
  public getNumber(): string {
    return this.value.number;
  }

  /**
   * @method getCountryCode
   * @description 获取国家代码
   * @returns {string} 国家代码
   */
  public getCountryCode(): string {
    return this.value.countryCode;
  }

  /**
   * @method getRegion
   * @description 获取地区信息
   * @returns {PhoneRegion} 地区信息
   */
  public getRegion(): PhoneRegion {
    return this.value.region;
  }

  /**
   * @method getInternationalFormat
   * @description 获取完整国际格式号码
   * @returns {string} 完整国际格式号码
   */
  public getInternationalFormat(): string {
    return `${this.value.countryCode}${this.value.number}`;
  }

  /**
   * @method getLocalFormat
   * @description 获取本地格式号码
   * @returns {string} 本地格式号码
   */
  public getLocalFormat(): string {
    return this.value.number;
  }

  /**
   * @method getDisplayFormat
   * @description 获取显示格式号码（带空格分隔）
   * @returns {string} 显示格式号码
   */
  public getDisplayFormat(): string {
    const international = this.getInternationalFormat();
    // 简单的格式化：每3-4位数字后加空格
    return international.replace(/(\d{3,4})(?=\d)/g, '$1 ');
  }

  /**
   * @method isValid
   * @description 检查是否为有效号码
   * @returns {boolean} 是否为有效号码
   */
  public isValid(): boolean {
    try {
      PhoneNumber.validateNumber(this.value.number, this.value.region);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method canReceiveSms
   * @description 检查是否支持短信接收
   * @returns {boolean} 是否支持短信接收
   */
  public canReceiveSms(): boolean {
    // 某些号码类型不支持短信接收
    return this.value.region !== PhoneRegion.LANDLINE;
  }

  /**
   * @method canReceiveCall
   * @description 检查是否支持电话接收
   * @returns {boolean} 是否支持电话接收
   */
  public canReceiveCall(): boolean {
    // 所有有效号码都支持电话接收
    return this.isValid();
  }

  /**
   * @method isMobile
   * @description 检查是否为手机号码
   * @returns {boolean} 是否为手机号码
   */
  public isMobile(): boolean {
    return this.value.region !== PhoneRegion.LANDLINE;
  }

  /**
   * @method isLandline
   * @description 检查是否为固定电话
   * @returns {boolean} 是否为固定电话
   */
  public isLandline(): boolean {
    return this.value.region === PhoneRegion.LANDLINE;
  }

  /**
   * @method equals
   * @description 比较两个手机号是否相等
   * @param {PhoneNumber} other 另一个手机号对象
   * @returns {boolean} 是否相等
   */
  public equals(other: PhoneNumber): boolean {
    if (!(other instanceof PhoneNumber)) {
      return false;
    }
    return (
      this.value.number === other.value.number &&
      this.value.countryCode === other.value.countryCode
    );
  }

  /**
   * @method toString
   * @description 返回手机号的字符串表示
   * @returns {string} 手机号字符串
   */
  public toString(): string {
    return this.getInternationalFormat();
  }

  /**
   * @method toJSON
   * @description 将手机号转换为JSON格式
   * @returns {PhoneNumberData} 手机号数据
   */
  public toJSON(): PhoneNumberData {
    return {
      number: this.value.number,
      countryCode: this.value.countryCode,
      region: this.value.region,
    };
  }

  /**
   * @method validate
   * @description 验证手机号数据的有效性
   * @returns {void}
   * @throws {InvalidPhoneNumberError} 当手机号数据无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.value.number || !this.value.countryCode || !this.value.region) {
      throw new InvalidPhoneNumberError('手机号数据不完整');
    }

    PhoneNumber.validateNumber(this.value.number, this.value.region);
  }

  /**
   * @method detectRegion
   * @description 检测地区信息
   * @param {string} countryCode 国家代码
   * @returns {PhoneRegion} 地区信息
   * @private
   * @static
   */
  private static detectRegion(countryCode: string): PhoneRegion {
    const regionMap: Record<string, PhoneRegion> = {
      '+86': PhoneRegion.CHINA_MAINLAND,
      '+852': PhoneRegion.HONG_KONG,
      '+853': PhoneRegion.MACAU,
      '+886': PhoneRegion.TAIWAN,
      '+1': PhoneRegion.USA,
      '+44': PhoneRegion.UK,
      '+81': PhoneRegion.JAPAN,
      '+82': PhoneRegion.SOUTH_KOREA,
      '+65': PhoneRegion.SINGAPORE,
      '+60': PhoneRegion.MALAYSIA,
      '+66': PhoneRegion.THAILAND,
      '+84': PhoneRegion.VIETNAM,
      '+63': PhoneRegion.PHILIPPINES,
      '+62': PhoneRegion.INDONESIA,
      '+91': PhoneRegion.INDIA,
      '+61': PhoneRegion.AUSTRALIA,
      '+49': PhoneRegion.GERMANY,
      '+33': PhoneRegion.FRANCE,
      '+39': PhoneRegion.ITALY,
      '+34': PhoneRegion.SPAIN,
      '+7': PhoneRegion.RUSSIA,
      '+55': PhoneRegion.BRAZIL,
      '+52': PhoneRegion.MEXICO,
      '+54': PhoneRegion.ARGENTINA,
      '+56': PhoneRegion.CHILE,
      '+57': PhoneRegion.COLOMBIA,
      '+51': PhoneRegion.PERU,
      '+58': PhoneRegion.VENEZUELA,
      '+27': PhoneRegion.SOUTH_AFRICA,
      '+20': PhoneRegion.EGYPT,
      '+234': PhoneRegion.NIGERIA,
      '+254': PhoneRegion.KENYA,
      '+233': PhoneRegion.GHANA,
    };

    return regionMap[countryCode] || PhoneRegion.OTHER;
  }

  /**
   * @method normalizeNumber
   * @description 标准化手机号码
   * @param {string} number 原始号码
   * @param {PhoneRegion} region 地区信息
   * @returns {string} 标准化号码
   * @private
   * @static
   */
  private static normalizeNumber(number: string, region: PhoneRegion): string {
    // 移除所有非数字字符
    let normalized = number.replace(/\D/g, '');

    // 根据地区规则标准化
    switch (region) {
      case PhoneRegion.CHINA_MAINLAND:
        // 中国大陆：移除国家代码86，保留11位号码
        if (normalized.startsWith('86') && normalized.length === 13) {
          normalized = normalized.substring(2);
        }
        break;
      case PhoneRegion.HONG_KONG:
        // 香港：移除国家代码852，保留8位号码
        if (normalized.startsWith('852') && normalized.length === 11) {
          normalized = normalized.substring(3);
        }
        break;
      case PhoneRegion.TAIWAN:
        // 台湾：移除国家代码886，保留9位号码
        if (normalized.startsWith('886') && normalized.length === 12) {
          normalized = normalized.substring(3);
        }
        break;
      case PhoneRegion.USA:
        // 美国：移除国家代码1，保留10位号码
        if (normalized.startsWith('1') && normalized.length === 11) {
          normalized = normalized.substring(1);
        }
        break;
      default:
        // 其他地区保持原样
        break;
    }

    return normalized;
  }

  /**
   * @method validateNumber
   * @description 验证手机号码格式
   * @param {string} number 手机号码
   * @param {PhoneRegion} region 地区信息
   * @throws {InvalidPhoneNumberError} 当手机号格式无效时抛出
   * @private
   * @static
   */
  private static validateNumber(number: string, region: PhoneRegion): void {
    if (!number || number.length === 0) {
      throw new InvalidPhoneNumberError('手机号码不能为空');
    }

    // 根据地区验证格式
    switch (region) {
      case PhoneRegion.CHINA_MAINLAND:
        if (!/^1[3-9]\d{9}$/.test(number)) {
          throw new InvalidPhoneNumberError('中国大陆手机号格式无效');
        }
        break;
      case PhoneRegion.HONG_KONG:
        if (!/^[5-9]\d{7}$/.test(number)) {
          throw new InvalidPhoneNumberError('香港手机号格式无效');
        }
        break;
      case PhoneRegion.TAIWAN:
        if (!/^09\d{8}$/.test(number)) {
          throw new InvalidPhoneNumberError('台湾手机号格式无效');
        }
        break;
      case PhoneRegion.USA:
        if (!/^\d{10}$/.test(number)) {
          throw new InvalidPhoneNumberError('美国手机号格式无效');
        }
        break;
      default:
        // 其他地区的基本验证
        if (number.length < 7 || number.length > 15) {
          throw new InvalidPhoneNumberError('手机号长度无效');
        }
        break;
    }
  }

  /**
   * @method isValid
   * @description 检查字符串是否为有效的手机号格式
   * @param {string} number 要检查的字符串
   * @param {string} [countryCode] 国家代码
   * @returns {boolean} 是否为有效的手机号格式
   * @static
   */
  public static isValid(number: string, countryCode: string = '+86'): boolean {
    try {
      PhoneNumber.create(number, countryCode);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * @class InvalidPhoneNumberError
 * @description
 * 无效手机号异常，当手机号格式不符合业务规则时抛出。
 *
 * 业务规则：
 * 1. 当手机号格式无效时抛出
 * 2. 当手机号为空时抛出
 * 3. 提供清晰的错误信息
 *
 * @example
 * ```typescript
 * try {
 *   PhoneNumber.create('invalid-number');
 * } catch (error) {
 *   console.log(error instanceof InvalidPhoneNumberError); // true
 * }
 * ```
 * @since 1.0.0
 */
export class InvalidPhoneNumberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhoneNumberError';
  }
}
