import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

/**
 * @enum UserStatus
 * @description 用户状态枚举
 */
export enum UserStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

/**
 * @class GetUsersDto
 * @description
 * 获取用户列表数据传输对象，封装用户查询请求的参数和验证规则。
 *
 * DTO职责：
 * 1. 定义用户查询请求的数据结构
 * 2. 提供分页和过滤参数验证
 * 3. 确保查询参数的有效性
 * 4. 支持API文档生成
 *
 * 查询功能：
 * 1. 支持分页查询（page, limit）
 * 2. 支持状态过滤（status）
 * 3. 支持关键词搜索（searchTerm）
 * 4. 支持排序（sortBy, sortOrder）
 *
 * 多租户支持：
 * 1. 自动应用租户级数据隔离
 * 2. 支持组织级和部门级过滤
 * 3. 确保数据访问权限控制
 *
 * @property {number} [page=1] 页码，默认1
 * @property {number} [limit=20] 每页数量，默认20，最大100
 * @property {string} [status] 用户状态过滤
 * @property {string} [searchTerm] 搜索关键词
 * @property {string} [sortBy='createdAt'] 排序字段
 * @property {'asc' | 'desc'} [sortOrder='desc'] 排序方向
 * @property {string} [organizationId] 组织ID过滤
 * @property {string} [departmentId] 部门ID过滤
 *
 * @example
 * ```typescript
 * const getUsersDto = new GetUsersDto();
 * getUsersDto.page = 1;
 * getUsersDto.limit = 20;
 * getUsersDto.status = 'ACTIVE';
 * getUsersDto.searchTerm = 'john';
 * ```
 * @since 1.0.0
 */
export class GetUsersDto {
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: '页码必须是数字' })
  @Min(1, { message: '页码不能小于1' })
  @ApiProperty({
    description: '页码',
    example: 1,
    minimum: 1,
    required: false,
  })
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber({}, { message: '每页数量必须是数字' })
  @Min(1, { message: '每页数量不能小于1' })
  @Max(100, { message: '每页数量不能超过100' })
  @ApiProperty({
    description: '每页数量',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  limit?: number = 20;

  @IsOptional()
  @IsEnum(UserStatus, { message: '用户状态无效' })
  @ApiProperty({
    description: '用户状态过滤',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
    required: false,
  })
  status?: UserStatus;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '搜索关键词长度不能超过100个字符' })
  @ApiProperty({
    description: '搜索关键词',
    example: 'john',
    maxLength: 100,
    required: false,
  })
  searchTerm?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '排序字段',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'email', 'firstName', 'lastName'],
    required: false,
  })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'], { message: '排序方向必须是asc或desc' })
  @ApiProperty({
    description: '排序方向',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '组织ID过滤',
    example: 'org-123',
    required: false,
  })
  organizationId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '部门ID过滤',
    example: 'dept-123',
    required: false,
  })
  departmentId?: string;
}
