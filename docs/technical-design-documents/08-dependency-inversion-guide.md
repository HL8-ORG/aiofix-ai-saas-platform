# 依赖倒置实施指南

## 文档信息

- **文档名称**: 依赖倒置实施指南
- **文档版本**: V1.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

依赖倒置原则（Dependency Inversion Principle, DIP）是Clean Architecture的核心原则之一，它要求高层模块不应该依赖低层模块，两者都应该依赖于抽象。本指南详细说明了如何在项目中正确实施依赖倒置原则，确保架构的灵活性和可测试性。

## 依赖倒置原则

### 1. 基本原则

- **高层模块不依赖低层模块**: 业务逻辑层不依赖基础设施层
- **两者都依赖抽象**: 通过接口和抽象类定义依赖关系
- **抽象不依赖细节**: 接口定义不包含具体实现细节
- **细节依赖抽象**: 具体实现必须实现定义的接口

### 2. 依赖方向

```
高层模块 (Use Cases) → 抽象接口 ← 低层模块 (Infrastructure)
```

- **向内依赖**: 依赖关系指向架构中心
- **接口隔离**: 每个接口职责单一
- **实现可替换**: 可以轻松替换具体实现

## 接口设计原则

### 1. 接口定义

#### 仓储接口示例

```typescript
/**
 * @interface IUserRepository
 * @description 用户仓储接口，定义用户数据访问的抽象操作
 *
 * 接口职责：
 * 1. 定义用户数据访问的抽象操作
 * 2. 提供类型安全的数据访问接口
 * 3. 支持多租户数据隔离
 * 4. 实现数据访问的抽象化
 *
 * 依赖倒置实现：
 * 1. Use Cases层依赖此接口，不依赖具体实现
 * 2. Infrastructure层实现此接口
 * 3. 支持多种数据存储实现
 * 4. 便于单元测试和集成测试
 */
export interface IUserRepository {
  /**
   * 根据ID查找用户
   * @param id 用户ID
   * @returns 用户聚合根或null
   */
  findById(id: UserId): Promise<UserAggregate | null>;

  /**
   * 根据邮箱和租户查找用户
   * @param email 用户邮箱
   * @param tenantId 租户ID
   * @returns 用户聚合根或null
   */
  findByEmailAndTenant(
    email: Email,
    tenantId: TenantId,
  ): Promise<UserAggregate | null>;

  /**
   * 保存用户聚合根
   * @param user 用户聚合根
   */
  save(user: UserAggregate): Promise<void>;

  /**
   * 删除用户
   * @param id 用户ID
   */
  delete(id: UserId): Promise<void>;

  /**
   * 统计租户用户数量
   * @param tenantId 租户ID
   * @returns 用户数量
   */
  countByTenant(tenantId: TenantId): Promise<number>;

  /**
   * 检查邮箱在租户内是否唯一
   * @param email 用户邮箱
   * @param tenantId 租户ID
   * @param excludeUserId 排除的用户ID
   * @returns 是否唯一
   */
  isEmailUniqueInTenant(
    email: Email,
    tenantId: TenantId,
    excludeUserId?: UserId,
  ): Promise<boolean>;
}
```

#### 事件总线接口示例

```typescript
/**
 * @interface IEventBus
 * @description 事件总线接口，定义事件发布和订阅的抽象操作
 *
 * 接口职责：
 * 1. 定义事件发布和订阅的抽象操作
 * 2. 提供类型安全的事件处理接口
 * 3. 支持异步事件处理
 * 4. 实现事件处理的抽象化
 *
 * 依赖倒置实现：
 * 1. Use Cases层依赖此接口发布事件
 * 2. Interface Adapters层依赖此接口订阅事件
 * 3. Infrastructure层实现此接口
 * 4. 支持多种消息队列实现
 */
export interface IEventBus {
  /**
   * 发布领域事件
   * @param event 领域事件
   */
  publish(event: IDomainEvent): Promise<void>;

  /**
   * 发布多个领域事件
   * @param events 领域事件列表
   */
  publishAll(events: IDomainEvent[]): Promise<void>;

  /**
   * 订阅领域事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  subscribe(eventType: string, handler: IEventHandler): void;

  /**
   * 取消订阅领域事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  unsubscribe(eventType: string, handler: IEventHandler): void;
}
```

### 2. 接口隔离原则

#### 单一职责接口

```typescript
/**
 * @interface IUserReadRepository
 * @description 用户读模型仓储接口，专门用于查询操作
 *
 * 接口隔离：
 * 1. 只包含查询相关的方法
 * 2. 不包含写操作方法
 * 3. 支持CQRS模式的读模型
 * 4. 优化查询性能
 */
export interface IUserReadRepository {
  /**
   * 根据ID查找用户
   * @param id 用户ID
   * @returns 用户DTO或null
   */
  findById(id: string): Promise<UserDto | null>;

  /**
   * 根据条件查找用户列表
   * @param filters 过滤条件
   * @param pagination 分页参数
   * @returns 用户列表
   */
  findUsers(
    filters: UserFilters,
    pagination: PaginationOptions,
  ): Promise<GetUsersResult>;

  /**
   * 统计用户数量
   * @param filters 过滤条件
   * @returns 用户数量
   */
  countUsers(filters: UserFilters): Promise<number>;
}

/**
 * @interface IUserWriteRepository
 * @description 用户写模型仓储接口，专门用于写操作
 *
 * 接口隔离：
 * 1. 只包含写操作相关的方法
 * 2. 不包含查询操作方法
 * 3. 支持CQRS模式的写模型
 * 4. 优化写操作性能
 */
export interface IUserWriteRepository {
  /**
   * 保存用户聚合根
   * @param user 用户聚合根
   */
  save(user: UserAggregate): Promise<void>;

  /**
   * 删除用户
   * @param id 用户ID
   */
  delete(id: UserId): Promise<void>;

  /**
   * 更新用户
   * @param user 用户聚合根
   */
  update(user: UserAggregate): Promise<void>;
}
```

## 依赖注入实现

### 1. NestJS依赖注入

#### 模块配置

```typescript
/**
 * @class UserModule
 * @description 用户模块，配置用户相关的依赖注入
 *
 * 依赖注入配置：
 * 1. 提供Use Cases层的服务
 * 2. 配置Interface Adapters层的实现
 * 3. 绑定Infrastructure层的实现
 * 4. 实现依赖倒置原则
 */
@Module({
  imports: [
    // 导入共享模块
    SharedModule,
    // 导入基础设施模块
    DatabaseModule,
    EventBusModule,
    CacheModule,
  ],
  controllers: [
    // Interface Adapters层 - 控制器
    UserController,
    UserGraphQLResolver,
  ],
  providers: [
    // Use Cases层 - 用例服务
    {
      provide: 'CreateUserUseCase',
      useClass: CreateUserUseCase,
    },
    {
      provide: 'UpdateUserUseCase',
      useClass: UpdateUserUseCase,
    },
    {
      provide: 'GetUserUseCase',
      useClass: GetUserUseCase,
    },
    {
      provide: 'GetUsersUseCase',
      useClass: GetUsersUseCase,
    },
    // Use Cases层 - 应用服务
    {
      provide: 'UserApplicationService',
      useClass: UserApplicationService,
    },
    // Interface Adapters层 - 事件处理器
    {
      provide: 'UserCreatedEventHandler',
      useClass: UserCreatedEventHandler,
    },
    {
      provide: 'UserUpdatedEventHandler',
      useClass: UserUpdatedEventHandler,
    },
    // Infrastructure层 - 仓储实现
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'IUserReadRepository',
      useClass: UserReadRepository,
    },
    {
      provide: 'IUserWriteRepository',
      useClass: UserWriteRepository,
    },
    // Infrastructure层 - 外部服务
    {
      provide: 'IEmailService',
      useClass: EmailService,
    },
    {
      provide: 'INotificationService',
      useClass: NotificationService,
    },
  ],
  exports: [
    // 导出供其他模块使用的服务
    'UserApplicationService',
    'IUserRepository',
    'IUserReadRepository',
  ],
})
export class UserModule {}
```

#### 服务注入

```typescript
/**
 * @class CreateUserUseCase
 * @description 创建用户用例，演示依赖注入的使用
 *
 * 依赖注入实现：
 * 1. 通过构造函数注入依赖
 * 2. 依赖抽象接口，不依赖具体实现
 * 3. 支持依赖替换和测试
 * 4. 实现依赖倒置原则
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    // 注入仓储接口，不依赖具体实现
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,

    // 注入领域服务
    private readonly userDomainService: UserDomainService,

    // 注入事件总线接口
    @Inject('IEventBus')
    private readonly eventBus: IEventBus,

    // 注入外部服务接口
    @Inject('IEmailService')
    private readonly emailService: IEmailService,

    // 注入配置服务
    private readonly configService: ConfigService,
  ) {}

  /**
   * 执行创建用户用例
   * @param command 创建用户命令
   * @returns 创建结果
   */
  async execute(command: CreateUserCommand): Promise<UserCreatedResult> {
    // 1. 验证业务规则
    await this.validateBusinessRules(command);

    // 2. 创建用户聚合根
    const user = UserAggregate.create(
      new UserId(command.userId),
      new Email(command.email),
      await this.hashPassword(command.password),
      new UserProfile(command.firstName, command.lastName),
      new UserPreferences(command.language, command.timezone),
    );

    // 3. 保存到仓储（通过接口调用）
    await this.userRepository.save(user);

    // 4. 发布领域事件（通过接口调用）
    await this.eventBus.publishAll(user.uncommittedEvents);

    // 5. 发送欢迎邮件（通过接口调用）
    await this.emailService.sendWelcomeEmail(
      command.email,
      command.firstName,
      command.tenantId,
    );

    return new UserCreatedResult(user.getAggregateId());
  }

  /**
   * 验证业务规则
   */
  private async validateBusinessRules(
    command: CreateUserCommand,
  ): Promise<void> {
    // 检查邮箱唯一性（通过仓储接口）
    const isEmailUnique = await this.userRepository.isEmailUniqueInTenant(
      new Email(command.email),
      new TenantId(command.tenantId),
    );

    if (!isEmailUnique) {
      throw new Error('Email already exists in tenant');
    }

    // 检查租户用户配额（通过仓储接口）
    const userCount = await this.userRepository.countByTenant(
      new TenantId(command.tenantId),
    );

    const maxUsers = this.configService.get<number>('tenant.maxUsers', 100);
    if (userCount >= maxUsers) {
      throw new Error('Tenant user quota exceeded');
    }
  }

  /**
   * 哈希密码
   */
  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 12);
  }
}
```

### 2. 工厂模式实现

#### 服务工厂

```typescript
/**
 * @class ServiceFactory
 * @description 服务工厂，负责创建和配置服务实例
 *
 * 工厂模式实现：
 * 1. 封装服务创建逻辑
 * 2. 管理服务依赖关系
 * 3. 支持服务配置和初始化
 * 4. 实现依赖倒置原则
 */
@Injectable()
export class ServiceFactory {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: Logger,
  ) {}

  /**
   * 创建用户仓储实例
   * @param tenantId 租户ID
   * @returns 用户仓储实例
   */
  createUserRepository(tenantId?: string): IUserRepository {
    const databaseType = this.configService.get<string>(
      'database.type',
      'postgresql',
    );

    switch (databaseType) {
      case 'postgresql':
        return new PostgreSQLUserRepository(
          this.configService.getDatabaseConfig(),
          tenantId,
        );
      case 'mongodb':
        return new MongoDBUserRepository(
          this.configService.getMongoConfig(),
          tenantId,
        );
      default:
        throw new Error(`Unsupported database type: ${databaseType}`);
    }
  }

  /**
   * 创建事件总线实例
   * @returns 事件总线实例
   */
  createEventBus(): IEventBus {
    const messageQueueType = this.configService.get<string>(
      'messageQueue.type',
      'redis',
    );

    switch (messageQueueType) {
      case 'redis':
        return new RedisEventBus(
          this.configService.getRedisConfig(),
          this.logger,
        );
      case 'rabbitmq':
        return new RabbitMQEventBus(
          this.configService.getRabbitMQConfig(),
          this.logger,
        );
      default:
        throw new Error(`Unsupported message queue type: ${messageQueueType}`);
    }
  }

  /**
   * 创建邮件服务实例
   * @returns 邮件服务实例
   */
  createEmailService(): IEmailService {
    const emailProvider = this.configService.get<string>(
      'email.provider',
      'smtp',
    );

    switch (emailProvider) {
      case 'smtp':
        return new SMTPEmailService(
          this.configService.getSMTPConfig(),
          this.logger,
        );
      case 'sendgrid':
        return new SendGridEmailService(
          this.configService.getSendGridConfig(),
          this.logger,
        );
      case 'mailgun':
        return new MailgunEmailService(
          this.configService.getMailgunConfig(),
          this.logger,
        );
      default:
        throw new Error(`Unsupported email provider: ${emailProvider}`);
    }
  }
}
```

## 配置管理

### 1. 配置接口

```typescript
/**
 * @interface IConfigService
 * @description 配置服务接口，定义配置管理的抽象操作
 *
 * 配置管理职责：
 * 1. 提供类型安全的配置访问
 * 2. 支持配置验证和默认值
 * 3. 实现配置的热重载
 * 4. 支持多环境配置
 */
export interface IConfigService {
  /**
   * 获取配置值
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值
   */
  get<T>(key: string, defaultValue?: T): T;

  /**
   * 获取数据库配置
   * @returns 数据库配置
   */
  getDatabaseConfig(): DatabaseConfig;

  /**
   * 获取Redis配置
   * @returns Redis配置
   */
  getRedisConfig(): RedisConfig;

  /**
   * 获取邮件配置
   * @returns 邮件配置
   */
  getEmailConfig(): EmailConfig;

  /**
   * 检查配置是否存在
   * @param key 配置键
   * @returns 是否存在
   */
  has(key: string): boolean;
}
```

### 2. 配置实现

```typescript
/**
 * @class EnvironmentConfigService
 * @description 环境配置服务实现，从环境变量加载配置
 *
 * 配置实现：
 * 1. 从环境变量加载配置
 * 2. 提供配置验证和类型转换
 * 3. 支持配置默认值
 * 4. 实现配置服务接口
 */
@Injectable()
export class EnvironmentConfigService implements IConfigService {
  private config: Map<string, any> = new Map();

  constructor() {
    this.loadConfig();
  }

  /**
   * 获取配置值
   * @param key 配置键
   * @param defaultValue 默认值
   * @returns 配置值
   */
  get<T>(key: string, defaultValue?: T): T {
    const value = this.config.get(key);
    return value !== undefined ? value : defaultValue;
  }

  /**
   * 获取数据库配置
   * @returns 数据库配置
   */
  getDatabaseConfig(): DatabaseConfig {
    return {
      type: this.get('DATABASE_TYPE', 'postgresql'),
      host: this.get('DATABASE_HOST', 'localhost'),
      port: this.get('DATABASE_PORT', 5432),
      username: this.get('DATABASE_USERNAME', 'postgres'),
      password: this.get('DATABASE_PASSWORD', ''),
      database: this.get('DATABASE_NAME', 'aiofix'),
      pool: {
        min: this.get('DATABASE_POOL_MIN', 5),
        max: this.get('DATABASE_POOL_MAX', 20),
        idleTimeoutMillis: this.get('DATABASE_POOL_IDLE_TIMEOUT', 30000),
        connectionTimeoutMillis: this.get(
          'DATABASE_POOL_CONNECTION_TIMEOUT',
          2000,
        ),
      },
    };
  }

  /**
   * 获取Redis配置
   * @returns Redis配置
   */
  getRedisConfig(): RedisConfig {
    return {
      host: this.get('REDIS_HOST', 'localhost'),
      port: this.get('REDIS_PORT', 6379),
      password: this.get('REDIS_PASSWORD', ''),
      db: this.get('REDIS_DB', 0),
    };
  }

  /**
   * 获取邮件配置
   * @returns 邮件配置
   */
  getEmailConfig(): EmailConfig {
    return {
      provider: this.get('EMAIL_PROVIDER', 'smtp'),
      smtp: {
        host: this.get('SMTP_HOST', 'localhost'),
        port: this.get('SMTP_PORT', 587),
        secure: this.get('SMTP_SECURE', false),
        auth: {
          user: this.get('SMTP_USER', ''),
          pass: this.get('SMTP_PASS', ''),
        },
      },
      sendgrid: {
        apiKey: this.get('SENDGRID_API_KEY', ''),
      },
      mailgun: {
        apiKey: this.get('MAILGUN_API_KEY', ''),
        domain: this.get('MAILGUN_DOMAIN', ''),
      },
    };
  }

  /**
   * 检查配置是否存在
   * @param key 配置键
   * @returns 是否存在
   */
  has(key: string): boolean {
    return this.config.has(key);
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    // 从环境变量加载配置
    Object.keys(process.env).forEach(key => {
      this.config.set(key, process.env[key]);
    });

    // 加载配置文件
    this.loadConfigFile();
  }

  /**
   * 加载配置文件
   */
  private loadConfigFile(): void {
    try {
      const configPath = process.env.CONFIG_PATH || './config.json';
      if (fs.existsSync(configPath)) {
        const configFile = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        Object.keys(configFile).forEach(key => {
          this.config.set(key, configFile[key]);
        });
      }
    } catch (error) {
      console.warn('Failed to load config file:', error.message);
    }
  }
}
```

## 测试中的依赖倒置

### 1. 单元测试

```typescript
/**
 * 创建用户用例测试
 * 演示如何在测试中使用依赖倒置
 */
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockEmailService: jest.Mocked<IEmailService>;
  let mockConfigService: jest.Mocked<IConfigService>;

  beforeEach(() => {
    // 创建模拟对象（实现接口）
    mockUserRepository = createMockUserRepository();
    mockEventBus = createMockEventBus();
    mockEmailService = createMockEmailService();
    mockConfigService = createMockConfigService();

    // 创建用例实例，注入模拟对象
    useCase = new CreateUserUseCase(
      mockUserRepository,
      mockEventBus,
      mockEmailService,
      mockConfigService,
    );
  });

  it('should create user successfully', async () => {
    // 设置模拟对象的行为
    mockUserRepository.isEmailUniqueInTenant.mockResolvedValue(true);
    mockUserRepository.countByTenant.mockResolvedValue(5);
    mockConfigService.get.mockReturnValue(100);
    mockUserRepository.save.mockResolvedValue();
    mockEventBus.publishAll.mockResolvedValue();
    mockEmailService.sendWelcomeEmail.mockResolvedValue();

    // 执行用例
    const command = new CreateUserCommand(
      'user-123',
      'user@example.com',
      'password123',
      'John',
      'Doe',
      'tenant-456',
    );

    const result = await useCase.execute(command);

    // 验证结果
    expect(result).toBeDefined();
    expect(result.userId).toBe('user-123');

    // 验证依赖调用
    expect(mockUserRepository.isEmailUniqueInTenant).toHaveBeenCalledWith(
      expect.any(Email),
      expect.any(TenantId),
    );
    expect(mockUserRepository.save).toHaveBeenCalled();
    expect(mockEventBus.publishAll).toHaveBeenCalled();
    expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
  });

  it('should throw error when email already exists', async () => {
    // 设置模拟对象的行为
    mockUserRepository.isEmailUniqueInTenant.mockResolvedValue(false);

    // 执行用例
    const command = new CreateUserCommand(
      'user-123',
      'user@example.com',
      'password123',
      'John',
      'Doe',
      'tenant-456',
    );

    // 验证异常
    await expect(useCase.execute(command)).rejects.toThrow(
      'Email already exists in tenant',
    );
  });
});

/**
 * 创建模拟对象的辅助函数
 */
function createMockUserRepository(): jest.Mocked<IUserRepository> {
  return {
    findById: jest.fn(),
    findByEmailAndTenant: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    countByTenant: jest.fn(),
    isEmailUniqueInTenant: jest.fn(),
  };
}

function createMockEventBus(): jest.Mocked<IEventBus> {
  return {
    publish: jest.fn(),
    publishAll: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  };
}

function createMockEmailService(): jest.Mocked<IEmailService> {
  return {
    sendWelcomeEmail: jest.fn(),
    sendNotificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };
}

function createMockConfigService(): jest.Mocked<IConfigService> {
  return {
    get: jest.fn(),
    getDatabaseConfig: jest.fn(),
    getRedisConfig: jest.fn(),
    getEmailConfig: jest.fn(),
    has: jest.fn(),
  };
}
```

### 2. 集成测试

```typescript
/**
 * 用户控制器集成测试
 * 演示如何在集成测试中使用依赖倒置
 */
describe('UserController Integration', () => {
  let app: INestApplication;
  let userRepository: IUserRepository;
  let eventBus: IEventBus;

  beforeEach(async () => {
    // 创建测试模块
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider('IUserRepository')
      .useClass(InMemoryUserRepository) // 使用内存实现进行测试
      .overrideProvider('IEventBus')
      .useClass(InMemoryEventBus) // 使用内存实现进行测试
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 获取服务实例
    userRepository = app.get<IUserRepository>('IUserRepository');
    eventBus = app.get<IEventBus>('IEventBus');
  });

  afterEach(async () => {
    await app.close();
  });

  it('should create user via REST API', async () => {
    // 准备测试数据
    const createUserDto = {
      userId: 'user-123',
      email: 'user@example.com',
      password: 'password123',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
    };

    // 发送HTTP请求
    const response = await request(app.getHttpServer())
      .post('/api/users')
      .send(createUserDto)
      .expect(201);

    // 验证响应
    expect(response.body).toMatchObject({
      id: 'user-123',
      email: 'user@example.com',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
    });

    // 验证数据已保存
    const user = await userRepository.findById(new UserId('user-123'));
    expect(user).toBeDefined();
    expect(user.getEmail().value).toBe('user@example.com');
  });
});
```

## 最佳实践

### 1. 接口设计

- **单一职责**: 每个接口只负责一个职责
- **接口隔离**: 避免臃肿的接口
- **抽象稳定**: 接口定义要稳定，避免频繁变更
- **文档完整**: 为接口提供完整的文档和示例

### 2. 依赖注入

- **构造函数注入**: 优先使用构造函数注入
- **接口注入**: 注入接口而不是具体实现
- **生命周期管理**: 合理管理服务的生命周期
- **循环依赖**: 避免循环依赖

### 3. 配置管理

- **类型安全**: 提供类型安全的配置访问
- **默认值**: 为配置提供合理的默认值
- **验证**: 验证配置的有效性
- **环境隔离**: 支持多环境配置

### 4. 测试策略

- **模拟对象**: 使用模拟对象进行单元测试
- **测试替身**: 使用测试替身进行集成测试
- **依赖替换**: 在测试中替换依赖实现
- **测试隔离**: 确保测试之间的隔离

## 总结

依赖倒置原则是Clean Architecture的核心，通过正确的接口设计、依赖注入和配置管理，可以实现系统的灵活性和可测试性。本指南提供了完整的实施方法，包括接口设计、依赖注入、配置管理和测试策略，为项目的成功实施提供了坚实的基础。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
