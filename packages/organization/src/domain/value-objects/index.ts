/**
 * @file index.ts
 * @description 组织模块值对象导出文件
 * @author AI开发团队
 * @since 1.0.0
 */

export {
  OrganizationId,
  InvalidOrganizationIdError,
} from './organization-id.vo';
export {
  OrganizationName,
  InvalidOrganizationNameError,
} from './organization-name.vo';
export {
  OrganizationDescription,
  InvalidOrganizationDescriptionError,
} from './organization-description.vo';
export {
  OrganizationSettings,
  InvalidOrganizationSettingsError,
} from './organization-settings.vo';
export type { OrganizationSettingsData } from './organization-settings.vo';
