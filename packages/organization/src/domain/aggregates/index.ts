/**
 * @file index.ts
 * @description 组织模块聚合根导出文件
 * @author AI开发团队
 * @since 1.0.0
 */

export {
  OrganizationAggregate,
  OrganizationNotFoundError,
  DuplicateOrganizationNameError,
  InvalidTenantError,
  InvalidStateError,
} from './organization.aggregate';
