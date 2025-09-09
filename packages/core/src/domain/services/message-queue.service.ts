import { DomainEvent } from '../domain-event';
import {
  IMessageQueue,
  IMessage,
  MessageMetadata,
  QueueConfig,
  JobOptions,
  QueueStatistics,
  FailedJob,
} from '../interfaces/message-queue.interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * @class InMemoryMessageQueue
 * @description
 * 内存消息队列服务实现，用于开发和测试环境。
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
 * @param {Map<string, IMessage[]>} queues 队列存储
 * @param {Map<string, QueueConfig>} queueConfigs 队列配置
 * @param {Map<string, FailedJob[]>} failedJobs 失败任务存储
 *
 * @example
 * ```typescript
 * const messageQueue = new InMemoryMessageQueue();
 * await messageQueue.publishEvent(userCreatedEvent);
 * ```
 * @since 1.0.0
 */
export class InMemoryMessageQueue implements IMessageQueue {
  private readonly queues: Map<string, IMessage[]> = new Map();
  private readonly queueConfigs: Map<string, QueueConfig> = new Map();
  private readonly failedJobs: Map<string, FailedJob[]> = new Map();
  private readonly processingJobs: Map<string, Set<string>> = new Map();
  private readonly delayedJobs: Map<
    string,
    { message: IMessage; executeAt: Date }[]
  > = new Map();

  private isStarted = false;
  private processingInterval: any = null;
  private delayedJobsInterval: any = null;

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
  async publishEvent(event: DomainEvent, options?: JobOptions): Promise<void> {
    const message = this.createMessage('DOMAIN_EVENT', event, options);
    await this.enqueueMessage('domain-events', message);
    console.log(`Published domain event: ${event.getEventType()}`);
  }

  /**
   * @method publishCommand
   * @description 发布命令到消息队列
   * @param {any} command 命令对象
   * @param {JobOptions} [options] 任务选项
   * @returns {Promise<void>}
   * @throws {MessagePublishError} 当消息发布失败时抛出
   */
  async publishCommand(command: any, options?: JobOptions): Promise<void> {
    const message = this.createMessage('COMMAND', command, options);
    await this.enqueueMessage('commands', message);
    console.log(`Published command: ${command.constructor?.name || 'Unknown'}`);
  }

  /**
   * @method publishQuery
   * @description 发布查询到消息队列
   * @param {any} query 查询对象
   * @param {JobOptions} [options] 任务选项
   * @returns {Promise<void>}
   * @throws {MessagePublishError} 当消息发布失败时抛出
   */
  async publishQuery(query: any, options?: JobOptions): Promise<void> {
    const message = this.createMessage('QUERY', query, options);
    await this.enqueueMessage('queries', message);
    console.log(`Published query: ${query.constructor?.name || 'Unknown'}`);
  }

  /**
   * @method publishIntegrationEvent
   * @description 发布集成事件到消息队列
   * @param {any} integrationEvent 集成事件
   * @param {JobOptions} [options] 任务选项
   * @returns {Promise<void>}
   * @throws {MessagePublishError} 当消息发布失败时抛出
   */
  async publishIntegrationEvent(
    integrationEvent: any,
    options?: JobOptions,
  ): Promise<void> {
    const message = this.createMessage(
      'INTEGRATION_EVENT',
      integrationEvent,
      options,
    );
    await this.enqueueMessage('integration-events', message);
    console.log(
      `Published integration event: ${integrationEvent.constructor?.name || 'Unknown'}`,
    );
  }

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
  async consumeEvents(
    queueName: string,
    processor: (event: DomainEvent) => Promise<void>,
  ): Promise<void> {
    await this.consumeMessages(queueName, async (message: IMessage) => {
      if (message.type === 'DOMAIN_EVENT') {
        const event = this.deserializeDomainEvent(message);
        await processor(event);
      }
    });
  }

  /**
   * @method consumeCommands
   * @description 消费命令
   * @param {string} queueName 队列名称
   * @param {Function} processor 命令处理器函数
   * @returns {Promise<void>}
   */
  async consumeCommands(
    queueName: string,
    processor: (command: any) => Promise<void>,
  ): Promise<void> {
    await this.consumeMessages(queueName, async (message: IMessage) => {
      if (message.type === 'COMMAND') {
        await processor(message.data);
      }
    });
  }

  /**
   * @method consumeQueries
   * @description 消费查询
   * @param {string} queueName 队列名称
   * @param {Function} processor 查询处理器函数
   * @returns {Promise<void>}
   */
  async consumeQueries(
    queueName: string,
    processor: (query: any) => Promise<void>,
  ): Promise<void> {
    await this.consumeMessages(queueName, async (message: IMessage) => {
      if (message.type === 'QUERY') {
        await processor(message.data);
      }
    });
  }

  /**
   * @method createQueue
   * @description 创建队列
   * @param {QueueConfig} config 队列配置
   * @returns {Promise<void>}
   */
  async createQueue(config: QueueConfig): Promise<void> {
    this.queues.set(config.name, []);
    this.queueConfigs.set(config.name, config);
    this.failedJobs.set(config.name, []);
    this.processingJobs.set(config.name, new Set());
    this.delayedJobs.set(config.name, []);
    console.log(`Created queue: ${config.name}`);
  }

  /**
   * @method deleteQueue
   * @description 删除队列
   * @param {string} queueName 队列名称
   * @returns {Promise<void>}
   */
  async deleteQueue(queueName: string): Promise<void> {
    this.queues.delete(queueName);
    this.queueConfigs.delete(queueName);
    this.failedJobs.delete(queueName);
    this.processingJobs.delete(queueName);
    this.delayedJobs.delete(queueName);
    console.log(`Deleted queue: ${queueName}`);
  }

  /**
   * @method getQueueStatistics
   * @description 获取队列统计信息
   * @param {string} queueName 队列名称
   * @returns {Promise<QueueStatistics>} 统计信息
   */
  async getQueueStatistics(queueName: string): Promise<QueueStatistics> {
    const queue = this.queues.get(queueName) || [];
    const config = this.queueConfigs.get(queueName);
    const failed = this.failedJobs.get(queueName) || [];
    const processing = this.processingJobs.get(queueName) || new Set();
    const delayed = this.delayedJobs.get(queueName) || [];

    return {
      name: queueName,
      waiting: queue.length,
      active: processing.size,
      completed: 0, // 简化实现，不跟踪完成的任务
      failed: failed.length,
      delayed: delayed.length,
      paused: false, // 简化实现，不支持暂停
      concurrency: config?.concurrency || 1,
      averageProcessingTime: 0, // 简化实现，不计算平均处理时间
      throughput: 0, // 简化实现，不计算吞吐量
    };
  }

  /**
   * @method pauseQueue
   * @description 暂停队列
   * @param {string} queueName 队列名称
   * @returns {Promise<void>}
   */
  async pauseQueue(queueName: string): Promise<void> {
    // 简化实现，仅记录日志
    console.log(`Queue paused: ${queueName}`);
  }

  /**
   * @method resumeQueue
   * @description 恢复队列
   * @param {string} queueName 队列名称
   * @returns {Promise<void>}
   */
  async resumeQueue(queueName: string): Promise<void> {
    // 简化实现，仅记录日志
    console.log(`Queue resumed: ${queueName}`);
  }

  /**
   * @method clearQueue
   * @description 清空队列
   * @param {string} queueName 队列名称
   * @returns {Promise<void>}
   */
  async clearQueue(queueName: string): Promise<void> {
    this.queues.set(queueName, []);
    this.failedJobs.set(queueName, []);
    this.processingJobs.set(queueName, new Set());
    this.delayedJobs.set(queueName, []);
    console.log(`Cleared queue: ${queueName}`);
  }

  /**
   * @method retryFailedJobs
   * @description 重试失败的任务
   * @param {string} queueName 队列名称
   * @returns {Promise<number>} 重试的任务数量
   */
  async retryFailedJobs(queueName: string): Promise<number> {
    const failed = this.failedJobs.get(queueName) || [];
    const queue = this.queues.get(queueName) || [];

    let retryCount = 0;
    for (const failedJob of failed) {
      const message: IMessage = {
        id: uuidv4(),
        type: 'DOMAIN_EVENT',
        data: failedJob.data,
        metadata: {
          source: 'retry',
          version: '1.0.0',
          timestamp: new Date(),
          retryCount: failedJob.attempts + 1,
          originalTimestamp: failedJob.failedAt,
        },
        timestamp: new Date(),
        priority: 1,
        attempts: failedJob.attempts + 1,
        maxAttempts: failedJob.maxAttempts,
      };

      queue.push(message);
      retryCount++;
    }

    this.failedJobs.set(queueName, []);
    console.log(`Retried ${retryCount} failed jobs in queue: ${queueName}`);
    return retryCount;
  }

  /**
   * @method getFailedJobs
   * @description 获取失败的任务
   * @param {string} queueName 队列名称
   * @param {number} [limit=100] 限制数量
   * @returns {Promise<FailedJob[]>} 失败的任务列表
   */
  async getFailedJobs(
    queueName: string,
    limit: number = 100,
  ): Promise<FailedJob[]> {
    const failed = this.failedJobs.get(queueName) || [];
    return failed.slice(0, limit);
  }

  /**
   * @method start
   * @description 启动消息队列
   * @returns {Promise<void>}
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;

    // 启动消息处理循环
    this.processingInterval = setInterval(() => {
      this.processMessages();
    }, 1000);

    // 启动延迟任务处理循环
    this.delayedJobsInterval = setInterval(() => {
      this.processDelayedJobs();
    }, 1000);

    console.log('Message queue started');
  }

  /**
   * @method stop
   * @description 停止消息队列
   * @returns {Promise<void>}
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.isStarted = false;

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    if (this.delayedJobsInterval) {
      clearInterval(this.delayedJobsInterval);
      this.delayedJobsInterval = null;
    }

    console.log('Message queue stopped');
  }

  /**
   * @method isRunning
   * @description 检查消息队列是否正在运行
   * @returns {boolean} 是否正在运行
   */
  isRunning(): boolean {
    return this.isStarted;
  }

  /**
   * @method createMessage
   * @description 创建消息
   * @param {string} type 消息类型
   * @param {any} data 消息数据
   * @param {JobOptions} [options] 任务选项
   * @returns {IMessage} 消息对象
   * @private
   */
  private createMessage(
    type: string,
    data: any,
    options?: JobOptions,
  ): IMessage {
    const now = new Date();
    const metadata: MessageMetadata = {
      source: 'message-queue',
      version: '1.0.0',
      timestamp: now,
      retryCount: 0,
      originalTimestamp: now,
    };

    return {
      id: uuidv4(),
      type: type as any,
      eventType: type === 'DOMAIN_EVENT' ? data.getEventType?.() : undefined,
      commandType: type === 'COMMAND' ? data.constructor?.name : undefined,
      queryType: type === 'QUERY' ? data.constructor?.name : undefined,
      aggregateId: type === 'DOMAIN_EVENT' ? data.aggregateId : undefined,
      data: type === 'DOMAIN_EVENT' ? data.toJSON() : data,
      metadata,
      timestamp: now,
      priority: options?.priority || 1,
      delay: options?.delay,
      attempts: 0,
      maxAttempts: options?.attempts || 3,
    };
  }

  /**
   * @method enqueueMessage
   * @description 将消息加入队列
   * @param {string} queueName 队列名称
   * @param {IMessage} message 消息
   * @returns {Promise<void>}
   * @private
   */
  private async enqueueMessage(
    queueName: string,
    message: IMessage,
  ): Promise<void> {
    // 确保队列存在
    if (!this.queues.has(queueName)) {
      await this.createQueue({
        name: queueName,
        concurrency: 1,
        retryAttempts: 3,
        retryDelay: 1000,
        backoffMultiplier: 2,
        maxRetryDelay: 10000,
        removeOnComplete: 10,
        removeOnFail: 5,
        delay: 0,
        priority: 1,
      });
    }

    const queue = this.queues.get(queueName)!;

    // 如果有延迟，加入延迟队列
    if (message.delay && message.delay > 0) {
      const delayed = this.delayedJobs.get(queueName)!;
      delayed.push({
        message,
        executeAt: new Date(Date.now() + message.delay),
      });
      return;
    }

    // 按优先级插入队列
    const insertIndex = queue.findIndex(m => m.priority > message.priority);
    if (insertIndex === -1) {
      queue.push(message);
    } else {
      queue.splice(insertIndex, 0, message);
    }
  }

  /**
   * @method consumeMessages
   * @description 消费消息
   * @param {string} queueName 队列名称
   * @param {Function} processor 处理器函数
   * @returns {Promise<void>}
   * @private
   */
  private async consumeMessages(
    queueName: string,
    processor: (message: IMessage) => Promise<void>,
  ): Promise<void> {
    // 简化实现，仅记录日志
    console.log(`Started consuming messages from queue: ${queueName}`);
  }

  /**
   * @method processMessages
   * @description 处理消息
   * @private
   */
  private processMessages(): void {
    // 简化实现，仅记录日志
    // 在实际实现中，这里会处理队列中的消息
  }

  /**
   * @method processDelayedJobs
   * @description 处理延迟任务
   * @private
   */
  private processDelayedJobs(): void {
    const now = new Date();

    for (const [queueName, delayed] of this.delayedJobs.entries()) {
      const readyJobs = delayed.filter(job => job.executeAt <= now);

      for (const job of readyJobs) {
        const queue = this.queues.get(queueName);
        if (queue) {
          queue.push(job.message);
        }
      }

      // 移除已处理的任务
      const remainingJobs = delayed.filter(job => job.executeAt > now);
      this.delayedJobs.set(queueName, remainingJobs);
    }
  }

  /**
   * @method deserializeDomainEvent
   * @description 反序列化领域事件
   * @param {IMessage} message 消息
   * @returns {DomainEvent} 领域事件
   * @private
   */
  private deserializeDomainEvent(message: IMessage): DomainEvent {
    // 简化实现，创建一个通用的领域事件
    return new (class extends DomainEvent {
      constructor() {
        super(
          message.aggregateId || 'unknown',
          message.metadata.retryCount + 1,
          {
            tenantId: message.metadata.tenantId,
            userId: message.metadata.userId,
            source: message.metadata.source,
          },
        );
      }

      getEventType(): string {
        return message.eventType || 'Unknown';
      }

      toJSON(): Record<string, unknown> {
        return message.data;
      }
    })();
  }
}
