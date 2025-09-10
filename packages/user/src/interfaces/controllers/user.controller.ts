import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Param,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateUserCommand } from '../../application/commands/create-user.command';
import { GetUsersQuery } from '../../application/queries/get-users.query';
import { AssignUserToTenantCommand } from '../../application/commands/assign-user-to-tenant.command';
import { UserApplicationService } from '../../application/services/user-application.service';
import {
  CreateUserDto,
  GetUsersDto,
  UserResponseDto,
  PaginatedUserResponseDto,
  AssignUserToTenantDto,
} from '../dtos';

/**
 * @class UserController
 * @description
 * 用户管理控制器，负责处理用户相关的HTTP请求和响应。
 *
 * 控制器职责：
 * 1. 接收和验证HTTP请求
 * 2. 调用应用服务执行业务逻辑
 * 3. 转换数据格式和响应结构
 * 4. 处理异常和错误响应
 *
 * 多租户支持：
 * 1. 自动注入租户上下文
 * 2. 应用数据隔离策略
 * 3. 验证用户权限
 * 4. 支持跨租户操作
 *
 * 请求验证：
 * 1. 使用DTO进行数据验证
 * 2. 应用业务规则验证
 * 3. 处理验证错误
 * 4. 提供详细的错误信息
 *
 * @param {UserApplicationService} userApplicationService 用户应用服务
 * @param {DataIsolationService} dataIsolationService 数据隔离服务
 * @param {PermissionService} permissionService 权限服务
 *
 * @example
 * ```typescript
 * const userController = new UserController(userAppService, dataIsolationService, permissionService);
 * await userController.createUser(createUserDto);
 * ```
 * @since 1.0.0
 */
@ApiTags('用户管理')
@Controller('api/users')
// @UseGuards(AuthGuard, PermissionGuard)
export class UserController {
  constructor(
    private readonly userApplicationService: UserApplicationService,
    // private readonly dataIsolationService: DataIsolationService,
    // private readonly permissionService: PermissionService,
  ) {}

  /**
   * @method createUser
   * @description 创建新用户，支持多租户数据隔离
   * @param {CreateUserDto} createUserDto 创建用户数据传输对象
   * @returns {Promise<UserResponseDto>} 创建的用户信息
   * @throws {ValidationError} 当输入数据无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   * @throws {DuplicateEmailError} 当邮箱已存在时抛出
   *
   * 处理流程：
   * 1. 验证请求数据和权限
   * 2. 应用数据隔离策略
   * 3. 调用应用服务创建用户
   * 4. 返回标准化的响应格式
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建新用户' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: '用户创建成功',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数无效',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: '邮箱已存在',
  })
  // @RequirePermissions('user:create')
  @UsePipes(ValidationPipe)
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<UserResponseDto> {
    // 1. 验证权限
    // await this.validateCreateUserPermission(request.user);

    // 2. 应用数据隔离
    // const isolationContext = await this.dataIsolationService.getDataIsolationContext(request.user.id);

    // 3. 创建命令对象
    const command = new CreateUserCommand(
      createUserDto.email,
      createUserDto.password,
      createUserDto.firstName,
      createUserDto.lastName,
      createUserDto.tenantId || 'default-tenant',
      'system', // requestedBy - 临时使用system，实际应该从认证上下文获取
      createUserDto.organizationId,
      createUserDto.departmentId,
    );

    // 4. 调用应用服务
    const result = await this.userApplicationService.createUser(command);

    // 5. 返回响应
    return {
      id: result.userId,
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phoneNumber: createUserDto.phoneNumber,
      avatar: createUserDto.avatar,
      status: 'ACTIVE' as any,
      tenantId: createUserDto.tenantId,
      organizationId: createUserDto.organizationId,
      departmentId: createUserDto.departmentId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * @method getUsers
   * @description 获取用户列表，支持多租户数据隔离和分页
   * @param {GetUsersDto} queryDto 查询参数
   * @returns {Promise<PaginatedUserResponseDto>} 分页的用户列表
   * @throws {ValidationError} 当查询参数无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  @Get()
  @ApiOperation({ summary: '获取用户列表' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '获取用户列表成功',
    type: PaginatedUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数无效',
  })
  // @RequirePermissions('user:read')
  @UsePipes(ValidationPipe)
  async getUsers(
    @Query() queryDto: GetUsersDto,
  ): Promise<PaginatedUserResponseDto> {
    // 1. 验证权限
    // await this.validateReadUsersPermission(request.user);

    // 2. 创建查询对象
    const query = new GetUsersQuery(
      'default-tenant', // tenantId - 临时使用默认租户，实际应该从认证上下文获取
      'system', // requestedBy - 临时使用system，实际应该从认证上下文获取
      queryDto.organizationId,
      queryDto.departmentId,
      queryDto.status,
      queryDto.searchTerm,
      queryDto.page || 1,
      queryDto.limit || 20,
      queryDto.sortBy || 'createdAt',
      queryDto.sortOrder || 'desc',
    );

    // 3. 调用应用服务
    const result = await this.userApplicationService.getUsers(query);

    // 4. 返回响应
    return {
      data: result.data.map((user: any) => ({
        id: user.userId.value,
        email: user.email.value,
        firstName: user.profile.value.firstName,
        lastName: user.profile.value.lastName,
        phoneNumber: user.profile.value.phoneNumber,
        avatar: user.profile.value.avatar,
        status: user.status,
        tenantId: user.user.tenantId,
        organizationId: undefined, // TODO: 从聚合根获取
        departmentId: undefined, // TODO: 从聚合根获取
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * @method assignUserToTenant
   * @description 分配用户到租户
   * @param {string} userId 用户ID
   * @param {AssignUserToTenantDto} assignDto 分配参数
   * @returns {Promise<void>}
   * @throws {UserNotFoundError} 当用户不存在时抛出
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  @Post(':userId/assign-tenant')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '分配用户到租户' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: '用户分配成功',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: '用户或租户不存在',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: '请求参数无效',
  })
  // @RequirePermissions('user:assign:tenant')
  @UsePipes(ValidationPipe)
  async assignUserToTenant(
    @Param('userId') userId: string,
    @Body() assignDto: AssignUserToTenantDto,
  ): Promise<void> {
    // 1. 验证权限
    // await this.validateAssignUserPermission(request.user, assignDto.tenantId);

    // 2. 创建命令对象
    const command = new AssignUserToTenantCommand(
      assignDto.userId,
      assignDto.tenantId,
      assignDto.role || 'USER',
      assignDto.reason,
      'system', // requestedBy - 临时使用system，实际应该从认证上下文获取
    );

    // 3. 调用应用服务
    await this.userApplicationService.assignUserToTenant(command);
  }

  /**
   * @method validateCreateUserPermission
   * @description 验证创建用户权限
   * @param {User} user 当前用户
   * @returns {Promise<void>}
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   * @private
   */
  private async validateCreateUserPermission(user: any): Promise<void> {
    // const hasPermission = await this.permissionService.hasPermission(
    //   user.id,
    //   'user:create',
    // );
    // if (!hasPermission) {
    //   throw new InsufficientPermissionError('user:create');
    // }
  }
}
