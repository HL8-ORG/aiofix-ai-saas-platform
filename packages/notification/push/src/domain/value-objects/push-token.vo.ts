import { ValueObject } from '@aiofix/core';

/**
 * @class PushToken
 * @description
 * 推送令牌值对象，封装推送通知的设备令牌信息。
 *
 * 推送令牌特性：
 * 1. 设备唯一标识符，用于推送通知路由
 * 2. 支持多种推送平台（FCM、APNs、华为推送等）
 * 3. 令牌格式验证和标准化
 * 4. 支持令牌的加密和脱敏处理
 *
 * 业务规则：
 * 1. 令牌必须符合对应平台的格式要求
 * 2. 令牌长度和字符集有严格限制
 * 3. 令牌需要定期更新和验证
 * 4. 支持令牌的批量管理和验证
 *
 * @property {string} value 推送令牌值
 * @property {PushPlatform} platform 推送平台类型
 *
 * @example
 * ```typescript
 * const fcmToken = new PushToken('fcm_token_string', PushPlatform.FCM);
 * const apnsToken = new PushToken('apns_token_string', PushPlatform.APNS);
 * ```
 * @since 1.0.0
 */
export class PushToken extends ValueObject<{
  value: string;
  platform: PushPlatform;
}> {
  /**
   * @constructor
   * @description 创建推送令牌值对象
   * @param {string} value 推送令牌值
   * @param {PushPlatform} platform 推送平台类型
   * @throws {InvalidPushTokenError} 当令牌格式无效时抛出
   */
  constructor(value: string, platform: PushPlatform) {
    super({ value, platform });
    this.validateToken(value, platform);
  }

  /**
   * @method getValue
   * @description 获取推送令牌值
   * @returns {string} 推送令牌值
   */
  getValue(): string {
    return this.value.value;
  }

  /**
   * @method getPlatform
   * @description 获取推送平台类型
   * @returns {PushPlatform} 推送平台类型
   */
  getPlatform(): PushPlatform {
    return this.value.platform;
  }

  /**
   * @method validateToken
   * @description 验证推送令牌格式
   * @param {string} value 推送令牌值
   * @param {PushPlatform} platform 推送平台类型
   * @throws {InvalidPushTokenError} 当令牌格式无效时抛出
   * @private
   */
  private validateToken(value: string, platform: PushPlatform): void {
    if (!value || value.trim().length === 0) {
      throw new InvalidPushTokenError('推送令牌不能为空');
    }

    switch (platform) {
      case PushPlatform.FCM:
        this.validateFCMToken(value);
        break;
      case PushPlatform.APNS:
        this.validateAPNSToken(value);
        break;
      case PushPlatform.HUAWEI:
        this.validateHuaweiToken(value);
        break;
      case PushPlatform.XIAOMI:
        this.validateXiaomiToken(value);
        break;
      default:
        throw new InvalidPushTokenError(`不支持的推送平台: ${platform}`);
    }
  }

  /**
   * @method validateFCMToken
   * @description 验证FCM令牌格式
   * @param {string} value FCM令牌值
   * @throws {InvalidPushTokenError} 当FCM令牌格式无效时抛出
   * @private
   */
  private validateFCMToken(value: string): void {
    // FCM令牌格式：通常以特定前缀开头，长度在140-180字符之间
    if (value.length < 140 || value.length > 180) {
      throw new InvalidPushTokenError('FCM令牌长度必须在140-180字符之间');
    }

    // 检查是否包含有效字符
    if (!/^[A-Za-z0-9_-]+$/.test(value)) {
      throw new InvalidPushTokenError('FCM令牌包含无效字符');
    }
  }

  /**
   * @method validateAPNSToken
   * @description 验证APNs令牌格式
   * @param {string} value APNs令牌值
   * @throws {InvalidPushTokenError} 当APNs令牌格式无效时抛出
   * @private
   */
  private validateAPNSToken(value: string): void {
    // APNs令牌格式：64个十六进制字符
    if (value.length !== 64) {
      throw new InvalidPushTokenError('APNs令牌长度必须为64个字符');
    }

    if (!/^[A-Fa-f0-9]+$/.test(value)) {
      throw new InvalidPushTokenError('APNs令牌必须为十六进制字符');
    }
  }

  /**
   * @method validateHuaweiToken
   * @description 验证华为推送令牌格式
   * @param {string} value 华为推送令牌值
   * @throws {InvalidPushTokenError} 当华为推送令牌格式无效时抛出
   * @private
   */
  private validateHuaweiToken(value: string): void {
    // 华为推送令牌格式：通常以特定前缀开头
    if (value.length < 100 || value.length > 200) {
      throw new InvalidPushTokenError('华为推送令牌长度必须在100-200字符之间');
    }
  }

  /**
   * @method validateXiaomiToken
   * @description 验证小米推送令牌格式
   * @param {string} value 小米推送令牌值
   * @throws {InvalidPushTokenError} 当小米推送令牌格式无效时抛出
   * @private
   */
  private validateXiaomiToken(value: string): void {
    // 小米推送令牌格式：通常以特定前缀开头
    if (value.length < 100 || value.length > 200) {
      throw new InvalidPushTokenError('小米推送令牌长度必须在100-200字符之间');
    }
  }

  /**
   * @method equals
   * @description 比较两个推送令牌是否相等
   * @param {PushToken} other 另一个推送令牌
   * @returns {boolean} 是否相等
   */
  equals(other: PushToken): boolean {
    return (
      this.value.value === other.value.value &&
      this.value.platform === other.value.platform
    );
  }

  /**
   * @method toString
   * @description 返回推送令牌的字符串表示
   * @returns {string} 推送令牌字符串
   */
  toString(): string {
    return `${this.value.platform}:${this.value.value}`;
  }

  /**
   * @method toMaskedString
   * @description 返回脱敏后的推送令牌字符串
   * @returns {string} 脱敏后的推送令牌字符串
   */
  toMaskedString(): string {
    const value = this.value.value;
    if (value.length <= 8) {
      return `${this.value.platform}:****`;
    }
    const masked =
      value.substring(0, 4) + '****' + value.substring(value.length - 4);
    return `${this.value.platform}:${masked}`;
  }
}

/**
 * @enum PushPlatform
 * @description 推送平台枚举
 */
export enum PushPlatform {
  FCM = 'FCM',
  APNS = 'APNS',
  HUAWEI = 'HUAWEI',
  XIAOMI = 'XIAOMI',
}

/**
 * @class InvalidPushTokenError
 * @description 无效推送令牌错误
 */
export class InvalidPushTokenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPushTokenError';
  }
}
