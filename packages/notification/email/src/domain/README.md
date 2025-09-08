# 邮件通知领域层 (Email Notification Domain Layer)

## 概述

邮件通知领域层是邮件通知子领域的核心业务逻辑层，遵循DDD（领域驱动设计）和Clean Architecture原则。该层包含聚合根、值对象、领域事件和领域服务，负责实现邮件通知的核心业务规则和不变性约束。

## 架构设计

### 分层结构

```
domain/
├── aggregates/          # 聚合根
│   ├── email-notif.aggregate.ts
│   └── email-template.aggregate.ts
├── entities/           # 领域实体
│   ├── email-notif.entity.ts
│   └── email-template.entity.ts
├── value-objects/      # 值对象
│   ├── email-address.vo.ts
│   ├── email-status.vo.ts
│   ├── email-provider.vo.ts
│   ├── template-id.vo.ts
│   └── email-content.vo.ts
├── events/             # 领域事件
│   ├── email-notif-created.event.ts
│   ├── email-notif-sending.event.ts
│   ├── email-notif-sent.event.ts
│   ├── email-notif-failed.event.ts
│   └── email-notif-permanently-failed.event.ts
├── services/           # 领域服务
│   └── email-notif.service.ts
├── index.ts           # 入口文件
├── test-example.ts    # 使用示例
└── README.md          # 说明文档
```

## 核心组件

### 1. 聚合根 (Aggregate Root)

#### EmailNotif

邮件通知聚合根，负责管理邮件通知的生命周期和业务规则。

**主要功能：**

- 创建邮件通知
- 管理发送状态
- 处理发送失败和重试逻辑
- 跟踪邮件送达状态

**业务规则：**

- 邮件地址必须符合RFC 5322标准
- 发送状态只能按预定义规则转换
- 发送失败时自动触发重试机制
- 达到最大重试次数后标记为永久失败

#### EmailTemplate

邮件模板聚合根，负责管理邮件模板的创建、版本控制和内容渲染。

**主要功能：**

- 创建和更新邮件模板
- 管理模板版本
- 处理模板变量替换
- 验证模板内容格式

**业务规则：**

- 模板名称在租户内必须唯一
- 模板内容必须包含有效的HTML
- 模板变量必须预定义
- 只有已发布的模板才能使用

### 2. 值对象 (Value Objects)

#### EmailAddress

邮箱地址值对象，封装邮箱地址的验证和标准化。

#### EmailStatus

邮件状态枚举，定义邮件发送的各种状态：

- PENDING: 待发送
- SENDING: 发送中
- SENT: 已发送
- DELIVERED: 已送达
- FAILED: 发送失败
- PERMANENTLY_FAILED: 永久失败

#### EmailProvider

邮件服务商枚举，定义支持的邮件服务商：

- SMTP: SMTP服务器
- SENDGRID: SendGrid服务
- MAILGUN: Mailgun服务
- SES: AWS SES服务

#### TemplateId

模板ID值对象，封装模板的唯一标识符。

#### EmailContent

邮件内容值对象，封装邮件主题、HTML内容和纯文本内容。

### 3. 领域事件 (Domain Events)

#### EmailNotifCreatedEvent

邮件通知创建事件，在邮件通知创建时发布。

#### EmailNotifSendingEvent

邮件通知发送中事件，在邮件开始发送时发布。

#### EmailNotifSentEvent

邮件通知已发送事件，在邮件发送成功时发布。

#### EmailNotifFailedEvent

邮件通知发送失败事件，在邮件发送失败时发布。

#### EmailNotifPermanentlyFailedEvent

邮件通知永久失败事件，在邮件发送达到最大重试次数时发布。

### 4. 领域服务 (Domain Services)

#### EmailNotifService

邮件通知领域服务，负责处理跨聚合的业务逻辑。

**主要功能：**

- 验证邮件地址格式
- 计算邮件发送优先级
- 处理邮件模板渲染
- 管理邮件发送策略

## 使用示例

### 创建邮件通知

```typescript
import {
  EmailNotif,
  EmailAddress,
  TenantId,
  UserId,
  NotifType,
  NotifPriority,
  TemplateId,
} from './index';

// 创建值对象
const emailAddress = EmailAddress.create('user@example.com');
const tenantId = TenantId.create('tenant-uuid');
const userId = UserId.create('user-uuid');
const templateId = TemplateId.create('template-uuid');

// 创建邮件通知
const emailNotif = EmailNotif.create(
  tenantId,
  userId,
  emailAddress,
  '系统维护通知',
  '系统将在今晚进行维护',
  templateId,
  NotifPriority.HIGH,
  { maintenanceTime: '2024-01-01 02:00:00' },
);
```

### 状态管理

```typescript
// 检查状态
console.log('是否待发送:', emailNotif.isPending());
console.log('是否可以重试:', emailNotif.canRetry());

// 标记为发送中
emailNotif.markAsSending();
console.log('新状态:', emailNotif.getStatus());

// 标记为已发送
emailNotif.markAsSent();
console.log('最终状态:', emailNotif.getStatus());
```

### 使用领域服务

```typescript
import { EmailNotifService } from './index';

const emailService = new EmailNotifService();

// 验证邮件地址
const isValid = emailService.validateEmailAddress('user@example.com');

// 渲染邮件模板
const renderedContent = emailService.renderTemplate(templateId, {
  userName: 'John',
  companyName: 'ABC Corp',
});

// 计算发送优先级
const priority = emailService.calculatePriority(
  NotifType.SYSTEM,
  true, // 紧急
  { isImportant: true },
);
```

## 业务规则

### 状态转换规则

```
PENDING → SENDING: 开始发送邮件时
SENDING → SENT: 邮件发送成功时
SENDING → FAILED: 邮件发送失败时
FAILED → SENDING: 重试发送时
FAILED → PERMANENTLY_FAILED: 达到最大重试次数时
SENT → DELIVERED: 邮件送达时（可选）
```

### 内容验证规则

- 邮件地址格式：必须符合RFC 5322标准
- 邮件主题长度：1-200字符
- 邮件内容长度：1-10000字符
- HTML内容：必须包含有效的HTML标签
- 模板变量：必须预定义且格式正确

### 重试规则

- 默认最大重试次数：3次
- 重试间隔：指数退避策略
- 永久性错误：不进行重试
- 临时性错误：自动重试

## 错误处理

领域层定义了多种错误类型：

- `InvalidEmailAddressError`: 无效邮件地址错误
- `InvalidEmailStatusError`: 无效邮件状态错误
- `InvalidEmailProviderError`: 无效邮件服务商错误
- `InvalidTemplateIdError`: 无效模板ID错误
- `InvalidEmailContentError`: 无效邮件内容错误
- `EmailNotifNotFoundError`: 邮件通知未找到错误
- `TemplateNotFoundError`: 模板未找到错误

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

1. **新增邮件服务商**: 在 `EmailProvider` 枚举中添加新服务商
2. **新增邮件状态**: 在 `EmailStatus` 枚举中添加新状态
3. **新增业务规则**: 在 `EmailNotifService` 服务中添加新规则
4. **新增事件**: 创建新的领域事件类
5. **新增模板类型**: 扩展模板系统支持更多类型

## 注意事项

1. 所有值对象都是不可变的
2. 聚合根通过事件发布状态变更
3. 领域服务是无状态的
4. 所有业务规则都在领域层实现
5. 不依赖外部框架或基础设施
6. 邮件地址验证遵循RFC 5322标准
7. 模板渲染支持变量替换
8. 重试机制采用指数退避策略
