# 事件驱动架构示例和文档

本目录包含了事件驱动架构的完整示例和文档，展示了如何在SAAS平台中实现和使用事件驱动架构。

## 目录结构

```
examples/
├── README.md                           # 本文档
├── event-driven-architecture.example.ts # 完整的事件驱动架构示例
├── event-bus-usage.example.ts          # 事件总线使用示例
├── event-store-usage.example.ts        # 事件存储使用示例
├── message-queue-usage.example.ts      # 消息队列使用示例
├── user-created-event-handler.ts       # 事件处理器示例
└── user.aggregate.spec.ts              # 用户聚合根测试示例
```

## 核心组件

### 1. 事件存储 (Event Store)

事件存储是事件驱动架构的核心组件，负责持久化领域事件。

**主要功能：**

- 保存聚合根的事件到存储系统
- 提供事件的检索和查询功能
- 支持事件流的重放和快照
- 提供事件存储的统计信息

**使用示例：**

```typescript
import { InMemoryEventStore } from '@aiofix/core';

const eventStore = new InMemoryEventStore();

// 保存事件
await eventStore.saveEvents('user-123', [userCreatedEvent], 0);

// 获取事件
const events = await eventStore.getEvents('user-123', 0);

// 获取统计信息
const stats = await eventStore.getStatistics();
```

### 2. 事件总线 (Event Bus)

事件总线负责协调事件存储和消息队列的集成。

**主要功能：**

- 协调事件存储和消息队列
- 提供统一的事件发布接口
- 管理事件的生命周期
- 处理事件发布的事务性

**使用示例：**

```typescript
import { EventBusService } from '@aiofix/core';

const eventBus = new EventBusService(eventStore, config);

// 启动事件总线
await eventBus.start();

// 订阅事件
await eventBus.subscribe('UserCreated', handler, 1);

// 发布事件
await eventBus.publish(userCreatedEvent);
```

### 3. 消息队列 (Message Queue)

消息队列负责处理异步消息传递和事件分发。

**主要功能：**

- 发布和消费领域事件
- 处理异步任务队列
- 实现消息路由和分发
- 提供消息持久化和重试机制

**使用示例：**

```typescript
import { InMemoryMessageQueue } from '@aiofix/core';

const messageQueue = new InMemoryMessageQueue();

// 启动消息队列
await messageQueue.start();

// 发布事件
await messageQueue.publishEvent(userCreatedEvent);

// 消费事件
await messageQueue.consumeEvents('user-events', processor);
```

### 4. 事件处理器 (Event Handler)

事件处理器负责处理具体的业务逻辑。

**主要功能：**

- 处理特定类型的领域事件
- 实现重试机制和错误处理
- 提供处理统计和监控
- 支持并发处理

**使用示例：**

```typescript
import { BaseEventHandler } from '@aiofix/core';

class UserCreatedEventHandler extends BaseEventHandler {
  constructor() {
    super('UserCreatedHandler', 'UserCreated');
  }

  protected async processEvent(event: DomainEvent): Promise<void> {
    // 处理用户创建事件
    console.log('处理用户创建事件:', event.toJSON());
  }
}
```

## 完整示例

### 事件驱动架构完整示例

`event-driven-architecture.example.ts` 展示了完整的事件驱动架构实现，包括：

1. **聚合根操作**：创建、更新、停用用户
2. **事件发布**：将领域事件发布到事件总线
3. **事件处理**：异步处理各种用户事件
4. **事件溯源**：从事件存储重建聚合根状态
5. **统计监控**：获取各种统计信息

### 运行示例

```typescript
import { demonstrateEventDrivenArchitecture } from './event-driven-architecture.example';

// 运行完整示例
await demonstrateEventDrivenArchitecture();
```

## 架构优势

### 1. 松耦合

- 通过事件实现模块间的松耦合
- 支持独立开发和部署
- 易于扩展和维护

### 2. 可扩展性

- 支持水平扩展
- 异步处理提高性能
- 支持负载均衡

### 3. 可靠性

- 事件持久化保证数据不丢失
- 重试机制处理临时故障
- 死信队列处理永久失败

### 4. 可维护性

- 清晰的事件流便于调试
- 完整的审计日志
- 支持事件重放和回滚

## 最佳实践

### 1. 事件设计

- 事件应该表示已发生的事实
- 使用过去时态命名事件
- 包含足够的上下文信息
- 保持事件的不可变性

### 2. 事件处理

- 事件处理器应该是幂等的
- 实现适当的重试策略
- 处理异常情况
- 记录处理日志

### 3. 性能优化

- 使用批量处理
- 实现适当的并发控制
- 监控处理性能
- 优化事件存储

### 4. 错误处理

- 实现重试机制
- 使用死信队列
- 监控失败事件
- 提供手动重试功能

## 监控和调试

### 1. 统计信息

- 事件发布和处理统计
- 队列状态监控
- 处理时间统计
- 错误率监控

### 2. 日志记录

- 事件发布日志
- 事件处理日志
- 错误和异常日志
- 性能指标日志

### 3. 调试工具

- 事件重放功能
- 事件流查看
- 失败任务重试
- 队列状态查看

## 扩展指南

### 1. 添加新事件类型

1. 创建新的事件类
2. 在聚合根中添加事件发布
3. 创建事件处理器
4. 注册事件处理器

### 2. 添加新队列

1. 创建队列配置
2. 实现队列处理器
3. 配置重试策略
4. 设置监控

### 3. 集成外部系统

1. 创建集成事件
2. 实现外部系统适配器
3. 配置消息路由
4. 处理集成错误

## 故障排除

### 1. 常见问题

- 事件丢失：检查事件存储配置
- 处理失败：检查重试策略
- 性能问题：检查并发配置
- 内存泄漏：检查事件清理

### 2. 调试步骤

1. 检查事件是否正确发布
2. 验证事件处理器是否正确注册
3. 查看错误日志和堆栈跟踪
4. 检查队列状态和统计信息

### 3. 性能调优

1. 调整并发数
2. 优化批处理大小
3. 配置适当的重试策略
4. 监控资源使用情况

## 总结

事件驱动架构为SAAS平台提供了强大的异步处理能力，通过事件存储、事件总线、消息队列和事件处理器的协同工作，实现了高可用、高性能、可扩展的系统架构。

通过本示例和文档，您可以：

- 理解事件驱动架构的核心概念
- 学习如何实现和使用各个组件
- 掌握最佳实践和故障排除方法
- 快速上手事件驱动架构开发

更多详细信息请参考各个示例文件的具体实现。
