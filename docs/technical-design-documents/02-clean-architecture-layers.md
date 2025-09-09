# Clean Architecture分层设计

## 文档信息

- **文档名称**: Clean Architecture分层设计
- **文档版本**: V1.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

本文档详细描述了Aiofix AI SAAS平台中Clean Architecture的四个层次设计，包括各层的职责、组件、依赖关系和实现原则。

## Clean Architecture四层结构

### 架构图

```
┌─────────────────────────────────────────────────┐
│            Frameworks & Drivers Layer           │
│   - Web Framework (NestJS/Fastify)              │
│   - Database (PostgreSQL/MongoDB)               │
│   - Message Queue (Redis/Bull)                  │
│   - External APIs                               │
│   - File System                                 │
│   - Third-party Libraries                       │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│            Interface Adapters Layer             │
│   - Controllers (HTTP/GraphQL/gRPC)             │
│   - Gateways (Repository Implementations)       │
│   - Presenters (Response Formatters)            │
│   - Event Handlers (Infrastructure)             │
│   - Database Adapters                           │
│   - External Service Adapters                   │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│                Use Cases Layer                  │
│   - Application Business Rules                  │
│   - Use Case Implementations                    │
│   - Application Services (Orchestrators)        │
│   - Command/Query Handlers                      │
│   - Event Publishers                            │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│                Entities Layer                   │
│   - Enterprise Business Rules                   │
│   - Domain Models (Aggregates/Entities/VOs)     │
│   - Domain Events                               │
│   - Domain Services                             │
│   - Repository Interfaces                       │
└─────────────────────────────────────────────────┘
```

### 依赖倒置原则

```
依赖方向：Frameworks → Interface Adapters → Use Cases → Entities
                    ↑                    ↑           ↑
                依赖抽象              依赖抽象     核心业务逻辑
```

## 第一层：Entities Layer (实体层)

### 职责

Entities层包含企业范围的业务规则，是整个系统的核心。这一层不依赖任何外部框架或技术实现，只包含纯业务逻辑。

### 核心组件

#### 1. 聚合根 (Aggregate Roots)

聚合根是DDD中的核心概念，负责维护业务不变性约束。

```typescript
/**
 * @class UserAggregate
 * @description 用户聚合根，管理用户相关的业务规则和状态变更
 */
export class UserAggregate extends EventSourcedAggregateRoot {
  private constructor(private user: UserEntity) {
    super();
  }

  /**
   * 创建用户
   */
  static create(
    id: UserId,
    email: Email,
    password: Password,
    profile: UserProfile,
    preferences: UserPreferences,
  ): UserAggregate {
    const user = UserEntity.create(id, email, password, profile, preferences);
    const aggregate = new UserAggregate(user);

    // 发布领域事件
    aggregate.addDomainEvent(
      new UserCreatedEvent(
        id.value,
        email.value,
        profile.value.firstName,
        profile.value.lastName,
      ),
    );

    return aggregate;
  }

  /**
   * 更新用户资料
   */
  updateProfile(newProfile: UserProfile): void {
    this.user.updateProfile(newProfile);

    this.addDomainEvent(
      new UserProfileUpdatedEvent(
        this.user.id.value,
        this.user.profile.value,
        newProfile.value,
      ),
    );
  }
}
```

#### 2. 实体 (Entities)

实体具有唯一标识，可以改变状态。

```typescript
/**
 * @class UserEntity
 * @description 用户实体，包含用户的基本信息和状态
 */
export class UserEntity extends BaseEntity {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    private password: Password,
    private profile: UserProfile,
    private preferences: UserPreferences,
    private status: UserStatus = UserStatus.PENDING,
  ) {
    super();
  }

  /**
   * 激活用户
   */
  activate(): void {
    if (this.status === UserStatus.ACTIVE) {
      throw new Error('User is already active');
    }
    this.status = UserStatus.ACTIVE;
  }

  /**
   * 更新密码
   */
  updatePassword(newPassword: Password): void {
    this.password = newPassword;
  }
}
```

#### 3. 值对象 (Value Objects)

值对象是不可变的，通过值相等性进行比较。

```typescript
/**
 * @class Email
 * @description 邮箱值对象，封装邮箱地址的验证和格式化逻辑
 */
export class Email {
  constructor(public readonly value: string) {
    this.validateEmail(value);
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
```

#### 4. 领域事件 (Domain Events)

领域事件表示业务状态的重要变更。

```typescript
/**
 * @class UserCreatedEvent
 * @description 用户创建领域事件
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
  ) {
    super();
  }

  getEventType(): string {
    return 'UserCreated';
  }
}
```

#### 5. 领域服务 (Domain Services)

领域服务处理跨聚合的业务逻辑。

```typescript
/**
 * @class UserDomainService
 * @description 用户领域服务，处理跨聚合的用户相关业务逻辑
 */
export class UserDomainService {
  /**
   * 检查邮箱是否在租户内唯一
   */
  async isEmailUniqueInTenant(
    email: Email,
    tenantId: TenantId,
    userRepository: IUserRepository,
  ): Promise<boolean> {
    const existingUser = await userRepository.findByEmailAndTenant(
      email,
      tenantId,
    );
    return existingUser === null;
  }
}
```

#### 6. 仓储接口 (Repository Interfaces)

仓储接口定义数据访问的抽象。

```typescript
/**
 * @interface IUserRepository
 * @description 用户仓储接口，定义用户数据访问的抽象
 */
export interface IUserRepository {
  save(user: UserAggregate): Promise<void>;
  findById(id: UserId): Promise<UserAggregate | null>;
  findByEmail(email: Email): Promise<UserAggregate | null>;
  findByEmailAndTenant(
    email: Email,
    tenantId: TenantId,
  ): Promise<UserAggregate | null>;
  delete(id: UserId): Promise<void>;
}
```

### 设计原则

1. **不依赖外部框架**: 实体层不依赖任何外部技术
2. **纯业务逻辑**: 只包含业务规则和逻辑
3. **可独立测试**: 可以独立进行单元测试
4. **稳定不变**: 业务规则相对稳定，变化较少

## 第二层：Use Cases Layer (用例层)

### 职责

Use Cases层包含应用特定的业务规则，协调Entities层的操作，实现具体的业务用例。

### 核心组件

#### 1. 用例实现 (Use Case Implementations)

用例实现封装具体的业务操作流程。

```typescript
/**
 * @class CreateUserUseCase
 * @description 创建用户用例，协调用户创建的业务流程
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly eventBus: IEventBus,
    private readonly passwordService: IPasswordService,
  ) {}

  /**
   * 执行创建用户用例
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
    return new UserCreatedResult(user.id.value);
  }

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
  }
}
```

#### 2. 应用服务 (Application Services)

应用服务作为用例的协调器，处理跨用例的操作。

```typescript
/**
 * @class UserApplicationService
 * @description 用户应用服务，协调用户相关的用例
 */
@Injectable()
export class UserApplicationService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  /**
   * 创建用户
   */
  async createUser(command: CreateUserCommand): Promise<UserCreatedResult> {
    return await this.createUserUseCase.execute(command);
  }

  /**
   * 更新用户
   */
  async updateUser(command: UpdateUserCommand): Promise<void> {
    return await this.updateUserUseCase.execute(command);
  }

  /**
   * 删除用户
   */
  async deleteUser(command: DeleteUserCommand): Promise<void> {
    return await this.deleteUserUseCase.execute(command);
  }

  /**
   * 获取用户
   */
  async getUser(query: GetUserQuery): Promise<UserDto> {
    return await this.getUserUseCase.execute(query);
  }
}
```

#### 3. 命令/查询处理器 (Command/Query Handlers)

CQRS模式的命令和查询处理器。

```typescript
/**
 * @class CreateUserCommandHandler
 * @description 创建用户命令处理器
 */
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {}

  async execute(command: CreateUserCommand): Promise<UserCreatedResult> {
    return await this.createUserUseCase.execute(command);
  }
}

/**
 * @class GetUserQueryHandler
 * @description 获取用户查询处理器
 */
@QueryHandler(GetUserQuery)
export class GetUserQueryHandler {
  constructor(private readonly getUserUseCase: GetUserUseCase) {}

  async execute(query: GetUserQuery): Promise<UserDto> {
    return await this.getUserUseCase.execute(query);
  }
}
```

#### 4. 事件发布器 (Event Publishers)

负责发布领域事件到事件总线。

```typescript
/**
 * @class EventBus
 * @description 事件总线，负责发布领域事件
 */
@Injectable()
export class EventBus {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly messageQueue: IMessageQueue,
  ) {}

  /**
   * 发布领域事件
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    // 1. 保存到事件存储
    await this.eventStore.saveEvents(events);

    // 2. 发布到消息队列
    for (const event of events) {
      await this.messageQueue.publish(event);
    }
  }
}
```

### 设计原则

1. **依赖Entities层**: 只能依赖Entities层
2. **定义接口**: 为外层定义需要实现的接口
3. **协调业务**: 协调Entities层的操作
4. **事务边界**: 定义事务的边界

## 第三层：Interface Adapters Layer (接口适配层)

### 职责

Interface Adapters层负责转换数据格式，适配外部接口，实现Use Cases层定义的接口。

### 核心组件

#### 1. 控制器 (Controllers)

处理HTTP请求，调用Use Cases。

```typescript
/**
 * @class UserController
 * @description 用户控制器，处理用户相关的HTTP请求
 */
@Controller('api/users')
@UseGuards(AuthGuard, PermissionGuard)
export class UserController {
  constructor(
    private readonly userApplicationService: UserApplicationService,
  ) {}

  /**
   * 创建用户
   */
  @Post()
  @RequirePermissions('user:create')
  async createUser(
    @Body() dto: CreateUserDto,
    @Request() request: AuthenticatedRequest,
  ): Promise<UserResponseDto> {
    // 1. 数据验证和转换
    const command = this.mapToCommand(dto, request.user);

    // 2. 调用Use Case
    const result = await this.userApplicationService.createUser(command);

    // 3. 返回响应
    return this.mapToResponse(result);
  }

  private mapToCommand(dto: CreateUserDto, user: User): CreateUserCommand {
    return new CreateUserCommand(
      dto.email,
      dto.password,
      dto.firstName,
      dto.lastName,
      user.tenantId,
      user.id,
    );
  }

  private mapToResponse(result: UserCreatedResult): UserResponseDto {
    return {
      id: result.userId,
      message: 'User created successfully',
    };
  }
}
```

#### 2. 仓储实现 (Repository Implementations)

实现Entities层定义的仓储接口。

```typescript
/**
 * @class UserRepository
 * @description 用户仓储实现，实现用户数据访问
 */
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    private readonly entityManager: EntityManager,
    private readonly eventStore: IEventStore,
  ) {}

  async save(user: UserAggregate): Promise<void> {
    // 1. 保存聚合状态
    const userEntity = this.mapToEntity(user);
    await this.entityManager.persistAndFlush(userEntity);

    // 2. 保存领域事件
    await this.eventStore.saveEvents(user.uncommittedEvents);
  }

  async findById(id: UserId): Promise<UserAggregate | null> {
    // 1. 从事件存储重建聚合
    const events = await this.eventStore.getEvents(id.value);
    if (events.length === 0) {
      return null;
    }

    // 2. 重建聚合
    return this.rebuildAggregate(events);
  }

  private mapToEntity(user: UserAggregate): UserEntity {
    // 映射聚合到实体
  }

  private rebuildAggregate(events: DomainEvent[]): UserAggregate {
    // 从事件重建聚合
  }
}
```

#### 3. 事件处理器 (Event Handlers)

处理领域事件的副作用。

```typescript
/**
 * @class UserCreatedEventHandler
 * @description 用户创建事件处理器，处理用户创建后的副作用
 */
@Processor('user_events')
export class UserCreatedEventHandler {
  constructor(
    private readonly emailService: IEmailService,
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  @Process('UserCreated')
  async handleUserCreated(job: Job<UserCreatedEvent>): Promise<void> {
    const event = job.data;

    // 1. 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.email, event.firstName);

    // 2. 更新读模型
    await this.userReadRepository.addUser({
      id: event.userId,
      email: event.email,
      firstName: event.firstName,
      lastName: event.lastName,
      createdAt: event.occurredOn,
    });
  }
}
```

#### 4. 数据库适配器 (Database Adapters)

封装数据库访问细节。

```typescript
/**
 * @class PostgreSQLAdapter
 * @description PostgreSQL数据库适配器
 */
@Injectable()
export class PostgreSQLAdapter implements IDatabaseAdapter {
  constructor(
    private readonly config: DatabaseConfig,
    private readonly logger: Logger,
  ) {}

  async connect(): Promise<void> {
    // 连接数据库
  }

  async query(sql: string, params: any[] = []): Promise<QueryResult> {
    // 执行查询
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    // 执行事务
  }
}
```

#### 5. 外部服务适配器 (External Service Adapters)

适配外部服务接口。

```typescript
/**
 * @class EmailServiceAdapter
 * @description 邮件服务适配器
 */
@Injectable()
export class EmailServiceAdapter implements IEmailService {
  constructor(
    private readonly nodemailer: NodemailerService,
    private readonly config: EmailConfig,
  ) {}

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const mailOptions = {
      from: this.config.fromAddress,
      to: email,
      subject: 'Welcome to Aiofix',
      html: this.generateWelcomeEmailHtml(firstName),
    };

    await this.nodemailer.sendMail(mailOptions);
  }
}
```

### 设计原则

1. **实现接口**: 实现Use Cases层定义的接口
2. **数据转换**: 处理不同格式间的数据转换
3. **适配外部**: 适配外部系统和框架
4. **错误处理**: 处理外部系统的错误

## 第四层：Frameworks & Drivers Layer (框架驱动层)

### 职责

Frameworks & Drivers层提供技术实现和外部集成，包括Web框架、数据库、消息队列等。

### 核心组件

#### 1. Web框架 (Web Framework)

```typescript
// NestJS应用配置
@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    EventStoreModule,
    MessageQueueModule,
  ],
  controllers: [UserController],
  providers: [UserApplicationService, CreateUserUseCase, UserRepository],
})
export class AppModule {}

// 应用启动
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

#### 2. 数据库 (Database)

```typescript
// PostgreSQL配置
const databaseConfig = {
  type: 'postgresql',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [UserEntity, TenantEntity],
  synchronize: false,
  migrations: ['dist/migrations/*.js'],
};
```

#### 3. 消息队列 (Message Queue)

```typescript
// Bull队列配置
const queueConfig = {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD,
  },
};

// 队列定义
const userEventsQueue = new Queue('user_events', queueConfig);
```

#### 4. 外部API (External APIs)

```typescript
// 外部API客户端
@Injectable()
export class ExternalApiClient {
  constructor(private readonly httpService: HttpService) {}

  async callExternalApi(data: any): Promise<any> {
    const response = await this.httpService
      .post('https://api.external.com/endpoint', data)
      .toPromise();

    return response.data;
  }
}
```

### 设计原则

1. **技术实现**: 提供具体的技术实现
2. **外部集成**: 集成外部系统和服务
3. **配置管理**: 管理技术配置
4. **性能优化**: 优化技术性能

## 依赖关系规则

### 依赖方向

```
Frameworks & Drivers → Interface Adapters → Use Cases → Entities
```

### 依赖规则

1. **向内依赖**: 外层只能依赖内层
2. **接口依赖**: 外层依赖内层的接口，不依赖实现
3. **抽象依赖**: 依赖抽象，不依赖具体实现
4. **稳定依赖**: 依赖稳定的抽象

### 违反依赖的后果

1. **紧耦合**: 导致代码紧耦合
2. **难测试**: 难以进行单元测试
3. **难维护**: 难以维护和修改
4. **难扩展**: 难以扩展新功能

## 测试策略

### 单元测试

```typescript
// Entities层测试
describe('UserAggregate', () => {
  it('should create user with valid data', () => {
    const user = UserAggregate.create(
      new UserId('user-123'),
      new Email('user@example.com'),
      new Password('hashedPassword'),
      new UserProfile('John', 'Doe'),
      new UserPreferences('en', 'UTC')
    );

    expect(user).toBeDefined();
    expect(user.uncommittedEvents).toHaveLength(1);
  });
});

// Use Cases层测试
describe('CreateUserUseCase', () => {
  it('should create user successfully', async () => {
    const mockRepository = createMockRepository();
    const useCase = new CreateUserUseCase(mockRepository, ...);

    const result = await useCase.execute(createUserCommand);

    expect(result).toBeDefined();
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

### 集成测试

```typescript
// 端到端测试
describe('User API', () => {
  it('should create user via API', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(createUserDto)
      .expect(201);

    expect(response.body.id).toBeDefined();
  });
});
```

## 总结

Clean Architecture的四层设计确保了系统的可维护性、可测试性和可扩展性。通过严格的依赖倒置原则，每一层都有明确的职责和边界，使得系统能够适应业务需求的变化，同时保持技术实现的灵活性。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
