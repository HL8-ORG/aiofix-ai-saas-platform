# 核心模块与组件设计

## 概述

本系统采用混合架构设计，支持从单体应用到微服务的渐进式演进，提供灵活的项目结构和公共模块，确保代码复用和系统可维护性。

## 混合架构项目结构

### 整体项目组织

```
aiofix-saas-platform/
├── packages/                    # 共享包
│   ├── common/                 # 公共基础包（简化后）
│   │   ├── constants/          # 常量定义
│   │   ├── decorators/         # 装饰器
│   │   ├── exceptions/         # 异常定义
│   │   ├── filters/            # 过滤器
│   │   ├── guards/             # 守卫
│   │   ├── interceptors/       # 拦截器
│   │   ├── pipes/              # 管道
│   │   ├── utils/              # 工具函数
│   │   ├── validators/         # 验证器
│   │   ├── types/              # 类型定义
│   │   └── test-factories/     # 测试数据工厂
│   ├── core/                   # 核心架构包
│   │   ├── domain/             # 领域基础组件
│   │   ├── application/        # 应用层基础组件
│   │   └── infrastructure/     # 基础设施基础组件
│   ├── logging/                # 日志模块（独立包）
│   │   ├── services/           # 日志服务
│   │   ├── interfaces/         # 日志接口
│   │   ├── config/             # 日志配置
│   │   └── logging.module.ts   # 日志模块
│   ├── config/                 # 配置模块（独立包）
│   │   ├── services/           # 配置服务
│   │   ├── interfaces/         # 配置接口
│   │   ├── config/             # 配置类
│   │   └── config.module.ts    # 配置模块
│   ├── cache/                  # 缓存模块（独立包）
│   │   ├── services/           # 缓存服务
│   │   ├── interfaces/         # 缓存接口
│   │   ├── strategies/         # 缓存策略
│   │   └── cache.module.ts     # 缓存模块
│   ├── notification/           # 通知模块（独立包）
│   │   ├── services/           # 通知服务
│   │   ├── interfaces/         # 通知接口
│   │   ├── channels/           # 通知渠道
│   │   └── notification.module.ts # 通知模块
│   └── database/               # 数据库模块（独立包）
│       ├── services/           # 数据库服务
│       ├── interfaces/         # 数据库接口
│       ├── config/             # 数据库配置
│       └── database.module.ts  # 数据库模块
├── apps/                       # 应用项目
│   ├── monolith/               # 单体应用
│   │   ├── src/
│   │   │   ├── modules/        # 业务模块
│   │   │   │   ├── platform/   # 平台管理
│   │   │   │   ├── tenant/     # 租户管理
│   │   │   │   ├── user/       # 用户管理
│   │   │   │   ├── auth/       # 认证授权
│   │   │   │   └── ...         # 其他模块
│   │   │   ├── app.module.ts   # 应用模块
│   │   │   └── main.ts         # 应用入口
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   └── README.md
│   ├── microservices/          # 微服务应用
│   │   ├── platform-service/   # 平台管理服务
│   │   ├── tenant-service/     # 租户管理服务
│   │   ├── organization-service/ # 组织管理服务
│   │   ├── department-service/ # 部门管理服务
│   │   ├── user-service/       # 用户管理服务
│   │   ├── role-service/       # 角色管理服务
│   │   ├── permission-service/ # 权限管理服务
│   │   ├── auth-service/       # 认证与授权服务
│   │   └── ...                 # 其他业务服务
│   └── gateway/                # API网关
├── web/                        # 前端应用
├── mobile/                     # 移动端应用
├── admin/                      # 管理后台
├── docs/                       # 文档
├── scripts/                    # 部署脚本
├── docker/                     # Docker配置
├── k8s/                        # Kubernetes配置
├── terraform/                  # 基础设施即代码
└── monitoring/                 # 监控配置
```

### 单个微服务项目结构

```
services/user-service/
├── src/
│   ├── domain/                 # 领域层
│   │   ├── entities/           # 实体
│   │   ├── value-objects/      # 值对象
│   │   ├── aggregates/         # 聚合根
│   │   ├── events/             # 领域事件
│   │   ├── repositories/       # 仓储接口
│   │   └── services/           # 领域服务
│   ├── application/            # 应用层
│   │   ├── commands/           # 命令
│   │   │   ├── create-user.command.ts
│   │   │   ├── update-user.command.ts
│   │   │   ├── delete-user.command.ts
│   │   │   └── handlers/       # 命令处理器
│   │   │       ├── create-user.handler.ts
│   │   │       ├── update-user.handler.ts
│   │   │       └── delete-user.handler.ts
│   │   ├── queries/            # 查询
│   │   │   ├── get-user.query.ts
│   │   │   ├── get-users.query.ts
│   │   │   ├── search-users.query.ts
│   │   │   └── handlers/       # 查询处理器
│   │   │       ├── get-user.handler.ts
│   │   │       ├── get-users.handler.ts
│   │   │       └── search-users.handler.ts
│   │   ├── events/             # 事件处理器
│   │   │   ├── user-created.handler.ts
│   │   │   ├── user-updated.handler.ts
│   │   │   └── user-deleted.handler.ts
│   │   └── services/           # 应用服务
│   ├── infrastructure/         # 基础设施层
│   │   ├── persistence/        # 持久化
│   │   │   ├── postgresql/     # PostgreSQL实现
│   │   │   │   ├── entities/   # 实体定义
│   │   │   │   ├── repositories/ # 仓储实现
│   │   │   │   ├── migrations/ # 数据库迁移
│   │   │   │   ├── mappers/    # 实体映射器
│   │   │   │   └── adapters/   # 数据库适配器
│   │   │   ├── mongodb/        # MongoDB实现
│   │   │   │   ├── documents/  # 文档定义
│   │   │   │   ├── collections/ # 集合实现
│   │   │   │   ├── schemas/    # 模式定义
│   │   │   │   ├── mappers/    # 文档映射器
│   │   │   │   └── adapters/   # 数据库适配器
│   │   │   ├── eventstore/     # 事件存储
│   │   │   │   ├── projections/ # 事件投射器
│   │   │   │   ├── snapshots/  # 快照管理
│   │   │   │   └── adapters/   # 事件存储适配器
│   │   │   └── common/         # 通用持久化组件
│   │   ├── messaging/          # 消息传递
│   │   ├── external/           # 外部服务集成
│   │   └── config/             # 配置
│   └── interface/              # 接口层
│       ├── controllers/        # 控制器
│       ├── dto/               # 数据传输对象
│       ├── guards/            # 守卫
│       ├── interceptors/      # 拦截器
│       └── filters/           # 过滤器
├── test/                      # 测试
├── package.json
├── tsconfig.json
├── Dockerfile
└── README.md
```

## 渐进式开发策略

### 开发阶段

#### 阶段1：MVP单体应用

- **目标**：快速验证业务概念
- **架构**：单体应用，简单分层
- **数据库**：单一PostgreSQL数据库
- **部署**：Docker容器化部署

#### 阶段2：模块化单体

- **目标**：提高代码组织和可维护性
- **架构**：模块化单体，清晰的模块边界
- **数据库**：PostgreSQL + Redis缓存
- **部署**：容器化部署，支持水平扩展

#### 阶段3：混合架构

- **目标**：核心服务微服务化
- **架构**：关键服务独立部署，其他保持单体
- **数据库**：多数据库支持，服务独立数据存储
- **部署**：混合部署模式

#### 阶段4：完整微服务

- **目标**：全面微服务化
- **架构**：所有服务独立部署
- **数据库**：每个服务独立数据库
- **部署**：Kubernetes集群部署

### 技术演进路径

```typescript
// 阶段1：简单单体
@Controller('users')
export class UserController {
  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}

// 阶段2：模块化单体
@Module({
  imports: [UserModule, AuthModule, TenantModule],
  controllers: [UserController],
  providers: [UserService],
})
export class AppModule {}

// 阶段3：混合架构
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly commandBus: CommandBus,
  ) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(dto);
    return this.commandBus.execute(command);
  }
}

// 阶段4：完整微服务
@Controller('users')
export class UserController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async createUser(@Body() dto: CreateUserDto) {
    const command = new CreateUserCommand(dto);
    await this.commandBus.execute(command);
    return { success: true };
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const query = new GetUserQuery(id);
    return this.queryBus.execute(query);
  }
}
```

## 单体应用架构

### 应用模块配置

```typescript
// app.module.ts
@Module({
  imports: [
    // 独立模块导入
    LoggingModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      format: 'json',
    }),

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    DatabaseModule.forRoot({
      type: 'postgresql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [UserEntity, TenantEntity],
    }),

    CacheModule.forRoot({
      type: 'redis',
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT),
    }),

    NotificationModule.forRoot({
      email: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
    }),

    // CQRS模块
    CqrsModule.forRoot(),

    // 业务模块
    PlatformModule,
    TenantModule,
    UserModule,
    AuthModule,
    RoleModule,
    PermissionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

### 单体应用优势

1. **开发简单**：单一代码库，易于开发和调试
2. **部署简单**：单一部署单元，部署流程简单
3. **测试简单**：端到端测试容易实现
4. **性能优化**：无网络调用开销，性能更好
5. **事务管理**：ACID事务支持，数据一致性保证

## 混合架构部署策略

### 部署模式

#### 模式1：单体部署

```yaml
# docker-compose.monolith.yml
version: '3.8'
services:
  app:
    build: ./apps/monolith
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: aiofix_saas
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### 模式2：混合部署

```yaml
# docker-compose.hybrid.yml
version: '3.8'
services:
  # 核心微服务
  user-service:
    build: ./apps/microservices/user-service
    environment:
      - NODE_ENV=production
      - DB_HOST=user-postgres
    depends_on:
      - user-postgres

  auth-service:
    build: ./apps/microservices/auth-service
    environment:
      - NODE_ENV=production
      - DB_HOST=auth-postgres
    depends_on:
      - auth-postgres

  # 单体应用（其他模块）
  monolith:
    build: ./apps/monolith
    environment:
      - NODE_ENV=production
      - DB_HOST=monolith-postgres
    depends_on:
      - monolith-postgres

  # API网关
  gateway:
    build: ./apps/gateway
    ports:
      - '3000:3000'
    depends_on:
      - user-service
      - auth-service
      - monolith
```

#### 模式3：完整微服务

```yaml
# k8s/microservices.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
        - name: user-service
          image: aiofix/user-service:latest
          ports:
            - containerPort: 3000
          env:
            - name: DB_HOST
              value: 'user-postgres-service'
            - name: REDIS_HOST
              value: 'redis-service'
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
spec:
  selector:
    app: user-service
  ports:
    - port: 3000
      targetPort: 3000
```

## 微服务架构优势

### 技术优势

1. **技术多样性**：每个服务可以使用最适合的技术栈
2. **独立部署**：服务可以独立部署和发布
3. **故障隔离**：单个服务故障不影响整个系统
4. **团队自治**：不同团队可以独立开发不同服务

### 业务优势

1. **业务聚焦**：每个服务专注于特定业务领域
2. **快速迭代**：独立服务可以快速迭代和发布
3. **扩展性**：可以根据业务需求独立扩展服务
4. **可维护性**：代码库更小，更容易维护

## 服务间通信策略

### 同步通信

#### HTTP/REST

```typescript
// 服务间HTTP调用
@Injectable()
export class UserServiceClient {
  constructor(private readonly httpService: HttpService) {}

  async getUser(userId: string): Promise<UserDto> {
    const response = await this.httpService.get(`/users/${userId}`).toPromise();
    return response.data;
  }

  async createUser(userData: CreateUserDto): Promise<UserDto> {
    const response = await this.httpService
      .post('/users', userData)
      .toPromise();
    return response.data;
  }
}
```

#### gRPC

```typescript
// gRPC服务定义
service UserService {
  rpc GetUser(GetUserRequest) returns (GetUserResponse);
  rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
  rpc UpdateUser(UpdateUserRequest) returns (UpdateUserResponse);
}

// gRPC客户端
@Injectable()
export class UserGrpcClient {
  private userService: UserServiceClient;

  constructor() {
    this.userService = new UserServiceClient(
      'user-service:50051',
      ChannelCredentials.createInsecure()
    );
  }

  async getUser(userId: string): Promise<User> {
    const request = new GetUserRequest();
    request.setUserId(userId);

    const response = await this.userService.getUser(request);
    return this.mapToUser(response);
  }
}
```

### 异步通信

#### 事件发布/订阅

```typescript
// 事件发布
@Injectable()
export class UserService {
  constructor(private readonly eventBus: EventBus) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    const user = User.create(userData.email, userData.password);

    // 保存用户
    await this.userRepository.save(user);

    // 发布事件
    this.eventBus.publish(new UserCreatedEvent(user.id, user.email));

    return user;
  }
}

// 事件订阅
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler {
  constructor(
    private readonly emailService: EmailService,
    private readonly auditService: AuditService,
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.email);

    // 记录审计日志
    await this.auditService.logUserCreation(event.userId);
  }
}
```

## 多数据库支持策略

### 数据库选择策略

#### PostgreSQL（关系型数据库）

- **适用场景**：结构化数据、事务性操作、复杂查询
- **使用模块**：用户管理、角色权限、计费管理
- **优势**：ACID事务、复杂查询、数据一致性

#### MongoDB（文档数据库）

- **适用场景**：非结构化数据、快速读写、灵活模式
- **使用模块**：日志管理、配置管理、缓存数据
- **优势**：灵活模式、水平扩展、快速开发

### 数据库配置

```typescript
// 多数据库配置
@Module({
  imports: [
    // PostgreSQL配置
    MikroOrmModule.forRoot({
      name: 'postgresql',
      type: 'postgresql',
      host: process.env.POSTGRES_HOST,
      port: parseInt(process.env.POSTGRES_PORT),
      username: process.env.POSTGRES_USERNAME,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DATABASE,
      entities: [UserEntity, TenantEntity, RoleEntity],
      migrations: {
        path: './src/migrations/postgresql',
      },
    }),

    // MongoDB配置
    MikroOrmModule.forRoot({
      name: 'mongodb',
      type: 'mongo',
      host: process.env.MONGO_HOST,
      port: parseInt(process.env.MONGO_PORT),
      username: process.env.MONGO_USERNAME,
      password: process.env.MONGO_PASSWORD,
      database: process.env.MONGO_DATABASE,
      entities: [LogEntity, ConfigEntity, CacheEntity],
    }),
  ],
})
export class DatabaseModule {}
```

### 数据库适配器

```typescript
// 数据库适配器接口
export interface IDatabaseAdapter {
  save<T>(entity: T): Promise<T>;
  findById<T>(id: string): Promise<T | null>;
  find<T>(criteria: any): Promise<T[]>;
  update<T>(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

// PostgreSQL适配器
@Injectable()
export class PostgreSQLAdapter implements IDatabaseAdapter {
  constructor(
    @InjectRepository(UserEntity, 'postgresql')
    private readonly userRepository: EntityRepository<UserEntity>,
  ) {}

  async save<T>(entity: T): Promise<T> {
    return this.userRepository.persistAndFlush(entity);
  }

  async findById<T>(id: string): Promise<T | null> {
    return this.userRepository.findOne(id);
  }
}

// MongoDB适配器
@Injectable()
export class MongoDBAdapter implements IDatabaseAdapter {
  constructor(
    @InjectRepository(LogEntity, 'mongodb')
    private readonly logRepository: EntityRepository<LogEntity>,
  ) {}

  async save<T>(entity: T): Promise<T> {
    return this.logRepository.persistAndFlush(entity);
  }

  async findById<T>(id: string): Promise<T | null> {
    return this.logRepository.findOne(id);
  }
}
```

## 独立模块详细设计

### 日志模块 (@aiofix/logging)

```typescript
// packages/logging/src/services/logging.service.ts
@Injectable()
export class LoggingService {
  private readonly logger: winston.Logger;

  constructor(private readonly config: LoggingConfig) {
    this.logger = winston.createLogger({
      level: config.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.DailyRotateFile({
          filename: 'logs/application-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }
}
```

### 配置模块 (@aiofix/config)

```typescript
// packages/config/src/services/config.service.ts
@Injectable()
export class ConfigService {
  constructor(private readonly config: AppConfig) {}

  get<T = any>(key: string): T {
    return this.config[key];
  }

  getDatabaseConfig(): DatabaseConfig {
    return this.config.database;
  }

  getRedisConfig(): RedisConfig {
    return this.config.redis;
  }

  isDevelopment(): boolean {
    return this.config.nodeEnv === 'development';
  }

  isProduction(): boolean {
    return this.config.nodeEnv === 'production';
  }
}
```

### 缓存模块 (@aiofix/cache)

```typescript
// packages/cache/src/services/cache.service.ts
@Injectable()
export class CacheService {
  constructor(
    private readonly redisClient: Redis,
    private readonly config: CacheConfig,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redisClient.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.setex(key, ttl, serialized);
    } else {
      await this.redisClient.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }
}
```

### 通知模块 (@aiofix/notif)

```typescript
// packages/notification/src/services/notification.service.ts
@Injectable()
export class NotificationService {
  constructor(
    private readonly emailChannel: EmailChannel,
    private readonly smsChannel: SmsChannel,
    private readonly pushChannel: PushChannel,
  ) {}

  async sendEmail(to: string, subject: string, content: string): Promise<void> {
    await this.emailChannel.send({
      to,
      subject,
      html: content,
    });
  }

  async sendSms(to: string, message: string): Promise<void> {
    await this.smsChannel.send({
      to,
      body: message,
    });
  }

  async sendPush(userId: string, title: string, body: string): Promise<void> {
    await this.pushChannel.send({
      userId,
      title,
      body,
    });
  }
}
```

### 数据库模块 (@aiofix/database)

```typescript
// packages/database/src/services/database.service.ts
@Injectable()
export class DatabaseService {
  constructor(private readonly orm: MikroORM) {}

  async getRepository<T>(entity: EntityName<T>): Promise<EntityRepository<T>> {
    return this.orm.em.getRepository(entity);
  }

  async transaction<T>(fn: (em: EntityManager) => Promise<T>): Promise<T> {
    return this.orm.em.transactional(fn);
  }

  async flush(): Promise<void> {
    await this.orm.em.flush();
  }

  async clear(): Promise<void> {
    this.orm.em.clear();
  }
}
```

### 通用模块 (@aiofix/common) - 简化后

```typescript
// packages/common/constants/index.ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const USER_ROLES = {
  PLATFORM_ADMIN: 'platform_admin',
  TENANT_ADMIN: 'tenant_admin',
  ORGANIZATION_ADMIN: 'organization_admin',
  DEPARTMENT_ADMIN: 'department_admin',
  USER: 'user',
} as const;

export const PERMISSIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage',
} as const;
```

### 装饰器

```typescript
// packages/common/decorators/index.ts
export function ApiResponseSuccess<T>(type: new () => T, description?: string) {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: description || '操作成功',
      type,
    }),
  );
}

export function ApiResponseError(status: number, description: string) {
  return applyDecorators(
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: status },
          message: { type: 'string', example: description },
          timestamp: { type: 'string', format: 'date-time' },
          path: { type: 'string' },
        },
      },
    }),
  );
}

export function RequirePermissions(...permissions: string[]) {
  return applyDecorators(
    UseGuards(PermissionGuard),
    SetMetadata('permissions', permissions),
    ApiBearerAuth(),
    ApiResponseError(403, '权限不足'),
  );
}
```

### 异常定义

```typescript
// packages/common/exceptions/index.ts
export class DomainException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = 'DomainException';
  }
}

export class ValidationException extends DomainException {
  constructor(
    message: string,
    public readonly errors: any[],
  ) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundException extends DomainException {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`, 'NOT_FOUND', 404);
  }
}

export class UnauthorizedException extends DomainException {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenException extends DomainException {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}
```

### 过滤器

```typescript
// packages/common/filters/index.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof DomainException) {
      status = exception.statusCode;
      message = exception.message;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
    }

    const errorResponse = {
      statusCode: status,
      message,
      code,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : exception,
    );

    response.status(status).json(errorResponse);
  }
}
```

### 守卫

```typescript
// packages/common/guards/index.ts
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      'permissions',
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    const hasPermission = await this.permissionService.checkPermissions(
      user.id,
      requiredPermissions,
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### 拦截器

```typescript
// packages/common/interceptors/index.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const now = Date.now();

    this.logger.log(`Incoming Request: ${method} ${url}`);

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const contentLength = response.get('content-length');

        this.logger.log(
          `Outgoing Response: ${method} ${url} ${statusCode} ${contentLength} - ${Date.now() - now}ms`,
        );
      }),
      catchError(error => {
        this.logger.error(
          `Request Error: ${method} ${url} - ${error.message}`,
          error.stack,
        );
        throw error;
      }),
    );
  }
}
```

### 管道

```typescript
// packages/common/pipes/index.ts
@Injectable()
export class ValidationPipe implements PipeTransform {
  constructor(private readonly validator: Validator) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!metadata.metatype || !this.toValidate(metadata.metatype)) {
      return value;
    }

    const errors = await this.validator.validate(value);
    if (errors.length > 0) {
      throw new ValidationException('Validation failed', errors);
    }

    return value;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

### 工具函数

```typescript
// packages/common/utils/index.ts
export class StringUtils {
  static generateId(): string {
    return uuid.v4();
  }

  static slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  static maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    const maskedLocal =
      localPart.substring(0, 2) + '*'.repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  }
}

export class DateUtils {
  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  static isExpired(date: Date): boolean {
    return new Date() > date;
  }

  static formatISO(date: Date): string {
    return date.toISOString();
  }
}
```

### 验证器

```typescript
// packages/common/validators/index.ts
export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;

          const hasUpperCase = /[A-Z]/.test(value);
          const hasLowerCase = /[a-z]/.test(value);
          const hasNumbers = /\d/.test(value);
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

          return (
            value.length >= 8 &&
            hasUpperCase &&
            hasLowerCase &&
            hasNumbers &&
            hasSpecialChar
          );
        },
        defaultMessage() {
          return 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters';
        },
      },
    });
  };
}
```

### 类型定义

```typescript
// packages/common/types/index.ts
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

## 相关文档

- [分层架构设计](./02-layered-architecture.md)
- [领域模型设计](./04-domain-models.md)
- [应用层实现](./05-application-layer.md)
- [基础设施实现](./06-infrastructure.md)
- [部署与运维](./08-deployment.md)

---

**上一篇**：[分层架构设计](./02-layered-architecture.md)  
**下一篇**：[领域模型设计](./04-domain-models.md)
