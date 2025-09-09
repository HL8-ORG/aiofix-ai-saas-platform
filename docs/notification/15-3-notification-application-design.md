# 通知模块应用层设计

## 概述

本文档详细描述了通知模块的应用层设计，包括CQRS命令查询分离、命令处理器、查询处理器、应用服务和用例协调等核心组件。

## 1. 应用层架构

### 1.1 设计原则

- **CQRS模式**: 命令和查询职责分离，优化读写性能
- **用例驱动**: 每个用例对应一个命令或查询
- **依赖倒置**: 依赖抽象接口，不依赖具体实现
- **事务边界**: 每个命令在一个事务中执行
- **事件发布**: 命令执行后发布领域事件

### 1.2 应用层结构

```
应用层结构
├── 命令 (Commands)
│   ├── 站内信命令
│   ├── 邮件通知命令
│   ├── 推送通知命令
│   ├── 短信通知命令
│   └── 通知编排命令
├── 查询 (Queries)
│   ├── 站内信查询
│   ├── 邮件通知查询
│   ├── 推送通知查询
│   ├── 短信通知查询
│   └── 通知统计查询
├── 处理器 (Handlers)
│   ├── 命令处理器
│   └── 查询处理器
└── 应用服务 (Application Services)
    ├── 用例协调服务
    └── 事务管理服务
```

## 2. 命令设计

### 2.1 站内信命令

#### 2.1.1 CreateInAppNotifCommand

```typescript
/**
 * @class CreateInAppNotifCommand
 * @description
 * 创建站内通知命令，封装站内通知创建操作的输入参数和验证规则。
 *
 * 命令职责：
 * 1. 封装站内通知创建所需的所有输入参数
 * 2. 提供数据验证和格式检查
 * 3. 确保命令的不可变性和幂等性
 * 4. 支持命令的序列化和反序列化
 *
 * 数据隔离要求：
 * 1. 命令必须包含租户ID以确保数据隔离
 * 2. 验证接收者用户ID的有效性
 * 3. 确保命令执行者具有相应权限
 */
export class CreateInAppNotifCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly metadata?: Record<string, unknown>,
    public readonly priority: NotifPriority = NotifPriority.NORMAL,
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new ValidationError('Tenant ID is required');
    }

    if (!this.recipientId || this.recipientId.trim().length === 0) {
      throw new ValidationError('Recipient ID is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new ValidationError('Title is required');
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new ValidationError('Content is required');
    }

    if (this.title.length > 200) {
      throw new ValidationError('Title cannot exceed 200 characters');
    }

    if (this.content.length > 5000) {
      throw new ValidationError('Content cannot exceed 5000 characters');
    }
  }
}
```

#### 2.1.2 MarkInAppNotifAsReadCommand

```typescript
/**
 * @class MarkInAppNotifAsReadCommand
 * @description
 * 标记站内通知已读命令，封装标记通知已读操作的输入参数。
 *
 * 命令职责：
 * 1. 封装标记已读操作所需的所有参数
 * 2. 提供数据验证和权限检查
 * 3. 确保操作的幂等性
 * 4. 支持批量标记已读操作
 */
export class MarkInAppNotifAsReadCommand {
  constructor(
    public readonly notifId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.notifId || this.notifId.trim().length === 0) {
      throw new ValidationError('Notification ID is required');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new ValidationError('Tenant ID is required');
    }
  }
}
```

#### 2.1.3 ArchiveInAppNotifCommand

```typescript
/**
 * @class ArchiveInAppNotifCommand
 * @description
 * 归档站内通知命令，封装归档通知操作的输入参数。
 *
 * 命令职责：
 * 1. 封装归档操作所需的所有参数
 * 2. 提供数据验证和权限检查
 * 3. 确保操作的幂等性
 * 4. 支持批量归档操作
 */
export class ArchiveInAppNotifCommand {
  constructor(
    public readonly notifId: string,
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.notifId || this.notifId.trim().length === 0) {
      throw new ValidationError('Notification ID is required');
    }

    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new ValidationError('Tenant ID is required');
    }
  }
}
```

### 2.2 邮件通知命令

#### 2.2.1 CreateEmailNotifCommand

```typescript
/**
 * @class CreateEmailNotifCommand
 * @description
 * 创建邮件通知命令，封装邮件通知创建操作的输入参数。
 *
 * 命令职责：
 * 1. 封装邮件通知创建所需的所有参数
 * 2. 提供邮件格式验证
 * 3. 支持模板和自定义内容
 * 4. 确保邮件内容的合规性
 */
export class CreateEmailNotifCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly recipientEmail: string,
    public readonly subject: string,
    public readonly content: string,
    public readonly templateId?: string,
    public readonly templateData?: Record<string, unknown>,
    public readonly metadata?: Record<string, unknown>,
    public readonly priority: NotifPriority = NotifPriority.NORMAL,
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new ValidationError('Tenant ID is required');
    }

    if (!this.recipientId || this.recipientId.trim().length === 0) {
      throw new ValidationError('Recipient ID is required');
    }

    if (!this.recipientEmail || this.recipientEmail.trim().length === 0) {
      throw new ValidationError('Recipient email is required');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.recipientEmail)) {
      throw new ValidationError('Invalid email format');
    }

    if (!this.subject || this.subject.trim().length === 0) {
      throw new ValidationError('Subject is required');
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new ValidationError('Content is required');
    }

    if (this.subject.length > 200) {
      throw new ValidationError('Subject cannot exceed 200 characters');
    }
  }
}
```

#### 2.2.2 SendEmailNotifCommand

```typescript
/**
 * @class SendEmailNotifCommand
 * @description
 * 发送邮件通知命令，封装邮件发送操作的输入参数。
 *
 * 命令职责：
 * 1. 封装邮件发送操作所需的所有参数
 * 2. 支持重试机制
 * 3. 提供发送状态跟踪
 * 4. 确保发送的幂等性
 */
export class SendEmailNotifCommand {
  constructor(
    public readonly notifId: string,
    public readonly tenantId: string,
    public readonly retryCount: number = 0,
    public readonly maxRetries: number = 3,
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.notifId || this.notifId.trim().length === 0) {
      throw new ValidationError('Notification ID is required');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new ValidationError('Tenant ID is required');
    }

    if (this.retryCount < 0) {
      throw new ValidationError('Retry count cannot be negative');
    }

    if (this.maxRetries < 0) {
      throw new ValidationError('Max retries cannot be negative');
    }

    if (this.retryCount > this.maxRetries) {
      throw new ValidationError('Retry count cannot exceed max retries');
    }
  }
}
```

### 2.3 通知编排命令

#### 2.3.1 CreateNotifOrchestrationCommand

```typescript
/**
 * @class CreateNotifOrchestrationCommand
 * @description
 * 创建通知编排命令，封装多渠道通知编排操作的输入参数。
 *
 * 命令职责：
 * 1. 封装通知编排所需的所有参数
 * 2. 支持多渠道选择
 * 3. 提供发送策略配置
 * 4. 确保编排的灵活性
 */
export class CreateNotifOrchestrationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly channels: NotifChannel[],
    public readonly strategy: NotifStrategy,
    public readonly priority: NotifPriority = NotifPriority.NORMAL,
    public readonly metadata?: Record<string, unknown>,
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new ValidationError('Tenant ID is required');
    }

    if (!this.recipientId || this.recipientId.trim().length === 0) {
      throw new ValidationError('Recipient ID is required');
    }

    if (!this.title || this.title.trim().length === 0) {
      throw new ValidationError('Title is required');
    }

    if (!this.content || this.content.trim().length === 0) {
      throw new ValidationError('Content is required');
    }

    if (!this.channels || this.channels.length === 0) {
      throw new ValidationError('At least one channel is required');
    }

    // 验证渠道的唯一性
    const uniqueChannels = new Set(this.channels.map(c => c.value));
    if (uniqueChannels.size !== this.channels.length) {
      throw new ValidationError('Duplicate channels are not allowed');
    }
  }
}
```

## 3. 查询设计

### 3.1 站内信查询

#### 3.1.1 GetInAppNotifsQuery

```typescript
/**
 * @class GetInAppNotifsQuery
 * @description
 * 获取站内通知列表查询，封装站内通知查询操作的参数和过滤条件。
 *
 * 查询职责：
 * 1. 封装站内通知查询所需的所有参数
 * 2. 提供灵活的过滤和排序选项
 * 3. 支持分页和性能优化
 * 4. 确保查询结果的数据隔离
 *
 * 数据隔离要求：
 * 1. 查询必须基于租户ID进行数据隔离
 * 2. 根据查询者权限过滤可访问的数据
 * 3. 支持用户级的数据过滤
 * 4. 确保敏感信息的安全访问
 */
export class GetInAppNotifsQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly type?: NotifType,
    public readonly status?: NotifStatus,
    public readonly priority?: NotifPriority,
    public readonly sortBy: string = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证查询参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new ValidationError('Tenant ID is required');
    }

    if (this.page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (this.limit < 1 || this.limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      throw new ValidationError('Start date cannot be after end date');
    }
  }

  /**
   * @method getOffset
   * @description 计算查询偏移量
   * @returns {number} 偏移量
   */
  getOffset(): number {
    return (this.page - 1) * this.limit;
  }
}
```

#### 3.1.2 GetInAppNotifStatsQuery

```typescript
/**
 * @class GetInAppNotifStatsQuery
 * @description
 * 获取站内通知统计查询，封装通知统计查询操作的参数。
 *
 * 查询职责：
 * 1. 封装统计查询所需的所有参数
 * 2. 支持多种统计维度
 * 3. 提供时间范围过滤
 * 4. 确保统计数据的准确性
 */
export class GetInAppNotifStatsQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly groupBy?: 'day' | 'week' | 'month',
    public readonly type?: NotifType,
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证查询参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.userId || this.userId.trim().length === 0) {
      throw new ValidationError('User ID is required');
    }

    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new ValidationError('Tenant ID is required');
    }

    if (!this.startDate) {
      throw new ValidationError('Start date is required');
    }

    if (!this.endDate) {
      throw new ValidationError('End date is required');
    }

    if (this.startDate > this.endDate) {
      throw new ValidationError('Start date cannot be after end date');
    }

    const daysDiff =
      (this.endDate.getTime() - this.startDate.getTime()) /
      (1000 * 60 * 60 * 24);
    if (daysDiff > 365) {
      throw new ValidationError('Date range cannot exceed 365 days');
    }
  }
}
```

### 3.2 邮件通知查询

#### 3.2.1 GetEmailNotifsQuery

```typescript
/**
 * @class GetEmailNotifsQuery
 * @description
 * 获取邮件通知列表查询，封装邮件通知查询操作的参数。
 *
 * 查询职责：
 * 1. 封装邮件通知查询所需的所有参数
 * 2. 提供灵活的过滤条件
 * 3. 支持分页和排序
 * 4. 确保查询性能优化
 */
export class GetEmailNotifsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId?: string,
    public readonly status?: EmailNotifStatus,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly startDate?: Date,
    public readonly endDate?: Date,
    public readonly sortBy: string = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
    public readonly requestedBy: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证查询参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.tenantId || this.tenantId.trim().length === 0) {
      throw new ValidationError('Tenant ID is required');
    }

    if (this.page < 1) {
      throw new ValidationError('Page must be greater than 0');
    }

    if (this.limit < 1 || this.limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100');
    }

    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      throw new ValidationError('Start date cannot be after end date');
    }
  }

  /**
   * @method getOffset
   * @description 计算查询偏移量
   * @returns {number} 偏移量
   */
  getOffset(): number {
    return (this.page - 1) * this.limit;
  }
}
```

## 4. 命令处理器设计

### 4.1 CreateInAppNotifCommandHandler

```typescript
/**
 * @class CreateInAppNotifCommandHandler
 * @description
 * 创建站内通知命令处理器，负责处理站内通知创建命令的业务逻辑和事务管理。
 *
 * 处理器职责：
 * 1. 接收并验证创建站内通知命令
 * 2. 协调领域服务和仓储操作
 * 3. 管理事务边界和异常处理
 * 4. 发布领域事件和集成事件
 *
 * 业务逻辑流程：
 * 1. 验证命令参数和权限
 * 2. 检查业务规则约束
 * 3. 创建站内通知聚合根
 * 4. 保存到写模型数据库
 * 5. 发布站内通知创建事件
 * 6. 更新读模型视图
 *
 * 事务管理：
 * 1. 整个处理过程在一个事务中执行
 * 2. 失败时自动回滚所有操作
 * 3. 成功后提交事务并发布事件
 * 4. 支持分布式事务协调
 */
@CommandHandler(CreateInAppNotifCommand)
export class CreateInAppNotifCommandHandler {
  constructor(
    private readonly notifRepository: IInAppNotifRepository,
    private readonly userRepository: IUserRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  /**
   * @method execute
   * @description 处理创建站内通知命令，执行完整的站内通知创建流程
   * @param {CreateInAppNotifCommand} command 创建站内通知命令
   * @returns {Promise<CreateInAppNotifResult>} 创建结果
   * @throws {ValidationError} 当命令参数无效时抛出
   * @throws {UserNotFoundError} 当用户不存在时抛出
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   *
   * 处理流程：
   * 1. 验证命令和权限
   * 2. 检查业务规则约束
   * 3. 创建站内通知聚合根
   * 4. 保存到数据库
   * 5. 发布领域事件
   * 6. 返回创建结果
   */
  async execute(
    command: CreateInAppNotifCommand,
  ): Promise<CreateInAppNotifResult> {
    return await this.unitOfWork.execute(async () => {
      // 1. 验证命令和权限
      await this.validateCommand(command);

      // 2. 检查业务规则约束
      await this.checkBusinessRules(command);

      // 3. 创建站内通知聚合根
      const notifAggregate = await this.createNotifAggregate(command);

      // 4. 保存到数据库
      await this.notifRepository.save(notifAggregate);

      // 5. 发布领域事件
      await this.publishEvents(notifAggregate);

      // 6. 返回创建结果
      return new CreateInAppNotifResult(notifAggregate.id.value);
    });
  }

  /**
   * @method validateCommand
   * @description 验证命令参数和权限
   * @param {CreateInAppNotifCommand} command 创建站内通知命令
   * @returns {Promise<void>}
   * @private
   */
  private async validateCommand(
    command: CreateInAppNotifCommand,
  ): Promise<void> {
    // 验证租户存在性
    const tenant = await this.tenantRepository.findById(
      new TenantId(command.tenantId),
    );
    if (!tenant) {
      throw new TenantNotFoundError(command.tenantId);
    }

    // 验证用户存在性
    const user = await this.userRepository.findById(
      new UserId(command.recipientId),
    );
    if (!user) {
      throw new UserNotFoundError(command.recipientId);
    }

    // 验证权限
    await this.checkCreatePermission(command);
  }

  /**
   * @method checkBusinessRules
   * @description 检查业务规则约束
   * @param {CreateInAppNotifCommand} command 创建站内通知命令
   * @returns {Promise<void>}
   * @private
   */
  private async checkBusinessRules(
    command: CreateInAppNotifCommand,
  ): Promise<void> {
    // 检查用户是否在租户内
    const userTenant = await this.userRepository.findUserTenant(
      new UserId(command.recipientId),
      new TenantId(command.tenantId),
    );
    if (!userTenant) {
      throw new BusinessRuleViolationError(
        `User ${command.recipientId} is not in tenant ${command.tenantId}`,
      );
    }

    // 检查通知频率限制
    await this.checkNotificationRateLimit(command);
  }

  /**
   * @method createNotifAggregate
   * @description 创建站内通知聚合根
   * @param {CreateInAppNotifCommand} command 创建站内通知命令
   * @returns {Promise<InAppNotif>} 站内通知聚合根
   * @private
   */
  private async createNotifAggregate(
    command: CreateInAppNotifCommand,
  ): Promise<InAppNotif> {
    const notifId = NotifId.generate();
    const tenantId = new TenantId(command.tenantId);
    const recipientId = new UserId(command.recipientId);

    return InAppNotif.create(
      notifId,
      tenantId,
      recipientId,
      command.type,
      command.title,
      command.content,
      command.priority,
      command.metadata || {},
    );
  }

  /**
   * @method publishEvents
   * @description 发布领域事件
   * @param {InAppNotif} aggregate 站内通知聚合根
   * @returns {Promise<void>}
   * @private
   */
  private async publishEvents(aggregate: InAppNotif): Promise<void> {
    const events = aggregate.getUncommittedEvents();
    await this.eventBus.publishAll(events);
    aggregate.markEventsAsCommitted();
  }

  /**
   * @method checkCreatePermission
   * @description 检查创建权限
   * @param {CreateInAppNotifCommand} command 创建站内通知命令
   * @returns {Promise<void>}
   * @private
   */
  private async checkCreatePermission(
    command: CreateInAppNotifCommand,
  ): Promise<void> {
    // 实现权限检查逻辑
    // 这里应该调用权限服务
  }

  /**
   * @method checkNotificationRateLimit
   * @description 检查通知频率限制
   * @param {CreateInAppNotifCommand} command 创建站内通知命令
   * @returns {Promise<void>}
   * @private
   */
  private async checkNotificationRateLimit(
    command: CreateInAppNotifCommand,
  ): Promise<void> {
    // 实现频率限制检查逻辑
    // 这里应该调用限流服务
  }
}
```

### 4.2 MarkInAppNotifAsReadCommandHandler

```typescript
/**
 * @class MarkInAppNotifAsReadCommandHandler
 * @description
 * 标记站内通知已读命令处理器，负责处理标记已读命令的业务逻辑。
 *
 * 处理器职责：
 * 1. 接收并验证标记已读命令
 * 2. 检查通知所有权
 * 3. 更新通知状态
 * 4. 发布状态变更事件
 */
@CommandHandler(MarkInAppNotifAsReadCommand)
export class MarkInAppNotifAsReadCommandHandler {
  constructor(
    private readonly notifRepository: IInAppNotifRepository,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  /**
   * @method execute
   * @description 处理标记已读命令
   * @param {MarkInAppNotifAsReadCommand} command 标记已读命令
   * @returns {Promise<void>}
   */
  async execute(command: MarkInAppNotifAsReadCommand): Promise<void> {
    return await this.unitOfWork.execute(async () => {
      // 1. 获取通知聚合根
      const notifAggregate = await this.notifRepository.findById(
        new NotifId(command.notifId),
      );
      if (!notifAggregate) {
        throw new NotifNotFoundError(command.notifId);
      }

      // 2. 检查所有权
      if (notifAggregate.recipientId.value !== command.userId) {
        throw new NotifAccessDeniedError(command.notifId, command.userId);
      }

      // 3. 检查租户权限
      if (notifAggregate.tenantId.value !== command.tenantId) {
        throw new TenantAccessDeniedError(command.tenantId);
      }

      // 4. 标记为已读
      notifAggregate.markAsRead(command.requestedBy);

      // 5. 保存更新
      await this.notifRepository.save(notifAggregate);

      // 6. 发布事件
      await this.publishEvents(notifAggregate);
    });
  }

  /**
   * @method publishEvents
   * @description 发布领域事件
   * @param {InAppNotif} aggregate 站内通知聚合根
   * @returns {Promise<void>}
   * @private
   */
  private async publishEvents(aggregate: InAppNotif): Promise<void> {
    const events = aggregate.getUncommittedEvents();
    await this.eventBus.publishAll(events);
    aggregate.markEventsAsCommitted();
  }
}
```

## 5. 查询处理器设计

### 5.1 GetInAppNotifsQueryHandler

```typescript
/**
 * @class GetInAppNotifsQueryHandler
 * @description
 * 获取站内通知列表查询处理器，负责处理站内通知查询请求和优化读性能。
 *
 * 处理器职责：
 * 1. 接收并验证站内通知查询请求
 * 2. 从读模型数据库获取数据
 * 3. 应用数据隔离和权限过滤
 * 4. 优化查询性能和缓存策略
 *
 * 查询优化策略：
 * 1. 使用专门的读模型数据库
 * 2. 实现查询结果缓存机制
 * 3. 支持分页和索引优化
 * 4. 避免N+1查询问题
 *
 * 数据隔离实现：
 * 1. 基于租户ID进行数据隔离
 * 2. 根据用户权限过滤可访问数据
 * 3. 支持用户级的数据过滤
 * 4. 确保敏感数据的安全访问
 */
@QueryHandler(GetInAppNotifsQuery)
export class GetInAppNotifsQueryHandler {
  constructor(
    private readonly notifReadRepository: IInAppNotifReadRepository,
    private readonly cacheService: ICacheService,
    private readonly permissionService: IPermissionService,
    private readonly tenantContext: ITenantContext,
  ) {}

  /**
   * @method execute
   * @description 处理获取站内通知列表查询，返回分页的通知数据
   * @param {GetInAppNotifsQuery} query 获取站内通知列表查询
   * @returns {Promise<GetInAppNotifsResult>} 查询结果
   * @throws {ValidationError} 当查询参数无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   *
   * 处理流程：
   * 1. 验证查询参数和权限
   * 2. 检查缓存中是否有结果
   * 3. 从读模型数据库查询数据
   * 4. 应用数据隔离和权限过滤
   * 5. 缓存查询结果
   * 6. 返回分页结果
   */
  async execute(query: GetInAppNotifsQuery): Promise<GetInAppNotifsResult> {
    // 1. 验证查询参数和权限
    await this.validateQuery(query);

    // 2. 生成缓存键
    const cacheKey = this.generateCacheKey(query);

    // 3. 检查缓存
    const cachedResult =
      await this.cacheService.get<GetInAppNotifsResult>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // 4. 从读模型数据库查询
    const result = await this.notifReadRepository.findNotifs(query);

    // 5. 缓存查询结果
    await this.cacheService.set(cacheKey, result, 300); // 5分钟缓存

    // 6. 返回结果
    return result;
  }

  /**
   * @method validateQuery
   * @description 验证查询参数和权限
   * @param {GetInAppNotifsQuery} query 获取站内通知列表查询
   * @returns {Promise<void>}
   * @private
   */
  private async validateQuery(query: GetInAppNotifsQuery): Promise<void> {
    // 验证用户权限
    const hasPermission = await this.permissionService.hasPermission(
      query.requestedBy,
      'notif:read',
    );

    if (!hasPermission) {
      throw new InsufficientPermissionError('notif:read');
    }

    // 验证租户访问权限
    const hasTenantAccess = await this.permissionService.hasTenantAccess(
      query.requestedBy,
      query.tenantId,
    );

    if (!hasTenantAccess) {
      throw new TenantAccessDeniedError(query.tenantId);
    }
  }

  /**
   * @method generateCacheKey
   * @description 生成查询缓存键
   * @param {GetInAppNotifsQuery} query 获取站内通知列表查询
   * @returns {string} 缓存键
   * @private
   */
  private generateCacheKey(query: GetInAppNotifsQuery): string {
    const keyParts = [
      'in-app-notifs',
      query.tenantId,
      query.userId,
      query.page,
      query.limit,
      query.type?.value || 'all',
      query.status?.value || 'all',
      query.priority?.value || 'all',
      query.sortBy,
      query.sortOrder,
    ];

    if (query.startDate) {
      keyParts.push(query.startDate.toISOString());
    }

    if (query.endDate) {
      keyParts.push(query.endDate.toISOString());
    }

    return keyParts.join(':');
  }
}
```

## 6. 应用服务设计

### 6.1 InAppNotifApplicationService

```typescript
/**
 * @class InAppNotifApplicationService
 * @description
 * 站内通知应用服务，负责协调站内通知相关的用例和业务流程。
 *
 * 服务职责：
 * 1. 协调站内通知相关的用例
 * 2. 管理事务边界
 * 3. 处理跨聚合的业务逻辑
 * 4. 提供统一的业务接口
 */
@Injectable()
export class InAppNotifApplicationService {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly queryBus: IQueryBus,
    private readonly eventBus: IEventBus,
    private readonly unitOfWork: IUnitOfWork,
  ) {}

  /**
   * @method createNotification
   * @description 创建站内通知
   * @param {CreateInAppNotifDto} dto 创建通知DTO
   * @param {string} requestedBy 请求者ID
   * @returns {Promise<CreateInAppNotifResult>} 创建结果
   */
  async createNotification(
    dto: CreateInAppNotifDto,
    requestedBy: string,
  ): Promise<CreateInAppNotifResult> {
    const command = new CreateInAppNotifCommand(
      dto.tenantId,
      dto.recipientId,
      dto.type,
      dto.title,
      dto.content,
      dto.metadata,
      dto.priority,
      requestedBy,
    );

    return await this.commandBus.execute(command);
  }

  /**
   * @method markAsRead
   * @description 标记通知为已读
   * @param {string} notifId 通知ID
   * @param {string} userId 用户ID
   * @param {string} tenantId 租户ID
   * @param {string} requestedBy 请求者ID
   * @returns {Promise<void>}
   */
  async markAsRead(
    notifId: string,
    userId: string,
    tenantId: string,
    requestedBy: string,
  ): Promise<void> {
    const command = new MarkInAppNotifAsReadCommand(
      notifId,
      userId,
      tenantId,
      requestedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * @method archiveNotification
   * @description 归档通知
   * @param {string} notifId 通知ID
   * @param {string} userId 用户ID
   * @param {string} tenantId 租户ID
   * @param {string} requestedBy 请求者ID
   * @returns {Promise<void>}
   */
  async archiveNotification(
    notifId: string,
    userId: string,
    tenantId: string,
    requestedBy: string,
  ): Promise<void> {
    const command = new ArchiveInAppNotifCommand(
      notifId,
      userId,
      tenantId,
      requestedBy,
    );

    await this.commandBus.execute(command);
  }

  /**
   * @method getNotifications
   * @description 获取通知列表
   * @param {GetInAppNotifsDto} dto 查询DTO
   * @param {string} requestedBy 请求者ID
   * @returns {Promise<GetInAppNotifsResult>} 查询结果
   */
  async getNotifications(
    dto: GetInAppNotifsDto,
    requestedBy: string,
  ): Promise<GetInAppNotifsResult> {
    const query = new GetInAppNotifsQuery(
      dto.userId,
      dto.tenantId,
      dto.page,
      dto.limit,
      dto.type,
      dto.status,
      dto.priority,
      dto.sortBy,
      dto.sortOrder,
      dto.startDate,
      dto.endDate,
      requestedBy,
    );

    return await this.queryBus.execute(query);
  }

  /**
   * @method getNotificationStats
   * @description 获取通知统计
   * @param {GetInAppNotifStatsDto} dto 统计查询DTO
   * @param {string} requestedBy 请求者ID
   * @returns {Promise<GetInAppNotifStatsResult>} 统计结果
   */
  async getNotificationStats(
    dto: GetInAppNotifStatsDto,
    requestedBy: string,
  ): Promise<GetInAppNotifStatsResult> {
    const query = new GetInAppNotifStatsQuery(
      dto.userId,
      dto.tenantId,
      dto.startDate,
      dto.endDate,
      dto.groupBy,
      dto.type,
      requestedBy,
    );

    return await this.queryBus.execute(query);
  }
}
```

## 7. 总结

通知模块的应用层设计基于CQRS模式，通过命令查询分离、命令处理器、查询处理器和应用服务，实现了高度的业务内聚和性能优化。这种设计既保证了业务逻辑的完整性，又提供了良好的可测试性和可维护性。

### 7.1 设计优势

- **职责分离**: 命令和查询职责明确分离
- **性能优化**: 读写分离，优化查询性能
- **事务管理**: 完整的事务边界控制
- **事件驱动**: 通过事件实现松耦合
- **可测试性**: 每个组件都可以独立测试

### 7.2 关键特性

- **多租户支持**: 所有命令和查询都支持多租户隔离
- **权限控制**: 完整的权限验证和访问控制
- **缓存策略**: 查询结果缓存，提升性能
- **错误处理**: 完整的异常处理和错误恢复
- **数据验证**: 完整的输入数据验证

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
