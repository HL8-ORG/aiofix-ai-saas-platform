import { EventBusService } from '../domain/services/event-bus.service';
import { InMemoryEventStore } from '../domain/services/event-store.service';
import { BaseEventHandler } from '../domain/base/base-event-handler';
import { DomainEvent } from '../domain/domain-event';
import { IEventHandler } from '../domain/interfaces/event-handler.interface';

/**
 * @class UserCreatedEventHandler
 * @description 用户创建事件处理器示例
 */
class UserCreatedEventHandler extends BaseEventHandler {
  constructor() {
    super('UserCreatedEventHandler', 'UserCreated');
  }

  /**
   * @method processEvent
   * @description 处理用户创建事件
   * @param {DomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @protected
   */
  protected async processEvent(event: DomainEvent): Promise<void> {
    const eventData = event.toJSON();
    console.log(`Processing user created event:`, eventData);

    // 模拟业务逻辑处理
    await this.simulateBusinessLogic();

    console.log(`User created event processed successfully`);
  }

  /**
   * @method simulateBusinessLogic
   * @description 模拟业务逻辑处理
   * @returns {Promise<void>}
   * @private
   */
  private async simulateBusinessLogic(): Promise<void> {
    // 模拟异步处理
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * @class EmailNotificationHandler
 * @description 邮件通知处理器示例
 */
class EmailNotificationHandler extends BaseEventHandler {
  constructor() {
    super('EmailNotificationHandler', 'UserCreated');
  }

  /**
   * @method processEvent
   * @description 处理邮件通知事件
   * @param {DomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @protected
   */
  protected async processEvent(event: DomainEvent): Promise<void> {
    const eventData = event.toJSON();
    console.log(`Sending email notification:`, eventData);

    // 模拟邮件发送
    await this.simulateEmailSending();

    console.log(`Email notification sent successfully`);
  }

  /**
   * @method simulateEmailSending
   * @description 模拟邮件发送
   * @returns {Promise<void>}
   * @private
   */
  private async simulateEmailSending(): Promise<void> {
    // 模拟邮件发送延迟
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * @class UserCreatedEvent
 * @description 用户创建事件示例
 */
class UserCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly userId: string,
    public readonly email: string,
    public readonly name: string,
  ) {
    super(aggregateId, 1, {
      tenantId: 'tenant-123',
      userId: aggregateId,
      source: 'user-service',
    });
  }

  /**
   * @method getEventType
   * @description 获取事件类型
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return 'UserCreated';
  }

  /**
   * @method toJSON
   * @description 转换为JSON格式
   * @returns {Record<string, unknown>} JSON数据
   */
  toJSON(): Record<string, unknown> {
    return {
      ...super.getBaseEventData(),
      userId: this.userId,
      email: this.email,
      name: this.name,
    };
  }
}

/**
 * @function demonstrateEventBusUsage
 * @description 演示事件总线使用
 * @returns {Promise<void>}
 */
export async function demonstrateEventBusUsage(): Promise<void> {
  console.log('=== 事件总线使用示例 ===\n');

  // 1. 创建事件存储
  const eventStore = new InMemoryEventStore();

  // 2. 创建事件总线配置
  const eventBusConfig = {
    maxConcurrentHandlers: 10,
    defaultRetryPolicy: {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      maxRetryDelay: 10000,
    },
    enableDeadLetterQueue: true,
    deadLetterQueueRetentionDays: 7,
    enableEventOrdering: true,
    enableEventDeduplication: true,
  };

  // 3. 创建事件总线
  const eventBus = new EventBusService(eventStore, eventBusConfig);

  // 4. 启动事件总线
  await eventBus.start();
  console.log('事件总线已启动\n');

  // 5. 创建事件处理器
  const userCreatedHandler = new UserCreatedEventHandler();
  const emailNotificationHandler = new EmailNotificationHandler();

  // 6. 订阅事件
  const subscription1 = await eventBus.subscribe(
    'UserCreated',
    userCreatedHandler,
    1, // 高优先级
  );
  console.log(`订阅用户创建事件，订阅ID: ${subscription1}\n`);

  const subscription2 = await eventBus.subscribe(
    'UserCreated',
    emailNotificationHandler,
    2, // 低优先级
  );
  console.log(`订阅邮件通知事件，订阅ID: ${subscription2}\n`);

  // 7. 创建并发布事件
  const userCreatedEvent = new UserCreatedEvent(
    'user-123',
    'user-123',
    'john.doe@example.com',
    'John Doe',
  );

  console.log('发布用户创建事件...');
  await eventBus.publish(userCreatedEvent);
  console.log('用户创建事件已发布\n');

  // 8. 等待事件处理完成
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 9. 获取统计信息
  const statistics = await eventBus.getEventBusStatistics();
  console.log('事件总线统计信息:');
  console.log(`- 总发布事件数: ${statistics.totalEventsPublished}`);
  console.log(`- 总处理事件数: ${statistics.totalEventsProcessed}`);
  console.log(`- 总失败事件数: ${statistics.totalEventsFailed}`);
  console.log(`- 活跃订阅数: ${statistics.activeSubscriptions}`);
  console.log(`- 平均处理时间: ${statistics.averageProcessingTime}ms`);
  console.log(`- 每秒事件数: ${statistics.eventsPerSecond.toFixed(2)}`);
  console.log(`- 死信队列大小: ${statistics.deadLetterQueueSize}`);
  console.log(`- 重试队列大小: ${statistics.retryQueueSize}`);
  console.log(`- 运行时间: ${statistics.uptime}秒\n`);

  // 10. 获取订阅信息
  const subscriptions = await eventBus.getSubscriptions('UserCreated');
  console.log('用户创建事件订阅信息:');
  subscriptions.forEach(sub => {
    console.log(`- 订阅ID: ${sub.id}`);
    console.log(`- 处理器: ${sub.handler.constructor.name}`);
    console.log(`- 优先级: ${sub.priority}`);
    console.log(`- 创建时间: ${sub.createdAt.toISOString()}`);
    console.log(`- 是否活跃: ${sub.isActive}\n`);
  });

  // 11. 演示事件重放
  console.log('演示事件重放...');
  await eventBus.replayEvents('user-123', 0);
  console.log('事件重放完成\n');

  // 12. 取消订阅
  await eventBus.unsubscribe(subscription2);
  console.log(`已取消订阅: ${subscription2}\n`);

  // 13. 停止事件总线
  await eventBus.stop();
  console.log('事件总线已停止\n');

  console.log('=== 事件总线使用示例完成 ===');
}

/**
 * @function demonstrateEventBusErrorHandling
 * @description 演示事件总线错误处理
 * @returns {Promise<void>}
 */
export async function demonstrateEventBusErrorHandling(): Promise<void> {
  console.log('=== 事件总线错误处理示例 ===\n');

  // 创建会失败的事件处理器
  class FailingEventHandler extends BaseEventHandler {
    constructor() {
      super('FailingEventHandler', 'UserCreated');
    }

    protected async processEvent(_event: DomainEvent): Promise<void> {
      throw new Error('模拟处理失败');
    }
  }

  const eventStore = new InMemoryEventStore();
  const eventBusConfig = {
    maxConcurrentHandlers: 5,
    defaultRetryPolicy: {
      maxRetries: 2,
      retryDelay: 500,
      backoffMultiplier: 2,
      maxRetryDelay: 5000,
    },
    enableDeadLetterQueue: true,
    deadLetterQueueRetentionDays: 7,
    enableEventOrdering: true,
    enableEventDeduplication: true,
  };

  const eventBus = new EventBusService(eventStore, eventBusConfig);
  await eventBus.start();

  // 订阅失败处理器
  const failingHandler = new FailingEventHandler();
  await eventBus.subscribe('UserCreated', failingHandler);

  // 发布事件
  const userCreatedEvent = new UserCreatedEvent(
    'user-456',
    'user-456',
    'jane.doe@example.com',
    'Jane Doe',
  );

  console.log('发布会失败的事件...');
  await eventBus.publish(userCreatedEvent);

  // 等待重试和死信队列处理
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 获取统计信息
  const statistics = await eventBus.getEventBusStatistics();
  console.log('错误处理统计信息:');
  console.log(`- 总失败事件数: ${statistics.totalEventsFailed}`);
  console.log(`- 死信队列大小: ${statistics.deadLetterQueueSize}`);
  console.log(`- 重试队列大小: ${statistics.retryQueueSize}\n`);

  await eventBus.stop();
  console.log('=== 事件总线错误处理示例完成 ===');
}

// 如果直接运行此文件，执行示例
// if (require.main === module) {
//   demonstrateEventBusUsage()
//     .then(() => demonstrateEventBusErrorHandling())
//     .catch(console.error);
// }
