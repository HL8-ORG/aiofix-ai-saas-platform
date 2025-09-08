# 通知模块技术设计方案

## 文档概述

- **项目名称**: Aiofix AI SAAS平台 - 通知模块技术设计
- **文档版本**: V2.0
- **撰写人**: AI开发团队
- **最后更新日期**: 2024-01-01
- **目标读者**: 架构师、开发工程师、测试工程师

## 📋 目录导航

### 1. 架构设计

- [1.1 设计原则](#11-设计原则)
- [1.2 代码组织架构图](#12-代码组织架构图)
- [1.3 子领域划分策略](#13-子领域划分策略)
- [1.4 事件驱动策略](#14-事件驱动策略)
- [1.5 包结构设计](#15-包结构设计)
  - [1.5.1 独立包结构](#151-独立包结构)
  - [1.5.2 包依赖关系](#152-包依赖关系)
  - [1.5.3 包管理策略](#153-包管理策略)
  - [1.5.4 命名约定](#154-命名约定)
  - [1.5.5 包配置示例](#155-包配置示例)

### 2. 领域模型设计

- [2.1 站内信子领域](#21-站内信子领域)
  - [2.1.1 InAppNotif (站内通知聚合根)](#211-inappnotif-站内通知聚合根)
- [2.2 邮件通知子领域](#22-邮件通知子领域)
  - [2.2.1 EmailNotif (邮件通知聚合根)](#221-emailnotif-邮件通知聚合根)
  - [2.2.2 EmailTemplate (邮件模板聚合根)](#222-emailtemplate-邮件模板聚合根)
- [2.3 推送通知子领域](#23-推送通知子领域)
  - [2.3.1 PushNotif (推送通知聚合根)](#231-pushnotif-推送通知聚合根)
  - [2.3.2 PushChannel (推送渠道聚合根)](#232-pushchannel-推送渠道聚合根)
- [2.4 短信通知子领域](#24-短信通知子领域)
  - [2.4.1 SmsNotif (短信通知聚合根)](#241-smsnotif-短信通知聚合根)
  - [2.4.2 SmsProvider (短信服务商聚合根)](#242-smsprovider-短信服务商聚合根)
- [2.5 通知编排子领域](#25-通知编排子领域)
  - [2.5.1 NotifOrchestrator (通知编排服务)](#251-notificationorchestrator-通知编排服务)
- [2.6 值对象和枚举](#26-值对象和枚举)
  - [2.6.1 通用值对象](#261-通用值对象)
  - [2.6.2 通知类型枚举](#262-通知类型枚举)
  - [2.6.3 通知渠道枚举](#263-通知渠道枚举)
  - [2.6.4 通知状态枚举](#264-通知状态枚举)
  - [2.6.5 通知优先级枚举](#265-通知优先级枚举)
  - [2.6.6 短信服务商枚举](#266-短信服务商枚举)
- [2.7 领域事件](#27-领域事件)
  - [2.7.1 站内信事件](#271-站内信事件)
  - [2.7.2 邮件通知事件](#272-邮件通知事件)
  - [2.7.3 推送通知事件](#273-推送通知事件)
  - [2.7.4 短信通知事件](#274-短信通知事件)

### 3. 应用层设计

- [3.1 站内信应用层](#31-站内信应用层)
  - [3.1.1 站内信命令](#311-站内信命令)
  - [3.1.2 站内信查询](#312-站内信查询)
  - [3.1.3 站内信命令处理器](#313-站内信命令处理器)
- [3.2 邮件通知应用层](#32-邮件通知应用层)
  - [3.2.1 邮件通知命令](#321-邮件通知命令)
  - [3.2.2 邮件通知查询](#322-邮件通知查询)
  - [3.2.3 邮件通知命令处理器](#323-邮件通知命令处理器)
- [3.3 推送通知应用层](#33-推送通知应用层)
  - [3.3.1 推送通知命令](#331-推送通知命令)
  - [3.3.2 推送通知查询](#332-推送通知查询)
  - [3.3.3 推送通知命令处理器](#333-推送通知命令处理器)
- [3.4 短信通知应用层](#34-短信通知应用层)
  - [3.4.1 短信通知命令](#341-短信通知命令)
  - [3.4.2 短信通知查询](#342-短信通知查询)
  - [3.4.3 短信通知命令处理器](#343-短信通知命令处理器)
- [3.5 通知编排应用层](#35-通知编排应用层)
  - [3.5.1 通知编排命令](#351-通知编排命令)
  - [3.5.2 通知编排查询](#352-通知编排查询)
  - [3.5.3 通知编排命令处理器](#353-通知编排命令处理器)

### 4. 基础设施层设计

- [4.1 数据库设计](#41-数据库设计)
- [4.2 仓储实现](#42-仓储实现)
- [4.3 外部服务适配器](#43-外部服务适配器)
- [4.4 事件存储](#44-事件存储)
- [4.5 缓存策略](#45-缓存策略)

### 5. 接口层设计

- [5.1 控制器设计](#51-控制器设计)
- [5.2 DTO设计](#52-dto设计)
- [5.3 权限控制](#53-权限控制)
- [5.4 API文档](#54-api文档)

### 6. 部署与运维

- [6.1 容器化部署](#61-容器化部署)
- [6.2 监控与日志](#62-监控与日志)
- [6.3 性能优化](#63-性能优化)
- [6.4 安全策略](#64-安全策略)

### 7. 开发指南

- [7.1 开发环境搭建](#71-开发环境搭建)
- [7.2 代码规范](#72-代码规范)
- [7.3 测试策略](#73-测试策略)
- [7.4 发布流程](#74-发布流程)

---

## 🚀 快速导航

### 核心概念

- [🏗️ 代码组织架构图](#12-代码组织架构图) - 查看完整的代码目录结构和分层架构
- [📦 包结构设计](#15-包结构设计) - 了解9个独立子领域包的组织方式
- [🏗️ 领域模型设计](#2-领域模型设计) - 查看聚合根、值对象和领域事件
- [⚡ 应用层设计](#3-应用层设计) - 了解CQRS命令和查询处理器
- [🔧 命名约定](#154-命名约定) - 查看notif简写规范

### 开发指南

- [📋 包配置示例](#155-包配置示例) - 查看package.json和tsconfig配置
- [🏛️ 架构设计原则](#11-设计原则) - 了解DDD和Clean Architecture
- [🔄 事件驱动策略](#14-事件驱动策略) - 了解混合事件驱动架构

### 技术实现

- [💾 数据库设计](#41-数据库设计) - 查看表结构和索引设计
- [🔌 外部服务适配器](#43-外部服务适配器) - 了解第三方服务集成
- [📊 监控与日志](#62-监控与日志) - 查看运维监控方案

---

## 1. 技术架构概述

### 1.1 架构设计原则

- **DDD架构**: 遵循领域驱动设计，按业务领域组织代码
- **Clean Architecture**: 遵循清洁架构，确保依赖倒置
- **CQRS**: 命令查询职责分离，优化读写性能
- **全面事件驱动**: 所有业务操作都通过事件驱动，实现松耦合和最终一致性
- **多租户**: 支持租户级数据隔离和配置
- **微服务**: 支持独立部署和扩展
- **子领域划分**: 基于频道和通知方式划分子领域
- **聚合根与实体分离**: 聚合根负责业务协调，领域实体负责状态管理

### 1.1.1 聚合根与领域实体设计模式

本设计采用**聚合根与领域实体分离**的架构模式：

#### 聚合根 (Aggregate Root)

- **职责**: 业务协调、事件发布、事务边界控制
- **继承**: `EventSourcedAggregateRoot`
- **特点**: 不直接管理状态，通过组合领域实体实现业务逻辑

#### 领域实体 (Domain Entity)

- **职责**: 状态管理、业务规则验证、基础设施功能
- **继承**: `BaseEntity`
- **特点**: 提供审计追踪、乐观锁、软删除等企业级功能

#### 设计优势

1. **职责分离**: 聚合根专注业务协调，实体专注状态管理
2. **基础设施复用**: 通过BaseEntity提供统一的审计和版本控制
3. **事件驱动**: 聚合根负责事件发布，实体负责状态变更
4. **可测试性**: 聚合根和实体可以独立测试
5. **可维护性**: 业务逻辑和基础设施功能分离，便于维护

### 1.2 代码组织架构图

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

### 1.3 子领域划分策略

#### 1.3.1 核心子领域

- **站内信子领域 (In-App Notif)**: 站内通知的创建、存储、展示、状态管理
- **邮件通知子领域 (Email Notif)**: 邮件通知的发送、模板管理、状态跟踪
- **推送通知子领域 (Push Notif)**: Web推送、移动端推送的管理和发送
- **短信通知子领域 (SMS Notif)**: 短信通知的发送、成本控制、状态管理

#### 1.3.2 支撑子领域

- **通知编排子领域 (Notif Orchestration)**: 协调不同频道的通知发送、优先级管理
- **用户偏好子领域 (User Preferences)**: 用户对不同频道的偏好设置
- **通知统计子领域 (Notif Analytics)**: 各频道通知效果统计、用户行为分析

#### 1.3.3 通用子领域

- **模板管理子领域 (Template Management)**: 跨频道的模板管理、内容渲染
- **事件集成子领域 (Event Integration)**: 业务事件到通知事件的转换和路由

### 1.4 事件驱动策略

#### 1.4.1 使用事件驱动的场景

- **跨子领域通知触发**: 用户注册、权限变更、系统维护等业务事件
- **异步通知发送**: 邮件发送队列、批量通知处理
- **审计和统计**: 通知发送记录、用户行为分析
- **子领域解耦**: 各子领域通过事件进行交互

#### 1.4.2 事件驱动架构设计

基于全面事件驱动架构，我们采用以下设计策略：

- **消息队列集成**: 使用Redis + Bull队列实现异步事件处理
- **事件存储**: 所有领域事件持久化到事件存储，支持审计和重放
- **异步处理**: 所有事件通过消息队列异步处理，保证系统响应性
- **重试机制**: 失败事件自动重试，支持指数退避策略
- **死信队列**: 永久失败的事件进入死信队列，便于问题排查
- **最终一致性**: 通过异步事件处理实现最终一致性

### 1.5 包结构设计

#### 1.5.1 独立包结构

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

#### 1.4.2 包依赖关系

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

#### 1.4.3 包管理策略

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

#### 1.4.4 命名约定

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

**完整命名约定表**：

| 类型   | 原命名                                | 新命名                         | 示例                             |
| ------ | ------------------------------------- | ------------------------------ | -------------------------------- |
| 聚合根 | InAppNotif                            | InAppNotif                     | `InAppNotif`                     |
| 聚合根 | EmailNotif                            | EmailNotif                     | `EmailNotif`                     |
| 聚合根 | PushNotif                             | PushNotif                      | `PushNotif`                      |
| 聚合根 | SmsNotif                              | SmsNotif                       | `SmsNotif`                       |
| 聚合根 | NotificationPreferences               | NotifPreferences               | `NotifPreferences`               |
| 聚合根 | NotificationOrchestration             | NotifOrchestration             | `NotifOrchestration`             |
| 值对象 | NotifId                               | NotifId                        | `NotifId`                        |
| 值对象 | NotifChannel                          | NotifChannel                   | `NotifChannel`                   |
| 值对象 | NotifStrategy                         | NotifStrategy                  | `NotifStrategy`                  |
| 命令   | CreateInAppNotifCommand               | CreateInAppNotifCommand        | `CreateInAppNotifCommand`        |
| 查询   | GetInAppNotifsQuery                   | GetInAppNotifsQuery            | `GetInAppNotifsQuery`            |
| 事件   | InAppNotifCreatedEvent                | InAppNotifCreatedEvent         | `InAppNotifCreatedEvent`         |
| 事件   | NotificationPreferencesCreatedEvent   | NotifPreferencesCreatedEvent   | `NotifPreferencesCreatedEvent`   |
| 事件   | NotificationOrchestrationCreatedEvent | NotifOrchestrationCreatedEvent | `NotifOrchestrationCreatedEvent` |
| 服务   | NotifOrchestrator                     | NotifOrchestrator              | `NotifOrchestrator`              |
| 服务   | NotificationPreferencesService        | NotifPreferencesService        | `NotifPreferencesService`        |
| 文件名 | in-app-notif.aggregate.ts             | in-app-notif.aggregate.ts      | `in-app-notif.aggregate.ts`      |
| 文件名 | notification-preferences.aggregate.ts | notif-preferences.aggregate.ts | `notif-preferences.aggregate.ts` |
| 变量名 | notif                                 | notif                          | `const notif = new InAppNotif()` |

#### 1.4.5 包配置示例

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

## 2. 领域模型设计

### 2.1 站内信子领域

#### 2.1.1 InAppNotif (站内通知聚合根)

```typescript
/**
 * @class InAppNotif
 * @description
 * 站内通知聚合根，负责管理站内通知相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供站内通知创建、标记已读、归档等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 * 4. 协调领域实体的业务操作
 *
 * 不变性约束：
 * 1. 聚合根控制聚合内所有对象的一致性
 * 2. 确保业务规则在聚合边界内得到执行
 * 3. 管理聚合内实体的生命周期
 * 4. 保证事件发布的原子性
 *
 * 架构设计：
 * 1. 聚合根继承 EventSourcedAggregateRoot，负责业务协调和事件发布
 * 2. 领域实体继承 BaseEntity，负责状态管理和基础设施功能
 * 3. 通过组合模式实现职责分离
 *
 * @property {InAppNotifEntity} notif 站内通知实体
 */
export class InAppNotif extends EventSourcedAggregateRoot {
  private constructor(private notif: InAppNotifEntity) {
    super();
  }

  /**
   * @method create
   * @description 创建新的站内通知聚合根
   * @param {NotifId} id 通知ID
   * @param {TenantId} tenantId 租户ID
   * @param {UserId} recipientId 接收者用户ID
   * @param {NotifType} type 通知类型
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @param {NotifPriority} priority 通知优先级
   * @param {Record<string, unknown>} metadata 通知元数据
   * @returns {InAppNotif} 创建的站内通知聚合根
   * @throws {InvalidNotifDataError} 当通知数据无效时抛出
   * @static
   */
  public static create(
    id: NotifId,
    tenantId: TenantId,
    recipientId: UserId,
    type: NotifType,
    title: string,
    content: string,
    priority: NotifPriority,
    metadata: Record<string, unknown> = {},
  ): InAppNotif {
    // 创建领域实体
    const notifEntity = new InAppNotifEntity(
      id,
      tenantId,
      recipientId,
      type,
      title,
      content,
      priority,
      metadata,
    );

    // 创建聚合根
    const aggregate = new InAppNotif(notifEntity);

    // 发布创建事件
    aggregate.addDomainEvent(
      new InAppNotifCreatedEvent(
        id,
        tenantId,
        recipientId,
        type,
        title,
        content,
        priority,
        metadata,
      ),
    );

    return aggregate;
  }

  /**
   * @method markAsRead
   * @description 标记通知为已读
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsRead(updatedBy: string = 'system'): void {
    const oldStatus = this.notif.getStatus();

    // 委托给领域实体处理业务逻辑
    this.notif.markAsRead(updatedBy);

    const newStatus = this.notif.getStatus();
    const readAt = this.notif.getReadAt();

    // 发布已读事件
    this.addDomainEvent(
      new InAppNotifReadEvent(
        this.notif.id,
        this.notif.tenantId,
        this.notif.recipientId,
        oldStatus,
        newStatus,
        readAt!,
      ),
    );
  }

  /**
   * @method archive
   * @description 归档通知
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public archive(updatedBy: string = 'system'): void {
    const oldStatus = this.notif.getStatus();

    // 委托给领域实体处理业务逻辑
    this.notif.archive(updatedBy);

    const archivedAt = this.notif.getArchivedAt();

    // 发布归档事件
    this.addDomainEvent(
      new InAppNotifArchivedEvent(
        this.notif.id,
        this.notif.tenantId,
        this.notif.recipientId,
        oldStatus,
        archivedAt!,
      ),
    );
  }

  // 聚合根访问器方法，提供对实体属性的访问
  public get id(): NotifId {
    return this.notif.id;
  }

  public get tenantId(): TenantId {
    return this.notif.tenantId;
  }

  public get recipientId(): UserId {
    return this.notif.recipientId;
  }

  public get type(): NotifType {
    return this.notif.type;
  }

  public get title(): string {
    return this.notif.title;
  }

  public get content(): string {
    return this.notif.content;
  }

  public get priority(): NotifPriority {
    return this.notif.priority;
  }

  public get metadata(): Record<string, unknown> {
    return this.notif.metadata;
  }

  public get createdAt(): Date {
    return this.notif.createdAt;
  }

  // 审计相关访问器方法
  public get createdBy(): string {
    return this.notif.getCreatedBy();
  }

  public get updatedBy(): string {
    return this.notif.getUpdatedBy();
  }

  public get dataVersion(): number {
    return this.notif.getVersion();
  }

  public get isDeleted(): boolean {
    return this.notif.isDeleted();
  }
}
```

#### 2.1.2 InAppNotifEntity (站内通知领域实体)

```typescript
/**
 * @class InAppNotifEntity
 * @description
 * 站内通知领域实体，负责维护站内通知的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识通知身份
 * 2. 管理通知的基本状态（未读、已读、已归档）
 * 3. 维护通知的生命周期状态变更
 *
 * 业务规则与约束：
 * 1. 通知ID一旦创建不可变更
 * 2. 通知状态变更必须遵循预定义的状态机
 * 3. 通知内容不能为空或超过长度限制
 * 4. 通知必须属于有效的租户和用户
 *
 * 基础设施支持：
 * 1. 继承BaseEntity提供审计追踪功能
 * 2. 支持乐观锁版本控制
 * 3. 支持软删除和恢复
 * 4. 提供多租户数据隔离
 *
 * @property {NotifId} id 通知唯一标识符，不可变更
 * @property {TenantId} tenantId 所属租户ID
 * @property {UserId} recipientId 接收者用户ID
 * @property {NotifType} type 通知类型
 * @property {string} title 通知标题
 * @property {string} content 通知内容
 * @property {NotifPriority} priority 通知优先级
 * @property {Record<string, unknown>} metadata 通知元数据
 * @property {ReadStatus} status 读取状态
 * @property {Date} readAt 阅读时间
 * @property {Date} archivedAt 归档时间
 */
export class InAppNotifEntity extends BaseEntity {
  private readonly statusValidator = new ReadStatusValidator();

  constructor(
    public readonly id: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly priority: NotifPriority,
    public readonly metadata: Record<string, unknown> = {},
    private status: ReadStatus = ReadStatus.UNREAD,
    private readAt?: Date,
    private archivedAt?: Date,
    createdBy: string = 'system',
  ) {
    super(createdBy);
    this.validate();
  }

  /**
   * @method markAsRead
   * @description 标记通知为已读
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsRead(updatedBy: string = 'system'): void {
    const oldStatus = this.status;
    const newStatus = ReadStatus.READ;

    // 验证状态转换
    this.statusValidator.validateTransition(oldStatus, newStatus);

    // 更新状态
    this.status = newStatus;
    this.readAt = new Date();

    // 更新审计信息（使用基类方法）
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method archive
   * @description 归档通知
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public archive(updatedBy: string = 'system'): void {
    const oldStatus = this.status;
    const newStatus = ReadStatus.ARCHIVED;

    // 验证状态转换
    this.statusValidator.validateTransition(oldStatus, newStatus);

    // 更新状态
    this.status = newStatus;
    this.archivedAt = new Date();

    // 更新审计信息（使用基类方法）
    this.updateAuditInfo(updatedBy);
  }

  // 实现基类要求的抽象方法
  public getEntityId(): string {
    return this.id.value;
  }

  public getTenantId(): string {
    return this.tenantId.value;
  }

  // 业务方法
  public isRead(): boolean {
    return this.status === ReadStatus.READ;
  }

  public isArchived(): boolean {
    return this.status === ReadStatus.ARCHIVED;
  }

  public isUnread(): boolean {
    return this.status === ReadStatus.UNREAD;
  }

  public canBeRead(): boolean {
    return this.statusValidator.isReadable(this.status);
  }

  public canBeArchived(): boolean {
    return this.statusValidator.isArchivable(this.status);
  }

  public getStatus(): ReadStatus {
    return this.status;
  }

  public getReadAt(): Date | undefined {
    return this.readAt;
  }

  public getArchivedAt(): Date | undefined {
    return this.archivedAt;
  }

  // 重写基类方法
  protected validate(): void {
    // 调用基类的验证方法
    super.validate();

    // 业务特定的验证
    if (!this.id) {
      throw new InvalidNotifDataError('Notif ID is required');
    }

    if (!this.tenantId) {
      throw new InvalidNotifDataError('Tenant ID is required');
    }

    if (!this.recipientId) {
      throw new InvalidNotifDataError('Recipient ID is required');
    }

    if (!this.type) {
      throw new InvalidNotifDataError('Notif type is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new InvalidNotifDataError('Notif title is required');
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new InvalidNotifDataError('Notif content is required');
    }

    if (!this.priority) {
      throw new InvalidNotifDataError('Notif priority is required');
    }

    if (this.title.length > 200) {
      throw new InvalidNotifDataError(
        'Notif title cannot exceed 200 characters',
      );
    }

    if (this.content.length > 5000) {
      throw new InvalidNotifDataError(
        'Notif content cannot exceed 5000 characters',
      );
    }
  }

  public equals(other: InAppNotifEntity): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this.id.equals(other.id);
  }

  public clone(): InAppNotifEntity {
    return new InAppNotifEntity(
      this.id,
      this.tenantId,
      this.recipientId,
      this.type,
      this.title,
      this.content,
      this.priority,
      this.metadata,
      this.status,
      this.readAt,
      this.archivedAt,
      this.getCreatedBy(),
    );
  }

  public toJSON(): object {
    return {
      ...super.toJSON(),
      id: this.id.value,
      tenantId: this.tenantId.value,
      recipientId: this.recipientId.value,
      type: this.type,
      title: this.title,
      content: this.content,
      priority: this.priority,
      metadata: this.metadata,
      status: this.status,
      readAt: this.readAt?.toISOString(),
      archivedAt: this.archivedAt?.toISOString(),
    };
  }
}
```

### 2.2 邮件通知子领域

#### 2.2.1 EmailNotif (邮件通知聚合根)

```typescript
/**
 * @class EmailNotif
 * @description
 * 邮件通知聚合根，负责管理邮件通知的发送、状态跟踪和重试机制。
 *
 * 业务职责：
 * 1. 管理邮件通知的创建和发送
 * 2. 跟踪邮件发送状态
 * 3. 处理发送失败和重试逻辑
 * 4. 管理邮件模板和内容渲染
 *
 * 业务规则：
 * 1. 邮件通知必须包含有效的收件人邮箱
 * 2. 发送状态只能按预定义规则转换
 * 3. 发送失败时自动触发重试机制
 * 4. 达到最大重试次数后标记为永久失败
 */
export class EmailNotif extends EventSourcedAggregateRoot {
  private constructor(
    private readonly id: NotifId,
    private readonly tenantId: TenantId,
    private readonly recipientId: UserId,
    private readonly recipientEmail: string,
    private readonly subject: string,
    private readonly content: string,
    private readonly templateId: TemplateId,
    private status: EmailNotifStatus = EmailNotifStatus.PENDING,
    private retryCount: number = 0,
    private readonly maxRetries: number = 3,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
  }

  // 业务方法
  public markAsSending(): void {
    if (this.status === EmailNotifStatus.SENDING) {
      return;
    }

    const oldStatus = this.status;
    this.status = EmailNotifStatus.SENDING;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new EmailNotifSendingEvent(
        this.id,
        this.recipientId,
        this.tenantId,
        this.recipientEmail,
        new Date(),
      ),
    );
  }

  public markAsSent(): void {
    if (this.status === EmailNotifStatus.SENT) {
      return;
    }

    const oldStatus = this.status;
    this.status = EmailNotifStatus.SENT;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new EmailNotifSentEvent(
        this.id,
        this.recipientId,
        this.tenantId,
        this.recipientEmail,
        new Date(),
      ),
    );
  }

  public markAsFailed(error: string): void {
    this.retryCount++;
    this.updatedAt = new Date();

    if (this.retryCount >= this.maxRetries) {
      this.status = EmailNotifStatus.PERMANENTLY_FAILED;
      this.addDomainEvent(
        new EmailNotifPermanentlyFailedEvent(
          this.id,
          this.recipientId,
          this.tenantId,
          this.recipientEmail,
          error,
          this.retryCount,
          new Date(),
        ),
      );
    } else {
      this.status = EmailNotifStatus.FAILED;
      this.addDomainEvent(
        new EmailNotifFailedEvent(
          this.id,
          this.recipientId,
          this.tenantId,
          this.recipientEmail,
          error,
          this.retryCount,
          new Date(),
        ),
      );
    }
  }

  public canRetry(): boolean {
    return (
      this.retryCount < this.maxRetries &&
      this.status === EmailNotifStatus.FAILED
    );
  }
}
```

### 2.3 推送通知子领域

#### 2.3.1 PushNotif (推送通知聚合根)

```typescript
/**
 * @class PushNotif
 * @description
 * 推送通知聚合根，负责管理Web推送和移动端推送的发送和状态管理。
 *
 * 业务职责：
 * 1. 管理推送通知的创建和发送
 * 2. 处理设备注册和推送令牌管理
 * 3. 跟踪推送送达状态
 * 4. 处理推送失败和重试逻辑
 *
 * 业务规则：
 * 1. 推送通知必须关联有效的设备令牌
 * 2. 推送内容有长度限制
 * 3. 推送失败时根据错误类型决定重试策略
 * 4. 无效令牌需要清理和更新
 */
export class PushNotif extends EventSourcedAggregateRoot {
  private constructor(
    private readonly id: NotifId,
    private readonly tenantId: TenantId,
    private readonly recipientId: UserId,
    private readonly deviceToken: string,
    private readonly title: string,
    private readonly body: string,
    private readonly data: Record<string, any>,
    private status: PushNotifStatus = PushNotifStatus.PENDING,
    private retryCount: number = 0,
    private readonly maxRetries: number = 3,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
  }

  // 业务方法
  public markAsSending(): void {
    if (this.status === PushNotifStatus.SENDING) {
      return;
    }

    this.status = PushNotifStatus.SENDING;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new PushNotifSendingEvent(
        this.id,
        this.recipientId,
        this.tenantId,
        this.deviceToken,
        new Date(),
      ),
    );
  }

  public markAsDelivered(): void {
    if (this.status === PushNotifStatus.DELIVERED) {
      return;
    }

    this.status = PushNotifStatus.DELIVERED;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new PushNotifDeliveredEvent(
        this.id,
        this.recipientId,
        this.tenantId,
        this.deviceToken,
        new Date(),
      ),
    );
  }

  public markAsFailed(error: string, errorCode: string): void {
    this.retryCount++;
    this.updatedAt = new Date();

    // 根据错误类型决定是否重试
    if (this.isPermanentError(errorCode)) {
      this.status = PushNotifStatus.PERMANENTLY_FAILED;
      this.addDomainEvent(
        new PushNotifPermanentlyFailedEvent(
          this.id,
          this.recipientId,
          this.tenantId,
          this.deviceToken,
          error,
          errorCode,
          new Date(),
        ),
      );
    } else if (this.retryCount >= this.maxRetries) {
      this.status = PushNotifStatus.PERMANENTLY_FAILED;
      this.addDomainEvent(
        new PushNotifPermanentlyFailedEvent(
          this.id,
          this.recipientId,
          this.tenantId,
          this.deviceToken,
          error,
          errorCode,
          new Date(),
        ),
      );
    } else {
      this.status = PushNotifStatus.FAILED;
      this.addDomainEvent(
        new PushNotifFailedEvent(
          this.id,
          this.recipientId,
          this.tenantId,
          this.deviceToken,
          error,
          errorCode,
          this.retryCount,
          new Date(),
        ),
      );
    }
  }

  private isPermanentError(errorCode: string): boolean {
    // 永久性错误，不需要重试
    const permanentErrors = [
      'INVALID_REGISTRATION',
      'NOT_REGISTERED',
      'MISMATCH_SENDER_ID',
    ];
    return permanentErrors.includes(errorCode);
  }
}
```

### 2.4 短信通知子领域

#### 2.4.1 SmsNotif (短信通知聚合根)

```typescript
/**
 * @class SmsNotif
 * @description
 * 短信通知聚合根，负责管理短信通知的发送、成本控制和状态管理。
 *
 * 业务职责：
 * 1. 管理短信通知的创建和发送
 * 2. 控制短信发送成本和频率
 * 3. 跟踪短信送达状态
 * 4. 处理发送失败和重试逻辑
 *
 * 业务规则：
 * 1. 短信内容有长度限制（通常160字符）
 * 2. 短信发送有成本，需要严格控制
 * 3. 发送频率有严格限制
 * 4. 失败重试次数有限
 */
export class SmsNotif extends EventSourcedAggregateRoot {
  private constructor(
    private readonly id: NotifId,
    private readonly tenantId: TenantId,
    private readonly recipientId: UserId,
    private readonly recipientPhone: string,
    private readonly content: string,
    private readonly provider: SMSProvider,
    private status: SmsNotifStatus = SmsNotifStatus.PENDING,
    private retryCount: number = 0,
    private readonly maxRetries: number = 2, // 短信重试次数较少
    private readonly cost: number = 0,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
  }

  // 业务方法
  public markAsSending(): void {
    if (this.status === SmsNotifStatus.SENDING) {
      return;
    }

    this.status = SmsNotifStatus.SENDING;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new SmsNotifSendingEvent(
        this.id,
        this.recipientId,
        this.tenantId,
        this.recipientPhone,
        this.cost,
        new Date(),
      ),
    );
  }

  public markAsSent(): void {
    if (this.status === SmsNotifStatus.SENT) {
      return;
    }

    this.status = SmsNotifStatus.SENT;
    this.updatedAt = new Date();

    this.addDomainEvent(
      new SmsNotifSentEvent(
        this.id,
        this.recipientId,
        this.tenantId,
        this.recipientPhone,
        this.cost,
        new Date(),
      ),
    );
  }

  public markAsFailed(error: string): void {
    this.retryCount++;
    this.updatedAt = new Date();

    if (this.retryCount >= this.maxRetries) {
      this.status = SmsNotifStatus.PERMANENTLY_FAILED;
      this.addDomainEvent(
        new SmsNotifPermanentlyFailedEvent(
          this.id,
          this.recipientId,
          this.tenantId,
          this.recipientPhone,
          error,
          this.cost,
          new Date(),
        ),
      );
    } else {
      this.status = SmsNotifStatus.FAILED;
      this.addDomainEvent(
        new SmsNotifFailedEvent(
          this.id,
          this.recipientId,
          this.tenantId,
          this.recipientPhone,
          error,
          this.cost,
          this.retryCount,
          new Date(),
        ),
      );
    }
  }

  public canRetry(): boolean {
    return (
      this.retryCount < this.maxRetries && this.status === SmsNotifStatus.FAILED
    );
  }
}
```

### 2.5 通知编排子领域

#### 2.5.1 NotifOrchestrator (通知编排服务)

```typescript
/**
 * @class NotifOrchestrator
 * @description
 * 通知编排服务，负责协调不同频道的通知发送和优先级管理。
 *
 * 业务职责：
 * 1. 接收业务事件并转换为通知请求
 * 2. 根据用户偏好选择通知频道
 * 3. 管理通知发送的优先级
 * 4. 协调各频道子领域的通知发送
 *
 * 业务规则：
 * 1. 根据通知类型和用户偏好选择频道
 * 2. 紧急通知优先发送
 * 3. 避免重复发送相同内容
 * 4. 支持通知的批量处理
 */
@Injectable()
export class NotifOrchestrator {
  constructor(
    private readonly inAppNotifService: InAppNotifService,
    private readonly emailNotifService: EmailNotifService,
    private readonly pushNotifService: PushNotifService,
    private readonly smsNotifService: SmsNotifService,
    private readonly userPreferenceService: UserPreferenceService,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * @method orchestrateNotif
   * @description 编排通知发送，根据用户偏好和通知类型选择频道
   * @param {NotifRequest} request 通知请求
   * @returns {Promise<void>}
   */
  async orchestrateNotif(request: NotifRequest): Promise<void> {
    // 1. 获取用户偏好设置
    const preferences = await this.userPreferenceService.getUserPreferences(
      request.recipientId,
      request.tenantId,
    );

    // 2. 根据通知类型和用户偏好选择频道
    const selectedChannels = this.selectChannels(request, preferences);

    // 3. 按优先级发送通知
    await this.sendNotifsByPriority(request, selectedChannels);
  }

  private selectChannels(
    request: NotifRequest,
    preferences: UserPreferences,
  ): NotifChannel[] {
    const channels: NotifChannel[] = [];

    // 根据通知类型和用户偏好选择频道
    if (preferences.isInAppEnabled(request.type)) {
      channels.push(NotifChannel.IN_APP);
    }

    if (preferences.isEmailEnabled(request.type)) {
      channels.push(NotifChannel.EMAIL);
    }

    if (preferences.isPushEnabled(request.type)) {
      channels.push(NotifChannel.PUSH);
    }

    if (preferences.isSMSEnabled(request.type) && request.isUrgent) {
      channels.push(NotifChannel.SMS);
    }

    return channels;
  }

  private async sendNotifsByPriority(
    request: NotifRequest,
    channels: NotifChannel[],
  ): Promise<void> {
    // 按优先级发送通知
    const priorityOrder = [
      NotifChannel.SMS,
      NotifChannel.PUSH,
      NotifChannel.IN_APP,
      NotifChannel.EMAIL,
    ];

    for (const channel of priorityOrder) {
      if (channels.includes(channel)) {
        try {
          await this.sendNotifByChannel(request, channel);
        } catch (error) {
          // 记录错误但不中断其他频道的发送
          console.error(`Failed to send notif via ${channel}:`, error);
        }
      }
    }
  }

  private async sendNotifByChannel(
    request: NotifRequest,
    channel: NotifChannel,
  ): Promise<void> {
    switch (channel) {
      case NotifChannel.IN_APP:
        await this.inAppNotifService.sendNotif(request);
        break;
      case NotifChannel.EMAIL:
        await this.emailNotifService.sendNotif(request);
        break;
      case NotifChannel.PUSH:
        await this.pushNotifService.sendNotif(request);
        break;
      case NotifChannel.SMS:
        await this.smsNotifService.sendNotif(request);
        break;
    }
  }
}
```

### 2.6 值对象和枚举

#### 2.6.1 通用值对象

```typescript
/**
 * @class NotifId
 * @description 通知ID值对象，确保通知标识的唯一性和有效性
 */
export class NotifId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.length === 0) {
      throw new InvalidNotifIdError('Notif ID cannot be empty');
    }
  }

  public static generate(): NotifId {
    return new NotifId(uuidv4());
  }
}

/**
 * @class TemplateId
 * @description 模板ID值对象，确保模板标识的唯一性和有效性
 */
export class TemplateId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.length === 0) {
      throw new InvalidTemplateIdError('Template ID cannot be empty');
    }
  }

  public static generate(): TemplateId {
    return new TemplateId(uuidv4());
  }
}
```

#### 2.6.2 通知类型枚举

```typescript
/**
 * @enum NotifType
 * @description 通知类型枚举，定义系统支持的所有通知类型
 */
export enum NotifType {
  // 系统类通知
  SYSTEM = 'system',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_UPDATE = 'system_update',
  SECURITY_ALERT = 'security_alert',

  // 平台管理类通知
  PLATFORM_MANAGEMENT = 'platform_management',
  TENANT_CREATED = 'tenant_created',
  TENANT_DELETED = 'tenant_deleted',
  PLATFORM_USER_ASSIGNED = 'platform_user_assigned',

  // 租户管理类通知
  TENANT_MANAGEMENT = 'tenant_management',
  TENANT_USER_ASSIGNED = 'tenant_user_assigned',
  ORGANIZATION_CREATED = 'organization_created',
  TENANT_CONFIG_UPDATED = 'tenant_config_updated',

  // 组织管理类通知
  ORGANIZATION_MANAGEMENT = 'organization_management',
  ORGANIZATION_DELETED = 'organization_deleted',
  DEPARTMENT_CREATED = 'department_created',
  ORGANIZATION_STRUCTURE_CHANGED = 'organization_structure_changed',

  // 部门管理类通知
  DEPARTMENT_MANAGEMENT = 'department_management',
  DEPARTMENT_USER_ASSIGNED = 'department_user_assigned',
  DEPARTMENT_INFO_UPDATED = 'department_info_updated',
  DEPARTMENT_PERMISSION_CHANGED = 'department_permission_changed',

  // 用户管理类通知
  USER_MANAGEMENT = 'user_management',
  USER_REGISTERED = 'user_registered',
  USER_LOGIN = 'user_login',
  USER_PERMISSION_CHANGED = 'user_permission_changed',
  USER_ASSIGNED = 'user_assigned',

  // 权限管理类通知
  PERMISSION_MANAGEMENT = 'permission_management',
  ROLE_ASSIGNED = 'role_assigned',
  ROLE_REVOKED = 'role_revoked',
  PERMISSION_APPLIED = 'permission_applied',
  PERMISSION_APPROVED = 'permission_approved',

  // 安全类通知
  SECURITY = 'security',
  ABNORMAL_LOGIN = 'abnormal_login',
  PERMISSION_VIOLATION = 'permission_violation',
  DATA_ACCESS_ANOMALY = 'data_access_anomaly',
}
```

#### 2.6.3 通知频道枚举

```typescript
/**
 * @enum NotifChannel
 * @description 通知频道枚举，定义系统支持的所有通知频道
 */
export enum NotifChannel {
  IN_APP = 'in_app', // 站内信
  EMAIL = 'email', // 邮件
  PUSH = 'push', // 推送通知
  SMS = 'sms', // 短信
  WEBHOOK = 'webhook', // Webhook（未来扩展）
}
```

#### 2.6.4 通知状态枚举

```typescript
/**
 * @enum ReadStatus
 * @description
 * 站内通知读取状态枚举，定义站内通知的读取状态类型。
 *
 * 状态类型：
 * 1. UNREAD - 未读：用户尚未查看的通知
 * 2. READ - 已读：用户已经查看的通知
 * 3. ARCHIVED - 已归档：用户已归档的通知
 *
 * 状态转换规则：
 * 1. UNREAD → READ：用户查看通知时
 * 2. READ → ARCHIVED：用户归档通知时
 * 3. UNREAD → ARCHIVED：用户直接归档未读通知时
 * 4. 不允许反向转换
 */
export enum ReadStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  ARCHIVED = 'ARCHIVED',
}

/**
 * @class ReadStatusValidator
 * @description
 * 读取状态验证器，负责验证状态转换的合法性。
 *
 * 验证职责：
 * 1. 验证状态转换的合法性
 * 2. 提供状态转换规则检查
 * 3. 确保状态转换的业务规则
 */
export class ReadStatusValidator {
  /**
   * @method canTransition
   * @description 检查是否可以从一个状态转换到另一个状态
   * @param {ReadStatus} fromStatus 原状态
   * @param {ReadStatus} toStatus 目标状态
   * @returns {boolean} 是否可以转换
   */
  public canTransition(fromStatus: ReadStatus, toStatus: ReadStatus): boolean {
    const validTransitions: Record<ReadStatus, ReadStatus[]> = {
      [ReadStatus.UNREAD]: [ReadStatus.READ, ReadStatus.ARCHIVED],
      [ReadStatus.READ]: [ReadStatus.ARCHIVED],
      [ReadStatus.ARCHIVED]: [], // 归档状态不能转换到其他状态
    };

    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }

  /**
   * @method validateTransition
   * @description 验证状态转换的合法性，如果无效则抛出异常
   * @param {ReadStatus} fromStatus 原状态
   * @param {ReadStatus} toStatus 目标状态
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public validateTransition(
    fromStatus: ReadStatus,
    toStatus: ReadStatus,
  ): void {
    if (!this.canTransition(fromStatus, toStatus)) {
      throw new InvalidStatusTransitionError(
        `Invalid status transition from ${fromStatus} to ${toStatus}`,
      );
    }
  }

  /**
   * @method isReadable
   * @description 检查状态是否可读
   * @param {ReadStatus} status 状态
   * @returns {boolean} 是否可读
   */
  public isReadable(status: ReadStatus): boolean {
    return status === ReadStatus.UNREAD;
  }

  /**
   * @method isArchivable
   * @description 检查状态是否可归档
   * @param {ReadStatus} status 状态
   * @returns {boolean} 是否可归档
   */
  public isArchivable(status: ReadStatus): boolean {
    return [ReadStatus.UNREAD, ReadStatus.READ].includes(status);
  }
}

/**
 * @enum EmailNotifStatus
 * @description 邮件通知状态枚举
 */
export enum EmailNotifStatus {
  PENDING = 'pending', // 待发送
  SENDING = 'sending', // 发送中
  SENT = 'sent', // 已发送
  DELIVERED = 'delivered', // 已送达
  FAILED = 'failed', // 发送失败
  PERMANENTLY_FAILED = 'permanently_failed', // 永久失败
  CANCELLED = 'cancelled', // 已取消
}

/**
 * @enum PushNotifStatus
 * @description 推送通知状态枚举
 */
export enum PushNotifStatus {
  PENDING = 'pending', // 待发送
  SENDING = 'sending', // 发送中
  DELIVERED = 'delivered', // 已送达
  CLICKED = 'clicked', // 已点击
  FAILED = 'failed', // 发送失败
  PERMANENTLY_FAILED = 'permanently_failed', // 永久失败
  CANCELLED = 'cancelled', // 已取消
}

/**
 * @enum SmsNotifStatus
 * @description 短信通知状态枚举
 */
export enum SmsNotifStatus {
  PENDING = 'pending', // 待发送
  SENDING = 'sending', // 发送中
  SENT = 'sent', // 已发送
  DELIVERED = 'delivered', // 已送达
  FAILED = 'failed', // 发送失败
  PERMANENTLY_FAILED = 'permanently_failed', // 永久失败
  CANCELLED = 'cancelled', // 已取消
}
```

#### 2.6.5 通知优先级枚举

```typescript
/**
 * @enum NotifPriority
 * @description 通知优先级枚举，用于控制通知的显示和发送优先级
 */
export enum NotifPriority {
  LOW = 'low', // 低优先级
  NORMAL = 'normal', // 普通优先级
  HIGH = 'high', // 高优先级
  URGENT = 'urgent', // 紧急优先级
  CRITICAL = 'critical', // 关键优先级
}
```

#### 2.6.6 SMS提供商枚举

```typescript
/**
 * @enum SMSProvider
 * @description 短信服务提供商枚举
 */
export enum SMSProvider {
  ALIYUN = 'aliyun', // 阿里云短信
  TENCENT = 'tencent', // 腾讯云短信
  AWS_SNS = 'aws_sns', // AWS SNS
  TWILIO = 'twilio', // Twilio
  CUSTOM = 'custom', // 自定义提供商
}
```

### 2.7 领域事件

#### 2.7.1 站内信子领域事件

```typescript
/**
 * @class InAppNotifCreatedEvent
 * @description 站内通知创建事件，当站内通知被创建时触发
 */
export class InAppNotifCreatedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'InAppNotifCreated';

  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly priority: NotifPriority,
    public readonly metadata: Record<string, unknown>,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class InAppNotifReadEvent
 * @description 站内通知已读事件，当站内通知被标记为已读时触发
 */
export class InAppNotifReadEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'InAppNotifRead';

  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly oldStatus: ReadStatus,
    public readonly newStatus: ReadStatus,
    public readonly readAt: Date,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class InAppNotifArchivedEvent
 * @description 站内通知归档事件，当站内通知被归档时触发
 */
export class InAppNotifArchivedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'InAppNotifArchived';

  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly oldStatus: ReadStatus,
    public readonly archivedAt: Date,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}
```

#### 2.7.2 邮件通知子领域事件

```typescript
/**
 * @class EmailNotifSendingEvent
 * @description 邮件通知发送中事件，当邮件开始发送时触发
 */
export class EmailNotifSendingEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'EmailNotifSending';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly recipientEmail: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class EmailNotifSentEvent
 * @description 邮件通知已发送事件，当邮件发送成功时触发
 */
export class EmailNotifSentEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'EmailNotifSent';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly recipientEmail: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class EmailNotifFailedEvent
 * @description 邮件通知发送失败事件，当邮件发送失败时触发
 */
export class EmailNotifFailedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'EmailNotifFailed';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly recipientEmail: string,
    public readonly error: string,
    public readonly retryCount: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class EmailNotifPermanentlyFailedEvent
 * @description 邮件通知永久失败事件，当邮件发送达到最大重试次数时触发
 */
export class EmailNotifPermanentlyFailedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'EmailNotifPermanentlyFailed';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly recipientEmail: string,
    public readonly error: string,
    public readonly retryCount: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}
```

#### 2.7.3 推送通知子领域事件

```typescript
/**
 * @class PushNotifSendingEvent
 * @description 推送通知发送中事件，当推送开始发送时触发
 */
export class PushNotifSendingEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'PushNotifSending';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly deviceToken: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class PushNotifDeliveredEvent
 * @description 推送通知已送达事件，当推送送达成功时触发
 */
export class PushNotifDeliveredEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'PushNotifDelivered';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly deviceToken: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class PushNotifFailedEvent
 * @description 推送通知发送失败事件，当推送发送失败时触发
 */
export class PushNotifFailedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'PushNotifFailed';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly deviceToken: string,
    public readonly error: string,
    public readonly errorCode: string,
    public readonly retryCount: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class PushNotifPermanentlyFailedEvent
 * @description 推送通知永久失败事件，当推送发送达到最大重试次数或遇到永久性错误时触发
 */
export class PushNotifPermanentlyFailedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'PushNotifPermanentlyFailed';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly deviceToken: string,
    public readonly error: string,
    public readonly errorCode: string,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}
```

#### 2.7.4 短信通知子领域事件

```typescript
/**
 * @class SmsNotifSendingEvent
 * @description 短信通知发送中事件，当短信开始发送时触发
 */
export class SmsNotifSendingEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'SmsNotifSending';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly recipientPhone: string,
    public readonly cost: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class SmsNotifSentEvent
 * @description 短信通知已发送事件，当短信发送成功时触发
 */
export class SmsNotifSentEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'SmsNotifSent';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly recipientPhone: string,
    public readonly cost: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class SmsNotifFailedEvent
 * @description 短信通知发送失败事件，当短信发送失败时触发
 */
export class SmsNotifFailedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'SmsNotifFailed';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly recipientPhone: string,
    public readonly error: string,
    public readonly cost: number,
    public readonly retryCount: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}

/**
 * @class SmsNotifPermanentlyFailedEvent
 * @description 短信通知永久失败事件，当短信发送达到最大重试次数时触发
 */
export class SmsNotifPermanentlyFailedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'SmsNotifPermanentlyFailed';

  constructor(
    public readonly notifId: string,
    public readonly recipientId: string,
    public readonly tenantId: string,
    public readonly recipientPhone: string,
    public readonly error: string,
    public readonly cost: number,
    public readonly occurredOn: Date = new Date(),
  ) {
    this.eventId = uuidv4();
    this.occurredOn = occurredOn;
  }
}
```

## 3. 应用层设计

### 3.1 站内信子领域应用层

#### 3.1.1 站内信命令

```typescript
/**
 * @class CreateInAppNotifCommand
 * @description 创建站内通知命令
 */
export class CreateInAppNotifCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly metadata?: any,
    public readonly priority: NotifPriority = NotifPriority.NORMAL,
  ) {}
}

/**
 * @class MarkInAppNotifAsReadCommand
 * @description 标记站内通知已读命令
 */
export class MarkInAppNotifAsReadCommand {
  constructor(
    public readonly notifId: string,
    public readonly userId: string,
  ) {}
}

/**
 * @class ArchiveInAppNotifCommand
 * @description 归档站内通知命令
 */
export class ArchiveInAppNotifCommand {
  constructor(
    public readonly notifId: string,
    public readonly userId: string,
  ) {}
}
```

#### 3.1.2 站内信查询

```typescript
/**
 * @class GetInAppNotifsQuery
 * @description 获取站内通知列表查询
 */
export class GetInAppNotifsQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly type?: NotifType,
    public readonly status?: InAppNotifStatus,
    public readonly priority?: NotifPriority,
  ) {}
}

/**
 * @class GetInAppNotifStatsQuery
 * @description 获取站内通知统计查询
 */
export class GetInAppNotifStatsQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}
}
```

### 3.2 邮件通知子领域应用层

#### 3.2.1 邮件通知命令

```typescript
/**
 * @class CreateEmailNotifCommand
 * @description 创建邮件通知命令
 */
export class CreateEmailNotifCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly recipientEmail: string,
    public readonly subject: string,
    public readonly content: string,
    public readonly templateId?: string,
    public readonly metadata?: any,
  ) {}
}

/**
 * @class SendEmailNotifCommand
 * @description 发送邮件通知命令
 */
export class SendEmailNotifCommand {
  constructor(
    public readonly notifId: string,
    public readonly retryCount: number = 0,
  ) {}
}

/**
 * @class RetryEmailNotifCommand
 * @description 重试邮件通知命令
 */
export class RetryEmailNotifCommand {
  constructor(public readonly notifId: string) {}
}
```

#### 3.2.2 邮件通知查询

```typescript
/**
 * @class GetEmailNotifsQuery
 * @description 获取邮件通知列表查询
 */
export class GetEmailNotifsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId?: string,
    public readonly status?: EmailNotifStatus,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}

/**
 * @class GetEmailNotifStatsQuery
 * @description 获取邮件通知统计查询
 */
export class GetEmailNotifStatsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly groupBy?: 'day' | 'week' | 'month',
  ) {}
}
```

### 3.3 推送通知子领域应用层

#### 3.3.1 推送通知命令

```typescript
/**
 * @class CreatePushNotifCommand
 * @description 创建推送通知命令
 */
export class CreatePushNotifCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly deviceToken: string,
    public readonly title: string,
    public readonly body: string,
    public readonly data?: Record<string, any>,
    public readonly metadata?: any,
  ) {}
}

/**
 * @class SendPushNotifCommand
 * @description 发送推送通知命令
 */
export class SendPushNotifCommand {
  constructor(
    public readonly notifId: string,
    public readonly retryCount: number = 0,
  ) {}
}

/**
 * @class RegisterDeviceTokenCommand
 * @description 注册设备令牌命令
 */
export class RegisterDeviceTokenCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly deviceToken: string,
    public readonly deviceType: 'web' | 'ios' | 'android',
    public readonly deviceInfo?: any,
  ) {}
}
```

#### 3.3.2 推送通知查询

```typescript
/**
 * @class GetPushNotifsQuery
 * @description 获取推送通知列表查询
 */
export class GetPushNotifsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId?: string,
    public readonly status?: PushNotifStatus,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}

/**
 * @class GetDeviceTokensQuery
 * @description 获取设备令牌列表查询
 */
export class GetDeviceTokensQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly deviceType?: 'web' | 'ios' | 'android',
  ) {}
}
```

### 3.4 短信通知子领域应用层

#### 3.4.1 短信通知命令

```typescript
/**
 * @class CreateSmsNotifCommand
 * @description 创建短信通知命令
 */
export class CreateSmsNotifCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly recipientPhone: string,
    public readonly content: string,
    public readonly provider: SMSProvider,
    public readonly metadata?: any,
  ) {}
}

/**
 * @class SendSmsNotifCommand
 * @description 发送短信通知命令
 */
export class SendSmsNotifCommand {
  constructor(
    public readonly notifId: string,
    public readonly retryCount: number = 0,
  ) {}
}

/**
 * @class RetrySmsNotifCommand
 * @description 重试短信通知命令
 */
export class RetrySmsNotifCommand {
  constructor(public readonly notifId: string) {}
}
```

#### 3.4.2 短信通知查询

```typescript
/**
 * @class GetSmsNotifsQuery
 * @description 获取短信通知列表查询
 */
export class GetSmsNotifsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId?: string,
    public readonly status?: SmsNotifStatus,
    public readonly provider?: SMSProvider,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
  ) {}
}

/**
 * @class GetSMSCostStatsQuery
 * @description 获取短信成本统计查询
 */
export class GetSMSCostStatsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly groupBy?: 'day' | 'week' | 'month' | 'provider',
  ) {}
}
```

### 3.5 通知编排子领域应用层

#### 3.5.1 通知编排命令

```typescript
/**
 * @class OrchestrateNotifCommand
 * @description 编排通知发送命令
 */
export class OrchestrateNotifCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly metadata?: any,
    public readonly isUrgent: boolean = false,
    public readonly preferredChannels?: NotifChannel[],
  ) {}
}

/**
 * @class BatchOrchestrateNotifCommand
 * @description 批量编排通知发送命令
 */
export class BatchOrchestrateNotifCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientIds: string[],
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly metadata?: any,
    public readonly isUrgent: boolean = false,
    public readonly preferredChannels?: NotifChannel[],
  ) {}
}
```

#### 3.5.2 通知编排查询

```typescript
/**
 * @class GetNotifOrchestrationStatsQuery
 * @description 获取通知编排统计查询
 */
export class GetNotifOrchestrationStatsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly groupBy?: 'channel' | 'type' | 'day' | 'week' | 'month',
  ) {}
}
```

### 3.6 命令处理器

#### 3.6.1 站内信命令处理器

```typescript
/**
 * @class CreateInAppNotifHandler
 * @description 创建站内通知命令处理器，使用事件驱动
 */
@CommandHandler(CreateInAppNotifCommand)
export class CreateInAppNotifHandler
  implements ICommandHandler<CreateInAppNotifCommand>
{
  constructor(
    private readonly inAppNotifRepository: IInAppNotifRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateInAppNotifCommand): Promise<void> {
    // 创建站内通知聚合根
    const notif = InAppNotif.create(
      NotifId.generate(),
      new TenantId(command.tenantId),
      new UserId(command.recipientId),
      command.type,
      command.title,
      command.content,
      command.priority,
      command.metadata,
    );

    // 保存到仓储
    await this.inAppNotifRepository.save(notif);

    // 发布领域事件到事件总线（异步处理）
    await this.eventBus.publishAll(notif.getUncommittedEvents());
    notif.markEventsAsCommitted();
  }
}

/**
 * @class MarkInAppNotifAsReadHandler
 * @description 标记站内通知已读命令处理器，使用事件驱动
 */
@CommandHandler(MarkInAppNotifAsReadCommand)
export class MarkInAppNotifAsReadHandler
  implements ICommandHandler<MarkInAppNotifAsReadCommand>
{
  constructor(
    private readonly inAppNotifRepository: IInAppNotifRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: MarkInAppNotifAsReadCommand): Promise<void> {
    // 查询聚合根
    const notif = await this.inAppNotifRepository.findById(
      new NotifId(command.notifId),
    );

    if (!notif) {
      throw new InAppNotifNotFoundError(command.notifId);
    }

    // 调用业务方法，会发布事件
    notif.markAsRead(command.userId);
    await this.inAppNotifRepository.save(notif);

    // 发布领域事件
    await this.eventBus.publishAll(notif.getUncommittedEvents());
    notif.markEventsAsCommitted();
  }
}

/**
 * @class ArchiveInAppNotifHandler
 * @description 归档站内通知命令处理器，使用事件驱动
 */
@CommandHandler(ArchiveInAppNotifCommand)
export class ArchiveInAppNotifHandler
  implements ICommandHandler<ArchiveInAppNotifCommand>
{
  constructor(
    private readonly inAppNotifRepository: IInAppNotifRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: ArchiveInAppNotifCommand): Promise<void> {
    const notif = await this.inAppNotifRepository.findById(
      new NotifId(command.notifId),
    );

    if (!notif) {
      throw new InAppNotifNotFoundError(command.notifId);
    }

    // 归档是重要操作，发布事件
    notif.archive(command.userId);
    await this.inAppNotifRepository.save(notif);

    // 发布领域事件
    await this.eventBus.publishAll(notif.getUncommittedEvents());
    notif.markEventsAsCommitted();
  }
}
```

#### 3.6.2 邮件通知命令处理器

```typescript
/**
 * @class CreateEmailNotifHandler
 * @description 创建邮件通知命令处理器，使用事件驱动
 */
@CommandHandler(CreateEmailNotifCommand)
export class CreateEmailNotifHandler
  implements ICommandHandler<CreateEmailNotifCommand>
{
  constructor(
    private readonly emailNotifRepository: IEmailNotifRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateEmailNotifCommand): Promise<void> {
    // 创建邮件通知聚合根
    const notif = new EmailNotif(
      NotifId.generate(),
      new TenantId(command.tenantId),
      new UserId(command.recipientId),
      command.recipientEmail,
      command.subject,
      command.content,
      command.templateId ? new TemplateId(command.templateId) : undefined,
    );

    // 保存到仓储
    await this.emailNotifRepository.save(notif);

    // 发布领域事件
    await this.eventBus.publishAll(notif.getUncommittedEvents());
    notif.markEventsAsCommitted();
  }
}

/**
 * @class SendEmailNotifHandler
 * @description 发送邮件通知命令处理器，使用事件驱动
 */
@CommandHandler(SendEmailNotifCommand)
export class SendEmailNotifHandler
  implements ICommandHandler<SendEmailNotifCommand>
{
  constructor(
    private readonly emailNotifRepository: IEmailNotifRepository,
    private readonly emailService: IEmailService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: SendEmailNotifCommand): Promise<void> {
    const notif = await this.emailNotifRepository.findById(
      new NotifId(command.notifId),
    );

    if (!notif) {
      throw new EmailNotifNotFoundError(command.notifId);
    }

    try {
      // 标记为发送中
      notif.markAsSending();
      await this.emailNotifRepository.save(notif);

      // 发布发送中事件
      await this.eventBus.publishAll(notif.getUncommittedEvents());
      notif.markEventsAsCommitted();

      // 发送邮件
      await this.emailService.sendEmail({
        to: notif.getRecipientEmail(),
        subject: notif.getSubject(),
        content: notif.getContent(),
      });

      // 标记为已发送
      notif.markAsSent();
      await this.emailNotifRepository.save(notif);

      // 发布已发送事件
      await this.eventBus.publishAll(notif.getUncommittedEvents());
      notif.markEventsAsCommitted();
    } catch (error) {
      // 标记为失败
      notif.markAsFailed(error.message);
      await this.emailNotifRepository.save(notif);

      // 发布失败事件
      await this.eventBus.publishAll(notif.getUncommittedEvents());
      notif.markEventsAsCommitted();
    }
  }
}
```

#### 3.6.3 推送通知命令处理器

```typescript
/**
 * @class CreatePushNotifHandler
 * @description 创建推送通知命令处理器，使用事件驱动
 */
@CommandHandler(CreatePushNotifCommand)
export class CreatePushNotifHandler
  implements ICommandHandler<CreatePushNotifCommand>
{
  constructor(
    private readonly pushNotifRepository: IPushNotifRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreatePushNotifCommand): Promise<void> {
    // 创建推送通知聚合根
    const notif = new PushNotif(
      NotifId.generate(),
      new TenantId(command.tenantId),
      new UserId(command.recipientId),
      command.deviceToken,
      command.title,
      command.body,
      command.data,
    );

    // 保存到仓储
    await this.pushNotifRepository.save(notif);

    // 发布领域事件
    await this.eventBus.publishAll(notif.getUncommittedEvents());
    notif.markEventsAsCommitted();
  }
}

/**
 * @class SendPushNotifHandler
 * @description 发送推送通知命令处理器，使用事件驱动
 */
@CommandHandler(SendPushNotifCommand)
export class SendPushNotifHandler
  implements ICommandHandler<SendPushNotifCommand>
{
  constructor(
    private readonly pushNotifRepository: IPushNotifRepository,
    private readonly pushService: IPushService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: SendPushNotifCommand): Promise<void> {
    const notif = await this.pushNotifRepository.findById(
      new NotifId(command.notifId),
    );

    if (!notif) {
      throw new PushNotifNotFoundError(command.notifId);
    }

    try {
      // 标记为发送中
      notif.markAsSending();
      await this.pushNotifRepository.save(notif);

      // 发布发送中事件
      await this.eventBus.publishAll(notif.getUncommittedEvents());
      notif.markEventsAsCommitted();

      // 发送推送
      const result = await this.pushService.sendPush({
        deviceToken: notif.getDeviceToken(),
        title: notif.getTitle(),
        body: notif.getBody(),
        data: notif.getData(),
      });

      if (result.success) {
        // 标记为已送达
        notif.markAsDelivered();
        await this.pushNotifRepository.save(notif);

        // 发布已送达事件
        await this.eventBus.publishAll(notif.getUncommittedEvents());
        notif.markEventsAsCommitted();
      } else {
        // 标记为失败
        notif.markAsFailed(result.error, result.errorCode);
        await this.pushNotifRepository.save(notif);

        // 发布失败事件
        await this.eventBus.publishAll(notif.getUncommittedEvents());
        notif.markEventsAsCommitted();
      }
    } catch (error) {
      // 标记为失败
      notif.markAsFailed(error.message, 'UNKNOWN_ERROR');
      await this.pushNotifRepository.save(notif);

      // 发布失败事件
      await this.eventBus.publishAll(notif.getUncommittedEvents());
      notif.markEventsAsCommitted();
    }
  }
}
```

#### 3.6.4 短信通知命令处理器

```typescript
/**
 * @class CreateSmsNotifHandler
 * @description 创建短信通知命令处理器，使用事件驱动
 */
@CommandHandler(CreateSmsNotifCommand)
export class CreateSmsNotifHandler
  implements ICommandHandler<CreateSmsNotifCommand>
{
  constructor(
    private readonly smsNotifRepository: ISmsNotifRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateSmsNotifCommand): Promise<void> {
    // 创建短信通知聚合根
    const notif = new SmsNotif(
      NotifId.generate(),
      new TenantId(command.tenantId),
      new UserId(command.recipientId),
      command.recipientPhone,
      command.content,
      command.provider,
    );

    // 保存到仓储
    await this.smsNotifRepository.save(notif);

    // 发布领域事件
    await this.eventBus.publishAll(notif.getUncommittedEvents());
    notif.markEventsAsCommitted();
  }
}

/**
 * @class SendSmsNotifHandler
 * @description 发送短信通知命令处理器，使用事件驱动
 */
@CommandHandler(SendSmsNotifCommand)
export class SendSmsNotifHandler
  implements ICommandHandler<SendSmsNotifCommand>
{
  constructor(
    private readonly smsNotifRepository: ISmsNotifRepository,
    private readonly smsService: ISMSService,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: SendSmsNotifCommand): Promise<void> {
    const notif = await this.smsNotifRepository.findById(
      new NotifId(command.notifId),
    );

    if (!notif) {
      throw new SmsNotifNotFoundError(command.notifId);
    }

    try {
      // 标记为发送中
      notif.markAsSending();
      await this.smsNotifRepository.save(notif);

      // 发布发送中事件
      await this.eventBus.publishAll(notif.getUncommittedEvents());
      notif.markEventsAsCommitted();

      // 发送短信
      const result = await this.smsService.sendSMS({
        phone: notif.getRecipientPhone(),
        content: notif.getContent(),
        provider: notif.getProvider(),
      });

      if (result.success) {
        // 标记为已发送
        notif.markAsSent();
        await this.smsNotifRepository.save(notif);

        // 发布已发送事件
        await this.eventBus.publishAll(notif.getUncommittedEvents());
        notif.markEventsAsCommitted();
      } else {
        // 标记为失败
        notif.markAsFailed(result.error);
        await this.smsNotifRepository.save(notif);

        // 发布失败事件
        await this.eventBus.publishAll(notif.getUncommittedEvents());
        notif.markEventsAsCommitted();
      }
    } catch (error) {
      // 标记为失败
      notif.markAsFailed(error.message);
      await this.smsNotifRepository.save(notif);

      // 发布失败事件
      await this.eventBus.publishAll(notif.getUncommittedEvents());
      notif.markEventsAsCommitted();
    }
  }
}
```

#### 3.6.5 通知编排命令处理器

```typescript
/**
 * @class OrchestrateNotifHandler
 * @description 编排通知发送命令处理器，协调各频道子领域
 */
@CommandHandler(OrchestrateNotifCommand)
export class OrchestrateNotifHandler
  implements ICommandHandler<OrchestrateNotifCommand>
{
  constructor(private readonly notifOrchestrator: NotifOrchestrator) {}

  async execute(command: OrchestrateNotifCommand): Promise<void> {
    // 构建通知请求
    const request: NotifRequest = {
      tenantId: command.tenantId,
      recipientId: command.recipientId,
      type: command.type,
      title: command.title,
      content: command.content,
      metadata: command.metadata,
      isUrgent: command.isUrgent,
      preferredChannels: command.preferredChannels,
    };

    // 调用编排服务
    await this.notifOrchestrator.orchestrateNotif(request);
  }
}

/**
 * @class BatchOrchestrateNotifHandler
 * @description 批量编排通知发送命令处理器
 */
@CommandHandler(BatchOrchestrateNotifCommand)
export class BatchOrchestrateNotifHandler
  implements ICommandHandler<BatchOrchestrateNotifCommand>
{
  constructor(private readonly notifOrchestrator: NotifOrchestrator) {}

  async execute(command: BatchOrchestrateNotifCommand): Promise<void> {
    // 并行处理批量通知
    const promises = command.recipientIds.map(recipientId => {
      const request: NotifRequest = {
        tenantId: command.tenantId,
        recipientId,
        type: command.type,
        title: command.title,
        content: command.content,
        metadata: command.metadata,
        isUrgent: command.isUrgent,
        preferredChannels: command.preferredChannels,
      };

      return this.notifOrchestrator.orchestrateNotif(request);
    });

    // 等待所有通知处理完成
    await Promise.allSettled(promises);
  }
}
```

### 3.3 查询处理器

#### 3.3.1 GetUserNotifsHandler (直接查询)

```typescript
@QueryHandler(GetUserNotifsQuery)
export class GetUserNotifsHandler implements IQueryHandler<GetUserNotifsQuery> {
  constructor(private readonly notifRepository: INotifRepository) {}

  async execute(query: GetUserNotifsQuery): Promise<NotifListDto> {
    // 直接查询，不使用事件驱动
    const notifs = await this.notifRepository.findByUser(
      new UserId(query.userId),
      new TenantId(query.tenantId),
      query.page,
      query.limit,
      query.type,
      query.status,
    );

    return new NotifListDto(
      notifs.map(n => new NotifDto(n)),
      query.page,
      query.limit,
    );
  }
}
```

### 3.4 异步事件处理器

#### 3.4.1 通知事件处理器

```typescript
/**
 * @class NotificationEventProcessor
 * @description 通知事件异步处理器，使用Redis + Bull消息队列
 */
@Processor('notification_events')
export class NotificationEventProcessor {
  constructor(
    private readonly notifService: NotifService,
    private readonly logger: Logger,
  ) {}

  /**
   * @method handleInAppNotifCreated
   * @description 处理站内通知创建事件
   */
  @Process('InAppNotifCreatedEvent')
  async handleInAppNotifCreated(
    job: Job<InAppNotifCreatedEvent>,
  ): Promise<void> {
    const event = job.data;
    try {
      // 并行处理多个后续操作
      await Promise.allSettled([
        this.updateNotificationStats(event),
        this.sendRealTimeNotification(event),
        this.logAuditEvent(event),
      ]);

      this.logger.log(
        `InAppNotifCreatedEvent processed successfully: ${event.notifId.value}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process InAppNotifCreatedEvent: ${event.notifId.value}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method handleEmailNotifSent
   * @description 处理邮件通知发送事件
   */
  @Process('EmailNotifSentEvent')
  async handleEmailNotifSent(job: Job<EmailNotifSentEvent>): Promise<void> {
    const event = job.data;
    try {
      // 并行处理多个后续操作
      await Promise.allSettled([
        this.updateDeliveryStats(event),
        this.sendDeliveryConfirmation(event),
        this.logEmailDelivery(event),
      ]);

      this.logger.log(
        `EmailNotifSentEvent processed successfully: ${event.notifId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process EmailNotifSentEvent: ${event.notifId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method handlePushNotifDelivered
   * @description 处理推送通知送达事件
   */
  @Process('PushNotifDeliveredEvent')
  async handlePushNotifDelivered(
    job: Job<PushNotifDeliveredEvent>,
  ): Promise<void> {
    const event = job.data;
    try {
      // 并行处理多个后续操作
      await Promise.allSettled([
        this.updatePushStats(event),
        this.trackUserEngagement(event),
        this.logPushDelivery(event),
      ]);

      this.logger.log(
        `PushNotifDeliveredEvent processed successfully: ${event.notifId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process PushNotifDeliveredEvent: ${event.notifId}`,
        error,
      );
      throw error;
    }
  }

  private async updateNotificationStats(
    event: InAppNotifCreatedEvent,
  ): Promise<void> {
    // 更新通知统计信息
  }

  private async sendRealTimeNotification(
    event: InAppNotifCreatedEvent,
  ): Promise<void> {
    // 发送实时通知
  }

  private async logAuditEvent(event: InAppNotifCreatedEvent): Promise<void> {
    // 记录审计日志
  }

  private async updateDeliveryStats(event: EmailNotifSentEvent): Promise<void> {
    // 更新邮件送达统计
  }

  private async sendDeliveryConfirmation(
    event: EmailNotifSentEvent,
  ): Promise<void> {
    // 发送送达确认
  }

  private async logEmailDelivery(event: EmailNotifSentEvent): Promise<void> {
    // 记录邮件送达日志
  }

  private async updatePushStats(event: PushNotifDeliveredEvent): Promise<void> {
    // 更新推送统计
  }

  private async trackUserEngagement(
    event: PushNotifDeliveredEvent,
  ): Promise<void> {
    // 跟踪用户参与度
  }

  private async logPushDelivery(event: PushNotifDeliveredEvent): Promise<void> {
    // 记录推送送达日志
  }
}
```

#### 3.4.2 跨模块事件处理器

```typescript
/**
 * @class CrossModuleEventProcessor
 * @description 跨模块事件处理器，处理来自其他业务模块的事件
 */
@Processor('cross_module_events')
export class CrossModuleEventProcessor {
  constructor(
    private readonly notifOrchestrator: NotifOrchestrator,
    private readonly logger: Logger,
  ) {}

  /**
   * @method handleUserRegistered
   * @description 处理用户注册事件，自动发送欢迎通知
   */
  @Process('UserRegisteredEvent')
  async handleUserRegistered(job: Job<UserRegisteredEvent>): Promise<void> {
    const event = job.data;
    try {
      // 异步发送欢迎通知
      await this.notifOrchestrator.orchestrateNotif({
        tenantId: event.tenantId,
        recipientId: event.userId,
        type: NotifType.USER_REGISTERED,
        title: '欢迎加入平台',
        content: '感谢您注册我们的平台，祝您使用愉快！',
        isUrgent: false,
      });

      this.logger.log(`Welcome notification sent for user: ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome notification for user: ${event.userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method handlePermissionChanged
   * @description 处理权限变更事件，通知相关用户
   */
  @Process('PermissionChangedEvent')
  async handlePermissionChanged(
    job: Job<PermissionChangedEvent>,
  ): Promise<void> {
    const event = job.data;
    try {
      // 异步发送权限变更通知
      await this.notifOrchestrator.orchestrateNotif({
        tenantId: event.tenantId,
        recipientId: event.userId,
        type: NotifType.USER_PERMISSION_CHANGED,
        title: '权限变更通知',
        content: '您的账户权限已发生变更，请查看详细信息。',
        metadata: {
          oldPermissions: event.oldPermissions,
          newPermissions: event.newPermissions,
        },
        isUrgent: true,
      });

      this.logger.log(
        `Permission change notification sent for user: ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send permission change notification for user: ${event.userId}`,
        error,
      );
      throw error;
    }
  }
}
```

## 4. 基础设施层设计

### 4.1 消息队列服务

#### 4.1.1 NotificationMessageQueueService

```typescript
/**
 * @class NotificationMessageQueueService
 * @description 通知消息队列服务，负责发布和处理通知相关事件
 */
@Injectable()
export class NotificationMessageQueueService {
  private readonly queues: Map<string, Queue> = new Map();

  constructor(
    private readonly bullModule: BullModule,
    private readonly logger: Logger,
  ) {}

  /**
   * @method publishNotificationEvent
   * @description 发布通知事件到消息队列
   */
  async publishNotificationEvent(event: IDomainEvent): Promise<void> {
    try {
      const queue = this.getQueue('notification_events');
      await queue.add(
        'process_notification_event',
        {
          eventId: event.eventId,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          eventData: event.toJSON(),
          occurredOn: event.occurredOn,
          tenantId: this.extractTenantId(event),
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );

      this.logger.log(
        `Notification event published: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish notification event: ${event.eventType}`,
        error,
      );
      throw new MessagePublishError(
        `Failed to publish notification event: ${error.message}`,
      );
    }
  }

  /**
   * @method publishCrossModuleEvent
   * @description 发布跨模块事件到消息队列
   */
  async publishCrossModuleEvent(event: IDomainEvent): Promise<void> {
    try {
      const queue = this.getQueue('cross_module_events');
      await queue.add(
        'process_cross_module_event',
        {
          eventId: event.eventId,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          eventData: event.toJSON(),
          occurredOn: event.occurredOn,
          tenantId: this.extractTenantId(event),
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      );

      this.logger.log(
        `Cross-module event published: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish cross-module event: ${event.eventType}`,
        error,
      );
      throw new MessagePublishError(
        `Failed to publish cross-module event: ${error.message}`,
      );
    }
  }

  /**
   * @method getQueue
   * @description 获取或创建消息队列
   */
  private getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        },
      });
      this.queues.set(queueName, queue);
    }
    return this.queues.get(queueName)!;
  }

  /**
   * @method extractTenantId
   * @description 从事件中提取租户ID
   */
  private extractTenantId(event: IDomainEvent): string | undefined {
    if ('tenantId' in event) {
      return (event as any).tenantId?.value || (event as any).tenantId;
    }
    return undefined;
  }
}
```

### 4.2 事件总线服务

#### 4.2.1 NotificationEventBusService

```typescript
/**
 * @class NotificationEventBusService
 * @description 通知事件总线服务，负责事件存储和消息队列发布
 */
@Injectable()
export class NotificationEventBusService {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly messageQueueService: NotificationMessageQueueService,
    private readonly logger: Logger,
  ) {}

  /**
   * @method publish
   * @description 发布单个事件
   */
  async publish(event: IDomainEvent): Promise<void> {
    try {
      // 1. 保存到事件存储
      await this.eventStore.saveEvent(event);

      // 2. 发布到消息队列
      await this.messageQueueService.publishNotificationEvent(event);

      this.logger.log(
        `Event published: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.eventType}`, error);
      throw new EventPublishError(`Failed to publish event: ${error.message}`);
    }
  }

  /**
   * @method publishAll
   * @description 批量发布事件
   */
  async publishAll(events: IDomainEvent[]): Promise<void> {
    const publishPromises = events.map(event => this.publish(event));
    await Promise.allSettled(publishPromises);
  }

  /**
   * @method publishCrossModuleEvent
   * @description 发布跨模块事件
   */
  async publishCrossModuleEvent(event: IDomainEvent): Promise<void> {
    try {
      // 1. 保存到事件存储
      await this.eventStore.saveEvent(event);

      // 2. 发布到跨模块消息队列
      await this.messageQueueService.publishCrossModuleEvent(event);

      this.logger.log(
        `Cross-module event published: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish cross-module event: ${event.eventType}`,
        error,
      );
      throw new EventPublishError(
        `Failed to publish cross-module event: ${error.message}`,
      );
    }
  }
}
```

### 4.3 仓储实现

#### 4.1.1 NotifRepository (混合策略)

```typescript
@Injectable()
export class NotifRepository implements INotifRepository {
  constructor(
    private readonly databaseAdapter: IDatabaseAdapter,
    private readonly eventStore: IEventStore,
  ) {}

  async save(notification: InAppNotif): Promise<void> {
    // 保存聚合根状态到关系数据库
    await this.databaseAdapter.execute(
      'INSERT INTO notifications (id, tenant_id, recipient_id, type, title, content, metadata, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        notification.getId().value,
        notification.getTenantId().value,
        notification.getRecipientId().value,
        notification.getType(),
        notification.getTitle(),
        notification.getContent(),
        JSON.stringify(notification.getMetadata()),
        notification.getStatus(),
        notification.getCreatedAt(),
        notification.getUpdatedAt(),
      ],
    );

    // 只有有未提交事件时才保存到事件存储
    const uncommittedEvents = notification.getUncommittedEvents();
    if (uncommittedEvents.length > 0) {
      await this.eventStore.saveEvents(
        notification.getId().value,
        uncommittedEvents,
      );
    }
  }

  async findById(id: NotifId): Promise<InAppNotif | null> {
    // 优先从关系数据库查询，性能更好
    const row = await this.databaseAdapter.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id.value],
    );

    if (!row || row.length === 0) {
      return null;
    }

    // 从关系数据库重建聚合根
    return this.rebuildFromRow(row[0]);
  }

  async findByUser(
    userId: UserId,
    tenantId: TenantId,
    page: number,
    limit: number,
    type?: NotifType,
    status?: NotifStatus,
  ): Promise<InAppNotif[]> {
    // 直接查询关系数据库，性能更好
    const offset = (page - 1) * limit;
    let query = `
      SELECT * FROM notifications 
      WHERE recipient_id = ? AND tenant_id = ?
    `;
    const params: any[] = [userId.value, tenantId.value];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await this.databaseAdapter.query(query, params);

    // 从关系数据库重建聚合根
    return rows.map(row => this.rebuildFromRow(row));
  }

  private rebuildFromRow(row: any): InAppNotif {
    // 从关系数据库行重建聚合根
    return new InAppNotif(
      new NotifId(row.id),
      new TenantId(row.tenant_id),
      new UserId(row.recipient_id),
      row.type as NotifType,
      row.title,
      row.content,
      JSON.parse(row.metadata || '{}'),
      row.status as NotifStatus,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
```

### 4.2 通知渠道适配器

#### 4.2.1 EmailChannelAdapter

```typescript
@Injectable()
export class EmailChannelAdapter implements INotifChannelAdapter {
  constructor(
    private readonly emailService: IEmailService,
    private readonly templateService: ITemplateService,
  ) {}

  async send(
    notification: InAppNotif,
    recipient: User,
  ): Promise<ChannelResult> {
    try {
      // 获取邮件模板
      const template = await this.templateService.getTemplate(
        notification.getType(),
        NotifChannel.EMAIL,
      );

      // 渲染模板
      const rendered = template.render({
        title: notification.getTitle(),
        content: notification.getContent(),
        recipientName: recipient.getName(),
        // 其他变量...
      });

      // 发送邮件
      await this.emailService.send({
        to: recipient.getEmail(),
        subject: rendered.subject,
        html: rendered.content,
        metadata: notification.getMetadata(),
      });

      return new ChannelResult(
        NotifChannel.EMAIL,
        ChannelStatus.SUCCESS,
        new Date(),
      );
    } catch (error) {
      return new ChannelResult(
        NotifChannel.EMAIL,
        ChannelStatus.FAILED,
        new Date(),
        error.message,
      );
    }
  }
}
```

### 4.3 事件存储 (简化版)

#### 4.3.1 EventStore

```typescript
@Injectable()
export class EventStore implements IEventStore {
  constructor(private readonly databaseAdapter: IDatabaseAdapter) {}

  async saveEvents(aggregateId: string, events: IDomainEvent[]): Promise<void> {
    // 只保存重要的事件，用于审计和统计
    const eventRecords = events.map(event => ({
      id: event.eventId,
      aggregate_id: aggregateId,
      event_type: event.eventType,
      event_data: JSON.stringify(event),
      occurred_on: event.occurredOn,
      version: this.getNextVersion(aggregateId),
    }));

    await this.databaseAdapter.execute(
      'INSERT INTO domain_events (id, aggregate_id, event_type, event_data, occurred_on, version) VALUES (?, ?, ?, ?, ?, ?)',
      eventRecords.flatMap(record => [
        record.id,
        record.aggregate_id,
        record.event_type,
        record.event_data,
        record.occurred_on,
        record.version,
      ]),
    );
  }

  async getEvents(aggregateId: string): Promise<IDomainEvent[]> {
    // 主要用于审计和统计，不是主要的查询路径
    const rows = await this.databaseAdapter.query(
      'SELECT * FROM domain_events WHERE aggregate_id = ? ORDER BY version ASC',
      [aggregateId],
    );

    return rows.map(row => this.deserializeEvent(row));
  }

  private deserializeEvent(row: any): IDomainEvent {
    const eventData = JSON.parse(row.event_data);
    // 根据事件类型反序列化
    switch (row.event_type) {
      case 'NotifCreated':
        return new NotifCreatedEvent(
          eventData.notifId,
          eventData.tenantId,
          eventData.recipientId,
          eventData.type,
          eventData.title,
          eventData.content,
          eventData.metadata,
        );
      // 其他事件类型...
      default:
        throw new Error(`Unknown event type: ${row.event_type}`);
    }
  }
}
```

## 5. 接口层设计

### 5.1 控制器

#### 5.1.1 NotifController

```typescript
@Controller('notifications')
@UseGuards(AuthGuard, PermissionGuard)
export class NotifController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('notification:create')
  async createNotif(
    @Body() createNotifDto: CreateNotifDto,
    @CurrentUser() user: User,
  ): Promise<NotifDto> {
    const command = new CreateNotifCommand(
      createNotifDto.tenantId,
      createNotifDto.recipientId,
      createNotifDto.type,
      createNotifDto.title,
      createNotifDto.content,
      createNotifDto.metadata,
      createNotifDto.channels,
    );

    await this.commandBus.execute(command);

    // 返回创建的通知信息
    return new NotifDto(/* ... */);
  }

  @Get()
  @RequirePermissions('notification:read')
  async getUserNotifs(
    @Query() query: GetUserNotifsQueryDto,
    @CurrentUser() user: User,
  ): Promise<NotifListDto> {
    const queryCommand = new GetUserNotifsQuery(
      user.id,
      user.tenantId,
      query.page,
      query.limit,
      query.type,
      query.status,
    );

    return await this.queryBus.execute(queryCommand);
  }

  @Patch(':id/read')
  @RequirePermissions('notification:update')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    const command = new MarkNotifAsReadCommand(id, user.id);
    await this.commandBus.execute(command);
  }
}
```

### 5.2 DTO定义

#### 5.2.1 CreateNotifDto

```typescript
export class CreateNotifDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsEnum(NotifType)
  type: NotifType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsArray()
  @IsEnum(NotifChannel, { each: true })
  channels?: NotifChannel[];
}
```

## 6. 数据库设计

### 6.1 表结构设计

#### 6.1.1 notifications表

```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant_recipient (tenant_id, recipient_id),
    INDEX idx_tenant_type (tenant_id, type),
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_created_at (created_at)
);
```

#### 6.1.2 domain_events表

```sql
CREATE TABLE domain_events (
    id VARCHAR(36) PRIMARY KEY,
    aggregate_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    occurred_on TIMESTAMP NOT NULL,
    version INTEGER NOT NULL,

    INDEX idx_aggregate_id (aggregate_id),
    INDEX idx_occurred_on (occurred_on)
);
```

#### 6.1.3 notification_templates表

```sql
CREATE TABLE notification_templates (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    channels JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant_type (tenant_id, type),
    INDEX idx_tenant_active (tenant_id, is_active)
);
```

### 6.2 数据隔离策略

#### 6.2.1 多租户数据隔离

```typescript
export class TenantDataIsolationService {
  async addTenantFilter(query: string, tenantId: string): Promise<string> {
    // 为查询添加租户过滤条件
    if (query.includes('WHERE')) {
      return query.replace('WHERE', `WHERE tenant_id = '${tenantId}' AND`);
    } else {
      return `${query} WHERE tenant_id = '${tenantId}'`;
    }
  }
}
```

## 7. 配置管理

### 7.1 通知配置

#### 7.1.1 NotifConfig

```typescript
@Injectable()
export class NotifConfig {
  constructor(private readonly configService: ConfigService) {}

  get emailConfig(): EmailConfig {
    return {
      host: this.configService.get('NOTIFICATION_EMAIL_HOST'),
      port: this.configService.get('NOTIFICATION_EMAIL_PORT'),
      secure: this.configService.get('NOTIFICATION_EMAIL_SECURE'),
      auth: {
        user: this.configService.get('NOTIFICATION_EMAIL_USER'),
        pass: this.configService.get('NOTIFICATION_EMAIL_PASS'),
      },
    };
  }

  get rateLimitConfig(): RateLimitConfig {
    return {
      maxRequests: this.configService.get('NOTIFICATION_RATE_LIMIT_MAX', 1000),
      windowMs: this.configService.get(
        'NOTIFICATION_RATE_LIMIT_WINDOW',
        3600000,
      ),
    };
  }
}
```

## 8. 错误处理

### 8.1 自定义异常

#### 8.1.1 NotifException

```typescript
export class NotifException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'NotifException';
  }
}

export class NotifNotFoundError extends NotifException {
  constructor(notifId: string) {
    super(`Notif with ID ${notifId} not found`, 'NOTIFICATION_NOT_FOUND', 404);
  }
}

export class InvalidNotifTypeError extends NotifException {
  constructor(type: string) {
    super(
      `Invalid notification type: ${type}`,
      'INVALID_NOTIFICATION_TYPE',
      400,
    );
  }
}
```

### 8.2 全局异常过滤器

#### 8.2.1 NotifExceptionFilter

```typescript
@Catch(NotifException)
export class NotifExceptionFilter implements ExceptionFilter {
  catch(exception: NotifException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = {
      statusCode: exception.statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
      code: exception.code,
    };

    response.status(exception.statusCode).json(errorResponse);
  }
}
```

## 9. 测试策略

### 9.1 单元测试

#### 9.1.1 InAppNotif聚合根测试

```typescript
describe('InAppNotif', () => {
  let notification: InAppNotif;

  beforeEach(() => {
    notification = InAppNotif.create(
      NotifId.generate(),
      new TenantId('tenant-1'),
      new UserId('user-1'),
      NotifType.SYSTEM,
      'Test Title',
      'Test Content',
      {},
    );
  });

  it('should mark notification as read', () => {
    // Act
    notif.markAsRead();

    // Assert
    expect(notification.getStatus()).toBe(NotifStatus.READ);
    expect(notification.getUncommittedEvents()).toHaveLength(1);
    expect(notification.getUncommittedEvents()[0]).toBeInstanceOf(
      InAppNotifReadEvent,
    );
  });

  it('should not mark as read if already read', () => {
    // Arrange
    notif.markAsRead();
    const eventCount = notification.getUncommittedEvents().length;

    // Act
    notif.markAsRead();

    // Assert
    expect(notification.getUncommittedEvents()).toHaveLength(eventCount);
  });
});
```

### 9.2 集成测试

#### 9.2.1 NotifController测试

```typescript
describe('NotifController (Integration)', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotifModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    commandBus = app.get(CommandBus);
    queryBus = app.get(QueryBus);

    await app.init();
  });

  it('should create notification', async () => {
    // Arrange
    const createDto = new CreateNotifDto();
    createDto.tenantId = 'tenant-1';
    createDto.recipientId = 'user-1';
    createDto.type = NotifType.SYSTEM;
    createDto.title = 'Test Title';
    createDto.content = 'Test Content';

    // Act
    const result = await commandBus.execute(
      new CreateNotifCommand(
        createDto.tenantId,
        createDto.recipientId,
        createDto.type,
        createDto.title,
        createDto.content,
      ),
    );

    // Assert
    expect(result).toBeDefined();
  });
});
```

## 10. 部署和运维

### 10.1 Docker配置

#### 10.1.1 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 10.2 环境配置

#### 10.2.1 环境变量

```bash
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=notification_db
DATABASE_USER=notification_user
DATABASE_PASSWORD=notification_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# 邮件配置
NOTIFICATION_EMAIL_HOST=smtp.gmail.com
NOTIFICATION_EMAIL_PORT=587
NOTIFICATION_EMAIL_SECURE=false
NOTIFICATION_EMAIL_USER=your-email@gmail.com
NOTIFICATION_EMAIL_PASS=your-password

# 速率限制
NOTIFICATION_RATE_LIMIT_MAX=1000
NOTIFICATION_RATE_LIMIT_WINDOW=3600000
```

## 11. 总结

本技术设计方案基于DDD和Clean Architecture原则，为通知模块提供了完整的技术实现方案。主要特点包括：

### 11.1 架构优势

- **领域驱动**: 以业务领域为核心组织代码
- **全面事件驱动**: 所有业务操作都通过事件驱动，实现松耦合和最终一致性
- **异步处理**: 使用Redis + Bull消息队列实现异步事件处理
- **多租户支持**: 完整的数据隔离和权限控制
- **可扩展性**: 插件化架构支持新渠道接入
- **高可用性**: 分布式架构支持水平扩展
- **可靠性**: 重试机制和死信队列确保消息不丢失

### 11.2 技术特点

- **TypeScript**: 强类型支持，提高代码质量
- **NestJS**: 企业级框架，提供完整的依赖注入
- **PostgreSQL**: 关系型数据库，支持复杂查询
- **Redis**: 缓存和消息队列，提高性能
- **事件溯源**: 完整的状态变更历史记录

### 11.3 MVP实现重点

- **站内信通知**: 核心通知功能
- **邮件通知**: 基础外部通知渠道
- **多租户隔离**: 数据安全和权限控制
- **全面事件驱动**: 为后续扩展奠定基础，实现松耦合架构
- **消息队列集成**: Redis + Bull队列支持异步处理和重试机制

通过这个技术设计方案，我们可以构建一个现代化、可扩展、高可用的通知系统，满足SAAS平台的多租户需求。

### 11.4 聚合根与实体分离架构总结

本方案采用**聚合根与领域实体分离**的架构模式，实现了业务逻辑和基础设施功能的完美分离：

#### 架构特点：

- **聚合根**: 继承`EventSourcedAggregateRoot`，负责业务协调和事件发布
- **领域实体**: 继承`BaseEntity`，负责状态管理和基础设施功能
- **全面事件驱动**: 所有业务操作都通过事件驱动，保证架构一致性
- **异步处理**: 使用Redis + Bull消息队列实现异步事件处理
- **企业级功能**: 通过BaseEntity提供审计追踪、乐观锁、软删除等功能

#### 设计优势：

- **职责分离**: 聚合根专注业务协调，实体专注状态管理
- **基础设施复用**: 统一的审计和版本控制机制
- **可测试性**: 聚合根和实体可以独立测试
- **可维护性**: 业务逻辑和基础设施功能分离，便于维护
- **扩展性**: 支持新功能的快速扩展

这种架构模式既满足了项目的DDD+CQRS架构要求，又提供了企业级的基础设施功能，为后续的功能扩展奠定了坚实的技术基础。

---

## 📚 文档信息

**文档版本**: V2.0  
**创建日期**: 2024-01-01  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队

---

## 🔝 [返回顶部](#通知模块技术设计方案)

---

_本文档遵循项目的DDD+CQRS+事件溯源架构设计，采用全面事件驱动策略，为通知模块的开发和维护提供完整的技术指导。_
