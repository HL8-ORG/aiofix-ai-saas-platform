# 测试代码目录架构

## 概述

本文档定义了SAAS平台项目的测试代码目录架构，遵循DDD分层架构和测试金字塔原则，确保测试代码的组织清晰、可维护和可扩展。

## 目录架构设计原则

### 1. 分层对应原则

- 测试目录结构与业务代码目录结构保持一致
- 每个业务模块都有对应的测试目录
- 测试文件与业务文件一一对应

### 2. 测试类型分离

- 单元测试、集成测试、端到端测试分别组织
- 不同测试类型使用不同的文件命名约定
- 测试配置和工具单独管理

### 3. 可维护性原则

- 测试数据工厂集中管理
- 测试工具和辅助函数统一组织
- 测试配置与业务配置分离

## 完整目录架构

```
aiofix-ai-saas-platform/
├── packages/
│   ├── core/
│   │   ├── src/
│   │   │   ├── domain/
│   │   │   │   ├── aggregates/
│   │   │   │   │   ├── user.aggregate.ts
│   │   │   │   │   ├── user.aggregate.spec.ts          # 单元测试
│   │   │   │   │   ├── user.aggregate.integration.spec.ts # 集成测试
│   │   │   │   │   └── user.aggregate.e2e.spec.ts      # E2E测试
│   │   │   │   ├── services/
│   │   │   │   │   ├── data-isolation.service.ts
│   │   │   │   │   └── data-isolation.service.spec.ts
│   │   │   │   └── events/
│   │   │   │       ├── user-created.event.ts
│   │   │   │       └── user-created.event.spec.ts
│   │   │   ├── application/
│   │   │   │   ├── commands/
│   │   │   │   │   ├── handlers/
│   │   │   │   │   │   ├── create-user.handler.ts
│   │   │   │   │   │   └── create-user.handler.spec.ts
│   │   │   │   │   └── create-user.command.ts
│   │   │   │   ├── queries/
│   │   │   │   │   ├── handlers/
│   │   │   │   │   │   ├── get-user.handler.ts
│   │   │   │   │   │   └── get-user.handler.spec.ts
│   │   │   │   │   └── get-user.query.ts
│   │   │   │   └── services/
│   │   │   │       ├── user.application.service.ts
│   │   │   │       └── user.application.service.spec.ts
│   │   │   └── infrastructure/
│   │   │       ├── repositories/
│   │   │       │   ├── user.repository.ts
│   │   │       │   └── user.repository.integration.spec.ts
│   │   │       └── event-store/
│   │   │           ├── event-store.service.ts
│   │   │           └── event-store.service.integration.spec.ts
│   │   └── __tests__/                    # 包级别的测试
│   │       ├── fixtures/                 # 测试夹具
│   │       │   ├── user.fixtures.ts
│   │       │   └── tenant.fixtures.ts
│   │       ├── mocks/                    # Mock对象
│   │       │   ├── user.repository.mock.ts
│   │       │   └── event-store.mock.ts
│   │       └── utils/                    # 测试工具
│   │           ├── test-database.ts
│   │           └── test-helpers.ts
│   │
│   ├── common/
│   │   ├── src/
│   │   │   ├── test-factories/           # 测试数据工厂
│   │   │   │   ├── index.ts
│   │   │   │   ├── user.factory.ts
│   │   │   │   └── tenant.factory.ts
│   │   │   ├── exceptions/
│   │   │   │   ├── base.exception.ts
│   │   │   │   └── base.exception.spec.ts
│   │   │   └── types/
│   │   │       ├── common.types.ts
│   │   │       └── common.types.spec.ts
│   │   └── __tests__/
│   │       ├── integration/              # 集成测试
│   │       │   ├── test-factories.integration.spec.ts
│   │       │   └── exceptions.integration.spec.ts
│   │       └── e2e/                      # E2E测试
│   │           └── common.e2e.spec.ts
│   │
│   └── [其他包]/
│       └── [类似结构]
│
├── apps/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   │   ├── user.controller.ts
│   │   │   │   └── user.controller.spec.ts
│   │   │   ├── guards/
│   │   │   │   ├── auth.guard.ts
│   │   │   │   └── auth.guard.spec.ts
│   │   │   └── pipes/
│   │   │       ├── validation.pipe.ts
│   │   │       └── validation.pipe.spec.ts
│   │   └── __tests__/
│   │       ├── e2e/                      # API E2E测试
│   │       │   ├── user.e2e.spec.ts
│   │       │   ├── auth.e2e.spec.ts
│   │       │   └── tenant.e2e.spec.ts
│   │       ├── integration/              # 集成测试
│   │       │   ├── controllers.integration.spec.ts
│   │       │   └── guards.integration.spec.ts
│   │       └── fixtures/                 # 测试数据
│   │           ├── api-responses.fixtures.ts
│   │           └── test-users.fixtures.ts
│   │
│   └── [其他应用]/
│       └── [类似结构]
│
├── tests/                               # 全局测试目录
│   ├── e2e/                            # 全局E2E测试
│   │   ├── user-management.e2e.spec.ts
│   │   ├── tenant-management.e2e.spec.ts
│   │   ├── auth-flow.e2e.spec.ts
│   │   └── performance/                 # 性能测试
│   │       ├── api-performance.spec.ts
│   │       └── load-testing.spec.ts
│   │
│   ├── integration/                     # 全局集成测试
│   │   ├── cross-module.integration.spec.ts
│   │   ├── database.integration.spec.ts
│   │   └── event-sourcing.integration.spec.ts
│   │
│   ├── fixtures/                        # 全局测试夹具
│   │   ├── database.fixtures.ts
│   │   ├── redis.fixtures.ts
│   │   └── test-data.fixtures.ts
│   │
│   ├── mocks/                          # 全局Mock
│   │   ├── external-services.mock.ts
│   │   ├── database.mock.ts
│   │   └── redis.mock.ts
│   │
│   └── utils/                          # 全局测试工具
│       ├── test-containers.ts
│       ├── test-database.ts
│       ├── test-redis.ts
│       └── test-helpers.ts
│
├── jest.config.js                      # 主Jest配置
├── jest-integration.config.js          # 集成测试配置
├── jest-e2e.config.js                  # E2E测试配置
├── jest.setup.js                       # 全局测试设置
├── jest.integration.setup.js           # 集成测试设置
└── jest.e2e.setup.js                   # E2E测试设置
```

## 文件命名约定

### 1. 测试文件命名

```typescript
// 单元测试
*.spec.ts                    // 基础单元测试（遵循NestJS习惯）

// 集成测试
*.integration.spec.ts        // 集成测试

// 端到端测试
*.e2e.spec.ts               // 端到端测试
```

### 2. 测试数据文件命名

```typescript
// 测试工厂
*.factory.ts                 // 测试数据工厂
*.fixtures.ts               // 测试夹具
*.mock.ts                   // Mock对象
*.stub.ts                   // Stub对象

// 测试工具
test-*.ts                   // 测试工具函数
*-test-utils.ts             // 测试工具类
```

## 测试组织策略

### 1. 按模块组织

```typescript
// 用户管理模块测试
packages/core/src/domain/aggregates/
├── user.aggregate.ts
├── user.aggregate.spec.ts
├── user.aggregate.integration.spec.ts
└── user.aggregate.e2e.spec.ts
```

### 2. 按测试类型组织

```typescript
// 集成测试目录
packages/core/__tests__/integration/
├── user.integration.spec.ts
├── tenant.integration.spec.ts
└── organization.integration.spec.ts
```

### 3. 按功能组织

```typescript
// E2E测试按业务流程组织
tests/e2e/
├── user-registration.e2e.spec.ts
├── user-login.e2e.spec.ts
├── tenant-creation.e2e.spec.ts
└── organization-setup.e2e.spec.ts
```

## 测试配置组织

### 1. 分层配置

```javascript
// 主配置 - 单元测试
jest.config.js;

// 集成测试配置
jest - integration.config.js;

// E2E测试配置
jest - e2e.config.js;
```

### 2. 环境特定配置

```javascript
// 开发环境
jest.setup.js;

// 集成测试环境
jest.integration.setup.js;

// E2E测试环境
jest.e2e.setup.js;
```

## 测试数据管理

### 1. 测试工厂集中管理

```typescript
// 统一测试数据工厂
packages/common/src/test-factories/
├── index.ts                // 导出所有工厂
├── user.factory.ts         // 用户测试数据
├── tenant.factory.ts       // 租户测试数据
└── organization.factory.ts // 组织测试数据
```

### 2. 测试夹具按模块组织

```typescript
// 模块级测试夹具
packages/core/__tests__/fixtures/
├── user.fixtures.ts        // 用户测试夹具
├── tenant.fixtures.ts      // 租户测试夹具
└── database.fixtures.ts    // 数据库测试夹具
```

### 3. Mock对象统一管理

```typescript
// 全局Mock对象
tests/mocks/
├── external-services.mock.ts
├── database.mock.ts
└── redis.mock.ts
```

## 测试工具组织

### 1. 测试工具分层

```typescript
// 包级工具
packages/core/__tests__/utils/
├── test-database.ts        // 数据库测试工具
└── test-helpers.ts         // 通用测试工具

// 全局工具
tests/utils/
├── test-containers.ts      // 容器测试工具
├── test-database.ts        // 全局数据库工具
└── test-helpers.ts         // 全局测试工具
```

### 2. 测试环境管理

```typescript
// 测试环境配置
tests/utils/
├── test-environment.ts     // 测试环境管理
├── test-setup.ts          // 测试环境设置
└── test-teardown.ts       // 测试环境清理
```

## 最佳实践

### 1. 测试文件组织

- 测试文件与业务文件保持相同的目录结构
- 使用描述性的测试文件名
- 按功能模块分组测试

### 2. 测试数据管理

- 使用工厂模式创建测试数据
- 避免硬编码测试数据
- 测试数据应该可重复和可预测

### 3. 测试配置管理

- 不同测试类型使用不同的配置文件
- 环境变量用于测试配置
- 测试配置与业务配置分离

### 4. 测试工具复用

- 通用测试工具放在全局目录
- 特定测试工具放在模块目录
- 测试工具应该易于使用和维护

## 总结

这个测试目录架构设计遵循以下原则：

1. **清晰性**：目录结构清晰，易于理解和导航
2. **一致性**：与业务代码结构保持一致
3. **可维护性**：测试代码易于维护和扩展
4. **可复用性**：测试工具和数据可以复用
5. **可扩展性**：支持项目规模的增长

通过这种组织方式，可以确保测试代码的质量和可维护性，支持项目的长期发展。

---

**文档版本**：1.0  
**创建日期**：2024-01-01  
**维护者**：项目开发团队
