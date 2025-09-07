/**
 * @enum PlatformStatus
 * @description
 * 平台状态枚举，定义平台的各种运行状态。
 *
 * 平台状态管理：
 * 1. 平台状态影响整个系统的可用性
 * 2. 状态变更需要严格的权限控制
 * 3. 状态变更会触发相应的系统事件
 *
 * 业务规则：
 * 1. 只有平台管理员可以修改平台状态
 * 2. 维护模式下只允许平台管理员访问
 * 3. 停用状态下所有服务不可用
 *
 * @since 1.0.0
 */
export enum PlatformStatus {
  /**
   * 活跃状态
   * 平台正常运行，所有功能可用
   */
  ACTIVE = 'ACTIVE',

  /**
   * 维护状态
   * 平台处于维护模式，仅平台管理员可访问
   */
  MAINTENANCE = 'MAINTENANCE',

  /**
   * 停用状态
   * 平台已停用，所有服务不可用
   */
  DISABLED = 'DISABLED',

  /**
   * 暂停状态
   * 平台暂停服务，现有用户可访问但新用户无法注册
   */
  SUSPENDED = 'SUSPENDED',
}

/**
 * 平台状态显示名称映射
 */
export const PLATFORM_STATUS_LABELS: Record<PlatformStatus, string> = {
  [PlatformStatus.ACTIVE]: '活跃',
  [PlatformStatus.MAINTENANCE]: '维护中',
  [PlatformStatus.DISABLED]: '已停用',
  [PlatformStatus.SUSPENDED]: '已暂停',
};

/**
 * 检查平台状态是否允许用户访问
 *
 * @param {PlatformStatus} status - 平台状态
 * @param {boolean} isPlatformAdmin - 是否为平台管理员
 * @returns {boolean} 是否允许访问
 */
export function isPlatformAccessible(
  status: PlatformStatus,
  isPlatformAdmin: boolean,
): boolean {
  switch (status) {
    case PlatformStatus.ACTIVE:
      return true;
    case PlatformStatus.MAINTENANCE:
      return isPlatformAdmin;
    case PlatformStatus.SUSPENDED:
      return true; // 现有用户可以访问
    case PlatformStatus.DISABLED:
      return false;
    default:
      return false;
  }
}

/**
 * 检查平台状态是否允许新用户注册
 *
 * @param {PlatformStatus} status - 平台状态
 * @returns {boolean} 是否允许注册
 */
export function isRegistrationAllowed(status: PlatformStatus): boolean {
  return status === PlatformStatus.ACTIVE;
}
