# SAAS平台开发工作计划

## 概述

本文档基于项目的业务需求文档和技术设计文档，制定了一份完整的开发工作计划，旨在引导AI开发有序进行，确保项目按照DDD + Clean Architecture + CQRS + 事件溯源 + 事件驱动架构实现。

## 开发原则

- **架构优先**：严格按照DDD和Clean Architecture原则进行开发
- **事件驱动**：全面采用事件驱动架构，实现松耦合和异步处理
- **渐进式开发**：从单体应用开始，逐步演进到微服务架构
- **测试驱动**：每个模块都要有完整的测试覆盖
- **文档同步**：代码与文档保持同步更新
- **质量保证**：每个阶段都要进行代码检查和性能优化
- **设计先行**：开发前必须先查阅相关技术设计文档
- **共享优先**：创建值对象时优先使用共享模块中的值对象

## 当前进度总结

### ✅ 已完成的工作

#### 基础架构包开发 (100% 完成)

- **packages/common**: 公共基础包，包含常量、装饰器、异常、过滤器等
- **packages/core**: 核心架构包，包含DDD基础组件、事件溯源框架、事件驱动架构
- **packages/logging**: 日志模块，基于Pino的高性能日志系统
- **packages/config**: 配置模块，统一配置管理和验证
- **packages/cache**: 缓存模块，支持Redis和内存缓存
- **packages/database**: 数据库模块，重构完成多租户数据隔离架构
  - ✅ 三种隔离策略实现（数据库级、Schema级、表级）
  - ✅ 数据库适配器工厂模式
  - ✅ 租户感知仓储基类
  - ✅ 配置驱动的隔离策略切换
  - ✅ 完整的单元测试覆盖
- **packages/notification**: 通知模块，完整实现所有8个子领域

#### 用户模块开发 (30% 完成)

- **packages/user**: 用户管理模块
  - ✅ 用户领域实体 (UserEntity)
  - ✅ 用户聚合根 (UserAggregate)
  - ✅ 用户领域事件 (UserAssignedToTenantEvent)
  - ✅ 用户应用命令 (CreateUserCommand)
  - ✅ 用户应用查询 (GetUsersQuery)
  - ✅ 用户控制器 (UserController)
  - ✅ 用户应用服务 (UserApplicationService)
  - ✅ 用户仓储接口和实现 (IUserRepository, UserRepository)
  - ✅ 完整的TSDoc注释规范应用

#### 租户模块开发 (25% 完成)

- **packages/tenant**: 租户管理模块
  - ✅ 租户值对象 (TenantId, TenantSettings, TenantQuota, TenantConfiguration)
  - ✅ 租户领域实体 (TenantEntity)
  - ✅ 租户聚合根 (TenantAggregate)
  - ✅ 租户领域事件 (TenantCreatedEvent, TenantUpdatedEvent, TenantQuotaExceededEvent, TenantStatusChangedEvent)
  - ✅ 租户领域服务 (TenantDomainService)
  - ✅ 完整的TSDoc注释规范应用
  - ✅ 事件溯源支持
  - ✅ 多租户配额管理
  - ✅ 租户状态管理

#### 组织模块开发 (30% 完成)

- **packages/organization**: 组织管理模块
  - ✅ 组织值对象 (OrganizationId, OrganizationName, OrganizationDescription, OrganizationSettings)
  - ✅ 组织状态枚举 (OrganizationStatus, OrganizationStatusHelper)
  - ✅ 组织领域实体 (OrganizationEntity)
  - ✅ 组织聚合根 (OrganizationAggregate)
  - ✅ 组织领域事件 (OrganizationCreatedEvent, OrganizationUpdatedEvent, OrganizationStatusChangedEvent, OrganizationDeletedEvent)
  - ✅ 组织领域服务 (OrganizationDomainService)
  - ✅ 完整的TSDoc注释规范应用
  - ✅ 事件溯源支持
  - ✅ 组织状态管理
  - ✅ 组织设置和配置管理

#### 技术设计文档体系 (100% 完成)

- **完整技术设计文档体系**: 重新编写了完整的技术设计文档
  - ✅ 技术设计文档目录 (0-catalog.md)
  - ✅ 架构概述文档 (01-architecture-overview.md)
  - ✅ Clean Architecture分层设计 (02-clean-architecture-layers.md)
  - ✅ Entities层设计 (03-entities-layer.md)
  - ✅ Use Cases层设计 (04-use-cases-layer.md)
  - ✅ Interface Adapters层设计 (05-interface-adapters-layer.md)
  - ✅ Frameworks & Drivers层设计 (06-frameworks-drivers-layer.md)
  - ✅ 事件驱动架构设计 (07-event-driven-architecture.md)
  - ✅ 依赖倒置实施指南 (08-dependency-inversion-guide.md)
  - ✅ 模块结构设计指南 (09-module-structure-guide.md)
  - ✅ CQRS实现指南 (10-cqrs-implementation.md)
  - ✅ 测试策略文档 (11-testing-strategy.md)
  - ✅ 多租户数据隔离设计 (12-multitenant-data-isolation.md)
  - ✅ 事件溯源设计 (13-event-sourcing-design.md)
  - ✅ 适配器模式设计 (14-adapter-pattern-design.md)
  - ✅ 技术设计查阅指南更新

#### 事件驱动架构基础设施开发 (100% 完成)

- **核心基础设施组件**: 完整实现事件驱动架构基础设施
  - ✅ 事件存储服务 (EventStoreService) - 内存实现
  - ✅ 事件总线服务 (EventBusService) - 事件发布订阅管理
  - ✅ 消息队列服务 (MessageQueueService) - 异步消息处理
  - ✅ 事件处理器基类 (BaseEventHandler) - 重试机制和错误处理
  - ✅ 事件处理器服务 (EventProcessorService) - 事件路由和分发
  - ✅ 完整的使用示例和文档
  - ✅ 事件驱动架构完整示例

#### 测试配置 (100% 完成)

- 所有包的Jest测试配置已完善
- 测试脚本和依赖配置正确
- 创建了完整的测试配置指南文档
- 数据库模块单元测试全部通过
- 多租户数据隔离测试覆盖完整

#### 项目结构 (95% 完成)

- 混合架构项目结构已建立
- TypeScript + NestJS + Fastify环境已配置
- pnpm工作空间和包管理已设置
- ESLint、Prettier等开发工具已配置
- 事件驱动架构基础设施已设计

### 📊 代码统计

- **TypeScript文件**: 200+个
- **测试文件**: 19个
- **包数量**: 19个（包括基础架构包、业务模块包和通知模块8个子包）

#### 通知模块开发 (100% 完成)

- **packages/notification**: 通知模块，完整实现所有8个子领域
  - ✅ 站内信子领域 (`@aiofix/notif-in-app`)
  - ✅ 邮件通知子领域 (`@aiofix/notif-email`)
  - ✅ 推送通知子领域 (`@aiofix/notif-push`)
  - ✅ 短信通知子领域 (`@aiofix/notif-sms`)
  - ✅ 通知编排子领域 (`@aiofix/notif-orchestration`)
  - ✅ 通知分析子领域 (`@aiofix/notif-analytics`)
  - ✅ 通知模板子包 (`@aiofix/notif-template`)
  - ✅ 通知偏好子包 (`@aiofix/notif-preferences`)
  - ✅ 完整的DDD + Clean Architecture + CQRS + 事件驱动架构实现
  - ✅ 修复100+ TypeScript类型错误
  - ✅ 统一使用@aiofix/shared共享模块
  - ✅ 完整的事件驱动架构和事件溯源支持
  - ✅ 完整的TSDoc中文注释规范

### 🎯 下一步工作重点

1. **Use Cases层重构和开发** (最高优先级)
   - 重构现有应用服务为Use Cases层
   - 实现CQRS模式分离命令和查询
   - 实现命令处理器、查询处理器、事件处理器
   - 按照Clean Architecture架构重新组织代码

2. **现有模块事件驱动改造**
   - 用户模块事件驱动改造
   - 租户模块事件驱动改造
   - 组织模块事件驱动改造

3. **基础设施完善**
   - 完成Docker开发环境配置
   - 配置数据库连接和迁移
   - 配置Redis消息队列
   - 实现生产级事件存储（PostgreSQL/MongoDB）

4. **平台模块重构**
   - 重构平台模块领域层，符合业务需求
   - 实现平台管理服务
   - 实现系统配置和监控

5. **API接口开发**
   - 为通知模块开发RESTful API
   - 实现事件处理器和异步处理
   - 系统集成和端到端测试

6. **数据库模块生产级部署**
   - 实现生产级数据库适配器
   - 配置多租户数据隔离策略
   - 实现数据库连接池和性能监控
   - 配置行级安全策略

7. **技术设计文档应用**
   - 严格按照技术设计文档进行开发
   - 确保实现与设计文档完全一致
   - 使用技术设计查阅指南指导开发
   - 优先使用共享模块中的值对象

## 开发阶段规划

### 阶段1：项目基础架构搭建 (预计2-3周) - 100% 完成

#### 1.1 项目结构初始化

- [x] 创建混合架构项目结构
- [x] 配置TypeScript + NestJS + Fastify基础环境
- [x] 设置pnpm工作空间和包管理
- [x] 配置ESLint、Prettier、Husky等开发工具
- [ ] 创建Docker开发环境配置

#### 1.2 核心架构包开发

- [x] 开发`packages/common`公共基础包（简化后）
  - 常量定义、装饰器、异常、过滤器
  - 守卫、拦截器、管道、工具函数
  - 验证器、类型定义、测试数据工厂
- [x] 开发`packages/core`核心架构包
  - 领域基础组件（聚合根、领域事件、仓储接口）
  - 应用层基础组件（命令、查询、事件处理器）
  - 基础设施基础组件（事件存储、数据库适配器）
  - 事件驱动架构基础组件（事件总线、消息队列接口）
- [x] 开发独立功能模块包
  - [x] `packages/logging`日志模块
  - [x] `packages/config`配置模块
  - [x] `packages/cache`缓存模块
  - [x] `packages/notification`通知模块（完整实现所有8个子领域）
  - [x] `packages/database`数据库模块（重构完成多租户数据隔离架构）

#### 1.3 数据库配置

- [ ] 配置PostgreSQL数据库连接
- [ ] 配置MongoDB数据库连接
- [ ] 配置Redis缓存和消息队列
- [ ] 设置MikroORM多数据库支持
- [ ] 创建数据库迁移脚本

#### 1.4 事件驱动架构基础设施

- [x] 实现消息队列服务（内存实现）
- [x] 实现事件总线服务
- [x] 实现异步事件处理器
- [x] 配置事件存储（内存实现）
- [x] 配置事件重试和死信队列
- [ ] 实现生产级消息队列服务（Redis + Bull）
- [ ] 实现生产级事件存储（PostgreSQL/MongoDB）

#### 1.5 基础服务配置

- [ ] 配置CQRS模块
- [ ] 配置事件总线
- [x] 集成独立模块
  - [x] 配置日志模块（@aiofix/logging）
  - [x] 配置配置模块（@aiofix/config）
  - [x] 配置缓存模块（@aiofix/cache）
  - [x] 配置通知模块（@aiofix/notification）（已完成）
  - [x] 配置数据库模块（@aiofix/database）
- [ ] 配置监控和指标收集

### 阶段2：事件驱动架构基础设施开发 (预计2-3周) - 100% 完成

#### 2.1 消息队列服务开发

- [x] 实现`MessageQueueService`消息队列服务（内存实现）
- [x] 实现消息序列化和反序列化
- [x] 实现消息重试和死信队列
- [x] 实现消息监控和统计
- [ ] 实现Redis + Bull队列集成（生产级）

#### 2.2 事件总线服务开发

- [x] 实现`EventBusService`事件总线服务
- [x] 实现事件存储和消息队列集成
- [x] 实现事件发布和订阅机制
- [x] 实现事件版本控制
- [x] 实现事件监控和审计

#### 2.3 异步事件处理器开发

- [x] 实现`BaseEventHandler`事件处理器基类
- [x] 实现`EventProcessorService`事件处理器服务
- [x] 实现事件处理重试机制
- [x] 实现事件处理监控
- [x] 实现事件处理错误恢复
- [ ] 实现Bull队列处理器装饰器（生产级）

### 阶段3：通知模块开发 (预计4-5周) - 100% 完成

#### 3.1 站内信子领域开发

- [x] 实现`InAppNotif`聚合根
- [x] 实现站内信值对象和枚举
- [x] 实现站内信领域事件
- [x] 实现站内信应用层（命令、查询、处理器）
- [x] 实现站内信基础设施层（仓储、数据库实体）
- [x] 实现站内信接口层（控制器、DTO）

#### 3.2 邮件通知子领域开发

- [x] 实现`EmailNotif`和`EmailTemplate`聚合根
- [x] 实现邮件通知值对象和枚举
- [x] 实现邮件通知领域事件
- [x] 实现邮件通知应用层（命令、查询、处理器）
- [x] 实现邮件通知基础设施层（仓储、外部服务适配器）
- [x] 实现邮件通知接口层（控制器、DTO）

#### 3.3 推送通知子领域开发

- [x] 实现`PushNotif`和`PushChannel`聚合根
- [x] 实现推送通知值对象和枚举
- [x] 实现推送通知领域事件
- [x] 实现推送通知应用层（命令、查询、处理器）
- [x] 实现推送通知基础设施层（仓储、外部服务适配器）
- [x] 实现推送通知接口层（控制器、DTO）

#### 3.4 短信通知子领域开发

- [x] 实现`SmsNotif`和`SmsProvider`聚合根
- [x] 实现短信通知值对象和枚举
- [x] 实现短信通知领域事件
- [x] 实现短信通知应用层（命令、查询、处理器）
- [x] 实现短信通知基础设施层（仓储、外部服务适配器）
- [x] 实现短信通知接口层（控制器、DTO）

#### 3.5 通知编排子领域开发

- [x] 实现`NotifOrchestrator`通知编排服务
- [x] 实现通知策略和路由
- [x] 实现通知编排应用层（命令、查询、处理器）
- [x] 实现通知编排基础设施层（仓储、外部服务适配器）
- [x] 实现通知编排接口层（控制器、DTO）

#### 3.6 通知分析子领域开发

- [x] 实现通知分析聚合根和实体
- [x] 实现通知分析值对象和枚举
- [x] 实现通知分析领域事件
- [x] 实现通知分析应用层（命令、查询、处理器）
- [x] 实现通知分析基础设施层（仓储、数据库实体）
- [x] 实现通知分析接口层（控制器、DTO）

#### 3.7 通知模板子领域开发

- [x] 实现`EmailTemplate`聚合根
- [x] 实现模板值对象和枚举
- [x] 实现模板领域事件
- [x] 实现模板应用层（命令、查询、处理器）
- [x] 实现模板基础设施层（仓储、数据库实体）
- [x] 实现模板接口层（控制器、DTO）

#### 3.8 通知偏好子领域开发

- [x] 实现`NotifPreferences`聚合根
- [x] 实现偏好值对象和枚举
- [x] 实现偏好领域事件
- [x] 实现偏好应用层（命令、查询、处理器）
- [x] 实现偏好基础设施层（仓储、数据库实体）
- [x] 实现偏好接口层（控制器、DTO）

### 阶段4：核心领域模型开发 (预计3-4周)

#### 4.1 事件溯源基础框架

- [x] 实现`EventSourcedAggregateRoot`基类
- [x] 实现`DomainEvent`基类和事件接口
- [ ] 实现事件存储服务`IEventStore`
- [ ] 实现聚合快照机制
- [ ] 实现事件版本控制和乐观锁

#### 4.2 用户领域模型 (30% 完成)

- [x] 实现`User`聚合根
  - ✅ 用户创建、更新、删除业务逻辑
  - ✅ 用户状态管理（激活、禁用、锁定）
  - ✅ 用户资料管理
- [x] 实现用户相关值对象
  - ✅ `UserProfile`、`UserPreferences`
  - [ ] `UserSession`、`DeviceInfo`
- [x] 实现用户领域事件
  - ✅ `UserAssignedToTenantEvent`
  - [ ] `UserCreatedEvent`、`UserUpdatedEvent`
  - [ ] `UserProfileUpdatedEvent`、`UserStatusChangedEvent`
- [x] 实现用户应用层组件
  - ✅ `CreateUserCommand`、`GetUsersQuery`
  - ✅ `UserApplicationService`
  - ✅ `UserController`
- [x] 实现用户仓储
  - ✅ `IUserRepository`接口
  - ✅ `UserRepository`实现
- [ ] 实现用户领域服务
  - 邮箱唯一性验证
  - 密码强度验证和加密
  - 用户会话管理

#### 4.3 用户Use Cases层开发 (新增)

- [ ] 实现用户命令处理器
  - [ ] `CreateUserCommandHandler`
  - [ ] `UpdateUserCommandHandler`
  - [ ] `DeleteUserCommandHandler`
  - [ ] `AssignUserToTenantCommandHandler`
  - [ ] `RemoveUserFromTenantCommandHandler`
- [ ] 实现用户查询处理器
  - [ ] `GetUserQueryHandler`
  - [ ] `GetUsersQueryHandler`
  - [ ] `GetUsersByTenantQueryHandler`
  - [ ] `GetUsersByOrganizationQueryHandler`
  - [ ] `SearchUsersQueryHandler`
- [ ] 实现用户应用服务
  - [ ] `UserApplicationService`重构
  - [ ] 用户业务用例编排
  - [ ] 事务边界管理
  - [ ] 事件发布协调
- [ ] 实现用户事件处理器
  - [ ] `UserCreatedEventHandler`
  - [ ] `UserUpdatedEventHandler`
  - [ ] `UserAssignedToTenantEventHandler`
  - [ ] `UserRemovedFromTenantEventHandler`

#### 4.4 租户领域模型 (25% 完成)

- [x] 实现`Tenant`聚合根
  - ✅ 租户创建、配置、管理
  - ✅ 租户资源配额管理
  - ✅ 租户状态管理
  - ✅ 事件溯源支持
- [x] 实现租户相关值对象
  - ✅ `TenantId`、`TenantSettings`、`TenantQuota`
  - ✅ `TenantConfiguration`
- [x] 实现租户领域事件
  - ✅ `TenantCreatedEvent`、`TenantUpdatedEvent`
  - ✅ `TenantQuotaExceededEvent`、`TenantStatusChangedEvent`
  - ✅ `TenantActivatedEvent`、`TenantDeactivatedEvent`
  - ✅ `TenantSuspendedEvent`、`TenantDeletedEvent`
- [x] 实现租户领域服务
  - ✅ 租户资源配额验证
  - ✅ 租户配置管理
  - ✅ 租户健康状态评估
  - ✅ 租户评分计算

#### 4.5 租户Use Cases层开发 (新增)

- [ ] 实现租户命令处理器
  - [ ] `CreateTenantCommandHandler`
  - [ ] `UpdateTenantCommandHandler`
  - [ ] `DeleteTenantCommandHandler`
  - [ ] `ActivateTenantCommandHandler`
  - [ ] `DeactivateTenantCommandHandler`
  - [ ] `UpdateTenantQuotaCommandHandler`
- [ ] 实现租户查询处理器
  - [ ] `GetTenantQueryHandler`
  - [ ] `GetTenantsQueryHandler`
  - [ ] `GetTenantStatisticsQueryHandler`
  - [ ] `GetTenantUsageQueryHandler`
  - [ ] `SearchTenantsQueryHandler`
- [ ] 实现租户应用服务
  - [ ] `TenantApplicationService`重构
  - [ ] 租户业务用例编排
  - [ ] 租户资源管理协调
  - [ ] 租户状态管理协调
- [ ] 实现租户事件处理器
  - [ ] `TenantCreatedEventHandler`
  - [ ] `TenantUpdatedEventHandler`
  - [ ] `TenantQuotaExceededEventHandler`
  - [ ] `TenantStatusChangedEventHandler`

#### 4.6 组织架构领域模型 (30% 完成)

- [x] 实现`Organization`聚合根
  - ✅ 组织创建、管理、删除
  - ✅ 组织状态管理（活跃、非活跃、暂停、删除）
  - ✅ 组织设置和配置管理
  - ✅ 事件溯源支持
- [ ] 实现`Department`聚合根
  - 部门创建、管理、删除
  - 部门层级关系管理
- [x] 实现组织架构相关值对象
  - ✅ `OrganizationId`、`OrganizationName`、`OrganizationDescription`
  - ✅ `OrganizationSettings`、`OrganizationStatus`
- [x] 实现组织架构领域事件
  - ✅ `OrganizationCreatedEvent`、`OrganizationUpdatedEvent`
  - ✅ `OrganizationStatusChangedEvent`、`OrganizationDeletedEvent`
  - [ ] `UserAssignedToOrganizationEvent`

#### 4.7 组织架构Use Cases层开发 (新增)

- [ ] 实现组织命令处理器
  - [ ] `CreateOrganizationCommandHandler`
  - [ ] `UpdateOrganizationCommandHandler`
  - [ ] `DeleteOrganizationCommandHandler`
  - [ ] `ActivateOrganizationCommandHandler`
  - [ ] `DeactivateOrganizationCommandHandler`
  - [ ] `AssignUserToOrganizationCommandHandler`
- [ ] 实现组织查询处理器
  - [ ] `GetOrganizationQueryHandler`
  - [ ] `GetOrganizationsQueryHandler`
  - [ ] `GetOrganizationsByTenantQueryHandler`
  - [ ] `GetOrganizationUsersQueryHandler`
  - [ ] `SearchOrganizationsQueryHandler`
- [ ] 实现组织应用服务
  - [ ] `OrganizationApplicationService`重构
  - [ ] 组织业务用例编排
  - [ ] 组织用户管理协调
  - [ ] 组织状态管理协调
- [ ] 实现组织事件处理器
  - [ ] `OrganizationCreatedEventHandler`
  - [ ] `OrganizationUpdatedEventHandler`
  - [ ] `OrganizationStatusChangedEventHandler`
  - [ ] `OrganizationDeletedEventHandler`

#### 4.8 部门Use Cases层开发 (新增)

- [ ] 实现部门命令处理器
  - [ ] `CreateDepartmentCommandHandler`
  - [ ] `UpdateDepartmentCommandHandler`
  - [ ] `DeleteDepartmentCommandHandler`
  - [ ] `AssignUserToDepartmentCommandHandler`
  - [ ] `RemoveUserFromDepartmentCommandHandler`
- [ ] 实现部门查询处理器
  - [ ] `GetDepartmentQueryHandler`
  - [ ] `GetDepartmentsQueryHandler`
  - [ ] `GetDepartmentsByOrganizationQueryHandler`
  - [ ] `GetDepartmentUsersQueryHandler`
  - [ ] `GetDepartmentHierarchyQueryHandler`
- [ ] 实现部门应用服务
  - [ ] `DepartmentApplicationService`
  - [ ] 部门业务用例编排
  - [ ] 部门层级管理协调
  - [ ] 部门用户管理协调
- [ ] 实现部门事件处理器
  - [ ] `DepartmentCreatedEventHandler`
  - [ ] `DepartmentUpdatedEventHandler`
  - [ ] `DepartmentDeletedEventHandler`
  - [ ] `UserAssignedToDepartmentEventHandler`

### 阶段5：多租户数据隔离实现 (预计2-3周) - 100% 完成

#### 5.1 数据隔离核心组件

- [x] 实现`IsolationConfigService`隔离配置服务
- [x] 实现`DatabaseAdapterFactory`数据库适配器工厂
- [x] 实现`IDatabaseAdapter`数据库适配器接口
- [x] 实现`PostgreSQLAdapter`PostgreSQL适配器
- [x] 实现多租户上下文管理

#### 5.2 隔离仓储基类

- [x] 实现`TenantAwareRepository`租户感知仓储基类
- [x] 实现自动隔离条件添加
- [x] 实现行级安全策略支持
- [x] 实现租户上下文管理
- [x] 实现租户特定仓储创建

#### 5.3 数据隔离策略实现

- [x] 实现数据库级隔离策略
- [x] 实现Schema级隔离策略
- [x] 实现表级隔离策略（默认）
- [x] 实现配置驱动的隔离策略切换
- [x] 实现完整的单元测试覆盖

### 阶段6：Use Cases层重构和开发 (预计2-3周)

#### 6.1 Use Cases层架构重构

- [ ] 重构现有应用服务为Use Cases层
  - [ ] 将`UserApplicationService`重构为Use Cases层
  - [ ] 将`TenantApplicationService`重构为Use Cases层
  - [ ] 将`OrganizationApplicationService`重构为Use Cases层
  - [ ] 实现CQRS模式分离命令和查询
- [ ] 实现命令处理器基类
  - [ ] `BaseCommandHandler`基类
  - [ ] 命令验证和授权
  - [ ] 事务管理
  - [ ] 事件发布
- [ ] 实现查询处理器基类
  - [ ] `BaseQueryHandler`基类
  - [ ] 查询优化和缓存
  - [ ] 权限过滤
  - [ ] 数据转换
- [ ] 实现事件处理器基类
  - [ ] `BaseEventHandler`基类
  - [ ] 事件重试机制
  - [ ] 错误处理和恢复
  - [ ] 事件监控

#### 6.2 用户Use Cases层实现

- [ ] 实现用户命令处理器
  - [ ] `CreateUserCommandHandler`
  - [ ] `UpdateUserCommandHandler`
  - [ ] `DeleteUserCommandHandler`
  - [ ] `AssignUserToTenantCommandHandler`
  - [ ] `RemoveUserFromTenantCommandHandler`
- [ ] 实现用户查询处理器
  - [ ] `GetUserQueryHandler`
  - [ ] `GetUsersQueryHandler`
  - [ ] `GetUsersByTenantQueryHandler`
  - [ ] `GetUsersByOrganizationQueryHandler`
  - [ ] `SearchUsersQueryHandler`
- [ ] 实现用户事件处理器
  - [ ] `UserCreatedEventHandler`
  - [ ] `UserUpdatedEventHandler`
  - [ ] `UserAssignedToTenantEventHandler`
  - [ ] `UserRemovedFromTenantEventHandler`

#### 6.3 租户Use Cases层实现

- [ ] 实现租户命令处理器
  - [ ] `CreateTenantCommandHandler`
  - [ ] `UpdateTenantCommandHandler`
  - [ ] `DeleteTenantCommandHandler`
  - [ ] `ActivateTenantCommandHandler`
  - [ ] `DeactivateTenantCommandHandler`
  - [ ] `UpdateTenantQuotaCommandHandler`
- [ ] 实现租户查询处理器
  - [ ] `GetTenantQueryHandler`
  - [ ] `GetTenantsQueryHandler`
  - [ ] `GetTenantStatisticsQueryHandler`
  - [ ] `GetTenantUsageQueryHandler`
  - [ ] `SearchTenantsQueryHandler`
- [ ] 实现租户事件处理器
  - [ ] `TenantCreatedEventHandler`
  - [ ] `TenantUpdatedEventHandler`
  - [ ] `TenantQuotaExceededEventHandler`
  - [ ] `TenantStatusChangedEventHandler`

#### 6.4 组织架构Use Cases层实现

- [ ] 实现组织命令处理器
  - [ ] `CreateOrganizationCommandHandler`
  - [ ] `UpdateOrganizationCommandHandler`
  - [ ] `DeleteOrganizationCommandHandler`
  - [ ] `ActivateOrganizationCommandHandler`
  - [ ] `DeactivateOrganizationCommandHandler`
  - [ ] `AssignUserToOrganizationCommandHandler`
- [ ] 实现组织查询处理器
  - [ ] `GetOrganizationQueryHandler`
  - [ ] `GetOrganizationsQueryHandler`
  - [ ] `GetOrganizationsByTenantQueryHandler`
  - [ ] `GetOrganizationUsersQueryHandler`
  - [ ] `SearchOrganizationsQueryHandler`
- [ ] 实现部门命令处理器
  - [ ] `CreateDepartmentCommandHandler`
  - [ ] `UpdateDepartmentCommandHandler`
  - [ ] `DeleteDepartmentCommandHandler`
  - [ ] `AssignUserToDepartmentCommandHandler`
  - [ ] `RemoveUserFromDepartmentCommandHandler`
- [ ] 实现部门查询处理器
  - [ ] `GetDepartmentQueryHandler`
  - [ ] `GetDepartmentsQueryHandler`
  - [ ] `GetDepartmentsByOrganizationQueryHandler`
  - [ ] `GetDepartmentUsersQueryHandler`
  - [ ] `GetDepartmentHierarchyQueryHandler`

#### 6.5 Use Cases层测试

- [ ] 编写命令处理器单元测试
- [ ] 编写查询处理器单元测试
- [ ] 编写事件处理器单元测试
- [ ] 编写集成测试
- [ ] 编写端到端测试

### 阶段7：用户管理模块开发 (预计3-4周)

#### 7.1 平台用户管理

- [ ] 实现用户注册命令和处理器
- [ ] 实现用户认证和授权
- [ ] 实现用户资料管理
- [ ] 实现用户状态管理
- [ ] 实现用户会话管理

#### 7.2 租户用户管理

- [ ] 实现平台用户分配到租户
- [ ] 实现租户用户管理
- [ ] 实现用户租户关系管理
- [ ] 实现用户离开租户流程
- [ ] 实现用户兼职管理

#### 7.3 用户查询和搜索

- [ ] 实现用户查询处理器
- [ ] 实现用户搜索功能
- [ ] 实现用户列表和分页
- [ ] 实现用户统计和报表
- [ ] 实现用户导入导出

#### 7.4 用户接口层

- [ ] 实现用户控制器
- [ ] 实现用户DTO和验证
- [ ] 实现用户API文档
- [ ] 实现用户权限检查
- [ ] 实现用户异常处理

### 阶段8：租户管理模块开发 (预计2-3周)

#### 8.1 租户核心功能

- [ ] 实现租户创建命令和处理器
- [ ] 实现租户配置管理
- [ ] 实现租户信息管理
- [ ] 实现租户状态管理
- [ ] 实现租户删除和备份

#### 8.2 租户资源管理

- [ ] 实现租户资源配额管理
- [ ] 实现租户使用量统计
- [ ] 实现租户资源监控
- [ ] 实现租户资源告警
- [ ] 实现租户资源优化

#### 8.3 租户查询和管理

- [ ] 实现租户查询处理器
- [ ] 实现租户列表和搜索
- [ ] 实现租户统计和报表
- [ ] 实现租户监控面板
- [ ] 实现租户管理接口

### 阶段9：组织架构管理模块开发 (预计3-4周)

#### 9.1 组织管理

- [ ] 实现组织创建和管理
- [ ] 实现组织层级关系
- [ ] 实现组织配置管理
- [ ] 实现组织用户管理
- [ ] 实现组织权限控制

#### 9.2 部门管理

- [ ] 实现部门创建和管理
- [ ] 实现部门层级关系
- [ ] 实现部门配置管理
- [ ] 实现部门用户管理
- [ ] 实现部门权限控制

#### 9.3 组织架构查询

- [ ] 实现组织架构查询
- [ ] 实现组织架构树形结构
- [ ] 实现组织架构搜索
- [ ] 实现组织架构统计
- [ ] 实现组织架构管理接口

### 阶段10：角色权限管理模块开发 (预计3-4周)

#### 10.1 角色管理

- [ ] 实现角色定义和管理
- [ ] 实现角色分配和撤销
- [ ] 实现角色继承和覆盖
- [ ] 实现角色有效期管理
- [ ] 实现角色审批流程

#### 10.2 权限管理

- [ ] 实现权限定义和管理
- [ ] 实现权限分配和验证
- [ ] 实现权限缓存机制
- [ ] 实现权限审计日志
- [ ] 实现权限违规检测

#### 10.3 权限控制

- [ ] 实现基于角色的访问控制（RBAC）
- [ ] 实现基于属性的访问控制（ABAC）
- [ ] 实现动态权限控制
- [ ] 实现权限守卫和拦截器
- [ ] 实现权限管理接口

### 阶段11：认证与授权模块开发 (预计2-3周)

#### 11.1 身份认证

- [ ] 实现用户名密码认证
- [ ] 实现多因素认证
- [ ] 实现单点登录（SSO）
- [ ] 实现第三方认证集成
- [ ] 实现认证状态管理

#### 11.2 访问控制

- [ ] 实现会话管理
- [ ] 实现令牌管理
- [ ] 实现权限验证
- [ ] 实现访问日志
- [ ] 实现安全策略

#### 11.3 安全功能

- [ ] 实现密码策略
- [ ] 实现登录失败锁定
- [ ] 实现会话超时
- [ ] 实现安全日志记录
- [ ] 实现安全监控

### 阶段12：平台管理模块开发 (预计2-3周)

#### 12.1 平台配置管理

- [ ] 实现平台配置管理
- [ ] 实现系统参数配置
- [ ] 实现功能模块开关
- [ ] 实现主题和样式配置
- [ ] 实现配置变更审计

#### 12.2 系统监控

- [ ] 实现系统性能监控
- [ ] 实现用户行为分析
- [ ] 实现错误日志监控
- [ ] 实现资源使用统计
- [ ] 实现监控告警

#### 12.3 审计管理

- [ ] 实现操作日志记录
- [ ] 实现审计报告生成
- [ ] 实现合规性检查
- [ ] 实现安全事件监控
- [ ] 实现审计管理接口

### 阶段13：测试和文档完善 (预计2-3周)

#### 13.1 测试覆盖

- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 编写端到端测试
- [ ] 编写性能测试
- [ ] 编写安全测试

#### 13.2 文档完善

- [ ] 完善API文档
- [ ] 完善部署文档
- [ ] 完善运维文档
- [ ] 完善用户手册
- [ ] 完善开发指南

#### 13.3 质量保证

- [ ] 代码质量检查
- [ ] 性能优化
- [ ] 安全漏洞扫描
- [ ] 代码审查
- [ ] 最终测试

## 技术设计文档应用指南

### 文档查阅原则

- **设计先行**：在编写任何代码之前，必须先查阅相关的技术设计文档
- **架构一致性**：确保实现与设计文档完全一致
- **文档驱动**：以技术设计文档为准，不偏离既定架构
- **主动查阅**：AI应主动识别需要查阅的文档并提前阅读
- **共享优先**：创建值对象时优先使用共享模块中的值对象

### 技术设计文档结构

#### 主要设计文档

- **架构概览**：`docs/technical-design-documents/01-architecture-overview.md`
- **分层架构**：`docs/technical-design-documents/02-clean-architecture-layers.md`
- **领域层设计**：`docs/technical-design-documents/03-entities-layer.md`
- **应用层设计**：`docs/technical-design-documents/04-use-cases-layer.md`
- **接口适配器层设计**：`docs/technical-design-documents/05-interface-adapters-layer.md`
- **框架驱动层设计**：`docs/technical-design-documents/06-frameworks-drivers-layer.md`
- **事件驱动架构设计**：`docs/technical-design-documents/07-event-driven-architecture.md`
- **依赖倒置实施指南**：`docs/technical-design-documents/08-dependency-inversion-guide.md`
- **模块结构设计指南**：`docs/technical-design-documents/09-module-structure-guide.md`
- **CQRS实现指南**：`docs/technical-design-documents/10-cqrs-implementation.md`
- **测试策略文档**：`docs/technical-design-documents/11-testing-strategy.md`
- **多租户数据隔离设计**：`docs/technical-design-documents/12-multitenant-data-isolation.md`
- **事件溯源设计**：`docs/technical-design-documents/13-event-sourcing-design.md`
- **适配器模式设计**：`docs/technical-design-documents/14-adapter-pattern-design.md`

#### 支持文档

- **技术设计文档目录**：`docs/technical-design-documents/0-catalog.md`
- **业务需求**：`docs/business-requirements.md`
- **开发计划**：`docs/development-plan.md`
- **代码注释规范**：`.cursor/rules/code-annotation-specification.mdc`
- **技术设计查阅指南**：`.cursor/rules/technical-design-guide-for-ai.mdc`

### 开发环节查阅指南

#### 1. 事件驱动架构基础设施开发

**触发条件**：开发消息队列、事件总线、异步事件处理器等基础设施组件

**必读文档**：

- `docs/technical-design-documents/07-event-driven-architecture.md` - 事件驱动架构设计
- `docs/technical-design-documents/13-event-sourcing-design.md` - 事件溯源设计
- `docs/technical-design-documents/06-frameworks-drivers-layer.md` - 框架驱动层设计
- `.cursor/rules/code-annotation-specification.mdc` - 异步事件处理器注释规范

#### 2. 领域模型开发

**触发条件**：开发用户、租户、组织、部门等核心领域模型

**必读文档**：

- `docs/technical-design-documents/03-entities-layer.md` - 领域层设计
- `docs/business-requirements.md` - 业务需求
- `docs/technical-design-documents/01-architecture-overview.md` - 架构概览

**重要**：创建值对象时优先检查`packages/shared/src/identifiers`和`packages/shared/src/common`中是否有可用的共享值对象

#### 3. 应用层开发

**触发条件**：开发命令、查询、命令处理器、查询处理器等应用层组件

**必读文档**：

- `docs/technical-design-documents/04-use-cases-layer.md` - 应用层设计
- `docs/technical-design-documents/02-clean-architecture-layers.md` - 分层架构
- `docs/technical-design-documents/07-event-driven-architecture.md` - 事件驱动架构

#### 4. 数据库模块开发

**触发条件**：开发数据库适配器、多租户仓储、隔离策略配置等数据库相关组件

**必读文档**：

- `docs/technical-design-documents/06-frameworks-drivers-layer.md` - 框架驱动层设计
- `docs/technical-design-documents/12-multitenant-data-isolation.md` - 多租户数据隔离设计
- `docs/technical-design-documents/14-adapter-pattern-design.md` - 适配器模式设计
- `.cursor/rules/code-annotation-specification.mdc` - 数据库组件注释规范

#### 5. 接口层开发

**触发条件**：开发控制器、DTO、API等接口层组件

**必读文档**：

- `docs/technical-design-documents/05-interface-adapters-layer.md` - 接口适配器层设计
- `docs/technical-design-documents/02-clean-architecture-layers.md` - 分层架构
- `docs/technical-design-documents/01-architecture-overview.md` - 架构概览

### 共享值对象优先原则

**核心原则**：在创建任何值对象之前，必须优先检查共享模块中是否已有可用的值对象。

**检查路径**：

- `packages/shared/src/identifiers/` - 标识符类值对象（如NotifId、TenantId、UserId等）
- `packages/shared/src/common/` - 通用值对象（如Email、NotificationStatus、PhoneNumber等）

**检查步骤**：

1. 首先查看`packages/shared/src/identifiers/index.ts`和`packages/shared/src/common/index.ts`
2. 确认是否有符合需求的值对象
3. 如果有，直接使用`import { ValueObjectName } from '@aiofix/shared'`
4. 如果没有，再考虑创建新的值对象

## 开发指导原则

### 1. 架构遵循原则

- 严格按照DDD和Clean Architecture分层
- 确保依赖倒置原则
- 保持领域层的纯净性
- 实现CQRS和事件溯源模式
- **设计先行**：开发前必须先查阅相关技术设计文档
- **共享优先**：创建值对象时优先使用共享模块中的值对象

### 2. 代码质量原则

- 使用TypeScript严格模式
- 编写详细的中文注释
- 遵循TSDoc规范
- 实现完整的错误处理
- 严格按照技术设计文档实现
- 确保代码与设计文档的一致性

### 3. 测试原则

- 每个模块都要有单元测试
- 关键业务流程要有集成测试
- 重要接口要有端到端测试
- 测试覆盖率要达到80%以上

### 4. 性能原则

- 实现合理的缓存策略
- 优化数据库查询
- 实现事件批处理
- 监控系统性能指标

### 5. 安全原则

- 实现多层数据隔离
- 实现细粒度权限控制
- 记录完整的审计日志
- 实现安全监控和告警

## 技术栈和工具

### 核心技术栈

- **后端框架**：NestJS + TypeScript + Fastify
- **数据库**：PostgreSQL + MongoDB + Redis
- **ORM**：MikroORM
- **架构模式**：DDD + Clean Architecture + CQRS + 事件溯源 + 事件驱动架构
- **消息队列**：Redis + Bull
- **包管理**：pnpm

### 开发工具

- **代码质量**：ESLint + Prettier + Husky
- **测试框架**：Jest + Supertest
- **容器化**：Docker + Docker Compose
- **监控**：Prometheus + Grafana
- **日志**：Winston + ELK Stack

### 部署工具

- **容器编排**：Kubernetes
- **CI/CD**：GitHub Actions
- **基础设施**：Terraform
- **监控**：Prometheus + Grafana
- **日志**：ELK Stack

## 里程碑和交付物

### 里程碑1：基础架构完成 (第3周末) - 100% 完成

- [x] 项目结构搭建完成
- [x] 核心架构包开发完成
- [x] 用户模块基础开发完成
- [x] 租户模块领域层开发完成
- [x] 组织模块领域层开发完成
- [x] 事件驱动架构技术设计完成
- [x] 通知模块完整实现完成（8个子领域）
- [ ] 数据库配置完成
- [x] 基础服务配置完成（所有独立模块集成完成）

### 里程碑2：事件驱动架构基础设施完成 (第6周末) - 100% 完成

- [x] 消息队列服务完成（内存实现）
- [x] 事件总线服务完成
- [x] 异步事件处理器完成
- [x] 事件存储配置完成（内存实现）
- [x] 完整的使用示例和文档
- [ ] 生产级Redis + Bull集成（待后续阶段）

### 里程碑3：通知模块完成 (第11周末) - 100% 完成

- [x] 站内信子领域完成
- [x] 邮件通知子领域完成
- [x] 推送通知子领域完成
- [x] 短信通知子领域完成
- [x] 通知编排子领域完成
- [x] 通知分析子领域完成
- [x] 通知模板子领域完成
- [x] 通知偏好子领域完成

### 里程碑4：核心领域模型完成 (第15周末)

- 事件溯源框架完成
- 用户领域模型完成
- 租户领域模型完成
- 组织架构领域模型完成

### 里程碑5：数据隔离完成 (第18周末) - 100% 完成

- [x] 数据隔离核心组件完成
- [x] 隔离仓储基类完成
- [x] 数据隔离策略完成
- [x] 数据库模块重构完成
- [x] 技术设计文档更新完成

### 里程碑6：Use Cases层完成 (第21周末)

- Use Cases层架构重构完成
- 用户Use Cases层实现完成
- 租户Use Cases层实现完成
- 组织架构Use Cases层实现完成
- Use Cases层测试完成

### 里程碑7：核心模块完成 (第28周末)

- 用户管理模块完成
- 租户管理模块完成
- 组织架构管理模块完成
- 角色权限管理模块完成

### 里程碑8：系统完成 (第33周末)

- 认证与授权模块完成
- 平台管理模块完成
- 测试和文档完成
- 系统部署完成

## 风险控制

### 技术风险

- **架构复杂性**：通过分阶段实施和充分测试降低风险
- **性能问题**：通过性能测试和优化策略控制风险
- **数据一致性**：通过事件溯源和事务管理保证一致性

### 进度风险

- **开发延期**：通过合理的里程碑设置和进度监控控制风险
- **需求变更**：通过稳定的架构设计适应需求变更
- **资源不足**：通过合理的资源规划和优先级管理控制风险

### 质量风险

- **代码质量**：通过代码审查和自动化检查控制风险
- **测试覆盖**：通过完整的测试策略控制风险
- **文档质量**：通过文档审查和同步更新控制风险

## 总结

本开发工作计划基于项目的业务需求和技术设计，采用渐进式开发策略，从基础架构开始，逐步实现各个功能模块。通过严格遵循DDD和Clean Architecture原则，确保系统的可维护性、可扩展性和可测试性。

每个阶段都有明确的目标和交付物，通过里程碑管理确保项目按时完成。同时，通过风险控制措施，确保项目质量和进度。

---

## 进度更新记录

### 2024-01-01 进度更新

- ✅ 完成基础架构包开发（common、core、logging、config、cache、database）
- ✅ 完成完整技术设计文档体系（100%）
  - 技术设计文档目录 (0-catalog.md)
  - 架构概述文档 (01-architecture-overview.md)
  - Clean Architecture分层设计 (02-clean-architecture-layers.md)
  - Entities层设计 (03-entities-layer.md)
  - Use Cases层设计 (04-use-cases-layer.md)
  - Interface Adapters层设计 (05-interface-adapters-layer.md)
  - Frameworks & Drivers层设计 (06-frameworks-drivers-layer.md)
  - 事件驱动架构设计 (07-event-driven-architecture.md)
  - 依赖倒置实施指南 (08-dependency-inversion-guide.md)
  - 模块结构设计指南 (09-module-structure-guide.md)
  - CQRS实现指南 (10-cqrs-implementation.md)
  - 测试策略文档 (11-testing-strategy.md)
  - 多租户数据隔离设计 (12-multitenant-data-isolation.md)
  - 事件溯源设计 (13-event-sourcing-design.md)
  - 适配器模式设计 (14-adapter-pattern-design.md)
  - 技术设计查阅指南更新
- ✅ 完成通知模块完整实现（100%）
  - 站内信子领域完整实现
  - 邮件通知子领域完整实现
  - 推送通知子领域完整实现
  - 短信通知子领域完整实现
  - 通知编排子领域完整实现
  - 通知分析子领域完整实现
  - 通知模板子领域完整实现
  - 通知偏好子领域完整实现
  - 修复100+ TypeScript类型错误
  - 统一使用@aiofix/shared共享模块
  - 完整的事件驱动架构和事件溯源支持
- ✅ 完成事件驱动架构基础设施开发（100%）
  - 事件存储服务（EventStoreService）- 内存实现
  - 事件总线服务（EventBusService）- 事件发布订阅管理
  - 消息队列服务（MessageQueueService）- 异步消息处理
  - 事件处理器基类（BaseEventHandler）- 重试机制和错误处理
  - 事件处理器服务（EventProcessorService）- 事件路由和分发
  - 完整的使用示例和文档
  - 事件驱动架构完整示例
- ✅ 完成数据库模块重构（100%）
  - 三种隔离策略实现（数据库级、Schema级、表级）
  - 数据库适配器工厂模式
  - 租户感知仓储基类
  - 配置驱动的隔离策略切换
  - 完整的单元测试覆盖
  - 多租户数据隔离架构完成
- ✅ 完成所有包的测试配置和验证
- ✅ 创建测试配置指南文档
- ✅ 项目结构搭建完成（100%）
- ✅ 完成用户模块基础开发（30%）
  - 用户领域实体、聚合根、事件
  - 用户应用命令、查询、服务、控制器
  - 用户仓储接口和实现
  - 完整的TSDoc注释规范应用
- ✅ 完成租户模块领域层开发（25%）
  - 租户值对象（TenantId、TenantSettings、TenantQuota、TenantConfiguration）
  - 租户领域实体（TenantEntity）
  - 租户聚合根（TenantAggregate）
  - 租户领域事件（8个事件类）
  - 租户领域服务（TenantDomainService）
  - 完整的TSDoc注释规范应用
  - 事件溯源支持
  - 多租户配额管理
  - 租户状态管理
- ✅ 完成组织模块领域层开发（30%）
  - 组织值对象（OrganizationId、OrganizationName、OrganizationDescription、OrganizationSettings）
  - 组织状态枚举（OrganizationStatus、OrganizationStatusHelper）
  - 组织领域实体（OrganizationEntity）
  - 组织聚合根（OrganizationAggregate）
  - 组织领域事件（4个事件类）
  - 组织领域服务（OrganizationDomainService）
  - 完整的TSDoc注释规范应用
  - 事件溯源支持
  - 组织状态管理
  - 组织设置和配置管理
- 📊 代码统计：200+个TypeScript文件，19个测试文件，19个包
- 🎯 下一步：现有模块事件驱动改造、基础设施完善、API接口开发、数据库模块生产级部署、技术设计文档应用

---

**文档版本**：2.5  
**创建日期**：2024-01-01  
**最后更新**：2024-01-01  
**维护者**：项目开发团队
