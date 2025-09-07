/**
 * @enum PlatformConfigType
 * @description
 * 平台配置类型枚举，定义平台配置的分类。
 *
 * 配置分类：
 * 1. 系统配置：影响系统核心功能的配置
 * 2. 安全配置：影响安全策略的配置
 * 3. 性能配置：影响系统性能的配置
 * 4. 功能配置：影响功能开关的配置
 *
 * 配置管理原则：
 * 1. 系统配置需要重启服务才能生效
 * 2. 安全配置变更需要审计日志
 * 3. 性能配置需要监控影响
 * 4. 功能配置可以实时生效
 *
 * @since 1.0.0
 */
export enum PlatformConfigType {
  /**
   * 系统配置
   * 影响系统核心功能的配置
   */
  SYSTEM = 'SYSTEM',

  /**
   * 安全配置
   * 影响安全策略的配置
   */
  SECURITY = 'SECURITY',

  /**
   * 性能配置
   * 影响系统性能的配置
   */
  PERFORMANCE = 'PERFORMANCE',

  /**
   * 功能配置
   * 影响功能开关的配置
   */
  FEATURE = 'FEATURE',

  /**
   * 通知配置
   * 影响通知系统的配置
   */
  NOTIFICATION = 'NOTIFICATION',

  /**
   * 存储配置
   * 影响数据存储的配置
   */
  STORAGE = 'STORAGE',

  /**
   * 网络配置
   * 影响网络通信的配置
   */
  NETWORK = 'NETWORK',
}

/**
 * 平台配置类型显示名称映射
 */
export const PLATFORM_CONFIG_TYPE_LABELS: Record<PlatformConfigType, string> = {
  [PlatformConfigType.SYSTEM]: '系统配置',
  [PlatformConfigType.SECURITY]: '安全配置',
  [PlatformConfigType.PERFORMANCE]: '性能配置',
  [PlatformConfigType.FEATURE]: '功能配置',
  [PlatformConfigType.NOTIFICATION]: '通知配置',
  [PlatformConfigType.STORAGE]: '存储配置',
  [PlatformConfigType.NETWORK]: '网络配置',
};

/**
 * 检查配置类型是否需要重启服务
 *
 * @param {PlatformConfigType} type - 配置类型
 * @returns {boolean} 是否需要重启
 */
export function requiresRestart(type: PlatformConfigType): boolean {
  return [
    PlatformConfigType.SYSTEM,
    PlatformConfigType.SECURITY,
    PlatformConfigType.STORAGE,
    PlatformConfigType.NETWORK,
  ].includes(type);
}

/**
 * 检查配置类型是否需要审计日志
 *
 * @param {PlatformConfigType} type - 配置类型
 * @returns {boolean} 是否需要审计
 */
export function requiresAudit(type: PlatformConfigType): boolean {
  return [PlatformConfigType.SECURITY, PlatformConfigType.SYSTEM].includes(
    type,
  );
}
