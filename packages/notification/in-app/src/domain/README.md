# 站内通知领域层 (In-App Notification Domain Layer)

## 概述

站内通知领域层是站内通知子领域的核心业务逻辑层，遵循DDD（领域驱动设计）和Clean Architecture原则。该层包含聚合根、值对象、领域事件和领域服务，负责实现站内通知的核心业务规则和不变性约束。

## 架构设计

### 分层结构

```
domain/
├── aggregates/          # 聚合根
│   └── in-app-notif.aggregate.ts
├── value-objects/       # 值对象
│   ├── notif-id.vo.ts
│   ├── tenant-id.vo.ts
│   ├── user-id.vo.ts
│   ├── notif-type.vo.ts
│   ├── notif-priority.vo.ts
│   └── read-status.vo.ts
├── events/              # 领域事件
│   ├── in-app-notif-created.event.ts
│   ├── in-app-notif-read.event.ts
│   └── in-app-notif-archived.event.ts
├── services/            # 领域服务
│   └── notif-center.service.ts
├── index.ts            # 入口文件
├── test-example.ts     # 使用示例
└── README.md           # 说明文档
```

## 核心组件

### 1. 聚合根 (Aggregate Root)

#### InAppNotif

站内通知聚合根，负责管理站内通知的生命周期和业务规则。

**主要功能：**

- 创建站内通知
- 标记通知为已读
- 归档通知
- 状态验证和转换

**业务规则：**

- 通知ID一旦创建不可变更
- 状态转换必须遵循预定义的状态机
- 通知内容不能为空或超过长度限制

### 2. 值对象 (Value Objects)

#### NotifId

通知唯一标识符，封装UUID v4格式的ID。

#### TenantId

租户唯一标识符，用于多租户数据隔离。

#### UserId

用户唯一标识符，标识通知的接收者。

#### NotifType

通知类型枚举，定义12种业务类型：

- SYSTEM: 系统通知
- PLATFORM_MANAGEMENT: 平台管理
- TENANT_MANAGEMENT: 租户管理
- USER_MANAGEMENT: 用户管理
- ORGANIZATION_MANAGEMENT: 组织管理
- DEPARTMENT_MANAGEMENT: 部门管理
- ROLE_MANAGEMENT: 角色管理
- PERMISSION_MANAGEMENT: 权限管理
- BUSINESS: 业务通知
- REMINDER: 提醒通知
- ALERT: 警告通知
- INFO: 信息通知

#### NotifPriority

通知优先级枚举，定义5个优先级级别：

- LOW: 低优先级
- NORMAL: 普通优先级
- HIGH: 高优先级
- URGENT: 紧急优先级
- CRITICAL: 关键优先级

#### ReadStatus

读取状态枚举，定义3种状态：

- UNREAD: 未读
- READ: 已读
- ARCHIVED: 已归档

### 3. 领域事件 (Domain Events)

#### InAppNotifCreatedEvent

站内通知创建事件，在通知创建时发布。

#### InAppNotifReadEvent

站内通知已读事件，在通知标记为已读时发布。

#### InAppNotifArchivedEvent

站内通知归档事件，在通知归档时发布。

### 4. 领域服务 (Domain Services)

#### NotifCenter

通知中心领域服务，负责处理跨聚合的业务逻辑。

**主要功能：**

- 判断是否可以发送通知
- 计算通知优先级
- 验证通知内容
- 判断是否应该通知用户

## 使用示例

### 创建站内通知

```typescript
import {
  InAppNotif,
  NotifId,
  TenantId,
  UserId,
  NotifType,
  NotifPriority,
} from './index';

// 创建值对象
const notifId = NotifId.generate();
const tenantId = TenantId.create('tenant-uuid');
const userId = UserId.create('user-uuid');

// 创建站内通知
const notif = InAppNotif.create(
  notifId,
  tenantId,
  userId,
  NotifType.SYSTEM,
  '系统维护通知',
  '系统将在今晚进行维护',
  NotifPriority.HIGH,
  { maintenanceTime: '2024-01-01 02:00:00' },
);
```

### 状态管理

```typescript
// 检查状态
console.log('是否未读:', notif.isUnread());
console.log('是否可读:', notif.canBeRead());
console.log('是否可归档:', notif.canBeArchived());

// 标记为已读
notif.markAsRead();
console.log('新状态:', notif.getStatus());

// 归档通知
notif.archive();
console.log('最终状态:', notif.getStatus());
```

### 使用领域服务

```typescript
import { NotifCenter } from './index';

const notifCenter = new NotifCenter();

// 检查是否可以发送通知
const canSend = notifCenter.canSendNotif(userId, tenantId, NotifType.SYSTEM);

// 计算优先级
const priority = notifCenter.calculatePriority(
  NotifType.ALERT,
  true, // 紧急
  { isImportant: true },
);

// 验证内容
const isValid = notifCenter.validateNotifContent(
  '警告通知',
  '这是一个重要的警告信息',
  NotifType.ALERT,
);
```

## 业务规则

### 状态转换规则

```
UNREAD → READ: 用户查看通知时
READ → ARCHIVED: 用户归档通知时
UNREAD → ARCHIVED: 用户直接归档未读通知时
```

### 内容验证规则

- 标题长度：1-200字符
- 内容长度：1-5000字符
- 系统通知：标题和内容不能为空
- 警告通知：标题必须包含"警告"或"Alert"

### 优先级规则

- 系统通知：默认HIGH优先级
- 警告通知：默认URGENT优先级
- 紧急标记：自动升级为CRITICAL优先级
- 重要标记：自动升级一个优先级级别

## 错误处理

领域层定义了多种错误类型：

- `InvalidNotifIdError`: 无效通知ID错误
- `InvalidTenantIdError`: 无效租户ID错误
- `InvalidUserIdError`: 无效用户ID错误
- `InvalidNotifTypeError`: 无效通知类型错误
- `InvalidNotifPriorityError`: 无效优先级错误
- `InvalidStatusTransitionError`: 无效状态转换错误
- `InvalidEventDataError`: 无效事件数据错误
- `InvalidNotifDataError`: 无效通知数据错误

## 设计原则

1. **单一职责原则**: 每个类只负责一个业务概念
2. **开闭原则**: 对扩展开放，对修改关闭
3. **里氏替换原则**: 子类可以替换父类
4. **接口隔离原则**: 使用小而专一的接口
5. **依赖倒置原则**: 依赖抽象而不是具体实现

## 测试

领域层包含完整的使用示例，位于 `test-example.ts` 文件中。该文件演示了：

- 值对象的创建和验证
- 聚合根的业务方法调用
- 领域服务的使用
- 错误处理机制

## 扩展性

领域层设计具有良好的扩展性：

1. **新增通知类型**: 在 `NotifType` 枚举中添加新类型
2. **新增优先级**: 在 `NotifPriority` 枚举中添加新优先级
3. **新增状态**: 在 `ReadStatus` 枚举中添加新状态
4. **新增业务规则**: 在 `NotifCenter` 服务中添加新规则
5. **新增事件**: 创建新的领域事件类

## 注意事项

1. 所有值对象都是不可变的
2. 聚合根通过事件发布状态变更
3. 领域服务是无状态的
4. 所有业务规则都在领域层实现
5. 不依赖外部框架或基础设施
