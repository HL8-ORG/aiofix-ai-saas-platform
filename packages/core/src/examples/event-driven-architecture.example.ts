import { EventBusService } from '../domain/services/event-bus.service';
import { InMemoryEventStore } from '../domain/services/event-store.service';
import { InMemoryMessageQueue } from '../domain/services/message-queue.service';
import { EventProcessorService } from '../domain/services/event-processor.service';
import { BaseEventHandler } from '../domain/base/base-event-handler';
import { DomainEvent } from '../domain/domain-event';
import { EventSourcedAggregateRoot } from '../domain/base/event-sourced-aggregate-root';

/**
 * @class UserAggregate
 * @description 用户聚合根示例
 */
class UserAggregate extends EventSourcedAggregateRoot {
  private _email: string = '';
  private _name: string = '';
  private _status: 'ACTIVE' | 'INACTIVE' | 'PENDING' = 'PENDING';

  constructor(private readonly id: string) {
    super();
  }

  /**
   * @method createUser
   * @description 创建用户
   * @param {string} email 邮箱
   * @param {string} name 姓名
   * @returns {void}
   */
  createUser(email: string, name: string): void {
    if (this._email) {
      throw new Error('用户已存在');
    }

    this._email = email;
    this._name = name;
    this._status = 'ACTIVE';

    this.addDomainEvent(new UserCreatedEvent(this.id, email, name));
  }

  /**
   * @method updateEmail
   * @description 更新邮箱
   * @param {string} newEmail 新邮箱
   * @returns {void}
   */
  updateEmail(newEmail: string): void {
    if (this._email === newEmail) {
      return;
    }

    const oldEmail = this._email;
    this._email = newEmail;

    this.addDomainEvent(new UserEmailUpdatedEvent(this.id, oldEmail, newEmail));
  }

  /**
   * @method deactivate
   * @description 停用用户
   * @returns {void}
   */
  deactivate(): void {
    if (this._status === 'INACTIVE') {
      return;
    }

    this._status = 'INACTIVE';
    this.addDomainEvent(new UserDeactivatedEvent(this.id));
  }

  /**
   * @method getEmail
   * @description 获取邮箱
   * @returns {string} 邮箱
   */
  getEmail(): string {
    return this._email;
  }

  /**
   * @method getName
   * @description 获取姓名
   * @returns {string} 姓名
   */
  getName(): string {
    return this._name;
  }

  /**
   * @method getStatus
   * @description 获取状态
   * @returns {string} 状态
   */
  getStatus(): string {
    return this._status;
  }
}

/**
 * @class UserCreatedEvent
 * @description 用户创建事件
 */
class UserCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly name: string,
  ) {
    super(aggregateId, 1, {
      tenantId: 'tenant-123',
      userId: aggregateId,
      source: 'user-service',
    });
  }

  getEventType(): string {
    return 'UserCreated';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.getBaseEventData(),
      email: this.email,
      name: this.name,
    };
  }
}

/**
 * @class UserEmailUpdatedEvent
 * @description 用户邮箱更新事件
 */
class UserEmailUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly oldEmail: string,
    public readonly newEmail: string,
  ) {
    super(aggregateId, 1, {
      tenantId: 'tenant-123',
      userId: aggregateId,
      source: 'user-service',
    });
  }

  getEventType(): string {
    return 'UserEmailUpdated';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.getBaseEventData(),
      oldEmail: this.oldEmail,
      newEmail: this.newEmail,
    };
  }
}

/**
 * @class UserDeactivatedEvent
 * @description 用户停用事件
 */
class UserDeactivatedEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId, 1, {
      tenantId: 'tenant-123',
      userId: aggregateId,
      source: 'user-service',
    });
  }

  getEventType(): string {
    return 'UserDeactivated';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.getBaseEventData(),
    };
  }
}

/**
 * @class UserCreatedEventHandler
 * @description 用户创建事件处理器
 */
class UserCreatedEventHandler extends BaseEventHandler {
  constructor() {
    super('UserCreatedEventHandler', 'UserCreated');
  }

  protected async processEvent(event: DomainEvent): Promise<void> {
    const eventData = event.toJSON();
    console.log(`[用户创建处理器] 处理用户创建事件:`, eventData);

    // 模拟发送欢迎邮件
    await this.sendWelcomeEmail(
      eventData.email as string,
      eventData.name as string,
    );

    // 模拟创建用户权限
    await this.createUserPermissions(event.aggregateId);

    console.log(`[用户创建处理器] 用户创建事件处理完成`);
  }

  private async sendWelcomeEmail(email: string, name: string): Promise<void> {
    console.log(`[邮件服务] 发送欢迎邮件给 ${name} (${email})`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async createUserPermissions(userId: string): Promise<void> {
    console.log(`[权限服务] 为用户 ${userId} 创建默认权限`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

/**
 * @class UserEmailUpdatedEventHandler
 * @description 用户邮箱更新事件处理器
 */
class UserEmailUpdatedEventHandler extends BaseEventHandler {
  constructor() {
    super('UserEmailUpdatedEventHandler', 'UserEmailUpdated');
  }

  protected async processEvent(event: DomainEvent): Promise<void> {
    const eventData = event.toJSON();
    console.log(`[邮箱更新处理器] 处理邮箱更新事件:`, eventData);

    // 模拟发送邮箱变更通知
    await this.sendEmailChangeNotification(
      eventData.oldEmail as string,
      eventData.newEmail as string,
    );

    console.log(`[邮箱更新处理器] 邮箱更新事件处理完成`);
  }

  private async sendEmailChangeNotification(
    oldEmail: string,
    newEmail: string,
  ): Promise<void> {
    console.log(`[邮件服务] 发送邮箱变更通知: ${oldEmail} -> ${newEmail}`);
    await new Promise(resolve => setTimeout(resolve, 80));
  }
}

/**
 * @class UserDeactivatedEventHandler
 * @description 用户停用事件处理器
 */
class UserDeactivatedEventHandler extends BaseEventHandler {
  constructor() {
    super('UserDeactivatedEventHandler', 'UserDeactivated');
  }

  protected async processEvent(event: DomainEvent): Promise<void> {
    const eventData = event.toJSON();
    console.log(`[用户停用处理器] 处理用户停用事件:`, eventData);

    // 模拟撤销用户权限
    await this.revokeUserPermissions(event.aggregateId);

    // 模拟发送停用通知
    await this.sendDeactivationNotification(event.aggregateId);

    console.log(`[用户停用处理器] 用户停用事件处理完成`);
  }

  private async revokeUserPermissions(userId: string): Promise<void> {
    console.log(`[权限服务] 撤销用户 ${userId} 的所有权限`);
    await new Promise(resolve => setTimeout(resolve, 60));
  }

  private async sendDeactivationNotification(userId: string): Promise<void> {
    console.log(`[通知服务] 发送用户停用通知给 ${userId}`);
    await new Promise(resolve => setTimeout(resolve, 40));
  }
}

/**
 * @function demonstrateEventDrivenArchitecture
 * @description 演示完整的事件驱动架构
 * @returns {Promise<void>}
 */
export async function demonstrateEventDrivenArchitecture(): Promise<void> {
  console.log('=== 事件驱动架构完整示例 ===\n');

  // 1. 创建基础设施组件
  const eventStore = new InMemoryEventStore();
  const messageQueue = new InMemoryMessageQueue();
  const _eventProcessor = new EventProcessorService();

  // 2. 创建事件总线配置
  const eventBusConfig = {
    maxConcurrentHandlers: 5,
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

  // 4. 启动服务
  await eventBus.start();
  await messageQueue.start();
  console.log('所有服务已启动\n');

  // 5. 注册事件处理器
  const userCreatedHandler = new UserCreatedEventHandler();
  const userEmailUpdatedHandler = new UserEmailUpdatedEventHandler();
  const userDeactivatedHandler = new UserDeactivatedEventHandler();

  await eventBus.subscribe('UserCreated', userCreatedHandler, 1);
  await eventBus.subscribe('UserEmailUpdated', userEmailUpdatedHandler, 1);
  await eventBus.subscribe('UserDeactivated', userDeactivatedHandler, 1);

  console.log('事件处理器已注册\n');

  // 6. 创建用户聚合根
  const userAggregate = new UserAggregate('user-123');
  console.log('用户聚合根已创建\n');

  // 7. 执行业务操作 - 创建用户
  console.log('=== 执行业务操作：创建用户 ===');
  userAggregate.createUser('john.doe@example.com', 'John Doe');
  console.log(
    `用户已创建: ${userAggregate.getName()} (${userAggregate.getEmail()})`,
  );
  console.log(`用户状态: ${userAggregate.getStatus()}\n`);

  // 8. 发布事件
  console.log('=== 发布领域事件 ===');
  const uncommittedEvents = userAggregate.getDomainEvents();
  await eventBus.publishAll(uncommittedEvents);
  userAggregate.markEventsAsCommitted();
  console.log(`已发布 ${uncommittedEvents.length} 个事件\n`);

  // 9. 等待事件处理完成
  console.log('=== 等待事件处理完成 ===');
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 10. 执行业务操作 - 更新邮箱
  console.log('=== 执行业务操作：更新邮箱 ===');
  userAggregate.updateEmail('john.smith@example.com');
  console.log(`用户邮箱已更新: ${userAggregate.getEmail()}\n`);

  // 11. 发布更新事件
  console.log('=== 发布邮箱更新事件 ===');
  const updateEvents = userAggregate.getDomainEvents();
  await eventBus.publishAll(updateEvents);
  userAggregate.markEventsAsCommitted();
  console.log(`已发布 ${updateEvents.length} 个事件\n`);

  // 12. 等待事件处理完成
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 13. 执行业务操作 - 停用用户
  console.log('=== 执行业务操作：停用用户 ===');
  userAggregate.deactivate();
  console.log(`用户状态已更新: ${userAggregate.getStatus()}\n`);

  // 14. 发布停用事件
  console.log('=== 发布用户停用事件 ===');
  const deactivateEvents = userAggregate.getDomainEvents();
  await eventBus.publishAll(deactivateEvents);
  userAggregate.markEventsAsCommitted();
  console.log(`已发布 ${deactivateEvents.length} 个事件\n`);

  // 15. 等待事件处理完成
  await new Promise(resolve => setTimeout(resolve, 1000));

  // 16. 获取统计信息
  console.log('=== 获取统计信息 ===');
  const eventBusStats = await eventBus.getEventBusStatistics();
  console.log('事件总线统计信息:');
  console.log(`- 总发布事件数: ${eventBusStats.totalEventsPublished}`);
  console.log(`- 总处理事件数: ${eventBusStats.totalEventsProcessed}`);
  console.log(`- 总失败事件数: ${eventBusStats.totalEventsFailed}`);
  console.log(`- 活跃订阅数: ${eventBusStats.activeSubscriptions}`);
  console.log(`- 平均处理时间: ${eventBusStats.averageProcessingTime}ms`);
  console.log(`- 每秒事件数: ${eventBusStats.eventsPerSecond.toFixed(2)}`);
  console.log(`- 死信队列大小: ${eventBusStats.deadLetterQueueSize}`);
  console.log(`- 重试队列大小: ${eventBusStats.retryQueueSize}`);
  console.log(`- 运行时间: ${eventBusStats.uptime}秒\n`);

  // 17. 演示事件重放
  console.log('=== 演示事件重放 ===');
  await eventBus.replayEvents('user-123', 0);
  console.log('事件重放完成\n');

  // 18. 获取事件存储统计信息
  const eventStoreStats = await eventStore.getStatistics();
  console.log('事件存储统计信息:');
  console.log(`- 总事件数: ${eventStoreStats.totalEvents}`);
  console.log(`- 总聚合根数: ${eventStoreStats.totalAggregates}`);
  console.log(`- 按事件类型统计:`, eventStoreStats.eventsByType);
  console.log(`- 按租户统计:`, eventStoreStats.eventsByTenant);
  console.log(
    `- 平均每聚合根事件数: ${eventStoreStats.averageEventsPerAggregate.toFixed(2)}\n`,
  );

  // 19. 停止服务
  await eventBus.stop();
  await messageQueue.stop();
  console.log('所有服务已停止\n');

  console.log('=== 事件驱动架构完整示例完成 ===');
}

/**
 * @function demonstrateEventSourcing
 * @description 演示事件溯源
 * @returns {Promise<void>}
 */
export async function demonstrateEventSourcing(): Promise<void> {
  console.log('=== 事件溯源示例 ===\n');

  const eventStore = new InMemoryEventStore();

  // 创建用户聚合根
  const userAggregate = new UserAggregate('user-456');

  // 执行业务操作
  userAggregate.createUser('jane.doe@example.com', 'Jane Doe');
  userAggregate.updateEmail('jane.smith@example.com');
  userAggregate.deactivate();

  // 保存事件到事件存储
  const events = userAggregate.getDomainEvents();
  await eventStore.saveEvents('user-456', events, 0);
  userAggregate.markEventsAsCommitted();

  console.log(`已保存 ${events.length} 个事件到事件存储\n`);

  // 从事件存储重建聚合根
  console.log('=== 从事件存储重建聚合根 ===');
  const replayedEvents = await eventStore.getEvents('user-456', 0);
  console.log(`从事件存储获取了 ${replayedEvents.length} 个事件`);

  // 创建新的聚合根实例并应用事件
  const _rebuiltUser = new UserAggregate('user-456');
  for (const event of replayedEvents) {
    // 在实际实现中，这里会调用聚合根的apply方法
    console.log(`应用事件: ${event.getEventType()}`);
  }

  console.log('聚合根重建完成\n');

  // 获取事件流
  console.log('=== 获取事件流 ===');
  const eventStream = await eventStore.getEventStream('user-456', 0, 10);
  console.log(`事件流信息:`);
  console.log(`- 聚合根ID: ${eventStream.aggregateId}`);
  console.log(`- 事件数量: ${eventStream.events.length}`);
  console.log(
    `- 版本范围: ${eventStream.fromVersion} - ${eventStream.toVersion}`,
  );
  console.log(`- 是否有更多: ${eventStream.hasMore}\n`);

  console.log('=== 事件溯源示例完成 ===');
}

// 如果直接运行此文件，执行示例
// if (require.main === module) {
//   demonstrateEventDrivenArchitecture()
//     .then(() => demonstrateEventSourcing())
//     .catch(console.error);
// }
