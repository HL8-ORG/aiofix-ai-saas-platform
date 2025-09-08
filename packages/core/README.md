# @aiofix/core

Aiofix平台核心领域模型和基础类包，提供所有子领域共享的基础类和接口。

## 功能特性

### 1. 基础实体类 (BaseEntity)

- 完整的审计追踪功能
- 版本控制和乐观锁
- 软删除和恢复
- 统一的验证框架
- 实体克隆和比较

### 2. 事件溯源聚合根 (EventSourcedAggregateRoot)

- 领域事件管理
- 事件发布和订阅
- 事件溯源支持

### 3. 通用工具类

- UUID生成和验证
- 其他通用工具函数

## 安装

```bash
pnpm add @aiofix/core
```

## 使用示例

### 继承BaseEntity

```typescript
import { BaseEntity } from '@aiofix/core';

export class MyEntity extends BaseEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    createdBy?: string,
  ) {
    super(createdBy);
  }

  // 必须实现的抽象方法
  public getEntityId(): string {
    return this.id;
  }

  public getTenantId(): string {
    return 'default-tenant';
  }

  // 重写验证方法
  protected validate(): void {
    super.validate();

    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Name is required');
    }
  }

  // 业务方法
  public updateName(newName: string, updatedBy: string): void {
    this.name = newName;
    this.updateAuditInfo(updatedBy);
  }
}
```

### 使用事件溯源聚合根

```typescript
import { EventSourcedAggregateRoot, IDomainEvent } from '@aiofix/core';

export class MyAggregate extends EventSourcedAggregateRoot {
  public createEntity(name: string): void {
    // 业务逻辑
    const entity = new MyEntity('id-123', name);

    // 发布事件
    this.addDomainEvent(new EntityCreatedEvent(entity.id, name));
  }
}
```

### 使用UUID工具

```typescript
import { generateUUID, validateUUID } from '@aiofix/core';

// 生成UUID
const id = generateUUID();
console.log(id); // "550e8400-e29b-41d4-a716-446655440000"

// 验证UUID
const isValid = validateUUID(id);
console.log(isValid); // true
```

## API 文档

### BaseEntity

#### 属性

- `createdAt: Date` - 创建时间
- `createdBy: string` - 创建者ID

#### 方法

- `getEntityId(): string` - 获取实体ID（抽象方法）
- `getTenantId(): string` - 获取租户ID（抽象方法）
- `isValid(): boolean` - 检查实体是否有效
- `equals(other: BaseEntity): boolean` - 比较两个实体是否相等
- `clone(): BaseEntity` - 克隆实体
- `toJSON(): object` - 转换为JSON对象
- `softDelete(deletedBy?: string): void` - 软删除
- `restore(updatedBy?: string): void` - 恢复已删除的实体

### EventSourcedAggregateRoot

#### 方法

- `addDomainEvent(event: IDomainEvent): void` - 添加领域事件
- `getDomainEvents(): IDomainEvent[]` - 获取领域事件列表
- `clearDomainEvents(): void` - 清除领域事件
- `markEventsAsCommitted(): void` - 标记事件为已提交

### 工具函数

#### generateUUID(): string

生成UUID v4格式的字符串

#### validateUUID(uuid: string): boolean

验证UUID格式是否正确

## 设计原则

1. **通用性**：所有子领域都可以使用
2. **一致性**：提供统一的接口和行为
3. **扩展性**：为未来需求预留接口
4. **可维护性**：集中管理通用功能
5. **可测试性**：支持独立测试

## 版本历史

### 1.0.0

- 初始版本
- 提供BaseEntity基础实体类
- 提供EventSourcedAggregateRoot事件溯源聚合根
- 提供UUID工具函数
