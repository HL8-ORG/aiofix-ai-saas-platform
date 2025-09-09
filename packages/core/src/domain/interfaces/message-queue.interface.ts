import { DomainEvent } from '../domain-event';

/**
 * @interface IMessage
 * @description 消息接口
 */
export interface IMessage {
  readonly id: string;
  readonly type: 'DOMAIN_EVENT' | 'COMMAND' | 'QUERY' | 'INTEGRATION_EVENT';
  readonly eventType?: string;
  readonly commandType?: string;
  readonly queryType?: string;
  readonly aggregateId?: string;
  readonly data: Record<string, unknown>;
  readonly metadata: MessageMetadata;
  readonly timestamp: Date;
  readonly priority: number;
  readonly delay?: number; // 延迟执行时间（毫秒）
  readonly attempts: number;
  readonly maxAttempts: number;
}

/**
 * @interface MessageMetadata
 * @description 消息元数据
 */
export interface MessageMetadata {
  readonly userId?: string;
  readonly tenantId?: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly source: string;
  readonly version: string;
  readonly timestamp: Date;
  readonly retryCount: number;
  readonly originalTimestamp: Date;
}

/**
 * @interface QueueConfig
 * @description 队列配置
 */
export interface QueueConfig {
  readonly name: string;
  readonly concurrency: number;
  readonly retryAttempts: number;
  readonly retryDelay: number;
  readonly backoffMultiplier: number;
  readonly maxRetryDelay: number;
  readonly removeOnComplete: number;
  readonly removeOnFail: number;
  readonly delay: number;
  readonly priority: number;
}

/**
 * @interface JobOptions
 * @description 任务选项
 */
export interface JobOptions {
  readonly delay?: number;
  readonly priority?: number;
  readonly attempts?: number;
  readonly backoff?: {
    readonly type: 'fixed' | 'exponential';
    readonly delay: number;
  };
  readonly removeOnComplete?: number;
  readonly removeOnFail?: number;
}

/**
 * @interface IMessageQueue
 * @description
 * 消息队列接口，负责处理异步消息传递和事件分发。
 *
 * 消息队列职责：
 * 1. 发布和消费领域事件
 * 2. 处理异步任务队列
 * 3. 实现消息路由和分发
 * 4. 提供消息持久化和重试机制
 *
 * 消息类型：
 * 1. 领域事件：业务状态变更通知
 * 2. 集成事件：跨边界上下文通信
 * 3. 命令消息：异步命令处理
 * 4. 查询消息：异步查询处理
 *
 * 可靠性保证：
 * 1. 消息持久化存储
 * 2. 消息确认机制
 * 3. 失败重试策略
 * 4. 死信队列处理
 *
 * @example
 * ```typescript
 * const messageQueue = new MessageQueue(redisService, logger);
 * await messageQueue.publishEvent(userCreatedEvent);
 * ```
 * @since 1.0.0
 */
export interface IMessageQueue {
  /**
   * @method publishEvent
   * @description 发布领域事件到消息队列
   * @param {DomainEvent} event 领域事件
   * @param {JobOptions} [options] 任务选项
   * @returns {Promise<void>}
   * @throws {MessagePublishError} 当消息发布失败时抛出
   *
   * 发布流程：
   * 1. 序列化事件数据
   * 2. 生成消息ID和元数据
   * 3. 发送到消息队列
   * 4. 记录发布日志
   */
  publishEvent(event: DomainEvent, options?: JobOptions): Promise<void>;

  /**
   * @method publishCommand
   * @description 发布命令到消息队列
   * @param {any} command 命令对象
   * @param {JobOptions} [options] 任务选项
   * @returns {Promise<void>}
   * @throws {MessagePublishError} 当消息发布失败时抛出
   */
  publishCommand(command: any, options?: JobOptions): Promise<void>;

  /**
   * @method publishQuery
   * @description 发布查询到消息队列
   * @param {any} query 查询对象
   * @param {JobOptions} [options] 任务选项
   * @returns {Promise<void>}
   * @throws {MessagePublishError} 当消息发布失败时抛出
   */
  publishQuery(query: any, options?: JobOptions): Promise<void>;

  /**
   * @method publishIntegrationEvent
   * @description 发布集成事件到消息队列
   * @param {any} integrationEvent 集成事件
   * @param {JobOptions} [options] 任务选项
   * @returns {Promise<void>}
   * @throws {MessagePublishError} 当消息发布失败时抛出
   */
  publishIntegrationEvent(
    integrationEvent: any,
    options?: JobOptions,
  ): Promise<void>;

  /**
   * @method consumeEvents
   * @description 消费领域事件
   * @param {string} queueName 队列名称
   * @param {Function} processor 事件处理器函数
   * @returns {Promise<void>}
   *
   * 消费流程：
   * 1. 从队列获取消息
   * 2. 反序列化事件数据
   * 3. 调用事件处理器
   * 4. 处理消费结果
   */
  consumeEvents(
    queueName: string,
    processor: (event: DomainEvent) => Promise<void>,
  ): Promise<void>;

  /**
   * @method consumeCommands
   * @description 消费命令
   * @param {string} queueName 队列名称
   * @param {Function} processor 命令处理器函数
   * @returns {Promise<void>}
   */
  consumeCommands(
    queueName: string,
    processor: (command: any) => Promise<void>,
  ): Promise<void>;

  /**
   * @method consumeQueries
   * @description 消费查询
   * @param {string} queueName 队列名称
   * @param {Function} processor 查询处理器函数
   * @returns {Promise<void>}
   */
  consumeQueries(
    queueName: string,
    processor: (query: any) => Promise<void>,
  ): Promise<void>;

  /**
   * @method createQueue
   * @description 创建队列
   * @param {QueueConfig} config 队列配置
   * @returns {Promise<void>}
   */
  createQueue(config: QueueConfig): Promise<void>;

  /**
   * @method deleteQueue
   * @description 删除队列
   * @param {string} queueName 队列名称
   * @returns {Promise<void>}
   */
  deleteQueue(queueName: string): Promise<void>;

  /**
   * @method getQueueStatistics
   * @description 获取队列统计信息
   * @param {string} queueName 队列名称
   * @returns {Promise<QueueStatistics>} 统计信息
   */
  getQueueStatistics(queueName: string): Promise<QueueStatistics>;

  /**
   * @method pauseQueue
   * @description 暂停队列
   * @param {string} queueName 队列名称
   * @returns {Promise<void>}
   */
  pauseQueue(queueName: string): Promise<void>;

  /**
   * @method resumeQueue
   * @description 恢复队列
   * @param {string} queueName 队列名称
   * @returns {Promise<void>}
   */
  resumeQueue(queueName: string): Promise<void>;

  /**
   * @method clearQueue
   * @description 清空队列
   * @param {string} queueName 队列名称
   * @returns {Promise<void>}
   */
  clearQueue(queueName: string): Promise<void>;

  /**
   * @method retryFailedJobs
   * @description 重试失败的任务
   * @param {string} queueName 队列名称
   * @returns {Promise<number>} 重试的任务数量
   */
  retryFailedJobs(queueName: string): Promise<number>;

  /**
   * @method getFailedJobs
   * @description 获取失败的任务
   * @param {string} queueName 队列名称
   * @param {number} [limit=100] 限制数量
   * @returns {Promise<FailedJob[]>} 失败的任务列表
   */
  getFailedJobs(queueName: string, limit?: number): Promise<FailedJob[]>;

  /**
   * @method start
   * @description 启动消息队列
   * @returns {Promise<void>}
   */
  start(): Promise<void>;

  /**
   * @method stop
   * @description 停止消息队列
   * @returns {Promise<void>}
   */
  stop(): Promise<void>;

  /**
   * @method isRunning
   * @description 检查消息队列是否正在运行
   * @returns {boolean} 是否正在运行
   */
  isRunning(): boolean;
}

/**
 * @interface QueueStatistics
 * @description 队列统计信息
 */
export interface QueueStatistics {
  readonly name: string;
  readonly waiting: number;
  readonly active: number;
  readonly completed: number;
  readonly failed: number;
  readonly delayed: number;
  readonly paused: boolean;
  readonly concurrency: number;
  readonly averageProcessingTime: number; // 毫秒
  readonly throughput: number; // 每秒处理数量
}

/**
 * @interface FailedJob
 * @description 失败的任务
 */
export interface FailedJob {
  readonly id: string;
  readonly name: string;
  readonly data: any;
  readonly error: string;
  readonly stack: string;
  readonly failedAt: Date;
  readonly attempts: number;
  readonly maxAttempts: number;
}
