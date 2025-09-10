# 模块结构设计指南

## 文档信息

- **文档名称**: 模块结构设计指南
- **文档版本**: V1.1
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

本指南详细说明了项目的模块结构设计，基于Clean Architecture和DDD原则，确保代码组织清晰、职责明确、易于维护和扩展。模块结构遵循分层架构和依赖倒置原则，支持多租户架构和事件驱动设计。

## 代码组织原则

### 功能导向 vs 技术导向

本架构采用**功能导向**的代码组织方式，相比传统的**技术导向**组织方式具有以下优势：

**功能导向组织** (当前采用):

```
infrastructure/
├── cache/              # 缓存功能
├── guards/             # 认证授权功能
├── interceptors/       # 横切关注点功能
└── external-adapters/  # 外部服务功能
```

**技术导向组织** (传统方式):

```
infrastructure/
├── persistence/postgresql/  # PostgreSQL技术
├── persistence/mongodb/     # MongoDB技术
└── interfaces/rest/         # REST技术
```

### 功能导向的优势

1. **功能内聚**: 相关功能组件集中管理，便于维护和扩展
2. **技术解耦**: 技术变更不影响功能模块，支持技术栈升级
3. **团队协作**: 不同团队可以独立开发不同功能模块，减少冲突
4. **代码复用**: 守卫、拦截器、装饰器等可以跨协议复用
5. **测试友好**: 测试结构清晰，功能模块独立测试
6. **扩展便利**: 新功能直接添加，无需重构目录结构

## 项目整体结构

### 1. 根目录结构

```
aiofix-ai-saas-platform/
├── packages/                    # 包目录
│   ├── shared/                 # 共享包
│   ├── core/                   # 核心包
│   ├── user/                   # 用户模块
│   ├── tenant/                 # 租户模块
│   ├── organization/           # 组织模块
│   ├── department/             # 部门模块
│   ├── notification/           # 通知模块
│   └── infrastructure/         # 基础设施包
├── apps/                       # 应用目录
│   ├── api/                    # API应用
│   ├── worker/                 # 后台工作应用
│   └── admin/                  # 管理后台应用
├── docs/                       # 文档目录
├── scripts/                    # 脚本目录
├── docker/                     # Docker配置
├── .github/                    # GitHub配置
├── package.json                # 根包配置
├── pnpm-workspace.yaml         # pnpm工作空间配置
├── tsconfig.json               # TypeScript配置
└── README.md                   # 项目说明
```

### 2. 包结构设计

#### 共享包 (packages/shared)

```
packages/shared/
├── src/
│   ├── identifiers/            # 标识符值对象
│   │   ├── user-id.vo.ts
│   │   ├── tenant-id.vo.ts
│   │   ├── organization-id.vo.ts
│   │   └── index.ts
│   ├── common/                 # 通用值对象
│   │   ├── email.vo.ts
│   │   ├── phone-number.vo.ts
│   │   ├── notification-status.vo.ts
│   │   └── index.ts
│   ├── events/                 # 基础事件类
│   │   ├── domain-event.base.ts
│   │   ├── integration-event.base.ts
│   │   └── index.ts
│   ├── interfaces/             # 通用接口
│   │   ├── repository.interface.ts
│   │   ├── event-handler.interface.ts
│   │   └── index.ts
│   ├── modules/                # 模块特定共享组件
│   │   ├── user/               # 用户模块共享组件
│   │   │   ├── constants/
│   │   │   │   └── user.constants.ts
│   │   │   ├── types/
│   │   │   │   └── user.types.ts
│   │   │   └── utils/
│   │   │       └── user.utils.ts
│   │   ├── tenant/             # 租户模块共享组件
│   │   │   ├── constants/
│   │   │   │   └── tenant.constants.ts
│   │   │   ├── types/
│   │   │   │   └── tenant.types.ts
│   │   │   └── utils/
│   │   │       └── tenant.utils.ts
│   │   ├── organization/       # 组织模块共享组件
│   │   │   ├── constants/
│   │   │   │   └── organization.constants.ts
│   │   │   ├── types/
│   │   │   │   └── organization.types.ts
│   │   │   └── utils/
│   │   │       └── organization.utils.ts
│   │   └── notification/       # 通知模块共享组件
│   │       ├── constants/
│   │       │   └── notification.constants.ts
│   │       ├── types/
│   │       │   └── notification.types.ts
│   │       └── utils/
│   │           └── notification.utils.ts
│   └── index.ts                # 导出文件
├── package.json
└── tsconfig.json
```

**使用示例**:

```typescript
// 在业务模块中引用共享组件
import {
  UserId,
  TenantId,
  Email,
  UserConstants,
  UserTypes,
  UserUtils,
} from '@aiofix/shared';

// 使用共享的常量
const MAX_USERS_PER_TENANT = UserConstants.MAX_USERS_PER_TENANT;

// 使用共享的类型
const userProfile: UserTypes.UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: new Email('john@example.com'),
};

// 使用共享的工具函数
const isValidUser = UserUtils.validateUser(userProfile);
```

**共享组件管理策略**:

1. **集中管理**: 所有共享组件统一放在 `packages/shared` 中
2. **模块化组织**: 按业务模块组织共享组件，便于维护
3. **统一导出**: 通过 `index.ts` 统一导出，简化引用
4. **版本控制**: 共享组件的变更需要谨慎，避免破坏性更新
5. **依赖管理**: 业务模块通过 `@aiofix/shared` 引用共享组件

**优势**:

- ✅ **避免重复**: 相同的常量、类型、工具函数只定义一次
- ✅ **统一管理**: 所有共享组件集中管理，便于维护
- ✅ **提高复用**: 其他模块可以直接引用共享组件
- ✅ **保持一致性**: 确保所有模块使用相同的共享组件
- ✅ **便于测试**: 共享组件可以独立测试

#### 核心包 (packages/core)

```
packages/core/
├── src/
│   ├── domain/                 # 核心领域模型
│   │   ├── base/               # 基础类
│   │   │   ├── aggregate-root.base.ts
│   │   │   ├── entity.base.ts
│   │   │   ├── value-object.base.ts
│   │   │   └── domain-event.base.ts
│   │   ├── services/           # 核心领域服务
│   │   │   ├── domain-service.base.ts
│   │   │   └── event-bus.interface.ts
│   │   └── exceptions/         # 领域异常
│   │       ├── domain-exception.base.ts
│   │       └── validation-exception.ts
│   ├── application/            # 核心应用服务
│   │   ├── use-cases/          # 基础用例类
│   │   │   ├── use-case.base.ts
│   │   │   └── command-handler.base.ts
│   │   └── interfaces/         # 应用接口
│   │       ├── unit-of-work.interface.ts
│   │       └── event-store.interface.ts
│   └── infrastructure/         # 核心基础设施
│       ├── database/           # 数据库基础
│       │   ├── database-adapter.interface.ts
│       │   └── transaction.interface.ts
│       └── events/             # 事件基础设施
│           ├── event-bus.base.ts
│           └── event-store.base.ts
├── package.json
└── tsconfig.json
```

## 业务模块结构

### 1. 用户模块 (packages/user)

```
packages/user/
├── src/
│   ├── domain/                 # Entities Layer
│   │   ├── aggregates/         # 聚合根
│   │   │   └── user.aggregate.ts
│   │   ├── entities/           # 领域实体
│   │   │   └── user.entity.ts
│   │   ├── value-objects/      # 值对象
│   │   │   ├── password.vo.ts
│   │   │   ├── user-profile.vo.ts
│   │   │   ├── user-preferences.vo.ts
│   │   │   └── user-status.vo.ts
│   │   ├── events/             # 领域事件
│   │   │   ├── user-created.event.ts
│   │   │   ├── user-profile-updated.event.ts
│   │   │   ├── user-status-changed.event.ts
│   │   │   ├── user-password-updated.event.ts
│   │   │   └── user-preferences-updated.event.ts
│   │   ├── services/           # 领域服务
│   │   │   └── user-domain.service.ts
│   │   └── repositories/       # 仓储接口
│   │       └── user-repository.interface.ts
│   ├── application/            # Use Cases Layer
│   │   ├── use-cases/          # 用例实现
│   │   │   ├── create-user.use-case.ts
│   │   │   ├── update-user.use-case.ts
│   │   │   ├── delete-user.use-case.ts
│   │   │   ├── get-user.use-case.ts
│   │   │   └── get-users.use-case.ts
│   │   ├── commands/           # 命令定义和处理器
│   │   │   ├── create-user.command.ts
│   │   │   ├── update-user.command.ts
│   │   │   ├── delete-user.command.ts
│   │   │   └── handlers/       # 命令处理器
│   │   │       ├── create-user.handler.ts
│   │   │       ├── update-user.handler.ts
│   │   │       └── delete-user.handler.ts
│   │   ├── queries/            # 查询定义和处理器
│   │   │   ├── get-user.query.ts
│   │   │   ├── get-users.query.ts
│   │   │   └── handlers/       # 查询处理器
│   │   │       ├── get-user.handler.ts
│   │   │       └── get-users.handler.ts
│   │   ├── services/           # 应用服务
│   │   │   └── user-application.service.ts
│   │   └── dto/                # 数据传输对象
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       └── user-response.dto.ts
│   ├── infrastructure/         # Interface Adapters Layer
│   │   ├── adapters/           # 数据适配器
│   │   │   ├── mappers/        # 对象映射器
│   │   │   │   ├── user-aggregate-mapper.ts
│   │   │   │   └── user-dto-mapper.ts
│   │   │   └── user.postgresql.entity.ts
│   │   ├── cache/              # 缓存实现
│   │   │   ├── cache.service.interface.ts
│   │   │   ├── redis-cache.service.ts
│   │   │   └── cache.module.ts
│   │   ├── event-storage/      # 事件存储实现
│   │   │   ├── event-storage.interface.ts
│   │   │   ├── mongodb-event-storage.service.ts
│   │   │   └── event-storage.module.ts
│   │   ├── external-adapters/  # 外部服务适配器
│   │   │   ├── email.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── audit.service.ts
│   │   ├── repositories/       # 仓储实现
│   │   │   └── user.repository.ts
│   │   ├── guards/             # 守卫 (跨协议复用)
│   │   │   ├── auth.guard.ts
│   │   │   ├── permission.guard.ts
│   │   │   └── tenant.guard.ts
│   │   ├── interceptors/       # 拦截器 (跨协议复用)
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── cache.interceptor.ts
│   │   │   └── performance.interceptor.ts
│   │   └── decorators/         # 装饰器 (跨协议复用)
│   │       ├── permissions.decorator.ts
│   │       ├── tenant.decorator.ts
│   │       ├── cache.decorator.ts
│   │       ├── audit.decorator.ts
│   │       └── performance.decorator.ts
│   ├── interfaces/             # Frameworks & Drivers Layer
│   │   ├── controllers/        # REST控制器
│   │   │   └── user.controller.ts
│   │   ├── dtos/              # 数据传输对象
│   │   │   ├── create-user.dto.ts
│   │   │   ├── update-user.dto.ts
│   │   │   └── user-response.dto.ts
│   │   ├── graphql/           # GraphQL接口 (可选)
│   │   │   ├── resolvers/     # 解析器
│   │   │   │   └── user.resolver.ts
│   │   │   └── schemas/       # 模式定义
│   │   │       └── user.schema.ts
│   │   └── grpc/               # gRPC接口
│   │       ├── services/       # 服务定义
│   │       │   └── user.service.ts
│   │       └── proto/          # Proto文件
│   │           └── user.proto
│   ├── infrastructure/         # Frameworks & Drivers Layer
│   │   ├── persistence/        # 持久化实现
│   │   │   ├── repositories/   # 仓储实现
│   │   │   │   ├── postgresql/ # PostgreSQL仓储
│   │   │   │   │   ├── user.repository.ts
│   │   │   │   │   ├── user-read.repository.ts
│   │   │   │   │   └── user-write.repository.ts
│   │   │   │   └── mongodb/    # MongoDB仓储
│   │   │   │       ├── user.repository.ts
│   │   │   │       ├── user-read.repository.ts
│   │   │   │       └── user-write.repository.ts
│   │   │   ├── entities/       # 数据库实体
│   │   │   │   ├── postgresql/ # PostgreSQL实体
│   │   │   │   │   ├── user.entity.ts
│   │   │   │   │   ├── user-read.entity.ts
│   │   │   │   │   └── user-write.entity.ts
│   │   │   │   └── mongodb/    # MongoDB文档
│   │   │   │       ├── user.document.ts
│   │   │   │       ├── user-read.document.ts
│   │   │   │       └── user-write.document.ts
│   │   │   ├── mappers/        # 数据映射器
│   │   │   │   ├── postgresql/ # PostgreSQL映射器
│   │   │   │   │   └── user.mapper.ts
│   │   │   │   └── mongodb/    # MongoDB映射器
│   │   │   │       └── user.mapper.ts
│   │   │   └── adapters/       # 数据库适配器
│   │   │       ├── postgresql/ # PostgreSQL适配器
│   │   │       │   └── user-postgresql.adapter.ts
│   │   │       └── mongodb/    # MongoDB适配器
│   │   │           └── user-mongodb.adapter.ts
│   │   ├── events/             # 事件处理器和投射器
│   │   │   ├── handlers/       # 事件处理器
│   │   │   │   ├── user-created-event-handler.ts
│   │   │   │   ├── user-profile-updated-event-handler.ts
│   │   │   │   ├── user-status-changed-event-handler.ts
│   │   │   │   ├── user-password-updated-event-handler.ts
│   │   │   │   └── user-preferences-updated-event-handler.ts
│   │   │   └── projectors/     # 事件投射器
│   │   │       ├── postgresql/ # PostgreSQL读模型投射器
│   │   │       │   ├── user-read-model-projector.ts
│   │   │       │   └── user-statistics-projector.ts
│   │   │       └── mongodb/    # MongoDB读模型投射器
│   │   │           ├── user-document-projector.ts
│   │   │           └── user-analytics-projector.ts
│   │   ├── external/           # 外部服务适配器
│   │   │   ├── email-service.adapter.ts
│   │   │   └── notification-service.adapter.ts
│   │   └── cache/              # 缓存实现
│   │       └── user-cache.service.ts
│   └── index.ts                # 模块导出
│   └── user.module.ts          # 模块定义
├── package.json
└── tsconfig.json
```

### 2. 租户模块 (packages/tenant)

```
packages/tenant/
├── src/
│   ├── domain/                 # Entities Layer
│   │   ├── aggregates/         # 聚合根
│   │   │   └── tenant.aggregate.ts
│   │   ├── entities/           # 领域实体
│   │   │   └── tenant.entity.ts
│   │   ├── value-objects/      # 值对象
│   │   │   ├── tenant-name.vo.ts
│   │   │   ├── tenant-settings.vo.ts
│   │   │   ├── tenant-quota.vo.ts
│   │   │   └── tenant-configuration.vo.ts
│   │   ├── events/             # 领域事件
│   │   │   ├── tenant-created.event.ts
│   │   │   ├── tenant-updated.event.ts
│   │   │   ├── tenant-deleted.event.ts
│   │   │   └── tenant-quota-exceeded.event.ts
│   │   ├── services/           # 领域服务
│   │   │   └── tenant-domain.service.ts
│   │   └── repositories/       # 仓储接口
│   │       └── tenant-repository.interface.ts
│   ├── application/            # Use Cases Layer
│   │   ├── use-cases/          # 用例实现
│   │   │   ├── create-tenant.use-case.ts
│   │   │   ├── update-tenant.use-case.ts
│   │   │   ├── delete-tenant.use-case.ts
│   │   │   ├── get-tenant.use-case.ts
│   │   │   └── get-tenants.use-case.ts
│   │   ├── commands/           # 命令定义和处理器
│   │   │   ├── create-tenant.command.ts
│   │   │   ├── update-tenant.command.ts
│   │   │   ├── delete-tenant.command.ts
│   │   │   └── handlers/       # 命令处理器
│   │   │       ├── create-tenant.handler.ts
│   │   │       ├── update-tenant.handler.ts
│   │   │       └── delete-tenant.handler.ts
│   │   ├── queries/            # 查询定义和处理器
│   │   │   ├── get-tenant.query.ts
│   │   │   ├── get-tenants.query.ts
│   │   │   └── handlers/       # 查询处理器
│   │   │       ├── get-tenant.handler.ts
│   │   │       └── get-tenants.handler.ts
│   │   ├── services/           # 应用服务
│   │   │   └── tenant-application.service.ts
│   │   └── dto/                # 数据传输对象
│   │       ├── create-tenant.dto.ts
│   │       ├── update-tenant.dto.ts
│   │       └── tenant-response.dto.ts
│   ├── interfaces/             # Interface Adapters Layer
│   │   ├── rest/               # RESTful API接口
│   │   │   ├── controllers/    # REST控制器
│   │   │   │   └── tenant.controller.ts
│   │   │   ├── guards/         # 守卫
│   │   │   │   └── tenant-permission.guard.ts
│   │   │   ├── interceptors/   # 拦截器
│   │   │   │   └── tenant-audit.interceptor.ts
│   │   │   └── decorators/     # 装饰器
│   │   │       └── tenant-permissions.decorator.ts
│   │   ├── graphql/            # GraphQL接口
│   │   │   ├── resolvers/      # 解析器
│   │   │   │   └── tenant.resolver.ts
│   │   │   └── schemas/        # 模式定义
│   │   │       └── tenant.schema.ts
│   │   └── grpc/               # gRPC接口
│   │       ├── services/       # 服务定义
│   │       │   └── tenant.service.ts
│   │       └── proto/          # Proto文件
│   │           └── tenant.proto
│   ├── infrastructure/         # Frameworks & Drivers Layer
│   │   ├── persistence/        # 持久化实现
│   │   │   ├── repositories/   # 仓储实现
│   │   │   │   ├── postgresql/ # PostgreSQL仓储
│   │   │   │   │   ├── tenant.repository.ts
│   │   │   │   │   ├── tenant-read.repository.ts
│   │   │   │   │   └── tenant-write.repository.ts
│   │   │   │   └── mongodb/    # MongoDB仓储
│   │   │   │       ├── tenant.repository.ts
│   │   │   │       ├── tenant-read.repository.ts
│   │   │   │       └── tenant-write.repository.ts
│   │   │   ├── entities/       # 数据库实体
│   │   │   │   ├── postgresql/ # PostgreSQL实体
│   │   │   │   │   ├── tenant.entity.ts
│   │   │   │   │   ├── tenant-read.entity.ts
│   │   │   │   │   └── tenant-write.entity.ts
│   │   │   │   └── mongodb/    # MongoDB文档
│   │   │   │       ├── tenant.document.ts
│   │   │   │       ├── tenant-read.document.ts
│   │   │   │       └── tenant-write.document.ts
│   │   │   ├── mappers/        # 数据映射器
│   │   │   │   ├── postgresql/ # PostgreSQL映射器
│   │   │   │   │   └── tenant.mapper.ts
│   │   │   │   └── mongodb/    # MongoDB映射器
│   │   │   │       └── tenant.mapper.ts
│   │   │   └── adapters/       # 数据库适配器
│   │   │       ├── postgresql/ # PostgreSQL适配器
│   │   │       │   └── tenant-postgresql.adapter.ts
│   │   │       └── mongodb/    # MongoDB适配器
│   │   │           └── tenant-mongodb.adapter.ts
│   │   ├── events/             # 事件处理器和投射器
│   │   │   ├── handlers/       # 事件处理器
│   │   │   │   ├── tenant-created-event-handler.ts
│   │   │   │   ├── tenant-updated-event-handler.ts
│   │   │   │   ├── tenant-deleted-event-handler.ts
│   │   │   │   └── tenant-quota-exceeded-event-handler.ts
│   │   │   └── projectors/     # 事件投射器
│   │   │       ├── tenant-event-projector.ts
│   │   │       ├── tenant-read-model-projector.ts
│   │   │       └── tenant-statistics-projector.ts
│   │   ├── external/           # 外部服务适配器
│   │   │   └── tenant-provisioning.adapter.ts
│   │   └── cache/              # 缓存实现
│   │       └── tenant-cache.service.ts
│   └── tenant.module.ts        # 模块定义
├── package.json
└── tsconfig.json
```

## 基础设施模块结构

### 1. 基础设施包 (packages/infrastructure)

```
packages/infrastructure/
├── src/
│   ├── database/               # 数据库基础设施
│   │   ├── adapters/           # 数据库适配器
│   │   │   ├── postgresql/     # PostgreSQL适配器
│   │   │   │   ├── postgresql.adapter.ts
│   │   │   │   ├── postgresql-connection.factory.ts
│   │   │   │   └── postgresql-transaction.manager.ts
│   │   │   ├── mongodb/        # MongoDB适配器
│   │   │   │   ├── mongodb.adapter.ts
│   │   │   │   ├── mongodb-connection.factory.ts
│   │   │   │   └── mongodb-transaction.manager.ts
│   │   │   └── database-adapter.factory.ts
│   │   ├── migrations/         # 数据库迁移
│   │   │   ├── postgresql/     # PostgreSQL迁移
│   │   │   │   ├── user-migration.ts
│   │   │   │   ├── tenant-migration.ts
│   │   │   │   └── organization-migration.ts
│   │   │   └── mongodb/        # MongoDB迁移
│   │   │       ├── user-schema-migration.ts
│   │   │       ├── tenant-schema-migration.ts
│   │   │       └── organization-schema-migration.ts
│   │   ├── repositories/       # 基础仓储实现
│   │   │   ├── base-repository.ts
│   │   │   └── tenant-aware-repository.ts
│   │   └── config/             # 数据库配置
│   │       ├── postgresql.config.ts
│   │       └── mongodb.config.ts
│   ├── cache/                  # 缓存基础设施
│   │   ├── redis/              # Redis实现
│   │   │   ├── redis-cache.service.ts
│   │   │   └── redis-config.ts
│   │   ├── memory/             # 内存缓存实现
│   │   │   └── memory-cache.service.ts
│   │   └── cache.factory.ts    # 缓存工厂
│   ├── events/                 # 事件基础设施
│   │   ├── bus/                # 事件总线
│   │   │   ├── redis-event-bus.ts
│   │   │   ├── rabbitmq-event-bus.ts
│   │   │   └── event-bus.factory.ts
│   │   ├── store/              # 事件存储
│   │   │   ├── mongodb-event-store.ts
│   │   │   └── postgresql-event-store.ts
│   │   └── handlers/           # 事件处理器基类
│   │       └── base-event-handler.ts
│   ├── messaging/              # 消息队列基础设施
│   │   ├── bull/               # Bull队列
│   │   │   ├── bull-queue.service.ts
│   │   │   └── bull-config.ts
│   │   ├── rabbitmq/           # RabbitMQ
│   │   │   ├── rabbitmq-queue.service.ts
│   │   │   └── rabbitmq-config.ts
│   │   └── queue.factory.ts    # 队列工厂
│   ├── external/               # 外部服务基础设施
│   │   ├── email/              # 邮件服务
│   │   │   ├── smtp-email.service.ts
│   │   │   ├── sendgrid-email.service.ts
│   │   │   └── mailgun-email.service.ts
│   │   ├── sms/                # 短信服务
│   │   │   ├── twilio-sms.service.ts
│   │   │   └── aliyun-sms.service.ts
│   │   └── push/               # 推送服务
│   │       ├── firebase-push.service.ts
│   │       └── apns-push.service.ts
│   ├── monitoring/             # 监控基础设施
│   │   ├── logging/            # 日志服务
│   │   │   ├── pino-logger.service.ts
│   │   │   └── winston-logger.service.ts
│   │   ├── metrics/            # 指标收集
│   │   │   ├── prometheus-metrics.service.ts
│   │   │   └── statsd-metrics.service.ts
│   │   └── tracing/            # 链路追踪
│   │       ├── jaeger-tracing.service.ts
│   │       └── zipkin-tracing.service.ts
│   └── security/               # 安全基础设施
│       ├── auth/               # 认证服务
│       │   ├── jwt-auth.service.ts
│       │   └── oauth-auth.service.ts
│       ├── encryption/         # 加密服务
│       │   ├── bcrypt-encryption.service.ts
│       │   └── aes-encryption.service.ts
│       └── validation/         # 验证服务
│           ├── joi-validation.service.ts
│           └── class-validator.service.ts
├── package.json
└── tsconfig.json
```

## 应用结构

### 1. API应用 (apps/api)

```
apps/api/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 应用模块
│   ├── config/                 # 配置
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   └── environment.config.ts
│   ├── modules/                # 应用模块
│   │   ├── health/             # 健康检查模块
│   │   │   ├── health.controller.ts
│   │   │   └── health.module.ts
│   │   ├── auth/               # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── auth.module.ts
│   │   └── api/                # API模块
│   │       ├── api.controller.ts
│   │       ├── api.service.ts
│   │       └── api.module.ts
│   ├── middleware/             # 中间件
│   │   ├── cors.middleware.ts
│   │   ├── helmet.middleware.ts
│   │   └── rate-limit.middleware.ts
│   ├── filters/                # 异常过滤器
│   │   ├── http-exception.filter.ts
│   │   └── validation-exception.filter.ts
│   ├── interceptors/           # 拦截器
│   │   ├── logging.interceptor.ts
│   │   └── transform.interceptor.ts
│   └── guards/                 # 守卫
│       ├── auth.guard.ts
│       └── roles.guard.ts
├── package.json
└── tsconfig.json
```

### 2. 后台工作应用 (apps/worker)

```
apps/worker/
├── src/
│   ├── main.ts                 # 应用入口
│   ├── app.module.ts           # 应用模块
│   ├── config/                 # 配置
│   │   ├── worker.config.ts
│   │   ├── queue.config.ts
│   │   └── environment.config.ts
│   ├── processors/             # 队列处理器
│   │   ├── email/              # 邮件处理器
│   │   │   ├── welcome-email.processor.ts
│   │   │   ├── notification-email.processor.ts
│   │   │   └── email.module.ts
│   │   ├── sms/                # 短信处理器
│   │   │   ├── notification-sms.processor.ts
│   │   │   └── sms.module.ts
│   │   └── push/               # 推送处理器
│   │       ├── notification-push.processor.ts
│   │       └── push.module.ts
│   ├── schedulers/             # 定时任务
│   │   ├── cleanup.scheduler.ts
│   │   ├── backup.scheduler.ts
│   │   └── report.scheduler.ts
│   └── services/               # 服务
│       ├── queue.service.ts
│       └── scheduler.service.ts
├── package.json
└── tsconfig.json
```

## 模块依赖关系

### 1. 依赖层次

```
┌─────────────────────────────────────────────────────────────┐
│                    Applications Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │     API     │  │   Worker    │  │    Admin    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                 Business Modules Layer                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  User   │  │ Tenant  │  │   Org   │  │   Dept  │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │Database │  │  Cache  │  │ Events  │  │External │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Core & Shared Layer                       │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │  Core   │  │ Shared  │  │Common   │  │Types    │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2. 依赖规则

- **Applications Layer** 依赖 **Business Modules Layer**
- **Business Modules Layer** 依赖 **Infrastructure Layer**
- **Infrastructure Layer** 依赖 **Core & Shared Layer**
- **Core & Shared Layer** 不依赖任何其他层
- **Business Modules** 之间不直接依赖，通过事件通信

## 配置管理

### 1. 包配置 (package.json)

```json
{
  "name": "@aiofix/user",
  "version": "1.0.0",
  "description": "用户模块",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "dependencies": {
    "@aiofix/shared": "workspace:*",
    "@aiofix/core": "workspace:*",
    "uuid": "^11.1.0"
  },
  "devDependencies": {
    "@types/uuid": "^10.0.0",
    "typescript": "^5.0.0"
  },
  "peerDependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0"
  }
}
```

### 2. TypeScript配置 (tsconfig.json)

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "noEmit": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

## 关键组件说明

### 1. 数据库实体/文档 (Database Entities/Documents)

**位置**: `infrastructure/adapters/`

**职责**:

- 定义数据库表结构
- 映射ORM实体关系
- 处理数据库约束和索引
- 支持CQRS的读写模型分离
- 支持PostgreSQL和MongoDB双数据库
- 遵循MikroORM命名规范

#### PostgreSQL实体示例

```typescript
// adapters/user.postgresql.entity.ts - PostgreSQL写实体
@Entity({ tableName: 'users' })
export class UserPostgreSQLEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Property({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Property({ type: 'varchar', length: 100 })
  firstName!: string;

  @Property({ type: 'varchar', length: 100 })
  lastName!: string;

  @Property({ type: 'varchar', length: 50 })
  tenantId!: string;

  @Property({ type: 'int', default: 0 })
  version!: number;

  @Property({ type: 'timestamp', defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Property({
    type: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  // PostgreSQL特定索引
  @Index({ name: 'idx_users_tenant_email', properties: ['tenantId', 'email'] })
  @Index({ name: 'idx_users_status', properties: ['status'] })
  static indexes: Index[] = [];
}

// entities/postgresql/user-read.entity.ts - PostgreSQL读实体
@Entity({ tableName: 'user_read_models' })
export class UserReadPostgreSQLEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 255 })
  email!: string;

  @Property({ type: 'varchar', length: 100 })
  firstName!: string;

  @Property({ type: 'varchar', length: 100 })
  lastName!: string;

  @Property({ type: 'varchar', length: 50 })
  status!: string;

  @Property({ type: 'varchar', length: 50 })
  tenantId!: string;

  @Property({ type: 'varchar', length: 50 })
  organizationId!: string;

  @Property({ type: 'varchar', length: 50 })
  departmentId!: string;

  @Property({ type: 'timestamp', defaultRaw: 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Property({
    type: 'timestamp',
    defaultRaw: 'CURRENT_TIMESTAMP',
    onUpdate: () => new Date(),
  })
  updatedAt!: Date;

  // 读模型特定索引
  @Index({
    name: 'idx_user_read_tenant_status',
    properties: ['tenantId', 'status'],
  })
  @Index({ name: 'idx_user_read_organization', properties: ['organizationId'] })
  static indexes: Index[] = [];
}
```

#### MongoDB文档示例

```typescript
// entities/mongodb/user.document.ts - MongoDB写文档
@Entity({ collection: 'users' })
export class UserMongoDBDocument {
  @PrimaryKey({ type: 'string' })
  _id!: string;

  @Property({ type: 'string', unique: true })
  email!: string;

  @Property({ type: 'string' })
  passwordHash!: string;

  @Property({ type: 'string' })
  firstName!: string;

  @Property({ type: 'string' })
  lastName!: string;

  @Property({ type: 'string' })
  tenantId!: string;

  @Property({ type: 'number', default: 0 })
  version!: number;

  @Property({ type: 'Date', default: Date.now })
  createdAt!: Date;

  @Property({ type: 'Date', default: Date.now })
  updatedAt!: Date;
}

// entities/mongodb/user-read.document.ts - MongoDB读文档
@Entity({ collection: 'user_read_models' })
export class UserReadMongoDBDocument {
  @PrimaryKey({ type: 'string' })
  _id!: string;

  @Property({ type: 'string' })
  email!: string;

  @Property({ type: 'string' })
  firstName!: string;

  @Property({ type: 'string' })
  lastName!: string;

  @Property({ type: 'string' })
  status!: string;

  @Property({ type: 'string' })
  tenantId!: string;

  @Property({ type: 'string' })
  organizationId!: string;

  @Property({ type: 'string' })
  departmentId!: string;

  @Property({ type: 'Date', default: Date.now })
  createdAt!: Date;

  @Property({ type: 'Date', default: Date.now })
  updatedAt!: Date;
}
```

### 2. 事件投射器 (Event Projectors)

**位置**: `application/events/` (事件处理器)

**职责**:

- 将领域事件投影到读模型
- 维护读模型的一致性
- 支持投影的重建和修复
- 处理投影的异常和恢复
- 根据读模型存储位置选择不同的投射器

#### PostgreSQL读模型投射器示例

```typescript
// application/events/user-created-event-handler.ts
@Injectable()
export class UserReadModelProjector implements IEventProjection {
  constructor(
    @InjectEntityManager('postgresql')
    private readonly em: EntityManager,
    private readonly userReadRepository: IUserReadRepository,
  ) {}

  async handle(event: IDomainEvent): Promise<void> {
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
    }
  }

  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    // 更新PostgreSQL读模型
    const readModel = new UserReadPostgreSQLEntity();
    readModel.id = event.aggregateId;
    readModel.email = event.email;
    readModel.firstName = event.profile.firstName;
    readModel.lastName = event.profile.lastName;
    readModel.status = 'ACTIVE';
    readModel.tenantId = event.tenantId;
    readModel.createdAt = event.occurredOn;

    await this.em.persistAndFlush(readModel);
  }

  private async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    // 更新PostgreSQL读模型
    await this.em.nativeUpdate(
      UserReadPostgreSQLEntity,
      { id: event.aggregateId },
      {
        firstName: event.profile.firstName,
        lastName: event.profile.lastName,
        updatedAt: event.occurredOn,
      },
    );
  }
}
```

#### MongoDB读模型投射器示例

```typescript
// projectors/mongodb/user-document-projector.ts
@Injectable()
export class UserDocumentProjector implements IEventProjection {
  constructor(
    @InjectEntityManager('mongodb')
    private readonly em: EntityManager,
  ) {}

  async handle(event: IDomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'UserCreated':
        await this.handleUserCreated(event as UserCreatedEvent);
        break;
      case 'UserPreferencesUpdated':
        await this.handleUserPreferencesUpdated(
          event as UserPreferencesUpdatedEvent,
        );
        break;
    }
  }

  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    // 更新MongoDB文档
    const document = new UserReadMongoDBDocument();
    document._id = event.aggregateId;
    document.email = event.email;
    document.firstName = event.profile.firstName;
    document.lastName = event.profile.lastName;
    document.status = 'ACTIVE';
    document.tenantId = event.tenantId;
    document.createdAt = event.occurredOn;

    await this.em.persistAndFlush(document);
  }

  private async handleUserPreferencesUpdated(
    event: UserPreferencesUpdatedEvent,
  ): Promise<void> {
    // MongoDB特定 - 使用文档更新操作
    await this.em.nativeUpdate(
      UserReadMongoDBDocument,
      { _id: event.aggregateId },
      {
        $set: {
          'preferences.language': event.preferences.language,
          'preferences.timezone': event.preferences.timezone,
          updatedAt: event.occurredOn,
        },
      },
    );
  }
}
```

#### 统计信息投射器示例

```typescript
// projectors/postgresql/user-statistics-projector.ts
@Injectable()
export class UserStatisticsProjector implements IEventProjection {
  constructor(
    @InjectEntityManager('postgresql')
    private readonly em: EntityManager,
  ) {}

  async handle(event: IDomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'UserCreated':
        await this.incrementUserCount(event as UserCreatedEvent);
        break;
      case 'UserDeleted':
        await this.decrementUserCount(event as UserDeletedEvent);
        break;
    }
  }

  private async incrementUserCount(event: UserCreatedEvent): Promise<void> {
    // 使用PostgreSQL的原子更新操作
    await this.em.nativeUpdate(
      TenantStatisticsEntity,
      { tenantId: event.tenantId },
      {
        $inc: { userCount: 1 },
        lastUpdated: event.occurredOn,
      },
    );
  }
}
```

### 3. 数据库适配器 (Database Adapters)

**位置**: `infrastructure/repositories/`

**职责**:

- 提供统一的数据库访问接口
- 支持PostgreSQL和MongoDB双数据库
- 处理数据库特定的操作和优化
- 实现多租户数据隔离策略

#### PostgreSQL仓储示例

```typescript
// infrastructure/repositories/user.repository.ts
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectEntityManager('postgresql')
    private readonly em: EntityManager,
    private readonly mapper: UserPostgreSQLMapper,
  ) {}

  async save(aggregate: UserAggregate): Promise<void> {
    const entity = this.mapper.toEntity(aggregate);
    await this.em.persistAndFlush(entity);
  }

  async findById(id: UserId): Promise<UserAggregate | null> {
    const entity = await this.em.findOne(UserPostgreSQLEntity, {
      id: id.value,
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  async findByEmail(
    email: Email,
    tenantId: TenantId,
  ): Promise<UserAggregate | null> {
    const entity = await this.em.findOne(UserPostgreSQLEntity, {
      email: email.value,
      tenantId: tenantId.value,
    });
    return entity ? this.mapper.toDomain(entity) : null;
  }

  // PostgreSQL特定查询优化 - 使用SQL查询构建器
  async findActiveUsersByTenant(tenantId: TenantId): Promise<UserAggregate[]> {
    const entities = await this.em.find(
      UserPostgreSQLEntity,
      {
        tenantId: tenantId.value,
        status: 'ACTIVE',
      },
      {
        orderBy: { createdAt: 'DESC' },
      },
    );

    return entities.map(entity => this.mapper.toDomain(entity));
  }

  // PostgreSQL特定 - 复杂关系查询
  async findUsersWithOrganizations(
    tenantId: TenantId,
  ): Promise<UserAggregate[]> {
    const entities = await this.em.find(
      UserPostgreSQLEntity,
      { tenantId: tenantId.value },
      {
        populate: ['organization', 'department'],
        orderBy: { createdAt: 'DESC' },
      },
    );

    return entities.map(entity => this.mapper.toDomain(entity));
  }
}
```

#### MongoDB仓储示例

```typescript
// repositories/mongodb/user.repository.ts
@Injectable()
export class UserMongoDBRepository implements IUserRepository {
  constructor(
    @InjectEntityManager('mongodb')
    private readonly em: EntityManager,
    private readonly mapper: UserMongoDBMapper,
  ) {}

  async save(aggregate: UserAggregate): Promise<void> {
    const document = this.mapper.toDocument(aggregate);
    await this.em.persistAndFlush(document);
  }

  async findById(id: UserId): Promise<UserAggregate | null> {
    const document = await this.em.findOne(UserMongoDBDocument, {
      _id: id.value,
    });
    return document ? this.mapper.toDomain(document) : null;
  }

  async findByEmail(
    email: Email,
    tenantId: TenantId,
  ): Promise<UserAggregate | null> {
    const document = await this.em.findOne(UserMongoDBDocument, {
      email: email.value,
      tenantId: tenantId.value,
    });
    return document ? this.mapper.toDomain(document) : null;
  }

  // MongoDB特定聚合查询
  async findActiveUsersByTenant(tenantId: TenantId): Promise<UserAggregate[]> {
    const documents = await this.em.aggregate(UserMongoDBDocument, [
      {
        $match: {
          tenantId: tenantId.value,
          status: 'ACTIVE',
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return documents.map(document => this.mapper.toDomain(document));
  }

  // MongoDB特定 - 文档查询优化
  async findUsersByPreferences(preferences: any): Promise<UserAggregate[]> {
    const documents = await this.em.find(UserMongoDBDocument, {
      'preferences.language': preferences.language,
      'preferences.timezone': preferences.timezone,
    });

    return documents.map(document => this.mapper.toDomain(document));
  }
}
```

### 4. 数据映射器 (Mappers)

**位置**: `infrastructure/adapters/mappers/`

**职责**:

- 领域对象与数据库模型之间的转换
- 处理复杂的数据映射逻辑
- 支持版本控制和数据迁移
- 确保数据完整性
- 支持PostgreSQL和MongoDB双数据库

#### PostgreSQL映射器示例

```typescript
// mappers/postgresql/user.mapper.ts
@Injectable()
export class UserPostgreSQLMapper {
  toDomain(entity: UserPostgreSQLEntity): UserAggregate {
    return UserAggregate.fromPersistence(
      new UserId(entity.id),
      new Email(entity.email),
      new Password(entity.passwordHash),
      new UserProfile(entity.firstName, entity.lastName),
      new UserPreferences(entity.language, entity.timezone),
      UserStatus.fromString(entity.status),
      entity.version,
      entity.createdAt,
      entity.updatedAt,
    );
  }

  toEntity(aggregate: UserAggregate): UserPostgreSQLEntity {
    const entity = new UserPostgreSQLEntity();
    entity.id = aggregate.getAggregateId().value;
    entity.email = aggregate.getEmail().value;
    entity.passwordHash = aggregate.getPassword().value;
    entity.firstName = aggregate.getProfile().firstName;
    entity.lastName = aggregate.getProfile().lastName;
    entity.language = aggregate.getPreferences().language;
    entity.timezone = aggregate.getPreferences().timezone;
    entity.status = aggregate.getStatus().value;
    entity.version = aggregate.getVersion();
    entity.createdAt = aggregate.getCreatedAt();
    entity.updatedAt = aggregate.getUpdatedAt();
    return entity;
  }
}
```

#### MongoDB映射器示例

```typescript
// mappers/mongodb/user.mapper.ts
@Injectable()
export class UserMongoDBMapper {
  toDomain(document: UserMongoDBDocument): UserAggregate {
    return UserAggregate.fromPersistence(
      new UserId(document._id),
      new Email(document.email),
      new Password(document.passwordHash),
      new UserProfile(document.firstName, document.lastName),
      new UserPreferences(document.language, document.timezone),
      UserStatus.fromString(document.status),
      document.version,
      document.createdAt,
      document.updatedAt,
    );
  }

  toDocument(aggregate: UserAggregate): UserMongoDBDocument {
    const document = new UserMongoDBDocument();
    document._id = aggregate.getAggregateId().value;
    document.email = aggregate.getEmail().value;
    document.passwordHash = aggregate.getPassword().value;
    document.firstName = aggregate.getProfile().firstName;
    document.lastName = aggregate.getProfile().lastName;
    document.language = aggregate.getPreferences().language;
    document.timezone = aggregate.getPreferences().timezone;
    document.status = aggregate.getStatus().value;
    document.version = aggregate.getVersion();
    document.createdAt = aggregate.getCreatedAt();
    document.updatedAt = aggregate.getUpdatedAt();
    return document;
  }
}
```

## 数据库选择策略

### 1. PostgreSQL使用场景

**适用场景**:

- 关系型数据存储（用户、租户、组织等核心业务数据）
- 需要ACID事务保证的数据操作
- 复杂的查询和报表需求
- 需要强一致性的业务场景

**技术特点**:

- 使用MikroORM进行ORM映射
- 支持复杂的关系查询
- 提供行级安全策略（RLS）支持多租户
- 支持JSON字段存储半结构化数据
- 统一的EntityManager接口

### 2. MongoDB使用场景

**适用场景**:

- 事件存储（领域事件、事件溯源）
- 文档型数据存储（用户偏好、配置信息）
- 需要灵活schema的数据
- 高并发写入场景

**技术特点**:

- 使用MikroORM进行ODM映射
- 支持灵活的文档结构
- 优秀的水平扩展能力
- 适合事件溯源和CQRS模式
- 统一的EntityManager接口

### 3. 双数据库架构优势

**数据隔离**:

- PostgreSQL：存储核心业务数据，保证数据一致性
- MongoDB：存储事件和文档数据，提供高性能读写

**性能优化**:

- 根据数据特性选择最适合的数据库
- 避免单一数据库的性能瓶颈
- 支持不同数据库的特定优化策略

**扩展性**:

- 可以独立扩展不同数据库
- 支持数据库特定的分片和复制策略
- 便于未来引入其他数据库类型

### 4. 数据库选择策略

**PostgreSQL用于**:

- 用户、租户、组织等核心业务实体
- 需要ACID事务保证的数据操作
- 复杂的关系查询和报表
- 需要强一致性的业务场景

**MongoDB用于**:

- 领域事件存储（事件溯源）
- 用户偏好、配置等文档数据
- 需要灵活schema的数据
- 高并发写入场景

**仓储选择策略**:

```typescript
// 根据业务需求选择不同的仓储实现
@Module({
  providers: [
    {
      provide: 'IUserRepository',
      useClass:
        process.env.USER_STORAGE_TYPE === 'mongodb'
          ? UserMongoDBRepository
          : UserPostgreSQLRepository,
    },
    {
      provide: 'IEventRepository',
      useClass: EventMongoDBRepository, // 事件总是存储在MongoDB
    },
  ],
})
export class UserModule {}
```

**事件投射器选择策略**:

```typescript
// 根据读模型存储位置选择不同的投射器
@Module({
  providers: [
    // PostgreSQL读模型投射器
    {
      provide: 'IUserReadModelProjector',
      useClass: UserReadModelProjector, // 投射到PostgreSQL
    },
    // MongoDB读模型投射器
    {
      provide: 'IUserDocumentProjector',
      useClass: UserDocumentProjector, // 投射到MongoDB
    },
    // 统计信息投射器
    {
      provide: 'IUserStatisticsProjector',
      useClass: UserStatisticsProjector, // 投射到PostgreSQL
    },
  ],
})
export class UserEventModule {}
```

**投射器注册策略**:

```typescript
// 事件总线配置 - 一个事件可以触发多个投射器
@Injectable()
export class UserEventBus {
  constructor(
    @Inject('IUserReadModelProjector')
    private readonly readModelProjector: IEventProjection,
    @Inject('IUserDocumentProjector')
    private readonly documentProjector: IEventProjection,
    @Inject('IUserStatisticsProjector')
    private readonly statisticsProjector: IEventProjection,
  ) {}

  async publish(event: IDomainEvent): Promise<void> {
    // 并行执行多个投射器
    await Promise.allSettled([
      this.readModelProjector.handle(event), // 更新PostgreSQL读模型
      this.documentProjector.handle(event), // 更新MongoDB文档
      this.statisticsProjector.handle(event), // 更新统计信息
    ]);
  }
}
```

### 5. MikroORM统一配置

**配置优势**:

- 统一的EntityManager接口操作不同数据库
- 一致的装饰器语法（@Entity, @Property, @PrimaryKey）
- 统一的查询API和事务管理
- 支持多数据库连接配置

**配置示例**:

```typescript
// MikroORM多数据库配置
export default [
  // PostgreSQL配置 - 核心业务数据
  {
    name: 'postgresql',
    entities: ['./src/infrastructure/adapters/*.postgresql.entity.ts'],
    dbName: 'aiofix_platform',
    type: 'postgresql',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432'),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'password',
    migrations: {
      path: './src/infrastructure/database/migrations/postgresql',
      pattern: /^[\w-]+\d+\.ts$/,
    },
    cache: {
      enabled: true,
      pretty: true,
      adapter: RedisAdapter,
      options: { host: 'localhost', port: 6379 },
    },
  },
  // MongoDB配置 - 事件存储和文档数据
  {
    name: 'mongodb',
    entities: ['./src/infrastructure/event-storage/*.document.ts'],
    dbName: 'aiofix_events',
    type: 'mongo',
    host: process.env.MONGO_HOST || 'localhost',
    port: parseInt(process.env.MONGO_PORT || '27017'),
    user: process.env.MONGO_USER,
    password: process.env.MONGO_PASSWORD,
    migrations: {
      path: './src/infrastructure/database/migrations/mongodb',
      pattern: /^[\w-]+\d+\.ts$/,
    },
    cache: {
      enabled: true,
      pretty: true,
      adapter: RedisAdapter,
      options: { host: 'localhost', port: 6379 },
    },
  },
];
```

**使用示例**:

```typescript
// 在仓储中注入特定数据库的EntityManager
@Injectable()
export class UserPostgreSQLRepository {
  constructor(
    @InjectEntityManager('postgresql')
    private readonly em: EntityManager,
  ) {}
}

@Injectable()
export class UserMongoDBRepository {
  constructor(
    @InjectEntityManager('mongodb')
    private readonly em: EntityManager,
  ) {}
}

// 在模块中注册不同的仓储
@Module({
  providers: [
    {
      provide: 'IUserRepository',
      useClass: UserPostgreSQLRepository, // 或 UserMongoDBRepository
    },
  ],
})
export class UserModule {}
```

## 最佳实践

### 1. 模块设计

- **单一职责**: 每个模块只负责一个业务领域
- **高内聚**: 模块内部组件紧密相关
- **低耦合**: 模块之间依赖最小化
- **可测试**: 模块易于单元测试和集成测试

### 2. 目录结构

- **分层清晰**: 严格按照Clean Architecture分层
- **命名一致**: 使用一致的命名规范
- **职责明确**: 每个目录职责明确
- **易于导航**: 目录结构易于理解和导航

### 3. 依赖管理

- **依赖倒置**: 依赖抽象而不是具体实现
- **接口隔离**: 使用小而专一的接口
- **循环依赖**: 避免循环依赖
- **版本管理**: 合理管理依赖版本

### 4. 代码组织

- **文件命名**: 使用描述性的文件名
- **导出管理**: 合理管理模块导出
- **导入顺序**: 保持一致的导入顺序
- **代码分割**: 合理分割代码文件

## 总结

模块结构设计是项目成功的关键因素之一。通过合理的模块划分、清晰的目录结构、正确的依赖管理和一致的命名规范，可以确保代码的可维护性、可扩展性和可测试性。本指南提供了完整的模块结构设计方法，为项目的长期发展奠定了坚实的基础。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
