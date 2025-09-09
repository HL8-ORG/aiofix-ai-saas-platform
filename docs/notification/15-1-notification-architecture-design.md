# 通知模块架构设计

## 概述

本文档详细描述了通知模块的技术架构设计，包括架构设计原则、代码组织架构、子领域划分策略、事件驱动策略和包结构设计。

## 1. 架构设计原则

- **DDD架构**: 遵循领域驱动设计，按业务领域组织代码
- **Clean Architecture**: 遵循清洁架构，确保依赖倒置
- **CQRS**: 命令查询职责分离，优化读写性能
- **全面事件驱动**: 所有业务操作都通过事件驱动，实现松耦合和最终一致性
- **多租户**: 支持租户级数据隔离和配置
- **微服务**: 支持独立部署和扩展
- **子领域划分**: 基于频道和通知方式划分子领域
- **聚合根与实体分离**: 聚合根负责业务协调，领域实体负责状态管理

## 2. 聚合根与领域实体设计模式

本设计采用**聚合根与领域实体分离**的架构模式：

### 2.1 聚合根 (Aggregate Root)

- **职责**: 业务协调、事件发布、事务边界控制
- **继承**: `EventSourcedAggregateRoot`
- **特点**: 不直接管理状态，通过组合领域实体实现业务逻辑

### 2.2 领域实体 (Domain Entity)

- **职责**: 状态管理、业务规则验证、基础设施功能
- **继承**: `BaseEntity`
- **特点**: 提供审计追踪、乐观锁、软删除等企业级功能

### 2.3 设计优势

1. **职责分离**: 聚合根专注业务协调，实体专注状态管理
2. **基础设施复用**: 通过BaseEntity提供统一的审计和版本控制
3. **事件驱动**: 聚合根负责事件发布，实体负责状态变更
4. **可测试性**: 聚合根和实体可以独立测试
5. **可维护性**: 业务逻辑和基础设施功能分离，便于维护

## 3. 代码组织架构图

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           通知模块代码组织架构                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  packages/notification/                                                         │
│  ├── in-app/                    # 站内信子领域包                                │
│  │   ├── src/                                                                   │
│  │   │   ├── domain/            # 领域层                                        │
│  │   │   │   ├── aggregates/    # 聚合根                                        │
│  │   │   │   │   └── in-app-notif.aggregate.ts                                 │
│  │   │   │   ├── entities/      # 领域实体                                      │
│  │   │   │   │   └── in-app-notif.entity.ts                                    │
│  │   │   │   ├── value-objects/ # 值对象                                        │
│  │   │   │   │   ├── notif-id.vo.ts                                            │
│  │   │   │   │   ├── tenant-id.vo.ts                                           │
│  │   │   │   │   ├── user-id.vo.ts                                             │
│  │   │   │   │   ├── notif-type.vo.ts                                          │
│  │   │   │   │   ├── notif-priority.vo.ts                                      │
│  │   │   │   │   └── read-status.vo.ts                                         │
│  │   │   │   ├── events/        # 领域事件                                      │
│  │   │   │   │   ├── in-app-notif-created.event.ts                             │
│  │   │   │   │   ├── in-app-notif-read.event.ts                                │
│  │   │   │   │   └── in-app-notif-archived.event.ts                            │
│  │   │   │   └── services/      # 领域服务                                      │
│  │   │   │       └── notif-center.service.ts                                   │
│  │   │   ├── application/       # 应用层                                        │
│  │   │   │   ├── commands/      # 命令                                          │
│  │   │   │   │   ├── create-in-app-notif.command.ts                            │
│  │   │   │   │   ├── mark-as-read.command.ts                                   │
│  │   │   │   │   └── archive-notif.command.ts                                  │
│  │   │   │   ├── queries/       # 查询                                          │
│  │   │   │   │   ├── get-in-app-notifs.query.ts                                │
│  │   │   │   │   └── get-notif-stats.query.ts                                  │
│  │   │   │   ├── handlers/      # 命令/查询处理器                               │
│  │   │   │   │   ├── create-in-app-notif.handler.ts                            │
│  │   │   │   │   ├── mark-as-read.handler.ts                                   │
│  │   │   │   │   └── archive-notif.handler.ts                                  │
│  │   │   │   └── services/      # 应用服务                                      │
│  │   │   │       └── in-app-notif.service.ts                                   │
│  │   │   ├── infrastructure/    # 基础设施层                                    │
│  │   │   │   ├── repositories/  # 仓储实现                                      │
│  │   │   │   │   └── in-app-notif.repository.ts                                │
│  │   │   │   ├── entities/      # 数据库实体                                    │
│  │   │   │   │   └── in-app-notif.entity.ts                                    │
│  │   │   │   └── adapters/      # 外部服务适配器                                │
│  │   │   │       └── database.adapter.ts                                       │
│  │   │   ├── interface/         # 接口层                                        │
│  │   │   │   ├── controllers/   # 控制器                                        │
│  │   │   │   │   └── in-app-notif.controller.ts                                │
│  │   │   │   ├── dtos/          # 数据传输对象                                  │
│  │   │   │   │   ├── create-in-app-notif.dto.ts                                │
│  │   │   │   │   └── in-app-notif.dto.ts                                       │
│  │   │   │   └── guards/        # 守卫                                          │
│  │   │   │       └── notif.guard.ts                                            │
│  │   │   └── index.ts           # 包入口文件                                    │
│  │   ├── package.json           # 包配置                                        │
│  │   └── tsconfig.json          # TypeScript配置                                │
│  │                                                                             │
│  ├── email/                     # 邮件通知子领域包                              │
│  ├── push/                      # 推送通知子领域包                              │
│  ├── sms/                       # 短信通知子领域包                              │
│  ├── orchestration/             # 通知编排子领域包                              │
│  ├── preferences/               # 用户偏好子领域包                              │
│  ├── analytics/                 # 通知统计子领域包                              │
│  ├── templates/                 # 模板管理子领域包                              │
│  └── events/                    # 事件集成子领域包                              │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                              架构层次说明                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  📁 domain/          # 领域层 - 核心业务逻辑，不依赖外部框架                    │
│  │   ├── aggregates/ # 聚合根 - 业务协调和事件发布                              │
│  │   ├── entities/   # 领域实体 - 状态管理和基础设施功能                        │
│  │   ├── value-objects/ # 值对象 - 不可变的数据结构                             │
│  │   ├── events/     # 领域事件 - 业务状态变更通知                              │
│  │   └── services/   # 领域服务 - 跨聚合的业务逻辑                              │
│  │                                                                             │
│  📁 application/     # 应用层 - 用例协调，依赖领域层                            │
│  │   ├── commands/   # 命令 - 写操作请求                                        │
│  │   ├── queries/    # 查询 - 读操作请求                                        │
│  │   ├── handlers/   # 处理器 - 命令/查询处理逻辑                               │
│  │   └── services/   # 应用服务 - 用例协调服务                                  │
│  │                                                                             │
│  📁 infrastructure/  # 基础设施层 - 技术实现，依赖应用层                        │
│  │   ├── repositories/ # 仓储实现 - 数据持久化                                  │
│  │   ├── entities/   # 数据库实体 - ORM映射                                     │
│  │   └── adapters/   # 外部服务适配器 - 第三方服务集成                          │
│  │                                                                             │
│  📁 interface/       # 接口层 - 外部接口，依赖应用层                            │
│  │   ├── controllers/ # 控制器 - HTTP API端点                                   │
│  │   ├── dtos/       # 数据传输对象 - API数据格式                               │
│  │   └── guards/     # 守卫 - 权限控制和验证                                    │
│  │                                                                             │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 4. 子领域划分策略

### 4.1 核心子领域

- **站内信子领域 (In-App Notif)**: 站内通知的创建、存储、展示、状态管理
- **邮件通知子领域 (Email Notif)**: 邮件通知的发送、模板管理、状态跟踪
- **推送通知子领域 (Push Notif)**: Web推送、移动端推送的管理和发送
- **短信通知子领域 (SMS Notif)**: 短信通知的发送、成本控制、状态管理

### 4.2 支撑子领域

- **通知编排子领域 (Notif Orchestration)**: 协调不同频道的通知发送、优先级管理
- **用户偏好子领域 (User Preferences)**: 用户对不同频道的偏好设置
- **通知统计子领域 (Notif Analytics)**: 各频道通知效果统计、用户行为分析

### 4.3 通用子领域

- **模板管理子领域 (Template Management)**: 跨频道的模板管理、内容渲染
- **事件集成子领域 (Event Integration)**: 业务事件到通知事件的转换和路由

## 5. 事件驱动策略

### 5.1 使用事件驱动的场景

- **跨子领域通知触发**: 用户注册、权限变更、系统维护等业务事件
- **异步通知发送**: 邮件发送队列、批量通知处理
- **审计和统计**: 通知发送记录、用户行为分析
- **子领域解耦**: 各子领域通过事件进行交互

### 5.2 事件驱动架构设计

基于全面事件驱动架构，我们采用以下设计策略：

- **消息队列集成**: 使用Redis + Bull队列实现异步事件处理
- **事件存储**: 所有领域事件持久化到事件存储，支持审计和重放
- **异步处理**: 所有事件通过消息队列异步处理，保证系统响应性
- **重试机制**: 失败事件自动重试，支持指数退避策略
- **死信队列**: 永久失败的事件进入死信队列，便于问题排查
- **最终一致性**: 通过异步事件处理实现最终一致性

## 6. 包结构设计

### 6.1 独立包结构

```
┌─────────────────────────────────────────────────────────────┐
│                    通知领域架构                              │
├─────────────────────────────────────────────────────────────┤
│  站内信子领域 (In-App Notif)                               │
│  ├── InAppNotif Aggregate                                  │
│  ├── NotifCenter Service                                   │
│  └── ReadStatus Value Object                               │
├─────────────────────────────────────────────────────────────┤
│  邮件通知子领域 (Email Notif)                              │
│  ├── EmailNotif Aggregate                                  │
│  ├── EmailTemplate Aggregate                               │
│  └── EmailDelivery Service                                 │
├─────────────────────────────────────────────────────────────┤
│  推送通知子领域 (Push Notif)                               │
│  ├── PushNotif Aggregate                                   │
│  ├── PushChannel Aggregate                                 │
│  └── PushDelivery Service                                  │
├─────────────────────────────────────────────────────────────┤
│  短信通知子领域 (SMS Notif)                                │
│  ├── SmsNotif Aggregate                                    │
│  ├── SmsProvider Aggregate                                 │
│  └── SmsDelivery Service                                   │
├─────────────────────────────────────────────────────────────┤
│  通知编排子领域 (Notif Orchestration)                       │
│  ├── NotifOrchestrator Service                             │
│  ├── ChannelSelector Service                               │
│  └── PriorityManager Service                               │
├─────────────────────────────────────────────────────────────┤
│  用户偏好子领域 (User Preferences)                          │
│  ├── ChannelPreference Aggregate                           │
│  ├── NotifSettings Value Object                            │
│  └── PreferenceService                                     │
├─────────────────────────────────────────────────────────────┤
│  通知统计子领域 (Notif Analytics)                          │
│  ├── ChannelStats Aggregate                                │
│  ├── DeliveryRate Value Object                             │
│  └── AnalyticsService                                      │
├─────────────────────────────────────────────────────────────┤
│  模板管理子领域 (Template Management)                       │
│  ├── MultiChannelTemplate Aggregate                        │
│  ├── TemplateRenderer Service                              │
│  └── ContentAdapter Service                                │
├─────────────────────────────────────────────────────────────┤
│  事件集成子领域 (Event Integration)                         │
│  ├── EventMapper Service                                   │
│  ├── NotifTrigger Service                                  │
│  └── EventRouter Service                                   │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 包依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│                    包依赖关系图                              │
├─────────────────────────────────────────────────────────────┤
│  orchestration (编排包)                                    │
│  ├── 依赖: in-app                                          │
│  ├── 依赖: email                                           │
│  ├── 依赖: push                                            │
│  ├── 依赖: sms                                             │
│  ├── 依赖: preferences                                     │
│  └── 依赖: templates                                       │
├─────────────────────────────────────────────────────────────┤
│  events (事件集成包)                                        │
│  ├── 依赖: orchestration                                   │
│  └── 依赖: 其他业务模块 (user, tenant, platform)           │
├─────────────────────────────────────────────────────────────┤
│  analytics (统计包)                                         │
│  ├── 依赖: in-app                                          │
│  ├── 依赖: email                                           │
│  ├── 依赖: push                                            │
│  └── 依赖: sms                                             │
├─────────────────────────────────────────────────────────────┤
│  核心通知包 (独立运行)                                      │
│  ├── in-app                                                │
│  ├── email                                                 │
│  ├── push                                                  │
│  ├── sms                                                   │
│  ├── preferences                                           │
│  └── templates                                             │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 包管理策略

**独立部署能力**：

- 每个子领域包都可以独立部署和扩展
- 支持微服务架构，每个包可以部署为独立的服务
- 支持容器化部署，每个包有独立的Docker镜像

**版本管理**：

- 每个包有独立的版本号
- 支持语义化版本控制
- 支持包的独立升级和回滚

**依赖管理**：

- 使用pnpm workspace管理包依赖
- 支持包的循环依赖检测
- 支持包的依赖版本锁定

**开发效率**：

- 支持包的独立开发和测试
- 支持包的独立CI/CD流水线
- 支持包的独立文档和发布

### 6.4 命名约定

**代码命名规范**：

- 包名：使用简洁的英文单词，如 `in-app`、`email`、`push`、`sms`
- 类名：使用 `Notif` 作为 `Notification` 的简写
- 文件名：使用 `notif` 简写，如 `in-app-notif.aggregate.ts`
- 变量名：使用 `notif` 简写，如 `const notif = new InAppNotif()`

**命名示例**：

```typescript
// 聚合根类名
export class InAppNotif extends EventSourcedAggregateRoot
export class EmailNotif extends EventSourcedAggregateRoot
export class PushNotif extends EventSourcedAggregateRoot
export class SmsNotif extends EventSourcedAggregateRoot
export class NotifPreferences extends EventSourcedAggregateRoot
export class NotifOrchestration extends EventSourcedAggregateRoot

// 文件名
in-app-notif.aggregate.ts
email-notif.aggregate.ts
push-notif.aggregate.ts
sms-notif.aggregate.ts
notif-preferences.aggregate.ts
notif-orchestration.aggregate.ts

// 变量名
const notif = new InAppNotif();
const emailNotif = new EmailNotif();
const pushNotif = new PushNotif();
const preferences = new NotifPreferences();
const orchestration = new NotifOrchestration();

// 命令和查询类名
export class CreateInAppNotifCommand
export class GetInAppNotifsQuery
export class MarkNotifAsReadCommand
export class CreateNotifPreferencesCommand
export class GetNotifPreferencesQuery
export class CreateNotifOrchestrationCommand

// 事件类名
export class InAppNotifCreatedEvent
export class EmailNotifSentEvent
export class PushNotifDeliveredEvent
export class NotifPreferencesCreatedEvent
export class NotifPreferencesUpdatedEvent
export class NotifOrchestrationCreatedEvent
export class NotifOrchestrationCompletedEvent

// 服务类名
export class NotifOrchestratorService
export class NotifAnalyticsService
export class NotifTemplateService
export class NotifPreferencesService
export class NotifOrchestrationService
```

### 6.5 包配置示例

**package.json 示例 (in-app)**：

```json
{
  "name": "@aiofix/notif-in-app",
  "version": "1.0.0",
  "description": "站内信通知子领域包",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "dev": "tsc --watch"
  },
  "dependencies": {
    "@aiofix/shared": "workspace:*",
    "@aiofix/domain": "workspace:*",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/uuid": "^9.0.0",
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  },
  "peerDependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0"
  }
}
```

**tsconfig.json 示例**：

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts", "**/*.test.ts"]
}
```

**pnpm-workspace.yaml 配置**：

```yaml
packages:
  - 'packages/*'
  - 'packages/notif/*'
```

## 7. 架构优势

### 7.1 模块化设计

- **独立部署**: 每个子领域包都可以独立部署和扩展
- **松耦合**: 通过事件驱动实现子领域间的松耦合
- **高内聚**: 每个子领域内部高度内聚，职责明确

### 7.2 可扩展性

- **水平扩展**: 支持微服务架构的水平扩展
- **功能扩展**: 支持新通知渠道的轻松添加
- **配置扩展**: 支持多租户配置的灵活扩展

### 7.3 可维护性

- **清晰分层**: Clean Architecture确保清晰的代码分层
- **职责分离**: 聚合根与实体分离，职责明确
- **标准化**: 统一的命名约定和代码规范

### 7.4 可测试性

- **单元测试**: 每个组件都可以独立测试
- **集成测试**: 支持子领域间的集成测试
- **端到端测试**: 支持完整的业务流程测试

## 8. 总结

通知模块的架构设计基于DDD + Clean Architecture + CQRS + 事件驱动架构，通过子领域划分和包结构设计，实现了高度的模块化、可扩展性和可维护性。这种设计既满足了多租户SaaS平台的需求，又保持了系统的灵活性和可扩展性。

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
