# 通知模块基础设施设计

## 概述

本文档详细描述了通知模块的基础设施层设计，包括消息队列服务、事件总线服务、仓储实现、外部服务适配器、事件存储和缓存服务等核心基础设施组件。

## 1. 基础设施层架构

### 1.1 设计原则

- **依赖倒置**: 实现接口，不依赖具体实现
- **配置驱动**: 通过配置管理基础设施组件
- **多租户支持**: 所有基础设施都支持多租户隔离
- **性能优化**: 连接池、缓存、批量操作等优化策略
- **监控完善**: 全面的监控和日志功能

### 1.2 基础设施层结构

```
基础设施层结构
├── 消息队列服务 (Message Queue Services)
│   ├── NotificationMessageQueueService
│   └── CrossModuleMessageQueueService
├── 事件总线服务 (Event Bus Services)
│   ├── NotificationEventBusService
│   └── IntegrationEventBusService
├── 仓储实现 (Repository Implementations)
│   ├── InAppNotifRepository
│   ├── EmailNotifRepository
│   ├── PushNotifRepository
│   └── SmsNotifRepository
├── 外部服务适配器 (External Service Adapters)
│   ├── EmailServiceAdapter
│   ├── PushServiceAdapter
│   ├── SmsServiceAdapter
│   └── TemplateServiceAdapter
├── 事件存储 (Event Store)
│   ├── NotificationEventStore
│   └── EventProjectionService
└── 缓存服务 (Cache Services)
    ├── NotificationCacheService
    └── TemplateCacheService
```

## 2. 消息队列服务设计

### 2.1 NotificationMessageQueueService

```typescript
/**
 * @class NotificationMessageQueueService
 * @description
 * 通知消息队列服务，负责发布和处理通知相关事件。
 *
 * 服务职责：
 * 1. 发布通知相关事件到消息队列
 * 2. 管理消息队列的生命周期
 * 3. 提供重试和错误处理机制
 * 4. 支持多租户消息隔离
 *
 * 消息队列特性：
 * 1. 基于Redis + Bull队列实现
 * 2. 支持消息重试和指数退避
 * 3. 提供死信队列处理
 * 4. 支持消息优先级和延迟发送
 */
@Injectable()
export class NotificationMessageQueueService {
  private readonly queues: Map<string, Queue> = new Map();

  constructor(
    private readonly bullModule: BullModule,
    private readonly logger: Logger,
    private readonly redisService: IRedisService,
  ) {}

  /**
   * @method publishNotificationEvent
   * @description 发布通知事件到消息队列
   * @param {IDomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @throws {MessagePublishError} 当消息发布失败时抛出
   *
   * 发布流程：
   * 1. 获取或创建通知事件队列
   * 2. 构建消息数据
   * 3. 设置重试和错误处理策略
   * 4. 发布消息到队列
   * 5. 记录发布日志
   */
  async publishNotificationEvent(event: IDomainEvent): Promise<void> {
    try {
      const queue = this.getQueue('notification_events');
      await queue.add(
        'process_notification_event',
        {
          eventId: event.eventId,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          eventData: event.toJSON(),
          occurredOn: event.occurredOn,
          tenantId: this.extractTenantId(event),
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: 100,
          removeOnFail: 50,
          delay: this.calculateDelay(event),
        },
      );

      this.logger.log(
        `Notification event published: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish notification event: ${event.eventType}`,
        error,
      );
      throw new MessagePublishError(
        `Failed to publish notification event: ${error.message}`,
      );
    }
  }

  /**
   * @method publishCrossModuleEvent
   * @description 发布跨模块事件到消息队列
   * @param {IDomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @throws {MessagePublishError} 当消息发布失败时抛出
   */
  async publishCrossModuleEvent(event: IDomainEvent): Promise<void> {
    try {
      const queue = this.getQueue('cross_module_events');
      await queue.add(
        'process_cross_module_event',
        {
          eventId: event.eventId,
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          eventData: event.toJSON(),
          occurredOn: event.occurredOn,
          tenantId: this.extractTenantId(event),
        },
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 3000 },
          removeOnComplete: 200,
          removeOnFail: 100,
        },
      );

      this.logger.log(
        `Cross-module event published: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish cross-module event: ${event.eventType}`,
        error,
      );
      throw new MessagePublishError(
        `Failed to publish cross-module event: ${error.message}`,
      );
    }
  }

  /**
   * @method publishEmailNotification
   * @description 发布邮件通知到发送队列
   * @param {EmailNotifEvent} event 邮件通知事件
   * @returns {Promise<void>}
   */
  async publishEmailNotification(event: EmailNotifEvent): Promise<void> {
    try {
      const queue = this.getQueue('email_notifications');
      await queue.add(
        'send_email_notification',
        {
          eventId: event.eventId,
          notifId: event.notifId,
          tenantId: event.tenantId,
          recipientEmail: event.recipientEmail,
          subject: event.subject,
          content: event.content,
          templateId: event.templateId,
          templateData: event.templateData,
        },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 50,
          removeOnFail: 25,
          priority: this.getEmailPriority(event),
        },
      );

      this.logger.log(
        `Email notification published: ${event.notifId} to ${event.recipientEmail}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish email notification: ${event.notifId}`,
        error,
      );
      throw new MessagePublishError(
        `Failed to publish email notification: ${error.message}`,
      );
    }
  }

  /**
   * @method getQueue
   * @description 获取或创建消息队列
   * @param {string} queueName 队列名称
   * @returns {Queue} Bull队列实例
   * @private
   */
  private getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        connection: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });

      // 设置队列事件监听
      this.setupQueueEventListeners(queue, queueName);
      this.queues.set(queueName, queue);
    }
    return this.queues.get(queueName)!;
  }

  /**
   * @method setupQueueEventListeners
   * @description 设置队列事件监听器
   * @param {Queue} queue 队列实例
   * @param {string} queueName 队列名称
   * @private
   */
  private setupQueueEventListeners(queue: Queue, queueName: string): void {
    queue.on('completed', job => {
      this.logger.log(`Job completed in queue ${queueName}: ${job.id}`);
    });

    queue.on('failed', (job, err) => {
      this.logger.error(`Job failed in queue ${queueName}: ${job.id}`, err);
    });

    queue.on('stalled', job => {
      this.logger.warn(`Job stalled in queue ${queueName}: ${job.id}`);
    });
  }

  /**
   * @method extractTenantId
   * @description 从事件中提取租户ID
   * @param {IDomainEvent} event 领域事件
   * @returns {string | undefined} 租户ID
   * @private
   */
  private extractTenantId(event: IDomainEvent): string | undefined {
    if ('tenantId' in event) {
      return (event as any).tenantId?.value || (event as any).tenantId;
    }
    return undefined;
  }

  /**
   * @method calculateDelay
   * @description 计算消息延迟时间
   * @param {IDomainEvent} event 领域事件
   * @returns {number} 延迟时间（毫秒）
   * @private
   */
  private calculateDelay(event: IDomainEvent): number {
    // 根据事件类型和优先级计算延迟时间
    if (event.eventType.includes('URGENT')) {
      return 0; // 紧急事件立即处理
    }
    if (event.eventType.includes('HIGH')) {
      return 1000; // 高优先级事件1秒延迟
    }
    return 5000; // 普通事件5秒延迟
  }

  /**
   * @method getEmailPriority
   * @description 获取邮件优先级
   * @param {EmailNotifEvent} event 邮件通知事件
   * @returns {number} 优先级数值
   * @private
   */
  private getEmailPriority(event: EmailNotifEvent): number {
    // 根据邮件类型和租户配置确定优先级
    if (event.type === NotifType.SECURITY) {
      return 1; // 最高优先级
    }
    if (event.type === NotifType.BUSINESS) {
      return 5; // 中等优先级
    }
    return 10; // 普通优先级
  }
}
```

### 2.2 消息队列处理器

```typescript
/**
 * @class NotificationEventProcessor
 * @description
 * 通知事件处理器，负责处理通知相关的事件消息。
 *
 * 处理器职责：
 * 1. 处理通知创建、发送、状态更新等事件
 * 2. 协调不同通知渠道的处理逻辑
 * 3. 处理事件重试和错误恢复
 * 4. 更新读模型和统计信息
 */
@Processor('notification_events')
export class NotificationEventProcessor {
  constructor(
    private readonly logger: Logger,
    private readonly notifService: INotificationService,
    private readonly readModelService: IReadModelService,
    private readonly analyticsService: IAnalyticsService,
  ) {}

  /**
   * @method processNotificationEvent
   * @description 处理通知事件
   * @param {Job} job Bull队列任务
   * @returns {Promise<void>}
   */
  @Process('process_notification_event')
  async processNotificationEvent(
    job: Job<NotificationEventData>,
  ): Promise<void> {
    const { eventType, eventData, tenantId } = job.data;

    try {
      this.logger.log(`Processing notification event: ${eventType}`);

      switch (eventType) {
        case 'InAppNotifCreated':
          await this.handleInAppNotifCreated(eventData, tenantId);
          break;
        case 'EmailNotifCreated':
          await this.handleEmailNotifCreated(eventData, tenantId);
          break;
        case 'PushNotifCreated':
          await this.handlePushNotifCreated(eventData, tenantId);
          break;
        case 'SmsNotifCreated':
          await this.handleSmsNotifCreated(eventData, tenantId);
          break;
        default:
          this.logger.warn(`Unknown notification event type: ${eventType}`);
      }

      this.logger.log(
        `Successfully processed notification event: ${eventType}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process notification event: ${eventType}`,
        error,
      );
      throw error; // 让Bull重试
    }
  }

  /**
   * @method handleInAppNotifCreated
   * @description 处理站内通知创建事件
   * @param {any} eventData 事件数据
   * @param {string} tenantId 租户ID
   * @returns {Promise<void>}
   * @private
   */
  private async handleInAppNotifCreated(
    eventData: any,
    tenantId: string,
  ): Promise<void> {
    // 1. 更新读模型
    await this.readModelService.updateInAppNotifReadModel(eventData);

    // 2. 更新统计信息
    await this.analyticsService.incrementInAppNotifCount(tenantId);

    // 3. 触发用户偏好更新
    await this.notifService.updateUserPreferences(
      eventData.recipientId,
      'in-app',
      eventData.type,
    );
  }

  /**
   * @method handleEmailNotifCreated
   * @description 处理邮件通知创建事件
   * @param {any} eventData 事件数据
   * @param {string} tenantId 租户ID
   * @returns {Promise<void>}
   * @private
   */
  private async handleEmailNotifCreated(
    eventData: any,
    tenantId: string,
  ): Promise<void> {
    // 1. 更新读模型
    await this.readModelService.updateEmailNotifReadModel(eventData);

    // 2. 更新统计信息
    await this.analyticsService.incrementEmailNotifCount(tenantId);

    // 3. 触发邮件发送
    await this.notifService.sendEmailNotification(eventData);
  }
}
```

## 3. 事件总线服务设计

### 3.1 NotificationEventBusService

```typescript
/**
 * @class NotificationEventBusService
 * @description
 * 通知事件总线服务，负责事件存储和消息队列发布。
 *
 * 服务职责：
 * 1. 协调事件存储和消息队列
 * 2. 提供统一的事件发布接口
 * 3. 管理事件的生命周期
 * 4. 处理事件发布的事务性
 *
 * 集成策略：
 * 1. 同步保存到事件存储
 * 2. 异步发布到消息队列
 * 3. 支持事件重放和恢复
 * 4. 提供事件监控和统计
 *
 * 事务管理：
 * 1. 确保事件存储的原子性
 * 2. 支持消息队列的可靠性
 * 3. 处理跨系统的事务协调
 * 4. 提供失败恢复机制
 */
@Injectable()
export class NotificationEventBusService {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly messageQueueService: NotificationMessageQueueService,
    private readonly logger: Logger,
    private readonly metricsService: IMetricsService,
  ) {}

  /**
   * @method publish
   * @description 发布单个事件
   * @param {IDomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @throws {EventPublishError} 当事件发布失败时抛出
   *
   * 发布流程：
   * 1. 验证事件的有效性
   * 2. 同步保存到事件存储
   * 3. 异步发布到消息队列
   * 4. 记录发布统计
   * 5. 处理发布异常
   */
  async publish(event: IDomainEvent): Promise<void> {
    const startTime = Date.now();

    try {
      // 1. 验证事件
      this.validateEvent(event);

      // 2. 同步保存到事件存储
      await this.eventStore.saveEvent(event);

      // 3. 异步发布到消息队列
      await this.messageQueueService.publishNotificationEvent(event);

      // 4. 记录发布统计
      const duration = Date.now() - startTime;
      await this.metricsService.recordEventPublish(
        event.eventType,
        duration,
        true,
      );

      this.logger.log(
        `Event published: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      // 5. 处理发布异常
      const duration = Date.now() - startTime;
      await this.metricsService.recordEventPublish(
        event.eventType,
        duration,
        false,
      );

      this.logger.error(`Failed to publish event: ${event.eventType}`, error);
      throw new EventPublishError(`Failed to publish event: ${error.message}`);
    }
  }

  /**
   * @method publishAll
   * @description 批量发布事件
   * @param {IDomainEvent[]} events 领域事件列表
   * @returns {Promise<void>}
   * @throws {EventPublishError} 当事件发布失败时抛出
   *
   * 批量发布流程：
   * 1. 验证事件列表的有效性
   * 2. 批量保存到事件存储
   * 3. 并行发布到消息队列
   * 4. 记录批量发布统计
   * 5. 处理部分失败情况
   */
  async publishAll(events: IDomainEvent[]): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    const startTime = Date.now();

    try {
      // 1. 验证事件列表
      this.validateEvents(events);

      // 2. 批量保存到事件存储
      await this.eventStore.saveEvents(events);

      // 3. 并行发布到消息队列
      const publishPromises = events.map(event =>
        this.messageQueueService.publishNotificationEvent(event),
      );
      await Promise.allSettled(publishPromises);

      // 4. 记录批量发布统计
      const duration = Date.now() - startTime;
      await this.metricsService.recordBatchEventPublish(
        events.length,
        duration,
        true,
      );

      this.logger.log(`Published ${events.length} events successfully`);
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.metricsService.recordBatchEventPublish(
        events.length,
        duration,
        false,
      );

      this.logger.error('Failed to publish events', error);
      throw new EventPublishError(`Failed to publish events: ${error.message}`);
    }
  }

  /**
   * @method publishCrossModuleEvent
   * @description 发布跨模块事件
   * @param {IDomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @throws {EventPublishError} 当事件发布失败时抛出
   */
  async publishCrossModuleEvent(event: IDomainEvent): Promise<void> {
    try {
      // 1. 保存到事件存储
      await this.eventStore.saveEvent(event);

      // 2. 发布到跨模块消息队列
      await this.messageQueueService.publishCrossModuleEvent(event);

      this.logger.log(
        `Cross-module event published: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to publish cross-module event: ${event.eventType}`,
        error,
      );
      throw new EventPublishError(
        `Failed to publish cross-module event: ${error.message}`,
      );
    }
  }

  /**
   * @method validateEvent
   * @description 验证事件的有效性
   * @param {IDomainEvent} event 领域事件
   * @returns {void}
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateEvent(event: IDomainEvent): void {
    if (!event.eventId || !event.eventType || !event.aggregateId) {
      throw new ValidationError('Invalid event: missing required fields');
    }

    if (!event.occurredOn || event.occurredOn > new Date()) {
      throw new ValidationError('Invalid event: invalid occurredOn timestamp');
    }
  }

  /**
   * @method validateEvents
   * @description 验证事件列表的有效性
   * @param {IDomainEvent[]} events 领域事件列表
   * @returns {void}
   * @throws {ValidationError} 当事件列表无效时抛出
   * @private
   */
  private validateEvents(events: IDomainEvent[]): void {
    for (const event of events) {
      this.validateEvent(event);
    }
  }
}
```

## 4. 仓储实现设计

### 4.1 InAppNotifRepository

```typescript
/**
 * @class InAppNotifRepository
 * @description
 * 站内通知仓储实现，负责站内通知数据的持久化和检索。
 *
 * 仓储职责：
 * 1. 实现站内通知聚合根的持久化
 * 2. 提供查询和过滤功能
 * 3. 支持多租户数据隔离
 * 4. 优化查询性能和缓存策略
 *
 * 多租户支持：
 * 1. 基于租户ID进行数据隔离
 * 2. 支持租户级的数据查询
 * 3. 确保跨租户数据安全
 * 4. 支持租户级的数据归档
 */
@Injectable()
export class InAppNotifRepository implements IInAppNotifRepository {
  constructor(
    @InjectEntityManager('postgresql')
    private readonly entityManager: EntityManager,
    private readonly cacheService: ICacheService,
    private readonly tenantContext: ITenantContext,
  ) {}

  /**
   * @method save
   * @description 保存站内通知聚合根
   * @param {InAppNotif} aggregate 站内通知聚合根
   * @returns {Promise<void>}
   * @throws {RepositoryError} 当保存失败时抛出
   *
   * 保存流程：
   * 1. 验证聚合根的有效性
   * 2. 转换聚合根为数据库实体
   * 3. 保存到数据库
   * 4. 清除相关缓存
   * 5. 处理保存异常
   */
  async save(aggregate: InAppNotif): Promise<void> {
    try {
      // 1. 验证聚合根
      this.validateAggregate(aggregate);

      // 2. 转换聚合根为数据库实体
      const entity = this.mapAggregateToEntity(aggregate);

      // 3. 保存到数据库
      await this.entityManager.persistAndFlush(entity);

      // 4. 清除相关缓存
      await this.clearRelatedCache(aggregate);

      this.logger.log(`In-app notification saved: ${aggregate.id.value}`);
    } catch (error) {
      this.logger.error(
        `Failed to save in-app notification: ${aggregate.id.value}`,
        error,
      );
      throw new RepositoryError(
        `Failed to save in-app notification: ${error.message}`,
      );
    }
  }

  /**
   * @method findById
   * @description 根据ID查找站内通知聚合根
   * @param {NotifId} id 通知ID
   * @returns {Promise<InAppNotif | null>} 站内通知聚合根或null
   * @throws {RepositoryError} 当查询失败时抛出
   */
  async findById(id: NotifId): Promise<InAppNotif | null> {
    try {
      // 1. 检查缓存
      const cacheKey = this.generateCacheKey('notif', id.value);
      const cachedEntity =
        await this.cacheService.get<InAppNotifEntity>(cacheKey);

      if (cachedEntity) {
        return this.mapEntityToAggregate(cachedEntity);
      }

      // 2. 从数据库查询
      const entity = await this.entityManager.findOne(InAppNotifEntity, {
        id: id.value,
        tenantId: this.tenantContext.getCurrentTenantId(),
        deletedAt: null,
      });

      if (!entity) {
        return null;
      }

      // 3. 缓存查询结果
      await this.cacheService.set(cacheKey, entity, 300); // 5分钟缓存

      // 4. 转换为聚合根
      return this.mapEntityToAggregate(entity);
    } catch (error) {
      this.logger.error(
        `Failed to find in-app notification: ${id.value}`,
        error,
      );
      throw new RepositoryError(
        `Failed to find in-app notification: ${error.message}`,
      );
    }
  }

  /**
   * @method findByRecipient
   * @description 根据接收者查找站内通知列表
   * @param {UserId} recipientId 接收者ID
   * @param {NotifFilters} filters 过滤条件
   * @param {PaginationOptions} pagination 分页选项
   * @returns {Promise<InAppNotif[]>} 站内通知列表
   * @throws {RepositoryError} 当查询失败时抛出
   */
  async findByRecipient(
    recipientId: UserId,
    filters: NotifFilters,
    pagination: PaginationOptions,
  ): Promise<InAppNotif[]> {
    try {
      // 1. 构建查询条件
      const whereConditions = this.buildWhereConditions(recipientId, filters);

      // 2. 执行查询
      const entities = await this.entityManager.find(
        InAppNotifEntity,
        whereConditions,
        {
          limit: pagination.limit,
          offset: pagination.offset,
          orderBy: this.buildOrderBy(filters.sortBy, filters.sortOrder),
        },
      );

      // 3. 转换为聚合根列表
      return entities.map(entity => this.mapEntityToAggregate(entity));
    } catch (error) {
      this.logger.error(
        `Failed to find in-app notifications for recipient: ${recipientId.value}`,
        error,
      );
      throw new RepositoryError(
        `Failed to find in-app notifications: ${error.message}`,
      );
    }
  }

  /**
   * @method countByRecipient
   * @description 统计接收者的通知数量
   * @param {UserId} recipientId 接收者ID
   * @param {NotifFilters} filters 过滤条件
   * @returns {Promise<number>} 通知数量
   * @throws {RepositoryError} 当查询失败时抛出
   */
  async countByRecipient(
    recipientId: UserId,
    filters: NotifFilters,
  ): Promise<number> {
    try {
      const whereConditions = this.buildWhereConditions(recipientId, filters);
      return await this.entityManager.count(InAppNotifEntity, whereConditions);
    } catch (error) {
      this.logger.error(
        `Failed to count in-app notifications for recipient: ${recipientId.value}`,
        error,
      );
      throw new RepositoryError(
        `Failed to count in-app notifications: ${error.message}`,
      );
    }
  }

  /**
   * @method mapAggregateToEntity
   * @description 将聚合根映射为数据库实体
   * @param {InAppNotif} aggregate 站内通知聚合根
   * @returns {InAppNotifEntity} 数据库实体
   * @private
   */
  private mapAggregateToEntity(aggregate: InAppNotif): InAppNotifEntity {
    return new InAppNotifEntity(
      aggregate.id.value,
      aggregate.tenantId.value,
      aggregate.recipientId.value,
      aggregate.type.value,
      aggregate.title,
      aggregate.content,
      aggregate.priority.value,
      aggregate.metadata,
      aggregate.status?.value || NotifStatus.PENDING,
      aggregate.readAt,
      aggregate.archivedAt,
    );
  }

  /**
   * @method mapEntityToAggregate
   * @description 将数据库实体映射为聚合根
   * @param {InAppNotifEntity} entity 数据库实体
   * @returns {InAppNotif} 站内通知聚合根
   * @private
   */
  private mapEntityToAggregate(entity: InAppNotifEntity): InAppNotif {
    // 这里需要根据实际的聚合根重建逻辑来实现
    // 可能需要从事件存储重建聚合根状态
    return InAppNotif.fromEntity(entity);
  }

  /**
   * @method buildWhereConditions
   * @description 构建查询条件
   * @param {UserId} recipientId 接收者ID
   * @param {NotifFilters} filters 过滤条件
   * @returns {object} 查询条件
   * @private
   */
  private buildWhereConditions(
    recipientId: UserId,
    filters: NotifFilters,
  ): object {
    const conditions: any = {
      recipientId: recipientId.value,
      tenantId: this.tenantContext.getCurrentTenantId(),
      deletedAt: null,
    };

    if (filters.type) {
      conditions.type = filters.type.value;
    }

    if (filters.status) {
      conditions.status = filters.status.value;
    }

    if (filters.priority) {
      conditions.priority = filters.priority.value;
    }

    if (filters.startDate) {
      conditions.createdAt = { $gte: filters.startDate };
    }

    if (filters.endDate) {
      conditions.createdAt = { ...conditions.createdAt, $lte: filters.endDate };
    }

    return conditions;
  }

  /**
   * @method buildOrderBy
   * @description 构建排序条件
   * @param {string} sortBy 排序字段
   * @param {'asc' | 'desc'} sortOrder 排序方向
   * @returns {object} 排序条件
   * @private
   */
  private buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): object {
    return { [sortBy]: sortOrder };
  }

  /**
   * @method generateCacheKey
   * @description 生成缓存键
   * @param {string} type 缓存类型
   * @param {string} id 实体ID
   * @returns {string} 缓存键
   * @private
   */
  private generateCacheKey(type: string, id: string): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    return `in-app-notif:${tenantId}:${type}:${id}`;
  }

  /**
   * @method clearRelatedCache
   * @description 清除相关缓存
   * @param {InAppNotif} aggregate 站内通知聚合根
   * @returns {Promise<void>}
   * @private
   */
  private async clearRelatedCache(aggregate: InAppNotif): Promise<void> {
    const cacheKeys = [
      this.generateCacheKey('notif', aggregate.id.value),
      this.generateCacheKey('recipient', aggregate.recipientId.value),
    ];

    await Promise.all(cacheKeys.map(key => this.cacheService.delete(key)));
  }
}
```

## 5. 外部服务适配器设计

### 5.1 EmailServiceAdapter

```typescript
/**
 * @class EmailServiceAdapter
 * @description
 * 邮件服务适配器，负责与外部邮件服务提供商的集成。
 *
 * 适配器职责：
 * 1. 封装邮件发送服务的复杂性
 * 2. 提供统一的邮件发送接口
 * 3. 处理邮件发送的异常和重试
 * 4. 支持多种邮件服务提供商
 *
 * 支持的服务商：
 * 1. SMTP服务器
 * 2. SendGrid
 * 3. AWS SES
 * 4. Mailgun
 * 5. 其他第三方邮件服务
 */
@Injectable()
export class EmailServiceAdapter implements IEmailServiceAdapter {
  constructor(
    private readonly configService: IConfigService,
    private readonly logger: Logger,
    private readonly metricsService: IMetricsService,
  ) {}

  /**
   * @method sendEmail
   * @description 发送邮件
   * @param {EmailMessage} message 邮件消息
   * @returns {Promise<EmailSendResult>} 发送结果
   * @throws {EmailSendError} 当邮件发送失败时抛出
   *
   * 发送流程：
   * 1. 验证邮件消息的有效性
   * 2. 选择邮件服务提供商
   * 3. 构建邮件请求
   * 4. 发送邮件
   * 5. 处理发送结果
   * 6. 记录发送统计
   */
  async sendEmail(message: EmailMessage): Promise<EmailSendResult> {
    const startTime = Date.now();

    try {
      // 1. 验证邮件消息
      this.validateEmailMessage(message);

      // 2. 选择邮件服务提供商
      const provider = await this.selectEmailProvider(message);

      // 3. 构建邮件请求
      const emailRequest = this.buildEmailRequest(message, provider);

      // 4. 发送邮件
      const result = await this.sendWithProvider(emailRequest, provider);

      // 5. 记录发送统计
      const duration = Date.now() - startTime;
      await this.metricsService.recordEmailSend(
        provider.name,
        result.success,
        duration,
      );

      this.logger.log(
        `Email sent successfully: ${message.to} via ${provider.name}`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.metricsService.recordEmailSend('unknown', false, duration);

      this.logger.error(`Failed to send email: ${message.to}`, error);
      throw new EmailSendError(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * @method sendBulkEmail
   * @description 批量发送邮件
   * @param {EmailMessage[]} messages 邮件消息列表
   * @returns {Promise<EmailBulkSendResult>} 批量发送结果
   * @throws {EmailSendError} 当批量发送失败时抛出
   */
  async sendBulkEmail(messages: EmailMessage[]): Promise<EmailBulkSendResult> {
    const startTime = Date.now();
    const results: EmailSendResult[] = [];
    const errors: EmailSendError[] = [];

    try {
      // 并行发送邮件
      const sendPromises = messages.map(async message => {
        try {
          const result = await this.sendEmail(message);
          results.push(result);
        } catch (error) {
          errors.push(error as EmailSendError);
        }
      });

      await Promise.allSettled(sendPromises);

      const duration = Date.now() - startTime;
      const successCount = results.length;
      const failureCount = errors.length;

      await this.metricsService.recordBulkEmailSend(
        messages.length,
        successCount,
        failureCount,
        duration,
      );

      return {
        totalSent: messages.length,
        successCount,
        failureCount,
        results,
        errors,
        duration,
      };
    } catch (error) {
      this.logger.error('Failed to send bulk emails', error);
      throw new EmailSendError(`Failed to send bulk emails: ${error.message}`);
    }
  }

  /**
   * @method selectEmailProvider
   * @description 选择邮件服务提供商
   * @param {EmailMessage} message 邮件消息
   * @returns {Promise<EmailProvider>} 邮件服务提供商
   * @private
   */
  private async selectEmailProvider(
    message: EmailMessage,
  ): Promise<EmailProvider> {
    const tenantId = message.tenantId;
    const tenantConfig =
      await this.configService.getTenantEmailConfig(tenantId);

    // 根据租户配置选择提供商
    if (tenantConfig.preferredProvider) {
      return this.getProvider(tenantConfig.preferredProvider);
    }

    // 根据邮件类型选择提供商
    if (message.type === NotifType.SECURITY) {
      return this.getProvider('smtp'); // 安全邮件使用SMTP
    }

    if (message.priority === NotifPriority.URGENT) {
      return this.getProvider('sendgrid'); // 紧急邮件使用SendGrid
    }

    // 默认提供商
    return this.getProvider('smtp');
  }

  /**
   * @method getProvider
   * @description 获取邮件服务提供商实例
   * @param {string} providerName 提供商名称
   * @returns {EmailProvider} 邮件服务提供商
   * @private
   */
  private getProvider(providerName: string): EmailProvider {
    switch (providerName) {
      case 'smtp':
        return new SmtpEmailProvider(this.configService);
      case 'sendgrid':
        return new SendGridEmailProvider(this.configService);
      case 'ses':
        return new AwsSesEmailProvider(this.configService);
      case 'mailgun':
        return new MailgunEmailProvider(this.configService);
      default:
        throw new Error(`Unsupported email provider: ${providerName}`);
    }
  }

  /**
   * @method validateEmailMessage
   * @description 验证邮件消息的有效性
   * @param {EmailMessage} message 邮件消息
   * @returns {void}
   * @throws {ValidationError} 当邮件消息无效时抛出
   * @private
   */
  private validateEmailMessage(message: EmailMessage): void {
    if (!message.to || !this.isValidEmail(message.to)) {
      throw new ValidationError('Invalid recipient email address');
    }

    if (!message.subject || message.subject.trim().length === 0) {
      throw new ValidationError('Email subject is required');
    }

    if (!message.content || message.content.trim().length === 0) {
      throw new ValidationError('Email content is required');
    }

    if (message.attachments && message.attachments.length > 10) {
      throw new ValidationError('Too many attachments (max 10)');
    }
  }

  /**
   * @method isValidEmail
   * @description 验证邮箱地址格式
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

## 6. 总结

通知模块的基础设施层设计基于依赖倒置原则，通过消息队列服务、事件总线服务、仓储实现和外部服务适配器，实现了高度的技术内聚和业务解耦。这种设计既保证了技术实现的完整性，又提供了良好的可扩展性和可维护性。

### 6.1 设计优势

- **技术内聚**: 每个基础设施组件职责明确
- **业务解耦**: 通过适配器模式实现业务与技术的解耦
- **性能优化**: 连接池、缓存、批量操作等优化策略
- **监控完善**: 全面的监控和日志功能
- **多租户支持**: 所有基础设施都支持多租户隔离

### 6.2 关键特性

- **消息队列**: 基于Redis + Bull的可靠消息处理
- **事件总线**: 统一的事件存储和发布机制
- **仓储模式**: 完整的数据持久化和查询功能
- **外部集成**: 灵活的外部服务适配器
- **缓存策略**: 多层次的缓存优化
- **错误处理**: 完整的异常处理和重试机制

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
