# @aiofix/core - 核心架构包

## 概述

`@aiofix/core` 是SAAS平台的核心架构包，提供DDD（领域驱动设计）、CQRS（命令查询职责分离）和事件溯源的基础组件。这些组件为整个系统提供了统一的架构基础。

## 核心特性

- **事件溯源**：完整的聚合根事件管理
- **CQRS模式**：命令和查询分离
- **多租户数据隔离**：五层数据隔离架构
- **类型安全**：完整的TypeScript类型定义
- **可扩展性**：基于接口的设计，易于扩展

## 安装

```bash
pnpm add @aiofix/core
```

## 核心组件

### 1. 事件溯源

#### EventSourcedAggregateRoot

所有使用事件溯源的聚合根都应该继承此基类：

```typescript
import { EventSourcedAggregateRoot, IDomainEvent } from '@aiofix/core';

export class User extends EventSourcedAggregateRoot {
  public readonly id: string;
  private _email: string = '';
  private _name: string = '';

  constructor(id?: string) {
    super();
    this.id = id || uuidv4();
  }

  public static create(email: string, name: string): User {
    const user = new User();
    const event = new UserCreatedEvent(user.id, email, name);
    user.apply(event);
    return user;
  }

  protected handleEvent(event: IDomainEvent, isFromHistory: boolean): void {
    if (event instanceof UserCreatedEvent) {
      this._email = event.email;
      this._name = event.name;
    }
  }

  protected toSnapshot(): any {
    return {
      id: this.id,
      email: this._email,
      name: this._name,
    };
  }

  protected fromSnapshot(data: any): void {
    this._email = data.email;
    this._name = data.name;
  }
}
```

#### DomainEvent

所有领域事件都应该继承此基类：

```typescript
import { DomainEvent } from '@aiofix/core';

export class UserCreatedEvent extends DomainEvent {
  public readonly email: string;
  public readonly name: string;

  constructor(aggregateId: string, email: string, name: string) {
    super(aggregateId);
    this.email = email;
    this.name = name;
  }

  toJSON(): any {
    return {
      ...this.getBaseEventData(),
      email: this.email,
      name: this.name,
    };
  }
}
```

### 2. CQRS模式

#### Command

所有命令都应该继承此基类：

```typescript
import { Command } from '@aiofix/core';

export class CreateUserCommand extends Command {
  public readonly email: string;
  public readonly name: string;

  constructor(email: string, name: string) {
    super();
    this.email = email;
    this.name = name;
  }

  toJSON(): any {
    return {
      ...this.getBaseCommandData(),
      email: this.email,
      name: this.name,
    };
  }
}
```

#### Query

所有查询都应该继承此基类：

```typescript
import { Query } from '@aiofix/core';

export class GetUserQuery extends Query {
  public readonly userId: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
  }

  toJSON(): any {
    return {
      ...this.getBaseQueryData(),
      userId: this.userId,
    };
  }
}
```

### 3. 多租户数据隔离

#### DataIsolationService

数据隔离服务提供多租户数据访问控制：

```typescript
import { DataIsolationService, DataIsolationContext } from '@aiofix/core';

const isolationService = new DataIsolationService();

// 获取用户的数据隔离上下文
const context = await isolationService.getDataIsolationContext(userId);

// 检查数据访问权限
const hasAccess = await isolationService.checkDataAccess(
  dataId,
  context,
  'read',
);

// 应用数据隔离过滤器
const filteredQuery = isolationService.applyDataIsolation(query, context);
```

#### 数据隔离级别

系统支持五个数据隔离级别：

- **PLATFORM**：平台级数据隔离
- **TENANT**：租户级数据隔离
- **ORGANIZATION**：组织级数据隔离
- **DEPARTMENT**：部门级数据隔离
- **USER**：用户级数据隔离

## 使用示例

### 创建用户聚合根

```typescript
import { User } from './user.aggregate';

// 创建用户
const user = User.create('user@example.com', 'John Doe');

// 更新用户资料
user.updateProfile({ name: 'Jane Doe' });

// 获取未提交的事件
const events = user.uncommittedEvents;

// 标记事件为已提交
user.markEventsAsCommitted();
```

### 事件存储

```typescript
import { IEventStore } from '@aiofix/core';

class EventStore implements IEventStore {
  async saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    // 实现事件保存逻辑
  }

  async getEvents(
    aggregateId: string,
    fromVersion?: number,
  ): Promise<IDomainEvent[]> {
    // 实现事件检索逻辑
  }

  // ... 其他方法实现
}
```

### 数据隔离

```typescript
import { DataIsolationService, ISOLATION_LEVELS } from '@aiofix/core';

const isolationService = new DataIsolationService();

// 获取用户上下文
const context = await isolationService.getDataIsolationContext('user-123');

// 根据隔离级别应用过滤器
switch (context.isolationLevel) {
  case ISOLATION_LEVELS.TENANT:
    // 只能访问租户内数据
    break;
  case ISOLATION_LEVELS.USER:
    // 只能访问用户自己的数据
    break;
}
```

## 最佳实践

### 1. 聚合根设计

- 保持聚合根的小型化和内聚性
- 通过事件进行状态变更
- 实现完整的业务规则验证
- 提供清晰的工厂方法

### 2. 事件设计

- 事件应该是不可变的
- 事件名称应该使用过去时态
- 事件应该包含足够的上下文信息
- 避免在事件中包含敏感信息

### 3. 数据隔离

- 始终检查数据访问权限
- 使用数据隔离服务进行权限验证
- 在查询时应用适当的过滤器
- 记录数据访问审计日志

### 4. 错误处理

- 使用领域异常表示业务错误
- 提供清晰的错误消息
- 记录详细的错误日志
- 实现优雅的错误恢复机制

## 测试

运行测试：

```bash
pnpm test
```

运行特定测试：

```bash
pnpm test user.aggregate.test.ts
```

## 贡献

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 支持

如有问题或建议，请：

1. 查看文档
2. 搜索现有问题
3. 创建新问题
4. 联系开发团队
