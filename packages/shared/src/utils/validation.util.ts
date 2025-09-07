/**
 * @file validation.util.ts
 * @description 验证相关工具函数
 *
 * 提供数据验证相关的纯函数工具
 */

/**
 * @class ValidationUtils
 * @description 验证工具类
 *
 * 提供通用的数据验证方法
 */
export class ValidationUtils {
  /**
   * @method isNotEmpty
   * @description 检查值是否不为空
   * @param {any} value 要检查的值
   * @returns {boolean} 是否不为空
   */
  public static isNotEmpty(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  /**
   * @method isString
   * @description 检查值是否为字符串
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为字符串
   */
  public static isString(value: any): boolean {
    return typeof value === 'string';
  }

  /**
   * @method isNumber
   * @description 检查值是否为数字
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为数字
   */
  public static isNumber(value: any): boolean {
    return typeof value === 'number' && !isNaN(value);
  }

  /**
   * @method isBoolean
   * @description 检查值是否为布尔值
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为布尔值
   */
  public static isBoolean(value: any): boolean {
    return typeof value === 'boolean';
  }

  /**
   * @method isArray
   * @description 检查值是否为数组
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为数组
   */
  public static isArray(value: any): boolean {
    return Array.isArray(value);
  }

  /**
   * @method isObject
   * @description 检查值是否为对象
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为对象
   */
  public static isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * @method isDate
   * @description 检查值是否为有效日期
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为有效日期
   */
  public static isDate(value: any): boolean {
    return value instanceof Date && !isNaN(value.getTime());
  }

  /**
   * @method isUUID
   * @description 检查值是否为有效UUID
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为有效UUID
   */
  public static isUUID(value: any): boolean {
    if (!this.isString(value)) return false;
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * @method isEmail
   * @description 检查值是否为有效邮箱
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为有效邮箱
   */
  public static isEmail(value: any): boolean {
    if (!this.isString(value)) return false;
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(value);
  }

  /**
   * @method isPhone
   * @description 检查值是否为有效电话号码
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为有效电话号码
   */
  public static isPhone(value: any): boolean {
    if (!this.isString(value)) return false;
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * @method isUrl
   * @description 检查值是否为有效URL
   * @param {any} value 要检查的值
   * @returns {boolean} 是否为有效URL
   */
  public static isUrl(value: any): boolean {
    if (!this.isString(value)) return false;
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method isInRange
   * @description 检查数值是否在指定范围内
   * @param {number} value 要检查的值
   * @param {number} min 最小值
   * @param {number} max 最大值
   * @returns {boolean} 是否在范围内
   */
  public static isInRange(value: number, min: number, max: number): boolean {
    return this.isNumber(value) && value >= min && value <= max;
  }

  /**
   * @method hasLength
   * @description 检查字符串长度是否在指定范围内
   * @param {string} value 要检查的字符串
   * @param {number} min 最小长度
   * @param {number} max 最大长度
   * @returns {boolean} 长度是否在范围内
   */
  public static hasLength(value: string, min: number, max: number): boolean {
    return this.isString(value) && value.length >= min && value.length <= max;
  }
}

/**
 * @class EmailValidator
 * @description 邮箱验证器
 *
 * 提供邮箱相关的验证方法
 */
export class EmailValidator {
  /**
   * @method isValid
   * @description 验证邮箱格式
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否有效
   */
  public static isValid(email: string): boolean {
    return ValidationUtils.isEmail(email);
  }

  /**
   * @method isGmail
   * @description 检查是否为Gmail邮箱
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否为Gmail
   */
  public static isGmail(email: string): boolean {
    if (!this.isValid(email)) return false;
    return email.toLowerCase().endsWith('@gmail.com');
  }

  /**
   * @method isCorporate
   * @description 检查是否为企业邮箱
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否为企业邮箱
   */
  public static isCorporate(email: string): boolean {
    if (!this.isValid(email)) return false;
    const publicDomains = [
      'gmail.com',
      'outlook.com',
      'hotmail.com',
      'yahoo.com',
    ];
    const domain = email.split('@')[1].toLowerCase();
    return !publicDomains.includes(domain);
  }
}

/**
 * @class PhoneValidator
 * @description 电话号码验证器
 *
 * 提供电话号码相关的验证方法
 */
export class PhoneValidator {
  /**
   * @method isValid
   * @description 验证电话号码格式
   * @param {string} phone 电话号码
   * @returns {boolean} 是否有效
   */
  public static isValid(phone: string): boolean {
    return ValidationUtils.isPhone(phone);
  }

  /**
   * @method isChinese
   * @description 检查是否为中国手机号
   * @param {string} phone 电话号码
   * @returns {boolean} 是否为中国手机号
   */
  public static isChinese(phone: string): boolean {
    if (!this.isValid(phone)) return false;
    const chinesePhoneRegex = /^1[3-9]\d{9}$/;
    return chinesePhoneRegex.test(phone.replace(/[\s\-]/g, ''));
  }
}

/**
 * @class PasswordValidator
 * @description 密码验证器
 *
 * 提供密码相关的验证方法
 */
export class PasswordValidator {
  /**
   * @method isValid
   * @description 验证密码强度
   * @param {string} password 密码
   * @returns {boolean} 是否有效
   */
  public static isValid(password: string): boolean {
    if (!ValidationUtils.isString(password)) return false;
    if (!ValidationUtils.hasLength(password, 8, 128)) return false;

    // 至少包含一个大写字母
    if (!/[A-Z]/.test(password)) return false;
    // 至少包含一个小写字母
    if (!/[a-z]/.test(password)) return false;
    // 至少包含一个数字
    if (!/\d/.test(password)) return false;
    // 至少包含一个特殊字符
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;

    return true;
  }

  /**
   * @method getStrength
   * @description 获取密码强度
   * @param {string} password 密码
   * @returns {number} 强度分数 (0-100)
   */
  public static getStrength(password: string): number {
    if (!ValidationUtils.isString(password)) return 0;

    let score = 0;

    // 长度分数
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;

    // 字符类型分数
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 20;

    // 复杂度分数
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= 8) score += 10;

    return Math.min(score, 100);
  }
}
