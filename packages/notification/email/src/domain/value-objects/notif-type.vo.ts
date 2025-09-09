/**
 * @enum NotifType
 * @description 通知类型枚举
 *
 * 定义各种通知类型
 */
export enum NotifType {
  /** 系统通知 */
  SYSTEM = 'SYSTEM',
  /** 平台管理通知 */
  PLATFORM_MANAGEMENT = 'PLATFORM_MANAGEMENT',
  /** 租户管理通知 */
  TENANT_MANAGEMENT = 'TENANT_MANAGEMENT',
  /** 用户管理通知 */
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  /** 组织管理通知 */
  ORGANIZATION_MANAGEMENT = 'ORGANIZATION_MANAGEMENT',
  /** 部门管理通知 */
  DEPARTMENT_MANAGEMENT = 'DEPARTMENT_MANAGEMENT',
  /** 角色管理通知 */
  ROLE_MANAGEMENT = 'ROLE_MANAGEMENT',
  /** 权限管理通知 */
  PERMISSION_MANAGEMENT = 'PERMISSION_MANAGEMENT',
  /** 业务通知 */
  BUSINESS = 'BUSINESS',
  /** 提醒通知 */
  REMINDER = 'REMINDER',
  /** 告警通知 */
  ALERT = 'ALERT',
  /** 信息通知 */
  INFO = 'INFO',
}
