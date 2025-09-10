/**
 * @fileoverview 权限模块值对象导出文件
 * @description 导出权限模块的所有值对象
 * @author AI开发团队
 * @since 1.0.0
 */

export { PermissionId, InvalidPermissionIdError } from '@aiofix/shared';

export { Resource, InvalidResourceError } from './resource.vo';

export { Action, InvalidActionError } from './action.vo';

export {
  PermissionCondition,
  InvalidPermissionConditionError,
} from './permission-condition.vo';
export type { PermissionConditionData } from './permission-condition.vo';

export {
  PermissionScope,
  InvalidPermissionScopeError,
} from './permission-scope.vo';
export type { PermissionScopeData } from './permission-scope.vo';

export {
  PermissionSettings,
  InvalidPermissionSettingsError,
} from './permission-settings.vo';
export type { PermissionSettingsData } from './permission-settings.vo';
