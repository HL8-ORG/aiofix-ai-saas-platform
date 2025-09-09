# 通知模块接口层设计

## 概述

本文档详细描述了通知模块的接口层设计，包括RESTful API控制器、DTO设计、权限控制、API文档和错误处理等核心接口组件。

## 1. 接口层架构

### 1.1 设计原则

- **RESTful设计**: 遵循REST API设计规范
- **统一响应格式**: 标准化的API响应结构
- **权限控制**: 基于角色的访问控制
- **输入验证**: 完整的请求数据验证
- **错误处理**: 统一的异常处理机制
- **API文档**: 自动生成的API文档

### 1.2 接口层结构

```
接口层结构
├── 控制器 (Controllers)
│   ├── NotificationController
│   ├── InAppNotificationController
│   ├── EmailNotificationController
│   ├── PushNotificationController
│   └── SmsNotificationController
├── DTO (Data Transfer Objects)
│   ├── 请求DTO (Request DTOs)
│   ├── 响应DTO (Response DTOs)
│   └── 查询DTO (Query DTOs)
├── 守卫 (Guards)
│   ├── AuthGuard
│   ├── PermissionGuard
│   └── TenantGuard
├── 拦截器 (Interceptors)
│   ├── LoggingInterceptor
│   ├── TransformInterceptor
│   └── CacheInterceptor
└── 异常过滤器 (Exception Filters)
    ├── NotificationExceptionFilter
    └── ValidationExceptionFilter
```

## 2. 控制器设计

### 2.1 NotificationController

```typescript
/**
 * @class NotificationController
 * @description
 * 通知模块主控制器，负责处理通知相关的HTTP请求。
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
@Controller('api/v1/notifications')
@UseGuards(AuthGuard, PermissionGuard, TenantGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
@UseFilters(NotificationExceptionFilter)
export class NotificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly notificationService: INotificationService,
  ) {}

  /**
   * @method createNotification
   * @description 创建通知，支持多租户数据隔离
   * @param {CreateNotificationDto} createDto 创建通知数据传输对象
   * @param {Request} request HTTP请求对象
   * @returns {Promise<NotificationResponseDto>} 创建的通知信息
   * @throws {ValidationError} 当输入数据无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   *
   * 处理流程：
   * 1. 验证请求数据和权限
   * 2. 应用数据隔离策略
   * 3. 调用应用服务创建通知
   * 4. 返回标准化的响应格式
   */
  @Post()
  @RequirePermissions('notification:create')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: '创建通知' })
  @ApiResponse({
    status: 201,
    description: '通知创建成功',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 400, description: '请求数据无效' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async createNotification(
    @Body() createDto: CreateNotificationDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    // 1. 验证权限
    await this.validateCreatePermission(request.user);

    // 2. 应用数据隔离
    const isolationContext = await this.getDataIsolationContext(request.user);

    // 3. 构建命令
    const command = new CreateNotificationCommand(
      createDto.tenantId,
      createDto.recipientId,
      createDto.type,
      createDto.title,
      createDto.content,
      createDto.metadata,
      createDto.channels,
      request.user.id,
    );

    // 4. 执行命令
    const result = await this.commandBus.execute(command);

    // 5. 返回响应
    return {
      id: result.notificationId,
      tenantId: createDto.tenantId,
      recipientId: createDto.recipientId,
      type: createDto.type,
      title: createDto.title,
      content: createDto.content,
      status: 'PENDING',
      channels: createDto.channels,
      createdAt: new Date(),
    };
  }

  /**
   * @method getNotifications
   * @description 获取通知列表，支持多租户数据隔离和分页
   * @param {GetNotificationsQueryDto} queryDto 查询参数
   * @param {Request} request HTTP请求对象
   * @returns {Promise<PaginatedResponse<NotificationResponseDto>>} 分页的通知列表
   * @throws {ValidationError} 当查询参数无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  @Get()
  @RequirePermissions('notification:read')
  @UsePipes(ValidationPipe)
  @ApiOperation({ summary: '获取通知列表' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: NotificationListResponseDto,
  })
  async getNotifications(
    @Query() queryDto: GetNotificationsQueryDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<PaginatedResponse<NotificationResponseDto>> {
    // 1. 验证权限
    await this.validateReadPermission(request.user);

    // 2. 构建查询
    const query = new GetNotificationsQuery(
      request.user.id,
      request.user.tenantId,
      queryDto.page || 1,
      queryDto.limit || 20,
      queryDto.type,
      queryDto.status,
      queryDto.priority,
      queryDto.startDate,
      queryDto.endDate,
    );

    // 3. 执行查询
    const result = await this.queryBus.execute(query);

    // 4. 返回响应
    return {
      data: result.notifications.map(notif => this.mapToResponseDto(notif)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * @method getNotificationById
   * @description 根据ID获取通知详情
   * @param {string} id 通知ID
   * @param {Request} request HTTP请求对象
   * @returns {Promise<NotificationResponseDto>} 通知详情
   * @throws {NotificationNotFoundError} 当通知不存在时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  @Get(':id')
  @RequirePermissions('notification:read')
  @ApiOperation({ summary: '获取通知详情' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async getNotificationById(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<NotificationResponseDto> {
    // 1. 验证权限
    await this.validateReadPermission(request.user);

    // 2. 构建查询
    const query = new GetNotificationByIdQuery(id, request.user.tenantId);

    // 3. 执行查询
    const result = await this.queryBus.execute(query);

    if (!result.notification) {
      throw new NotificationNotFoundError(id);
    }

    // 4. 返回响应
    return this.mapToResponseDto(result.notification);
  }

  /**
   * @method markAsRead
   * @description 标记通知为已读
   * @param {string} id 通知ID
   * @param {Request} request HTTP请求对象
   * @returns {Promise<void>}
   * @throws {NotificationNotFoundError} 当通知不存在时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  @Patch(':id/read')
  @RequirePermissions('notification:update')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async markAsRead(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    // 1. 验证权限
    await this.validateUpdatePermission(request.user);

    // 2. 构建命令
    const command = new MarkNotificationAsReadCommand(id, request.user.id);

    // 3. 执行命令
    await this.commandBus.execute(command);
  }

  /**
   * @method markAllAsRead
   * @description 标记所有通知为已读
   * @param {Request} request HTTP请求对象
   * @returns {Promise<MarkAllAsReadResponseDto>} 标记结果
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  @Patch('read-all')
  @RequirePermissions('notification:update')
  @ApiOperation({ summary: '标记所有通知为已读' })
  @ApiResponse({
    status: 200,
    description: '标记成功',
    type: MarkAllAsReadResponseDto,
  })
  async markAllAsRead(
    @Request() request: AuthenticatedRequest,
  ): Promise<MarkAllAsReadResponseDto> {
    // 1. 验证权限
    await this.validateUpdatePermission(request.user);

    // 2. 构建命令
    const command = new MarkAllNotificationsAsReadCommand(
      request.user.id,
      request.user.tenantId,
    );

    // 3. 执行命令
    const result = await this.commandBus.execute(command);

    // 4. 返回响应
    return {
      markedCount: result.markedCount,
      totalCount: result.totalCount,
      markedAt: new Date(),
    };
  }

  /**
   * @method archiveNotification
   * @description 归档通知
   * @param {string} id 通知ID
   * @param {Request} request HTTP请求对象
   * @returns {Promise<void>}
   * @throws {NotificationNotFoundError} 当通知不存在时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  @Patch(':id/archive')
  @RequirePermissions('notification:update')
  @ApiOperation({ summary: '归档通知' })
  @ApiResponse({ status: 200, description: '归档成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async archiveNotification(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    // 1. 验证权限
    await this.validateUpdatePermission(request.user);

    // 2. 构建命令
    const command = new ArchiveNotificationCommand(id, request.user.id);

    // 3. 执行命令
    await this.commandBus.execute(command);
  }

  /**
   * @method deleteNotification
   * @description 删除通知
   * @param {string} id 通知ID
   * @param {Request} request HTTP请求对象
   * @returns {Promise<void>}
   * @throws {NotificationNotFoundError} 当通知不存在时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  @Delete(':id')
  @RequirePermissions('notification:delete')
  @ApiOperation({ summary: '删除通知' })
  @ApiResponse({ status: 200, description: '删除成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async deleteNotification(
    @Param('id') id: string,
    @Request() request: AuthenticatedRequest,
  ): Promise<void> {
    // 1. 验证权限
    await this.validateDeletePermission(request.user);

    // 2. 构建命令
    const command = new DeleteNotificationCommand(id, request.user.id);

    // 3. 执行命令
    await this.commandBus.execute(command);
  }

  /**
   * @method getNotificationStatistics
   * @description 获取通知统计信息
   * @param {Request} request HTTP请求对象
   * @returns {Promise<NotificationStatisticsDto>} 统计信息
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  @Get('statistics/overview')
  @RequirePermissions('notification:read')
  @ApiOperation({ summary: '获取通知统计信息' })
  @ApiResponse({
    status: 200,
    description: '获取成功',
    type: NotificationStatisticsDto,
  })
  async getNotificationStatistics(
    @Request() request: AuthenticatedRequest,
  ): Promise<NotificationStatisticsDto> {
    // 1. 验证权限
    await this.validateReadPermission(request.user);

    // 2. 构建查询
    const query = new GetNotificationStatisticsQuery(
      request.user.id,
      request.user.tenantId,
    );

    // 3. 执行查询
    const result = await this.queryBus.execute(query);

    // 4. 返回响应
    return {
      totalNotifications: result.totalNotifications,
      unreadCount: result.unreadCount,
      readCount: result.readCount,
      archivedCount: result.archivedCount,
      notificationsByType: result.notificationsByType,
      notificationsByStatus: result.notificationsByStatus,
      recentActivity: result.recentActivity,
    };
  }

  /**
   * @method validateCreatePermission
   * @description 验证创建通知权限
   * @param {User} user 当前用户
   * @returns {Promise<void>}
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   * @private
   */
  private async validateCreatePermission(user: User): Promise<void> {
    const hasPermission = await this.notificationService.hasPermission(
      user.id,
      'notification:create',
    );

    if (!hasPermission) {
      throw new InsufficientPermissionError('notification:create');
    }
  }

  /**
   * @method mapToResponseDto
   * @description 将领域对象映射为响应DTO
   * @param {Notification} notification 通知领域对象
   * @returns {NotificationResponseDto} 响应DTO
   * @private
   */
  private mapToResponseDto(
    notification: Notification,
  ): NotificationResponseDto {
    return {
      id: notification.id.value,
      tenantId: notification.tenantId.value,
      recipientId: notification.recipientId.value,
      type: notification.type.value,
      title: notification.title,
      content: notification.content,
      status: notification.status?.value || 'PENDING',
      priority: notification.priority?.value || 'NORMAL',
      metadata: notification.metadata,
      channels: notification.channels?.map(ch => ch.value) || [],
      readAt: notification.readAt,
      archivedAt: notification.archivedAt,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }
}
```

## 3. DTO设计

### 3.1 请求DTO

#### 3.1.1 CreateNotificationDto

```typescript
/**
 * @class CreateNotificationDto
 * @description
 * 创建通知数据传输对象，封装通知创建请求的数据结构和验证规则。
 *
 * DTO职责：
 * 1. 定义API请求的数据结构
 * 2. 提供数据验证和转换
 * 3. 确保数据格式的一致性
 * 4. 支持API文档生成
 *
 * 验证规则：
 * 1. 必填字段验证
 * 2. 数据类型验证
 * 3. 长度限制验证
 * 4. 枚举值验证
 * 5. 业务规则验证
 */
export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID(4)
  @ApiProperty({
    description: '租户ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  tenantId!: string;

  @IsString()
  @IsNotEmpty()
  @IsUUID(4)
  @ApiProperty({
    description: '接收者ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  recipientId!: string;

  @IsEnum(NotifType)
  @ApiProperty({
    description: '通知类型',
    enum: NotifType,
    example: NotifType.SYSTEM,
  })
  type!: NotifType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @ApiProperty({
    description: '通知标题',
    example: '系统维护通知',
    maxLength: 200,
  })
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  @ApiProperty({
    description: '通知内容',
    example: '系统将于今晚进行维护，预计持续2小时。',
    maxLength: 2000,
  })
  content!: string;

  @IsOptional()
  @IsObject()
  @ApiProperty({
    description: '通知元数据',
    example: { source: 'system', category: 'maintenance' },
    required: false,
  })
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @IsEnum(NotifChannel, { each: true })
  @ApiProperty({
    description: '通知渠道',
    enum: NotifChannel,
    isArray: true,
    example: [NotifChannel.IN_APP, NotifChannel.EMAIL],
    required: false,
  })
  channels?: NotifChannel[];

  @IsOptional()
  @IsEnum(NotifPriority)
  @ApiProperty({
    description: '通知优先级',
    enum: NotifPriority,
    example: NotifPriority.NORMAL,
    required: false,
  })
  priority?: NotifPriority;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: '计划发送时间',
    example: '2024-01-01T10:00:00Z',
    required: false,
  })
  scheduledAt?: string;
}
```

#### 3.1.2 GetNotificationsQueryDto

```typescript
/**
 * @class GetNotificationsQueryDto
 * @description
 * 获取通知列表查询数据传输对象，封装查询参数和过滤条件。
 *
 * 查询参数：
 * 1. 分页参数：page、limit
 * 2. 过滤条件：type、status、priority
 * 3. 时间范围：startDate、endDate
 * 4. 排序参数：sortBy、sortOrder
 * 5. 搜索参数：searchTerm
 */
export class GetNotificationsQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @ApiProperty({
    description: '页码',
    example: 1,
    minimum: 1,
    required: false,
  })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiProperty({
    description: '每页数量',
    example: 20,
    minimum: 1,
    maximum: 100,
    required: false,
  })
  limit?: number = 20;

  @IsOptional()
  @IsEnum(NotifType)
  @ApiProperty({
    description: '通知类型过滤',
    enum: NotifType,
    required: false,
  })
  type?: NotifType;

  @IsOptional()
  @IsEnum(NotifStatus)
  @ApiProperty({
    description: '通知状态过滤',
    enum: NotifStatus,
    required: false,
  })
  status?: NotifStatus;

  @IsOptional()
  @IsEnum(NotifPriority)
  @ApiProperty({
    description: '通知优先级过滤',
    enum: NotifPriority,
    required: false,
  })
  priority?: NotifPriority;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: '开始日期',
    example: '2024-01-01T00:00:00Z',
    required: false,
  })
  startDate?: string;

  @IsOptional()
  @IsDateString()
  @ApiProperty({
    description: '结束日期',
    example: '2024-01-31T23:59:59Z',
    required: false,
  })
  endDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  @ApiProperty({
    description: '搜索关键词',
    example: '系统维护',
    maxLength: 100,
    required: false,
  })
  searchTerm?: string;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'title', 'priority'])
  @ApiProperty({
    description: '排序字段',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'title', 'priority'],
    required: false,
  })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  @ApiProperty({
    description: '排序方向',
    example: 'desc',
    enum: ['asc', 'desc'],
    required: false,
  })
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

### 3.2 响应DTO

#### 3.2.1 NotificationResponseDto

```typescript
/**
 * @class NotificationResponseDto
 * @description
 * 通知响应数据传输对象，封装通知的完整信息。
 *
 * 响应信息包含：
 * 1. 基本信息：ID、租户ID、接收者ID
 * 2. 内容信息：类型、标题、内容、优先级
 * 3. 状态信息：状态、渠道、元数据
 * 4. 时间信息：创建时间、更新时间、读取时间
 * 5. 操作信息：归档时间、删除时间
 */
export class NotificationResponseDto {
  @ApiProperty({
    description: '通知ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id!: string;

  @ApiProperty({
    description: '租户ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  tenantId!: string;

  @ApiProperty({
    description: '接收者ID',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  recipientId!: string;

  @ApiProperty({
    description: '通知类型',
    enum: NotifType,
    example: NotifType.SYSTEM,
  })
  type!: NotifType;

  @ApiProperty({
    description: '通知标题',
    example: '系统维护通知',
  })
  title!: string;

  @ApiProperty({
    description: '通知内容',
    example: '系统将于今晚进行维护，预计持续2小时。',
  })
  content!: string;

  @ApiProperty({
    description: '通知状态',
    enum: NotifStatus,
    example: NotifStatus.PENDING,
  })
  status!: NotifStatus;

  @ApiProperty({
    description: '通知优先级',
    enum: NotifPriority,
    example: NotifPriority.NORMAL,
  })
  priority!: NotifPriority;

  @ApiProperty({
    description: '通知元数据',
    example: { source: 'system', category: 'maintenance' },
  })
  metadata!: Record<string, any>;

  @ApiProperty({
    description: '通知渠道',
    enum: NotifChannel,
    isArray: true,
    example: [NotifChannel.IN_APP, NotifChannel.EMAIL],
  })
  channels!: NotifChannel[];

  @ApiProperty({
    description: '读取时间',
    example: '2024-01-01T10:30:00Z',
    required: false,
  })
  readAt?: Date;

  @ApiProperty({
    description: '归档时间',
    example: '2024-01-01T11:00:00Z',
    required: false,
  })
  archivedAt?: Date;

  @ApiProperty({
    description: '创建时间',
    example: '2024-01-01T10:00:00Z',
  })
  createdAt!: Date;

  @ApiProperty({
    description: '更新时间',
    example: '2024-01-01T10:30:00Z',
  })
  updatedAt!: Date;
}
```

#### 3.2.2 NotificationListResponseDto

```typescript
/**
 * @class NotificationListResponseDto
 * @description
 * 通知列表响应数据传输对象，封装分页的通知列表信息。
 */
export class NotificationListResponseDto {
  @ApiProperty({
    description: '通知列表',
    type: [NotificationResponseDto],
  })
  data!: NotificationResponseDto[];

  @ApiProperty({
    description: '总数量',
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

  @ApiProperty({
    description: '是否有下一页',
    example: true,
  })
  hasNext!: boolean;

  @ApiProperty({
    description: '是否有上一页',
    example: false,
  })
  hasPrev!: boolean;
}
```

#### 3.2.3 NotificationStatisticsDto

```typescript
/**
 * @class NotificationStatisticsDto
 * @description
 * 通知统计信息响应数据传输对象，封装通知的统计信息。
 */
export class NotificationStatisticsDto {
  @ApiProperty({
    description: '总通知数量',
    example: 1000,
  })
  totalNotifications!: number;

  @ApiProperty({
    description: '未读通知数量',
    example: 50,
  })
  unreadCount!: number;

  @ApiProperty({
    description: '已读通知数量',
    example: 800,
  })
  readCount!: number;

  @ApiProperty({
    description: '已归档通知数量',
    example: 150,
  })
  archivedCount!: number;

  @ApiProperty({
    description: '按类型统计',
    example: {
      SYSTEM: 500,
      BUSINESS: 300,
      SECURITY: 200,
    },
  })
  notificationsByType!: Record<string, number>;

  @ApiProperty({
    description: '按状态统计',
    example: {
      PENDING: 100,
      SENT: 800,
      FAILED: 50,
      DELIVERED: 750,
    },
  })
  notificationsByStatus!: Record<string, number>;

  @ApiProperty({
    description: '最近活动',
    type: [NotificationActivityDto],
  })
  recentActivity!: NotificationActivityDto[];
}
```

## 4. 权限控制设计

### 4.1 PermissionGuard

```typescript
/**
 * @class PermissionGuard
 * @description
 * 权限守卫，负责验证用户的操作权限。
 *
 * 权限验证：
 * 1. 检查用户是否已认证
 * 2. 验证用户是否具有所需权限
 * 3. 支持租户级权限控制
 * 4. 提供详细的权限错误信息
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly permissionService: IPermissionService,
    private readonly logger: Logger,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('用户未认证');
    }

    const requiredPermission = this.getRequiredPermission(context);
    if (!requiredPermission) {
      return true; // 没有权限要求，允许访问
    }

    const hasPermission = await this.permissionService.hasPermission(
      user.id,
      requiredPermission,
      user.tenantId,
    );

    if (!hasPermission) {
      this.logger.warn(
        `用户 ${user.id} 尝试访问需要权限 ${requiredPermission} 的资源`,
      );
      throw new ForbiddenException(`权限不足：需要 ${requiredPermission} 权限`);
    }

    return true;
  }

  private getRequiredPermission(context: ExecutionContext): string | null {
    const handler = context.getHandler();
    const requiredPermission = Reflect.getMetadata('permission', handler);

    return requiredPermission || null;
  }
}
```

### 4.2 权限装饰器

```typescript
/**
 * @function RequirePermissions
 * @description
 * 权限装饰器，用于标记需要特定权限的接口。
 *
 * 使用方式：
 * @RequirePermissions('notification:create')
 * @RequirePermissions(['notification:read', 'notification:write'])
 */
export const RequirePermissions = (permissions: string | string[]) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const permission = Array.isArray(permissions)
      ? permissions[0]
      : permissions;
    Reflect.defineMetadata('permission', permission, descriptor.value);
    return descriptor;
  };
};
```

## 5. 异常处理设计

### 5.1 NotificationExceptionFilter

```typescript
/**
 * @class NotificationExceptionFilter
 * @description
 * 通知模块异常过滤器，负责处理通知相关的异常。
 *
 * 异常处理：
 * 1. 捕获通知相关异常
 * 2. 转换为标准HTTP响应
 * 3. 记录异常日志
 * 4. 提供用户友好的错误信息
 */
@Catch(NotificationException)
export class NotificationExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: NotificationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode = exception.statusCode || 500;
    const errorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message,
      code: exception.code,
      details: exception.details,
    };

    // 记录异常日志
    this.logger.error(`Notification exception: ${exception.message}`, {
      exception: exception.constructor.name,
      code: exception.code,
      statusCode,
      path: request.url,
      method: request.method,
      userId: request.user?.id,
      tenantId: request.user?.tenantId,
    });

    response.status(statusCode).json(errorResponse);
  }
}
```

### 5.2 自定义异常

```typescript
/**
 * @class NotificationException
 * @description
 * 通知模块基础异常类，提供统一的异常处理机制。
 */
export class NotificationException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: any,
  ) {
    super(message);
    this.name = 'NotificationException';
  }
}

/**
 * @class NotificationNotFoundError
 * @description
 * 通知不存在异常。
 */
export class NotificationNotFoundError extends NotificationException {
  constructor(notificationId: string) {
    super(`通知不存在: ${notificationId}`, 'NOTIFICATION_NOT_FOUND', 404, {
      notificationId,
    });
  }
}

/**
 * @class InvalidNotificationTypeError
 * @description
 * 无效通知类型异常。
 */
export class InvalidNotificationTypeError extends NotificationException {
  constructor(type: string) {
    super(`无效的通知类型: ${type}`, 'INVALID_NOTIFICATION_TYPE', 400, {
      type,
    });
  }
}

/**
 * @class NotificationPermissionError
 * @description
 * 通知权限异常。
 */
export class NotificationPermissionError extends NotificationException {
  constructor(permission: string) {
    super(`权限不足: ${permission}`, 'NOTIFICATION_PERMISSION_DENIED', 403, {
      permission,
    });
  }
}
```

## 6. 总结

通知模块的接口层设计基于RESTful API设计原则，通过控制器、DTO、权限控制和异常处理，实现了完整的HTTP接口层。这种设计既保证了API的标准化和一致性，又提供了良好的用户体验和开发体验。

### 6.1 设计优势

- **RESTful设计**: 遵循REST API设计规范
- **统一响应格式**: 标准化的API响应结构
- **权限控制**: 基于角色的访问控制
- **输入验证**: 完整的请求数据验证
- **错误处理**: 统一的异常处理机制
- **API文档**: 自动生成的API文档

### 6.2 关键特性

- **多租户支持**: 自动注入租户上下文
- **数据隔离**: 应用数据隔离策略
- **权限验证**: 完整的权限控制机制
- **异常处理**: 统一的异常处理流程
- **API文档**: 完整的Swagger文档
- **性能优化**: 缓存和分页支持

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
