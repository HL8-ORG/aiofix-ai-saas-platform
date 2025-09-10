import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @enum UserRole
 * @description 用户在租户中的角色枚举
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  VIEWER = 'VIEWER',
}

/**
 * @class AssignUserToTenantDto
 * @description
 * 分配用户到租户数据传输对象，封装用户租户分配请求的数据结构。
 *
 * DTO职责：
 * 1. 定义用户租户分配请求的数据结构
 * 2. 提供数据验证和格式检查
 * 3. 确保分配操作的合法性
 * 4. 支持API文档生成
 *
 * 验证规则：
 * 1. 用户ID和租户ID必填
 * 2. 角色枚举值验证
 * 3. 分配原因长度限制
 * 4. 权限验证
 *
 * @property {string} userId 用户ID，必填
 * @property {string} tenantId 目标租户ID，必填
 * @property {UserRole} [role=UserRole.USER] 用户在租户中的角色，可选，默认为USER
 * @property {string} [reason] 分配原因，可选
 *
 * @example
 * ```typescript
 * const assignDto = new AssignUserToTenantDto();
 * assignDto.userId = 'user-123';
 * assignDto.tenantId = 'tenant-456';
 * assignDto.role = UserRole.MANAGER;
 * assignDto.reason = 'Promoted to manager';
 * ```
 * @since 1.0.0
 */
export class AssignUserToTenantDto {
  @IsString({ message: '用户ID不能为空' })
  @ApiProperty({
    description: '用户ID',
    example: 'user-123',
  })
  userId!: string;

  @IsString({ message: '租户ID不能为空' })
  @ApiProperty({
    description: '目标租户ID',
    example: 'tenant-456',
  })
  tenantId!: string;

  @IsOptional()
  @IsEnum(UserRole, { message: '用户角色无效' })
  @ApiProperty({
    description: '用户在租户中的角色',
    enum: UserRole,
    example: UserRole.USER,
    required: false,
  })
  role?: UserRole = UserRole.USER;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '分配原因',
    example: 'New team member',
    required: false,
  })
  reason?: string;
}
