/**
 * @file index.ts
 * @description 部门模块聚合根导出文件
 * @author AI开发团队
 * @since 1.0.0
 */

export {
  DepartmentAggregate,
  DepartmentNotFoundError,
  DuplicateDepartmentNameError,
  InvalidTenantError,
  InvalidOrganizationError,
  InvalidParentDepartmentError,
  InvalidStateError,
} from './department.aggregate';
