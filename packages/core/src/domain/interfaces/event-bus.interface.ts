import { DomainEvent } from '../domain-event';
import { IEventHandler } from './event-handler.interface';

/**
 * @interface EventSubscription
 * @description 事件订阅信息
 */
export interface EventSubscription {
  readonly id: string;
  readonly eventType: string;
  readonly handler: IEventHandler;
  readonly priority: number; // 处理优先级，数字越小优先级越高
  readonly retryPolicy: RetryPolicy;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

/**
 * @interface RetryPolicy
 * @description 重试策略
 */
export interface RetryPolicy {
  readonly maxRetries: number;
  readonly retryDelay: number; // 毫秒
  readonly backoffMultiplier: number; // 退避乘数
  readonly maxRetryDelay: number; // 最大重试延迟
}

/**
 * @interface EventBusConfig
 * @description 事件总线配置
 */
export interface EventBusConfig {
  readonly maxConcurrentHandlers: number;
  readonly defaultRetryPolicy: RetryPolicy;
  readonly enableDeadLetterQueue: boolean;
  readonly deadLetterQueueRetentionDays: number;
  readonly enableEventOrdering: boolean;
  readonly enableEventDeduplication: boolean;
}

/**
 * @interface IEventBus
 * @description
 * 事件总线接口，负责协调事件存储和消息队列的集成。
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
 * @example
 * ```typescript
 * const eventBus = new EventBus(eventStore, messageQueue);
 * await eventBus.publishAll(events);
 * ```
 * @since 1.0.0
 */
export interface IEventBus {
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
  publish(event: DomainEvent): Promise<void>;

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
  publishAll(events: DomainEvent[]): Promise<void>;

  /**
   * @method subscribe
   * @description 订阅事件
   * @param {string} eventType 事件类型
   * @param {IEventHandler} handler 事件处理器
   * @param {number} [priority=100] 处理优先级
   * @param {RetryPolicy} [retryPolicy] 重试策略
   * @returns {Promise<string>} 订阅ID
   */
  subscribe(
    eventType: string,
    handler: IEventHandler,
    priority?: number,
    retryPolicy?: RetryPolicy,
  ): Promise<string>;

  /**
   * @method unsubscribe
   * @description 取消订阅
   * @param {string} subscriptionId 订阅ID
   * @returns {Promise<void>}
   */
  unsubscribe(subscriptionId: string): Promise<void>;

  /**
   * @method getSubscriptions
   * @description 获取事件订阅列表
   * @param {string} [eventType] 事件类型，可选
   * @returns {Promise<EventSubscription[]>} 订阅列表
   */
  getSubscriptions(eventType?: string): Promise<EventSubscription[]>;

  /**
   * @method isSubscribed
   * @description 检查是否已订阅指定事件类型
   * @param {string} eventType 事件类型
   * @returns {Promise<boolean>} 是否已订阅
   */
  isSubscribed(eventType: string): Promise<boolean>;

  /**
   * @method replayEvents
   * @description 重放事件
   * @param {string} aggregateId 聚合根ID
   * @param {number} fromVersion 起始版本号
   * @param {number} [toVersion] 结束版本号，可选
   * @returns {Promise<void>}
   */
  replayEvents(
    aggregateId: string,
    fromVersion: number,
    toVersion?: number,
  ): Promise<void>;

  /**
   * @method replayEventsByType
   * @description 根据事件类型重放事件
   * @param {string} eventType 事件类型
   * @param {Date} fromDate 开始日期
   * @param {Date} toDate 结束日期
   * @returns {Promise<void>}
   */
  replayEventsByType(
    eventType: string,
    fromDate: Date,
    toDate: Date,
  ): Promise<void>;

  /**
   * @method getEventBusStatistics
   * @description 获取事件总线统计信息
   * @returns {Promise<EventBusStatistics>} 统计信息
   */
  getEventBusStatistics(): Promise<EventBusStatistics>;

  /**
   * @method start
   * @description 启动事件总线
   * @returns {Promise<void>}
   */
  start(): Promise<void>;

  /**
   * @method stop
   * @description 停止事件总线
   * @returns {Promise<void>}
   */
  stop(): Promise<void>;

  /**
   * @method isRunning
   * @description 检查事件总线是否正在运行
   * @returns {boolean} 是否正在运行
   */
  isRunning(): boolean;
}

/**
 * @interface EventBusStatistics
 * @description 事件总线统计信息
 */
export interface EventBusStatistics {
  readonly totalEventsPublished: number;
  readonly totalEventsProcessed: number;
  readonly totalEventsFailed: number;
  readonly activeSubscriptions: number;
  readonly averageProcessingTime: number; // 毫秒
  readonly eventsPerSecond: number;
  readonly deadLetterQueueSize: number;
  readonly retryQueueSize: number;
  readonly uptime: number; // 秒
}
