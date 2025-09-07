/**
 * @enum AuthType
 * @description 认证类型枚举
 * @since 1.0.0
 */
export enum AuthType {
  /** 密码认证 - 使用用户名和密码 */
  PASSWORD = 'PASSWORD',
  /** API密钥认证 - 使用API密钥 */
  API_KEY = 'API_KEY',
  /** OAuth认证 - 使用OAuth协议 */
  OAUTH = 'OAUTH',
  /** 单点登录认证 - 使用SSO */
  SSO = 'SSO',
  /** 双因素认证 - 使用2FA */
  TWO_FACTOR = 'TWO_FACTOR',
  /** 生物识别认证 - 使用生物特征 */
  BIOMETRIC = 'BIOMETRIC',
  /** 证书认证 - 使用数字证书 */
  CERTIFICATE = 'CERTIFICATE',
  /** 社交登录认证 - 使用第三方社交平台 */
  SOCIAL = 'SOCIAL',
}

/**
 * @class AuthTypeHelper
 * @description 认证类型辅助类，提供认证类型相关的业务逻辑
 * @since 1.0.0
 */
export class AuthTypeHelper {
  /**
   * @method getAllTypes
   * @description 获取所有认证类型
   * @returns {AuthType[]} 所有认证类型列表
   */
  static getAllTypes(): AuthType[] {
    return Object.values(AuthType);
  }

  /**
   * @method getPasswordTypes
   * @description 获取密码相关认证类型
   * @returns {AuthType[]} 密码相关认证类型列表
   */
  static getPasswordTypes(): AuthType[] {
    return [AuthType.PASSWORD, AuthType.TWO_FACTOR];
  }

  /**
   * @method getTokenTypes
   * @description 获取令牌相关认证类型
   * @returns {AuthType[]} 令牌相关认证类型列表
   */
  static getTokenTypes(): AuthType[] {
    return [AuthType.API_KEY, AuthType.OAUTH, AuthType.SSO];
  }

  /**
   * @method getBiometricTypes
   * @description 获取生物识别认证类型
   * @returns {AuthType[]} 生物识别认证类型列表
   */
  static getBiometricTypes(): AuthType[] {
    return [AuthType.BIOMETRIC];
  }

  /**
   * @method getCertificateTypes
   * @description 获取证书认证类型
   * @returns {AuthType[]} 证书认证类型列表
   */
  static getCertificateTypes(): AuthType[] {
    return [AuthType.CERTIFICATE];
  }

  /**
   * @method getSocialTypes
   * @description 获取社交登录认证类型
   * @returns {AuthType[]} 社交登录认证类型列表
   */
  static getSocialTypes(): AuthType[] {
    return [AuthType.SOCIAL];
  }

  /**
   * @method isPasswordType
   * @description 检查是否为密码认证类型
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为密码认证类型
   */
  static isPasswordType(type: AuthType): boolean {
    return this.getPasswordTypes().includes(type);
  }

  /**
   * @method isTokenType
   * @description 检查是否为令牌认证类型
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为令牌认证类型
   */
  static isTokenType(type: AuthType): boolean {
    return this.getTokenTypes().includes(type);
  }

  /**
   * @method isBiometricType
   * @description 检查是否为生物识别认证类型
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为生物识别认证类型
   */
  static isBiometricType(type: AuthType): boolean {
    return this.getBiometricTypes().includes(type);
  }

  /**
   * @method isCertificateType
   * @description 检查是否为证书认证类型
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为证书认证类型
   */
  static isCertificateType(type: AuthType): boolean {
    return this.getCertificateTypes().includes(type);
  }

  /**
   * @method isSocialType
   * @description 检查是否为社交登录认证类型
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为社交登录认证类型
   */
  static isSocialType(type: AuthType): boolean {
    return this.getSocialTypes().includes(type);
  }

  /**
   * @method requiresPassword
   * @description 检查认证类型是否需要密码
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否需要密码
   */
  static requiresPassword(type: AuthType): boolean {
    return type === AuthType.PASSWORD;
  }

  /**
   * @method requiresToken
   * @description 检查认证类型是否需要令牌
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否需要令牌
   */
  static requiresToken(type: AuthType): boolean {
    return this.getTokenTypes().includes(type);
  }

  /**
   * @method requiresBiometric
   * @description 检查认证类型是否需要生物识别
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否需要生物识别
   */
  static requiresBiometric(type: AuthType): boolean {
    return type === AuthType.BIOMETRIC;
  }

  /**
   * @method requiresCertificate
   * @description 检查认证类型是否需要证书
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否需要证书
   */
  static requiresCertificate(type: AuthType): boolean {
    return type === AuthType.CERTIFICATE;
  }

  /**
   * @method isMultiFactor
   * @description 检查认证类型是否为多因素认证
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为多因素认证
   */
  static isMultiFactor(type: AuthType): boolean {
    return type === AuthType.TWO_FACTOR;
  }

  /**
   * @method isExternal
   * @description 检查认证类型是否为外部认证
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为外部认证
   */
  static isExternal(type: AuthType): boolean {
    return [AuthType.OAUTH, AuthType.SSO, AuthType.SOCIAL].includes(type);
  }

  /**
   * @method getSecurityLevel
   * @description 获取认证类型的安全级别
   * @param {AuthType} type 认证类型
   * @returns {number} 安全级别（数字越大越安全）
   */
  static getSecurityLevel(type: AuthType): number {
    const levels: Record<AuthType, number> = {
      [AuthType.PASSWORD]: 3,
      [AuthType.API_KEY]: 4,
      [AuthType.OAUTH]: 5,
      [AuthType.SSO]: 6,
      [AuthType.TWO_FACTOR]: 7,
      [AuthType.BIOMETRIC]: 8,
      [AuthType.CERTIFICATE]: 9,
      [AuthType.SOCIAL]: 4,
    };
    return levels[type] || 1;
  }

  /**
   * @method isHighSecurity
   * @description 检查认证类型是否为高安全级别
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为高安全级别
   */
  static isHighSecurity(type: AuthType): boolean {
    return this.getSecurityLevel(type) >= 7;
  }

  /**
   * @method isMediumSecurity
   * @description 检查认证类型是否为中等安全级别
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为中等安全级别
   */
  static isMediumSecurity(type: AuthType): boolean {
    const level = this.getSecurityLevel(type);
    return level >= 4 && level < 7;
  }

  /**
   * @method isLowSecurity
   * @description 检查认证类型是否为低安全级别
   * @param {AuthType} type 认证类型
   * @returns {boolean} 是否为低安全级别
   */
  static isLowSecurity(type: AuthType): boolean {
    return this.getSecurityLevel(type) < 4;
  }

  /**
   * @method getTypeDisplayName
   * @description 获取认证类型的显示名称
   * @param {AuthType} type 认证类型
   * @returns {string} 显示名称
   */
  static getTypeDisplayName(type: AuthType): string {
    const displayNames: Record<AuthType, string> = {
      [AuthType.PASSWORD]: '密码认证',
      [AuthType.API_KEY]: 'API密钥认证',
      [AuthType.OAUTH]: 'OAuth认证',
      [AuthType.SSO]: '单点登录认证',
      [AuthType.TWO_FACTOR]: '双因素认证',
      [AuthType.BIOMETRIC]: '生物识别认证',
      [AuthType.CERTIFICATE]: '证书认证',
      [AuthType.SOCIAL]: '社交登录认证',
    };
    return displayNames[type] || '未知类型';
  }

  /**
   * @method getTypeDescription
   * @description 获取认证类型的描述
   * @param {AuthType} type 认证类型
   * @returns {string} 类型描述
   */
  static getTypeDescription(type: AuthType): string {
    const descriptions: Record<AuthType, string> = {
      [AuthType.PASSWORD]: '使用用户名和密码进行认证',
      [AuthType.API_KEY]: '使用API密钥进行认证',
      [AuthType.OAUTH]: '使用OAuth协议进行认证',
      [AuthType.SSO]: '使用单点登录进行认证',
      [AuthType.TWO_FACTOR]: '使用双因素认证',
      [AuthType.BIOMETRIC]: '使用生物特征进行认证',
      [AuthType.CERTIFICATE]: '使用数字证书进行认证',
      [AuthType.SOCIAL]: '使用第三方社交平台进行认证',
    };
    return descriptions[type] || '未知类型';
  }

  /**
   * @method getTypeColor
   * @description 获取认证类型的颜色标识
   * @param {AuthType} type 认证类型
   * @returns {string} 颜色标识
   */
  static getTypeColor(type: AuthType): string {
    const colors: Record<AuthType, string> = {
      [AuthType.PASSWORD]: 'blue',
      [AuthType.API_KEY]: 'green',
      [AuthType.OAUTH]: 'purple',
      [AuthType.SSO]: 'orange',
      [AuthType.TWO_FACTOR]: 'red',
      [AuthType.BIOMETRIC]: 'teal',
      [AuthType.CERTIFICATE]: 'indigo',
      [AuthType.SOCIAL]: 'pink',
    };
    return colors[type] || 'gray';
  }

  /**
   * @method getSupportedFeatures
   * @description 获取认证类型支持的功能
   * @param {AuthType} type 认证类型
   * @returns {string[]} 支持的功能列表
   */
  static getSupportedFeatures(type: AuthType): string[] {
    const features: Record<AuthType, string[]> = {
      [AuthType.PASSWORD]: [
        'password_reset',
        'password_change',
        'account_lockout',
      ],
      [AuthType.API_KEY]: ['key_rotation', 'key_revocation', 'usage_tracking'],
      [AuthType.OAUTH]: [
        'token_refresh',
        'scope_management',
        'consent_management',
      ],
      [AuthType.SSO]: ['federation', 'attribute_mapping', 'session_management'],
      [AuthType.TWO_FACTOR]: ['totp', 'sms', 'email', 'backup_codes'],
      [AuthType.BIOMETRIC]: [
        'fingerprint',
        'face_recognition',
        'voice_recognition',
      ],
      [AuthType.CERTIFICATE]: [
        'certificate_validation',
        'crl_check',
        'ocsp_check',
      ],
      [AuthType.SOCIAL]: [
        'profile_sync',
        'account_linking',
        'permission_management',
      ],
    };
    return features[type] || [];
  }

  /**
   * @method canBeCombined
   * @description 检查认证类型是否可以组合使用
   * @param {AuthType} type1 认证类型1
   * @param {AuthType} type2 认证类型2
   * @returns {boolean} 是否可以组合使用
   */
  static canBeCombined(type1: AuthType, type2: AuthType): boolean {
    // 双因素认证可以与其他类型组合
    if (type1 === AuthType.TWO_FACTOR || type2 === AuthType.TWO_FACTOR) {
      return true;
    }

    // 相同类型不能组合
    if (type1 === type2) {
      return false;
    }

    // 外部认证类型不能与密码认证组合
    if (this.isExternal(type1) && type2 === AuthType.PASSWORD) {
      return false;
    }

    if (this.isExternal(type2) && type1 === AuthType.PASSWORD) {
      return false;
    }

    return true;
  }
}
