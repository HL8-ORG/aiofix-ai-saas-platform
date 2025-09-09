# CQRS实现指南

## 文档信息

- **文档名称**: CQRS实现指南
- **文档版本**: V1.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

CQRS（Command Query Responsibility Segregation）是一种架构模式，将数据修改操作（命令）和数据查询操作（查询）分离。本指南详细说明了如何在项目中实现CQRS模式，包括命令处理、查询处理、读写模型分离和事件驱动更新。

## CQRS核心概念

### 1. 命令和查询分离

- **命令（Command）**: 修改系统状态的操作，不返回数据
- **查询（Query）**: 读取系统状态的操作，返回数据
- **命令处理器（Command Handler）**: 处理命令的业务逻辑
- **查询处理器（Query Handler）**: 处理查询的业务逻辑

### 2. 读写模型分离

- **写模型（Write Model）**: 用于处理命令，优化写操作
- **读模型（Read Model）**: 用于处理查询，优化读操作
- **事件投影（Event Projection）**: 将领域事件投影到读模型

### 3. 最终一致性

- **异步更新**: 读模型异步更新
- **事件驱动**: 通过领域事件驱动读模型更新
- **补偿机制**: 处理不一致状态

## 命令设计

### 1. 命令接口

```typescript
/**
 * @interface ICommand
 * @description 命令接口，定义命令的基本结构
 *
 * 命令特性：
 * 1. 表示用户的意图
 * 2. 包含执行命令所需的数据
 * 3. 不返回业务数据
 * 4. 支持验证和授权
 */
export interface ICommand {
  /**
   * 命令ID
   */
  readonly commandId: string;

  /**
   * 请求者ID
   */
  readonly requestedBy: string;

  /**
   * 租户ID
   */
  readonly tenantId?: string;

  /**
   * 命令类型
   */
  readonly commandType: string;

  /**
   * 发生时间
   */
  readonly occurredOn: Date;

  /**
   * 验证命令
   */
  validate(): void;

  /**
   * 转换为JSON
   */
  toJSON(): Record<string, unknown>;
}
```

### 2. 基础命令类

```typescript
/**
 * @class Command
 * @description 基础命令类，提供命令的通用功能
 *
 * 基础功能：
 * 1. 命令ID生成
 * 2. 时间戳记录
 * 3. 基础验证
 * 4. 序列化支持
 */
export abstract class Command implements ICommand {
  public readonly commandId: string;
  public readonly requestedBy: string;
  public readonly tenantId?: string;
  public readonly commandType: string;
  public readonly occurredOn: Date;

  constructor(requestedBy: string, tenantId?: string) {
    this.commandId = uuid.v4();
    this.requestedBy = requestedBy;
    this.tenantId = tenantId;
    this.commandType = this.constructor.name;
    this.occurredOn = new Date();
  }

  /**
   * 验证命令
   */
  validate(): void {
    if (!this.requestedBy) {
      throw new Error('RequestedBy is required');
    }
  }

  /**
   * 转换为JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      commandId: this.commandId,
      requestedBy: this.requestedBy,
      tenantId: this.tenantId,
      commandType: this.commandType,
      occurredOn: this.occurredOn,
    };
  }
}
```

### 3. 具体命令实现

```typescript
/**
 * @class CreateUserCommand
 * @description 创建用户命令，封装用户创建操作的输入参数和验证规则
 *
 * 命令职责：
 * 1. 封装用户创建所需的所有输入参数
 * 2. 提供数据验证和格式检查
 * 3. 确保命令的不可变性和幂等性
 * 4. 支持命令的序列化和反序列化
 *
 * 数据隔离要求：
 * 1. 命令必须包含租户ID以确保数据隔离
 * 2. 验证用户邮箱在租户内的唯一性
 * 3. 确保命令执行者具有相应权限
 */
export class CreateUserCommand extends Command {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly tenantId: string,
    public readonly language?: string,
    public readonly timezone?: string,
    requestedBy: string,
  ) {
    super(requestedBy, tenantId);
    this.validate();
  }

  /**
   * 验证命令参数的有效性
   */
  validate(): void {
    super.validate();

    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!this.email || this.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    if (!this.password || this.password.trim().length === 0) {
      throw new Error('Password is required');
    }

    if (!this.firstName || this.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    if (!this.lastName || this.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format');
    }

    // 验证密码强度
    if (this.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }
  }

  /**
   * 转换为JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      userId: this.userId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      tenantId: this.tenantId,
      language: this.language,
      timezone: this.timezone,
    };
  }
}
```

## 查询设计

### 1. 查询接口

```typescript
/**
 * @interface IQuery
 * @description 查询接口，定义查询的基本结构
 *
 * 查询特性：
 * 1. 表示用户的查询意图
 * 2. 包含查询所需的条件
 * 3. 返回查询结果
 * 4. 支持分页和排序
 */
export interface IQuery<TResult = unknown> {
  /**
   * 查询ID
   */
  readonly queryId: string;

  /**
   * 请求者ID
   */
  readonly requestedBy: string;

  /**
   * 租户ID
   */
  readonly tenantId?: string;

  /**
   * 查询类型
   */
  readonly queryType: string;

  /**
   * 发生时间
   */
  readonly occurredOn: Date;

  /**
   * 验证查询
   */
  validate(): void;

  /**
   * 转换为JSON
   */
  toJSON(): Record<string, unknown>;
}
```

### 2. 基础查询类

```typescript
/**
 * @class Query
 * @description 基础查询类，提供查询的通用功能
 *
 * 基础功能：
 * 1. 查询ID生成
 * 2. 时间戳记录
 * 3. 基础验证
 * 4. 序列化支持
 */
export abstract class Query<TResult = unknown> implements IQuery<TResult> {
  public readonly queryId: string;
  public readonly requestedBy: string;
  public readonly tenantId?: string;
  public readonly queryType: string;
  public readonly occurredOn: Date;

  constructor(requestedBy: string, tenantId?: string) {
    this.queryId = uuid.v4();
    this.requestedBy = requestedBy;
    this.tenantId = tenantId;
    this.queryType = this.constructor.name;
    this.occurredOn = new Date();
  }

  /**
   * 验证查询
   */
  validate(): void {
    if (!this.requestedBy) {
      throw new Error('RequestedBy is required');
    }
  }

  /**
   * 转换为JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      queryId: this.queryId,
      requestedBy: this.requestedBy,
      tenantId: this.tenantId,
      queryType: this.queryType,
      occurredOn: this.occurredOn,
    };
  }
}
```

### 3. 具体查询实现

```typescript
/**
 * @class GetUsersQuery
 * @description 获取用户列表查询，封装用户查询操作的参数和过滤条件
 *
 * 查询职责：
 * 1. 封装用户查询所需的所有参数
 * 2. 提供灵活的过滤和排序选项
 * 3. 支持分页和性能优化
 * 4. 确保查询结果的数据隔离
 *
 * 数据隔离要求：
 * 1. 查询必须基于租户ID进行数据隔离
 * 2. 根据查询者权限过滤可访问的数据
 * 3. 支持组织级和部门级的数据过滤
 * 4. 确保敏感信息的安全访问
 */
export class GetUsersQuery extends Query<GetUsersResult> {
  constructor(
    public readonly tenantId: string,
    public readonly organizationId?: string,
    public readonly departmentId?: string,
    public readonly status?: string,
    public readonly searchTerm?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly sortBy: string = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
    requestedBy: string,
  ) {
    super(requestedBy, tenantId);
    this.validate();
  }

  /**
   * 验证查询参数的有效性
   */
  validate(): void {
    super.validate();

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    if (this.page < 1) {
      throw new Error('Page must be greater than 0');
    }

    if (this.limit < 1 || this.limit > 100) {
      throw new Error('Limit must be between 1 and 100');
    }

    const allowedSortFields = [
      'createdAt',
      'updatedAt',
      'firstName',
      'lastName',
      'email',
    ];
    if (!allowedSortFields.includes(this.sortBy)) {
      throw new Error(`Invalid sort field: ${this.sortBy}`);
    }

    if (!['asc', 'desc'].includes(this.sortOrder)) {
      throw new Error(`Invalid sort order: ${this.sortOrder}`);
    }
  }

  /**
   * 转换为JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      tenantId: this.tenantId,
      organizationId: this.organizationId,
      departmentId: this.departmentId,
      status: this.status,
      searchTerm: this.searchTerm,
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };
  }
}
```

## 命令处理器

### 1. 命令处理器接口

```typescript
/**
 * @interface ICommandHandler
 * @description 命令处理器接口，定义命令处理的基本操作
 *
 * 处理器职责：
 * 1. 处理命令的业务逻辑
 * 2. 验证命令的有效性
 * 3. 执行领域操作
 * 4. 发布领域事件
 */
export interface ICommandHandler<TCommand extends ICommand = ICommand> {
  /**
   * 处理命令
   * @param command 命令对象
   */
  handle(command: TCommand): Promise<void>;

  /**
   * 获取处理器名称
   * @returns 处理器名称
   */
  getHandlerName(): string;

  /**
   * 获取支持的命令类型
   * @returns 命令类型列表
   */
  getSupportedCommandTypes(): string[];

  /**
   * 检查是否支持命令类型
   * @param commandType 命令类型
   * @returns 是否支持
   */
  supportsCommandType(commandType: string): boolean;
}
```

### 2. 基础命令处理器

```typescript
/**
 * @class CommandHandler
 * @description 基础命令处理器，提供命令处理的通用功能
 *
 * 基础功能：
 * 1. 命令验证
 * 2. 权限检查
 * 3. 事务管理
 * 4. 错误处理
 */
export abstract class CommandHandler<TCommand extends ICommand = ICommand>
  implements ICommandHandler<TCommand>
{
  constructor(
    protected readonly logger: Logger,
    protected readonly unitOfWork: IUnitOfWork,
  ) {}

  /**
   * 处理命令
   * @param command 命令对象
   */
  async handle(command: TCommand): Promise<void> {
    try {
      // 1. 验证命令
      this.validateCommand(command);

      // 2. 检查权限
      await this.checkPermission(command);

      // 3. 执行命令
      await this.unitOfWork.execute(async () => {
        await this.executeCommand(command);
      });

      this.logger.log(`Command handled successfully: ${command.commandType}`);
    } catch (error) {
      this.logger.error(
        `Command handling failed: ${command.commandType}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 执行命令（子类实现）
   * @param command 命令对象
   */
  protected abstract executeCommand(command: TCommand): Promise<void>;

  /**
   * 验证命令
   * @param command 命令对象
   */
  protected validateCommand(command: TCommand): void {
    command.validate();
  }

  /**
   * 检查权限
   * @param command 命令对象
   */
  protected async checkPermission(command: TCommand): Promise<void> {
    // 基础权限检查逻辑
    // 子类可以重写此方法实现特定的权限检查
  }

  /**
   * 获取处理器名称
   * @returns 处理器名称
   */
  getHandlerName(): string {
    return this.constructor.name;
  }

  /**
   * 获取支持的命令类型
   * @returns 命令类型列表
   */
  abstract getSupportedCommandTypes(): string[];

  /**
   * 检查是否支持命令类型
   * @param commandType 命令类型
   * @returns 是否支持
   */
  supportsCommandType(commandType: string): boolean {
    return this.getSupportedCommandTypes().includes(commandType);
  }
}
```

### 3. 具体命令处理器实现

```typescript
/**
 * @class CreateUserCommandHandler
 * @description 创建用户命令处理器，处理用户创建命令的业务逻辑和事务管理
 *
 * 处理器职责：
 * 1. 接收并验证创建用户命令
 * 2. 协调领域服务和仓储操作
 * 3. 管理事务边界和异常处理
 * 4. 发布领域事件和集成事件
 *
 * 业务逻辑流程：
 * 1. 验证命令参数和权限
 * 2. 检查邮箱唯一性约束
 * 3. 创建用户聚合根
 * 4. 保存到写模型数据库
 * 5. 发布用户创建事件
 * 6. 更新读模型视图
 *
 * 事务管理：
 * 1. 整个处理过程在一个事务中执行
 * 2. 失败时自动回滚所有操作
 * 3. 成功后提交事务并发布事件
 * 4. 支持分布式事务协调
 */
@Injectable()
export class CreateUserCommandHandler extends CommandHandler<CreateUserCommand> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly eventBus: IEventBus,
    private readonly emailService: IEmailService,
    private readonly permissionService: IPermissionService,
    private readonly auditService: IAuditService,
    logger: Logger,
    unitOfWork: IUnitOfWork,
  ) {
    super(logger, unitOfWork);
  }

  /**
   * 执行创建用户命令
   * @param command 创建用户命令
   */
  protected async executeCommand(command: CreateUserCommand): Promise<void> {
    // 1. 验证业务规则
    await this.validateBusinessRules(command);

    // 2. 创建用户聚合根
    const user = await this.createUserAggregate(command);

    // 3. 保存到写模型
    await this.userRepository.save(user);

    // 4. 发布领域事件
    await this.eventBus.publishAll(user.uncommittedEvents);

    // 5. 记录审计日志
    await this.auditService.logCommandExecution(command, {
      userId: user.getAggregateId(),
      email: command.email,
    });
  }

  /**
   * 验证业务规则
   * @param command 创建用户命令
   */
  private async validateBusinessRules(
    command: CreateUserCommand,
  ): Promise<void> {
    // 检查邮箱唯一性
    const isEmailUnique = await this.userDomainService.isEmailUniqueInTenant(
      new Email(command.email),
      new TenantId(command.tenantId),
    );

    if (!isEmailUnique) {
      throw new Error('Email already exists in tenant');
    }

    // 检查租户用户配额
    const userCount = await this.userRepository.countByTenant(
      new TenantId(command.tenantId),
    );

    const maxUsers = await this.getTenantMaxUsers(command.tenantId);
    if (userCount >= maxUsers) {
      throw new Error('Tenant user quota exceeded');
    }
  }

  /**
   * 创建用户聚合根
   * @param command 创建用户命令
   * @returns 用户聚合根
   */
  private async createUserAggregate(
    command: CreateUserCommand,
  ): Promise<UserAggregate> {
    const user = UserAggregate.create(
      new UserId(command.userId),
      new Email(command.email),
      await this.hashPassword(command.password),
      new UserProfile(command.firstName, command.lastName),
      new UserPreferences(command.language, command.timezone),
    );

    return user;
  }

  /**
   * 哈希密码
   * @param password 原始密码
   * @returns 哈希后的密码
   */
  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 12);
  }

  /**
   * 获取租户最大用户数
   * @param tenantId 租户ID
   * @returns 最大用户数
   */
  private async getTenantMaxUsers(tenantId: string): Promise<number> {
    // 从配置或租户设置中获取最大用户数
    return 100; // 默认值
  }

  /**
   * 检查权限
   * @param command 创建用户命令
   */
  protected async checkPermission(command: CreateUserCommand): Promise<void> {
    const hasPermission = await this.permissionService.hasPermission(
      command.requestedBy,
      'user:create',
    );

    if (!hasPermission) {
      throw new Error('Insufficient permission to create user');
    }
  }

  /**
   * 获取支持的命令类型
   * @returns 命令类型列表
   */
  getSupportedCommandTypes(): string[] {
    return ['CreateUserCommand'];
  }
}
```

## 查询处理器

### 1. 查询处理器接口

```typescript
/**
 * @interface IQueryHandler
 * @description 查询处理器接口，定义查询处理的基本操作
 *
 * 处理器职责：
 * 1. 处理查询的业务逻辑
 * 2. 验证查询的有效性
 * 3. 从读模型获取数据
 * 4. 返回查询结果
 */
export interface IQueryHandler<
  TQuery extends IQuery = IQuery,
  TResult = unknown,
> {
  /**
   * 处理查询
   * @param query 查询对象
   * @returns 查询结果
   */
  handle(query: TQuery): Promise<TResult>;

  /**
   * 获取处理器名称
   * @returns 处理器名称
   */
  getHandlerName(): string;

  /**
   * 获取支持的查询类型
   * @returns 查询类型列表
   */
  getSupportedQueryTypes(): string[];

  /**
   * 检查是否支持查询类型
   * @param queryType 查询类型
   * @returns 是否支持
   */
  supportsQueryType(queryType: string): boolean;
}
```

### 2. 基础查询处理器

```typescript
/**
 * @class QueryHandler
 * @description 基础查询处理器，提供查询处理的通用功能
 *
 * 基础功能：
 * 1. 查询验证
 * 2. 权限检查
 * 3. 缓存管理
 * 4. 错误处理
 */
export abstract class QueryHandler<
  TQuery extends IQuery = IQuery,
  TResult = unknown,
> implements IQueryHandler<TQuery, TResult>
{
  constructor(
    protected readonly logger: Logger,
    protected readonly cacheService: ICacheService,
  ) {}

  /**
   * 处理查询
   * @param query 查询对象
   * @returns 查询结果
   */
  async handle(query: TQuery): Promise<TResult> {
    try {
      // 1. 验证查询
      this.validateQuery(query);

      // 2. 检查权限
      await this.checkPermission(query);

      // 3. 检查缓存
      const cacheKey = this.generateCacheKey(query);
      const cachedResult = await this.cacheService.get<TResult>(cacheKey);
      if (cachedResult) {
        this.logger.log(
          `Query result retrieved from cache: ${query.queryType}`,
        );
        return cachedResult;
      }

      // 4. 执行查询
      const result = await this.executeQuery(query);

      // 5. 缓存结果
      await this.cacheService.set(cacheKey, result, 300); // 5分钟缓存

      this.logger.log(`Query handled successfully: ${query.queryType}`);
      return result;
    } catch (error) {
      this.logger.error(`Query handling failed: ${query.queryType}`, error);
      throw error;
    }
  }

  /**
   * 执行查询（子类实现）
   * @param query 查询对象
   * @returns 查询结果
   */
  protected abstract executeQuery(query: TQuery): Promise<TResult>;

  /**
   * 验证查询
   * @param query 查询对象
   */
  protected validateQuery(query: TQuery): void {
    query.validate();
  }

  /**
   * 检查权限
   * @param query 查询对象
   */
  protected async checkPermission(query: TQuery): Promise<void> {
    // 基础权限检查逻辑
    // 子类可以重写此方法实现特定的权限检查
  }

  /**
   * 生成缓存键
   * @param query 查询对象
   * @returns 缓存键
   */
  protected generateCacheKey(query: TQuery): string {
    return `${query.queryType}:${query.queryId}`;
  }

  /**
   * 获取处理器名称
   * @returns 处理器名称
   */
  getHandlerName(): string {
    return this.constructor.name;
  }

  /**
   * 获取支持的查询类型
   * @returns 查询类型列表
   */
  abstract getSupportedQueryTypes(): string[];

  /**
   * 检查是否支持查询类型
   * @param queryType 查询类型
   * @returns 是否支持
   */
  supportsQueryType(queryType: string): boolean {
    return this.getSupportedQueryTypes().includes(queryType);
  }
}
```

### 3. 具体查询处理器实现

```typescript
/**
 * @class GetUsersQueryHandler
 * @description 获取用户列表查询处理器，处理用户查询请求和优化读性能
 *
 * 处理器职责：
 * 1. 接收并验证用户查询请求
 * 2. 从读模型数据库获取数据
 * 3. 应用数据隔离和权限过滤
 * 4. 优化查询性能和缓存策略
 *
 * 查询优化策略：
 * 1. 使用专门的读模型数据库
 * 2. 实现查询结果缓存机制
 * 3. 支持分页和索引优化
 * 4. 避免N+1查询问题
 *
 * 数据隔离实现：
 * 1. 基于租户ID进行数据隔离
 * 2. 根据用户权限过滤可访问数据
 * 3. 支持组织级和部门级过滤
 * 4. 确保敏感数据的安全访问
 */
@Injectable()
export class GetUsersQueryHandler extends QueryHandler<
  GetUsersQuery,
  GetUsersResult
> {
  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly permissionService: IPermissionService,
    private readonly dataIsolationService: DataIsolationService,
    logger: Logger,
    cacheService: ICacheService,
  ) {
    super(logger, cacheService);
  }

  /**
   * 执行获取用户列表查询
   * @param query 获取用户列表查询
   * @returns 查询结果
   */
  protected async executeQuery(query: GetUsersQuery): Promise<GetUsersResult> {
    // 1. 构建查询条件
    const filters = this.buildQueryFilters(query);

    // 2. 应用数据隔离
    const isolationContext =
      await this.dataIsolationService.getDataIsolationContext(
        query.requestedBy,
      );
    this.applyDataIsolation(filters, isolationContext);

    // 3. 执行查询
    const result = await this.userReadRepository.findUsers(filters, {
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return result;
  }

  /**
   * 构建查询过滤条件
   * @param query 查询对象
   * @returns 过滤条件
   */
  private buildQueryFilters(query: GetUsersQuery): UserFilters {
    const filters: UserFilters = {
      tenantId: query.tenantId,
    };

    if (query.organizationId) {
      filters.organizationId = query.organizationId;
    }

    if (query.departmentId) {
      filters.departmentId = query.departmentId;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.searchTerm) {
      filters.searchTerm = query.searchTerm;
    }

    return filters;
  }

  /**
   * 应用数据隔离
   * @param filters 过滤条件
   * @param isolationContext 隔离上下文
   */
  private applyDataIsolation(
    filters: UserFilters,
    isolationContext: DataIsolationContext,
  ): void {
    // 根据隔离级别应用相应的过滤条件
    switch (isolationContext.isolationLevel) {
      case IsolationLevel.PLATFORM:
        // 平台级：可以访问所有数据
        break;
      case IsolationLevel.TENANT:
        // 租户级：只能访问本租户数据
        filters.tenantId = isolationContext.tenantId;
        break;
      case IsolationLevel.ORGANIZATION:
        // 组织级：只能访问本组织数据
        filters.tenantId = isolationContext.tenantId;
        filters.organizationId = isolationContext.organizationId;
        break;
      case IsolationLevel.DEPARTMENT:
        // 部门级：只能访问本部门数据
        filters.tenantId = isolationContext.tenantId;
        filters.organizationId = isolationContext.organizationId;
        filters.departmentId = isolationContext.departmentId;
        break;
      case IsolationLevel.USER:
        // 用户级：只能访问个人数据
        filters.userId = isolationContext.userId;
        break;
    }
  }

  /**
   * 检查权限
   * @param query 查询对象
   */
  protected async checkPermission(query: GetUsersQuery): Promise<void> {
    const hasPermission = await this.permissionService.hasPermission(
      query.requestedBy,
      'user:read',
    );

    if (!hasPermission) {
      throw new Error('Insufficient permission to read users');
    }
  }

  /**
   * 生成缓存键
   * @param query 查询对象
   * @returns 缓存键
   */
  protected generateCacheKey(query: GetUsersQuery): string {
    return `users:${query.tenantId}:${query.page}:${query.limit}:${query.sortBy}:${query.sortOrder}`;
  }

  /**
   * 获取支持的查询类型
   * @returns 查询类型列表
   */
  getSupportedQueryTypes(): string[] {
    return ['GetUsersQuery'];
  }
}
```

## 事件投影

### 1. 事件投影接口

```typescript
/**
 * @interface IEventProjection
 * @description 事件投影接口，定义事件投影的基本操作
 *
 * 投影职责：
 * 1. 将领域事件投影到读模型
 * 2. 维护读模型的一致性
 * 3. 支持投影的重建和修复
 * 4. 提供投影的监控和统计
 */
export interface IEventProjection {
  /**
   * 处理领域事件
   * @param event 领域事件
   */
  handle(event: IDomainEvent): Promise<void>;

  /**
   * 重建投影
   * @param fromEventId 起始事件ID
   * @param toEventId 结束事件ID
   */
  rebuild(fromEventId?: string, toEventId?: string): Promise<void>;

  /**
   * 获取投影状态
   * @returns 投影状态
   */
  getProjectionState(): Promise<IProjectionState>;

  /**
   * 重置投影
   */
  reset(): Promise<void>;
}
```

### 2. 用户事件投影实现

```typescript
/**
 * @class UserEventProjection
 * @description 用户事件投影，负责将用户相关的领域事件投影到读模型视图
 *
 * 投影职责：
 * 1. 监听和处理用户相关的领域事件
 * 2. 维护用户相关的读模型视图
 * 3. 支持投影的增量更新
 * 4. 处理投影的异常和恢复
 *
 * 读模型维护：
 * 1. 用户列表视图
 * 2. 用户统计视图
 * 3. 用户权限视图
 * 4. 用户活动视图
 */
@Injectable()
export class UserEventProjection implements IEventProjection {
  private projectionState: IProjectionState;

  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly userStatisticsRepository: IUserStatisticsRepository,
    private readonly userPermissionRepository: IUserPermissionRepository,
    private readonly projectionStateRepository: IProjectionStateRepository,
    private readonly eventStore: IEventStore,
    private readonly logger: Logger,
  ) {
    this.projectionState = this.initializeProjectionState();
  }

  /**
   * 处理用户相关事件，更新读模型视图
   * @param event 领域事件
   */
  async handle(event: IDomainEvent): Promise<void> {
    try {
      // 1. 检查事件是否已处理（幂等性）
      if (await this.isEventProcessed(event)) {
        return;
      }

      // 2. 根据事件类型处理
      switch (event.eventType) {
        case 'UserCreated':
          await this.handleUserCreated(event as UserCreatedEvent);
          break;
        case 'UserUpdated':
          await this.handleUserUpdated(event as UserUpdatedEvent);
          break;
        case 'UserDeleted':
          await this.handleUserDeleted(event as UserDeletedEvent);
          break;
        default:
          // 忽略不相关的事件
          break;
      }

      // 3. 记录事件处理状态
      await this.recordEventProcessed(event);
    } catch (error) {
      // 记录投影处理失败
      await this.recordProjectionError(event, error);
      throw new ProjectionError(
        `Failed to process event ${event.eventType}: ${error.message}`,
      );
    }
  }

  /**
   * 处理用户创建事件
   * @param event 用户创建事件
   */
  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    // 更新用户列表视图
    await this.userReadRepository.addUser({
      id: event.aggregateId,
      email: event.email,
      profile: event.profile,
      status: 'ACTIVE',
      platformId: event.platformId,
      tenantId: event.tenantId,
      organizationId: event.organizationId,
      departmentId: event.departmentId,
      createdAt: event.occurredOn,
    });

    // 更新用户统计
    await this.userStatisticsRepository.incrementUserCount(event.tenantId);

    // 创建默认权限
    await this.userPermissionRepository.createDefaultPermissions(
      event.aggregateId,
      event.platformId,
      event.tenantId,
    );
  }

  /**
   * 处理用户更新事件
   * @param event 用户更新事件
   */
  private async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    // 更新用户信息
    await this.userReadRepository.updateUser(event.aggregateId, {
      profile: event.profile,
      preferences: event.preferences,
      updatedAt: event.occurredOn,
    });
  }

  /**
   * 处理用户删除事件
   * @param event 用户删除事件
   */
  private async handleUserDeleted(event: UserDeletedEvent): Promise<void> {
    // 删除用户信息
    await this.userReadRepository.deleteUser(event.aggregateId);

    // 更新用户统计
    await this.userStatisticsRepository.decrementUserCount(event.tenantId);

    // 删除用户权限
    await this.userPermissionRepository.deleteUserPermissions(
      event.aggregateId,
    );
  }

  /**
   * 检查事件是否已处理
   * @param event 领域事件
   * @returns 是否已处理
   */
  private async isEventProcessed(event: IDomainEvent): Promise<boolean> {
    return await this.projectionStateRepository.isEventProcessed(
      'UserEventProjection',
      event.getEventId(),
    );
  }

  /**
   * 记录事件处理状态
   * @param event 领域事件
   */
  private async recordEventProcessed(event: IDomainEvent): Promise<void> {
    await this.projectionStateRepository.recordEventProcessed(
      'UserEventProjection',
      event.getEventId(),
      event.occurredOn,
    );
  }

  /**
   * 记录投影错误
   * @param event 领域事件
   * @param error 错误信息
   */
  private async recordProjectionError(
    event: IDomainEvent,
    error: Error,
  ): Promise<void> {
    await this.projectionStateRepository.recordProjectionError(
      'UserEventProjection',
      event.getEventId(),
      error.message,
      new Date(),
    );
  }

  /**
   * 初始化投影状态
   */
  private initializeProjectionState(): IProjectionState {
    return {
      projectionName: 'UserEventProjection',
      lastProcessedEventId: null,
      lastProcessedEventTime: null,
      processedEventCount: 0,
      errorCount: 0,
      lastError: null,
      lastErrorTime: null,
    };
  }
}
```

## 测试策略

### 1. 命令处理器测试

```typescript
describe('CreateUserCommandHandler', () => {
  let handler: CreateUserCommandHandler;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockEventBus = createMockEventBus();

    handler = new CreateUserCommandHandler(
      mockUserRepository,
      mockUserDomainService,
      mockEventBus,
      mockEmailService,
      mockPermissionService,
      mockAuditService,
      mockLogger,
      mockUnitOfWork,
    );
  });

  it('should create user successfully', async () => {
    // 准备测试数据
    const command = new CreateUserCommand(
      'user-123',
      'user@example.com',
      'password123',
      'John',
      'Doe',
      'tenant-456',
      'en',
      'UTC',
      'admin-789',
    );

    // 设置模拟对象行为
    mockUserDomainService.isEmailUniqueInTenant.mockResolvedValue(true);
    mockUserRepository.countByTenant.mockResolvedValue(5);
    mockUserRepository.save.mockResolvedValue();
    mockEventBus.publishAll.mockResolvedValue();

    // 执行命令
    await handler.handle(command);

    // 验证结果
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publishAll).toHaveBeenCalled();
  });

  it('should throw error when email already exists', async () => {
    // 准备测试数据
    const command = new CreateUserCommand(
      'user-123',
      'user@example.com',
      'password123',
      'John',
      'Doe',
      'tenant-456',
      'en',
      'UTC',
      'admin-789',
    );

    // 设置模拟对象行为
    mockUserDomainService.isEmailUniqueInTenant.mockResolvedValue(false);

    // 执行命令并验证异常
    await expect(handler.handle(command)).rejects.toThrow(
      'Email already exists in tenant',
    );
  });
});
```

### 2. 查询处理器测试

```typescript
describe('GetUsersQueryHandler', () => {
  let handler: GetUsersQueryHandler;
  let mockUserReadRepository: jest.Mocked<IUserReadRepository>;

  beforeEach(() => {
    mockUserReadRepository = createMockUserReadRepository();

    handler = new GetUsersQueryHandler(
      mockUserReadRepository,
      mockPermissionService,
      mockDataIsolationService,
      mockLogger,
      mockCacheService,
    );
  });

  it('should return users successfully', async () => {
    // 准备测试数据
    const query = new GetUsersQuery(
      'tenant-456',
      undefined,
      undefined,
      'ACTIVE',
      undefined,
      1,
      20,
      'createdAt',
      'desc',
      'user-789',
    );

    // 设置模拟对象行为
    const mockResult: GetUsersResult = {
      data: [
        {
          id: 'user-123',
          email: 'user@example.com',
          profile: { firstName: 'John', lastName: 'Doe' },
          status: 'ACTIVE',
          createdAt: new Date(),
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    };

    mockUserReadRepository.findUsers.mockResolvedValue(mockResult);

    // 执行查询
    const result = await handler.handle(query);

    // 验证结果
    expect(result).toEqual(mockResult);
    expect(mockUserReadRepository.findUsers).toHaveBeenCalled();
  });
});
```

## 总结

CQRS模式通过命令和查询的分离，实现了读写模型的优化和业务逻辑的清晰分离。本指南提供了完整的CQRS实现方法，包括命令设计、查询设计、处理器实现和事件投影，为项目的高性能和高可维护性提供了坚实的基础。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
