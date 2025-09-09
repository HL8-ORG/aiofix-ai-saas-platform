/**
 * @file common/index.ts
 * @description 通用值对象导出
 *
 * 包含跨业务域使用的通用值对象：
 * - Email: 邮箱地址
 * - Status: 通用状态枚举和转换逻辑
 * - Timestamp: 时间戳值对象
 * - Version: 版本号值对象
 * - Phone: 电话号码值对象
 */

// 通用值对象
export { Email, InvalidEmailError } from './email.vo';
export { Name, InvalidNameError } from './name.vo';
export { Description, InvalidDescriptionError } from './description.vo';
export {
  PhoneNumber,
  InvalidPhoneNumberError,
  PhoneRegion,
} from './phone-number.vo';

// 具体名称值对象
export { RoleName } from './role-name.vo';
export { OrganizationName } from './organization-name.vo';
export { DepartmentName } from './department-name.vo';

// 具体描述值对象
export { RoleDescription } from './role-description.vo';
export { OrganizationDescription } from './organization-description.vo';
export { DepartmentDescription } from './department-description.vo';

// 状态值对象
export {
  NotifStatus,
  NotifStatusType,
  InvalidStatusTransitionError,
} from './notif-status.vo';

// 配置值对象基类
export { BaseSettings, InvalidSettingsError } from './base-settings.vo';
export type {
  BaseSettingsData,
  SettingsValidationRule,
} from './base-settings.vo';

// 内容值对象基类
export { BaseContent, InvalidContentError } from './base-content.vo';
export type { BaseContentData, ContentValidationRule } from './base-content.vo';

// 类型定义
export type { Email as EmailType } from './email.vo';
export type { NameOptions } from './name.vo';
export type { DescriptionOptions } from './description.vo';
export type { PhoneNumberData } from './phone-number.vo';
