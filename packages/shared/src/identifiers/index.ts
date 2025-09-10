/**
 * @file identifiers/index.ts
 * @description 标识符值对象导出
 *
 * 包含所有具有唯一性约束的标识符值对象：
 * - UserId: 用户唯一标识符
 * - TenantId: 租户唯一标识符
 * - NotifId: 通知唯一标识符
 * - OrganizationId: 组织唯一标识符（未来）
 * - DepartmentId: 部门唯一标识符（未来）
 */

// 基类和验证规则
export {
  BaseIdentifier,
  UUIDIdentifier,
  CustomIdentifier,
  IdentifierValidationRule,
  UUIDv4ValidationRule,
  CustomFormatValidationRule,
} from './base-identifier.vo';

// 标识符值对象
export { UserId, InvalidUserIdError } from './user-id.vo';
export { TenantId, InvalidTenantIdError } from './tenant-id.vo';
export { NotifId, InvalidNotifIdError } from './notif-id.vo';
export { PermissionId, InvalidPermissionIdError } from './permission-id.vo';
export { RoleId, InvalidRoleIdError } from './role-id.vo';
export {
  OrganizationId,
  InvalidOrganizationIdError,
} from './organization-id.vo';
export { DepartmentId, InvalidDepartmentIdError } from './department-id.vo';

// 类型定义
export type { UserId as UserIdType } from './user-id.vo';
export type { TenantId as TenantIdType } from './tenant-id.vo';
export type { NotifId as NotifIdType } from './notif-id.vo';
export type { PermissionId as PermissionIdType } from './permission-id.vo';
export type { RoleId as RoleIdType } from './role-id.vo';
export type { OrganizationId as OrganizationIdType } from './organization-id.vo';
export type { DepartmentId as DepartmentIdType } from './department-id.vo';
