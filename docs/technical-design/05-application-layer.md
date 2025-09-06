# 应用层实现

## 概述

应用层是连接接口层和领域层的桥梁，负责协调业务用例的执行，管理事务边界，处理命令和查询，以及发布领域事件。本层实现了CQRS模式，将命令（写操作）和查询（读操作）完全分离。

## 应用层架构

### 整体架构

```
应用层 (Application Layer)
├── 命令处理 (Command Handling)
│   ├── 命令定义 (Command Definitions)
│   ├── 命令处理器 (Command Handlers)
│   └── 命令总线 (Command Bus)
├── 查询处理 (Query Handling)
│   ├── 查询定义 (Query Definitions)
│   ├── 查询处理器 (Query Handlers)
│   └── 查询总线 (Query Bus)
├── 事件处理 (Event Handling)
│   ├── 事件处理器 (Event Handlers)
│   ├── 事件投影器 (Event Projectors)
│   └── 事件总线 (Event Bus)
└── 应用服务 (Application Services)
    ├── 用例协调 (Use Case Orchestration)
    ├── 事务管理 (Transaction Management)
    └── 外部服务集成 (External Service Integration)
```

## 命令处理实现

### 命令定义

#### 用户管理命令

```typescript
// 创建用户命令
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly profile: UserProfile,
    public readonly platformId: string,
  ) {}
}

// 更新用户资料命令
export class UpdateUserProfileCommand {
  constructor(
    public readonly userId: string,
    public readonly profile: UserProfile,
    public readonly updatedBy: string,
  ) {}
}

// 分配用户到租户命令
export class AssignUserToTenantCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly assignedBy: string,
    public readonly role?: string,
  ) {}
}

// 分配用户到组织命令
export class AssignUserToOrganizationCommand {
  constructor(
    public readonly userId: string,
    public readonly organizationId: string,
    public readonly assignedBy: string,
    public readonly role?: string,
  ) {}
}

// 分配用户到部门命令
export class AssignUserToDepartmentCommand {
  constructor(
    public readonly userId: string,
    public readonly departmentId: string,
    public readonly assignedBy: string,
    public readonly role?: string,
  ) {}
}

// 移除用户从租户命令
export class RemoveUserFromTenantCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly removedBy: string,
    public readonly reason?: string,
  ) {}
}
```

#### 租户管理命令

```typescript
// 创建租户命令
export class CreateTenantCommand {
  constructor(
    public readonly name: string,
    public readonly type: TenantType,
    public readonly settings: TenantSettings,
    public readonly createdBy: string,
  ) {}
}

// 更新租户信息命令
export class UpdateTenantCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name?: string,
    public readonly settings?: TenantSettings,
    public readonly updatedBy: string,
  ) {}
}

// 删除租户命令
export class DeleteTenantCommand {
  constructor(
    public readonly tenantId: string,
    public readonly deletedBy: string,
    public readonly reason: string,
  ) {}
}
```

#### 组织管理命令

```typescript
// 创建组织命令
export class CreateOrganizationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly name: string,
    public readonly type: OrganizationType,
    public readonly description?: string,
    public readonly createdBy: string,
  ) {}
}

// 更新组织命令
export class UpdateOrganizationCommand {
  constructor(
    public readonly organizationId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly updatedBy: string,
  ) {}
}

// 删除组织命令
export class DeleteOrganizationCommand {
  constructor(
    public readonly organizationId: string,
    public readonly deletedBy: string,
    public readonly reason: string,
  ) {}
}
```

#### 部门管理命令

```typescript
// 创建部门命令
export class CreateDepartmentCommand {
  constructor(
    public readonly organizationId: string,
    public readonly name: string,
    public readonly parentDepartmentId?: string,
    public readonly description?: string,
    public readonly createdBy: string,
  ) {}
}

// 更新部门命令
export class UpdateDepartmentCommand {
  constructor(
    public readonly departmentId: string,
    public readonly name?: string,
    public readonly description?: string,
    public readonly updatedBy: string,
  ) {}
}

// 删除部门命令
export class DeleteDepartmentCommand {
  constructor(
    public readonly departmentId: string,
    public readonly deletedBy: string,
    public readonly reason: string,
  ) {}
}
```

#### 角色权限管理命令

```typescript
// 创建角色命令
export class CreateRoleCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly permissions: string[],
    public readonly scope: RoleScope,
    public readonly createdBy: string,
  ) {}
}

// 分配角色给用户命令
export class AssignRoleToUserCommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly assignedBy: string,
    public readonly expiresAt?: Date,
  ) {}
}

// 撤销用户角色命令
export class RevokeRoleFromUserCommand {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly revokedBy: string,
    public readonly reason: string,
  ) {}
}
```

### 命令处理器实现

#### 用户管理命令处理器

```typescript
// 创建用户命令处理器
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly eventStore: IEventStore,
    private readonly passwordService: PasswordService,
    private readonly emailService: EmailService,
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    // 1. 验证业务规则
    await this.validateBusinessRules(command);

    // 2. 创建用户聚合
    const user = await this.createUserAggregate(command);

    // 3. 保存到事件存储
    await this.saveUserEvents(user);

    // 4. 发送欢迎邮件
    await this.sendWelcomeEmail(user);

    // 5. 记录审计日志
    await this.logAuditEvent(command, user);
  }

  private async validateBusinessRules(
    command: CreateUserCommand,
  ): Promise<void> {
    // 检查邮箱唯一性
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new EmailAlreadyExistsError(command.email);
    }

    // 验证密码强度
    const isPasswordStrong = await this.passwordService.validateStrength(
      command.password,
    );
    if (!isPasswordStrong) {
      throw new WeakPasswordError();
    }

    // 验证平台存在性
    const platform = await this.platformRepository.findById(command.platformId);
    if (!platform) {
      throw new PlatformNotFoundError(command.platformId);
    }
  }

  private async createUserAggregate(command: CreateUserCommand): Promise<User> {
    const userId = uuid.v4();
    const hashedPassword = await this.passwordService.hash(command.password);

    return User.create(
      userId,
      command.email,
      hashedPassword,
      command.profile,
      command.platformId,
    );
  }

  private async saveUserEvents(user: User): Promise<void> {
    await this.eventStore.saveEvents(
      user.id,
      user.uncommittedEvents,
      user.version,
    );

    user.markEventsAsCommitted();
  }

  private async sendWelcomeEmail(user: User): Promise<void> {
    await this.emailService.sendWelcomeEmail(
      user.email,
      user.profile.firstName,
    );
  }

  private async logAuditEvent(
    command: CreateUserCommand,
    user: User,
  ): Promise<void> {
    await this.auditService.logEvent({
      eventType: 'USER_CREATED',
      userId: user.id,
      performedBy: 'system',
      details: {
        email: user.email,
        platformId: command.platformId,
      },
      timestamp: new Date(),
    });
  }
}

// 分配用户到租户命令处理器
@CommandHandler(AssignUserToTenantCommand)
export class AssignUserToTenantHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly eventStore: IEventStore,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(command: AssignUserToTenantCommand): Promise<void> {
    // 1. 获取用户聚合
    const user = await this.getUserAggregate(command.userId);

    // 2. 获取租户聚合
    const tenant = await this.getTenantAggregate(command.tenantId);

    // 3. 验证分配规则
    await this.validateAssignmentRules(user, tenant, command);

    // 4. 执行分配操作
    user.assignToTenant(command.tenantId, command.role);

    // 5. 保存事件
    await this.saveEvents(user, tenant);

    // 6. 发送通知
    await this.sendNotifications(user, tenant, command);
  }

  private async getUserAggregate(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }
    return user;
  }

  private async getTenantAggregate(tenantId: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(tenantId);
    if (!tenant) {
      throw new TenantNotFoundError(tenantId);
    }
    return tenant;
  }

  private async validateAssignmentRules(
    user: User,
    tenant: Tenant,
    command: AssignUserToTenantCommand,
  ): Promise<void> {
    // 检查用户是否已经在其他租户中
    if (user.tenantId && user.tenantId !== command.tenantId) {
      throw new UserAlreadyAssignedToDifferentTenantError(
        user.id,
        user.tenantId,
      );
    }

    // 检查租户用户数量限制
    const currentUserCount = await this.tenantRepository.getUserCount(
      command.tenantId,
    );
    if (currentUserCount >= tenant.settings.maxUsers) {
      throw new TenantUserLimitExceededError(command.tenantId);
    }

    // 检查分配者权限
    await this.validateAssignerPermissions(
      command.assignedBy,
      command.tenantId,
    );
  }

  private async saveEvents(user: User, tenant: Tenant): Promise<void> {
    // 保存用户事件
    await this.eventStore.saveEvents(
      user.id,
      user.uncommittedEvents,
      user.version,
    );

    // 保存租户事件
    await this.eventStore.saveEvents(
      tenant.id,
      tenant.uncommittedEvents,
      tenant.version,
    );

    user.markEventsAsCommitted();
    tenant.markEventsAsCommitted();
  }

  private async sendNotifications(
    user: User,
    tenant: Tenant,
    command: AssignUserToTenantCommand,
  ): Promise<void> {
    // 通知用户
    await this.notificationService.sendNotification({
      userId: user.id,
      type: 'TENANT_ASSIGNMENT',
      title: '您已被分配到租户',
      message: `您已被分配到租户：${tenant.name}`,
      data: { tenantId: tenant.id, tenantName: tenant.name },
    });

    // 通知租户管理员
    await this.notificationService.sendNotification({
      userId: command.assignedBy,
      type: 'USER_ASSIGNED',
      title: '用户分配完成',
      message: `用户 ${user.email} 已成功分配到租户`,
      data: { userId: user.id, userEmail: user.email },
    });
  }
}
```

#### 租户管理命令处理器

```typescript
// 创建租户命令处理器
@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly platformRepository: IPlatformRepository,
    private readonly eventStore: IEventStore,
    private readonly resourceQuotaService: ResourceQuotaService,
  ) {}

  async execute(command: CreateTenantCommand): Promise<void> {
    // 1. 验证创建权限
    await this.validateCreationPermissions(command);

    // 2. 验证租户信息
    await this.validateTenantInfo(command);

    // 3. 创建租户聚合
    const tenant = await this.createTenantAggregate(command);

    // 4. 分配资源配额
    await this.allocateResourceQuota(tenant);

    // 5. 保存事件
    await this.saveTenantEvents(tenant);

    // 6. 初始化租户配置
    await this.initializeTenantConfiguration(tenant);
  }

  private async validateCreationPermissions(
    command: CreateTenantCommand,
  ): Promise<void> {
    const creator = await this.userRepository.findById(command.createdBy);
    if (!creator || !creator.isPlatformAdmin) {
      throw new InsufficientPermissionsError('只有平台管理员可以创建租户');
    }
  }

  private async validateTenantInfo(
    command: CreateTenantCommand,
  ): Promise<void> {
    // 检查租户名称唯一性
    const existingTenant = await this.tenantRepository.findByName(command.name);
    if (existingTenant) {
      throw new TenantNameAlreadyExistsError(command.name);
    }

    // 验证租户设置
    this.validateTenantSettings(command.settings);
  }

  private validateTenantSettings(settings: TenantSettings): void {
    if (settings.maxUsers <= 0) {
      throw new InvalidTenantSettingsError('最大用户数必须大于0');
    }

    if (settings.maxOrganizations <= 0) {
      throw new InvalidTenantSettingsError('最大组织数必须大于0');
    }
  }

  private async createTenantAggregate(
    command: CreateTenantCommand,
  ): Promise<Tenant> {
    const tenantId = uuid.v4();

    return Tenant.create(
      tenantId,
      command.name,
      command.type,
      command.settings,
      command.createdBy,
    );
  }

  private async allocateResourceQuota(tenant: Tenant): Promise<void> {
    await this.resourceQuotaService.allocateQuota({
      tenantId: tenant.id,
      maxUsers: tenant.settings.maxUsers,
      maxOrganizations: tenant.settings.maxOrganizations,
      maxStorage: tenant.settings.maxStorage,
      maxBandwidth: tenant.settings.maxBandwidth,
    });
  }

  private async saveTenantEvents(tenant: Tenant): Promise<void> {
    await this.eventStore.saveEvents(
      tenant.id,
      tenant.uncommittedEvents,
      tenant.version,
    );

    tenant.markEventsAsCommitted();
  }

  private async initializeTenantConfiguration(tenant: Tenant): Promise<void> {
    // 创建默认组织
    const defaultOrganization = Organization.create(
      tenant.id,
      '默认组织',
      OrganizationType.DEFAULT,
    );

    // 创建默认部门
    const defaultDepartment = Department.create(
      defaultOrganization.id,
      '默认部门',
    );

    // 保存默认组织架构
    await this.eventStore.saveEvents(
      defaultOrganization.id,
      defaultOrganization.uncommittedEvents,
      defaultOrganization.version,
    );

    await this.eventStore.saveEvents(
      defaultDepartment.id,
      defaultDepartment.uncommittedEvents,
      defaultDepartment.version,
    );

    defaultOrganization.markEventsAsCommitted();
    defaultDepartment.markEventsAsCommitted();
  }
}
```

## 查询处理实现

### 查询定义

#### 用户查询

```typescript
// 获取用户查询
export class GetUserQuery {
  constructor(public readonly userId: string) {}
}

// 获取用户列表查询
export class GetUsersQuery {
  constructor(
    public readonly filters: UserFilters,
    public readonly pagination: PaginationOptions,
    public readonly sortOptions?: SortOptions,
  ) {}
}

// 搜索用户查询
export class SearchUsersQuery {
  constructor(
    public readonly searchTerm: string,
    public readonly filters: UserFilters,
    public readonly pagination: PaginationOptions,
  ) {}
}

// 获取用户权限查询
export class GetUserPermissionsQuery {
  constructor(public readonly userId: string) {}
}

// 获取用户角色查询
export class GetUserRolesQuery {
  constructor(public readonly userId: string) {}
}
```

#### 租户查询

```typescript
// 获取租户查询
export class GetTenantQuery {
  constructor(public readonly tenantId: string) {}
}

// 获取租户列表查询
export class GetTenantsQuery {
  constructor(
    public readonly filters: TenantFilters,
    public readonly pagination: PaginationOptions,
  ) {}
}

// 获取租户用户查询
export class GetTenantUsersQuery {
  constructor(
    public readonly tenantId: string,
    public readonly pagination: PaginationOptions,
  ) {}
}
```

#### 组织查询

```typescript
// 获取组织查询
export class GetOrganizationQuery {
  constructor(public readonly organizationId: string) {}
}

// 获取组织列表查询
export class GetOrganizationsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly filters?: OrganizationFilters,
    public readonly pagination?: PaginationOptions,
  ) {}
}

// 获取组织部门查询
export class GetOrganizationDepartmentsQuery {
  constructor(
    public readonly organizationId: string,
    public readonly pagination?: PaginationOptions,
  ) {}
}
```

### 查询处理器实现

#### 用户查询处理器

```typescript
// 获取用户查询处理器
@QueryHandler(GetUserQuery)
export class GetUserHandler {
  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly dataIsolationService: DataIsolationService,
  ) {}

  async execute(query: GetUserQuery, context: QueryContext): Promise<UserDto> {
    // 1. 应用数据隔离
    const isolationContext =
      await this.dataIsolationService.getDataIsolationContext(context.userId);

    // 2. 获取用户数据
    const user = await this.userReadRepository.findById(
      query.userId,
      isolationContext,
    );
    if (!user) {
      throw new UserNotFoundError(query.userId);
    }

    // 3. 转换为DTO
    return this.mapToUserDto(user);
  }

  private mapToUserDto(user: UserReadModel): UserDto {
    return {
      id: user.id,
      email: user.email,
      profile: user.profile,
      status: user.status,
      platformId: user.platformId,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      departmentId: user.departmentId,
      roles: user.roles,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

// 获取用户列表查询处理器
@QueryHandler(GetUsersQuery)
export class GetUsersHandler {
  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly dataIsolationService: DataIsolationService,
    private readonly cacheService: CacheService,
  ) {}

  @Cacheable(300) // 缓存5分钟
  async execute(
    query: GetUsersQuery,
    context: QueryContext,
  ): Promise<PaginatedResult<UserDto>> {
    // 1. 应用数据隔离
    const isolationContext =
      await this.dataIsolationService.getDataIsolationContext(context.userId);

    // 2. 构建查询条件
    const queryConditions = this.buildQueryConditions(
      query.filters,
      isolationContext,
    );

    // 3. 执行查询
    const result = await this.userReadRepository.find(
      queryConditions,
      query.pagination,
      query.sortOptions,
    );

    // 4. 转换为DTO
    const userDtos = result.data.map(user => this.mapToUserDto(user));

    return {
      data: userDtos,
      total: result.total,
      page: query.pagination.page,
      limit: query.pagination.limit,
      totalPages: Math.ceil(result.total / query.pagination.limit),
    };
  }

  private buildQueryConditions(
    filters: UserFilters,
    isolationContext: DataIsolationContext,
  ): any {
    const conditions: any = {};

    // 应用数据隔离
    if (isolationContext.platformId) {
      conditions.platformId = isolationContext.platformId;
    }
    if (isolationContext.tenantId) {
      conditions.tenantId = isolationContext.tenantId;
    }
    if (isolationContext.organizationId) {
      conditions.organizationId = isolationContext.organizationId;
    }
    if (isolationContext.departmentId) {
      conditions.departmentId = isolationContext.departmentId;
    }

    // 应用过滤条件
    if (filters.email) {
      conditions.email = { $regex: filters.email, $options: 'i' };
    }
    if (filters.status) {
      conditions.status = filters.status;
    }
    if (filters.role) {
      conditions.roles = { $in: [filters.role] };
    }

    return conditions;
  }

  private mapToUserDto(user: UserReadModel): UserDto {
    return {
      id: user.id,
      email: user.email,
      profile: user.profile,
      status: user.status,
      platformId: user.platformId,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      departmentId: user.departmentId,
      roles: user.roles,
      permissions: user.permissions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
```

## 事件处理实现

### 事件处理器

#### 用户事件处理器

```typescript
// 用户创建事件处理器
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler {
  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    // 1. 更新读模型
    await this.updateReadModel(event);

    // 2. 发送欢迎邮件
    await this.sendWelcomeEmail(event);

    // 3. 记录审计日志
    await this.logAuditEvent(event);
  }

  private async updateReadModel(event: UserCreatedEvent): Promise<void> {
    const userReadModel: UserReadModel = {
      id: event.aggregateId,
      email: event.email,
      profile: event.profile,
      status: UserStatus.ACTIVE,
      platformId: event.platformId,
      tenantId: null,
      organizationId: null,
      departmentId: null,
      roles: ['PERSONAL_USER'],
      permissions: this.getDefaultPermissions(),
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };

    await this.userReadRepository.save(userReadModel);
  }

  private async sendWelcomeEmail(event: UserCreatedEvent): Promise<void> {
    await this.emailService.sendWelcomeEmail(
      event.email,
      event.profile.firstName,
    );
  }

  private async logAuditEvent(event: UserCreatedEvent): Promise<void> {
    await this.auditService.logEvent({
      eventType: 'USER_CREATED',
      aggregateId: event.aggregateId,
      userId: event.aggregateId,
      details: {
        email: event.email,
        platformId: event.platformId,
      },
      timestamp: event.occurredOn,
    });
  }

  private getDefaultPermissions(): string[] {
    return ['user:read:own', 'user:update:own', 'platform:service:use'];
  }
}

// 用户分配到租户事件处理器
@EventsHandler(UserAssignedToTenantEvent)
export class UserAssignedToTenantHandler {
  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly tenantReadRepository: ITenantReadRepository,
    private readonly notificationService: NotificationService,
  ) {}

  async handle(event: UserAssignedToTenantEvent): Promise<void> {
    // 1. 更新用户读模型
    await this.updateUserReadModel(event);

    // 2. 更新租户读模型
    await this.updateTenantReadModel(event);

    // 3. 发送通知
    await this.sendNotifications(event);
  }

  private async updateUserReadModel(
    event: UserAssignedToTenantEvent,
  ): Promise<void> {
    await this.userReadRepository.updateTenantAssignment(
      event.aggregateId,
      event.tenantId,
      event.role,
      event.occurredOn,
    );
  }

  private async updateTenantReadModel(
    event: UserAssignedToTenantEvent,
  ): Promise<void> {
    await this.tenantReadRepository.incrementUserCount(event.tenantId);
  }

  private async sendNotifications(
    event: UserAssignedToTenantEvent,
  ): Promise<void> {
    // 通知用户
    await this.notificationService.sendNotification({
      userId: event.aggregateId,
      type: 'TENANT_ASSIGNMENT',
      title: '您已被分配到租户',
      message: `您已被分配到租户，角色：${event.role}`,
      data: { tenantId: event.tenantId, role: event.role },
    });
  }
}
```

### 事件投影器

#### 用户投影器

```typescript
// 用户投影器
@Injectable()
export class UserProjector {
  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly eventStore: IEventStore,
  ) {}

  async projectUser(userId: string): Promise<void> {
    // 1. 获取用户的所有事件
    const events = await this.eventStore.getEvents(userId);

    // 2. 重建用户读模型
    const userReadModel = await this.rebuildUserReadModel(events);

    // 3. 保存读模型
    await this.userReadRepository.save(userReadModel);
  }

  private async rebuildUserReadModel(
    events: IDomainEvent[],
  ): Promise<UserReadModel> {
    let userReadModel: Partial<UserReadModel> = {
      id: events[0]?.aggregateId,
      roles: [],
      permissions: [],
    };

    for (const event of events) {
      switch (event.eventType) {
        case 'UserCreatedEvent':
          userReadModel = this.applyUserCreatedEvent(
            userReadModel,
            event as UserCreatedEvent,
          );
          break;
        case 'UserAssignedToTenantEvent':
          userReadModel = this.applyUserAssignedToTenantEvent(
            userReadModel,
            event as UserAssignedToTenantEvent,
          );
          break;
        case 'UserAssignedToOrganizationEvent':
          userReadModel = this.applyUserAssignedToOrganizationEvent(
            userReadModel,
            event as UserAssignedToOrganizationEvent,
          );
          break;
        case 'UserAssignedToDepartmentEvent':
          userReadModel = this.applyUserAssignedToDepartmentEvent(
            userReadModel,
            event as UserAssignedToDepartmentEvent,
          );
          break;
        case 'UserRoleAddedEvent':
          userReadModel = this.applyUserRoleAddedEvent(
            userReadModel,
            event as UserRoleAddedEvent,
          );
          break;
      }
    }

    return userReadModel as UserReadModel;
  }

  private applyUserCreatedEvent(
    userReadModel: Partial<UserReadModel>,
    event: UserCreatedEvent,
  ): Partial<UserReadModel> {
    return {
      ...userReadModel,
      email: event.email,
      profile: event.profile,
      status: UserStatus.ACTIVE,
      platformId: event.platformId,
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };
  }

  private applyUserAssignedToTenantEvent(
    userReadModel: Partial<UserReadModel>,
    event: UserAssignedToTenantEvent,
  ): Partial<UserReadModel> {
    return {
      ...userReadModel,
      tenantId: event.tenantId,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };
  }

  private applyUserAssignedToOrganizationEvent(
    userReadModel: Partial<UserReadModel>,
    event: UserAssignedToOrganizationEvent,
  ): Partial<UserReadModel> {
    return {
      ...userReadModel,
      organizationId: event.organizationId,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };
  }

  private applyUserAssignedToDepartmentEvent(
    userReadModel: Partial<UserReadModel>,
    event: UserAssignedToDepartmentEvent,
  ): Partial<UserReadModel> {
    return {
      ...userReadModel,
      departmentId: event.departmentId,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };
  }

  private applyUserRoleAddedEvent(
    userReadModel: Partial<UserReadModel>,
    event: UserRoleAddedEvent,
  ): Partial<UserReadModel> {
    const roles = [...(userReadModel.roles || []), event.role];
    const permissions = [
      ...(userReadModel.permissions || []),
      ...event.role.permissions,
    ];

    return {
      ...userReadModel,
      roles,
      permissions: [...new Set(permissions)], // 去重
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };
  }
}
```

## 应用服务实现

### 用户应用服务

```typescript
// 用户应用服务
@Injectable()
export class UserApplicationService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly userRepository: IUserRepository,
    private readonly dataIsolationService: DataIsolationService,
  ) {}

  // 创建用户
  async createUser(
    email: string,
    password: string,
    profile: UserProfile,
    platformId: string,
    createdBy: string,
  ): Promise<string> {
    const command = new CreateUserCommand(email, password, profile, platformId);
    await this.commandBus.execute(command);

    // 返回用户ID（从事件中获取）
    const user = await this.userRepository.findByEmail(email);
    return user.id;
  }

  // 分配用户到租户
  async assignUserToTenant(
    userId: string,
    tenantId: string,
    assignedBy: string,
    role?: string,
  ): Promise<void> {
    const command = new AssignUserToTenantCommand(
      userId,
      tenantId,
      assignedBy,
      role,
    );
    await this.commandBus.execute(command);
  }

  // 分配用户到组织
  async assignUserToOrganization(
    userId: string,
    organizationId: string,
    assignedBy: string,
    role?: string,
  ): Promise<void> {
    const command = new AssignUserToOrganizationCommand(
      userId,
      organizationId,
      assignedBy,
      role,
    );
    await this.commandBus.execute(command);
  }

  // 分配用户到部门
  async assignUserToDepartment(
    userId: string,
    departmentId: string,
    assignedBy: string,
    role?: string,
  ): Promise<void> {
    const command = new AssignUserToDepartmentCommand(
      userId,
      departmentId,
      assignedBy,
      role,
    );
    await this.commandBus.execute(command);
  }

  // 获取用户信息
  async getUser(userId: string, requesterId: string): Promise<UserDto> {
    const query = new GetUserQuery(userId);
    const context = new QueryContext(requesterId);
    return this.queryBus.execute(query, context);
  }

  // 获取用户列表
  async getUsers(
    filters: UserFilters,
    pagination: PaginationOptions,
    requesterId: string,
    sortOptions?: SortOptions,
  ): Promise<PaginatedResult<UserDto>> {
    const query = new GetUsersQuery(filters, pagination, sortOptions);
    const context = new QueryContext(requesterId);
    return this.queryBus.execute(query, context);
  }

  // 搜索用户
  async searchUsers(
    searchTerm: string,
    filters: UserFilters,
    pagination: PaginationOptions,
    requesterId: string,
  ): Promise<PaginatedResult<UserDto>> {
    const query = new SearchUsersQuery(searchTerm, filters, pagination);
    const context = new QueryContext(requesterId);
    return this.queryBus.execute(query, context);
  }

  // 获取用户权限
  async getUserPermissions(
    userId: string,
    requesterId: string,
  ): Promise<PermissionDto[]> {
    const query = new GetUserPermissionsQuery(userId);
    const context = new QueryContext(requesterId);
    return this.queryBus.execute(query, context);
  }

  // 获取用户角色
  async getUserRoles(userId: string, requesterId: string): Promise<RoleDto[]> {
    const query = new GetUserRolesQuery(userId);
    const context = new QueryContext(requesterId);
    return this.queryBus.execute(query, context);
  }
}
```

### 租户应用服务

```typescript
// 租户应用服务
@Injectable()
export class TenantApplicationService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly eventBus: EventBus,
    private readonly tenantRepository: ITenantRepository,
  ) {}

  // 创建租户
  async createTenant(
    name: string,
    type: TenantType,
    settings: TenantSettings,
    createdBy: string,
  ): Promise<string> {
    const command = new CreateTenantCommand(name, type, settings, createdBy);
    await this.commandBus.execute(command);

    // 返回租户ID
    const tenant = await this.tenantRepository.findByName(name);
    return tenant.id;
  }

  // 更新租户信息
  async updateTenant(
    tenantId: string,
    name?: string,
    settings?: TenantSettings,
    updatedBy: string,
  ): Promise<void> {
    const command = new UpdateTenantCommand(
      tenantId,
      name,
      settings,
      updatedBy,
    );
    await this.commandBus.execute(command);
  }

  // 删除租户
  async deleteTenant(
    tenantId: string,
    deletedBy: string,
    reason: string,
  ): Promise<void> {
    const command = new DeleteTenantCommand(tenantId, deletedBy, reason);
    await this.commandBus.execute(command);
  }

  // 获取租户信息
  async getTenant(tenantId: string, requesterId: string): Promise<TenantDto> {
    const query = new GetTenantQuery(tenantId);
    const context = new QueryContext(requesterId);
    return this.queryBus.execute(query, context);
  }

  // 获取租户列表
  async getTenants(
    filters: TenantFilters,
    pagination: PaginationOptions,
    requesterId: string,
  ): Promise<PaginatedResult<TenantDto>> {
    const query = new GetTenantsQuery(filters, pagination);
    const context = new QueryContext(requesterId);
    return this.queryBus.execute(query, context);
  }

  // 获取租户用户
  async getTenantUsers(
    tenantId: string,
    pagination: PaginationOptions,
    requesterId: string,
  ): Promise<PaginatedResult<UserDto>> {
    const query = new GetTenantUsersQuery(tenantId, pagination);
    const context = new QueryContext(requesterId);
    return this.queryBus.execute(query, context);
  }
}
```

## 事务管理

### 事务管理器

```typescript
// 事务管理器
@Injectable()
export class TransactionManager {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly eventStore: IEventStore,
  ) {}

  async executeInTransaction<T>(
    operation: () => Promise<T>,
    options?: TransactionOptions,
  ): Promise<T> {
    return this.entityManager.transaction(async transactionalEntityManager => {
      try {
        // 执行业务操作
        const result = await operation();

        // 提交事务
        await transactionalEntityManager.commit();

        return result;
      } catch (error) {
        // 回滚事务
        await transactionalEntityManager.rollback();
        throw error;
      }
    }, options);
  }

  async executeWithEventSourcing<T>(
    operation: () => Promise<T>,
    eventHandlers?: EventHandler[],
  ): Promise<T> {
    return this.executeInTransaction(async () => {
      // 执行业务操作
      const result = await operation();

      // 处理事件
      if (eventHandlers) {
        for (const handler of eventHandlers) {
          await handler.handle();
        }
      }

      return result;
    });
  }
}
```

## 相关文档

- [领域模型设计](./04-domain-models.md)
- [基础设施实现](./06-infrastructure.md)
- [事件溯源设计](./07-event-sourcing.md)
- [多租户数据隔离](./09-multitenant.md)

---

**上一篇**：[领域模型设计](./04-domain-models.md)  
**下一篇**：[基础设施实现](./06-infrastructure.md)
