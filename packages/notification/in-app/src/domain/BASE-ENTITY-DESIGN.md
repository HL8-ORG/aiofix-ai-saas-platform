# BaseEntity 基础实体类设计

## 设计背景

你提出的建议非常正确：**审计字段是全局通用的需求，应该设计为一个基础类**。不仅如此，基础实体类还可以包含更多的通用功能，而不仅仅是审计。

## BaseEntity 设计理念

### 1. **通用性**

- 所有领域实体都应该继承此类
- 提供统一的实体接口和行为
- 支持多租户数据隔离
- 确保数据的完整性和一致性

### 2. **扩展性**

- 为未来的扩展需求预留接口
- 支持自定义验证逻辑
- 提供事件支持的基础框架
- 支持实体克隆和比较

## 核心功能

### 1. **审计追踪**

```typescript
// 创建审计
public readonly createdAt: Date;
public readonly createdBy: string;

// 更新审计
private _updatedAt: Date;
private _updatedBy: string;
private _version: number; // 乐观锁

// 删除审计
private _isDeleted: boolean;
private _deletedAt?: Date;
private _deletedBy?: string;
```

### 2. **版本控制**

- 乐观锁支持，防止并发冲突
- 每次更新自动递增版本号
- 支持数据同步和冲突检测

### 3. **软删除**

- 支持数据恢复和删除审计
- 记录删除时间和删除者
- 提供恢复功能

### 4. **状态管理**

- 提供实体的生命周期管理
- 支持状态验证和转换
- 确保状态一致性

### 5. **验证支持**

- 提供实体验证的基础框架
- 支持自定义验证逻辑
- 统一的错误处理

### 6. **事件支持**

- 为领域事件提供基础支持
- 支持实体变更追踪
- 为事件溯源提供基础

## 抽象方法设计

### 1. **必须实现的抽象方法**

```typescript
// 获取实体ID
public abstract getEntityId(): string;

// 获取租户ID（多租户支持）
public abstract getTenantId(): string;
```

### 2. **可重写的方法**

```typescript
// 验证实体的有效性
protected validate(): void {
  this.validateAuditState();
  // 子类可以重写此方法添加特定的验证逻辑
}

// 比较两个实体是否相等
public equals(other: BaseEntity): boolean {
  // 子类应该重写此方法提供具体的相等性判断逻辑
}

// 克隆实体
public clone(): BaseEntity {
  // 子类应该重写此方法提供具体的克隆逻辑
}

// 转换为JSON对象
public toJSON(): object {
  // 子类可以重写此方法
}
```

## 使用示例

### 1. **继承BaseEntity**

```typescript
export class InAppNotifEntity extends BaseEntity {
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

  // 实现抽象方法
  public getEntityId(): string {
    return this.id.value;
  }

  public getTenantId(): string {
    return this.tenantId.value;
  }

  // 重写验证方法
  protected validate(): void {
    super.validate(); // 调用基类验证

    // 业务特定的验证
    if (!this.title || this.title.trim().length === 0) {
      throw new InvalidNotifDataError('Notification title is required');
    }
    // ... 其他验证逻辑
  }

  // 重写equals方法
  public equals(other: InAppNotifEntity): boolean {
    if (!other) return false;
    if (this === other) return true;
    return this.id.equals(other.id);
  }

  // 业务方法使用基类审计功能
  public markAsRead(updatedBy: string = 'system'): void {
    this.status = ReadStatus.READ;
    this.readAt = new Date();

    // 使用基类的审计更新方法
    this.updateAuditInfo(updatedBy);
  }
}
```

### 2. **审计功能使用**

```typescript
const notif = new InAppNotifEntity(/* ... */);

// 自动记录创建审计
console.log(notif.getCreatedBy()); // 'system'
console.log(notif.getCreatedAt()); // 创建时间

// 业务操作自动更新审计
notif.markAsRead('user-123');
console.log(notif.getUpdatedBy()); // 'user-123'
console.log(notif.getVersion()); // 2

// 软删除
notif.softDelete('admin-456');
console.log(notif.isDeleted()); // true
console.log(notif.getDeletedBy()); // 'admin-456'

// 恢复
notif.restore('admin-789');
console.log(notif.isDeleted()); // false
```

## 设计优势

### 1. **代码复用**

- 所有实体共享相同的审计逻辑
- 减少重复代码
- 统一的行为和接口

### 2. **一致性**

- 所有实体都有相同的审计字段
- 统一的验证和错误处理
- 一致的状态管理

### 3. **可维护性**

- 审计逻辑集中管理
- 易于修改和扩展
- 清晰的职责分离

### 4. **可测试性**

- 可以独立测试基类功能
- 子类测试更简单
- 统一的测试模式

### 5. **扩展性**

- 可以轻松添加新的通用功能
- 支持自定义验证逻辑
- 为未来需求预留接口

## 未来扩展

### 1. **缓存支持**

```typescript
public getCacheKey(): string {
  return `${this.getEntityType()}:${this.getEntityId()}`;
}
```

### 2. **序列化支持**

```typescript
public serialize(): string {
  return JSON.stringify(this.toJSON());
}

public static deserialize(data: string): BaseEntity {
  // 反序列化逻辑
}
```

### 3. **事件支持**

```typescript
private domainEvents: IDomainEvent[] = [];

protected addDomainEvent(event: IDomainEvent): void {
  this.domainEvents.push(event);
}

public getDomainEvents(): IDomainEvent[] {
  return this.domainEvents;
}
```

### 4. **多租户支持**

```typescript
public getDataIsolationKey(): string {
  return `${this.getTenantId()}:${this.getEntityType()}:${this.getEntityId()}`;
}
```

## 总结

通过设计 `BaseEntity` 基础类，我们实现了：

1. **统一的审计能力**：所有实体都具备完整的审计追踪
2. **代码复用**：减少重复代码，提高开发效率
3. **一致性保证**：统一的接口和行为
4. **扩展性**：为未来需求预留接口
5. **可维护性**：集中管理通用功能

这种设计为整个项目提供了坚实的基础，确保了所有领域实体都具备企业级应用所需的核心功能。
