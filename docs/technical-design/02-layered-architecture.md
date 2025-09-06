# 分层架构设计

## 概述

本系统采用Clean Architecture分层设计，确保业务逻辑与技术实现的清晰分离，提供高度的可维护性、可测试性和可扩展性。

## Clean Architecture分层

```
┌─────────────────────────────────────────────────┐
│                 接口层 (Interface Layer)         │
│   - 控制器(Controllers)                         │
│   - 身份验证/授权                               │
│   - DTOs                                        │
│   - 异常过滤器                                  │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│                应用层 (Application Layer)        │
│   - 命令处理器(Command Handlers)                │
│   - 查询处理器(Query Handlers)                  │
│   - 事件处理器(Event Handlers)                  │
│   - 用例协调                                    │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│                领域层 (Domain Layer)             │
│   - 聚合根(Aggregate Roots)                     │
│   - 实体(Entities)                              │
│   - 值对象(Value Objects)                       │
│   - 领域服务(Domain Services)                   │
│   - 领域事件(Domain Events)                     │
│   - 仓储接口(Repository Interfaces)             │
└─────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────┐
│               基础设施层 (Infrastructure Layer)  │
│   - 数据库实现                                  │
│   - 消息队列                                    │
│   - 缓存实现                                    │
│   - 外部服务集成                                │
└─────────────────────────────────────────────────┘
```

## 分层设计原则

### 核心设计原则

#### 依赖倒置原则 (Dependency Inversion Principle)
- 高层模块不依赖低层模块，两者都依赖抽象
- 抽象不依赖细节，细节依赖抽象
- 依赖方向始终向内指向领域层

#### 单一职责原则 (Single Responsibility Principle)
- 每个层只负责一个特定的关注点
- 接口层：协议转换和数据验证
- 应用层：用例协调和事务管理
- 领域层：业务逻辑和规则
- 基础设施层：技术实现和外部集成

#### 开闭原则 (Open/Closed Principle)
- 对扩展开放，对修改关闭
- 通过接口和抽象类实现可扩展性
- 新功能通过添加新实现而非修改现有代码

### 分层职责边界

#### 接口层职责
```typescript
// 接口层只负责协议相关处理
@Controller('api/users')
export class UserController {
  @Post()
  async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    // 1. 数据验证和转换
    // 2. 调用应用服务
    // 3. 返回响应格式
    const command = new CreateUserCommand(dto.email, dto.password);
    const result = await this.commandBus.execute(command);
    return this.userMapper.toResponseDto(result);
  }
}
```

#### 应用层职责
```typescript
// 应用层负责用例协调
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async execute(command: CreateUserCommand): Promise<void> {
    // 1. 业务规则验证
    // 2. 领域对象操作
    // 3. 事务管理
    // 4. 事件发布
    await this.userService.createUser(command.email, command.password);
  }
}
```

#### 领域层职责
```typescript
// 领域层只包含业务逻辑
export class User extends EventSourcedAggregateRoot {
  public static create(email: string, password: string): User {
    // 1. 业务规则验证
    // 2. 领域事件产生
    // 3. 状态变更
    const user = new User();
    user.apply(new UserCreatedEvent(email, password));
    return user;
  }
}
```

## 技术考虑与实现策略

### 接口层技术考虑

#### 多协议支持
```typescript
// 支持多种通信协议
export interface IUserInterface {
  // REST API
  createUserViaRest(dto: CreateUserDto): Promise<UserResponseDto>;
  
  // GraphQL
  createUserViaGraphQL(input: CreateUserInput): Promise<User>;
  
  // gRPC
  createUserViaGrpc(request: CreateUserRequest): Promise<CreateUserResponse>;
  
  // WebSocket
  handleUserEvents(client: Socket, data: any): void;
}
```

#### 请求验证与转换
```typescript
// 使用装饰器进行数据验证
export class CreateUserDto {
  @IsEmail()
  @ApiProperty({ description: '用户邮箱' })
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  @ApiProperty({ description: '用户密码' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiProperty({ description: '用户姓名', required: false })
  name?: string;
}
```

#### 异常处理策略
```typescript
// 全局异常过滤器
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    if (exception instanceof DomainException) {
      // 领域异常转换为HTTP响应
      const errorResponse = this.mapDomainException(exception);
      response.status(errorResponse.statusCode).json(errorResponse);
    } else if (exception instanceof ValidationException) {
      // 验证异常处理
      response.status(400).json({
        statusCode: 400,
        message: '请求参数验证失败',
        errors: exception.getResponse()
      });
    }
  }
}
```

### 应用层技术考虑

#### CQRS实现策略
```typescript
// 命令总线配置
@Module({
  imports: [
    CqrsModule.forRoot({
      // 命令总线配置
      commandBus: {
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000
      },
      // 查询总线配置
      queryBus: {
        timeout: 10000,
        cache: true
      },
      // 事件总线配置
      eventBus: {
        publishAll: true,
        parallel: true
      }
    })
  ]
})
export class AppModule {}
```

#### 事务管理策略
```typescript
// 应用层事务管理
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly userRepository: IUserRepository,
    private readonly eventStore: IEventStore
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    await this.entityManager.transaction(async (transactionalEntityManager) => {
      // 1. 创建用户聚合
      const user = User.create(command.email, command.password);
      
      // 2. 保存到事件存储
      await this.eventStore.saveEvents(
        user.id,
        user.uncommittedEvents,
        user.version
      );
      
      // 3. 更新读模型
      await this.updateReadModel(user);
      
      // 4. 发布领域事件
      user.markEventsAsCommitted();
    });
  }
}
```

### 领域层技术考虑

#### 聚合设计原则
```typescript
// 聚合根设计
export abstract class EventSourcedAggregateRoot {
  private _uncommittedEvents: IDomainEvent[] = [];
  private _version = 0;

  // 事件应用机制
  protected apply(event: IDomainEvent, isFromHistory = false): void {
    this.handleEvent(event, isFromHistory);
    if (!isFromHistory) {
      this._uncommittedEvents.push(event);
      this._version++;
    }
  }

  // 快照支持
  public createSnapshot(): IAggregateSnapshot {
    return {
      aggregateId: this.id,
      version: this._version,
      data: this.toSnapshot()
    };
  }

  public restoreFromSnapshot(snapshot: IAggregateSnapshot): void {
    this._version = snapshot.version;
    this.fromSnapshot(snapshot.data);
  }
}
```

#### 领域事件设计
```typescript
// 领域事件基类
export abstract class DomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string;
  public readonly eventVersion: number;

  constructor(aggregateId: string, eventVersion: number = 1) {
    this.eventId = uuid.v4();
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
    this.eventType = this.constructor.name;
    this.eventVersion = eventVersion;
  }

  abstract toJSON(): any;
}
```

### 基础设施层技术考虑

#### 事件存储实现
```typescript
// 事件存储服务
@Injectable()
export class EventStoreService implements IEventStore {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: Repository<EventEntity>,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    await this.connection.transaction(async (manager) => {
      // 乐观锁检查
      const currentVersion = await this.getAggregateVersion(aggregateId);
      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(aggregateId, expectedVersion, currentVersion);
      }

      // 批量保存事件
      const eventEntities = events.map((event, index) => 
        this.mapToEventEntity(event, expectedVersion + index + 1)
      );
      
      await manager.save(EventEntity, eventEntities);
    });
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<IDomainEvent[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .orderBy('event.version', 'ASC');

    if (fromVersion) {
      query.andWhere('event.version >= :fromVersion', { fromVersion });
    }

    const events = await query.getMany();
    return events.map(event => this.mapToDomainEvent(event));
  }
}
```

#### 读模型同步策略
```typescript
// 读模型投影器
@EventsHandler(UserCreatedEvent)
export class UserProjectionHandler {
  constructor(
    @InjectRepository(UserReadModel)
    private readonly userReadRepository: Repository<UserReadModel>
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    // 异步更新读模型
    await this.userReadRepository.save({
      id: event.aggregateId,
      email: event.email,
      createdAt: event.occurredOn,
      status: UserStatus.ACTIVE,
      version: event.eventVersion
    });
  }
}
```

## 性能优化策略

### 聚合快照机制
```typescript
// 快照服务实现
@Injectable()
export class SnapshotService {
  constructor(
    @InjectRepository(AggregateSnapshot)
    private readonly snapshotRepository: Repository<AggregateSnapshot>
  ) {}

  async createSnapshot(aggregateId: string, aggregate: EventSourcedAggregateRoot): Promise<void> {
    const snapshot = aggregate.createSnapshot();
    await this.snapshotRepository.save(snapshot);
  }

  async restoreFromSnapshot<T extends EventSourcedAggregateRoot>(
    aggregateId: string,
    aggregateClass: new () => T
  ): Promise<{ aggregate: T; fromVersion: number }> {
    const snapshot = await this.snapshotRepository.findOne({
      where: { aggregateId },
      order: { version: 'DESC' }
    });

    if (snapshot) {
      const aggregate = new aggregateClass();
      aggregate.restoreFromSnapshot(snapshot);
      return { aggregate, fromVersion: snapshot.version };
    }

    return { aggregate: new aggregateClass(), fromVersion: 0 };
  }
}
```

### 读模型缓存策略
```typescript
// 缓存装饰器
export function Cacheable(ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // 执行原方法并缓存结果
      const result = await method.apply(this, args);
      await this.cacheService.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}

// 使用示例
@QueryHandler(GetUserProfileQuery)
export class GetUserProfileHandler {
  @Cacheable(600) // 缓存10分钟
  async execute(query: GetUserProfileQuery): Promise<UserProfileDto> {
    return this.userReadRepository.getProfile(query.userId);
  }
}
```

### 事件批处理机制
```typescript
// 事件批处理器
@Injectable()
export class EventBatchProcessor {
  private readonly batchSize = 100;
  private readonly batchTimeout = 5000; // 5秒
  private eventQueue: IDomainEvent[] = [];

  @Cron('*/5 * * * * *') // 每5秒执行一次
  async processBatch(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.batchSize);
    await this.processEventsBatch(batch);
  }

  async addEvent(event: IDomainEvent): Promise<void> {
    this.eventQueue.push(event);
    
    // 如果达到批处理大小，立即处理
    if (this.eventQueue.length >= this.batchSize) {
      await this.processBatch();
    }
  }

  private async processEventsBatch(events: IDomainEvent[]): Promise<void> {
    // 按聚合ID分组
    const groupedEvents = this.groupEventsByAggregate(events);
    
    // 并行处理每个聚合的事件
    await Promise.all(
      Object.entries(groupedEvents).map(([aggregateId, aggregateEvents]) =>
        this.processAggregateEvents(aggregateId, aggregateEvents)
      )
    );
  }
}
```

## 监控与可观测性

### 性能监控
```typescript
// 性能拦截器
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    
    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(`Request ${request.method} ${request.url} took ${duration}ms`);
        
        // 记录性能指标
        this.metricsService.recordRequestDuration(request.url, duration);
      })
    );
  }
}
```

### 事件溯源监控
```typescript
// 事件监控服务
@Injectable()
export class EventMonitoringService {
  async recordEventProcessed(event: IDomainEvent, processingTime: number): Promise<void> {
    await this.metricsService.incrementCounter('events.processed', {
      eventType: event.eventType,
      aggregateType: this.getAggregateType(event.aggregateId)
    });
    
    await this.metricsService.recordHistogram('events.processing_time', processingTime, {
      eventType: event.eventType
    });
  }
}
```

## 测试策略

### 单元测试
```typescript
// 领域层单元测试
describe('User Aggregate', () => {
  it('should create user with valid email and password', () => {
    const user = User.create('test@example.com', 'Password123');
    
    expect(user.email).toBe('test@example.com');
    expect(user.uncommittedEvents).toHaveLength(1);
    expect(user.uncommittedEvents[0]).toBeInstanceOf(UserCreatedEvent);
  });
});
```

### 集成测试
```typescript
// 应用层集成测试
describe('CreateUserHandler Integration', () => {
  it('should create user and save events', async () => {
    const command = new CreateUserCommand('test@example.com', 'Password123');
    
    await commandHandler.execute(command);
    
    const events = await eventStore.getEvents(userId);
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserCreatedEvent);
  });
});
```

## 事件溯源与CQRS协同工作机制

### 工作流程
1. **命令接收**：接口层接收HTTP请求，转换为命令对象
2. **命令处理**：应用层命令处理器执行业务逻辑
3. **事件产生**：领域层聚合产生领域事件
4. **事件存储**：基础设施层将事件持久化到事件存储
5. **读模型更新**：事件处理器异步更新读模型
6. **查询响应**：查询处理器从读模型返回数据

### 数据一致性保证
- **最终一致性**：通过事件驱动实现读模型的最终一致性
- **事务边界**：命令处理在事务边界内，确保事件存储的一致性
- **重试机制**：事件处理器支持重试，确保读模型最终更新成功

## 相关文档

- [架构概述](./01-architecture-overview.md)
- [核心模块与组件设计](./03-core-modules.md)
- [领域模型设计](./04-domain-models.md)
- [应用层实现](./05-application-layer.md)
- [基础设施实现](./06-infrastructure.md)

---

**上一篇**：[架构概述](./01-architecture-overview.md)  
**下一篇**：[核心模块与组件设计](./03-core-modules.md)
