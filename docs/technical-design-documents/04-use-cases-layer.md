# Use Cases层设计

## 文档信息

- **文档名称**: Use Cases层设计
- **文档版本**: V1.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

Use Cases层是Clean Architecture的第二层，包含应用特定的业务规则。本层负责协调Entities层的操作，实现具体的业务用例，并定义接口供外层实现。本层采用CQRS模式，将命令和查询分离，通过事件驱动架构实现松耦合。

## 设计原则

### 1. 应用业务规则

- **应用特定**: 包含应用特定的业务规则，而非企业通用规则
- **用例驱动**: 每个用例对应一个具体的业务场景
- **协调操作**: 协调Entities层的操作实现业务用例
- **事务边界**: 定义事务的边界和一致性保证

### 2. CQRS模式

- **命令查询分离**: 读写操作使用不同的模型和处理器
- **命令处理**: 处理业务命令，修改状态，发布事件
- **查询处理**: 处理查询请求，返回数据，不修改状态
- **事件驱动**: 通过事件实现命令和查询的分离

### 3. 依赖倒置

- **依赖Entities层**: 只能依赖Entities层的接口
- **定义接口**: 为外层定义需要实现的接口
- **抽象依赖**: 依赖抽象接口，不依赖具体实现
- **接口隔离**: 接口职责单一，易于实现和测试

## 用例实现设计

### 用例实现职责

用例实现负责：

1. **封装业务用例**: 将具体的业务用例封装为可重用的组件
2. **协调领域操作**: 协调Entities层的操作实现业务逻辑
3. **处理应用规则**: 处理应用特定的业务规则和验证
4. **管理事务**: 管理事务边界和一致性保证
5. **发布事件**: 在业务操作完成后发布领域事件

### 用例实现模式

#### 1. 创建用户用例

```typescript
/**
 * @class CreateUserUseCase
 * @description 创建用户用例，协调用户创建的业务流程
 *
 * 用例职责：
 * 1. 封装用户创建的业务用例
 * 2. 协调用户聚合根和领域服务
 * 3. 处理用户创建的应用规则
 * 4. 管理用户创建的事务边界
 * 5. 发布用户创建事件
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly eventBus: IEventBus,
    private readonly passwordService: IPasswordService,
    private readonly tenantService: ITenantService,
  ) {}

  /**
   * 执行创建用户用例
   * @param command 创建用户命令
   * @returns 创建结果
   */
  async execute(command: CreateUserCommand): Promise<UserCreatedResult> {
    // 1. 验证业务规则
    await this.validateBusinessRules(command);

    // 2. 创建领域对象
    const user = UserAggregate.create(
      new UserId(command.userId),
      new Email(command.email),
      await this.passwordService.hashPassword(command.password),
      new UserProfile(command.firstName, command.lastName),
      new UserPreferences(command.language, command.timezone),
    );

    // 3. 保存到仓储
    await this.userRepository.save(user);

    // 4. 发布领域事件
    await this.eventBus.publishAll(user.uncommittedEvents);

    // 5. 返回结果
    return new UserCreatedResult(user.getAggregateId());
  }

  /**
   * 验证业务规则
   */
  private async validateBusinessRules(
    command: CreateUserCommand,
  ): Promise<void> {
    // 检查邮箱唯一性
    const isEmailUnique = await this.userDomainService.isEmailUniqueInTenant(
      new Email(command.email),
      new TenantId(command.tenantId),
      this.userRepository,
    );

    if (!isEmailUnique) {
      throw new Error('Email already exists in tenant');
    }

    // 检查租户是否存在
    const tenant = await this.tenantService.findById(
      new TenantId(command.tenantId),
    );
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    // 检查租户用户配额
    const userCount = await this.userRepository.countByTenant(
      new TenantId(command.tenantId),
    );
    if (userCount >= tenant.getMaxUsers()) {
      throw new Error('Tenant user quota exceeded');
    }
  }
}
```

#### 2. 更新用户用例

```typescript
/**
 * @class UpdateUserUseCase
 * @description 更新用户用例，协调用户更新的业务流程
 *
 * 用例职责：
 * 1. 封装用户更新的业务用例
 * 2. 协调用户聚合根的更新操作
 * 3. 处理用户更新的应用规则
 * 4. 管理用户更新的事务边界
 * 5. 发布用户更新事件
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * 执行更新用户用例
   * @param command 更新用户命令
   */
  async execute(command: UpdateUserCommand): Promise<void> {
    // 1. 获取用户聚合根
    const user = await this.userRepository.findById(new UserId(command.userId));
    if (!user) {
      throw new Error('User not found');
    }

    // 2. 验证更新权限
    this.validateUpdatePermission(user, command.updatedBy);

    // 3. 执行更新操作
    if (command.profile) {
      user.updateProfile(
        new UserProfile(command.profile.firstName, command.profile.lastName),
      );
    }

    if (command.preferences) {
      user.updatePreferences(
        new UserPreferences(
          command.preferences.language,
          command.preferences.timezone,
        ),
      );
    }

    // 4. 保存到仓储
    await this.userRepository.save(user);

    // 5. 发布领域事件
    await this.eventBus.publishAll(user.uncommittedEvents);
  }

  /**
   * 验证更新权限
   */
  private validateUpdatePermission(
    user: UserAggregate,
    updatedBy: string,
  ): void {
    // 只有用户本人或管理员可以更新用户信息
    if (user.getAggregateId() !== updatedBy && !this.isAdmin(updatedBy)) {
      throw new Error('Insufficient permission to update user');
    }
  }

  private isAdmin(userId: string): boolean {
    // 检查用户是否为管理员的逻辑
    return false; // 简化实现
  }
}
```

## 命令设计

### 命令职责

命令负责：

1. **封装写操作参数**: 封装修改状态所需的参数
2. **数据验证**: 验证命令参数的有效性
3. **业务规则验证**: 验证业务规则约束
4. **权限检查**: 检查执行权限
5. **事务标识**: 提供事务标识和追踪

### 命令实现模式

#### 1. 创建用户命令

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
export class CreateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly tenantId: string,
    public readonly language: string = 'en',
    public readonly timezone: string = 'UTC',
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * 验证命令参数的有效性
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!this.email || this.email.trim().length === 0) {
      throw new Error('Email is required');
    }

    if (!this.password || this.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
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

    if (!this.requestedBy || this.requestedBy.trim().length === 0) {
      throw new Error('Requested by is required');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * 转换为JSON格式
   */
  toJSON(): Record<string, unknown> {
    return {
      userId: this.userId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      tenantId: this.tenantId,
      language: this.language,
      timezone: this.timezone,
      requestedBy: this.requestedBy,
    };
  }
}
```

#### 2. 更新用户命令

```typescript
/**
 * @class UpdateUserCommand
 * @description 更新用户命令，封装用户更新操作的输入参数和验证规则
 */
export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly profile?: {
      firstName: string;
      lastName: string;
    },
    public readonly preferences?: {
      language: string;
      timezone: string;
    },
    public readonly updatedBy: string,
  ) {
    this.validate();
  }

  /**
   * 验证命令参数的有效性
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!this.updatedBy || this.updatedBy.trim().length === 0) {
      throw new Error('Updated by is required');
    }

    if (this.profile) {
      if (
        !this.profile.firstName ||
        this.profile.firstName.trim().length === 0
      ) {
        throw new Error('First name is required');
      }

      if (!this.profile.lastName || this.profile.lastName.trim().length === 0) {
        throw new Error('Last name is required');
      }
    }

    if (this.preferences) {
      if (
        !this.preferences.language ||
        this.preferences.language.trim().length === 0
      ) {
        throw new Error('Language is required');
      }

      if (
        !this.preferences.timezone ||
        this.preferences.timezone.trim().length === 0
      ) {
        throw new Error('Timezone is required');
      }
    }
  }
}
```

## 查询设计

### 查询职责

查询负责：

1. **封装读操作参数**: 封装查询数据所需的参数
2. **过滤条件**: 提供灵活的过滤和排序选项
3. **分页支持**: 支持分页查询和性能优化
4. **权限过滤**: 根据权限过滤可访问的数据
5. **数据隔离**: 确保多租户数据隔离

### 查询实现模式

#### 1. 获取用户查询

```typescript
/**
 * @class GetUserQuery
 * @description 获取用户查询，封装用户查询操作的参数和过滤条件
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
 * 3. 支持组织级和部门级过滤
 * 4. 确保敏感信息的安全访问
 */
export class GetUserQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly includeProfile: boolean = true,
    public readonly includePreferences: boolean = false,
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * 验证查询参数的有效性
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new Error('User ID is required');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    if (!this.requestedBy || this.requestedBy.trim().length === 0) {
      throw new Error('Requested by is required');
    }
  }
}
```

#### 2. 获取用户列表查询

```typescript
/**
 * @class GetUsersQuery
 * @description 获取用户列表查询，封装用户列表查询操作的参数和过滤条件
 */
export class GetUsersQuery {
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
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * 验证查询参数的有效性
   */
  private validate(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new Error('Tenant ID is required');
    }

    if (!this.requestedBy || this.requestedBy.trim().length === 0) {
      throw new Error('Requested by is required');
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
  }

  /**
   * 获取偏移量
   */
  getOffset(): number {
    return (this.page - 1) * this.limit;
  }
}
```

## 命令处理器设计

### 命令处理器职责

命令处理器负责：

1. **处理命令**: 接收并处理具体的业务命令
2. **调用用例**: 调用相应的用例实现执行业务逻辑
3. **错误处理**: 处理命令执行过程中的错误
4. **事务管理**: 管理命令执行的事务边界
5. **事件发布**: 在命令执行完成后发布事件

### 命令处理器实现模式

#### 1. 创建用户命令处理器

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
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  /**
   * 处理创建用户命令，执行完整的用户创建流程
   * @param command 创建用户命令
   * @returns 创建结果
   */
  async handle(command: CreateUserCommand): Promise<UserCreatedResult> {
    return await this.unitOfWork.execute(async () => {
      try {
        // 1. 验证命令和权限
        await this.validateCommand(command);

        // 2. 执行用例
        const result = await this.createUserUseCase.execute(command);

        // 3. 记录操作日志
        await this.logCommandExecution(command, result);

        return result;
      } catch (error) {
        // 记录错误日志
        await this.logCommandError(command, error);
        throw error;
      }
    });
  }

  /**
   * 验证命令参数和权限
   */
  private async validateCommand(command: CreateUserCommand): Promise<void> {
    // 验证命令参数
    command.validate();

    // 验证执行权限
    await this.validatePermission(command.requestedBy, 'user:create');
  }

  /**
   * 验证执行权限
   */
  private async validatePermission(
    userId: string,
    permission: string,
  ): Promise<void> {
    // 权限验证逻辑
    const hasPermission = await this.permissionService.hasPermission(
      userId,
      permission,
    );
    if (!hasPermission) {
      throw new Error(`Insufficient permission: ${permission}`);
    }
  }

  /**
   * 记录命令执行日志
   */
  private async logCommandExecution(
    command: CreateUserCommand,
    result: UserCreatedResult,
  ): Promise<void> {
    // 记录操作日志
    await this.auditService.logCommandExecution(command, result);
  }

  /**
   * 记录命令错误日志
   */
  private async logCommandError(
    command: CreateUserCommand,
    error: Error,
  ): Promise<void> {
    // 记录错误日志
    await this.auditService.logCommandError(command, error);
  }
}
```

## 查询处理器设计

### 查询处理器职责

查询处理器负责：

1. **处理查询**: 接收并处理具体的查询请求
2. **调用用例**: 调用相应的用例实现获取数据
3. **数据转换**: 将领域对象转换为DTO
4. **权限过滤**: 根据权限过滤可访问的数据
5. **性能优化**: 优化查询性能和缓存策略

### 查询处理器实现模式

#### 1. 获取用户查询处理器

```typescript
/**
 * @class GetUserQueryHandler
 * @description 获取用户查询处理器，处理用户查询请求和优化读性能
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
@QueryHandler(GetUserQuery)
export class GetUserQueryHandler {
  constructor(
    private readonly getUserUseCase: GetUserUseCase,
    private readonly cacheService: ICacheService,
    private readonly permissionService: IPermissionService,
  ) {}

  /**
   * 处理获取用户查询，返回用户数据
   * @param query 获取用户查询
   * @returns 用户数据
   */
  async handle(query: GetUserQuery): Promise<UserDto> {
    try {
      // 1. 验证查询参数和权限
      await this.validateQuery(query);

      // 2. 生成缓存键
      const cacheKey = this.generateCacheKey(query);

      // 3. 检查缓存
      const cachedResult = await this.cacheService.get<UserDto>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      // 4. 执行用例
      const result = await this.getUserUseCase.execute(query);

      // 5. 缓存查询结果
      await this.cacheService.set(cacheKey, result, 300); // 5分钟缓存

      // 6. 返回结果
      return result;
    } catch (error) {
      // 记录查询错误
      await this.logQueryError(query, error);
      throw error;
    }
  }

  /**
   * 验证查询参数和权限
   */
  private async validateQuery(query: GetUserQuery): Promise<void> {
    // 验证查询参数
    query.validate();

    // 验证查询权限
    await this.validateQueryPermission(query);
  }

  /**
   * 验证查询权限
   */
  private async validateQueryPermission(query: GetUserQuery): Promise<void> {
    // 检查用户是否有权限查询指定用户
    const canQuery = await this.permissionService.canQueryUser(
      query.requestedBy,
      query.userId,
      query.tenantId,
    );

    if (!canQuery) {
      throw new Error('Insufficient permission to query user');
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(query: GetUserQuery): string {
    return `user:${query.userId}:${query.tenantId}:${query.includeProfile}:${query.includePreferences}`;
  }

  /**
   * 记录查询错误
   */
  private async logQueryError(
    query: GetUserQuery,
    error: Error,
  ): Promise<void> {
    // 记录查询错误日志
    await this.auditService.logQueryError(query, error);
  }
}
```

## 应用服务设计

### 应用服务职责

应用服务负责：

1. **用例协调**: 协调多个用例实现复杂的业务流程
2. **事务管理**: 管理跨用例的事务边界
3. **事件发布**: 协调领域事件的发布
4. **权限控制**: 实现应用级的权限控制
5. **错误处理**: 处理应用级的错误和异常

### 应用服务实现模式

#### 1. 用户应用服务

```typescript
/**
 * @class UserApplicationService
 * @description 用户应用服务，协调用户相关的用例
 *
 * 应用服务职责：
 * 1. 协调用户相关的用例
 * 2. 管理跨用例的事务边界
 * 3. 实现应用级的权限控制
 * 4. 处理应用级的错误和异常
 * 5. 协调领域事件的发布
 */
@Injectable()
export class UserApplicationService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * 创建用户
   * @param command 创建用户命令
   * @returns 创建结果
   */
  async createUser(command: CreateUserCommand): Promise<UserCreatedResult> {
    return await this.createUserUseCase.execute(command);
  }

  /**
   * 更新用户
   * @param command 更新用户命令
   */
  async updateUser(command: UpdateUserCommand): Promise<void> {
    return await this.updateUserUseCase.execute(command);
  }

  /**
   * 删除用户
   * @param command 删除用户命令
   */
  async deleteUser(command: DeleteUserCommand): Promise<void> {
    return await this.deleteUserUseCase.execute(command);
  }

  /**
   * 获取用户
   * @param query 获取用户查询
   * @returns 用户数据
   */
  async getUser(query: GetUserQuery): Promise<UserDto> {
    return await this.getUserUseCase.execute(query);
  }

  /**
   * 获取用户列表
   * @param query 获取用户列表查询
   * @returns 用户列表数据
   */
  async getUsers(query: GetUsersQuery): Promise<GetUsersResult> {
    return await this.getUsersUseCase.execute(query);
  }
}
```

## 测试策略

### 单元测试

```typescript
// 用例测试
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockEventBus = createMockEventBus();
    useCase = new CreateUserUseCase(mockRepository, mockEventBus, ...);
  });

  it('should create user successfully', async () => {
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

    const result = await useCase.execute(command);

    expect(result).toBeDefined();
    expect(result.userId).toBe('user-123');
    expect(mockRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publishAll).toHaveBeenCalled();
  });

  it('should throw error when email already exists', async () => {
    mockRepository.findByEmailAndTenant.mockResolvedValue(mockUser);

    const command = new CreateUserCommand(/* ... */);

    await expect(useCase.execute(command)).rejects.toThrow('Email already exists in tenant');
  });
});

// 命令处理器测试
describe('CreateUserCommandHandler', () => {
  let handler: CreateUserCommandHandler;
  let mockUseCase: jest.Mocked<CreateUserUseCase>;

  beforeEach(() => {
    mockUseCase = createMockUseCase();
    handler = new CreateUserCommandHandler(mockUseCase, ...);
  });

  it('should handle create user command', async () => {
    const command = new CreateUserCommand(/* ... */);
    const expectedResult = new UserCreatedResult('user-123');

    mockUseCase.execute.mockResolvedValue(expectedResult);

    const result = await handler.handle(command);

    expect(result).toBe(expectedResult);
    expect(mockUseCase.execute).toHaveBeenCalledWith(command);
  });
});
```

## 总结

Use Cases层是Clean Architecture的核心层，通过用例实现、命令查询分离、事件驱动等模式，实现了应用特定业务规则的清晰封装。这种设计确保了业务逻辑的可重用性、可测试性和可维护性，为整个系统提供了坚实的业务基础。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
