/**
 * @file index.ts
 * @description 组织模块值对象导出文件
 * @author AI开发团队
 * @since 1.0.0
 */

export { OrganizationId, InvalidOrganizationIdError } from '@aiofix/shared';
export { OrganizationName, OrganizationDescription } from '@aiofix/shared';
export {
  OrganizationSettings,
  InvalidOrganizationSettingsError,
} from './organization-settings.vo';
export type { OrganizationSettingsData } from './organization-settings.vo';
