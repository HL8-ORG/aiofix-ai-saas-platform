# 技术设计文档目录

## 概述

本文档是Aiofix AI SAAS平台技术设计文档的完整目录导航，涵盖了从架构概述到具体实施指南的所有技术设计文档。

## 文档分类

### 1. 架构设计文档 (01-02)

- **[01-架构概述](./01-architecture-overview.md)** - 项目整体架构设计、核心特征、技术栈
- **[02-Clean Architecture分层设计](./02-clean-architecture-layers.md)** - Clean Architecture四层架构详细设计

### 2. 核心架构层设计文档 (03-06)

- **[03-Entities层设计](./03-entities-layer.md)** - 领域实体、聚合根、值对象、领域事件设计
- **[04-Use Cases层设计](./04-use-cases-layer.md)** - 应用用例、命令查询、业务逻辑编排
- **[05-Interface Adapters层设计](./05-interface-adapters-layer.md)** - 控制器、DTO、仓储实现、外部服务适配器
- **[06-Frameworks & Drivers层设计](./06-frameworks-drivers-layer.md)** - 数据库、消息队列、Web框架、外部服务

### 3. 架构模式与实施指南 (07-11)

- **[07-事件驱动架构设计](./07-event-driven-architecture.md)** - 事件驱动架构、消息队列、异步处理
- **[08-依赖倒置实施指南](./08-dependency-inversion-guide.md)** - 依赖倒置原则、接口设计、依赖注入
- **[09-模块结构设计指南](./09-module-structure-guide.md)** - 包结构、模块组织、代码组织
- **[10-CQRS实现指南](./10-cqrs-implementation.md)** - CQRS模式、命令查询分离、读写模型
- **[11-测试策略文档](./11-testing-strategy.md)** - 单元测试、集成测试、端到端测试

### 4. 专项技术设计文档 (12-15)

- **[12-多租户数据隔离设计](./12-multitenant-data-isolation.md)** - 多租户架构、数据隔离策略、权限控制
- **[13-事件溯源设计](./13-event-sourcing-design.md)** - 事件溯源模式、事件存储、状态重建
- **[14-适配器模式设计](./14-adapter-pattern-design.md)** - 数据库适配器、多租户支持、隔离策略
- **[15-标识符值对象统一架构设计](./15-identifier-value-objects-unified-architecture.md)** - 标识符值对象统一管理、基类设计、方法接口标准化

## 文档阅读指南

### 新开发者入门路径

1. **架构理解** (01-02)
   - 先阅读架构概述，了解项目整体架构
   - 深入理解Clean Architecture四层架构

2. **核心架构学习** (03-06)
   - 按顺序学习四层架构的设计
   - 理解每层的职责和边界

3. **架构模式掌握** (07-11)
   - 学习事件驱动、CQRS等核心模式
   - 掌握模块组织和测试策略

4. **专项技术深入** (12-15)
   - 根据业务需求深入学习专项技术
   - 多租户、事件溯源、适配器模式、标识符管理

### 功能开发参考路径

#### 新功能开发

1. **领域建模** → 03-Entities层设计
2. **业务用例** → 04-Use Cases层设计
3. **接口设计** → 05-Interface Adapters层设计
4. **技术实现** → 06-Frameworks & Drivers层设计
5. **模块组织** → 09-模块结构设计指南

#### 事件驱动开发

1. **事件设计** → 03-Entities层设计 (领域事件)
2. **事件处理** → 07-事件驱动架构设计
3. **事件存储** → 13-事件溯源设计
4. **消息队列** → 06-Frameworks & Drivers层设计

#### 多租户开发

1. **数据隔离** → 12-多租户数据隔离设计
2. **适配器设计** → 14-适配器模式设计
3. **权限控制** → 12-多租户数据隔离设计

#### CQRS开发

1. **命令设计** → 04-Use Cases层设计
2. **查询设计** → 04-Use Cases层设计
3. **读写分离** → 10-CQRS实现指南

#### 标识符管理开发

1. **标识符设计** → 15-标识符值对象统一架构设计
2. **基类实现** → 15-标识符值对象统一架构设计
3. **接口标准化** → 15-标识符值对象统一架构设计

### 架构师参考路径

1. **整体架构** → 01-架构概述
2. **架构原则** → 02-Clean Architecture分层设计
3. **架构模式** → 07-11 (事件驱动、CQRS、依赖倒置等)
4. **技术选型** → 06-Frameworks & Drivers层设计
5. **质量保证** → 11-测试策略文档

## 文档维护

### 版本信息

- **文档版本**: V2.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护团队**: AI开发团队

### 更新原则

- **架构一致性**: 所有文档必须与整体架构保持一致
- **内容同步**: 代码变更时同步更新相关文档
- **版本控制**: 重大架构变更时更新版本号
- **质量保证**: 定期审查文档的准确性和完整性

### 文档结构

```
docs/technical-design-documents/
├── 0-catalog.md                    # 本文档 - 目录导航
├── 01-architecture-overview.md     # 架构概述
├── 02-clean-architecture-layers.md # Clean Architecture分层设计
├── 03-entities-layer.md            # Entities层设计
├── 04-use-cases-layer.md           # Use Cases层设计
├── 05-interface-adapters-layer.md  # Interface Adapters层设计
├── 06-frameworks-drivers-layer.md  # Frameworks & Drivers层设计
├── 07-event-driven-architecture.md # 事件驱动架构设计
├── 08-dependency-inversion-guide.md # 依赖倒置实施指南
├── 09-module-structure-guide.md    # 模块结构设计指南
├── 10-cqrs-implementation.md       # CQRS实现指南
├── 11-testing-strategy.md          # 测试策略文档
├── 12-multitenant-data-isolation.md # 多租户数据隔离设计
├── 13-event-sourcing-design.md     # 事件溯源设计
├── 14-adapter-pattern-design.md    # 适配器模式设计
├── 15-identifier-value-objects-unified-architecture.md # 标识符值对象统一架构设计
└── notification/                   # 通知模块设计文档
    ├── 15-0-notification-module-overview.md
    ├── 15-1-notification-clean-architecture-design.md
    └── ... (其他通知模块文档)
```

## 快速导航

### 按技术领域导航

- **架构设计**: 01, 02
- **领域建模**: 03
- **应用逻辑**: 04
- **接口设计**: 05
- **基础设施**: 06
- **事件处理**: 07, 13
- **数据访问**: 14
- **多租户**: 12
- **标识符管理**: 15
- **测试**: 11
- **模块组织**: 09

### 按开发阶段导航

- **需求分析**: 01, 03
- **架构设计**: 02, 07, 10
- **详细设计**: 03-06
- **实施指南**: 08, 09, 11
- **专项技术**: 12-15

### 按角色导航

- **架构师**: 01, 02, 07, 10, 12-15
- **后端开发**: 03-06, 08, 09, 15
- **测试工程师**: 11
- **运维工程师**: 06, 12, 14

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
