/**
 * @file aggregates/index.ts
 * @description 角色模块聚合根导出文件
 * @author AI开发团队
 * @since 1.0.0
 */

export {
  RoleAggregate,
  RoleNotFoundError,
  DuplicateRoleNameError,
  InvalidRoleTypeError,
} from './role.aggregate';
