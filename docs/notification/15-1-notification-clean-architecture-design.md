# 通知模块Clean Architecture设计

## 概述

本文档重新设计了通知模块的架构，使其严格遵循Clean Architecture的四层架构原则，与项目中其他领域模块的设计保持一致。

## 1. Clean Architecture四层架构

### 1.1 架构层次

通知模块采用标准的Clean Architecture四层架构：

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           通知模块Clean Architecture架构                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  packages/notification/                                                         │
│  ├── in-app/                    # 站内信子领域包                                │
│  │   ├── src/                                                                   │
│  │   │   ├── entities/          # Entities层 - 企业业务规则                     │
│  │   │   │   ├── aggregates/    # 聚合根 (事件溯源)                             │
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
│  │   │   │   ├── events/        # 领域事件 (事件溯源)                           │
│  │   │   │   │   ├── in-app-notif-created.event.ts                             │
│  │   │   │   │   ├── in-app-notif-read.event.ts                                │
│  │   │   │   │   ├── in-app-notif-archived.event.ts                            │
│  │   │   │   │   ├── in-app-notif-sent.event.ts                                │
│  │   │   │   │   └── in-app-notif-failed.event.ts                              │
│  │   │   │   ├── services/      # 领域服务                                      │
│  │   │   │   │   └── notif-center.service.ts                                   │
│  │   │   │   └── interfaces/    # 仓储接口                                      │
│  │   │   │       ├── in-app-notif.repository.interface.ts                      │
│  │   │   │       └── event-store.interface.ts                                  │
│  │   │   ├── use-cases/         # Use Cases层 - 应用业务规则                    │
│  │   │   │   ├── commands/      # 命令用例                                      │
│  │   │   │   │   ├── create-in-app-notif.use-case.ts                           │
│  │   │   │   │   ├── mark-as-read.use-case.ts                                  │
│  │   │   │   │   └── archive-notif.use-case.ts                                 │
│  │   │   │   ├── queries/       # 查询用例                                      │
│  │   │   │   │   ├── get-in-app-notifs.use-case.ts                             │
│  │   │   │   │   └── get-notif-stats.use-case.ts                               │
│  │   │   │   └── interfaces/    # 用例接口                                      │
│  │   │   │       ├── notification.service.interface.ts                         │
│  │   │   │       └── event-bus.interface.ts                                    │
│  │   │   ├── interface-adapters/ # Interface Adapters层 - 接口适配器            │
│  │   │   │   ├── controllers/   # 控制器                                        │
│  │   │   │   │   └── in-app-notif.controller.ts                                │
│  │   │   │   ├── dtos/          # 数据传输对象                                  │
│  │   │   │   │   ├── create-in-app-notif.dto.ts                                │
│  │   │   │   │   └── in-app-notif.dto.ts                                       │
│  │   │   │   ├── presenters/    # 展示器                                        │
│  │   │   │   │   └── in-app-notif.presenter.ts                                 │
│  │   │   │   ├── repositories/  # 仓储实现                                      │
│  │   │   │   │   └── in-app-notif.repository.ts                                │
│  │   │   │   └── external-services/ # 外部服务适配器                            │
│  │   │   │       └── notification.external-service.ts                          │
│  │   │   ├── frameworks-drivers/ # Frameworks & Drivers层 - 框架和驱动          │
│  │   │   │   ├── database/      # 数据库                                        │
│  │   │   │   │   ├── entities/  # 数据库实体                                    │
│  │   │   │   │   │   └── in-app-notif.entity.ts                                │
│  │   │   │   │   └── migrations/ # 数据库迁移                                   │
│  │   │   │   │       └── create-in-app-notif-table.migration.ts                │
│  │   │   │   ├── event-store/   # 事件存储 (MongoDB)                           │
│  │   │   │   │   ├── documents/ # 事件文档                                      │
│  │   │   │   │   │   ├── domain-event.document.ts                              │
│  │   │   │   │   │   └── event-snapshot.document.ts                            │
│  │   │   │   │   ├── repositories/ # 事件存储仓储                               │
│  │   │   │   │   │   ├── event.repository.ts                                   │
│  │   │   │   │   │   └── snapshot.repository.ts                                │
│  │   │   │   │   └── projections/ # 事件投射器                                  │
│  │   │   │   │       ├── in-app-notif-read-model.projector.ts                  │
│  │   │   │   │       └── notification-stats.projector.ts                       │
│  │   │   │   ├── messaging/     # 消息队列                                      │
│  │   │   │   │   ├── redis/     # Redis配置                                     │
│  │   │   │   │   └── bull/      # Bull队列                                      │
│  │   │   │   └── web/           # Web框架                                       │
│  │   │   │       └── nestjs/    # NestJS配置                                    │
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
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 依赖关系

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           通知模块依赖关系图                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  Frameworks & Drivers Layer                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Database      │  │   Messaging     │  │   Web Framework │                │
│  │   (PostgreSQL)  │  │   (Redis/Bull)  │  │   (NestJS)      │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│           │                     │                     │                        │
│           └─────────────────────┼─────────────────────┘                        │
│                                 │                                              │
│  Interface Adapters Layer                                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Controllers   │  │   Repositories  │  │ External Services│                │
│  │   DTOs          │  │   Presenters    │  │   Adapters      │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│           │                     │                     │                        │
│           └─────────────────────┼─────────────────────┘                        │
│                                 │                                              │
│  Use Cases Layer                                                               │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Commands      │  │     Queries     │  │   Interfaces    │                │
│  │   Use Cases     │  │   Use Cases     │  │   Definitions   │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│           │                     │                     │                        │
│           └─────────────────────┼─────────────────────┘                        │
│                                 │                                              │
│  Entities Layer                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Aggregates    │  │    Entities     │  │  Value Objects  │                │
│  │   Domain Events │  │  Domain Services│  │   Interfaces    │                │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 2. 各层职责说明

### 2.1 Entities层 - 企业业务规则

**职责**：

- 包含企业范围的业务规则
- 不依赖任何外部框架或技术实现
- 只包含纯业务逻辑

**组件**：

- **聚合根**: 管理业务不变性约束，发布领域事件，支持事件溯源
- **领域实体**: 具有唯一标识的业务对象
- **值对象**: 不可变的业务概念
- **领域事件**: 业务状态变更通知，事件溯源的核心
- **领域服务**: 跨聚合的业务逻辑
- **仓储接口**: 定义数据访问接口
- **事件存储接口**: 定义事件存储接口

### 2.2 Use Cases层 - 应用业务规则

**职责**：

- 包含应用特定的业务规则
- 协调Entities层的操作
- 实现具体的业务用例
- 定义接口供外层实现

**组件**：

- **命令用例**: 处理业务命令，修改状态
- **查询用例**: 处理查询请求，返回数据
- **用例接口**: 定义用例的输入输出接口

### 2.3 Interface Adapters层 - 接口适配器

**职责**：

- 转换数据格式
- 适配外部接口
- 实现Use Cases层定义的接口

**组件**：

- **控制器**: 处理HTTP请求
- **DTO**: 数据传输对象
- **展示器**: 数据展示逻辑
- **仓储实现**: 实现数据访问
- **外部服务适配器**: 适配外部服务

### 2.4 Frameworks & Drivers层 - 框架和驱动

**职责**：

- 提供技术实现
- 处理框架相关逻辑
- 管理外部依赖

**组件**：

- **数据库**: 数据持久化 (PostgreSQL)
- **事件存储**: 事件存储 (MongoDB)
- **消息队列**: 异步消息处理 (Redis + Bull)
- **Web框架**: HTTP服务 (NestJS)

## 3. 架构原则

### 3.1 依赖倒置原则

- **内层不依赖外层**: Entities层不依赖任何外层
- **外层依赖内层接口**: 外层通过接口依赖内层
- **抽象不依赖具体**: 依赖抽象接口，不依赖具体实现

### 3.2 单一职责原则

- **每层职责单一**: 每层只负责自己的职责
- **组件职责明确**: 每个组件都有明确的职责
- **高内聚低耦合**: 内部高内聚，外部低耦合

### 3.3 开闭原则

- **对扩展开放**: 可以添加新的实现
- **对修改关闭**: 不修改现有代码
- **接口稳定**: 接口保持稳定

## 4. 与项目架构对齐

### 4.1 与用户模块对齐

通知模块的架构设计与用户模块保持一致：

```
用户模块架构                   通知模块架构
├── entities/                  ├── entities/
│   ├── aggregates/            │   ├── aggregates/
│   ├── entities/              │   ├── entities/
│   ├── value-objects/         │   ├── value-objects/
│   ├── events/                │   ├── events/
│   ├── services/              │   ├── services/
│   └── interfaces/            │   └── interfaces/
├── use-cases/                 ├── use-cases/
│   ├── commands/              │   ├── commands/
│   ├── queries/               │   ├── queries/
│   └── interfaces/            │   └── interfaces/
├── interface-adapters/        ├── interface-adapters/
│   ├── controllers/           │   ├── controllers/
│   ├── dtos/                  │   ├── dtos/
│   ├── presenters/            │   ├── presenters/
│   ├── repositories/          │   ├── repositories/
│   └── external-services/     │   └── external-services/
└── frameworks-drivers/        └── frameworks-drivers/
    ├── database/                  ├── database/
    ├── messaging/                 ├── messaging/
    └── web/                       └── web/
```

### 4.2 命名规范对齐

- **文件命名**: 使用kebab-case命名
- **类命名**: 使用PascalCase命名
- **接口命名**: 以I开头，使用PascalCase
- **目录命名**: 使用kebab-case命名

### 4.3 代码结构对齐

- **导入顺序**: 先导入内层，再导入外层
- **依赖注入**: 使用构造函数注入
- **错误处理**: 统一的异常处理机制
- **日志记录**: 统一的日志格式

## 5. 实现示例

### 5.1 Entities层示例

```typescript
/**
 * @class InAppNotifAggregate
 * @description 站内通知聚合根，管理站内通知的业务规则，支持事件溯源
 *
 * 事件溯源支持：
 * 1. 继承EventSourcedAggregateRoot基类
 * 2. 所有状态变更都通过领域事件记录
 * 3. 支持事件重放和状态重建
 * 4. 提供快照机制优化性能
 */
export class InAppNotifAggregate extends EventSourcedAggregateRoot {
  private constructor(private notif: InAppNotifEntity) {
    super();
  }

  static create(
    id: NotifId,
    tenantId: TenantId,
    recipientId: UserId,
    type: NotifType,
    title: string,
    content: string,
    priority: NotifPriority,
  ): InAppNotifAggregate {
    const notifEntity = new InAppNotifEntity(
      id,
      tenantId,
      recipientId,
      type,
      title,
      content,
      priority,
    );
    const aggregate = new InAppNotifAggregate(notifEntity);

    // 发布领域事件 - 事件溯源的核心
    aggregate.addDomainEvent(
      new InAppNotifCreatedEvent(
        id,
        tenantId,
        recipientId,
        type,
        title,
        content,
        priority,
        new Date(),
      ),
    );
    return aggregate;
  }

  markAsRead(): void {
    this.notif.markAsRead();

    // 发布读取事件
    this.addDomainEvent(
      new InAppNotifReadEvent(
        this.notif.id,
        this.notif.tenantId,
        this.notif.recipientId,
        new Date(),
      ),
    );
  }

  archive(): void {
    this.notif.archive();

    // 发布归档事件
    this.addDomainEvent(
      new InAppNotifArchivedEvent(
        this.notif.id,
        this.notif.tenantId,
        this.notif.recipientId,
        new Date(),
      ),
    );
  }

  // 事件重放方法 - 从事件历史重建状态
  static fromEvents(events: IDomainEvent[]): InAppNotifAggregate {
    const aggregate = new InAppNotifAggregate(null as any);

    for (const event of events) {
      aggregate.applyEvent(event);
    }

    return aggregate;
  }

  // 应用事件到聚合根
  private applyEvent(event: IDomainEvent): void {
    switch (event.eventType) {
      case 'InAppNotifCreated':
        this.applyInAppNotifCreatedEvent(event as InAppNotifCreatedEvent);
        break;
      case 'InAppNotifRead':
        this.applyInAppNotifReadEvent(event as InAppNotifReadEvent);
        break;
      case 'InAppNotifArchived':
        this.applyInAppNotifArchivedEvent(event as InAppNotifArchivedEvent);
        break;
    }
  }

  private applyInAppNotifCreatedEvent(event: InAppNotifCreatedEvent): void {
    this.notif = new InAppNotifEntity(
      event.notifId,
      event.tenantId,
      event.recipientId,
      event.type,
      event.title,
      event.content,
      event.priority,
    );
  }

  private applyInAppNotifReadEvent(event: InAppNotifReadEvent): void {
    if (this.notif) {
      this.notif.markAsRead();
    }
  }

  private applyInAppNotifArchivedEvent(event: InAppNotifArchivedEvent): void {
    if (this.notif) {
      this.notif.archive();
    }
  }
}
```

### 5.2 Use Cases层示例

```typescript
/**
 * @class CreateInAppNotifUseCase
 * @description 创建站内通知用例，支持事件溯源
 */
@Injectable()
export class CreateInAppNotifUseCase {
  constructor(
    private readonly notifRepository: IInAppNotifRepository,
    private readonly eventStore: IEventStore,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(
    command: CreateInAppNotifCommand,
  ): Promise<CreateInAppNotifResult> {
    // 1. 创建聚合根
    const aggregate = InAppNotifAggregate.create(
      command.id,
      command.tenantId,
      command.recipientId,
      command.type,
      command.title,
      command.content,
      command.priority,
    );

    // 2. 保存事件到事件存储 (事件溯源)
    await this.eventStore.saveEvents(
      aggregate.id.value,
      aggregate.uncommittedEvents,
      aggregate.version,
    );

    // 3. 保存聚合根到仓储 (读模型)
    await this.notifRepository.save(aggregate);

    // 4. 发布事件到消息队列
    await this.eventBus.publishAll(aggregate.uncommittedEvents);

    // 5. 清空未提交事件
    aggregate.markEventsAsCommitted();

    // 6. 返回结果
    return new CreateInAppNotifResult(aggregate.id);
  }
}
```

### 5.3 Interface Adapters层示例

```typescript
/**
 * @class InAppNotifController
 * @description 站内通知控制器
 */
@Controller('api/v1/notifications/in-app')
export class InAppNotifController {
  constructor(
    private readonly createNotifUseCase: CreateInAppNotifUseCase,
    private readonly getNotifsUseCase: GetInAppNotifsUseCase,
  ) {}

  @Post()
  async createNotif(
    @Body() dto: CreateInAppNotifDto,
  ): Promise<InAppNotifResponseDto> {
    const command = new CreateInAppNotifCommand(/* ... */);
    const result = await this.createNotifUseCase.execute(command);
    return this.presenter.toResponseDto(result);
  }
}
```

### 5.4 Frameworks & Drivers层示例

```typescript
/**
 * @class InAppNotifReadModelProjector
 * @description 站内通知读模型投射器，处理事件溯源的事件投射
 */
@Injectable()
export class InAppNotifReadModelProjector {
  constructor(
    private readonly readModelRepository: IInAppNotifReadModelRepository,
    private readonly logger: Logger,
  ) {}

  /**
   * 处理站内通知创建事件
   */
  @EventHandler(InAppNotifCreatedEvent)
  async handleInAppNotifCreated(event: InAppNotifCreatedEvent): Promise<void> {
    try {
      const readModel = new InAppNotifReadModel(
        event.notifId,
        event.tenantId,
        event.recipientId,
        event.type,
        event.title,
        event.content,
        event.priority,
        'PENDING',
        event.occurredOn,
      );

      await this.readModelRepository.save(readModel);

      this.logger.log(
        `In-app notification read model created: ${event.notifId.value}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to project InAppNotifCreatedEvent: ${event.notifId.value}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 处理站内通知读取事件
   */
  @EventHandler(InAppNotifReadEvent)
  async handleInAppNotifRead(event: InAppNotifReadEvent): Promise<void> {
    try {
      await this.readModelRepository.markAsRead(
        event.notifId,
        event.occurredOn,
      );

      this.logger.log(
        `In-app notification marked as read: ${event.notifId.value}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to project InAppNotifReadEvent: ${event.notifId.value}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 处理站内通知归档事件
   */
  @EventHandler(InAppNotifArchivedEvent)
  async handleInAppNotifArchived(
    event: InAppNotifArchivedEvent,
  ): Promise<void> {
    try {
      await this.readModelRepository.archive(event.notifId, event.occurredOn);

      this.logger.log(`In-app notification archived: ${event.notifId.value}`);
    } catch (error) {
      this.logger.error(
        `Failed to project InAppNotifArchivedEvent: ${event.notifId.value}`,
        error,
      );
      throw error;
    }
  }
}
```

## 6. 总结

通知模块的Clean Architecture设计确保了：

1. **架构一致性**: 与项目中其他模块保持一致的架构设计
2. **职责清晰**: 每层都有明确的职责和边界
3. **依赖倒置**: 内层不依赖外层，通过接口实现解耦
4. **事件溯源**: 完整的事件溯源支持，提供审计能力和时间旅行功能
5. **可测试性**: 每层都可以独立测试
6. **可维护性**: 清晰的架构便于维护和扩展
7. **可扩展性**: 支持新功能的快速添加

### 6.1 事件溯源优势

通知模块的事件溯源设计提供了以下优势：

- **完整审计**: 所有通知状态变更都有完整的历史记录
- **时间旅行**: 可以查看任意时间点的通知状态
- **调试能力**: 通过事件历史可以轻松调试问题
- **数据恢复**: 可以从事件历史重建任何状态
- **业务洞察**: 通过事件分析了解用户行为模式

### 6.2 技术实现

- **事件存储**: 使用MongoDB存储事件，支持高并发写入
- **读模型**: 使用PostgreSQL存储读模型，支持复杂查询
- **事件投射**: 通过事件投射器更新读模型
- **消息队列**: 使用Redis + Bull处理异步事件
- **快照机制**: 支持快照优化性能

这种设计既满足了Clean Architecture的原则，又完整支持了事件溯源，与项目的整体架构保持一致，为通知模块的开发和维护提供了坚实的基础。

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
