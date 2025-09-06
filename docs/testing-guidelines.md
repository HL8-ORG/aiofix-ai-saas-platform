# 测试规范文档

## 概述

本文档定义了SAAS平台项目的测试规范，包括单元测试、集成测试、端到端测试的编写标准、最佳实践和测试策略。通过统一的测试规范，确保代码质量、系统稳定性和可维护性。

## 测试原则

### 1. 测试金字塔原则

- **单元测试**：70% - 测试单个函数、类、方法
- **集成测试**：20% - 测试模块间交互
- **端到端测试**：10% - 测试完整业务流程

### 2. FIRST原则

- **Fast**：测试应该快速执行
- **Independent**：测试应该相互独立
- **Repeatable**：测试应该可重复执行
- **Self-Validating**：测试应该有明确的通过/失败结果
- **Timely**：测试应该及时编写

### 3. AAA模式

- **Arrange**：准备测试数据和环境
- **Act**：执行被测试的操作
- **Assert**：验证结果

## 测试类型和策略

### 1. 单元测试 (Unit Tests)

#### 1.1 测试范围

- **领域层**：聚合根、值对象、领域服务、领域事件
- **应用层**：命令处理器、查询处理器、应用服务
- **工具函数**：通用工具、验证器、转换器

#### 1.2 测试框架

```typescript
// 使用Jest作为主要测试框架
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
```

#### 1.3 测试结构

```typescript
describe('User Aggregate', () => {
  describe('create', () => {
    it('should create user with valid data', () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'Password123!';
      const name = 'Test User';

      // Act
      const user = User.create(email, password, name);

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe(email);
      expect(user.name).toBe(name);
    });

    it('should throw error for invalid email', () => {
      // Arrange
      const invalidEmail = 'invalid-email';
      const password = 'Password123!';
      const name = 'Test User';

      // Act & Assert
      expect(() => {
        User.create(invalidEmail, password, name);
      }).toThrow('邮箱格式无效');
    });
  });
});
```

#### 1.4 命名规范

- **测试文件**：`*.spec.ts`（遵循NestJS习惯）
- **测试套件**：`describe('ClassName', () => {})`
- **测试用例**：`it('should do something when condition', () => {})`
- **测试数据**：使用有意义的变量名

### 2. 集成测试 (Integration Tests)

#### 2.1 测试范围

- **数据库交互**：仓储实现、数据持久化
- **外部服务**：API调用、消息队列
- **模块协作**：应用层与基础设施层交互

#### 2.2 测试环境

```typescript
// 使用TestContainers进行数据库测试
import { Test, TestingModule } from '@nestjs/testing';
import { MikroORM } from '@mikro-orm/core';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
```

#### 2.3 测试结构

```typescript
describe('UserRepository Integration', () => {
  let app: TestingModule;
  let orm: MikroORM;
  let container: PostgreSqlContainer;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    // 配置测试数据库
  });

  afterAll(async () => {
    await container.stop();
  });

  beforeEach(async () => {
    // 清理测试数据
    await orm.getSchemaGenerator().refreshDatabase();
  });

  it('should save and retrieve user', async () => {
    // Arrange
    const user = User.create('test@example.com', 'Password123!', 'Test User');

    // Act
    await userRepository.save(user);
    const retrievedUser = await userRepository.findById(user.id);

    // Assert
    expect(retrievedUser).toBeDefined();
    expect(retrievedUser.email).toBe(user.email);
  });
});
```

### 3. 端到端测试 (E2E Tests)

#### 3.1 测试范围

- **API端点**：完整的HTTP请求/响应流程
- **业务流程**：用户注册、登录、数据操作
- **系统集成**：多个服务间的协作

#### 3.2 测试框架

```typescript
// 使用Supertest进行API测试
import request from 'supertest';
import { INestApplication } from '@nestjs/common';
```

#### 3.3 测试结构

```typescript
describe('User API E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users should create user', async () => {
    // Arrange
    const createUserDto = {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
    };

    // Act
    const response = await request(app.getHttpServer())
      .post('/users')
      .send(createUserDto);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.data.email).toBe(createUserDto.email);
  });
});
```

## 测试数据管理

### 1. 测试数据工厂

```typescript
// 创建测试数据工厂
export class UserTestFactory {
  static create(overrides: Partial<UserData> = {}): UserData {
    return {
      email: 'test@example.com',
      password: 'Password123!',
      name: 'Test User',
      ...overrides,
    };
  }

  static createMany(
    count: number,
    overrides: Partial<UserData> = {},
  ): UserData[] {
    return Array.from({ length: count }, (_, index) =>
      this.create({
        email: `test${index}@example.com`,
        name: `Test User ${index}`,
        ...overrides,
      }),
    );
  }
}
```

### 2. 测试数据库

```typescript
// 使用内存数据库进行快速测试
export class TestDatabase {
  static async setup(): Promise<MikroORM> {
    return MikroORM.init({
      type: 'sqlite',
      dbName: ':memory:',
      entities: [UserEntity],
      synchronize: true,
    });
  }

  static async cleanup(orm: MikroORM): Promise<void> {
    await orm.getSchemaGenerator().dropSchema();
    await orm.close();
  }
}
```

### 3. Mock和Stub

```typescript
// 使用Jest Mock
jest.mock('@aiofix/core', () => ({
  DataIsolationService: jest.fn().mockImplementation(() => ({
    getDataIsolationContext: jest.fn().mockResolvedValue({
      userId: 'test-user-id',
      isolationLevel: 'user',
    }),
  })),
}));

// 使用Sinon Stub
import sinon from 'sinon';

const stub = sinon.stub(userRepository, 'findById');
stub.resolves(mockUser);
```

## 测试覆盖率

### 1. 覆盖率目标

- **整体覆盖率**：≥ 80%
- **分支覆盖率**：≥ 75%
- **函数覆盖率**：≥ 85%
- **行覆盖率**：≥ 80%

### 2. 覆盖率配置

```json
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 85,
      lines: 80,
      statements: 80,
    },
  },
};
```

### 3. 覆盖率报告

```bash
# 生成覆盖率报告
pnpm test:coverage

# 查看HTML报告
open coverage/lcov-report/index.html
```

## 性能测试

### 1. 性能测试类型

- **负载测试**：正常负载下的性能
- **压力测试**：极限负载下的性能
- **稳定性测试**：长时间运行的稳定性

### 2. 性能测试工具

```typescript
// 使用Artillery进行性能测试
import { test, expect } from '@playwright/test';

test('API performance test', async ({ request }) => {
  const startTime = Date.now();

  const response = await request.get('/api/users');

  const endTime = Date.now();
  const responseTime = endTime - startTime;

  expect(response.status()).toBe(200);
  expect(responseTime).toBeLessThan(1000); // 响应时间小于1秒
});
```

## 测试最佳实践

### 1. 测试组织

```typescript
// 按功能模块组织测试
describe('User Management', () => {
  describe('User Creation', () => {
    // 用户创建相关测试
  });

  describe('User Authentication', () => {
    // 用户认证相关测试
  });

  describe('User Profile', () => {
    // 用户资料相关测试
  });
});
```

### 2. 测试隔离

```typescript
// 每个测试都应该独立
describe('User Service', () => {
  beforeEach(() => {
    // 清理测试环境
    jest.clearAllMocks();
    // 重置数据库
  });

  afterEach(() => {
    // 清理测试数据
  });
});
```

### 3. 断言最佳实践

```typescript
// 使用具体的断言
expect(user.email).toBe('test@example.com');
expect(user.status).toBe('active');
expect(users).toHaveLength(3);

// 避免模糊的断言
expect(user).toBeTruthy(); // 不推荐
expect(result).toBeDefined(); // 不推荐
```

### 4. 错误测试

```typescript
// 测试异常情况
it('should throw error when user not found', async () => {
  // Arrange
  const nonExistentId = 'non-existent-id';

  // Act & Assert
  await expect(userService.findById(nonExistentId)).rejects.toThrow(
    'User not found',
  );
});
```

## 测试环境配置

### 1. 环境变量

```bash
# .env.test
NODE_ENV=test
DATABASE_URL=postgresql://test:test@localhost:5432/test_db
REDIS_URL=redis://localhost:6379/1
LOG_LEVEL=error
```

### 2. 测试配置

```typescript
// test.config.ts
export const testConfig = {
  database: {
    type: 'postgresql',
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'test_db',
  },
  redis: {
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
    db: 1,
  },
};
```

### 3. 测试脚本

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --config jest-e2e.json",
    "test:integration": "jest --config jest-integration.json",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

## 持续集成测试

### 1. GitHub Actions配置

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - run: pnpm install
      - run: pnpm test:ci
      - run: pnpm test:e2e
```

### 2. 测试报告

```yaml
# 上传覆盖率报告
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
    flags: unittests
    name: codecov-umbrella
```

## 测试工具和库

### 1. 核心测试库

- **Jest**：JavaScript测试框架
- **Supertest**：HTTP断言库
- **TestContainers**：集成测试容器
- **Sinon**：测试替身库

### 2. 辅助工具

- **Faker**：生成测试数据
- **Factory Bot**：测试数据工厂
- **Artillery**：性能测试工具
- **Playwright**：端到端测试工具

### 3. 安装命令

```bash
# 安装测试依赖
pnpm add -D jest @types/jest ts-jest
pnpm add -D supertest @types/supertest
pnpm add -D @testcontainers/postgresql
pnpm add -D sinon @types/sinon
pnpm add -D @faker-js/faker
pnpm add -D @playwright/test
```

## 测试文档

### 1. 测试用例文档

```typescript
/**
 * 用户聚合根测试用例
 *
 * 测试覆盖：
 * - 用户创建流程
 * - 用户资料更新
 * - 事件溯源功能
 * - 业务规则验证
 *
 * @fileoverview 用户聚合根单元测试
 * @author AI开发团队
 * @since 1.0.0
 */
```

### 2. 测试报告模板

```markdown
# 测试报告

## 测试概述

- 测试时间：2024-01-01
- 测试环境：开发环境
- 测试范围：用户管理模块

## 测试结果

- 总测试用例：150
- 通过：145
- 失败：5
- 跳过：0
- 覆盖率：85%

## 问题汇总

1. 用户创建时邮箱验证失败
2. 密码强度检查不完整
3. 事件溯源快照功能异常
```

## 总结

本测试规范文档提供了完整的测试指导，包括：

1. **测试原则**：遵循测试金字塔和FIRST原则
2. **测试类型**：单元测试、集成测试、端到端测试
3. **测试策略**：覆盖率目标、性能测试、持续集成
4. **最佳实践**：测试组织、数据管理、环境配置
5. **工具支持**：测试框架、辅助工具、CI/CD集成

通过遵循这些规范，可以确保项目的测试质量，提高代码的可靠性和可维护性。

---

**文档版本**：1.0  
**创建日期**：2024-01-01  
**维护者**：项目开发团队
