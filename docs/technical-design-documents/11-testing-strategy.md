# 测试策略文档

## 文档信息

- **文档名称**: 测试策略文档
- **文档版本**: V1.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

本文档详细说明了项目的测试策略，包括测试金字塔、测试类型、测试工具、测试数据管理和持续集成。测试策略基于Clean Architecture和DDD原则，确保代码质量、系统稳定性和业务正确性。

## 测试金字塔

### 1. 测试层次结构

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← 少量，高价值
                    │   (端到端测试)    │
                    └─────────────────┘
                           │
                    ┌─────────────────┐
                    │ Integration     │  ← 适量，中等价值
                    │ Tests           │
                    │ (集成测试)       │
                    └─────────────────┘
                           │
                    ┌─────────────────┐
                    │   Unit Tests    │  ← 大量，基础价值
                    │   (单元测试)     │
                    └─────────────────┘
```

### 2. 测试比例建议

- **单元测试**: 70% - 快速、独立、可重复
- **集成测试**: 20% - 验证组件间交互
- **端到端测试**: 10% - 验证完整业务流程

## 测试类型详解

### 1. 单元测试 (Unit Tests)

#### 测试目标

- **领域模型**: 聚合根、实体、值对象、领域服务
- **应用服务**: 用例、命令处理器、查询处理器
- **工具函数**: 纯函数、工具类、验证器

#### 测试特点

- **快速执行**: 毫秒级执行时间
- **独立运行**: 不依赖外部资源
- **可重复**: 每次执行结果一致
- **高覆盖率**: 覆盖所有代码路径

#### 示例代码

```typescript
/**
 * 用户聚合根单元测试
 */
describe('UserAggregate', () => {
  let user: UserAggregate;

  beforeEach(() => {
    user = UserAggregate.create(
      new UserId('user-123'),
      new Email('user@example.com'),
      new Password('hashedPassword'),
      new UserProfile('John', 'Doe'),
      new UserPreferences('en', 'UTC'),
    );
  });

  describe('create', () => {
    it('should create user with valid data', () => {
      expect(user.getAggregateId().value).toBe('user-123');
      expect(user.getEmail().value).toBe('user@example.com');
      expect(user.getProfile().firstName).toBe('John');
      expect(user.getProfile().lastName).toBe('Doe');
    });

    it('should publish UserCreatedEvent', () => {
      const events = user.uncommittedEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', () => {
      const newProfile = new UserProfile('Jane', 'Smith');
      user.updateProfile(newProfile);

      expect(user.getProfile().firstName).toBe('Jane');
      expect(user.getProfile().lastName).toBe('Smith');
    });

    it('should publish UserProfileUpdatedEvent', () => {
      const newProfile = new UserProfile('Jane', 'Smith');
      user.updateProfile(newProfile);

      const events = user.uncommittedEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserProfileUpdatedEvent);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', () => {
      const newPassword = new Password('newHashedPassword');
      user.changePassword(newPassword);

      expect(user.getPassword().value).toBe('newHashedPassword');
    });

    it('should publish UserPasswordUpdatedEvent', () => {
      const newPassword = new Password('newHashedPassword');
      user.changePassword(newPassword);

      const events = user.uncommittedEvents;
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserPasswordUpdatedEvent);
    });
  });
});

/**
 * 邮箱值对象单元测试
 */
describe('Email', () => {
  describe('constructor', () => {
    it('should create email with valid format', () => {
      const email = new Email('user@example.com');
      expect(email.value).toBe('user@example.com');
    });

    it('should throw error for invalid email format', () => {
      expect(() => new Email('invalid-email')).toThrow('Invalid email format');
    });

    it('should normalize email to lowercase', () => {
      const email = new Email('USER@EXAMPLE.COM');
      expect(email.value).toBe('user@example.com');
    });
  });

  describe('equals', () => {
    it('should return true for same email', () => {
      const email1 = new Email('user@example.com');
      const email2 = new Email('user@example.com');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return true for same email with different case', () => {
      const email1 = new Email('user@example.com');
      const email2 = new Email('USER@EXAMPLE.COM');
      expect(email1.equals(email2)).toBe(true);
    });

    it('should return false for different emails', () => {
      const email1 = new Email('user@example.com');
      const email2 = new Email('other@example.com');
      expect(email1.equals(email2)).toBe(false);
    });
  });
});

/**
 * 创建用户用例单元测试
 */
describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;
  let mockUserRepository: jest.Mocked<IUserRepository>;
  let mockEventBus: jest.Mocked<IEventBus>;
  let mockUserDomainService: jest.Mocked<UserDomainService>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockEventBus = createMockEventBus();
    mockUserDomainService = createMockUserDomainService();

    useCase = new CreateUserUseCase(
      mockUserRepository,
      mockUserDomainService,
      mockEventBus,
    );
  });

  describe('execute', () => {
    it('should create user successfully', async () => {
      // 准备测试数据
      const command = new CreateUserCommand(
        'user-123',
        'user@example.com',
        'password123',
        'John',
        'Doe',
        'tenant-456',
        'admin-789',
      );

      // 设置模拟对象行为
      mockUserDomainService.isEmailUniqueInTenant.mockResolvedValue(true);
      mockUserRepository.countByTenant.mockResolvedValue(5);
      mockUserRepository.save.mockResolvedValue();
      mockEventBus.publishAll.mockResolvedValue();

      // 执行用例
      const result = await useCase.execute(command);

      // 验证结果
      expect(result).toBeDefined();
      expect(result.userId).toBe('user-123');

      // 验证依赖调用
      expect(mockUserDomainService.isEmailUniqueInTenant).toHaveBeenCalledWith(
        expect.any(Email),
        expect.any(TenantId),
      );
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
        'admin-789',
      );

      // 设置模拟对象行为
      mockUserDomainService.isEmailUniqueInTenant.mockResolvedValue(false);

      // 执行用例并验证异常
      await expect(useCase.execute(command)).rejects.toThrow(
        'Email already exists in tenant',
      );
    });

    it('should throw error when tenant quota exceeded', async () => {
      // 准备测试数据
      const command = new CreateUserCommand(
        'user-123',
        'user@example.com',
        'password123',
        'John',
        'Doe',
        'tenant-456',
        'admin-789',
      );

      // 设置模拟对象行为
      mockUserDomainService.isEmailUniqueInTenant.mockResolvedValue(true);
      mockUserRepository.countByTenant.mockResolvedValue(100);

      // 执行用例并验证异常
      await expect(useCase.execute(command)).rejects.toThrow(
        'Tenant user quota exceeded',
      );
    });
  });
});
```

### 2. 集成测试 (Integration Tests)

#### 测试目标

- **数据库集成**: 仓储实现、数据映射
- **外部服务集成**: 邮件服务、短信服务、推送服务
- **消息队列集成**: 事件发布、事件处理
- **API集成**: 控制器、中间件、过滤器

#### 测试特点

- **真实环境**: 使用真实的数据库和外部服务
- **组件交互**: 验证多个组件间的协作
- **数据一致性**: 验证数据在系统中的流转
- **性能验证**: 验证系统在真实负载下的表现

#### 示例代码

```typescript
/**
 * 用户仓储集成测试
 */
describe('UserRepository Integration', () => {
  let repository: UserRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    // 设置测试数据库
    dataSource = await createTestDataSource();
    await dataSource.synchronize();

    repository = new UserRepository(
      dataSource.getRepository(UserModel),
      mockEventPublisher,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    // 清理测试数据
    await dataSource.getRepository(UserModel).clear();
  });

  describe('save', () => {
    it('should save user to database', async () => {
      // 准备测试数据
      const user = UserAggregate.create(
        new UserId('user-123'),
        new Email('user@example.com'),
        new Password('hashedPassword'),
        new UserProfile('John', 'Doe'),
        new UserPreferences('en', 'UTC'),
      );

      // 执行操作
      await repository.save(user);

      // 验证结果
      const savedUser = await repository.findById(new UserId('user-123'));
      expect(savedUser).toBeDefined();
      expect(savedUser.getEmail().value).toBe('user@example.com');
    });

    it('should handle concurrent updates', async () => {
      // 准备测试数据
      const user = UserAggregate.create(
        new UserId('user-123'),
        new Email('user@example.com'),
        new Password('hashedPassword'),
        new UserProfile('John', 'Doe'),
        new UserPreferences('en', 'UTC'),
      );

      await repository.save(user);

      // 模拟并发更新
      const user1 = await repository.findById(new UserId('user-123'));
      const user2 = await repository.findById(new UserId('user-123'));

      user1.updateProfile(new UserProfile('Jane', 'Smith'));
      user2.updateProfile(new UserProfile('Bob', 'Johnson'));

      // 第一个更新应该成功
      await repository.save(user1);

      // 第二个更新应该失败（乐观锁）
      await expect(repository.save(user2)).rejects.toThrow();
    });
  });

  describe('findByEmailAndTenant', () => {
    it('should find user by email and tenant', async () => {
      // 准备测试数据
      const user = UserAggregate.create(
        new UserId('user-123'),
        new Email('user@example.com'),
        new Password('hashedPassword'),
        new UserProfile('John', 'Doe'),
        new UserPreferences('en', 'UTC'),
      );

      await repository.save(user);

      // 执行查询
      const foundUser = await repository.findByEmailAndTenant(
        new Email('user@example.com'),
        new TenantId('tenant-456'),
      );

      // 验证结果
      expect(foundUser).toBeDefined();
      expect(foundUser.getAggregateId().value).toBe('user-123');
    });
  });
});

/**
 * 事件总线集成测试
 */
describe('EventBus Integration', () => {
  let eventBus: RedisEventBus;
  let redis: Redis;

  beforeAll(async () => {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    eventBus = new RedisEventBus(redis, mockLogger);
  });

  afterAll(async () => {
    await redis.quit();
  });

  beforeEach(async () => {
    // 清理Redis数据
    await redis.flushdb();
  });

  describe('publish and subscribe', () => {
    it('should publish and receive events', async () => {
      const receivedEvents: IDomainEvent[] = [];
      const handler = jest.fn((event: IDomainEvent) => {
        receivedEvents.push(event);
      });

      // 订阅事件
      eventBus.subscribe('UserCreated', handler);

      // 发布事件
      const event = new UserCreatedEvent(
        'user-123',
        'tenant-456',
        'user@example.com',
        { firstName: 'John', lastName: 'Doe' },
      );

      await eventBus.publish(event);

      // 等待事件处理
      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证结果
      expect(handler).toHaveBeenCalledWith(event);
      expect(receivedEvents).toHaveLength(1);
    });
  });
});

/**
 * 用户控制器集成测试
 */
describe('UserController Integration', () => {
  let app: INestApplication;
  let userRepository: IUserRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [UserModule],
    })
      .overrideProvider('IUserRepository')
      .useClass(UserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = app.get<IUserRepository>('IUserRepository');
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /users', () => {
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
        tenantId: 'tenant-456',
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

    it('should return 400 for invalid data', async () => {
      // 准备无效数据
      const invalidDto = {
        email: 'invalid-email',
        password: '123', // 太短
      };

      // 发送HTTP请求
      await request(app.getHttpServer())
        .post('/api/users')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('GET /users/:id', () => {
    it('should get user by ID', async () => {
      // 准备测试数据
      const user = UserAggregate.create(
        new UserId('user-123'),
        new Email('user@example.com'),
        new Password('hashedPassword'),
        new UserProfile('John', 'Doe'),
        new UserPreferences('en', 'UTC'),
      );

      await userRepository.save(user);

      // 发送HTTP请求
      const response = await request(app.getHttpServer())
        .get('/api/users/user-123')
        .expect(200);

      // 验证响应
      expect(response.body).toMatchObject({
        id: 'user-123',
        email: 'user@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
        },
      });
    });

    it('should return 404 for non-existent user', async () => {
      // 发送HTTP请求
      await request(app.getHttpServer())
        .get('/api/users/non-existent')
        .expect(404);
    });
  });
});
```

### 3. 端到端测试 (E2E Tests)

#### 测试目标

- **完整业务流程**: 用户注册、登录、权限管理
- **跨系统集成**: 多个服务间的协作
- **用户体验**: 从用户角度验证系统功能
- **性能测试**: 系统在高负载下的表现

#### 测试特点

- **真实环境**: 使用生产环境配置
- **完整流程**: 覆盖完整的用户场景
- **数据验证**: 验证端到端的数据一致性
- **性能监控**: 监控响应时间和资源使用

#### 示例代码

```typescript
/**
 * 用户注册流程端到端测试
 */
describe('User Registration E2E', () => {
  let app: INestApplication;
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    // 启动应用
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // 启动浏览器
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
    await app.close();
  });

  describe('User Registration Flow', () => {
    it('should complete user registration successfully', async () => {
      // 1. 访问注册页面
      await page.goto('http://localhost:3000/register');

      // 2. 填写注册表单
      await page.fill('[data-testid="email-input"]', 'user@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');
      await page.fill('[data-testid="firstName-input"]', 'John');
      await page.fill('[data-testid="lastName-input"]', 'Doe');

      // 3. 提交表单
      await page.click('[data-testid="submit-button"]');

      // 4. 验证成功消息
      await page.waitForSelector('[data-testid="success-message"]');
      const successMessage = await page.textContent(
        '[data-testid="success-message"]',
      );
      expect(successMessage).toContain('Registration successful');

      // 5. 验证用户已创建
      const user = await getUserFromDatabase('user@example.com');
      expect(user).toBeDefined();
      expect(user.email).toBe('user@example.com');
      expect(user.profile.firstName).toBe('John');
      expect(user.profile.lastName).toBe('Doe');

      // 6. 验证欢迎邮件已发送
      const emails = await getEmailsFromMailService();
      const welcomeEmail = emails.find(
        email => email.to === 'user@example.com',
      );
      expect(welcomeEmail).toBeDefined();
      expect(welcomeEmail.subject).toContain('Welcome');
    });

    it('should handle registration errors gracefully', async () => {
      // 1. 访问注册页面
      await page.goto('http://localhost:3000/register');

      // 2. 填写无效数据
      await page.fill('[data-testid="email-input"]', 'invalid-email');
      await page.fill('[data-testid="password-input"]', '123'); // 太短
      await page.fill('[data-testid="firstName-input"]', '');
      await page.fill('[data-testid="lastName-input"]', '');

      // 3. 提交表单
      await page.click('[data-testid="submit-button"]');

      // 4. 验证错误消息
      await page.waitForSelector('[data-testid="error-message"]');
      const errorMessage = await page.textContent(
        '[data-testid="error-message"]',
      );
      expect(errorMessage).toContain('Please check your input');

      // 5. 验证用户未创建
      const user = await getUserFromDatabase('invalid-email');
      expect(user).toBeUndefined();
    });
  });

  describe('User Login Flow', () => {
    it('should complete user login successfully', async () => {
      // 1. 创建测试用户
      await createTestUser({
        email: 'user@example.com',
        password: 'password123',
        profile: { firstName: 'John', lastName: 'Doe' },
      });

      // 2. 访问登录页面
      await page.goto('http://localhost:3000/login');

      // 3. 填写登录表单
      await page.fill('[data-testid="email-input"]', 'user@example.com');
      await page.fill('[data-testid="password-input"]', 'password123');

      // 4. 提交表单
      await page.click('[data-testid="submit-button"]');

      // 5. 验证登录成功
      await page.waitForSelector('[data-testid="dashboard"]');
      const dashboardTitle = await page.textContent(
        '[data-testid="dashboard-title"]',
      );
      expect(dashboardTitle).toContain('Welcome, John');

      // 6. 验证会话已创建
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(cookie => cookie.name === 'session');
      expect(sessionCookie).toBeDefined();
    });
  });
});

/**
 * 性能测试
 */
describe('Performance Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User API Performance', () => {
    it('should handle concurrent user creation', async () => {
      const concurrentRequests = 100;
      const requests = [];

      // 创建并发请求
      for (let i = 0; i < concurrentRequests; i++) {
        const request = request(app.getHttpServer())
          .post('/api/users')
          .send({
            userId: `user-${i}`,
            email: `user${i}@example.com`,
            password: 'password123',
            profile: { firstName: 'John', lastName: 'Doe' },
            tenantId: 'tenant-456',
          });

        requests.push(request);
      }

      // 执行并发请求
      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // 验证结果
      expect(responses.every(response => response.status === 201)).toBe(true);
      expect(endTime - startTime).toBeLessThan(5000); // 5秒内完成
    });

    it('should handle high load user queries', async () => {
      // 创建测试数据
      await createTestUsers(1000);

      const startTime = Date.now();

      // 执行查询
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .query({ page: 1, limit: 100 })
        .expect(200);

      const endTime = Date.now();

      // 验证结果
      expect(response.body.data).toHaveLength(100);
      expect(endTime - startTime).toBeLessThan(1000); // 1秒内完成
    });
  });
});
```

## 测试工具配置

### 1. Jest配置

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/packages', '<rootDir>/apps'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'packages/**/*.ts',
    'apps/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testTimeout: 10000,
  maxWorkers: '50%',
};
```

### 2. 测试环境设置

```typescript
// jest.setup.ts
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';

// 全局测试设置
beforeAll(async () => {
  // 设置测试数据库
  const dataSource = new DataSource({
    type: 'postgresql',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    username: process.env.TEST_DB_USERNAME || 'postgres',
    password: process.env.TEST_DB_PASSWORD || 'password',
    database: process.env.TEST_DB_NAME || 'aiofix_test',
    entities: [UserModel, TenantModel],
    synchronize: true,
    dropSchema: true,
  });

  await dataSource.initialize();
  global.testDataSource = dataSource;
});

afterAll(async () => {
  if (global.testDataSource) {
    await global.testDataSource.destroy();
  }
});

// 清理测试数据
afterEach(async () => {
  if (global.testDataSource) {
    const entities = global.testDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = global.testDataSource.getRepository(entity.name);
      await repository.clear();
    }
  }
});
```

### 3. 测试数据工厂

```typescript
/**
 * 测试数据工厂
 */
export class TestDataFactory {
  /**
   * 创建测试用户
   */
  static createUser(overrides: Partial<UserData> = {}): UserData {
    return {
      id: 'user-123',
      email: 'user@example.com',
      password: 'password123',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
      preferences: {
        language: 'en',
        timezone: 'UTC',
      },
      tenantId: 'tenant-456',
      ...overrides,
    };
  }

  /**
   * 创建测试租户
   */
  static createTenant(overrides: Partial<TenantData> = {}): TenantData {
    return {
      id: 'tenant-456',
      name: 'Test Tenant',
      settings: {
        maxUsers: 100,
        features: ['user-management', 'notifications'],
      },
      ...overrides,
    };
  }

  /**
   * 创建测试组织
   */
  static createOrganization(
    overrides: Partial<OrganizationData> = {},
  ): OrganizationData {
    return {
      id: 'org-789',
      name: 'Test Organization',
      description: 'Test organization description',
      tenantId: 'tenant-456',
      ...overrides,
    };
  }
}

/**
 * 模拟对象工厂
 */
export class MockFactory {
  /**
   * 创建模拟用户仓储
   */
  static createMockUserRepository(): jest.Mocked<IUserRepository> {
    return {
      findById: jest.fn(),
      findByEmailAndTenant: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      countByTenant: jest.fn(),
      isEmailUniqueInTenant: jest.fn(),
    };
  }

  /**
   * 创建模拟事件总线
   */
  static createMockEventBus(): jest.Mocked<IEventBus> {
    return {
      publish: jest.fn(),
      publishAll: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    };
  }

  /**
   * 创建模拟邮件服务
   */
  static createMockEmailService(): jest.Mocked<IEmailService> {
    return {
      sendWelcomeEmail: jest.fn(),
      sendNotificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
    };
  }
}
```

## 持续集成配置

### 1. GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: aiofix_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:6
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install

      - name: Run linting
        run: pnpm lint

      - name: Run type checking
        run: pnpm type-check

      - name: Run unit tests
        run: pnpm test:unit
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/aiofix_test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/aiofix_test
          REDIS_URL: redis://localhost:6379

      - name: Run E2E tests
        run: pnpm test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/aiofix_test
          REDIS_URL: redis://localhost:6379

      - name: Generate coverage report
        run: pnpm test:coverage

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

### 2. 测试脚本

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch",
    "test:debug": "jest --runInBand --detectOpenHandles",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "type-check": "tsc --noEmit"
  }
}
```

## 测试最佳实践

### 1. 测试命名

- **描述性命名**: 测试名称应该清楚描述测试场景
- **Given-When-Then**: 使用BDD风格的测试结构
- **中文描述**: 使用中文描述业务场景

```typescript
describe('用户注册', () => {
  describe('当用户提供有效信息时', () => {
    it('应该成功创建用户并发送欢迎邮件', async () => {
      // Given: 用户提供有效信息
      const userData = TestDataFactory.createUser();

      // When: 执行用户注册
      const result = await userService.register(userData);

      // Then: 应该成功创建用户并发送欢迎邮件
      expect(result).toBeDefined();
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalled();
    });
  });
});
```

### 2. 测试数据管理

- **测试隔离**: 每个测试使用独立的数据
- **数据清理**: 测试后清理测试数据
- **数据工厂**: 使用工厂模式创建测试数据
- **模拟数据**: 使用模拟对象隔离外部依赖

### 3. 断言策略

- **具体断言**: 使用具体的断言而不是模糊的断言
- **错误消息**: 提供清晰的错误消息
- **边界测试**: 测试边界条件和异常情况
- **性能断言**: 验证性能要求

### 4. 测试维护

- **重构友好**: 测试应该易于重构
- **文档化**: 为复杂的测试提供文档
- **定期审查**: 定期审查和更新测试
- **删除过时测试**: 及时删除不再需要的测试

## 总结

测试策略是确保代码质量和系统稳定性的重要手段。通过合理的测试金字塔、完善的测试工具配置和持续集成，可以建立可靠的测试体系。本指南提供了完整的测试策略，包括单元测试、集成测试、端到端测试的实施方法和最佳实践，为项目的长期发展提供了坚实的质量保障。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
