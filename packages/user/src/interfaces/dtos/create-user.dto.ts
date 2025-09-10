import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * @class CreateUserDto
 * @description
 * 创建用户数据传输对象，封装用户创建请求的数据结构和验证规则。
 *
 * DTO职责：
 * 1. 定义API请求的数据结构
 * 2. 提供数据验证和转换
 * 3. 确保数据格式的一致性
 * 4. 支持API文档生成
 *
 * 验证规则：
 * 1. 邮箱格式验证和唯一性检查
 * 2. 密码强度验证
 * 3. 用户资料完整性验证
 * 4. 业务规则约束验证
 *
 * 多租户支持：
 * 1. 支持租户级数据验证
 * 2. 应用租户级业务规则
 * 3. 确保数据隔离合规性
 * 4. 支持跨租户数据共享
 *
 * @property {string} email 用户邮箱地址，必填且格式验证
 * @property {string} password 用户密码，必填且强度验证
 * @property {string} firstName 用户名字，必填
 * @property {string} lastName 用户姓氏，必填
 * @property {string} [phoneNumber] 电话号码，可选
 * @property {string} [avatar] 头像URL，可选
 * @property {string} [tenantId] 所属租户ID，可选
 * @property {string} [organizationId] 所属组织ID，可选
 * @property {string} [departmentId] 所属部门ID，可选
 *
 * @example
 * ```typescript
 * const createUserDto = new CreateUserDto();
 * createUserDto.email = 'user@example.com';
 * createUserDto.password = 'SecurePass123!';
 * createUserDto.firstName = 'John';
 * createUserDto.lastName = 'Doe';
 * ```
 * @since 1.0.0
 */
export class CreateUserDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    format: 'email',
  })
  email!: string;

  @IsString()
  @MinLength(8, { message: '密码长度不能少于8位' })
  @ApiProperty({
    description: '用户密码',
    example: 'SecurePass123!',
    minLength: 8,
  })
  password!: string;

  @IsString()
  @MinLength(1, { message: '名字不能为空' })
  @MaxLength(50, { message: '名字长度不能超过50个字符' })
  @ApiProperty({
    description: '用户名字',
    example: 'John',
    minLength: 1,
    maxLength: 50,
  })
  firstName!: string;

  @IsString()
  @MinLength(1, { message: '姓氏不能为空' })
  @MaxLength(50, { message: '姓氏长度不能超过50个字符' })
  @ApiProperty({
    description: '用户姓氏',
    example: 'Doe',
    minLength: 1,
    maxLength: 50,
  })
  lastName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(20, { message: '电话号码长度不能超过20个字符' })
  @ApiProperty({
    description: '电话号码',
    example: '+86 138 0013 8000',
    required: false,
    maxLength: 20,
  })
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '头像URL长度不能超过500个字符' })
  @ApiProperty({
    description: '头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
    maxLength: 500,
  })
  avatar?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '所属租户ID',
    example: 'tenant-123',
    required: false,
  })
  tenantId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '所属组织ID',
    example: 'org-123',
    required: false,
  })
  organizationId?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '所属部门ID',
    example: 'dept-123',
    required: false,
  })
  departmentId?: string;
}
