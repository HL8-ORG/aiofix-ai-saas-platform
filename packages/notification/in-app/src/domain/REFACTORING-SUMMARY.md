# 领域实体与聚合根分离重构总结

## 重构背景

根据项目的设计原则，我们需要将领域实体（Domain Entity）和聚合根（Aggregate Root）分离，以更好地遵循DDD的设计理念。

## 重构前的问题

1. **职责混合**：聚合根直接包含了实体的所有属性和业务逻辑
2. **违反单一职责原则**：聚合根既负责事件发布，又负责业务逻辑
3. **不符合DDD设计**：没有明确的实体和聚合根分离

## 重构后的架构

### 1. 领域实体 (Domain Entity)

#### InAppNotifEntity

- **职责**：维护站内通知的身份标识、状态管理和生命周期
- **特点**：
  - 包含所有业务属性和状态
  - 实现业务逻辑和状态转换
  - 负责数据验证和不变性约束
  - 不直接处理事件发布

```typescript
export class InAppNotifEntity {
  constructor(
    public readonly id: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly priority: NotifPriority,
    public readonly metadata: Record<string, unknown> = {},
    public readonly createdAt: Date = new Date(),
    private status: ReadStatus = ReadStatus.UNREAD,
    private updatedAt: Date = new Date(),
    private readAt?: Date,
    private archivedAt?: Date,
  ) {
    this.validateEntity();
  }

  // 业务方法
  public markAsRead(): void {
    /* 业务逻辑 */
  }
  public archive(): void {
    /* 业务逻辑 */
  }

  // 状态查询方法
  public isRead(): boolean {
    /* 状态查询 */
  }
  public isArchived(): boolean {
    /* 状态查询 */
  }
  public isUnread(): boolean {
    /* 状态查询 */
  }
}
```

### 2. 聚合根 (Aggregate Root)

#### InAppNotif

- **职责**：管理聚合的一致性边界、事件发布和事务协调
- **特点**：
  - 包含领域实体实例
  - 委托业务逻辑给实体
  - 负责事件发布
  - 提供聚合级别的访问接口

```typescript
export class InAppNotif extends EventSourcedAggregateRoot {
  private constructor(private notif: InAppNotifEntity) {
    super();
  }

  // 业务方法委托给实体
  public markAsRead(): void {
    const oldStatus = this.notif.getStatus();
    this.notif.markAsRead(); // 委托给实体
    const newStatus = this.notif.getStatus();

    // 发布事件
    this.addDomainEvent(new InAppNotifReadEvent(/* ... */));
  }

  // 访问器方法
  public get id(): NotifId {
    return this.notif.id;
  }
  public get title(): string {
    return this.notif.title;
  }
  // ... 其他访问器
}
```

## 重构的优势

### 1. 职责分离

- **实体**：专注于业务逻辑和状态管理
- **聚合根**：专注于事件发布和聚合一致性

### 2. 更好的可测试性

- 可以独立测试实体的业务逻辑
- 可以独立测试聚合根的事件发布逻辑

### 3. 更清晰的架构

- 符合DDD的设计原则
- 更容易理解和维护

### 4. 更好的扩展性

- 可以在聚合内添加更多实体
- 可以独立修改实体和聚合根的实现

## 文件结构变化

### 新增文件

```
packages/notification/in-app/src/domain/
├── entities/                    # 新增：领域实体目录
│   └── in-app-notif.entity.ts  # 新增：站内通知实体
├── aggregates/                  # 修改：聚合根目录
│   └── in-app-notif.aggregate.ts # 修改：重构聚合根
└── ...
```

### 修改的文件

1. **aggregates/in-app-notif.aggregate.ts**
   - 移除直接属性定义
   - 添加实体实例
   - 委托业务逻辑给实体
   - 保留事件发布逻辑

2. **index.ts**
   - 添加实体导出
   - 更新错误类导出

## 测试验证

重构后的代码通过了所有测试：

```
=== 站内通知领域层使用示例 ===
创建的值对象:
- NotifId: 78fb24ed-dee6-4320-a681-2ec897232372
- TenantId: 0c18f1b3-fb34-4dd9-9cec-8ef3c66e8d10
- UserId: 32cc1750-5dc5-45ea-9587-6ee60f8df59f

创建的站内通知:
- ID: 78fb24ed-dee6-4320-a681-2ec897232372
- 标题: 系统维护通知
- 内容: 系统将在今晚进行维护，预计持续2小时。
- 类型: SYSTEM
- 优先级: HIGH
- 状态: UNREAD

标记为已读...
- 新状态: READ
- 是否已读: true
- 阅读时间: 2025-09-07T20:00:34.118Z

归档通知...
- 新状态: ARCHIVED
- 是否已归档: true
- 归档时间: 2025-09-07T20:00:34.119Z
```

## 设计原则遵循

### 1. 单一职责原则 (SRP)

- 实体：负责业务逻辑和状态管理
- 聚合根：负责事件发布和聚合一致性

### 2. 开闭原则 (OCP)

- 可以扩展新的实体而不修改聚合根
- 可以扩展新的业务逻辑而不影响事件发布

### 3. 依赖倒置原则 (DIP)

- 聚合根依赖抽象的实体接口
- 实体不依赖聚合根

### 4. 接口隔离原则 (ISP)

- 实体提供业务逻辑接口
- 聚合根提供事件发布接口

## 未来扩展

这种设计为未来的扩展提供了良好的基础：

### 1. 添加更多实体

```typescript
export class InAppNotif extends EventSourcedAggregateRoot {
  private constructor(
    private notif: InAppNotifEntity,
    private attachments: NotifAttachment[], // 新增实体
    private recipients: NotifRecipient[], // 新增实体
  ) {
    super();
  }
}
```

### 2. 添加更多业务逻辑

```typescript
export class InAppNotifEntity {
  // 新增业务方法
  public addAttachment(attachment: NotifAttachment): void {
    /* ... */
  }
  public removeAttachment(attachmentId: AttachmentId): void {
    /* ... */
  }
  public updateContent(newContent: string): void {
    /* ... */
  }
}
```

## 总结

通过这次重构，我们成功地：

1. **分离了职责**：实体负责业务逻辑，聚合根负责事件发布
2. **提高了可维护性**：代码结构更清晰，职责更明确
3. **增强了可测试性**：可以独立测试各个组件
4. **符合了DDD原则**：遵循了领域驱动设计的最佳实践
5. **保持了功能完整性**：所有原有功能都正常工作

这种设计为后续的应用层、基础设施层和接口层开发提供了更好的基础架构。
