# Interface Adapters层设计

## 文档信息

- **文档名称**: Interface Adapters层设计
- **文档版本**: V1.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

Interface Adapters层是Clean Architecture的第三层，负责将Use Cases层和Entities层的数据转换为外部系统（如数据库、Web、设备等）最方便的格式，反之亦然。本层包含控制器、网关、展示器和外部接口，实现数据转换和接口适配。

## 设计原则

### 1. 数据转换

- **格式转换**: 将内部数据格式转换为外部系统需要的格式
- **双向转换**: 支持输入和输出的双向数据转换
- **类型安全**: 确保数据转换的类型安全性
- **验证过滤**: 在转换过程中进行数据验证和过滤

### 2. 接口适配

- **接口实现**: 实现Use Cases层定义的接口
- **外部系统集成**: 适配外部系统的接口和协议
- **协议转换**: 转换不同协议之间的数据格式
- **错误处理**: 处理外部系统的错误和异常

### 3. 依赖倒置

- **依赖Use Cases层**: 只能依赖Use Cases层的接口
- **为Frameworks层定义接口**: 为外层定义需要实现的接口
- **抽象依赖**: 依赖抽象接口，不依赖具体实现
- **接口隔离**: 接口职责单一，易于实现和测试

## 控制器设计

### REST控制器

#### 1. 用户REST控制器

```typescript
/**
 * @class UserController
 * @description 用户REST控制器，处理用户相关的HTTP请求和响应
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
 */
@Controller('api/users')
@UseGuards(AuthGuard, PermissionGuard)
export class UserController {
  constructor(
    private readonly userApplicationService: UserApplicationService,
    private readonly dataIsolationService: DataIsolationService,
    private readonly permissionService: PermissionService,
  ) {}

  /**
   * 创建新用户，支持多租户数据隔离
   * @param createUserDto 创建用户数据传输对象
   * @param request HTTP请求对象
   * @returns 创建的用户信息
   */
  @Post()
  @RequirePermissions('user:create')
  @UsePipes(ValidationPipe)
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    // 1. 验证权限
    await this.validateCreateUserPermission(request.user);

    // 2. 应用数据隔离
    const isolationContext =
      await this.dataIsolationService.getDataIsolationContext(request.user.id);

    // 3. 构建命令
    const command = new CreateUserCommand(
      createUserDto.userId,
      createUserDto.email,
      createUserDto.password,
      createUserDto.profile.firstName,
      createUserDto.profile.lastName,
      isolationContext.tenantId,
      createUserDto.profile.language,
      createUserDto.profile.timezone,
      request.user.id,
    );

    // 4. 调用应用服务
    const result = await this.userApplicationService.createUser(command);

    // 5. 返回响应
    return {
      id: result.userId,
      email: createUserDto.email,
      profile: createUserDto.profile,
      status: 'ACTIVE',
      createdAt: new Date(),
    };
  }

  /**
   * 获取用户列表，支持多租户数据隔离和分页
   * @param queryDto 查询参数
   * @param request HTTP请求对象
   * @returns 分页的用户列表
   */
  @Get()
  @RequirePermissions('user:read')
  @UsePipes(ValidationPipe)
  async getUsers(
    @Query() queryDto: GetUsersQueryDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<PaginatedResponse<UserResponseDto>> {
    // 1. 验证权限
    await this.validateReadUsersPermission(request.user);

    // 2. 构建查询
    const query = new GetUsersQuery(
      queryDto.tenantId,
      queryDto.organizationId,
      queryDto.departmentId,
      queryDto.status,
      queryDto.searchTerm,
      queryDto.page,
      queryDto.limit,
      queryDto.sortBy,
      queryDto.sortOrder,
      request.user.id,
    );

    // 3. 调用应用服务
    const result = await this.userApplicationService.getUsers(query);

    // 4. 返回响应
    return {
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * 获取单个用户信息
   * @param userId 用户ID
   * @param request HTTP请求对象
   * @returns 用户信息
   */
  @Get(':userId')
  @RequirePermissions('user:read')
  async getUser(
    @Param('userId') userId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    // 1. 验证权限
    await this.validateReadUserPermission(request.user, userId);

    // 2. 构建查询
    const query = new GetUserQuery(
      userId,
      request.user.tenantId,
      true,
      true,
      request.user.id,
    );

    // 3. 调用应用服务
    const result = await this.userApplicationService.getUser(query);

    // 4. 返回响应
    return this.mapUserToResponseDto(result);
  }

  /**
   * 更新用户信息
   * @param userId 用户ID
   * @param updateUserDto 更新用户数据传输对象
   * @param request HTTP请求对象
   */
  @Put(':userId')
  @RequirePermissions('user:update')
  @UsePipes(ValidationPipe)
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    // 1. 验证权限
    await this.validateUpdateUserPermission(request.user, userId);

    // 2. 构建命令
    const command = new UpdateUserCommand(
      userId,
      updateUserDto.profile,
      updateUserDto.preferences,
      request.user.id,
    );

    // 3. 调用应用服务
    await this.userApplicationService.updateUser(command);
  }

  /**
   * 删除用户
   * @param userId 用户ID
   * @param request HTTP请求对象
   */
  @Delete(':userId')
  @RequirePermissions('user:delete')
  async deleteUser(
    @Param('userId') userId: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    // 1. 验证权限
    await this.validateDeleteUserPermission(request.user, userId);

    // 2. 构建命令
    const command = new DeleteUserCommand(userId, request.user.id);

    // 3. 调用应用服务
    await this.userApplicationService.deleteUser(command);
  }

  /**
   * 验证创建用户权限
   */
  private async validateCreateUserPermission(user: User): Promise<void> {
    const hasPermission = await this.permissionService.hasPermission(
      user.id,
      'user:create',
    );

    if (!hasPermission) {
      throw new InsufficientPermissionError('user:create');
    }
  }

  /**
   * 验证读取用户权限
   */
  private async validateReadUserPermission(
    user: User,
    targetUserId: string,
  ): Promise<void> {
    // 用户可以读取自己的信息，或者有读取权限
    if (user.id !== targetUserId) {
      const hasPermission = await this.permissionService.hasPermission(
        user.id,
        'user:read',
      );

      if (!hasPermission) {
        throw new InsufficientPermissionError('user:read');
      }
    }
  }

  /**
   * 验证读取用户列表权限
   */
  private async validateReadUsersPermission(user: User): Promise<void> {
    const hasPermission = await this.permissionService.hasPermission(
      user.id,
      'user:read',
    );

    if (!hasPermission) {
      throw new InsufficientPermissionError('user:read');
    }
  }

  /**
   * 验证更新用户权限
   */
  private async validateUpdateUserPermission(
    user: User,
    targetUserId: string,
  ): Promise<void> {
    // 用户可以更新自己的信息，或者有更新权限
    if (user.id !== targetUserId) {
      const hasPermission = await this.permissionService.hasPermission(
        user.id,
        'user:update',
      );

      if (!hasPermission) {
        throw new InsufficientPermissionError('user:update');
      }
    }
  }

  /**
   * 验证删除用户权限
   */
  private async validateDeleteUserPermission(
    user: User,
    targetUserId: string,
  ): Promise<void> {
    const hasPermission = await this.permissionService.hasPermission(
      user.id,
      'user:delete',
    );

    if (!hasPermission) {
      throw new InsufficientPermissionError('user:delete');
    }
  }

  /**
   * 将用户领域对象映射为响应DTO
   */
  private mapUserToResponseDto(user: UserDto): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      profile: user.profile,
      preferences: user.preferences,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

### GraphQL解析器

#### 1. 用户GraphQL解析器

```typescript
/**
 * @class UserResolver
 * @description 用户GraphQL解析器，处理用户相关的GraphQL查询和变更
 *
 * 解析器职责：
 * 1. 处理GraphQL查询和变更
 * 2. 调用应用服务执行业务逻辑
 * 3. 转换GraphQL类型和领域对象
 * 4. 处理GraphQL错误和异常
 *
 * GraphQL特性：
 * 1. 支持灵活的字段查询
 * 2. 实现数据加载器优化
 * 3. 支持订阅和实时更新
 * 4. 提供类型安全的查询
 */
@Resolver(() => User)
export class UserResolver {
  constructor(
    private readonly userApplicationService: UserApplicationService,
    private readonly dataLoaderService: DataLoaderService,
  ) {}

  /**
   * 创建用户变更
   * @param input 创建用户输入
   * @param context GraphQL上下文
   * @returns 创建的用户
   */
  @Mutation(() => User)
  @UseGuards(AuthGuard, PermissionGuard)
  async createUser(
    @Args('input') input: CreateUserInput,
    @Context() context: GraphQLContext,
  ): Promise<User> {
    // 1. 验证权限
    await this.validateCreateUserPermission(context.user);

    // 2. 构建命令
    const command = new CreateUserCommand(
      input.userId,
      input.email,
      input.password,
      input.profile.firstName,
      input.profile.lastName,
      context.user.tenantId,
      input.profile.language,
      input.profile.timezone,
      context.user.id,
    );

    // 3. 调用应用服务
    const result = await this.userApplicationService.createUser(command);

    // 4. 返回GraphQL类型
    return this.mapToGraphQLUser(result);
  }

  /**
   * 获取用户查询
   * @param userId 用户ID
   * @param context GraphQL上下文
   * @returns 用户信息
   */
  @Query(() => User)
  @UseGuards(AuthGuard, PermissionGuard)
  async user(
    @Args('userId') userId: string,
    @Context() context: GraphQLContext,
  ): Promise<User> {
    // 1. 验证权限
    await this.validateReadUserPermission(context.user, userId);

    // 2. 构建查询
    const query = new GetUserQuery(
      userId,
      context.user.tenantId,
      true,
      true,
      context.user.id,
    );

    // 3. 调用应用服务
    const result = await this.userApplicationService.getUser(query);

    // 4. 返回GraphQL类型
    return this.mapToGraphQLUser(result);
  }

  /**
   * 获取用户列表查询
   * @param input 查询输入
   * @param context GraphQL上下文
   * @returns 用户列表
   */
  @Query(() => UserConnection)
  @UseGuards(AuthGuard, PermissionGuard)
  async users(
    @Args('input') input: GetUsersInput,
    @Context() context: GraphQLContext,
  ): Promise<UserConnection> {
    // 1. 验证权限
    await this.validateReadUsersPermission(context.user);

    // 2. 构建查询
    const query = new GetUsersQuery(
      context.user.tenantId,
      input.organizationId,
      input.departmentId,
      input.status,
      input.searchTerm,
      input.page,
      input.limit,
      input.sortBy,
      input.sortOrder,
      context.user.id,
    );

    // 3. 调用应用服务
    const result = await this.userApplicationService.getUsers(query);

    // 4. 返回GraphQL连接类型
    return this.mapToGraphQLUserConnection(result);
  }

  /**
   * 用户字段解析器 - 组织信息
   * @param user 用户对象
   * @param context GraphQL上下文
   * @returns 组织信息
   */
  @ResolveField(() => Organization)
  async organization(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<Organization> {
    // 使用数据加载器优化查询
    return await this.dataLoaderService.organizationLoader.load(
      user.organizationId,
    );
  }

  /**
   * 用户字段解析器 - 部门信息
   * @param user 用户对象
   * @param context GraphQL上下文
   * @returns 部门信息
   */
  @ResolveField(() => Department)
  async department(
    @Parent() user: User,
    @Context() context: GraphQLContext,
  ): Promise<Department> {
    // 使用数据加载器优化查询
    return await this.dataLoaderService.departmentLoader.load(
      user.departmentId,
    );
  }

  /**
   * 将领域对象映射为GraphQL类型
   */
  private mapToGraphQLUser(userDto: UserDto): User {
    return {
      id: userDto.id,
      email: userDto.email,
      profile: userDto.profile,
      preferences: userDto.preferences,
      status: userDto.status,
      createdAt: userDto.createdAt,
      updatedAt: userDto.updatedAt,
    };
  }

  /**
   * 将查询结果映射为GraphQL连接类型
   */
  private mapToGraphQLUserConnection(result: GetUsersResult): UserConnection {
    return {
      edges: result.data.map(user => ({
        node: this.mapToGraphQLUser(user),
        cursor: user.id,
      })),
      pageInfo: {
        hasNextPage: result.page < result.totalPages,
        hasPreviousPage: result.page > 1,
        startCursor: result.data[0]?.id,
        endCursor: result.data[result.data.length - 1]?.id,
      },
      totalCount: result.total,
    };
  }
}
```

## 数据传输对象设计

### DTO职责

DTO负责：

1. **数据传输**: 在不同层之间传输数据
2. **数据验证**: 验证输入数据的有效性
3. **数据转换**: 转换不同格式的数据
4. **API文档**: 提供API文档和类型定义
5. **版本控制**: 支持API版本控制

### DTO实现模式

#### 1. 创建用户DTO

```typescript
/**
 * @class CreateUserDto
 * @description 创建用户数据传输对象，封装用户创建请求的数据结构和验证规则
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
 */
export class CreateUserDto {
  @IsUUID(4, { message: '用户ID格式不正确' })
  @ApiProperty({
    description: '用户唯一标识符',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId!: string;

  @IsEmail({}, { message: '邮箱格式不正确' })
  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
    format: 'email',
  })
  email!: string;

  @IsString()
  @MinLength(8, { message: '密码长度不能少于8位' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: '密码必须包含大小写字母、数字和特殊字符',
  })
  @ApiProperty({
    description: '用户密码',
    example: 'SecurePass123!',
    minLength: 8,
  })
  password!: string;

  @ValidateNested()
  @Type(() => UserProfileDto)
  @ApiProperty({
    description: '用户资料信息',
    type: UserProfileDto,
  })
  profile!: UserProfileDto;

  @IsOptional()
  @IsUUID(4, { message: '租户ID格式不正确' })
  @ApiProperty({
    description: '所属租户ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  tenantId?: string;

  @IsOptional()
  @IsUUID(4, { message: '组织ID格式不正确' })
  @ApiProperty({
    description: '所属组织ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  organizationId?: string;

  @IsOptional()
  @IsUUID(4, { message: '部门ID格式不正确' })
  @ApiProperty({
    description: '所属部门ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  departmentId?: string;
}

/**
 * @class UserProfileDto
 * @description 用户资料数据传输对象，封装用户个人资料信息
 *
 * 资料信息包含：
 * 1. 基本信息：姓名、电话、头像
 * 2. 个人设置：语言、时区、主题
 * 3. 通知偏好：邮件、短信、推送
 * 4. 隐私设置：数据共享、可见性
 */
export class UserProfileDto {
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
  @IsPhoneNumber('CN', { message: '电话号码格式不正确' })
  @ApiProperty({
    description: '电话号码',
    example: '+86 138 0013 8000',
    required: false,
  })
  phoneNumber?: string;

  @IsOptional()
  @IsUrl({}, { message: '头像URL格式不正确' })
  @ApiProperty({
    description: '头像URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  avatar?: string;

  @IsOptional()
  @IsString()
  @IsIn(['en', 'zh-CN', 'zh-TW'], { message: '不支持的语言' })
  @ApiProperty({
    description: '用户语言偏好',
    example: 'zh-CN',
    enum: ['en', 'zh-CN', 'zh-TW'],
    required: false,
  })
  language?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    description: '用户时区',
    example: 'Asia/Shanghai',
    required: false,
  })
  timezone?: string;
}
```

#### 2. 用户响应DTO

```typescript
/**
 * @class UserResponseDto
 * @description 用户响应数据传输对象，封装用户信息的响应结构
 *
 * 响应结构：
 * 1. 基本信息：ID、邮箱、状态
 * 2. 资料信息：姓名、电话、头像
 * 3. 偏好设置：语言、时区、主题
 * 4. 时间信息：创建时间、更新时间
 * 5. 关联信息：组织、部门、角色
 */
export class UserResponseDto {
  @ApiProperty({
    description: '用户唯一标识符',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: '用户邮箱地址',
    example: 'user@example.com',
  })
  email!: string;

  @ApiProperty({
    description: '用户资料信息',
    type: UserProfileDto,
  })
  profile!: UserProfileDto;

  @ApiProperty({
    description: '用户偏好设置',
    type: UserPreferencesDto,
  })
  preferences!: UserPreferencesDto;

  @ApiProperty({
    description: '用户状态',
    example: 'ACTIVE',
    enum: ['PENDING', 'ACTIVE', 'DISABLED'],
  })
  status!: string;

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

  @ApiProperty({
    description: '所属组织ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
    required: false,
  })
  organizationId?: string;

  @ApiProperty({
    description: '所属部门ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
    required: false,
  })
  departmentId?: string;

  @ApiProperty({
    description: '用户角色列表',
    example: ['USER', 'ADMIN'],
    type: [String],
  })
  roles!: string[];
}

/**
 * @class UserPreferencesDto
 * @description 用户偏好设置数据传输对象
 */
export class UserPreferencesDto {
  @ApiProperty({
    description: '用户语言偏好',
    example: 'zh-CN',
  })
  language!: string;

  @ApiProperty({
    description: '用户时区',
    example: 'Asia/Shanghai',
  })
  timezone!: string;

  @ApiProperty({
    description: '主题设置',
    example: 'light',
    enum: ['light', 'dark', 'auto'],
  })
  theme!: string;

  @ApiProperty({
    description: '通知偏好设置',
    type: NotificationPreferencesDto,
  })
  notifications!: NotificationPreferencesDto;
}

/**
 * @class NotificationPreferencesDto
 * @description 通知偏好设置数据传输对象
 */
export class NotificationPreferencesDto {
  @ApiProperty({
    description: '邮件通知',
    example: true,
  })
  email!: boolean;

  @ApiProperty({
    description: '短信通知',
    example: false,
  })
  sms!: boolean;

  @ApiProperty({
    description: '推送通知',
    example: true,
  })
  push!: boolean;

  @ApiProperty({
    description: '站内信通知',
    example: true,
  })
  inApp!: boolean;
}
```

## 事件处理器设计

### 事件处理器职责

事件处理器负责：

1. **处理领域事件**: 接收并处理领域层发布的事件
2. **更新读模型**: 更新查询模型和视图
3. **触发副作用**: 触发事件相关的副作用操作
4. **错误处理**: 处理事件处理过程中的错误
5. **重试机制**: 实现事件处理的重试机制

### 事件处理器实现模式

#### 1. 用户创建事件处理器

```typescript
/**
 * @class UserCreatedEventHandler
 * @description 用户创建事件处理器，处理用户创建事件的后续业务逻辑
 *
 * 事件处理职责：
 * 1. 接收并处理用户创建领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 更新用户列表视图
 * 2. 更新用户统计信息
 * 3. 更新组织架构视图
 * 4. 更新权限管理视图
 *
 * 业务流程触发：
 * 1. 发送欢迎邮件
 * 2. 创建用户权限
 * 3. 记录审计日志
 * 4. 更新用户统计
 */
@EventsHandler(UserCreatedEvent)
export class UserCreatedEventHandler {
  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly notificationService: INotificationService,
    private readonly permissionService: IPermissionService,
    private readonly auditService: IAuditService,
    private readonly statisticsService: IStatisticsService,
  ) {}

  /**
   * 处理用户创建事件，执行后续业务逻辑
   * @param event 用户创建事件
   */
  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      // 1. 验证事件
      this.validateEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserReadModel(event),
        this.sendWelcomeEmail(event),
        this.createUserPermissions(event),
        this.logAuditEvent(event),
        this.updateUserStatistics(event),
      ]);

      this.logger.log(
        `UserCreatedEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process UserCreatedEvent: ${event.aggregateId}`,
        error,
      );
      throw error; // 让事件总线重试
    }
  }

  /**
   * 更新用户读模型视图
   * @param event 用户创建事件
   */
  private async updateUserReadModel(event: UserCreatedEvent): Promise<void> {
    const userReadModel: UserReadModel = {
      id: event.aggregateId,
      email: event.email,
      profile: event.profile,
      status: UserStatus.ACTIVE,
      platformId: event.platformId,
      tenantId: event.tenantId,
      organizationId: event.organizationId,
      departmentId: event.departmentId,
      roles: ['PERSONAL_USER'],
      permissions: this.getDefaultPermissions(),
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };

    await this.userReadRepository.save(userReadModel);
  }

  /**
   * 发送欢迎邮件
   * @param event 用户创建事件
   */
  private async sendWelcomeEmail(event: UserCreatedEvent): Promise<void> {
    await this.notificationService.sendWelcomeEmail(
      event.email,
      event.profile.firstName,
      event.tenantId,
    );
  }

  /**
   * 创建用户权限
   * @param event 用户创建事件
   */
  private async createUserPermissions(event: UserCreatedEvent): Promise<void> {
    await this.permissionService.createDefaultPermissions(
      event.aggregateId,
      event.platformId,
      event.tenantId,
    );
  }

  /**
   * 记录审计日志
   * @param event 用户创建事件
   */
  private async logAuditEvent(event: UserCreatedEvent): Promise<void> {
    await this.auditService.logEvent({
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      details: event.toJSON(),
      timestamp: event.occurredOn,
    });
  }

  /**
   * 更新用户统计
   * @param event 用户创建事件
   */
  private async updateUserStatistics(event: UserCreatedEvent): Promise<void> {
    await this.statisticsService.incrementUserCount(event.tenantId);
  }

  /**
   * 获取默认权限列表
   */
  private getDefaultPermissions(): string[] {
    return ['user:read:own', 'user:update:own', 'platform:service:use'];
  }

  /**
   * 验证事件的有效性
   */
  private validateEvent(event: UserCreatedEvent): void {
    if (!event.aggregateId || !event.email || !event.profile) {
      throw new Error('Invalid UserCreatedEvent: missing required fields');
    }
  }
}
```

## 外部服务适配器设计

### 外部服务适配器职责

外部服务适配器负责：

1. **协议转换**: 转换内部协议和外部服务协议
2. **数据格式转换**: 转换数据格式和结构
3. **错误处理**: 处理外部服务的错误和异常
4. **重试机制**: 实现外部服务调用的重试机制
5. **监控和日志**: 监控外部服务调用和记录日志

### 外部服务适配器实现模式

#### 1. 邮件服务适配器

```typescript
/**
 * @class EmailServiceAdapter
 * @description 邮件服务适配器，适配外部邮件服务
 *
 * 适配器职责：
 * 1. 适配外部邮件服务API
 * 2. 转换邮件数据格式
 * 3. 处理邮件发送错误
 * 4. 实现邮件发送重试机制
 * 5. 监控邮件发送状态
 *
 * 支持的服务：
 * 1. SMTP邮件服务
 * 2. 第三方邮件服务（SendGrid、Mailgun等）
 * 3. 邮件模板服务
 * 4. 邮件追踪服务
 */
@Injectable()
export class EmailServiceAdapter implements IEmailService {
  constructor(
    private readonly emailConfig: EmailConfig,
    private readonly templateService: ITemplateService,
    private readonly logger: Logger,
  ) {}

  /**
   * 发送邮件
   * @param emailRequest 邮件请求
   * @returns 发送结果
   */
  async sendEmail(emailRequest: EmailRequest): Promise<EmailResult> {
    try {
      // 1. 验证邮件请求
      this.validateEmailRequest(emailRequest);

      // 2. 渲染邮件模板
      const renderedContent = await this.renderEmailTemplate(emailRequest);

      // 3. 构建邮件消息
      const emailMessage = this.buildEmailMessage(
        emailRequest,
        renderedContent,
      );

      // 4. 发送邮件
      const result = await this.sendEmailMessage(emailMessage);

      // 5. 记录发送日志
      await this.logEmailSent(emailRequest, result);

      return result;
    } catch (error) {
      // 记录错误日志
      await this.logEmailError(emailRequest, error);
      throw new EmailSendError(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * 发送批量邮件
   * @param emailRequests 邮件请求列表
   * @returns 发送结果列表
   */
  async sendBulkEmail(emailRequests: EmailRequest[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    // 并行发送邮件，但限制并发数
    const concurrencyLimit = 10;
    const chunks = this.chunkArray(emailRequests, concurrencyLimit);

    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(request => this.sendEmail(request)),
      );

      results.push(
        ...chunkResults.map(result =>
          result.status === 'fulfilled'
            ? result.value
            : this.createErrorResult(result.reason),
        ),
      );
    }

    return results;
  }

  /**
   * 验证邮件请求
   */
  private validateEmailRequest(emailRequest: EmailRequest): void {
    if (!emailRequest.to || emailRequest.to.length === 0) {
      throw new Error('Email recipient is required');
    }

    if (!emailRequest.subject) {
      throw new Error('Email subject is required');
    }

    if (!emailRequest.templateId && !emailRequest.content) {
      throw new Error('Email template or content is required');
    }
  }

  /**
   * 渲染邮件模板
   */
  private async renderEmailTemplate(
    emailRequest: EmailRequest,
  ): Promise<RenderedContent> {
    if (emailRequest.templateId) {
      return await this.templateService.renderTemplate(
        emailRequest.templateId,
        emailRequest.templateData,
      );
    }

    return {
      subject: emailRequest.subject,
      html: emailRequest.content?.html || '',
      text: emailRequest.content?.text || '',
    };
  }

  /**
   * 构建邮件消息
   */
  private buildEmailMessage(
    emailRequest: EmailRequest,
    renderedContent: RenderedContent,
  ): EmailMessage {
    return {
      to: emailRequest.to,
      cc: emailRequest.cc,
      bcc: emailRequest.bcc,
      subject: renderedContent.subject,
      html: renderedContent.html,
      text: renderedContent.text,
      attachments: emailRequest.attachments,
      headers: {
        'X-Tenant-ID': emailRequest.tenantId,
        'X-Template-ID': emailRequest.templateId,
        ...emailRequest.headers,
      },
    };
  }

  /**
   * 发送邮件消息
   */
  private async sendEmailMessage(
    emailMessage: EmailMessage,
  ): Promise<EmailResult> {
    // 根据配置选择邮件服务提供商
    switch (this.emailConfig.provider) {
      case 'smtp':
        return await this.sendViaSMTP(emailMessage);
      case 'sendgrid':
        return await this.sendViaSendGrid(emailMessage);
      case 'mailgun':
        return await this.sendViaMailgun(emailMessage);
      default:
        throw new Error(
          `Unsupported email provider: ${this.emailConfig.provider}`,
        );
    }
  }

  /**
   * 通过SMTP发送邮件
   */
  private async sendViaSMTP(emailMessage: EmailMessage): Promise<EmailResult> {
    // SMTP发送实现
    const transporter = nodemailer.createTransporter(this.emailConfig.smtp);
    const info = await transporter.sendMail(emailMessage);

    return {
      messageId: info.messageId,
      status: 'sent',
      timestamp: new Date(),
    };
  }

  /**
   * 通过SendGrid发送邮件
   */
  private async sendViaSendGrid(
    emailMessage: EmailMessage,
  ): Promise<EmailResult> {
    // SendGrid发送实现
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(this.emailConfig.sendgrid.apiKey);

    const msg = {
      to: emailMessage.to,
      from: this.emailConfig.fromAddress,
      subject: emailMessage.subject,
      html: emailMessage.html,
      text: emailMessage.text,
    };

    const response = await sgMail.send(msg);

    return {
      messageId: response[0].headers['x-message-id'],
      status: 'sent',
      timestamp: new Date(),
    };
  }

  /**
   * 记录邮件发送日志
   */
  private async logEmailSent(
    emailRequest: EmailRequest,
    result: EmailResult,
  ): Promise<void> {
    await this.auditService.logEmailSent({
      messageId: result.messageId,
      to: emailRequest.to,
      subject: emailRequest.subject,
      templateId: emailRequest.templateId,
      tenantId: emailRequest.tenantId,
      status: result.status,
      timestamp: result.timestamp,
    });
  }

  /**
   * 记录邮件发送错误
   */
  private async logEmailError(
    emailRequest: EmailRequest,
    error: Error,
  ): Promise<void> {
    await this.auditService.logEmailError({
      to: emailRequest.to,
      subject: emailRequest.subject,
      templateId: emailRequest.templateId,
      tenantId: emailRequest.tenantId,
      error: error.message,
      timestamp: new Date(),
    });
  }
}
```

## 测试策略

### 单元测试

```typescript
// 控制器测试
describe('UserController', () => {
  let controller: UserController;
  let mockApplicationService: jest.Mocked<UserApplicationService>;

  beforeEach(() => {
    mockApplicationService = createMockApplicationService();
    controller = new UserController(mockApplicationService, ...);
  });

  it('should create user successfully', async () => {
    const createUserDto = new CreateUserDto();
    createUserDto.userId = 'user-123';
    createUserDto.email = 'user@example.com';
    createUserDto.password = 'password123';
    createUserDto.profile = {
      firstName: 'John',
      lastName: 'Doe',
    };

    const request = {
      user: { id: 'admin-123', tenantId: 'tenant-456' },
    } as AuthenticatedRequest;

    const expectedResult = new UserCreatedResult('user-123');
    mockApplicationService.createUser.mockResolvedValue(expectedResult);

    const result = await controller.createUser(createUserDto, request);

    expect(result).toBeDefined();
    expect(result.id).toBe('user-123');
    expect(mockApplicationService.createUser).toHaveBeenCalled();
  });

  it('should throw error when permission denied', async () => {
    const createUserDto = new CreateUserDto();
    const request = {
      user: { id: 'user-123', tenantId: 'tenant-456' },
    } as AuthenticatedRequest;

    mockPermissionService.hasPermission.mockResolvedValue(false);

    await expect(controller.createUser(createUserDto, request)).rejects.toThrow(
      'Insufficient permission: user:create'
    );
  });
});

// 事件处理器测试
describe('UserCreatedEventHandler', () => {
  let handler: UserCreatedEventHandler;
  let mockReadRepository: jest.Mocked<IUserReadRepository>;

  beforeEach(() => {
    mockReadRepository = createMockReadRepository();
    handler = new UserCreatedEventHandler(mockReadRepository, ...);
  });

  it('should handle user created event', async () => {
    const event = new UserCreatedEvent(
      'user-123',
      'user@example.com',
      { firstName: 'John', lastName: 'Doe' },
      'tenant-456',
    );

    await handler.handle(event);

    expect(mockReadRepository.save).toHaveBeenCalled();
    expect(mockNotificationService.sendWelcomeEmail).toHaveBeenCalled();
    expect(mockPermissionService.createDefaultPermissions).toHaveBeenCalled();
  });
});
```

## 总结

Interface Adapters层是Clean Architecture的关键层，通过控制器、DTO、事件处理器和外部服务适配器，实现了内部业务逻辑与外部系统的有效隔离。这种设计确保了系统的可测试性、可维护性和可扩展性，为整个系统提供了稳定的接口适配基础。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
