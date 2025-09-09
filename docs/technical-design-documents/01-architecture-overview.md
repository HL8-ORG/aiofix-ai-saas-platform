# Aiofix AI SAAS平台 - 架构概述

## 文档信息

- **项目名称**: Aiofix AI SAAS平台
- **文档版本**: V3.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

Aiofix AI SAAS平台是一个基于Clean Architecture、Domain-Driven Design (DDD)、CQRS和Event Sourcing的现代化多租户SAAS平台。平台采用事件驱动架构，支持多租户数据隔离，提供完整的AI服务集成能力。

## 核心架构特性

### 1. Clean Architecture

平台严格遵循Robert C. Martin的Clean Architecture原则：

- **依赖倒置**: 依赖方向始终向内指向核心业务逻辑
- **分层清晰**: 明确的四层架构（Entities、Use Cases、Interface Adapters、Frameworks & Drivers）
- **业务逻辑隔离**: 核心业务逻辑不依赖任何外部框架
- **可测试性**: 每层都可以独立测试

### 2. Domain-Driven Design (DDD)

- **聚合根设计**: 每个业务概念都有对应的聚合根
- **值对象**: 不可变的值对象确保业务规则
- **领域事件**: 通过事件实现聚合间的松耦合通信
- **领域服务**: 跨聚合的业务逻辑封装

### 3. 事件驱动架构 (Event-Driven Architecture)

- **异步事件处理**: 通过消息队列实现异步事件处理
- **事件总线**: 统一的事件发布和订阅机制
- **事件溯源**: 所有状态变更都通过事件记录和重放
- **松耦合通信**: 聚合间通过事件进行松耦合通信
- **最终一致性**: 通过事件实现分布式系统的最终一致性
- **事件处理器**: 专门的事件处理器处理业务副作用

### 4. CQRS (Command Query Responsibility Segregation)

- **命令查询分离**: 读写操作使用不同的模型
- **命令处理器**: 处理业务命令，修改状态
- **查询处理器**: 处理查询请求，返回数据
- **事件发布**: 命令执行后发布领域事件
- **读模型更新**: 通过事件处理器更新读模型

### 5. Event Sourcing

- **事件存储**: 所有状态变更都通过事件记录
- **事件重放**: 支持从事件历史重建状态
- **时间旅行**: 可以查看任意时间点的状态
- **审计日志**: 完整的状态变更历史
- **快照机制**: 支持聚合快照优化性能

### 6. 多租户架构

- **数据隔离**: 支持数据库级、Schema级、表级三种隔离策略
- **配置驱动**: 通过环境变量动态切换隔离策略
- **租户感知**: 所有操作都自动应用租户隔离
- **资源配额**: 支持租户级别的资源限制

## 技术栈

### 后端技术

- **框架**: NestJS + Fastify
- **语言**: TypeScript
- **数据库**: PostgreSQL 16 + MongoDB
- **缓存**: Redis
- **消息队列**: BullMQ (基于Redis)
- **ORM**: MikroORM
- **日志**: Pino
- **测试**: Jest

### 前端技术

- **框架**: React 18 + TypeScript
- **状态管理**: Zustand
- **UI组件**: Ant Design
- **构建工具**: Vite
- **包管理**: pnpm

### 基础设施

- **容器化**: Docker + Docker Compose
- **数据库**: PostgreSQL 16 (支持pgvector扩展)
- **文档数据库**: MongoDB
- **缓存**: Redis
- **监控**: 待定
- **部署**: 待定

## 模块架构

### 核心模块

```
packages/
├── core/                    # 核心基础设施
├── shared/                  # 共享组件和值对象
├── common/                  # 通用工具和类型
├── config/                  # 配置管理
├── logging/                 # 日志服务
├── cache/                   # 缓存服务
├── database/                # 数据库适配器
└── auth/                    # 认证授权
```

### 业务模块

```
packages/
├── platform/               # 平台管理
├── tenant/                 # 租户管理
├── user/                   # 用户管理
├── organization/           # 组织管理
├── department/             # 部门管理
├── role/                   # 角色管理
├── permission/             # 权限管理
└── notification/           # 通知系统
    ├── in-app/            # 站内通知
    ├── email/             # 邮件通知
    ├── sms/               # 短信通知
    ├── push/              # 推送通知
    ├── template/          # 通知模板
    ├── orchestration/     # 通知编排
    ├── preferences/       # 通知偏好
    └── analytics/         # 通知分析
```

### 业务模块代码结构示例 (用户模块)

以用户模块为例，展示完整的Clean Architecture代码结构：

```
packages/user/
├── src/
│   ├── domain/                    # Entities Layer (实体层)
│   │   ├── aggregates/           # 聚合根
│   │   │   └── user.aggregate.ts
│   │   ├── entities/             # 领域实体
│   │   │   └── user.entity.ts
│   │   ├── value-objects/        # 值对象
│   │   │   ├── password.vo.ts
│   │   │   ├── user-profile.vo.ts
│   │   │   ├── user-preferences.vo.ts
│   │   │   └── user-status.vo.ts
│   │   ├── events/               # 领域事件
│   │   │   ├── user-created.event.ts
│   │   │   ├── user-profile-updated.event.ts
│   │   │   ├── user-status-changed.event.ts
│   │   │   ├── user-password-updated.event.ts
│   │   │   └── user-preferences-updated.event.ts
│   │   ├── services/             # 领域服务
│   │   │   └── user-domain.service.ts
│   │   └── repositories/         # 仓储接口
│   │       └── user-repository.interface.ts
│   ├── application/              # Use Cases Layer (用例层)
│   │   ├── use-cases/           # 用例实现
│   │   │   ├── create-user.use-case.ts
│   │   │   ├── update-user.use-case.ts
│   │   │   ├── delete-user.use-case.ts
│   │   │   ├── get-user.use-case.ts
│   │   │   └── get-users.use-case.ts
│   │   ├── commands/            # 命令定义和处理器
│   │   │   ├── create-user.command.ts
│   │   │   ├── update-user.command.ts
│   │   │   ├── delete-user.command.ts
│   │   │   └── handlers/        # 命令处理器
│   │   │       ├── create-user.handler.ts
│   │   │       ├── update-user.handler.ts
│   │   │       └── delete-user.handler.ts
│   │   ├── queries/             # 查询定义和处理器
│   │   │   ├── get-user.query.ts
│   │   │   ├── get-users.query.ts
│   │   │   └── handlers/        # 查询处理器
│   │   │       ├── get-user.handler.ts
│   │   │       └── get-users.handler.ts
│   │   ├── services/            # 应用服务 (用例协调器)
│   │   │   └── user-application.service.ts
│   │   └── dto/                 # 数据传输对象
│   │       ├── create-user.dto.ts
│   │       ├── update-user.dto.ts
│   │       └── user-response.dto.ts
│   ├── infrastructure/           # Interface Adapters Layer (接口适配层)
│   │   ├── persistence/         # 持久化实现
│   │   │   ├── postgresql/     # PostgreSQL实现
│   │   │   │   ├── entities/   # 数据库实体
│   │   │   │   │   └── user.entity.ts
│   │   │   │   ├── repositories/ # 仓储实现
│   │   │   │   │   └── user.repository.ts
│   │   │   │   └── mappers/    # 对象映射器
│   │   │   │       └── user.mapper.ts
│   │   │   └── mongodb/        # MongoDB实现 (事件存储)
│   │   │       ├── events/     # 事件存储
│   │   │       │   └── user-events.collection.ts
│   │   │       └── snapshots/  # 快照存储
│   │   │           └── user-snapshots.collection.ts
│   │   ├── events/             # 事件处理器
│   │   │   ├── user-created-event-handler.ts
│   │   │   ├── user-profile-updated-event-handler.ts
│   │   │   ├── user-status-changed-event-handler.ts
│   │   │   ├── user-password-updated-event-handler.ts
│   │   │   └── user-preferences-updated-event-handler.ts
│   │   ├── external/           # 外部服务适配器
│   │   │   ├── email-service.adapter.ts
│   │   │   └── notification-service.adapter.ts
│   │   └── cache/              # 缓存实现
│   │       └── user-cache.service.ts
│   ├── interfaces/             # Frameworks & Drivers Layer (框架驱动层)
│   │   ├── rest/              # RESTful API接口
│   │   │   ├── controllers/   # REST控制器
│   │   │   │   └── user.controller.ts
│   │   │   ├── guards/        # 守卫
│   │   │   │   └── user-permission.guard.ts
│   │   │   ├── interceptors/  # 拦截器
│   │   │   │   └── user-audit.interceptor.ts
│   │   │   └── decorators/    # 装饰器
│   │   │       └── user-permissions.decorator.ts
│   │   ├── graphql/           # GraphQL接口
│   │   │   ├── resolvers/     # 解析器
│   │   │   │   └── user.resolver.ts
│   │   │   └── schemas/       # 模式定义
│   │   │       └── user.schema.ts
│   │   └── grpc/              # gRPC接口
│   │       ├── services/      # 服务定义
│   │       │   └── user.service.ts
│   │       └── proto/         # Proto文件
│   │           └── user.proto
│   ├── shared/                # 共享组件
│   │   ├── constants/         # 常量定义
│   │   │   └── user.constants.ts
│   │   ├── types/             # 类型定义
│   │   │   └── user.types.ts
│   │   └── utils/             # 工具函数
│   │       └── user.utils.ts
│   ├── tests/                 # 测试文件
│   │   ├── unit/              # 单元测试
│   │   │   ├── domain/        # 领域层测试
│   │   │   ├── application/   # 应用层测试
│   │   │   └── infrastructure/ # 基础设施层测试
│   │   ├── integration/       # 集成测试
│   │   └── e2e/               # 端到端测试
│   ├── user.module.ts         # 模块定义
│   └── index.ts               # 导出文件
├── package.json               # 包配置
├── tsconfig.json             # TypeScript配置
└── README.md                 # 模块文档
```

### 代码结构说明

#### 1. Domain Layer (实体层)

- **aggregates/**: 聚合根，管理业务不变性约束
- **entities/**: 领域实体，封装业务状态
- **value-objects/**: 值对象，不可变的业务概念
- **events/**: 领域事件，业务状态变更通知
- **services/**: 领域服务，跨聚合业务逻辑
- **repositories/**: 仓储接口，数据访问抽象

#### 2. Application Layer (用例层)

- **use-cases/**: 用例实现，应用特定业务规则
- **commands/**: 命令定义和处理器，写操作参数和处理逻辑
  - **handlers/**: 命令处理器，CQRS命令处理实现
- **queries/**: 查询定义和处理器，读操作参数和处理逻辑
  - **handlers/**: 查询处理器，CQRS查询处理实现
- **services/**: 应用服务，用例协调器
- **dto/**: 数据传输对象，接口数据传输

#### 3. Infrastructure Layer (接口适配层)

- **persistence/**: 持久化实现，数据存储适配
- **events/**: 事件处理器，处理领域事件副作用
- **external/**: 外部服务适配器，第三方服务集成
- **cache/**: 缓存实现，性能优化

#### 4. Interfaces Layer (框架驱动层)

- **rest/**: RESTful API接口，标准HTTP REST API
- **graphql/**: GraphQL接口，灵活查询
- **grpc/**: gRPC接口，高性能通信

这种结构确保了：

- **依赖倒置**: 外层依赖内层接口
- **单一职责**: 每层都有明确的职责
- **开闭原则**: 对扩展开放，对修改封闭
- **可测试性**: 每层都可以独立测试

## 架构层次

### 1. Entities Layer (实体层)

**职责**: 包含企业范围的业务规则

**内容**:

- 聚合根 (Aggregate Roots)
- 实体 (Entities)
- 值对象 (Value Objects)
- 领域事件 (Domain Events)
- 领域服务 (Domain Services)
- 仓储接口 (Repository Interfaces)

**特点**:

- 不依赖任何外部框架
- 纯业务逻辑
- 可独立测试

### 2. Use Cases Layer (用例层)

**职责**: 包含应用特定的业务规则

**内容**:

- 用例实现 (Use Case Implementations)
- 应用服务 (Application Services)
- 命令/查询处理器 (Command/Query Handlers)
- 事件发布器 (Event Publishers)

**特点**:

- 依赖Entities层
- 定义接口供外层实现
- 协调业务操作

### 3. Interface Adapters Layer (接口适配层)

**职责**: 转换数据格式，适配外部接口

**内容**:

- 控制器 (Controllers)
- 仓储实现 (Repository Implementations)
- 事件处理器 (Event Handlers)
- 展示器 (Presenters)
- 数据库适配器 (Database Adapters)
- 外部服务适配器 (External Service Adapters)

**特点**:

- 实现Use Cases层定义的接口
- 处理数据转换
- 适配外部系统

### 4. Frameworks & Drivers Layer (框架驱动层)

**职责**: 提供技术实现和外部集成

**内容**:

- Web框架 (NestJS/Fastify)
- 数据库 (PostgreSQL/MongoDB)
- 消息队列 (Redis/Bull)
- 外部API
- 文件系统
- 第三方库

**特点**:

- 被Interface Adapters层使用
- 提供技术实现
- 处理外部集成

## 事件驱动架构

### 事件流

```
Command → Use Case → Aggregate → Domain Event → Event Handler → Read Model
```

### 事件类型

1. **领域事件**: 业务状态变更事件
2. **集成事件**: 跨边界上下文通信事件
3. **命令事件**: 异步命令处理事件
4. **查询事件**: 异步查询处理事件

### 事件处理

- **同步处理**: 在事务内处理
- **异步处理**: 通过消息队列处理
- **重试机制**: 失败自动重试
- **死信队列**: 处理失败事件

## 数据隔离策略

### 1. 数据库级隔离

- 每个租户使用独立数据库
- 最高级别数据隔离
- 适合大型企业客户

### 2. Schema级隔离

- 每个租户使用独立Schema
- 共享数据库实例
- 平衡隔离和资源使用

### 3. 表级隔离

- 所有租户共享数据库和Schema
- 通过tenant_id字段隔离
- 支持行级安全策略
- 成本最低，适合小型客户

## 开发原则

### 1. 代码质量

- **TypeScript严格模式**: 确保类型安全
- **ESLint + Prettier**: 代码风格统一
- **单元测试**: 测试覆盖率 > 80%
- **集成测试**: 关键业务流程测试

### 2. 文档规范

- **TSDoc注释**: 所有公共API都有完整注释
- **中文注释**: 使用中文编写注释
- **架构文档**: 保持文档与代码同步
- **API文档**: 自动生成API文档

### 3. 性能优化

- **数据库索引**: 优化查询性能
- **缓存策略**: Redis缓存热点数据
- **连接池**: 数据库连接池管理
- **异步处理**: 非关键操作异步处理

## 部署架构

### 开发环境

- **Docker Compose**: 本地开发环境
- **热重载**: 代码变更自动重启
- **调试支持**: 完整的调试工具链

### 生产环境

- **容器化部署**: Docker容器部署
- **负载均衡**: 多实例负载均衡
- **数据库集群**: 主从复制
- **监控告警**: 完整的监控体系

## 安全策略

### 1. 认证授权

- **JWT Token**: 无状态认证
- **RBAC**: 基于角色的访问控制
- **多租户隔离**: 数据访问隔离
- **API限流**: 防止恶意请求

### 2. 数据安全

- **数据加密**: 敏感数据加密存储
- **传输加密**: HTTPS/TLS加密传输
- **审计日志**: 完整的操作审计
- **备份恢复**: 定期数据备份

## 扩展性设计

### 1. 水平扩展

- **无状态设计**: 支持多实例部署
- **数据库分片**: 支持数据库水平扩展
- **缓存集群**: Redis集群支持
- **消息队列**: 支持消息队列集群

### 2. 功能扩展

- **插件架构**: 支持功能插件
- **事件驱动**: 通过事件扩展功能
- **API版本**: 支持API版本管理
- **配置驱动**: 通过配置扩展功能

## 总结

Aiofix AI SAAS平台采用现代化的架构设计，通过Clean Architecture、DDD、CQRS和Event Sourcing等模式，构建了一个高度可维护、可扩展、可测试的多租户SAAS平台。平台支持多种数据隔离策略，提供完整的事件驱动架构，为AI服务的集成提供了坚实的基础。

---

**文档版本**: 3.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
