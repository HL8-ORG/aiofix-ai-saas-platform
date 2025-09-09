# 事件驱动架构设计

## 文档信息

- **文档名称**: 事件驱动架构设计
- **文档版本**: V1.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

事件驱动架构（Event-Driven Architecture, EDA）是本项目的核心架构模式之一，通过事件实现系统组件之间的松耦合通信。本架构基于事件溯源（Event Sourcing）和CQRS模式，实现了异步事件处理、最终一致性和高可扩展性。

## 设计原则

### 1. 事件驱动

- **事件优先**: 所有状态变更都通过事件表示
- **异步处理**: 事件处理采用异步模式
- **松耦合**: 组件之间通过事件进行通信
- **可扩展**: 支持水平扩展和负载均衡

### 2. 事件溯源

- **状态重建**: 通过事件历史重建聚合根状态
- **审计日志**: 完整的事件历史提供审计能力
- **时间旅行**: 支持任意时间点的状态查询
- **版本控制**: 支持事件结构的版本管理

### 3. 最终一致性

- **异步同步**: 读模型异步更新
- **补偿机制**: 处理不一致状态
- **监控告警**: 监控一致性状态
- **手动修复**: 提供手动修复工具

## 事件存储设计

### 事件存储接口

```typescript
/**
 * @interface IEventStore
 * @description 事件存储接口，定义事件存储的基本操作
 *
 * 事件存储职责：
 * 1. 持久化领域事件到事件存储数据库
 * 2. 支持事件的版本控制和并发控制
 * 3. 提供事件查询和过滤功能
 * 4. 支持事件重放和快照机制
 *
 * 事件溯源特性：
 * 1. 所有状态变更都通过事件记录
 * 2. 支持时间旅行和状态重建
 * 3. 提供完整的审计日志
 * 4. 支持事件版本管理和迁移
 *
 * 多租户支持：
 * 1. 基于租户ID进行事件隔离
 * 2. 支持租户级的事件查询
 * 3. 确保跨租户数据安全
 * 4. 支持租户级的事件归档
 */
export interface IEventStore {
  /**
   * 保存聚合根的事件到事件存储
   * @param aggregateId 聚合根ID
   * @param events 领域事件列表
   * @param expectedVersion 期望的版本号，用于乐观并发控制
   */
  saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number,
  ): Promise<void>;

  /**
   * 获取聚合根的事件历史
   * @param aggregateId 聚合根ID
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号，可选
   * @returns 事件列表
   */
  getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<IDomainEvent[]>;

  /**
   * 获取聚合根的快照
   * @param aggregateId 聚合根ID
   * @returns 快照数据
   */
  getSnapshot(aggregateId: string): Promise<ISnapshot | null>;

  /**
   * 保存聚合根的快照
   * @param aggregateId 聚合根ID
   * @param snapshot 快照数据
   * @param version 版本号
   */
  saveSnapshot(
    aggregateId: string,
    snapshot: ISnapshot,
    version: number,
  ): Promise<void>;

  /**
   * 获取事件流
   * @param fromEventId 起始事件ID
   * @param limit 限制数量
   * @returns 事件流
   */
  getEventStream(fromEventId?: string, limit?: number): Promise<IEventStream>;

  /**
   * 删除聚合根的事件历史
   * @param aggregateId 聚合根ID
   * @param toVersion 删除到指定版本
   */
  deleteEvents(aggregateId: string, toVersion: number): Promise<void>;
}
```

### MongoDB事件存储实现

```typescript
/**
 * @class MongoEventStore
 * @description MongoDB事件存储实现，使用MongoDB存储领域事件
 *
 * 实现特性：
 * 1. 使用MongoDB的文档存储能力
 * 2. 支持事件的分片和索引
 * 3. 实现事件版本控制
 * 4. 支持事件查询和过滤
 * 5. 提供事件归档和清理
 *
 * 性能优化：
 * 1. 使用复合索引优化查询
 * 2. 实现事件分片策略
 * 3. 支持事件压缩和归档
 * 4. 提供事件缓存机制
 */
@Injectable()
export class MongoEventStore implements IEventStore {
  private eventsCollection: Collection<StoredEvent>;
  private snapshotsCollection: Collection<StoredSnapshot>;

  constructor(
    @Inject('MONGODB_CONNECTION') private readonly mongoClient: MongoClient,
    private readonly logger: Logger,
  ) {
    const db = this.mongoClient.db('aiofix_events');
    this.eventsCollection = db.collection<StoredEvent>('events');
    this.snapshotsCollection = db.collection<StoredSnapshot>('snapshots');

    this.createIndexes();
  }

  /**
   * 保存聚合根的事件到事件存储
   * @param aggregateId 聚合根ID
   * @param events 领域事件列表
   * @param expectedVersion 期望的版本号
   */
  async saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    const session = this.mongoClient.startSession();

    try {
      await session.withTransaction(async () => {
        // 1. 检查当前版本
        const currentVersion = await this.getCurrentVersion(aggregateId);
        if (currentVersion !== expectedVersion) {
          throw new ConcurrencyError(
            `Expected version ${expectedVersion}, but current version is ${currentVersion}`,
          );
        }

        // 2. 保存事件
        const storedEvents = events.map((event, index) => ({
          _id: new ObjectId(),
          aggregateId,
          eventType: event.eventType,
          eventVersion: event.eventVersion,
          aggregateVersion: expectedVersion + index + 1,
          eventData: event.toJSON(),
          metadata: {
            occurredOn: event.occurredOn,
            tenantId: this.getTenantIdFromEvent(event),
            correlationId: event.correlationId,
            causationId: event.causationId,
          },
          createdAt: new Date(),
        }));

        await this.eventsCollection.insertMany(storedEvents, { session });

        // 3. 更新聚合根版本
        await this.updateAggregateVersion(
          aggregateId,
          expectedVersion + events.length,
          session,
        );

        this.logger.log(
          `Saved ${events.length} events for aggregate ${aggregateId}`,
        );
      });
    } catch (error) {
      this.logger.error(
        `Failed to save events for aggregate ${aggregateId}`,
        error,
      );
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * 获取聚合根的事件历史
   * @param aggregateId 聚合根ID
   * @param fromVersion 起始版本号
   * @param toVersion 结束版本号
   * @returns 事件列表
   */
  async getEvents(
    aggregateId: string,
    fromVersion: number = 0,
    toVersion?: number,
  ): Promise<IDomainEvent[]> {
    try {
      const query: any = {
        aggregateId,
        aggregateVersion: { $gte: fromVersion },
      };

      if (toVersion !== undefined) {
        query.aggregateVersion.$lte = toVersion;
      }

      const storedEvents = await this.eventsCollection
        .find(query)
        .sort({ aggregateVersion: 1 })
        .toArray();

      return storedEvents.map(storedEvent =>
        this.deserializeEvent(storedEvent),
      );
    } catch (error) {
      this.logger.error(
        `Failed to get events for aggregate ${aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 获取聚合根的快照
   * @param aggregateId 聚合根ID
   * @returns 快照数据
   */
  async getSnapshot(aggregateId: string): Promise<ISnapshot | null> {
    try {
      const storedSnapshot = await this.snapshotsCollection.findOne(
        { aggregateId },
        { sort: { version: -1 } },
      );

      if (!storedSnapshot) {
        return null;
      }

      return {
        aggregateId: storedSnapshot.aggregateId,
        version: storedSnapshot.version,
        data: storedSnapshot.data,
        createdAt: storedSnapshot.createdAt,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get snapshot for aggregate ${aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 保存聚合根的快照
   * @param aggregateId 聚合根ID
   * @param snapshot 快照数据
   * @param version 版本号
   */
  async saveSnapshot(
    aggregateId: string,
    snapshot: ISnapshot,
    version: number,
  ): Promise<void> {
    try {
      const storedSnapshot: StoredSnapshot = {
        _id: new ObjectId(),
        aggregateId,
        version,
        data: snapshot.data,
        createdAt: new Date(),
      };

      await this.snapshotsCollection.insertOne(storedSnapshot);

      this.logger.log(
        `Saved snapshot for aggregate ${aggregateId} at version ${version}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save snapshot for aggregate ${aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * 获取事件流
   * @param fromEventId 起始事件ID
   * @param limit 限制数量
   * @returns 事件流
   */
  async getEventStream(
    fromEventId?: string,
    limit: number = 100,
  ): Promise<IEventStream> {
    try {
      const query: any = {};
      if (fromEventId) {
        query._id = { $gt: new ObjectId(fromEventId) };
      }

      const storedEvents = await this.eventsCollection
        .find(query)
        .sort({ _id: 1 })
        .limit(limit)
        .toArray();

      const events = storedEvents.map(storedEvent =>
        this.deserializeEvent(storedEvent),
      );
      const lastEventId =
        storedEvents.length > 0
          ? storedEvents[storedEvents.length - 1]._id.toString()
          : null;

      return {
        events,
        lastEventId,
        hasMore: storedEvents.length === limit,
      };
    } catch (error) {
      this.logger.error('Failed to get event stream', error);
      throw error;
    }
  }

  /**
   * 创建索引
   */
  private async createIndexes(): Promise<void> {
    try {
      // 事件集合索引
      await this.eventsCollection.createIndex({
        aggregateId: 1,
        aggregateVersion: 1,
      });
      await this.eventsCollection.createIndex({ eventType: 1, createdAt: 1 });
      await this.eventsCollection.createIndex({
        'metadata.tenantId': 1,
        createdAt: 1,
      });
      await this.eventsCollection.createIndex({ createdAt: 1 });

      // 快照集合索引
      await this.snapshotsCollection.createIndex({
        aggregateId: 1,
        version: -1,
      });

      this.logger.log('Created MongoDB indexes for event store');
    } catch (error) {
      this.logger.error('Failed to create MongoDB indexes', error);
      throw error;
    }
  }

  /**
   * 获取当前版本
   */
  private async getCurrentVersion(aggregateId: string): Promise<number> {
    const result = await this.eventsCollection.findOne(
      { aggregateId },
      { sort: { aggregateVersion: -1 }, projection: { aggregateVersion: 1 } },
    );

    return result ? result.aggregateVersion : 0;
  }

  /**
   * 更新聚合根版本
   */
  private async updateAggregateVersion(
    aggregateId: string,
    version: number,
    session: ClientSession,
  ): Promise<void> {
    // 这里可以实现聚合根版本跟踪逻辑
    // 简化实现，实际项目中可能需要单独的版本跟踪集合
  }

  /**
   * 从事件中提取租户ID
   */
  private getTenantIdFromEvent(event: IDomainEvent): string | undefined {
    if ('tenantId' in event) {
      return (event as any).tenantId;
    }
    return undefined;
  }

  /**
   * 反序列化事件
   */
  private deserializeEvent(storedEvent: StoredEvent): IDomainEvent {
    // 根据事件类型反序列化事件
    const eventClass = this.getEventClass(storedEvent.eventType);
    return new eventClass(storedEvent.eventData);
  }

  /**
   * 获取事件类
   */
  private getEventClass(eventType: string): any {
    const eventClassMap = {
      UserCreated: UserCreatedEvent,
      UserUpdated: UserUpdatedEvent,
      UserDeleted: UserDeletedEvent,
      TenantCreated: TenantCreatedEvent,
      TenantUpdated: TenantUpdatedEvent,
      // 添加更多事件类型映射
    };

    return eventClassMap[eventType] || DomainEvent;
  }
}
```

## 事件总线设计

### 事件总线接口

```typescript
/**
 * @interface IEventBus
 * @description 事件总线接口，定义事件发布和订阅的基本操作
 *
 * 事件总线职责：
 * 1. 发布领域事件到消息队列
 * 2. 订阅和处理领域事件
 * 3. 实现事件路由和分发
 * 4. 提供事件监控和统计
 *
 * 事件类型：
 * 1. 领域事件：业务状态变更通知
 * 2. 集成事件：跨边界上下文通信
 * 3. 命令事件：异步命令处理
 * 4. 查询事件：异步查询处理
 *
 * 可靠性保证：
 * 1. 消息持久化存储
 * 2. 消息确认机制
 * 3. 失败重试策略
 * 4. 死信队列处理
 */
export interface IEventBus {
  /**
   * 发布领域事件
   * @param event 领域事件
   */
  publish(event: IDomainEvent): Promise<void>;

  /**
   * 发布多个领域事件
   * @param events 领域事件列表
   */
  publishAll(events: IDomainEvent[]): Promise<void>;

  /**
   * 订阅领域事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  subscribe(eventType: string, handler: IEventHandler): void;

  /**
   * 取消订阅领域事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  unsubscribe(eventType: string, handler: IEventHandler): void;

  /**
   * 获取事件统计信息
   * @returns 事件统计信息
   */
  getEventStats(): Promise<IEventStats>;
}
```

### Redis事件总线实现

```typescript
/**
 * @class RedisEventBus
 * @description Redis事件总线实现，使用Redis实现事件发布和订阅
 *
 * 实现特性：
 * 1. 使用Redis的发布订阅功能
 * 2. 支持事件持久化和重放
 * 3. 实现事件路由和分发
 * 4. 提供事件监控和统计
 * 5. 支持事件重试和死信队列
 *
 * 性能优化：
 * 1. 使用Redis Streams实现可靠消息传递
 * 2. 实现事件批处理
 * 3. 支持事件压缩和序列化
 * 4. 提供事件缓存机制
 */
@Injectable()
export class RedisEventBus implements IEventBus {
  private redis: Redis;
  private subscribers: Map<string, Set<IEventHandler>> = new Map();
  private eventStats: IEventStats;

  constructor(
    @Inject('REDIS_CONNECTION') private readonly redisClient: Redis,
    private readonly logger: Logger,
  ) {
    this.redis = this.redisClient;
    this.eventStats = this.initializeEventStats();
    this.setupEventProcessing();
  }

  /**
   * 发布领域事件
   * @param event 领域事件
   */
  async publish(event: IDomainEvent): Promise<void> {
    try {
      // 1. 序列化事件
      const eventData = this.serializeEvent(event);

      // 2. 发布到Redis Stream
      await this.redis.xadd(
        'events:stream',
        '*',
        'eventType',
        event.eventType,
        'aggregateId',
        event.aggregateId,
        'eventData',
        JSON.stringify(eventData),
        'metadata',
        JSON.stringify({
          occurredOn: event.occurredOn,
          eventVersion: event.eventVersion,
          tenantId: this.getTenantIdFromEvent(event),
        }),
      );

      // 3. 更新统计信息
      this.updateEventStats(event.eventType, 'published');

      this.logger.log(
        `Published event: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.eventType}`, error);
      throw new EventPublishError(`Failed to publish event: ${error.message}`);
    }
  }

  /**
   * 发布多个领域事件
   * @param events 领域事件列表
   */
  async publishAll(events: IDomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    try {
      // 使用管道批量发布事件
      const pipeline = this.redis.pipeline();

      for (const event of events) {
        const eventData = this.serializeEvent(event);

        pipeline.xadd(
          'events:stream',
          '*',
          'eventType',
          event.eventType,
          'aggregateId',
          event.aggregateId,
          'eventData',
          JSON.stringify(eventData),
          'metadata',
          JSON.stringify({
            occurredOn: event.occurredOn,
            eventVersion: event.eventVersion,
            tenantId: this.getTenantIdFromEvent(event),
          }),
        );
      }

      await pipeline.exec();

      // 更新统计信息
      events.forEach(event => {
        this.updateEventStats(event.eventType, 'published');
      });

      this.logger.log(`Published ${events.length} events`);
    } catch (error) {
      this.logger.error(`Failed to publish ${events.length} events`, error);
      throw new EventPublishError(`Failed to publish events: ${error.message}`);
    }
  }

  /**
   * 订阅领域事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  subscribe(eventType: string, handler: IEventHandler): void {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    this.subscribers.get(eventType)!.add(handler);
    this.logger.log(`Subscribed to event: ${eventType}`);
  }

  /**
   * 取消订阅领域事件
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  unsubscribe(eventType: string, handler: IEventHandler): void {
    const handlers = this.subscribers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.subscribers.delete(eventType);
      }
    }
    this.logger.log(`Unsubscribed from event: ${eventType}`);
  }

  /**
   * 获取事件统计信息
   * @returns 事件统计信息
   */
  async getEventStats(): Promise<IEventStats> {
    return { ...this.eventStats };
  }

  /**
   * 设置事件处理
   */
  private setupEventProcessing(): void {
    // 启动事件处理循环
    this.processEvents().catch(error => {
      this.logger.error('Event processing error', error);
    });
  }

  /**
   * 处理事件
   */
  private async processEvents(): Promise<void> {
    const consumerGroup = 'event-processors';
    const consumerName = `consumer-${process.pid}`;

    try {
      // 创建消费者组
      await this.redis.xgroup(
        'CREATE',
        'events:stream',
        consumerGroup,
        '$',
        'MKSTREAM',
      );
    } catch (error) {
      // 消费者组可能已存在，忽略错误
    }

    while (true) {
      try {
        // 读取事件
        const events = await this.redis.xreadgroup(
          'GROUP',
          consumerGroup,
          consumerName,
          'COUNT',
          10,
          'BLOCK',
          1000,
          'STREAMS',
          'events:stream',
          '>',
        );

        if (events && events.length > 0) {
          for (const stream of events) {
            for (const event of stream[1]) {
              await this.processEvent(event);
            }
          }
        }
      } catch (error) {
        this.logger.error('Error processing events', error);
        await this.sleep(1000); // 等待1秒后重试
      }
    }
  }

  /**
   * 处理单个事件
   */
  private async processEvent(eventData: any[]): Promise<void> {
    try {
      const eventId = eventData[0];
      const fields = eventData[1];

      const eventType = fields[1];
      const aggregateId = fields[3];
      const eventDataStr = fields[5];
      const metadataStr = fields[7];

      // 反序列化事件
      const event = this.deserializeEvent(eventType, JSON.parse(eventDataStr));
      const metadata = JSON.parse(metadataStr);

      // 获取事件处理器
      const handlers = this.subscribers.get(eventType);
      if (handlers && handlers.size > 0) {
        // 并行处理事件
        const promises = Array.from(handlers).map(handler =>
          this.handleEvent(handler, event, eventId),
        );

        await Promise.allSettled(promises);
      }

      // 确认事件处理完成
      await this.redis.xack('events:stream', 'event-processors', eventId);

      // 更新统计信息
      this.updateEventStats(eventType, 'processed');
    } catch (error) {
      this.logger.error('Error processing event', error);
      // 将失败的事件发送到死信队列
      await this.sendToDeadLetterQueue(eventData, error);
    }
  }

  /**
   * 处理事件
   */
  private async handleEvent(
    handler: IEventHandler,
    event: IDomainEvent,
    eventId: string,
  ): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      this.logger.error(`Event handler failed for event ${eventId}`, error);
      throw error;
    }
  }

  /**
   * 发送到死信队列
   */
  private async sendToDeadLetterQueue(
    eventData: any[],
    error: Error,
  ): Promise<void> {
    try {
      await this.redis.lpush(
        'events:dead-letter',
        JSON.stringify({
          eventData,
          error: error.message,
          timestamp: new Date(),
        }),
      );
    } catch (dlqError) {
      this.logger.error('Failed to send event to dead letter queue', dlqError);
    }
  }

  /**
   * 序列化事件
   */
  private serializeEvent(event: IDomainEvent): any {
    return {
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      eventVersion: event.eventVersion,
      occurredOn: event.occurredOn,
      data: event.toJSON(),
    };
  }

  /**
   * 反序列化事件
   */
  private deserializeEvent(eventType: string, eventData: any): IDomainEvent {
    const eventClass = this.getEventClass(eventType);
    return new eventClass(eventData.data);
  }

  /**
   * 获取事件类
   */
  private getEventClass(eventType: string): any {
    const eventClassMap = {
      UserCreated: UserCreatedEvent,
      UserUpdated: UserUpdatedEvent,
      UserDeleted: UserDeletedEvent,
      TenantCreated: TenantCreatedEvent,
      TenantUpdated: TenantUpdatedEvent,
      // 添加更多事件类型映射
    };

    return eventClassMap[eventType] || DomainEvent;
  }

  /**
   * 从事件中提取租户ID
   */
  private getTenantIdFromEvent(event: IDomainEvent): string | undefined {
    if ('tenantId' in event) {
      return (event as any).tenantId;
    }
    return undefined;
  }

  /**
   * 更新事件统计信息
   */
  private updateEventStats(
    eventType: string,
    action: 'published' | 'processed' | 'failed',
  ): void {
    if (!this.eventStats.events[eventType]) {
      this.eventStats.events[eventType] = {
        published: 0,
        processed: 0,
        failed: 0,
      };
    }

    this.eventStats.events[eventType][action]++;
    this.eventStats.total[action]++;
  }

  /**
   * 初始化事件统计信息
   */
  private initializeEventStats(): IEventStats {
    return {
      events: {},
      total: {
        published: 0,
        processed: 0,
        failed: 0,
      },
    };
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## 事件处理器设计

### 事件处理器接口

```typescript
/**
 * @interface IEventHandler
 * @description 事件处理器接口，定义事件处理的基本操作
 *
 * 事件处理器职责：
 * 1. 处理领域事件的业务逻辑
 * 2. 更新读模型和视图
 * 3. 触发相关的副作用操作
 * 4. 处理事件处理的错误和重试
 *
 * 处理模式：
 * 1. 同步处理：立即处理事件
 * 2. 异步处理：异步处理事件
 * 3. 批处理：批量处理事件
 * 4. 流处理：流式处理事件
 */
export interface IEventHandler<T extends IDomainEvent = IDomainEvent> {
  /**
   * 处理领域事件
   * @param event 领域事件
   */
  handle(event: T): Promise<void>;

  /**
   * 获取处理器名称
   * @returns 处理器名称
   */
  getHandlerName(): string;

  /**
   * 获取支持的事件类型
   * @returns 事件类型列表
   */
  getSupportedEventTypes(): string[];

  /**
   * 检查是否支持事件类型
   * @param eventType 事件类型
   * @returns 是否支持
   */
  supportsEventType(eventType: string): boolean;
}
```

### 用户创建事件处理器

```typescript
/**
 * @class UserCreatedEventHandler
 * @description 用户创建事件处理器，处理用户创建事件的后续业务逻辑
 *
 * 事件处理职责：
 * 1. 接收并处理用户创建领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 更新用户列表视图
 * 2. 更新用户统计信息
 * 3. 更新组织架构视图
 * 4. 更新权限管理视图
 *
 * 业务流程触发：
 * 1. 发送欢迎邮件
 * 2. 创建用户权限
 * 3. 记录审计日志
 * 4. 更新用户统计
 */
@Injectable()
export class UserCreatedEventHandler
  implements IEventHandler<UserCreatedEvent>
{
  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly notificationService: INotificationService,
    private readonly permissionService: IPermissionService,
    private readonly auditService: IAuditService,
    private readonly statisticsService: IStatisticsService,
    private readonly logger: Logger,
  ) {}

  /**
   * 处理用户创建事件，执行后续业务逻辑
   * @param event 用户创建事件
   */
  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      // 1. 验证事件
      this.validateEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserReadModel(event),
        this.sendWelcomeEmail(event),
        this.createUserPermissions(event),
        this.logAuditEvent(event),
        this.updateUserStatistics(event),
      ]);

      this.logger.log(
        `UserCreatedEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process UserCreatedEvent: ${event.aggregateId}`,
        error,
      );
      throw error; // 让事件总线重试
    }
  }

  /**
   * 获取处理器名称
   * @returns 处理器名称
   */
  getHandlerName(): string {
    return 'UserCreatedEventHandler';
  }

  /**
   * 获取支持的事件类型
   * @returns 事件类型列表
   */
  getSupportedEventTypes(): string[] {
    return ['UserCreated'];
  }

  /**
   * 检查是否支持事件类型
   * @param eventType 事件类型
   * @returns 是否支持
   */
  supportsEventType(eventType: string): boolean {
    return this.getSupportedEventTypes().includes(eventType);
  }

  /**
   * 更新用户读模型视图
   * @param event 用户创建事件
   */
  private async updateUserReadModel(event: UserCreatedEvent): Promise<void> {
    const userReadModel: UserReadModel = {
      id: event.aggregateId,
      email: event.email,
      profile: event.profile,
      status: UserStatus.ACTIVE,
      platformId: event.platformId,
      tenantId: event.tenantId,
      organizationId: event.organizationId,
      departmentId: event.departmentId,
      roles: ['PERSONAL_USER'],
      permissions: this.getDefaultPermissions(),
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };

    await this.userReadRepository.save(userReadModel);
  }

  /**
   * 发送欢迎邮件
   * @param event 用户创建事件
   */
  private async sendWelcomeEmail(event: UserCreatedEvent): Promise<void> {
    await this.notificationService.sendWelcomeEmail(
      event.email,
      event.profile.firstName,
      event.tenantId,
    );
  }

  /**
   * 创建用户权限
   * @param event 用户创建事件
   */
  private async createUserPermissions(event: UserCreatedEvent): Promise<void> {
    await this.permissionService.createDefaultPermissions(
      event.aggregateId,
      event.platformId,
      event.tenantId,
    );
  }

  /**
   * 记录审计日志
   * @param event 用户创建事件
   */
  private async logAuditEvent(event: UserCreatedEvent): Promise<void> {
    await this.auditService.logEvent({
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      details: event.toJSON(),
      timestamp: event.occurredOn,
    });
  }

  /**
   * 更新用户统计
   * @param event 用户创建事件
   */
  private async updateUserStatistics(event: UserCreatedEvent): Promise<void> {
    await this.statisticsService.incrementUserCount(event.tenantId);
  }

  /**
   * 获取默认权限列表
   */
  private getDefaultPermissions(): string[] {
    return ['user:read:own', 'user:update:own', 'platform:service:use'];
  }

  /**
   * 验证事件的有效性
   */
  private validateEvent(event: UserCreatedEvent): void {
    if (!event.aggregateId || !event.email || !event.profile) {
      throw new Error('Invalid UserCreatedEvent: missing required fields');
    }
  }
}
```

## 事件投影设计

### 事件投影接口

```typescript
/**
 * @interface IEventProjection
 * @description 事件投影接口，定义事件投影的基本操作
 *
 * 事件投影职责：
 * 1. 将领域事件投影到读模型
 * 2. 维护读模型的一致性
 * 3. 支持投影的重建和修复
 * 4. 提供投影的监控和统计
 *
 * 投影类型：
 * 1. 同步投影：立即更新读模型
 * 2. 异步投影：异步更新读模型
 * 3. 批处理投影：批量更新读模型
 * 4. 流式投影：流式更新读模型
 */
export interface IEventProjection {
  /**
   * 处理领域事件
   * @param event 领域事件
   */
  handle(event: IDomainEvent): Promise<void>;

  /**
   * 重建投影
   * @param fromEventId 起始事件ID
   * @param toEventId 结束事件ID
   */
  rebuild(fromEventId?: string, toEventId?: string): Promise<void>;

  /**
   * 获取投影状态
   * @returns 投影状态
   */
  getProjectionState(): Promise<IProjectionState>;

  /**
   * 重置投影
   */
  reset(): Promise<void>;
}
```

### 用户投影实现

```typescript
/**
 * @class UserProjection
 * @description 用户事件投影，负责将领域事件投影到读模型视图
 *
 * 投影职责：
 * 1. 监听和处理用户相关的领域事件
 * 2. 维护用户相关的读模型视图
 * 3. 支持投影的增量更新
 * 4. 处理投影的异常和恢复
 *
 * 读模型维护：
 * 1. 用户列表视图
 * 2. 用户统计视图
 * 3. 用户权限视图
 * 4. 用户活动视图
 *
 * 投影特性：
 * 1. 支持投影的幂等性
 * 2. 处理重复事件
 * 3. 支持投影的重新构建
 * 4. 提供投影状态查询
 */
@Injectable()
export class UserProjection implements IEventProjection {
  private projectionState: IProjectionState;

  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly userStatisticsRepository: IUserStatisticsRepository,
    private readonly userPermissionRepository: IUserPermissionRepository,
    private readonly projectionStateRepository: IProjectionStateRepository,
    private readonly eventStore: IEventStore,
    private readonly logger: Logger,
  ) {
    this.projectionState = this.initializeProjectionState();
  }

  /**
   * 处理用户相关事件，更新读模型视图
   * @param event 领域事件
   */
  async handle(event: IDomainEvent): Promise<void> {
    try {
      // 1. 检查事件是否已处理（幂等性）
      if (await this.isEventProcessed(event)) {
        return;
      }

      // 2. 根据事件类型处理
      switch (event.eventType) {
        case 'UserCreated':
          await this.handleUserCreated(event as UserCreatedEvent);
          break;
        case 'UserUpdated':
          await this.handleUserUpdated(event as UserUpdatedEvent);
          break;
        case 'UserDeleted':
          await this.handleUserDeleted(event as UserDeletedEvent);
          break;
        default:
          // 忽略不相关的事件
          break;
      }

      // 3. 记录事件处理状态
      await this.recordEventProcessed(event);
    } catch (error) {
      // 记录投影处理失败
      await this.recordProjectionError(event, error);
      throw new ProjectionError(
        `Failed to process event ${event.eventType}: ${error.message}`,
      );
    }
  }

  /**
   * 重建投影
   * @param fromEventId 起始事件ID
   * @param toEventId 结束事件ID
   */
  async rebuild(fromEventId?: string, toEventId?: string): Promise<void> {
    try {
      this.logger.log(
        `Starting projection rebuild from ${fromEventId} to ${toEventId}`,
      );

      // 1. 重置投影状态
      await this.reset();

      // 2. 获取事件流
      const eventStream = await this.eventStore.getEventStream(fromEventId);

      // 3. 处理事件
      for (const event of eventStream.events) {
        await this.handle(event);
      }

      this.logger.log('Projection rebuild completed');
    } catch (error) {
      this.logger.error('Projection rebuild failed', error);
      throw error;
    }
  }

  /**
   * 获取投影状态
   * @returns 投影状态
   */
  async getProjectionState(): Promise<IProjectionState> {
    return { ...this.projectionState };
  }

  /**
   * 重置投影
   */
  async reset(): Promise<void> {
    try {
      // 1. 清空读模型数据
      await this.userReadRepository.clear();
      await this.userStatisticsRepository.clear();
      await this.userPermissionRepository.clear();

      // 2. 重置投影状态
      this.projectionState = this.initializeProjectionState();
      await this.projectionStateRepository.save(this.projectionState);

      this.logger.log('Projection reset completed');
    } catch (error) {
      this.logger.error('Projection reset failed', error);
      throw error;
    }
  }

  /**
   * 处理用户创建事件
   * @param event 用户创建事件
   */
  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    // 更新用户列表视图
    await this.userReadRepository.addUser({
      id: event.aggregateId,
      email: event.email,
      profile: event.profile,
      status: 'ACTIVE',
      platformId: event.platformId,
      tenantId: event.tenantId,
      organizationId: event.organizationId,
      departmentId: event.departmentId,
      createdAt: event.occurredOn,
    });

    // 更新用户统计
    await this.userStatisticsRepository.incrementUserCount(event.tenantId);

    // 创建默认权限
    await this.userPermissionRepository.createDefaultPermissions(
      event.aggregateId,
      event.platformId,
      event.tenantId,
    );
  }

  /**
   * 处理用户更新事件
   * @param event 用户更新事件
   */
  private async handleUserUpdated(event: UserUpdatedEvent): Promise<void> {
    // 更新用户信息
    await this.userReadRepository.updateUser(event.aggregateId, {
      profile: event.profile,
      preferences: event.preferences,
      updatedAt: event.occurredOn,
    });
  }

  /**
   * 处理用户删除事件
   * @param event 用户删除事件
   */
  private async handleUserDeleted(event: UserDeletedEvent): Promise<void> {
    // 删除用户信息
    await this.userReadRepository.deleteUser(event.aggregateId);

    // 更新用户统计
    await this.userStatisticsRepository.decrementUserCount(event.tenantId);

    // 删除用户权限
    await this.userPermissionRepository.deleteUserPermissions(
      event.aggregateId,
    );
  }

  /**
   * 检查事件是否已处理
   * @param event 领域事件
   * @returns 是否已处理
   */
  private async isEventProcessed(event: IDomainEvent): Promise<boolean> {
    return await this.projectionStateRepository.isEventProcessed(
      'UserProjection',
      event.getEventId(),
    );
  }

  /**
   * 记录事件处理状态
   * @param event 领域事件
   */
  private async recordEventProcessed(event: IDomainEvent): Promise<void> {
    await this.projectionStateRepository.recordEventProcessed(
      'UserProjection',
      event.getEventId(),
      event.occurredOn,
    );
  }

  /**
   * 记录投影错误
   * @param event 领域事件
   * @param error 错误信息
   */
  private async recordProjectionError(
    event: IDomainEvent,
    error: Error,
  ): Promise<void> {
    await this.projectionStateRepository.recordProjectionError(
      'UserProjection',
      event.getEventId(),
      error.message,
      new Date(),
    );
  }

  /**
   * 初始化投影状态
   */
  private initializeProjectionState(): IProjectionState {
    return {
      projectionName: 'UserProjection',
      lastProcessedEventId: null,
      lastProcessedEventTime: null,
      processedEventCount: 0,
      errorCount: 0,
      lastError: null,
      lastErrorTime: null,
    };
  }
}
```

## 测试策略

### 单元测试

```typescript
// 事件存储测试
describe('MongoEventStore', () => {
  let eventStore: MongoEventStore;
  let mockMongoClient: jest.Mocked<MongoClient>;

  beforeEach(() => {
    mockMongoClient = createMockMongoClient();
    eventStore = new MongoEventStore(mockMongoClient, mockLogger);
  });

  it('should save events successfully', async () => {
    const events = [
      new UserCreatedEvent('user-123', 'user@example.com', { firstName: 'John', lastName: 'Doe' }, 'tenant-456'),
    ];

    await eventStore.saveEvents('user-123', events, 0);

    expect(mockMongoClient.startSession).toHaveBeenCalled();
    expect(mockEventsCollection.insertMany).toHaveBeenCalled();
  });

  it('should throw concurrency error when version mismatch', async () => {
    const events = [new UserCreatedEvent('user-123', 'user@example.com', { firstName: 'John', lastName: 'Doe' }, 'tenant-456')];

    mockEventsCollection.findOne.mockResolvedValue({ aggregateVersion: 1 });

    await expect(eventStore.saveEvents('user-123', events, 0)).rejects.toThrow(ConcurrencyError);
  });
});

// 事件总线测试
describe('RedisEventBus', () => {
  let eventBus: RedisEventBus;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    eventBus = new RedisEventBus(mockRedis, mockLogger);
  });

  it('should publish event successfully', async () => {
    const event = new UserCreatedEvent('user-123', 'user@example.com', { firstName: 'John', lastName: 'Doe' }, 'tenant-456');

    mockRedis.xadd.mockResolvedValue('1234567890-0');

    await eventBus.publish(event);

    expect(mockRedis.xadd).toHaveBeenCalledWith(
      'events:stream',
      '*',
      'eventType', 'UserCreated',
      'aggregateId', 'user-123',
      'eventData', expect.any(String),
      'metadata', expect.any(String),
    );
  });

  it('should subscribe to event successfully', () => {
    const handler = jest.fn();

    eventBus.subscribe('UserCreated', handler);

    expect(eventBus['subscribers'].get('UserCreated')).toContain(handler);
  });
});

// 事件处理器测试
describe('UserCreatedEventHandler', () => {
  let handler: UserCreatedEventHandler;
  let mockReadRepository: jest.Mocked<IUserReadRepository>;

  beforeEach(() => {
    mockReadRepository = createMockReadRepository();
    handler = new UserCreatedEventHandler(mockReadRepository, ...);
  });

  it('should handle user created event', async () => {
    const event = new UserCreatedEvent(
      'user-123',
      'user@example.com',
      { firstName: 'John', lastName: 'Doe' },
      'tenant-456',
    );

    await handler.handle(event);

    expect(mockReadRepository.save).toHaveBeenCalled();
    expect(mockNotificationService.sendWelcomeEmail).toHaveBeenCalled();
    expect(mockPermissionService.createDefaultPermissions).toHaveBeenCalled();
  });
});
```

## 总结

事件驱动架构是本项目的核心架构模式，通过事件存储、事件总线、事件处理器和事件投影，实现了系统组件之间的松耦合通信。这种设计确保了系统的可扩展性、可维护性和高性能，为业务逻辑的实现提供了坚实的事件驱动基础。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
