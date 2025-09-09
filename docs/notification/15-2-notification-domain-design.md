# 通知模块领域模型设计

## 概述

本文档详细描述了通知模块的领域模型设计，包括聚合根、领域实体、值对象、领域事件和领域服务的详细设计。

## 1. 领域模型架构

### 1.1 设计原则

- **聚合根与实体分离**: 聚合根负责业务协调，实体负责状态管理
- **事件驱动**: 所有业务操作都通过事件驱动
- **多租户支持**: 所有领域模型都支持多租户隔离
- **不变性约束**: 通过值对象和业务规则确保数据一致性

### 1.2 领域模型层次结构

```
通知模块领域模型
├── 聚合根 (Aggregate Roots)
│   ├── InAppNotif (站内通知聚合根)
│   ├── EmailNotif (邮件通知聚合根)
│   ├── PushNotif (推送通知聚合根)
│   ├── SmsNotif (短信通知聚合根)
│   ├── NotifOrchestration (通知编排聚合根)
│   └── NotifPreferences (通知偏好聚合根)
├── 领域实体 (Domain Entities)
│   ├── InAppNotifEntity (站内通知实体)
│   ├── EmailNotifEntity (邮件通知实体)
│   ├── PushNotifEntity (推送通知实体)
│   └── SmsNotifEntity (短信通知实体)
├── 值对象 (Value Objects)
│   ├── NotifId (通知ID)
│   ├── NotifType (通知类型)
│   ├── NotifPriority (通知优先级)
│   ├── NotifChannel (通知渠道)
│   └── NotifStatus (通知状态)
├── 领域事件 (Domain Events)
│   ├── InAppNotifCreatedEvent
│   ├── EmailNotifSentEvent
│   ├── PushNotifDeliveredEvent
│   └── SmsNotifSentEvent
└── 领域服务 (Domain Services)
    ├── NotifOrchestrator (通知编排服务)
    ├── ChannelSelector (渠道选择服务)
    └── PriorityManager (优先级管理服务)
```

## 2. 聚合根设计

### 2.1 InAppNotif (站内通知聚合根)

```typescript
/**
 * @class InAppNotif
 * @description
 * 站内通知聚合根，负责管理站内通知相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供站内通知创建、标记已读、归档等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 * 4. 协调领域实体的业务操作
 *
 * 不变性约束：
 * 1. 聚合根控制聚合内所有对象的一致性
 * 2. 确保业务规则在聚合边界内得到执行
 * 3. 管理聚合内实体的生命周期
 * 4. 保证事件发布的原子性
 */
export class InAppNotif extends EventSourcedAggregateRoot {
  private constructor(private notif: InAppNotifEntity) {
    super();
  }

  /**
   * @method create
   * @description 创建新的站内通知聚合根
   * @param {NotifId} id 通知ID
   * @param {TenantId} tenantId 租户ID
   * @param {UserId} recipientId 接收者用户ID
   * @param {NotifType} type 通知类型
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @param {NotifPriority} priority 通知优先级
   * @param {Record<string, unknown>} metadata 通知元数据
   * @returns {InAppNotif} 创建的站内通知聚合根
   * @throws {InvalidNotifDataError} 当通知数据无效时抛出
   * @static
   */
  public static create(
    id: NotifId,
    tenantId: TenantId,
    recipientId: UserId,
    type: NotifType,
    title: string,
    content: string,
    priority: NotifPriority,
    metadata: Record<string, unknown> = {},
  ): InAppNotif {
    // 创建领域实体
    const notifEntity = new InAppNotifEntity(
      id,
      tenantId,
      recipientId,
      type,
      title,
      content,
      priority,
      metadata,
    );

    // 创建聚合根
    const aggregate = new InAppNotif(notifEntity);

    // 发布创建事件
    aggregate.addDomainEvent(
      new InAppNotifCreatedEvent(
        id,
        tenantId,
        recipientId,
        type,
        title,
        content,
        priority,
        metadata,
      ),
    );

    return aggregate;
  }

  /**
   * @method markAsRead
   * @description 标记通知为已读
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsRead(updatedBy: string = 'system'): void {
    const oldStatus = this.notif.getStatus();

    // 委托给领域实体处理业务逻辑
    this.notif.markAsRead(updatedBy);

    const newStatus = this.notif.getStatus();
    const readAt = this.notif.getReadAt();

    // 发布已读事件
    this.addDomainEvent(
      new InAppNotifReadEvent(
        this.notif.id,
        this.notif.tenantId,
        this.notif.recipientId,
        oldStatus,
        newStatus,
        readAt!,
      ),
    );
  }

  /**
   * @method archive
   * @description 归档通知
   * @param {string} [updatedBy] 更新者ID，默认为'system'
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public archive(updatedBy: string = 'system'): void {
    const oldStatus = this.notif.getStatus();

    // 委托给领域实体处理业务逻辑
    this.notif.archive(updatedBy);

    const archivedAt = this.notif.getArchivedAt();

    // 发布归档事件
    this.addDomainEvent(
      new InAppNotifArchivedEvent(
        this.notif.id,
        this.notif.tenantId,
        this.notif.recipientId,
        oldStatus,
        archivedAt!,
      ),
    );
  }

  // 聚合根访问器方法
  public get id(): NotifId {
    return this.notif.id;
  }
  public get tenantId(): TenantId {
    return this.notif.tenantId;
  }
  public get recipientId(): UserId {
    return this.notif.recipientId;
  }
  public get type(): NotifType {
    return this.notif.type;
  }
  public get title(): string {
    return this.notif.title;
  }
  public get content(): string {
    return this.notif.content;
  }
  public get priority(): NotifPriority {
    return this.notif.priority;
  }
  public get metadata(): Record<string, unknown> {
    return this.notif.metadata;
  }
  public get createdAt(): Date {
    return this.notif.createdAt;
  }
}
```

### 2.2 EmailNotif (邮件通知聚合根)

```typescript
/**
 * @class EmailNotif
 * @description
 * 邮件通知聚合根，负责管理邮件通知的发送、状态跟踪和模板管理。
 *
 * 业务职责：
 * 1. 邮件通知的创建和发送
 * 2. 邮件发送状态跟踪
 * 3. 邮件模板管理
 * 4. 邮件发送失败重试
 */
export class EmailNotif extends EventSourcedAggregateRoot {
  private constructor(
    private emailNotif: EmailNotifEntity,
    private template?: EmailTemplateEntity,
  ) {
    super();
  }

  /**
   * @method create
   * @description 创建邮件通知
   * @param {NotifId} id 通知ID
   * @param {TenantId} tenantId 租户ID
   * @param {UserId} recipientId 接收者ID
   * @param {EmailAddress} recipientEmail 接收者邮箱
   * @param {NotifType} type 通知类型
   * @param {string} subject 邮件主题
   * @param {string} content 邮件内容
   * @param {NotifPriority} priority 优先级
   * @param {EmailTemplateId} [templateId] 模板ID
   * @param {Record<string, unknown>} [templateData] 模板数据
   * @returns {EmailNotif} 邮件通知聚合根
   */
  public static create(
    id: NotifId,
    tenantId: TenantId,
    recipientId: UserId,
    recipientEmail: EmailAddress,
    type: NotifType,
    subject: string,
    content: string,
    priority: NotifPriority,
    templateId?: EmailTemplateId,
    templateData?: Record<string, unknown>,
  ): EmailNotif {
    const emailEntity = new EmailNotifEntity(
      id,
      tenantId,
      recipientId,
      recipientEmail,
      type,
      subject,
      content,
      priority,
      templateId,
      templateData,
    );

    const aggregate = new EmailNotif(emailEntity);

    aggregate.addDomainEvent(
      new EmailNotifCreatedEvent(
        id,
        tenantId,
        recipientId,
        recipientEmail,
        type,
        subject,
        content,
        priority,
        templateId,
        templateData,
      ),
    );

    return aggregate;
  }

  /**
   * @method send
   * @description 发送邮件
   * @returns {void}
   */
  public send(): void {
    this.emailNotif.markAsSending();

    this.addDomainEvent(
      new EmailNotifSentEvent(
        this.emailNotif.id,
        this.emailNotif.tenantId,
        this.emailNotif.recipientId,
        this.emailNotif.recipientEmail,
        this.emailNotif.subject,
        this.emailNotif.content,
      ),
    );
  }

  /**
   * @method markAsDelivered
   * @description 标记为已送达
   * @param {Date} deliveredAt 送达时间
   * @returns {void}
   */
  public markAsDelivered(deliveredAt: Date): void {
    this.emailNotif.markAsDelivered(deliveredAt);

    this.addDomainEvent(
      new EmailNotifDeliveredEvent(
        this.emailNotif.id,
        this.emailNotif.tenantId,
        this.emailNotif.recipientId,
        deliveredAt,
      ),
    );
  }

  /**
   * @method markAsFailed
   * @description 标记为发送失败
   * @param {string} errorMessage 错误信息
   * @param {Date} failedAt 失败时间
   * @returns {void}
   */
  public markAsFailed(errorMessage: string, failedAt: Date): void {
    this.emailNotif.markAsFailed(errorMessage, failedAt);

    this.addDomainEvent(
      new EmailNotifFailedEvent(
        this.emailNotif.id,
        this.emailNotif.tenantId,
        this.emailNotif.recipientId,
        errorMessage,
        failedAt,
      ),
    );
  }
}
```

### 2.3 NotifOrchestration (通知编排聚合根)

```typescript
/**
 * @class NotifOrchestration
 * @description
 * 通知编排聚合根，负责协调不同渠道的通知发送、优先级管理和渠道选择。
 *
 * 业务职责：
 * 1. 多渠道通知的统一编排
 * 2. 通知优先级管理
 * 3. 渠道选择策略
 * 4. 通知发送状态跟踪
 */
export class NotifOrchestration extends EventSourcedAggregateRoot {
  private constructor(
    private orchestration: NotifOrchestrationEntity,
    private channels: NotifChannel[],
  ) {
    super();
  }

  /**
   * @method create
   * @description 创建通知编排
   * @param {NotifId} id 编排ID
   * @param {TenantId} tenantId 租户ID
   * @param {UserId} recipientId 接收者ID
   * @param {NotifType} type 通知类型
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @param {NotifPriority} priority 优先级
   * @param {NotifChannel[]} channels 通知渠道
   * @param {NotifStrategy} strategy 发送策略
   * @returns {NotifOrchestration} 通知编排聚合根
   */
  public static create(
    id: NotifId,
    tenantId: TenantId,
    recipientId: UserId,
    type: NotifType,
    title: string,
    content: string,
    priority: NotifPriority,
    channels: NotifChannel[],
    strategy: NotifStrategy,
  ): NotifOrchestration {
    const orchestrationEntity = new NotifOrchestrationEntity(
      id,
      tenantId,
      recipientId,
      type,
      title,
      content,
      priority,
      channels,
      strategy,
    );

    const aggregate = new NotifOrchestration(orchestrationEntity, channels);

    aggregate.addDomainEvent(
      new NotifOrchestrationCreatedEvent(
        id,
        tenantId,
        recipientId,
        type,
        title,
        content,
        priority,
        channels,
        strategy,
      ),
    );

    return aggregate;
  }

  /**
   * @method execute
   * @description 执行通知编排
   * @returns {void}
   */
  public execute(): void {
    this.orchestration.markAsExecuting();

    // 根据策略选择渠道
    const selectedChannels = this.selectChannels();

    // 发布渠道通知事件
    selectedChannels.forEach(channel => {
      this.addDomainEvent(
        new NotifChannelEvent(
          this.orchestration.id,
          this.orchestration.tenantId,
          this.orchestration.recipientId,
          channel,
          this.orchestration.type,
          this.orchestration.title,
          this.orchestration.content,
          this.orchestration.priority,
        ),
      );
    });

    this.addDomainEvent(
      new NotifOrchestrationExecutedEvent(
        this.orchestration.id,
        this.orchestration.tenantId,
        this.orchestration.recipientId,
        selectedChannels,
      ),
    );
  }

  /**
   * @method selectChannels
   * @description 选择通知渠道
   * @returns {NotifChannel[]} 选中的渠道
   * @private
   */
  private selectChannels(): NotifChannel[] {
    const strategy = this.orchestration.getStrategy();

    switch (strategy) {
      case NotifStrategy.ALL_CHANNELS:
        return this.channels;
      case NotifStrategy.PRIORITY_CHANNEL:
        return [this.channels[0]]; // 选择第一个渠道
      case NotifStrategy.FALLBACK_CHANNEL:
        return this.selectFallbackChannels();
      default:
        return this.channels;
    }
  }

  /**
   * @method selectFallbackChannels
   * @description 选择备用渠道
   * @returns {NotifChannel[]} 备用渠道
   * @private
   */
  private selectFallbackChannels(): NotifChannel[] {
    // 根据用户偏好和渠道可用性选择备用渠道
    return this.channels.filter(
      channel => channel.isAvailable() && channel.isPreferred(),
    );
  }
}
```

## 3. 领域实体设计

### 3.1 InAppNotifEntity (站内通知实体)

```typescript
/**
 * @class InAppNotifEntity
 * @description
 * 站内通知领域实体，负责状态管理、业务规则验证和基础设施功能。
 *
 * 实体职责：
 * 1. 状态管理和业务规则验证
 * 2. 提供审计追踪、乐观锁、软删除等企业级功能
 * 3. 处理状态转换和业务逻辑
 * 4. 维护实体的生命周期
 */
export class InAppNotifEntity extends BaseEntity {
  constructor(
    public readonly id: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly priority: NotifPriority,
    public readonly metadata: Record<string, unknown>,
    private status: NotifStatus = NotifStatus.PENDING,
    private readAt?: Date,
    private archivedAt?: Date,
  ) {
    super();
  }

  /**
   * @method markAsRead
   * @description 标记为已读
   * @param {string} updatedBy 更新者ID
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public markAsRead(updatedBy: string): void {
    if (this.status === NotifStatus.ARCHIVED) {
      throw new InvalidStatusTransitionError(
        `Cannot mark archived notification as read: ${this.id.value}`,
      );
    }

    this.status = NotifStatus.READ;
    this.readAt = new Date();
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method archive
   * @description 归档通知
   * @param {string} updatedBy 更新者ID
   * @returns {void}
   * @throws {InvalidStatusTransitionError} 当状态转换无效时抛出
   */
  public archive(updatedBy: string): void {
    if (this.status === NotifStatus.ARCHIVED) {
      throw new InvalidStatusTransitionError(
        `Notification already archived: ${this.id.value}`,
      );
    }

    this.status = NotifStatus.ARCHIVED;
    this.archivedAt = new Date();
    this.updateAuditInfo(updatedBy);
  }

  /**
   * @method getStatus
   * @description 获取通知状态
   * @returns {NotifStatus} 通知状态
   */
  public getStatus(): NotifStatus {
    return this.status;
  }

  /**
   * @method getReadAt
   * @description 获取已读时间
   * @returns {Date | undefined} 已读时间
   */
  public getReadAt(): Date | undefined {
    return this.readAt;
  }

  /**
   * @method getArchivedAt
   * @description 获取归档时间
   * @returns {Date | undefined} 归档时间
   */
  public getArchivedAt(): Date | undefined {
    return this.archivedAt;
  }

  /**
   * @method isRead
   * @description 检查是否已读
   * @returns {boolean} 是否已读
   */
  public isRead(): boolean {
    return this.status === NotifStatus.READ;
  }

  /**
   * @method isArchived
   * @description 检查是否已归档
   * @returns {boolean} 是否已归档
   */
  public isArchived(): boolean {
    return this.status === NotifStatus.ARCHIVED;
  }
}
```

## 4. 值对象设计

### 4.1 NotifId (通知ID)

```typescript
/**
 * @class NotifId
 * @description
 * 通知ID值对象，封装通知唯一标识符的不变性约束和相等性判断。
 *
 * 不变性约束：
 * 1. 通知ID一旦创建不可变更
 * 2. 通知ID必须符合UUID格式
 * 3. 通知ID不能为空
 *
 * 相等性判断：
 * 1. 基于ID值进行相等性比较
 * 2. 支持哈希码计算用于集合操作
 * 3. 提供字符串表示用于序列化
 */
export class NotifId {
  constructor(public readonly value: string) {
    this.validate(value);
  }

  /**
   * @method validate
   * @description 验证通知ID格式
   * @param {string} value 通知ID值
   * @returns {void}
   * @throws {InvalidNotifIdError} 当ID格式无效时抛出
   * @private
   */
  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new InvalidNotifIdError('Notification ID cannot be empty');
    }

    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      throw new InvalidNotifIdError(`Invalid notification ID format: ${value}`);
    }
  }

  /**
   * @method equals
   * @description 比较两个通知ID是否相等
   * @param {NotifId} other 另一个通知ID
   * @returns {boolean} 是否相等
   */
  equals(other: NotifId): boolean {
    return this.value === other.value;
  }

  /**
   * @method toString
   * @description 获取字符串表示
   * @returns {string} 字符串表示
   */
  toString(): string {
    return this.value;
  }

  /**
   * @method generate
   * @description 生成新的通知ID
   * @returns {NotifId} 新的通知ID
   * @static
   */
  static generate(): NotifId {
    return new NotifId(uuid.v4());
  }
}
```

### 4.2 NotifType (通知类型)

```typescript
/**
 * @class NotifType
 * @description
 * 通知类型值对象，封装通知类型的业务概念和验证规则。
 *
 * 业务概念：
 * 1. 系统通知：系统维护、更新等
 * 2. 业务通知：订单、支付、用户操作等
 * 3. 营销通知：促销、活动、推荐等
 * 4. 安全通知：登录、密码变更、权限变更等
 */
export class NotifType {
  constructor(public readonly value: string) {
    this.validate(value);
  }

  /**
   * @method validate
   * @description 验证通知类型
   * @param {string} value 通知类型值
   * @returns {void}
   * @throws {InvalidNotifTypeError} 当类型无效时抛出
   * @private
   */
  private validate(value: string): void {
    const validTypes = [
      'SYSTEM',
      'BUSINESS',
      'MARKETING',
      'SECURITY',
      'ORDER',
      'PAYMENT',
      'USER_ACTION',
      'PROMOTION',
      'ACTIVITY',
      'RECOMMENDATION',
      'LOGIN',
      'PASSWORD_CHANGE',
      'PERMISSION_CHANGE',
    ];

    if (!validTypes.includes(value)) {
      throw new InvalidNotifTypeError(`Invalid notification type: ${value}`);
    }
  }

  /**
   * @method equals
   * @description 比较两个通知类型是否相等
   * @param {NotifType} other 另一个通知类型
   * @returns {boolean} 是否相等
   */
  equals(other: NotifType): boolean {
    return this.value === other.value;
  }

  /**
   * @method toString
   * @description 获取字符串表示
   * @returns {string} 字符串表示
   */
  toString(): string {
    return this.value;
  }

  // 预定义的通知类型
  static readonly SYSTEM = new NotifType('SYSTEM');
  static readonly BUSINESS = new NotifType('BUSINESS');
  static readonly MARKETING = new NotifType('MARKETING');
  static readonly SECURITY = new NotifType('SECURITY');
  static readonly ORDER = new NotifType('ORDER');
  static readonly PAYMENT = new NotifType('PAYMENT');
  static readonly USER_ACTION = new NotifType('USER_ACTION');
  static readonly PROMOTION = new NotifType('PROMOTION');
  static readonly ACTIVITY = new NotifType('ACTIVITY');
  static readonly RECOMMENDATION = new NotifType('RECOMMENDATION');
  static readonly LOGIN = new NotifType('LOGIN');
  static readonly PASSWORD_CHANGE = new NotifType('PASSWORD_CHANGE');
  static readonly PERMISSION_CHANGE = new NotifType('PERMISSION_CHANGE');
}
```

### 4.3 NotifPriority (通知优先级)

```typescript
/**
 * @class NotifPriority
 * @description
 * 通知优先级值对象，封装通知优先级的业务概念和比较逻辑。
 *
 * 优先级级别：
 * 1. LOW：低优先级，可以延迟处理
 * 2. NORMAL：普通优先级，正常处理
 * 3. HIGH：高优先级，优先处理
 * 4. URGENT：紧急优先级，立即处理
 */
export class NotifPriority {
  constructor(
    public readonly value: string,
    public readonly level: number,
  ) {
    this.validate(value, level);
  }

  /**
   * @method validate
   * @description 验证通知优先级
   * @param {string} value 优先级值
   * @param {number} level 优先级级别
   * @returns {void}
   * @throws {InvalidNotifPriorityError} 当优先级无效时抛出
   * @private
   */
  private validate(value: string, level: number): void {
    const validPriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

    if (!validPriorities.includes(value)) {
      throw new InvalidNotifPriorityError(
        `Invalid notification priority: ${value}`,
      );
    }

    if (level < 1 || level > 4) {
      throw new InvalidNotifPriorityError(`Invalid priority level: ${level}`);
    }
  }

  /**
   * @method equals
   * @description 比较两个通知优先级是否相等
   * @param {NotifPriority} other 另一个通知优先级
   * @returns {boolean} 是否相等
   */
  equals(other: NotifPriority): boolean {
    return this.value === other.value && this.level === other.level;
  }

  /**
   * @method isHigherThan
   * @description 检查是否比另一个优先级高
   * @param {NotifPriority} other 另一个通知优先级
   * @returns {boolean} 是否更高
   */
  isHigherThan(other: NotifPriority): boolean {
    return this.level > other.level;
  }

  /**
   * @method isLowerThan
   * @description 检查是否比另一个优先级低
   * @param {NotifPriority} other 另一个通知优先级
   * @returns {boolean} 是否更低
   */
  isLowerThan(other: NotifPriority): boolean {
    return this.level < other.level;
  }

  /**
   * @method toString
   * @description 获取字符串表示
   * @returns {string} 字符串表示
   */
  toString(): string {
    return this.value;
  }

  // 预定义的优先级
  static readonly LOW = new NotifPriority('LOW', 1);
  static readonly NORMAL = new NotifPriority('NORMAL', 2);
  static readonly HIGH = new NotifPriority('HIGH', 3);
  static readonly URGENT = new NotifPriority('URGENT', 4);
}
```

## 5. 领域事件设计

### 5.1 InAppNotifCreatedEvent

```typescript
/**
 * @class InAppNotifCreatedEvent
 * @description
 * 站内通知创建事件，表示站内通知已成功创建。
 *
 * 事件含义：
 * 1. 表示站内通知聚合根已成功创建
 * 2. 包含通知创建时的关键信息
 * 3. 为其他聚合根提供通知创建通知
 *
 * 触发条件：
 * 1. 站内通知聚合根成功创建后自动触发
 * 2. 通知数据验证通过
 * 3. 租户关联建立成功
 *
 * 影响范围：
 * 1. 通知统计模块更新统计信息
 * 2. 用户偏好模块记录通知历史
 * 3. 通知编排模块可能触发后续通知
 * 4. 记录通知创建审计日志
 */
export class InAppNotifCreatedEvent extends DomainEvent {
  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly type: NotifType,
    public readonly title: string,
    public readonly content: string,
    public readonly priority: NotifPriority,
    public readonly metadata: Record<string, unknown>,
  ) {
    super(notifId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'InAppNotifCreated';
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式，用于序列化和存储
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      notifId: this.notifId.value,
      tenantId: this.tenantId.value,
      recipientId: this.recipientId.value,
      type: this.type.value,
      title: this.title,
      content: this.content,
      priority: this.priority.value,
      metadata: this.metadata,
    };
  }
}
```

### 5.2 EmailNotifSentEvent

```typescript
/**
 * @class EmailNotifSentEvent
 * @description
 * 邮件通知发送事件，表示邮件通知已成功发送。
 *
 * 事件含义：
 * 1. 表示邮件通知已成功发送到邮件服务器
 * 2. 包含邮件发送的关键信息
 * 3. 为其他模块提供邮件发送通知
 *
 * 触发条件：
 * 1. 邮件通知聚合根成功发送后自动触发
 * 2. 邮件服务器确认接收
 * 3. 邮件内容验证通过
 *
 * 影响范围：
 * 1. 邮件统计模块更新发送统计
 * 2. 用户偏好模块记录邮件历史
 * 3. 通知编排模块更新发送状态
 * 4. 记录邮件发送审计日志
 */
export class EmailNotifSentEvent extends DomainEvent {
  constructor(
    public readonly notifId: NotifId,
    public readonly tenantId: TenantId,
    public readonly recipientId: UserId,
    public readonly recipientEmail: EmailAddress,
    public readonly subject: string,
    public readonly content: string,
  ) {
    super(notifId.value);
  }

  /**
   * @method getEventType
   * @description 获取事件类型标识
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'EmailNotifSent';
  }

  /**
   * @method toJSON
   * @description 将事件转换为JSON格式，用于序列化和存储
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      notifId: this.notifId.value,
      tenantId: this.tenantId.value,
      recipientId: this.recipientId.value,
      recipientEmail: this.recipientEmail.value,
      subject: this.subject,
      content: this.content,
    };
  }
}
```

## 6. 领域服务设计

### 6.1 NotifOrchestrator (通知编排服务)

```typescript
/**
 * @class NotifOrchestrator
 * @description
 * 通知编排服务，负责协调不同渠道的通知发送、优先级管理和渠道选择。
 *
 * 服务职责：
 * 1. 协调不同渠道的通知发送
 * 2. 管理通知优先级和发送顺序
 * 3. 实现渠道选择策略
 * 4. 处理通知发送失败和重试
 */
export class NotifOrchestrator {
  constructor(
    private readonly channelSelector: ChannelSelector,
    private readonly priorityManager: PriorityManager,
    private readonly notifRepository: INotifRepository,
  ) {}

  /**
   * @method orchestrateNotification
   * @description 编排通知发送
   * @param {NotifId} notifId 通知ID
   * @param {TenantId} tenantId 租户ID
   * @param {UserId} recipientId 接收者ID
   * @param {NotifType} type 通知类型
   * @param {string} title 通知标题
   * @param {string} content 通知内容
   * @param {NotifPriority} priority 优先级
   * @param {NotifChannel[]} channels 通知渠道
   * @param {NotifStrategy} strategy 发送策略
   * @returns {Promise<void>}
   */
  async orchestrateNotification(
    notifId: NotifId,
    tenantId: TenantId,
    recipientId: UserId,
    type: NotifType,
    title: string,
    content: string,
    priority: NotifPriority,
    channels: NotifChannel[],
    strategy: NotifStrategy,
  ): Promise<void> {
    // 1. 创建通知编排聚合根
    const orchestration = NotifOrchestration.create(
      notifId,
      tenantId,
      recipientId,
      type,
      title,
      content,
      priority,
      channels,
      strategy,
    );

    // 2. 保存到仓储
    await this.notifRepository.save(orchestration);

    // 3. 执行编排
    orchestration.execute();

    // 4. 保存更新后的状态
    await this.notifRepository.save(orchestration);
  }

  /**
   * @method selectOptimalChannels
   * @description 选择最优通知渠道
   * @param {UserId} recipientId 接收者ID
   * @param {NotifType} type 通知类型
   * @param {NotifPriority} priority 优先级
   * @param {NotifChannel[]} availableChannels 可用渠道
   * @returns {Promise<NotifChannel[]>} 选中的渠道
   */
  async selectOptimalChannels(
    recipientId: UserId,
    type: NotifType,
    priority: NotifPriority,
    availableChannels: NotifChannel[],
  ): Promise<NotifChannel[]> {
    // 1. 获取用户偏好
    const userPreferences = await this.getUserPreferences(recipientId);

    // 2. 根据优先级过滤渠道
    const priorityChannels = this.priorityManager.filterByPriority(
      availableChannels,
      priority,
    );

    // 3. 根据用户偏好选择渠道
    const selectedChannels = this.channelSelector.selectChannels(
      priorityChannels,
      userPreferences,
      type,
    );

    return selectedChannels;
  }

  /**
   * @method getUserPreferences
   * @description 获取用户通知偏好
   * @param {UserId} recipientId 接收者ID
   * @returns {Promise<NotifPreferences>} 用户偏好
   * @private
   */
  private async getUserPreferences(
    recipientId: UserId,
  ): Promise<NotifPreferences> {
    // 实现获取用户偏好的逻辑
    // 这里应该调用用户偏好服务
    return new NotifPreferences(recipientId, {});
  }
}
```

## 7. 总结

通知模块的领域模型设计基于DDD原则，通过聚合根与实体分离、值对象封装、领域事件驱动和领域服务协调，实现了高度的业务内聚和模块解耦。这种设计既保证了业务逻辑的完整性，又提供了良好的扩展性和可维护性。

### 7.1 设计优势

- **业务内聚**: 每个聚合根都包含完整的业务逻辑
- **模块解耦**: 通过领域事件实现模块间的松耦合
- **类型安全**: 通过值对象确保数据的类型安全
- **可测试性**: 每个组件都可以独立测试
- **可扩展性**: 支持新通知渠道和业务规则的扩展

### 7.2 关键特性

- **多租户支持**: 所有领域模型都支持多租户隔离
- **事件驱动**: 所有业务操作都通过事件驱动
- **状态管理**: 通过领域实体管理复杂的状态转换
- **业务规则**: 通过值对象和业务方法确保业务规则的一致性

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
