# 通知模块技术设计方案

## 文档概述

- **项目名称**: Aiofix AI SAAS平台 - 通知模块技术设计
- **文档版本**: V1.0
- **撰写人**: AI开发团队
- **最后更新日期**: 2024-01-01
- **目标读者**: 架构师、开发工程师、测试工程师

## 1. 技术架构概述

### 1.1 架构设计原则

- **DDD架构**: 遵循领域驱动设计，按业务领域组织代码
- **Clean Architecture**: 遵循清洁架构，确保依赖倒置
- **CQRS**: 命令查询职责分离，优化读写性能
- **混合事件驱动**: 关键业务事件使用事件驱动，简单操作直接调用服务
- **多租户**: 支持租户级数据隔离和配置
- **微服务**: 支持独立部署和扩展

### 1.2 事件驱动策略

#### 1.2.1 使用事件驱动的场景

- **跨模块通知触发**: 用户注册、权限变更、系统维护等业务事件
- **异步通知发送**: 邮件发送队列、批量通知处理
- **审计和统计**: 通知发送记录、用户行为分析
- **系统解耦**: 通知模块与其他业务模块解耦

#### 1.2.2 不使用事件驱动的场景

- **简单的CRUD操作**: 标记已读/未读、删除通知、获取通知列表
- **实时性要求高的操作**: 实时通知推送、即时状态更新
- **用户交互操作**: 用户主动触发的操作

#### 1.2.3 混合架构优势

- **保持架构一致性**: 遵循项目的DDD+CQRS架构
- **MVP策略**: 先实现核心功能，后续扩展
- **性能优化**: 避免过度设计，保持系统响应性
- **开发效率**: 简单操作直接调用，复杂业务使用事件驱动

### 1.3 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    通知模块架构                              │
├─────────────────────────────────────────────────────────────┤
│  Interface Layer (接口层)                                   │
│  ├── Controllers (控制器)                                   │
│  ├── DTOs (数据传输对象)                                    │
│  └── Guards (守卫)                                          │
├─────────────────────────────────────────────────────────────┤
│  Application Layer (应用层)                                 │
│  ├── Commands (命令)                                        │
│  ├── Queries (查询)                                         │
│  ├── Command Handlers (命令处理器)                          │
│  ├── Query Handlers (查询处理器)                            │
│  └── Event Handlers (事件处理器)                            │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer (领域层)                                      │
│  ├── Aggregates (聚合根)                                    │
│  ├── Value Objects (值对象)                                 │
│  ├── Domain Events (领域事件)                               │
│  └── Domain Services (领域服务)                             │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer (基础设施层)                          │
│  ├── Repositories (仓储)                                    │
│  ├── Adapters (适配器)                                      │
│  ├── Event Store (事件存储)                                 │
│  └── External Services (外部服务)                           │
└─────────────────────────────────────────────────────────────┘
```

## 2. 领域模型设计

### 2.1 核心聚合根

#### 2.1.1 Notification (通知聚合根)

```typescript
export class Notification extends EventSourcedAggregateRoot {
  private constructor(
    private readonly id: NotificationId,
    private readonly tenantId: TenantId,
    private readonly recipientId: UserId,
    private readonly type: NotificationType,
    private readonly title: string,
    private readonly content: string,
    private readonly metadata: NotificationMetadata,
    private status: NotificationStatus = NotificationStatus.PENDING,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
  }

  // 业务方法 - 简单操作，不使用事件驱动
  public markAsRead(): void {
    if (this.status === NotificationStatus.READ) {
      return;
    }

    this.status = NotificationStatus.READ;
    this.updatedAt = new Date();
    // 注意：简单状态变更不发布事件，直接更新状态
  }

  public markAsUnread(): void {
    if (this.status === NotificationStatus.UNREAD) {
      return;
    }

    this.status = NotificationStatus.UNREAD;
    this.updatedAt = new Date();
    // 注意：简单状态变更不发布事件，直接更新状态
  }

  // 业务方法 - 复杂操作，使用事件驱动
  public updateStatus(status: NotificationStatus): void {
    if (this.status === status) {
      return;
    }

    const oldStatus = this.status;
    this.status = status;
    this.updatedAt = new Date();

    // 只有重要的状态变更才发布事件
    if (this.isSignificantStatusChange(oldStatus, status)) {
      this.addDomainEvent(
        new NotificationStatusChangedEvent(
          this.id,
          this.recipientId,
          this.tenantId,
          oldStatus,
          status,
          new Date(),
        ),
      );
    }
  }

  private isSignificantStatusChange(
    oldStatus: NotificationStatus,
    newStatus: NotificationStatus,
  ): boolean {
    // 只有从PENDING到SENT，或从SENT到DELIVERED等关键状态变更才发布事件
    return (
      (oldStatus === NotificationStatus.PENDING &&
        newStatus === NotificationStatus.SENT) ||
      (oldStatus === NotificationStatus.SENT &&
        newStatus === NotificationStatus.DELIVERED) ||
      newStatus === NotificationStatus.FAILED
    );
  }
}
```

#### 2.1.2 NotificationTemplate (通知模板聚合根)

```typescript
export class NotificationTemplate extends EventSourcedAggregateRoot {
  private constructor(
    private readonly id: TemplateId,
    private readonly tenantId: TenantId,
    private readonly name: string,
    private readonly type: NotificationType,
    private readonly subject: string,
    private readonly content: string,
    private readonly variables: TemplateVariable[],
    private readonly channels: NotificationChannel[],
    private readonly isActive: boolean = true,
    private readonly createdAt: Date = new Date(),
    private updatedAt: Date = new Date(),
  ) {
    super();
  }

  // 业务方法
  public render(variables: Record<string, any>): RenderedTemplate {
    // 模板渲染逻辑
    const renderedSubject = this.renderText(this.subject, variables);
    const renderedContent = this.renderText(this.content, variables);

    return new RenderedTemplate(
      renderedSubject,
      renderedContent,
      this.channels,
    );
  }

  private renderText(template: string, variables: Record<string, any>): string {
    // 简单的模板变量替换
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match;
    });
  }
}
```

### 2.2 值对象

#### 2.2.1 NotificationId

```typescript
export class NotificationId extends ValueObject<string> {
  constructor(value: string) {
    super(value);
    this.validate();
  }

  private validate(): void {
    if (!this.value || this.value.length === 0) {
      throw new InvalidNotificationIdError('Notification ID cannot be empty');
    }
  }

  public static generate(): NotificationId {
    return new NotificationId(uuidv4());
  }
}
```

#### 2.2.2 NotificationType

```typescript
export enum NotificationType {
  SYSTEM = 'system',
  PLATFORM_MANAGEMENT = 'platform_management',
  TENANT_MANAGEMENT = 'tenant_management',
  ORGANIZATION_MANAGEMENT = 'organization_management',
  DEPARTMENT_MANAGEMENT = 'department_management',
  USER_MANAGEMENT = 'user_management',
  PERMISSION_MANAGEMENT = 'permission_management',
  SECURITY = 'security',
}
```

#### 2.2.3 NotificationStatus

```typescript
export enum NotificationStatus {
  PENDING = 'pending',
  SENDING = 'sending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
```

### 2.3 领域事件

#### 2.3.1 NotificationCreatedEvent

```typescript
export class NotificationCreatedEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string = 'NotificationCreated';

  constructor(
    public readonly notificationId: string,
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly type: string,
    public readonly title: string,
    public readonly content: string,
    public readonly metadata: any,
  ) {
    this.eventId = uuidv4();
    this.occurredOn = new Date();
  }
}
```

## 3. 应用层设计

### 3.1 命令和查询

#### 3.1.1 命令定义

```typescript
// 创建通知命令
export class CreateNotificationCommand {
  constructor(
    public readonly tenantId: string,
    public readonly recipientId: string,
    public readonly type: NotificationType,
    public readonly title: string,
    public readonly content: string,
    public readonly metadata?: any,
    public readonly channels?: NotificationChannel[],
  ) {}
}

// 标记通知已读命令
export class MarkNotificationAsReadCommand {
  constructor(
    public readonly notificationId: string,
    public readonly userId: string,
  ) {}
}

// 发送通知命令
export class SendNotificationCommand {
  constructor(
    public readonly notificationId: string,
    public readonly channels: NotificationChannel[],
  ) {}
}
```

#### 3.1.2 查询定义

```typescript
// 获取用户通知查询
export class GetUserNotificationsQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly type?: NotificationType,
    public readonly status?: NotificationStatus,
  ) {}
}

// 获取通知统计查询
export class GetNotificationStatsQuery {
  constructor(
    public readonly tenantId: string,
    public readonly startDate: Date,
    public readonly endDate: Date,
  ) {}
}
```

### 3.2 命令处理器

#### 3.2.1 CreateNotificationHandler (事件驱动)

```typescript
@CommandHandler(CreateNotificationCommand)
export class CreateNotificationHandler
  implements ICommandHandler<CreateNotificationCommand>
{
  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: CreateNotificationCommand): Promise<void> {
    // 创建通知聚合根
    const notification = Notification.create(
      NotificationId.generate(),
      new TenantId(command.tenantId),
      new UserId(command.recipientId),
      command.type,
      command.title,
      command.content,
      command.metadata,
    );

    // 保存到仓储
    await this.notificationRepository.save(notification);

    // 发布领域事件 - 创建通知是重要业务事件
    await this.eventBus.publishAll(notification.getUncommittedEvents());
    notification.markEventsAsCommitted();
  }
}
```

#### 3.2.2 MarkNotificationAsReadHandler (直接调用)

```typescript
@CommandHandler(MarkNotificationAsReadCommand)
export class MarkNotificationAsReadHandler
  implements ICommandHandler<MarkNotificationAsReadCommand>
{
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(command: MarkNotificationAsReadCommand): Promise<void> {
    // 直接查询和更新，不使用事件驱动
    const notification = await this.notificationRepository.findById(
      new NotificationId(command.notificationId),
    );

    if (!notification) {
      throw new NotificationNotFoundError(command.notificationId);
    }

    // 直接调用业务方法，不发布事件
    notification.markAsRead();
    await this.notificationRepository.save(notification);
  }
}
```

### 3.3 查询处理器

#### 3.3.1 GetUserNotificationsHandler (直接查询)

```typescript
@QueryHandler(GetUserNotificationsQuery)
export class GetUserNotificationsHandler
  implements IQueryHandler<GetUserNotificationsQuery>
{
  constructor(
    private readonly notificationRepository: INotificationRepository,
  ) {}

  async execute(
    query: GetUserNotificationsQuery,
  ): Promise<NotificationListDto> {
    // 直接查询，不使用事件驱动
    const notifications = await this.notificationRepository.findByUser(
      new UserId(query.userId),
      new TenantId(query.tenantId),
      query.page,
      query.limit,
      query.type,
      query.status,
    );

    return new NotificationListDto(
      notifications.map(n => new NotificationDto(n)),
      query.page,
      query.limit,
    );
  }
}
```

### 3.4 事件处理器

#### 3.4.1 跨模块事件处理器

```typescript
// 处理用户注册事件，自动发送欢迎通知
@EventHandler(UserRegisteredEvent)
export class UserRegisteredEventHandler
  implements IEventHandler<UserRegisteredEvent>
{
  constructor(private readonly notificationService: NotificationService) {}

  async handle(event: UserRegisteredEvent): Promise<void> {
    // 异步发送欢迎通知
    await this.notificationService.sendWelcomeNotification(
      event.userId,
      event.tenantId,
    );
  }
}

// 处理权限变更事件，通知相关用户
@EventHandler(PermissionChangedEvent)
export class PermissionChangedEventHandler
  implements IEventHandler<PermissionChangedEvent>
{
  constructor(private readonly notificationService: NotificationService) {}

  async handle(event: PermissionChangedEvent): Promise<void> {
    // 异步发送权限变更通知
    await this.notificationService.sendPermissionChangeNotification(
      event.userId,
      event.tenantId,
      event.oldPermissions,
      event.newPermissions,
    );
  }
}
```

## 4. 基础设施层设计

### 4.1 仓储实现

#### 4.1.1 NotificationRepository (混合策略)

```typescript
@Injectable()
export class NotificationRepository implements INotificationRepository {
  constructor(
    private readonly databaseAdapter: IDatabaseAdapter,
    private readonly eventStore: IEventStore,
  ) {}

  async save(notification: Notification): Promise<void> {
    // 保存聚合根状态到关系数据库
    await this.databaseAdapter.execute(
      'INSERT INTO notifications (id, tenant_id, recipient_id, type, title, content, metadata, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        notification.getId().value,
        notification.getTenantId().value,
        notification.getRecipientId().value,
        notification.getType(),
        notification.getTitle(),
        notification.getContent(),
        JSON.stringify(notification.getMetadata()),
        notification.getStatus(),
        notification.getCreatedAt(),
        notification.getUpdatedAt(),
      ],
    );

    // 只有有未提交事件时才保存到事件存储
    const uncommittedEvents = notification.getUncommittedEvents();
    if (uncommittedEvents.length > 0) {
      await this.eventStore.saveEvents(
        notification.getId().value,
        uncommittedEvents,
      );
    }
  }

  async findById(id: NotificationId): Promise<Notification | null> {
    // 优先从关系数据库查询，性能更好
    const row = await this.databaseAdapter.query(
      'SELECT * FROM notifications WHERE id = ?',
      [id.value],
    );

    if (!row || row.length === 0) {
      return null;
    }

    // 从关系数据库重建聚合根
    return this.rebuildFromRow(row[0]);
  }

  async findByUser(
    userId: UserId,
    tenantId: TenantId,
    page: number,
    limit: number,
    type?: NotificationType,
    status?: NotificationStatus,
  ): Promise<Notification[]> {
    // 直接查询关系数据库，性能更好
    const offset = (page - 1) * limit;
    let query = `
      SELECT * FROM notifications 
      WHERE recipient_id = ? AND tenant_id = ?
    `;
    const params: any[] = [userId.value, tenantId.value];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = await this.databaseAdapter.query(query, params);

    // 从关系数据库重建聚合根
    return rows.map(row => this.rebuildFromRow(row));
  }

  private rebuildFromRow(row: any): Notification {
    // 从关系数据库行重建聚合根
    return new Notification(
      new NotificationId(row.id),
      new TenantId(row.tenant_id),
      new UserId(row.recipient_id),
      row.type as NotificationType,
      row.title,
      row.content,
      JSON.parse(row.metadata || '{}'),
      row.status as NotificationStatus,
      new Date(row.created_at),
      new Date(row.updated_at),
    );
  }
}
```

### 4.2 通知渠道适配器

#### 4.2.1 EmailChannelAdapter

```typescript
@Injectable()
export class EmailChannelAdapter implements INotificationChannelAdapter {
  constructor(
    private readonly emailService: IEmailService,
    private readonly templateService: ITemplateService,
  ) {}

  async send(
    notification: Notification,
    recipient: User,
  ): Promise<ChannelResult> {
    try {
      // 获取邮件模板
      const template = await this.templateService.getTemplate(
        notification.getType(),
        NotificationChannel.EMAIL,
      );

      // 渲染模板
      const rendered = template.render({
        title: notification.getTitle(),
        content: notification.getContent(),
        recipientName: recipient.getName(),
        // 其他变量...
      });

      // 发送邮件
      await this.emailService.send({
        to: recipient.getEmail(),
        subject: rendered.subject,
        html: rendered.content,
        metadata: notification.getMetadata(),
      });

      return new ChannelResult(
        NotificationChannel.EMAIL,
        ChannelStatus.SUCCESS,
        new Date(),
      );
    } catch (error) {
      return new ChannelResult(
        NotificationChannel.EMAIL,
        ChannelStatus.FAILED,
        new Date(),
        error.message,
      );
    }
  }
}
```

### 4.3 事件存储 (简化版)

#### 4.3.1 EventStore

```typescript
@Injectable()
export class EventStore implements IEventStore {
  constructor(private readonly databaseAdapter: IDatabaseAdapter) {}

  async saveEvents(aggregateId: string, events: IDomainEvent[]): Promise<void> {
    // 只保存重要的事件，用于审计和统计
    const eventRecords = events.map(event => ({
      id: event.eventId,
      aggregate_id: aggregateId,
      event_type: event.eventType,
      event_data: JSON.stringify(event),
      occurred_on: event.occurredOn,
      version: this.getNextVersion(aggregateId),
    }));

    await this.databaseAdapter.execute(
      'INSERT INTO domain_events (id, aggregate_id, event_type, event_data, occurred_on, version) VALUES (?, ?, ?, ?, ?, ?)',
      eventRecords.flatMap(record => [
        record.id,
        record.aggregate_id,
        record.event_type,
        record.event_data,
        record.occurred_on,
        record.version,
      ]),
    );
  }

  async getEvents(aggregateId: string): Promise<IDomainEvent[]> {
    // 主要用于审计和统计，不是主要的查询路径
    const rows = await this.databaseAdapter.query(
      'SELECT * FROM domain_events WHERE aggregate_id = ? ORDER BY version ASC',
      [aggregateId],
    );

    return rows.map(row => this.deserializeEvent(row));
  }

  private deserializeEvent(row: any): IDomainEvent {
    const eventData = JSON.parse(row.event_data);
    // 根据事件类型反序列化
    switch (row.event_type) {
      case 'NotificationCreated':
        return new NotificationCreatedEvent(
          eventData.notificationId,
          eventData.tenantId,
          eventData.recipientId,
          eventData.type,
          eventData.title,
          eventData.content,
          eventData.metadata,
        );
      // 其他事件类型...
      default:
        throw new Error(`Unknown event type: ${row.event_type}`);
    }
  }
}
```

## 5. 接口层设计

### 5.1 控制器

#### 5.1.1 NotificationController

```typescript
@Controller('notifications')
@UseGuards(AuthGuard, PermissionGuard)
export class NotificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @RequirePermissions('notification:create')
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @CurrentUser() user: User,
  ): Promise<NotificationDto> {
    const command = new CreateNotificationCommand(
      createNotificationDto.tenantId,
      createNotificationDto.recipientId,
      createNotificationDto.type,
      createNotificationDto.title,
      createNotificationDto.content,
      createNotificationDto.metadata,
      createNotificationDto.channels,
    );

    await this.commandBus.execute(command);

    // 返回创建的通知信息
    return new NotificationDto(/* ... */);
  }

  @Get()
  @RequirePermissions('notification:read')
  async getUserNotifications(
    @Query() query: GetUserNotificationsQueryDto,
    @CurrentUser() user: User,
  ): Promise<NotificationListDto> {
    const queryCommand = new GetUserNotificationsQuery(
      user.id,
      user.tenantId,
      query.page,
      query.limit,
      query.type,
      query.status,
    );

    return await this.queryBus.execute(queryCommand);
  }

  @Patch(':id/read')
  @RequirePermissions('notification:update')
  async markAsRead(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ): Promise<void> {
    const command = new MarkNotificationAsReadCommand(id, user.id);
    await this.commandBus.execute(command);
  }
}
```

### 5.2 DTO定义

#### 5.2.1 CreateNotificationDto

```typescript
export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  content: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];
}
```

## 6. 数据库设计

### 6.1 表结构设计

#### 6.1.1 notifications表

```sql
CREATE TABLE notifications (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    recipient_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant_recipient (tenant_id, recipient_id),
    INDEX idx_tenant_type (tenant_id, type),
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_created_at (created_at)
);
```

#### 6.1.2 domain_events表

```sql
CREATE TABLE domain_events (
    id VARCHAR(36) PRIMARY KEY,
    aggregate_id VARCHAR(36) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    occurred_on TIMESTAMP NOT NULL,
    version INTEGER NOT NULL,

    INDEX idx_aggregate_id (aggregate_id),
    INDEX idx_occurred_on (occurred_on)
);
```

#### 6.1.3 notification_templates表

```sql
CREATE TABLE notification_templates (
    id VARCHAR(36) PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    variables JSONB,
    channels JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_tenant_type (tenant_id, type),
    INDEX idx_tenant_active (tenant_id, is_active)
);
```

### 6.2 数据隔离策略

#### 6.2.1 多租户数据隔离

```typescript
export class TenantDataIsolationService {
  async addTenantFilter(query: string, tenantId: string): Promise<string> {
    // 为查询添加租户过滤条件
    if (query.includes('WHERE')) {
      return query.replace('WHERE', `WHERE tenant_id = '${tenantId}' AND`);
    } else {
      return `${query} WHERE tenant_id = '${tenantId}'`;
    }
  }
}
```

## 7. 配置管理

### 7.1 通知配置

#### 7.1.1 NotificationConfig

```typescript
@Injectable()
export class NotificationConfig {
  constructor(private readonly configService: ConfigService) {}

  get emailConfig(): EmailConfig {
    return {
      host: this.configService.get('NOTIFICATION_EMAIL_HOST'),
      port: this.configService.get('NOTIFICATION_EMAIL_PORT'),
      secure: this.configService.get('NOTIFICATION_EMAIL_SECURE'),
      auth: {
        user: this.configService.get('NOTIFICATION_EMAIL_USER'),
        pass: this.configService.get('NOTIFICATION_EMAIL_PASS'),
      },
    };
  }

  get rateLimitConfig(): RateLimitConfig {
    return {
      maxRequests: this.configService.get('NOTIFICATION_RATE_LIMIT_MAX', 1000),
      windowMs: this.configService.get(
        'NOTIFICATION_RATE_LIMIT_WINDOW',
        3600000,
      ),
    };
  }
}
```

## 8. 错误处理

### 8.1 自定义异常

#### 8.1.1 NotificationException

```typescript
export class NotificationException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'NotificationException';
  }
}

export class NotificationNotFoundError extends NotificationException {
  constructor(notificationId: string) {
    super(
      `Notification with ID ${notificationId} not found`,
      'NOTIFICATION_NOT_FOUND',
      404,
    );
  }
}

export class InvalidNotificationTypeError extends NotificationException {
  constructor(type: string) {
    super(
      `Invalid notification type: ${type}`,
      'INVALID_NOTIFICATION_TYPE',
      400,
    );
  }
}
```

### 8.2 全局异常过滤器

#### 8.2.1 NotificationExceptionFilter

```typescript
@Catch(NotificationException)
export class NotificationExceptionFilter implements ExceptionFilter {
  catch(exception: NotificationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const errorResponse = {
      statusCode: exception.statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
      code: exception.code,
    };

    response.status(exception.statusCode).json(errorResponse);
  }
}
```

## 9. 测试策略

### 9.1 单元测试

#### 9.1.1 Notification聚合根测试

```typescript
describe('Notification', () => {
  let notification: Notification;

  beforeEach(() => {
    notification = Notification.create(
      NotificationId.generate(),
      new TenantId('tenant-1'),
      new UserId('user-1'),
      NotificationType.SYSTEM,
      'Test Title',
      'Test Content',
      {},
    );
  });

  it('should mark notification as read', () => {
    // Act
    notification.markAsRead();

    // Assert
    expect(notification.getStatus()).toBe(NotificationStatus.READ);
    expect(notification.getUncommittedEvents()).toHaveLength(1);
    expect(notification.getUncommittedEvents()[0]).toBeInstanceOf(
      NotificationReadEvent,
    );
  });

  it('should not mark as read if already read', () => {
    // Arrange
    notification.markAsRead();
    const eventCount = notification.getUncommittedEvents().length;

    // Act
    notification.markAsRead();

    // Assert
    expect(notification.getUncommittedEvents()).toHaveLength(eventCount);
  });
});
```

### 9.2 集成测试

#### 9.2.1 NotificationController测试

```typescript
describe('NotificationController (Integration)', () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let queryBus: QueryBus;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotificationModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    commandBus = app.get(CommandBus);
    queryBus = app.get(QueryBus);

    await app.init();
  });

  it('should create notification', async () => {
    // Arrange
    const createDto = new CreateNotificationDto();
    createDto.tenantId = 'tenant-1';
    createDto.recipientId = 'user-1';
    createDto.type = NotificationType.SYSTEM;
    createDto.title = 'Test Title';
    createDto.content = 'Test Content';

    // Act
    const result = await commandBus.execute(
      new CreateNotificationCommand(
        createDto.tenantId,
        createDto.recipientId,
        createDto.type,
        createDto.title,
        createDto.content,
      ),
    );

    // Assert
    expect(result).toBeDefined();
  });
});
```

## 10. 部署和运维

### 10.1 Docker配置

#### 10.1.1 Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 10.2 环境配置

#### 10.2.1 环境变量

```bash
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=notification_db
DATABASE_USER=notification_user
DATABASE_PASSWORD=notification_password

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# 邮件配置
NOTIFICATION_EMAIL_HOST=smtp.gmail.com
NOTIFICATION_EMAIL_PORT=587
NOTIFICATION_EMAIL_SECURE=false
NOTIFICATION_EMAIL_USER=your-email@gmail.com
NOTIFICATION_EMAIL_PASS=your-password

# 速率限制
NOTIFICATION_RATE_LIMIT_MAX=1000
NOTIFICATION_RATE_LIMIT_WINDOW=3600000
```

## 11. 总结

本技术设计方案基于DDD和Clean Architecture原则，为通知模块提供了完整的技术实现方案。主要特点包括：

### 11.1 架构优势

- **领域驱动**: 以业务领域为核心组织代码
- **混合事件驱动**: 关键业务事件使用事件驱动，简单操作直接调用服务
- **多租户支持**: 完整的数据隔离和权限控制
- **可扩展性**: 插件化架构支持新渠道接入
- **高可用性**: 分布式架构支持水平扩展
- **性能优化**: 避免过度设计，保持系统响应性

### 11.2 技术特点

- **TypeScript**: 强类型支持，提高代码质量
- **NestJS**: 企业级框架，提供完整的依赖注入
- **PostgreSQL**: 关系型数据库，支持复杂查询
- **Redis**: 缓存和消息队列，提高性能
- **事件溯源**: 完整的状态变更历史记录

### 11.3 MVP实现重点

- **站内信通知**: 核心通知功能
- **邮件通知**: 基础外部通知渠道
- **多租户隔离**: 数据安全和权限控制
- **混合事件驱动**: 为后续扩展奠定基础，同时保持性能

通过这个技术设计方案，我们可以构建一个现代化、可扩展、高可用的通知系统，满足SAAS平台的多租户需求。

### 11.4 混合事件驱动架构总结

本方案采用混合事件驱动架构，在保持架构一致性的同时，优化了性能和开发效率：

#### 使用事件驱动的场景：

- **跨模块通知触发**: 用户注册、权限变更、系统维护等业务事件
- **异步通知发送**: 邮件发送队列、批量通知处理
- **审计和统计**: 通知发送记录、用户行为分析

#### 直接调用的场景：

- **简单的CRUD操作**: 标记已读/未读、删除通知、获取通知列表
- **实时性要求高的操作**: 实时通知推送、即时状态更新
- **用户交互操作**: 用户主动触发的操作

这种混合策略既满足了项目的DDD+CQRS架构要求，又避免了过度设计，符合MVP策略，为后续的功能扩展奠定了坚实的技术基础。

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: AI开发团队
