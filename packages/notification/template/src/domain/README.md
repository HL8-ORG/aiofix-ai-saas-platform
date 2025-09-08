# 通知模板领域层 (Notification Template Domain Layer)

## 概述

通知模板领域层是通知模板子领域的核心业务逻辑层，遵循DDD（领域驱动设计）和Clean Architecture原则。该层包含聚合根、值对象、领域事件和领域服务，负责实现通知模板的核心业务规则和不变性约束。

## 架构设计

### 分层结构

```
domain/
├── aggregates/          # 聚合根
│   ├── email-template.aggregate.ts
│   ├── push-template.aggregate.ts
│   └── sms-template.aggregate.ts
├── entities/           # 领域实体
│   ├── email-template.entity.ts
│   ├── push-template.entity.ts
│   └── sms-template.entity.ts
├── value-objects/      # 值对象
│   ├── template-id.vo.ts
│   ├── template-type.vo.ts
│   ├── template-status.vo.ts
│   ├── template-variable.vo.ts
│   └── template-content.vo.ts
├── events/             # 领域事件
│   ├── template-created.event.ts
│   ├── template-updated.event.ts
│   ├── template-published.event.ts
│   ├── template-unpublished.event.ts
│   └── template-deleted.event.ts
├── services/           # 领域服务
│   └── template.service.ts
├── index.ts           # 入口文件
├── test-example.ts    # 使用示例
└── README.md          # 说明文档
```

## 核心组件

### 1. 聚合根 (Aggregate Root)

#### EmailTemplate

邮件模板聚合根，负责管理邮件模板的生命周期和业务规则。

**主要功能：**

- 创建和更新邮件模板
- 管理模板版本控制
- 处理模板发布和下线
- 管理模板变量和内容渲染

**业务规则：**

- 模板名称在租户内必须唯一
- 模板内容必须包含有效的HTML
- 模板变量必须预定义
- 只有已发布的模板才能使用

#### PushTemplate

推送模板聚合根，负责管理推送通知模板。

**主要功能：**

- 创建和更新推送模板
- 管理推送内容格式
- 处理模板变量替换
- 验证推送内容长度

**业务规则：**

- 推送标题长度限制
- 推送内容长度限制
- 模板变量格式验证
- 推送平台兼容性

#### SmsTemplate

短信模板聚合根，负责管理短信通知模板。

**主要功能：**

- 创建和更新短信模板
- 管理短信内容格式
- 处理模板变量替换
- 验证短信内容长度

**业务规则：**

- 短信内容长度限制（通常160字符）
- 模板变量格式验证
- 短信服务商兼容性
- 内容合规性检查

### 2. 值对象 (Value Objects)

#### TemplateId

模板ID值对象，封装模板的唯一标识符。

#### TemplateType

模板类型枚举，定义支持的模板类型：

- EMAIL: 邮件模板
- PUSH: 推送模板
- SMS: 短信模板
- WEBHOOK: Webhook模板

#### TemplateStatus

模板状态枚举，定义模板的各种状态：

- DRAFT: 草稿
- PUBLISHED: 已发布
- ARCHIVED: 已归档
- DELETED: 已删除

#### TemplateVariable

模板变量值对象，封装模板变量的定义和验证。

#### TemplateContent

模板内容值对象，封装模板的内容结构和验证。

### 3. 领域事件 (Domain Events)

#### TemplateCreatedEvent

模板创建事件，在模板创建时发布。

#### TemplateUpdatedEvent

模板更新事件，在模板更新时发布。

#### TemplatePublishedEvent

模板发布事件，在模板发布时发布。

#### TemplateUnpublishedEvent

模板下线事件，在模板下线时发布。

#### TemplateDeletedEvent

模板删除事件，在模板删除时发布。

### 4. 领域服务 (Domain Services)

#### TemplateService

模板领域服务，负责处理跨聚合的业务逻辑。

**主要功能：**

- 验证模板内容的合法性
- 处理模板变量替换
- 管理模板版本控制
- 处理模板渲染逻辑

## 使用示例

### 创建邮件模板

```typescript
import {
  EmailTemplate,
  TemplateType,
  TemplateStatus,
  TemplateVariable,
  TemplateContent,
  TenantId,
  UserId,
} from './index';

// 创建值对象
const tenantId = TenantId.create('tenant-uuid');
const userId = UserId.create('user-uuid');
const templateId = TemplateId.generate();

// 创建模板变量
const variables = [
  TemplateVariable.create('userName', 'string', '用户姓名'),
  TemplateVariable.create('companyName', 'string', '公司名称'),
];

// 创建模板内容
const content = TemplateContent.create(
  '欢迎邮件模板',
  '<h1>欢迎 {{userName}}</h1><p>欢迎加入 {{companyName}}</p>',
  '欢迎 {{userName}}\n\n欢迎加入 {{companyName}}',
);

// 创建邮件模板
const emailTemplate = EmailTemplate.create(
  templateId,
  tenantId,
  'welcome-email',
  '欢迎邮件',
  content,
  variables,
  userId,
);
```

### 模板状态管理

```typescript
// 检查状态
console.log('是否为草稿:', emailTemplate.isDraft());
console.log('是否已发布:', emailTemplate.isPublished());

// 发布模板
emailTemplate.publish();
console.log('新状态:', emailTemplate.getStatus());

// 下线模板
emailTemplate.unpublish();
console.log('最终状态:', emailTemplate.getStatus());
```

### 使用领域服务

```typescript
import { TemplateService } from './index';

const templateService = new TemplateService();

// 验证模板内容
const isValid = templateService.validateTemplateContent(
  content,
  TemplateType.EMAIL,
);

// 渲染模板
const renderedContent = templateService.renderTemplate(content, {
  userName: 'John',
  companyName: 'ABC Corp',
});

// 验证模板变量
const isValidVariable = templateService.validateTemplateVariable(
  TemplateVariable.create('userName', 'string', '用户姓名'),
);
```

## 业务规则

### 状态转换规则

```
DRAFT → PUBLISHED: 发布模板时
PUBLISHED → DRAFT: 下线模板时
PUBLISHED → ARCHIVED: 归档模板时
DRAFT → DELETED: 删除草稿模板时
ARCHIVED → DELETED: 删除归档模板时
```

### 内容验证规则

- 模板名称：1-100字符，在租户内唯一
- 模板标题：1-200字符
- 邮件HTML内容：必须包含有效的HTML标签
- 推送标题：1-50字符
- 推送内容：1-200字符
- 短信内容：1-160字符
- 模板变量：必须预定义且格式正确

### 版本控制规则

- 每次更新创建新版本
- 版本号自动递增
- 已发布版本不可修改
- 支持版本回滚

### 变量替换规则

- 变量格式：{{variableName}}
- 变量类型：string, number, boolean, date
- 变量验证：类型检查和格式验证
- 默认值：支持变量默认值

## 错误处理

领域层定义了多种错误类型：

- `InvalidTemplateIdError`: 无效模板ID错误
- `InvalidTemplateTypeError`: 无效模板类型错误
- `InvalidTemplateStatusError`: 无效模板状态错误
- `InvalidTemplateVariableError`: 无效模板变量错误
- `InvalidTemplateContentError`: 无效模板内容错误
- `TemplateNotFoundError`: 模板未找到错误
- `TemplateAlreadyExistsError`: 模板已存在错误

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

1. **新增模板类型**: 在 `TemplateType` 枚举中添加新类型
2. **新增模板状态**: 在 `TemplateStatus` 枚举中添加新状态
3. **新增业务规则**: 在 `TemplateService` 服务中添加新规则
4. **新增事件**: 创建新的领域事件类
5. **新增变量类型**: 扩展模板变量系统支持更多类型

## 注意事项

1. 所有值对象都是不可变的
2. 聚合根通过事件发布状态变更
3. 领域服务是无状态的
4. 所有业务规则都在领域层实现
5. 不依赖外部框架或基础设施
6. 模板变量验证遵循预定义规则
7. 模板渲染支持变量替换
8. 版本控制采用自动递增策略
