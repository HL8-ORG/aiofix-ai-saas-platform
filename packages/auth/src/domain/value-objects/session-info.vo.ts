import { ValueObject } from '@aiofix/core';

/**
 * @interface SessionInfoData
 * @description 会话信息数据接口
 */
export interface SessionInfoData {
  readonly userAgent: string;
  readonly ipAddress: string;
  readonly location?: {
    readonly country?: string;
    readonly region?: string;
    readonly city?: string;
    readonly timezone?: string;
  };
  readonly device?: {
    readonly type?: string;
    readonly os?: string;
    readonly browser?: string;
    readonly version?: string;
  };
  readonly metadata?: Record<string, unknown>;
}

/**
 * @class SessionInfo
 * @description
 * 会话信息值对象，封装会话相关信息的不变性约束、相等性判断和业务概念。
 *
 * 不变性约束：
 * 1. 会话信息一旦创建不可变更
 * 2. IP地址必须符合格式要求
 * 3. 用户代理字符串不能为空
 *
 * 相等性判断：
 * 1. 基于会话信息的完整数据进行比较
 * 2. 支持会话信息的精确匹配
 * 3. 支持哈希码计算用于集合操作
 *
 * 业务概念封装：
 * 1. 封装会话信息验证逻辑
 * 2. 提供会话信息分析方法
 * 3. 隐藏会话信息格式细节
 *
 * @property {SessionInfoData} value 会话信息数据
 *
 * @example
 * ```typescript
 * const sessionInfo = new SessionInfo({
 *   userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
 *   ipAddress: '192.168.1.100',
 *   location: { country: 'CN', region: 'Beijing', city: 'Beijing' }
 * });
 * console.log(sessionInfo.getDeviceType()); // 'desktop'
 * ```
 * @since 1.0.0
 */
export class SessionInfo extends ValueObject<SessionInfoData> {
  private static readonly IPV4_REGEX =
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  private static readonly IPV6_REGEX =
    /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  private static readonly MIN_USER_AGENT_LENGTH = 10;
  private static readonly MAX_USER_AGENT_LENGTH = 1000;

  constructor(data: SessionInfoData) {
    const validatedData = SessionInfo.validateAndNormalizeInfo(data);
    super(validatedData);
  }

  /**
   * @method validateAndNormalizeInfo
   * @description 验证并标准化会话信息数据
   * @param {SessionInfoData} data 原始会话信息数据
   * @returns {SessionInfoData} 验证后的会话信息数据
   * @throws {InvalidSessionInfoError} 当会话信息数据无效时抛出
   * @private
   * @static
   */
  private static validateAndNormalizeInfo(
    data: SessionInfoData,
  ): SessionInfoData {
    if (!data || typeof data !== 'object') {
      throw new InvalidSessionInfoError('会话信息数据不能为空');
    }

    if (!data.userAgent || typeof data.userAgent !== 'string') {
      throw new InvalidSessionInfoError('用户代理字符串不能为空');
    }

    if (!data.ipAddress || typeof data.ipAddress !== 'string') {
      throw new InvalidSessionInfoError('IP地址不能为空');
    }

    // 验证用户代理字符串长度
    if (
      data.userAgent.length < SessionInfo.MIN_USER_AGENT_LENGTH ||
      data.userAgent.length > SessionInfo.MAX_USER_AGENT_LENGTH
    ) {
      throw new InvalidSessionInfoError('用户代理字符串长度不正确');
    }

    // 验证IP地址格式
    if (!SessionInfo.isValidIpAddress(data.ipAddress)) {
      throw new InvalidSessionInfoError('IP地址格式不正确');
    }

    return {
      userAgent: data.userAgent.trim(),
      ipAddress: data.ipAddress.trim(),
      location: data.location
        ? {
            country: data.location.country?.trim(),
            region: data.location.region?.trim(),
            city: data.location.city?.trim(),
            timezone: data.location.timezone?.trim(),
          }
        : undefined,
      device: data.device
        ? {
            type: data.device.type?.trim(),
            os: data.device.os?.trim(),
            browser: data.device.browser?.trim(),
            version: data.device.version?.trim(),
          }
        : undefined,
      metadata: data.metadata || {},
    };
  }

  /**
   * @method isValidIpAddress
   * @description 验证IP地址格式
   * @param {string} ipAddress IP地址
   * @returns {boolean} 是否为有效的IP地址格式
   * @private
   * @static
   */
  private static isValidIpAddress(ipAddress: string): boolean {
    return (
      SessionInfo.IPV4_REGEX.test(ipAddress) ||
      SessionInfo.IPV6_REGEX.test(ipAddress)
    );
  }

  /**
   * @method getUserAgent
   * @description 获取用户代理字符串
   * @returns {string} 用户代理字符串
   */
  getUserAgent(): string {
    return this.value.userAgent;
  }

  /**
   * @method getIpAddress
   * @description 获取IP地址
   * @returns {string} IP地址
   */
  getIpAddress(): string {
    return this.value.ipAddress;
  }

  /**
   * @method getLocation
   * @description 获取位置信息
   * @returns {SessionInfoData['location']} 位置信息
   */
  getLocation(): SessionInfoData['location'] {
    return this.value.location;
  }

  /**
   * @method getDevice
   * @description 获取设备信息
   * @returns {SessionInfoData['device']} 设备信息
   */
  getDevice(): SessionInfoData['device'] {
    return this.value.device;
  }

  /**
   * @method getMetadata
   * @description 获取元数据
   * @returns {Record<string, unknown>} 元数据
   */
  getMetadata(): Record<string, unknown> {
    return this.value.metadata ?? {};
  }

  /**
   * @method isIpv4
   * @description 检查是否为IPv4地址
   * @returns {boolean} 是否为IPv4地址
   */
  isIpv4(): boolean {
    return SessionInfo.IPV4_REGEX.test(this.value.ipAddress);
  }

  /**
   * @method isIpv6
   * @description 检查是否为IPv6地址
   * @returns {boolean} 是否为IPv6地址
   */
  isIpv6(): boolean {
    return SessionInfo.IPV6_REGEX.test(this.value.ipAddress);
  }

  /**
   * @method isPrivateIp
   * @description 检查是否为私有IP地址
   * @returns {boolean} 是否为私有IP地址
   */
  isPrivateIp(): boolean {
    if (this.isIpv6()) {
      return (
        this.value.ipAddress.startsWith('::1') ||
        this.value.ipAddress.startsWith('fe80:')
      );
    }

    // IPv4私有地址范围
    const parts = this.value.ipAddress.split('.').map(Number);
    if (parts.length !== 4) return false;

    const [a, b, _c, _d] = parts;

    // 10.0.0.0/8
    if (a === 10) return true;

    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;

    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;

    // 127.0.0.0/8 (localhost)
    if (a === 127) return true;

    return false;
  }

  /**
   * @method getDeviceType
   * @description 获取设备类型
   * @returns {string} 设备类型
   */
  getDeviceType(): string {
    if (this.value.device?.type) {
      return this.value.device.type;
    }

    const userAgent = this.value.userAgent.toLowerCase();

    if (
      userAgent.includes('mobile') ||
      userAgent.includes('android') ||
      userAgent.includes('iphone')
    ) {
      return 'mobile';
    }

    if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      return 'tablet';
    }

    if (
      userAgent.includes('desktop') ||
      userAgent.includes('windows') ||
      userAgent.includes('macintosh') ||
      userAgent.includes('linux')
    ) {
      return 'desktop';
    }

    return 'unknown';
  }

  /**
   * @method getBrowser
   * @description 获取浏览器信息
   * @returns {string} 浏览器信息
   */
  getBrowser(): string {
    if (this.value.device?.browser) {
      return this.value.device.browser;
    }

    const userAgent = this.value.userAgent.toLowerCase();

    if (userAgent.includes('chrome')) return 'Chrome';
    if (userAgent.includes('firefox')) return 'Firefox';
    if (userAgent.includes('safari') && !userAgent.includes('chrome'))
      return 'Safari';
    if (userAgent.includes('edge')) return 'Edge';
    if (userAgent.includes('opera')) return 'Opera';
    if (userAgent.includes('ie')) return 'Internet Explorer';

    return 'Unknown';
  }

  /**
   * @method getOperatingSystem
   * @description 获取操作系统信息
   * @returns {string} 操作系统信息
   */
  getOperatingSystem(): string {
    if (this.value.device?.os) {
      return this.value.device.os;
    }

    const userAgent = this.value.userAgent.toLowerCase();

    if (userAgent.includes('windows')) return 'Windows';
    if (userAgent.includes('macintosh') || userAgent.includes('mac os'))
      return 'macOS';
    if (userAgent.includes('linux')) return 'Linux';
    if (userAgent.includes('android')) return 'Android';
    if (
      userAgent.includes('ios') ||
      userAgent.includes('iphone') ||
      userAgent.includes('ipad')
    )
      return 'iOS';

    return 'Unknown';
  }

  /**
   * @method getCountry
   * @description 获取国家信息
   * @returns {string | undefined} 国家信息
   */
  getCountry(): string | undefined {
    return this.value.location?.country;
  }

  /**
   * @method getRegion
   * @description 获取地区信息
   * @returns {string | undefined} 地区信息
   */
  getRegion(): string | undefined {
    return this.value.location?.region;
  }

  /**
   * @method getCity
   * @description 获取城市信息
   * @returns {string | undefined} 城市信息
   */
  getCity(): string | undefined {
    return this.value.location?.city;
  }

  /**
   * @method getTimezone
   * @description 获取时区信息
   * @returns {string | undefined} 时区信息
   */
  getTimezone(): string | undefined {
    return this.value.location?.timezone;
  }

  /**
   * @method getMetadataValue
   * @description 获取元数据值
   * @param {string} key 元数据键
   * @returns {unknown} 元数据值
   */
  getMetadataValue(key: string): unknown {
    return this.value.metadata?.[key];
  }

  /**
   * @method isFromSameLocation
   * @description 检查是否来自相同位置
   * @param {SessionInfo} other 另一个会话信息
   * @returns {boolean} 是否来自相同位置
   */
  isFromSameLocation(other: SessionInfo): boolean {
    if (!this.value.location || !other.value.location) {
      return false;
    }

    return (
      this.value.location.country === other.value.location.country &&
      this.value.location.region === other.value.location.region &&
      this.value.location.city === other.value.location.city
    );
  }

  /**
   * @method isFromSameDevice
   * @description 检查是否来自相同设备
   * @param {SessionInfo} other 另一个会话信息
   * @returns {boolean} 是否来自相同设备
   */
  isFromSameDevice(other: SessionInfo): boolean {
    return (
      this.getDeviceType() === other.getDeviceType() &&
      this.getBrowser() === other.getBrowser() &&
      this.getOperatingSystem() === other.getOperatingSystem()
    );
  }

  /**
   * @method getFingerprint
   * @description 获取会话指纹（用于识别唯一会话）
   * @returns {string} 会话指纹
   */
  getFingerprint(): string {
    const components = [
      this.value.ipAddress,
      this.getDeviceType(),
      this.getBrowser(),
      this.getOperatingSystem(),
      this.value.userAgent.substring(0, 100), // 限制长度
    ];

    return components.join('|');
  }

  /**
   * @method toString
   * @description 将会话信息转换为字符串
   * @returns {string} 会话信息字符串表示
   */
  toString(): string {
    return `${this.getDeviceType()}:${this.getBrowser()}:${this.getIpAddress()}`;
  }

  /**
   * @method toJSON
   * @description 将会话信息转换为JSON格式
   * @returns {SessionInfoData} 会话信息数据
   */
  toJSON(): SessionInfoData {
    return {
      userAgent: this.value.userAgent,
      ipAddress: this.value.ipAddress,
      location: this.value.location,
      device: this.value.device,
      metadata: this.value.metadata,
    };
  }
}

/**
 * @class InvalidSessionInfoError
 * @description 无效会话信息错误
 * @extends Error
 */
export class InvalidSessionInfoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidSessionInfoError';
  }
}
