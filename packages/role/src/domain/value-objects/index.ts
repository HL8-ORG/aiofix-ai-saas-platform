/**
 * @file value-objects/index.ts
 * @description 角色模块值对象导出文件
 * @author AI开发团队
 * @since 1.0.0
 */

export { RoleId, InvalidRoleIdError } from './role-id.vo';

export {
  RoleName,
  InvalidNameError as InvalidRoleNameError,
} from '@aiofix/shared';

export {
  RoleDescription,
  InvalidDescriptionError as InvalidRoleDescriptionError,
} from '@aiofix/shared';

export { Permission, InvalidPermissionError } from './permission.vo';
export type { PermissionData } from './permission.vo';

export { RoleSettings, InvalidRoleSettingsError } from './role-settings.vo';
export type { RoleSettingsData } from './role-settings.vo';
