/**
 * @file index.ts
 * @description 部门模块值对象导出文件
 * @author AI开发团队
 * @since 1.0.0
 */

export { DepartmentId, InvalidDepartmentIdError } from '@aiofix/shared';
export { DepartmentName, InvalidNameError } from '@aiofix/shared';
export { DepartmentDescription, InvalidDescriptionError } from '@aiofix/shared';
export {
  DepartmentSettings,
  InvalidDepartmentSettingsError,
} from './department-settings.vo';
export type { DepartmentSettingsData } from './department-settings.vo';
