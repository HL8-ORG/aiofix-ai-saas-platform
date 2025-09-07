/**
 * @file identifiers/index.ts
 * @description 标识符值对象导出
 *
 * 包含所有具有唯一性约束的标识符值对象：
 * - UserId: 用户唯一标识符
 * - TenantId: 租户唯一标识符
 * - OrganizationId: 组织唯一标识符（未来）
 * - DepartmentId: 部门唯一标识符（未来）
 */

// 标识符值对象
export { UserId, InvalidUserIdError } from './user-id.vo';
export { TenantId, InvalidTenantIdError } from './tenant-id.vo';

// 类型定义
export type { UserId as UserIdType } from './user-id.vo';
export type { TenantId as TenantIdType } from './tenant-id.vo';
