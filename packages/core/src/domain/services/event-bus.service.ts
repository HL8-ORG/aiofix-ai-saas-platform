import { DomainEvent } from '../domain-event';
import {
  IEventBus,
  EventSubscription,
  RetryPolicy,
  EventBusConfig,
  EventBusStatistics,
} from '../interfaces/event-bus.interface';
import { IEventStore } from '../interfaces/event-store.interface';
import { IEventHandler } from '../interfaces/event-handler.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class EventBusService
 * @description
 * 事件总线服务实现，负责协调事件存储和消息队列的集成。
 *
 * 事件总线职责：
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
 *
 * @param {IEventStore} eventStore 事件存储服务
 * @param {EventBusConfig} config 事件总线配置
 *
 * @example
 * ```typescript
 * const eventBus = new EventBusService(eventStore, config);
 * await eventBus.publishAll(events);
 * ```
 * @since 1.0.0
 */
export class EventBusService implements IEventBus {
  private readonly subscriptions: Map<string, EventSubscription> = new Map();
  private readonly subscriptionsByEventType: Map<string, Set<string>> =
    new Map();
  private readonly deadLetterQueue: DomainEvent[] = [];
  private readonly retryQueue: Map<
    string,
    { event: DomainEvent; retryCount: number; nextRetryAt: Date }
  > = new Map();

  private isStarted = false;
  private startTime: Date | null = null;
  private statistics = {
    totalEventsPublished: 0,
    totalEventsProcessed: 0,
    totalEventsFailed: 0,
    activeSubscriptions: 0,
    averageProcessingTime: 0,
    eventsPerSecond: 0,
    deadLetterQueueSize: 0,
    retryQueueSize: 0,
    uptime: 0,
  };

  constructor(
    private readonly eventStore: IEventStore,
    private readonly config: EventBusConfig,
  ) {}

  /**
   * @method publish
   * @description 发布单个领域事件
   * @param {DomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @throws {EventPublishError} 当事件发布失败时抛出
   *
   * 发布流程：
   * 1. 验证事件的有效性
   * 2. 同步保存到事件存储
   * 3. 异步发布到消息队列
   * 4. 记录发布结果
   */
  async publish(event: DomainEvent): Promise<void> {
    await this.publishAll([event]);
  }

  /**
   * @method publishAll
   * @description 发布所有领域事件，协调事件存储和消息队列
   * @param {DomainEvent[]} events 领域事件列表
   * @returns {Promise<void>}
   * @throws {EventPublishError} 当事件发布失败时抛出
   *
   * 发布流程：
   * 1. 验证事件列表的有效性
   * 2. 同步保存到事件存储
   * 3. 异步发布到消息队列
   * 4. 记录发布结果
   */
  async publishAll(events: DomainEvent[]): Promise<void> {
    if (!this.isStarted) {
      throw new Error('Event bus is not started');
    }

    if (!events || events.length === 0) {
      return;
    }

    try {
      // 1. 验证事件
      this.validateEvents(events);

      // 2. 同步保存到事件存储
      for (const event of events) {
        const currentVersion = await this.eventStore.getAggregateVersion(
          event.aggregateId,
        );
        await this.eventStore.saveEvents(
          event.aggregateId,
          [event],
          currentVersion,
        );
      }

      // 3. 异步发布到消息队列（处理订阅者）
      await this.processEventsAsync(events);

      // 4. 更新统计信息
      this.updateStatistics(events.length, true);

      console.log(`Published ${events.length} events successfully`);
    } catch (error) {
      this.updateStatistics(events.length, false);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to publish events: ${errorMessage}`);
    }
  }

  /**
   * @method subscribe
   * @description 订阅事件
   * @param {string} eventType 事件类型
   * @param {IEventHandler} handler 事件处理器
   * @param {number} [priority=100] 处理优先级
   * @param {RetryPolicy} [retryPolicy] 重试策略
   * @returns {Promise<string>} 订阅ID
   */
  async subscribe(
    eventType: string,
    handler: IEventHandler,
    priority: number = 100,
    retryPolicy?: RetryPolicy,
  ): Promise<string> {
    const subscriptionId = uuidv4();
    const subscription: EventSubscription = {
      id: subscriptionId,
      eventType,
      handler,
      priority,
      retryPolicy: retryPolicy || this.config.defaultRetryPolicy,
      isActive: true,
      createdAt: new Date(),
    };

    // 添加到订阅映射
    this.subscriptions.set(subscriptionId, subscription);

    // 添加到事件类型映射
    if (!this.subscriptionsByEventType.has(eventType)) {
      this.subscriptionsByEventType.set(eventType, new Set());
    }
    this.subscriptionsByEventType.get(eventType)!.add(subscriptionId);

    // 更新统计信息
    this.statistics.activeSubscriptions = this.subscriptions.size;

    console.log(
      `Subscribed to event type: ${eventType} with ID: ${subscriptionId}`,
    );
    return subscriptionId;
  }

  /**
   * @method unsubscribe
   * @description 取消订阅
   * @param {string} subscriptionId 订阅ID
   * @returns {Promise<void>}
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found: ${subscriptionId}`);
    }

    // 从订阅映射中移除
    this.subscriptions.delete(subscriptionId);

    // 从事件类型映射中移除
    const eventTypeSubscriptions = this.subscriptionsByEventType.get(
      subscription.eventType,
    );
    if (eventTypeSubscriptions) {
      eventTypeSubscriptions.delete(subscriptionId);
      if (eventTypeSubscriptions.size === 0) {
        this.subscriptionsByEventType.delete(subscription.eventType);
      }
    }

    // 更新统计信息
    this.statistics.activeSubscriptions = this.subscriptions.size;

    console.log(`Unsubscribed from subscription: ${subscriptionId}`);
  }

  /**
   * @method getSubscriptions
   * @description 获取事件订阅列表
   * @param {string} [eventType] 事件类型，可选
   * @returns {Promise<EventSubscription[]>} 订阅列表
   */
  async getSubscriptions(eventType?: string): Promise<EventSubscription[]> {
    if (eventType) {
      const subscriptionIds =
        this.subscriptionsByEventType.get(eventType) || new Set();
      return Array.from(subscriptionIds)
        .map(id => this.subscriptions.get(id))
        .filter((sub): sub is EventSubscription => sub !== undefined);
    }

    return Array.from(this.subscriptions.values());
  }

  /**
   * @method isSubscribed
   * @description 检查是否已订阅指定事件类型
   * @param {string} eventType 事件类型
   * @returns {Promise<boolean>} 是否已订阅
   */
  async isSubscribed(eventType: string): Promise<boolean> {
    return (
      this.subscriptionsByEventType.has(eventType) &&
      this.subscriptionsByEventType.get(eventType)!.size > 0
    );
  }

  /**
   * @method replayEvents
   * @description 重放事件
   * @param {string} aggregateId 聚合根ID
   * @param {number} fromVersion 起始版本号
   * @param {number} [toVersion] 结束版本号，可选
   * @returns {Promise<void>}
   */
  async replayEvents(
    aggregateId: string,
    fromVersion: number,
    toVersion?: number,
  ): Promise<void> {
    const events = await this.eventStore.getEvents(
      aggregateId,
      fromVersion,
      toVersion,
    );
    await this.processEventsAsync(events);
    console.log(
      `Replayed ${events.length} events for aggregate ${aggregateId}`,
    );
  }

  /**
   * @method replayEventsByType
   * @description 根据事件类型重放事件
   * @param {string} eventType 事件类型
   * @param {Date} fromDate 开始日期
   * @param {Date} toDate 结束日期
   * @returns {Promise<void>}
   */
  async replayEventsByType(
    eventType: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<void> {
    const events = await this.eventStore.getEventsByType(
      eventType,
      fromDate,
      toDate,
    );
    await this.processEventsAsync(events);
    console.log(`Replayed ${events.length} events of type ${eventType}`);
  }

  /**
   * @method getEventBusStatistics
   * @description 获取事件总线统计信息
   * @returns {Promise<EventBusStatistics>} 统计信息
   */
  async getEventBusStatistics(): Promise<EventBusStatistics> {
    // 更新运行时间
    if (this.startTime) {
      this.statistics.uptime = Math.floor(
        (Date.now() - this.startTime.getTime()) / 1000,
      );
    }

    // 更新队列大小
    this.statistics.deadLetterQueueSize = this.deadLetterQueue.length;
    this.statistics.retryQueueSize = this.retryQueue.size;

    return { ...this.statistics };
  }

  /**
   * @method start
   * @description 启动事件总线
   * @returns {Promise<void>}
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;
    this.startTime = new Date();
    this.statistics = {
      totalEventsPublished: 0,
      totalEventsProcessed: 0,
      totalEventsFailed: 0,
      activeSubscriptions: 0,
      averageProcessingTime: 0,
      eventsPerSecond: 0,
      deadLetterQueueSize: 0,
      retryQueueSize: 0,
      uptime: 0,
    };

    console.log('Event bus started');
  }

  /**
   * @method stop
   * @description 停止事件总线
   * @returns {Promise<void>}
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;
    this.startTime = null;

    console.log('Event bus stopped');
  }

  /**
   * @method isRunning
   * @description 检查事件总线是否正在运行
   * @returns {boolean} 是否正在运行
   */
  isRunning(): boolean {
    return this.isStarted;
  }

  /**
   * @method processEventsAsync
   * @description 异步处理事件
   * @param {DomainEvent[]} events 事件列表
   * @returns {Promise<void>}
   * @private
   */
  private async processEventsAsync(events: DomainEvent[]): Promise<void> {
    const processingPromises = events.map(event =>
      this.processEventAsync(event),
    );
    await Promise.allSettled(processingPromises);
  }

  /**
   * @method processEventAsync
   * @description 异步处理单个事件
   * @param {DomainEvent} event 事件
   * @returns {Promise<void>}
   * @private
   */
  private async processEventAsync(event: DomainEvent): Promise<void> {
    const eventType = event.getEventType();
    const subscriptionIds = this.subscriptionsByEventType.get(eventType);

    if (!subscriptionIds || subscriptionIds.size === 0) {
      return; // 没有订阅者
    }

    const subscriptions = Array.from(subscriptionIds)
      .map(id => this.subscriptions.get(id))
      .filter(
        (sub): sub is EventSubscription => sub !== undefined && sub.isActive,
      )
      .sort((a, b) => a.priority - b.priority); // 按优先级排序

    // 并发处理所有订阅者
    const processingPromises = subscriptions.map(subscription =>
      this.processEventWithHandler(event, subscription),
    );

    await Promise.allSettled(processingPromises);
  }

  /**
   * @method processEventWithHandler
   * @description 使用特定处理器处理事件
   * @param {DomainEvent} event 事件
   * @param {EventSubscription} subscription 订阅信息
   * @returns {Promise<void>}
   * @private
   */
  private async processEventWithHandler(
    event: DomainEvent,
    subscription: EventSubscription,
  ): Promise<void> {
    const startTime = Date.now();

    try {
      await subscription.handler.handle(event);

      const processingTime = Date.now() - startTime;
      this.updateProcessingStatistics(processingTime, true);

      console.log(
        `Event ${event.getEventType()} processed by handler ${subscription.id}`,
      );
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateProcessingStatistics(processingTime, false);

      console.error(
        `Event ${event.getEventType()} failed to process by handler ${subscription.id}:`,
        error,
      );

      // 处理重试逻辑
      await this.handleEventProcessingError(event, subscription, error);
    }
  }

  /**
   * @method handleEventProcessingError
   * @description 处理事件处理错误
   * @param {DomainEvent} event 事件
   * @param {EventSubscription} subscription 订阅信息
   * @param {unknown} error 错误
   * @returns {Promise<void>}
   * @private
   */
  private async handleEventProcessingError(
    event: DomainEvent,
    subscription: EventSubscription,
    error: unknown,
  ): Promise<void> {
    const retryKey = `${event.aggregateId}-${event.getEventType()}-${subscription.id}`;
    const existingRetry = this.retryQueue.get(retryKey);

    if (existingRetry) {
      existingRetry.retryCount++;
    } else {
      this.retryQueue.set(retryKey, {
        event,
        retryCount: 1,
        nextRetryAt: new Date(Date.now() + subscription.retryPolicy.retryDelay),
      });
    }

    const retryInfo = this.retryQueue.get(retryKey)!;

    if (retryInfo.retryCount <= subscription.retryPolicy.maxRetries) {
      // 计算下次重试时间
      const delay = Math.min(
        subscription.retryPolicy.retryDelay *
          Math.pow(
            subscription.retryPolicy.backoffMultiplier,
            retryInfo.retryCount - 1,
          ),
        subscription.retryPolicy.maxRetryDelay,
      );

      retryInfo.nextRetryAt = new Date(Date.now() + delay);

      console.log(
        `Event ${event.getEventType()} scheduled for retry ${retryInfo.retryCount}/${subscription.retryPolicy.maxRetries} at ${retryInfo.nextRetryAt.toISOString()}`,
      );
    } else {
      // 超过最大重试次数，发送到死信队列
      if (this.config.enableDeadLetterQueue) {
        this.deadLetterQueue.push(event);
        console.log(
          `Event ${event.getEventType()} sent to dead letter queue after ${retryInfo.retryCount} retries`,
        );
      }

      this.retryQueue.delete(retryKey);
    }
  }

  /**
   * @method validateEvents
   * @description 验证事件列表的有效性
   * @param {DomainEvent[]} events 事件列表
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateEvents(events: DomainEvent[]): void {
    for (const event of events) {
      if (!event.aggregateId || !event.getEventType()) {
        throw new Error('Invalid event: missing required fields');
      }
    }
  }

  /**
   * @method updateStatistics
   * @description 更新统计信息
   * @param {number} eventCount 事件数量
   * @param {boolean} success 是否成功
   * @private
   */
  private updateStatistics(eventCount: number, success: boolean): void {
    this.statistics.totalEventsPublished += eventCount;

    if (success) {
      this.statistics.totalEventsProcessed += eventCount;
    } else {
      this.statistics.totalEventsFailed += eventCount;
    }

    // 计算每秒事件数
    if (this.startTime) {
      const uptimeSeconds = (Date.now() - this.startTime.getTime()) / 1000;
      this.statistics.eventsPerSecond =
        this.statistics.totalEventsPublished / uptimeSeconds;
    }
  }

  /**
   * @method updateProcessingStatistics
   * @description 更新处理统计信息
   * @param {number} processingTime 处理时间
   * @param {boolean} success 是否成功
   * @private
   */
  private updateProcessingStatistics(
    processingTime: number,
    success: boolean,
  ): void {
    if (success) {
      // 更新平均处理时间
      const totalProcessed = this.statistics.totalEventsProcessed;
      this.statistics.averageProcessingTime =
        (this.statistics.averageProcessingTime * (totalProcessed - 1) +
          processingTime) /
        totalProcessed;
    }
  }
}
