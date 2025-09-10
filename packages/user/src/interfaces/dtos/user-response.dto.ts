import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from './get-users.dto';

/**
 * @class UserResponseDto
 * @description
 * 用户响应数据传输对象，封装用户信息的响应结构。
 *
 * DTO职责：
 * 1. 定义用户信息的响应格式
 * 2. 提供标准化的用户数据展示
 * 3. 确保响应数据的一致性
 * 4. 支持API文档生成
 *
 * 数据安全：
 * 1. 不包含敏感信息（如密码）
 * 2. 只返回必要的用户信息
 * 3. 支持字段级别的权限控制
 * 4. 提供数据脱敏功能
 *
 * @property {string} id 用户唯一标识符
 * @property {string} email 用户邮箱地址
 * @property {string} firstName 用户名字
 * @property {string} lastName 用户姓氏
 * @property {string} [phoneNumber] 电话号码
 * @property {string} [avatar] 头像URL
 * @property {UserStatus} status 用户状态
 * @property {string} [tenantId] 所属租户ID
 * @property {string} [organizationId] 所属组织ID
 * @property {string} [departmentId] 所属部门ID
 * @property {Date} createdAt 创建时间
 * @property {Date} updatedAt 更新时间
 *
 * @example
 * ```typescript
 * const userResponse = new UserResponseDto();
 * userResponse.id = 'user-123';
 * userResponse.email = 'user@example.com';
 * userResponse.firstName = 'John';
 * userResponse.lastName = 'Doe';
 * userResponse.status = UserStatus.ACTIVE;
 * ```
 * @since 1.0.0
 */
export class UserResponseDto {
  @ApiProperty({
    description: '用户唯一标识符',
    example: 'user-123',
  })
  id!: string;

  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: '用户名字',
    example: 'John',
  })
  firstName!: string;

  @ApiProperty({
    description: '用户姓氏',
    example: 'Doe',
  })
  lastName!: string;

  @ApiProperty({
    description: '电话号码',
    example: '+86 138 0013 8000',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: '头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    description: '用户状态',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @ApiProperty({
    description: '所属租户ID',
    example: 'tenant-123',
    required: false,
  })
  tenantId?: string;

  @ApiProperty({
    description: '所属组织ID',
    example: 'org-123',
    required: false,
  })
  organizationId?: string;

  @ApiProperty({
    description: '所属部门ID',
    example: 'dept-123',
    required: false,
  })
  departmentId?: string;

  @ApiProperty({
    description: '创建时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt!: Date;
}

/**
 * @class PaginatedUserResponseDto
 * @description
 * 分页用户响应数据传输对象，封装分页用户列表的响应结构。
 *
 * @property {UserResponseDto[]} data 用户列表数据
 * @property {number} total 总记录数
 * @property {number} page 当前页码
 * @property {number} limit 每页数量
 * @property {number} totalPages 总页数
 *
 * @example
 * ```typescript
 * const paginatedResponse = new PaginatedUserResponseDto();
 * paginatedResponse.data = [user1, user2];
 * paginatedResponse.total = 100;
 * paginatedResponse.page = 1;
 * paginatedResponse.limit = 20;
 * paginatedResponse.totalPages = 5;
 * ```
 * @since 1.0.0
 */
export class PaginatedUserResponseDto {
  @ApiProperty({
    description: '用户列表数据',
    type: [UserResponseDto],
  })
  data!: UserResponseDto[];

  @ApiProperty({
    description: '总记录数',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: '当前页码',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: '每页数量',
    example: 20,
  })
  limit!: number;

  @ApiProperty({
    description: '总页数',
    example: 5,
  })
  totalPages!: number;
}
