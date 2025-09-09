# 通知模块设计概述

## 概述

通知模块是Aiofix AI SAAS平台的核心业务模块之一，负责处理站内信、邮件、推送、短信等多种通知渠道的统一管理和编排。本模块采用DDD + Clean Architecture + CQRS + 事件驱动架构，支持多租户和微服务部署。

## 文档结构

本通知模块设计文档被拆分为以下子文档：

### 核心设计文档

- **[15-1 通知模块Clean Architecture设计](./15-1-notification-clean-architecture-design.md)** - Clean Architecture四层架构、事件溯源设计、架构原则
- **[15-2 通知模块Entities层设计](./15-2-notification-entities-design.md)** - 聚合根、实体、值对象、领域事件设计
- **[15-3 通知模块Use Cases层设计](./15-3-notification-use-cases-design.md)** - 命令用例、查询用例、用例接口设计
- **[15-4 通知模块Interface Adapters层设计](./15-4-notification-interface-adapters-design.md)** - 控制器、DTO、仓储实现、外部服务适配器
- **[15-5 通知模块Frameworks & Drivers层设计](./15-5-notification-frameworks-drivers-design.md)** - 数据库、事件存储、消息队列、Web框架

### 实施指南文档

- **[15-6 通知模块数据库设计](./15-6-notification-database-design.md)** - 数据库表结构、索引、迁移策略
- **[15-7 通知模块配置管理](./15-7-notification-configuration.md)** - 配置管理、环境变量、多租户配置
- **[15-8 通知模块错误处理](./15-8-notification-error-handling.md)** - 错误处理策略、异常分类、重试机制
- **[15-9 通知模块测试策略](./15-9-notification-testing-strategy.md)** - 单元测试、集成测试、端到端测试
- **[15-10 通知模块部署运维](./15-10-notification-deployment.md)** - 部署策略、监控日志、性能优化

## 核心特性

### 1. 多通知渠道支持

- **站内信通知**：应用内消息通知
- **邮件通知**：SMTP邮件发送
- **推送通知**：移动端推送通知
- **短信通知**：SMS短信发送
- **通知编排**：多渠道统一编排和调度

### 2. 架构特点

- **DDD架构**：遵循领域驱动设计，按业务领域组织代码
- **Clean Architecture**：严格遵循四层架构（Entities、Use Cases、Interface Adapters、Frameworks & Drivers）
- **事件溯源**：完整的事件溯源支持，提供审计能力和时间旅行功能
- **CQRS**：命令查询职责分离，优化读写性能
- **事件驱动**：全面事件驱动，实现松耦合和最终一致性
- **多租户**：支持租户级数据隔离和配置
- **微服务**：支持独立部署和扩展

### 3. 子领域划分

#### 3.1 核心子领域

- **站内信子领域**：应用内消息通知管理
- **邮件通知子领域**：邮件发送和模板管理
- **推送通知子领域**：移动端推送通知管理
- **短信通知子领域**：SMS短信发送管理

#### 3.2 支撑子领域

- **通知编排子领域**：多渠道通知的统一编排和调度

#### 3.3 通用子领域

- **通知配置子领域**：通知配置和模板管理
- **通知统计子领域**：通知发送统计和分析

### 4. 技术栈

- **后端框架**：NestJS + TypeScript
- **数据库**：PostgreSQL (读模型) + MongoDB (事件存储)
- **消息队列**：Redis + BullMQ
- **缓存**：Redis
- **外部服务**：SMTP、推送服务、短信服务商API
- **事件溯源**：MongoDB事件存储 + 事件投射器

## 快速开始

### 1. 阅读顺序建议

1. **Clean Architecture设计** → 了解四层架构和事件溯源设计原则
2. **Entities层设计** → 理解业务模型和领域逻辑
3. **Use Cases层设计** → 了解命令用例和查询用例设计
4. **Interface Adapters层设计** → 了解控制器、DTO和仓储实现
5. **Frameworks & Drivers层设计** → 了解数据库、事件存储和消息队列

### 2. 开发指南

- **新功能开发**：参考Entities层设计 → Use Cases层设计 → Interface Adapters层设计
- **API开发**：参考Interface Adapters层设计 → Use Cases层设计
- **事件溯源开发**：参考Frameworks & Drivers层设计 → Entities层设计
- **数据库设计**：参考数据库设计文档
- **测试开发**：参考测试策略文档
- **部署运维**：参考部署运维文档

### 3. 关键概念

- **Clean Architecture四层**：Entities、Use Cases、Interface Adapters、Frameworks & Drivers
- **事件溯源**：所有状态变更都通过事件记录，支持审计和时间旅行
- **聚合根与实体分离**：聚合根负责业务协调，实体负责状态管理
- **事件驱动**：所有业务操作都通过事件驱动
- **多租户隔离**：支持租户级数据隔离和配置
- **CQRS模式**：命令和查询分离，优化性能
- **外部服务适配器**：统一的外部服务集成接口

## 文档维护

- **文档版本**：V2.1 (Clean Architecture + 事件溯源)
- **最后更新**：2024-01-01
- **维护团队**：AI开发团队
- **更新频率**：随代码变更同步更新
- **架构变更**：重新设计为Clean Architecture四层架构，完整支持事件溯源

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
