import { InMemoryMessageQueue } from '../domain/services/message-queue.service';
import { DomainEvent } from '../domain/domain-event';

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
 * @class CreateUserCommand
 * @description 创建用户命令示例
 */
class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly tenantId: string,
  ) {}
}

/**
 * @class GetUserQuery
 * @description 获取用户查询示例
 */
class GetUserQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
  ) {}
}

/**
 * @function demonstrateMessageQueueUsage
 * @description 演示消息队列使用
 * @returns {Promise<void>}
 */
export async function demonstrateMessageQueueUsage(): Promise<void> {
  console.log('=== 消息队列使用示例 ===\n');

  // 1. 创建消息队列
  const messageQueue = new InMemoryMessageQueue();

  // 2. 启动消息队列
  await messageQueue.start();
  console.log('消息队列已启动\n');

  // 3. 创建队列
  await messageQueue.createQueue({
    name: 'user-events',
    concurrency: 5,
    retryAttempts: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    maxRetryDelay: 10000,
    removeOnComplete: 10,
    removeOnFail: 5,
    delay: 0,
    priority: 1,
  });

  await messageQueue.createQueue({
    name: 'user-commands',
    concurrency: 3,
    retryAttempts: 2,
    retryDelay: 500,
    backoffMultiplier: 1.5,
    maxRetryDelay: 5000,
    removeOnComplete: 5,
    removeOnFail: 3,
    delay: 0,
    priority: 1,
  });

  console.log('队列创建完成\n');

  // 4. 发布领域事件
  const userCreatedEvent = new UserCreatedEvent(
    'user-123',
    'user-123',
    'john.doe@example.com',
    'John Doe',
  );

  console.log('发布用户创建事件...');
  await messageQueue.publishEvent(userCreatedEvent);
  console.log('用户创建事件已发布\n');

  // 5. 发布命令
  const createUserCommand = new CreateUserCommand(
    'jane.doe@example.com',
    'Jane Doe',
    'tenant-456',
  );

  console.log('发布创建用户命令...');
  await messageQueue.publishCommand(createUserCommand);
  console.log('创建用户命令已发布\n');

  // 6. 发布查询
  const getUserQuery = new GetUserQuery('user-789', 'tenant-789');

  console.log('发布获取用户查询...');
  await messageQueue.publishQuery(getUserQuery);
  console.log('获取用户查询已发布\n');

  // 7. 获取队列统计信息
  const eventStats = await messageQueue.getQueueStatistics('domain-events');
  console.log('领域事件队列统计信息:');
  console.log(`- 队列名称: ${eventStats.name}`);
  console.log(`- 等待处理: ${eventStats.waiting}`);
  console.log(`- 正在处理: ${eventStats.active}`);
  console.log(`- 失败任务: ${eventStats.failed}`);
  console.log(`- 延迟任务: ${eventStats.delayed}`);
  console.log(`- 并发数: ${eventStats.concurrency}\n`);

  const commandStats = await messageQueue.getQueueStatistics('commands');
  console.log('命令队列统计信息:');
  console.log(`- 队列名称: ${commandStats.name}`);
  console.log(`- 等待处理: ${commandStats.waiting}`);
  console.log(`- 正在处理: ${commandStats.active}`);
  console.log(`- 失败任务: ${commandStats.failed}`);
  console.log(`- 延迟任务: ${commandStats.delayed}`);
  console.log(`- 并发数: ${commandStats.concurrency}\n`);

  // 8. 演示延迟任务
  console.log('发布延迟任务...');
  await messageQueue.publishEvent(userCreatedEvent, {
    delay: 2000, // 延迟2秒
    priority: 1,
  });
  console.log('延迟任务已发布，将在2秒后执行\n');

  // 9. 等待一段时间让延迟任务执行
  console.log('等待延迟任务执行...');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // 10. 再次获取统计信息
  const updatedStats = await messageQueue.getQueueStatistics('domain-events');
  console.log('更新后的领域事件队列统计信息:');
  console.log(`- 等待处理: ${updatedStats.waiting}`);
  console.log(`- 延迟任务: ${updatedStats.delayed}\n`);

  // 11. 演示失败任务处理
  console.log('获取失败任务...');
  const failedJobs = await messageQueue.getFailedJobs('domain-events', 10);
  console.log(`失败任务数量: ${failedJobs.length}\n`);

  // 12. 演示重试失败任务
  if (failedJobs.length > 0) {
    console.log('重试失败任务...');
    const retryCount = await messageQueue.retryFailedJobs('domain-events');
    console.log(`重试了 ${retryCount} 个失败任务\n`);
  }

  // 13. 清空队列
  console.log('清空队列...');
  await messageQueue.clearQueue('domain-events');
  await messageQueue.clearQueue('commands');
  console.log('队列已清空\n');

  // 14. 停止消息队列
  await messageQueue.stop();
  console.log('消息队列已停止\n');

  console.log('=== 消息队列使用示例完成 ===');
}

/**
 * @function demonstrateMessageQueueErrorHandling
 * @description 演示消息队列错误处理
 * @returns {Promise<void>}
 */
export async function demonstrateMessageQueueErrorHandling(): Promise<void> {
  console.log('=== 消息队列错误处理示例 ===\n');

  const messageQueue = new InMemoryMessageQueue();
  await messageQueue.start();

  // 创建队列
  await messageQueue.createQueue({
    name: 'error-test',
    concurrency: 1,
    retryAttempts: 2,
    retryDelay: 500,
    backoffMultiplier: 2,
    maxRetryDelay: 2000,
    removeOnComplete: 5,
    removeOnFail: 3,
    delay: 0,
    priority: 1,
  });

  // 发布一个会失败的事件
  const failingEvent = new UserCreatedEvent(
    'user-error',
    'user-error',
    'error@example.com',
    'Error User',
  );

  console.log('发布会失败的事件...');
  await messageQueue.publishEvent(failingEvent);

  // 等待处理
  await new Promise(resolve => setTimeout(resolve, 2000));

  // 获取失败任务
  const failedJobs = await messageQueue.getFailedJobs('domain-events');
  console.log(`失败任务数量: ${failedJobs.length}`);

  if (failedJobs.length > 0) {
    console.log('失败任务详情:');
    failedJobs.forEach(job => {
      console.log(`- 任务ID: ${job.id}`);
      console.log(`- 错误信息: ${job.error}`);
      console.log(`- 尝试次数: ${job.attempts}/${job.maxAttempts}`);
      console.log(`- 失败时间: ${job.failedAt.toISOString()}\n`);
    });
  }

  await messageQueue.stop();
  console.log('=== 消息队列错误处理示例完成 ===');
}

/**
 * @function demonstrateMessageQueueConsumption
 * @description 演示消息队列消费
 * @returns {Promise<void>}
 */
export async function demonstrateMessageQueueConsumption(): Promise<void> {
  console.log('=== 消息队列消费示例 ===\n');

  const messageQueue = new InMemoryMessageQueue();
  await messageQueue.start();

  // 创建队列
  await messageQueue.createQueue({
    name: 'consumption-test',
    concurrency: 2,
    retryAttempts: 1,
    retryDelay: 1000,
    backoffMultiplier: 2,
    maxRetryDelay: 5000,
    removeOnComplete: 10,
    removeOnFail: 5,
    delay: 0,
    priority: 1,
  });

  // 设置事件处理器
  let processedEvents = 0;
  const eventProcessor = async (event: DomainEvent) => {
    processedEvents++;
    console.log(
      `处理事件: ${event.getEventType()}, 聚合ID: ${event.aggregateId}`,
    );
    await new Promise(resolve => setTimeout(resolve, 100)); // 模拟处理时间
  };

  // 设置命令处理器
  let processedCommands = 0;
  const commandProcessor = async (command: any) => {
    processedCommands++;
    console.log(`处理命令: ${command.constructor?.name || 'Unknown'}`);
    await new Promise(resolve => setTimeout(resolve, 150)); // 模拟处理时间
  };

  // 开始消费
  console.log('开始消费消息...');
  await messageQueue.consumeEvents('domain-events', eventProcessor);
  await messageQueue.consumeCommands('commands', commandProcessor);

  // 发布一些消息
  for (let i = 0; i < 5; i++) {
    const event = new UserCreatedEvent(
      `user-${i}`,
      `user-${i}`,
      `user${i}@example.com`,
      `User ${i}`,
    );
    await messageQueue.publishEvent(event);

    const command = new CreateUserCommand(
      `command${i}@example.com`,
      `Command User ${i}`,
      `tenant-${i}`,
    );
    await messageQueue.publishCommand(command);
  }

  console.log('已发布10个消息\n');

  // 等待处理完成
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log(
    `处理完成 - 事件: ${processedEvents}, 命令: ${processedCommands}\n`,
  );

  await messageQueue.stop();
  console.log('=== 消息队列消费示例完成 ===');
}

// 如果直接运行此文件，执行示例
// if (require.main === module) {
//   demonstrateMessageQueueUsage()
//     .then(() => demonstrateMessageQueueErrorHandling())
//     .then(() => demonstrateMessageQueueConsumption())
//     .catch(console.error);
// }
