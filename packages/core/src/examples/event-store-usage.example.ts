import { DomainEvent } from '../domain/domain-event';
import { InMemoryEventStore } from '../domain/services/event-store.service';

/**
 * @class UserCreatedEvent
 * @description 用户创建事件示例
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string,
  ) {
    super(userId, 1, {
      tenantId,
      source: 'user-management',
    });
  }

  getEventType(): string {
    return 'UserCreated';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.getBaseEventData(),
      userId: this.userId,
      email: this.email,
      tenantId: this.tenantId,
    };
  }
}

/**
 * @class UserUpdatedEvent
 * @description 用户更新事件示例
 */
export class UserUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly updateData: Record<string, unknown>,
    public readonly tenantId: string,
  ) {
    super(userId, 1, {
      tenantId,
      source: 'user-management',
    });
  }

  getEventType(): string {
    return 'UserUpdated';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.getBaseEventData(),
      userId: this.userId,
      updateData: this.updateData,
      tenantId: this.tenantId,
    };
  }
}

/**
 * @class EventStoreUsageExample
 * @description 事件存储使用示例，展示如何使用事件存储服务
 *
 * 示例功能：
 * 1. 保存用户相关事件
 * 2. 检索用户事件历史
 * 3. 查询特定类型的事件
 * 4. 获取事件存储统计信息
 * 5. 演示版本控制和并发控制
 *
 * @example
 * ```typescript
 * const example = new EventStoreUsageExample();
 * await example.runExample();
 * ```
 * @since 1.0.0
 */
export class EventStoreUsageExample {
  private eventStore: InMemoryEventStore;

  constructor() {
    this.eventStore = new InMemoryEventStore();
  }

  /**
   * @method runExample
   * @description 运行完整的事件存储使用示例
   * @returns {Promise<void>}
   */
  async runExample(): Promise<void> {
    console.log('🚀 开始事件存储使用示例...\n');

    try {
      // 1. 保存用户创建事件
      await this.saveUserCreatedEvent();

      // 2. 保存用户更新事件
      await this.saveUserUpdatedEvent();

      // 3. 检索用户事件历史
      await this.retrieveUserEventHistory();

      // 4. 查询特定类型的事件
      await this.queryEventsByType();

      // 5. 查询租户事件
      await this.queryEventsByTenant();

      // 6. 获取事件存储统计
      await this.getEventStoreStatistics();

      // 7. 演示版本控制
      await this.demonstrateVersionControl();

      console.log('\n✅ 事件存储使用示例完成！');
    } catch (error) {
      console.error('❌ 示例执行失败:', error);
      throw error;
    }
  }

  /**
   * @method saveUserCreatedEvent
   * @description 保存用户创建事件
   * @returns {Promise<void>}
   * @private
   */
  private async saveUserCreatedEvent(): Promise<void> {
    console.log('📝 保存用户创建事件...');

    const userId = 'user-123';
    const userCreatedEvent = new UserCreatedEvent(
      userId,
      'user@example.com',
      'tenant-456',
    );

    await this.eventStore.saveEvents(userId, [userCreatedEvent], 0);
    console.log(`✅ 用户创建事件已保存: ${userId}\n`);
  }

  /**
   * @method saveUserUpdatedEvent
   * @description 保存用户更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async saveUserUpdatedEvent(): Promise<void> {
    console.log('📝 保存用户更新事件...');

    const userId = 'user-123';
    const userUpdatedEvent = new UserUpdatedEvent(
      userId,
      { firstName: 'John', lastName: 'Doe' },
      'tenant-456',
    );

    await this.eventStore.saveEvents(userId, [userUpdatedEvent], 1);
    console.log(`✅ 用户更新事件已保存: ${userId}\n`);
  }

  /**
   * @method retrieveUserEventHistory
   * @description 检索用户事件历史
   * @returns {Promise<void>}
   * @private
   */
  private async retrieveUserEventHistory(): Promise<void> {
    console.log('🔍 检索用户事件历史...');

    const userId = 'user-123';
    const events = await this.eventStore.getEvents(userId);

    console.log(`📊 用户 ${userId} 的事件历史:`);
    events.forEach((event, index) => {
      console.log(
        `  ${index + 1}. ${event.getEventType()} - 版本 ${event.eventVersion}`,
      );
    });

    // 获取事件流
    const eventStream = await this.eventStore.getEventStream(userId);
    console.log(
      `📈 事件流统计: 事件数 ${eventStream.events.length}, 版本范围 ${eventStream.fromVersion}-${eventStream.toVersion}, 是否有更多: ${eventStream.hasMore}\n`,
    );
  }

  /**
   * @method queryEventsByType
   * @description 查询特定类型的事件
   * @returns {Promise<void>}
   * @private
   */
  private async queryEventsByType(): Promise<void> {
    console.log('🔍 查询特定类型的事件...');

    const userCreatedEvents =
      await this.eventStore.getEventsByType('UserCreated');
    const userUpdatedEvents =
      await this.eventStore.getEventsByType('UserUpdated');

    console.log(`📊 用户创建事件数量: ${userCreatedEvents.length}`);
    console.log(`📊 用户更新事件数量: ${userUpdatedEvents.length}\n`);
  }

  /**
   * @method queryEventsByTenant
   * @description 查询租户事件
   * @returns {Promise<void>}
   * @private
   */
  private async queryEventsByTenant(): Promise<void> {
    console.log('🔍 查询租户事件...');

    const tenantId = 'tenant-456';
    const tenantEvents = await this.eventStore.getEventsByTenant(tenantId);

    console.log(`📊 租户 ${tenantId} 的事件数量: ${tenantEvents.length}`);
    tenantEvents.forEach((event, index) => {
      console.log(
        `  ${index + 1}. ${event.getEventType()} - 聚合根 ${event.aggregateId}`,
      );
    });
    console.log();
  }

  /**
   * @method getEventStoreStatistics
   * @description 获取事件存储统计信息
   * @returns {Promise<void>}
   * @private
   */
  private async getEventStoreStatistics(): Promise<void> {
    console.log('📊 获取事件存储统计信息...');

    const statistics = await this.eventStore.getStatistics();

    console.log('📈 事件存储统计:');
    console.log(`  总事件数: ${statistics.totalEvents}`);
    console.log(`  总聚合根数: ${statistics.totalAggregates}`);
    console.log(
      `  平均每聚合根事件数: ${statistics.averageEventsPerAggregate.toFixed(2)}`,
    );
    console.log(
      `  最旧事件时间: ${statistics.oldestEvent?.toISOString() ?? 'N/A'}`,
    );
    console.log(
      `  最新事件时间: ${statistics.newestEvent?.toISOString() ?? 'N/A'}`,
    );

    console.log('📊 按事件类型统计:');
    Object.entries(statistics.eventsByType).forEach(([eventType, count]) => {
      console.log(`  ${eventType}: ${count}`);
    });

    console.log('📊 按租户统计:');
    Object.entries(statistics.eventsByTenant).forEach(([tenantId, count]) => {
      console.log(`  ${tenantId}: ${count}`);
    });
    console.log();
  }

  /**
   * @method demonstrateVersionControl
   * @description 演示版本控制
   * @returns {Promise<void>}
   * @private
   */
  private async demonstrateVersionControl(): Promise<void> {
    console.log('🔄 演示版本控制...');

    const userId = 'user-456';
    const tenantId = 'tenant-789';

    try {
      // 创建用户
      const userCreatedEvent = new UserCreatedEvent(
        userId,
        'user2@example.com',
        tenantId,
      );
      await this.eventStore.saveEvents(userId, [userCreatedEvent], 0);
      console.log(
        `✅ 用户创建成功，当前版本: ${await this.eventStore.getAggregateVersion(userId)}`,
      );

      // 更新用户
      const userUpdatedEvent = new UserUpdatedEvent(
        userId,
        { status: 'active' },
        tenantId,
      );
      await this.eventStore.saveEvents(userId, [userUpdatedEvent], 1);
      console.log(
        `✅ 用户更新成功，当前版本: ${await this.eventStore.getAggregateVersion(userId)}`,
      );

      // 尝试版本冲突
      try {
        const conflictEvent = new UserUpdatedEvent(
          userId,
          { status: 'inactive' },
          tenantId,
        );
        await this.eventStore.saveEvents(userId, [conflictEvent], 1); // 错误的版本号
        console.log('❌ 版本冲突应该被捕获');
      } catch (error) {
        console.log(`✅ 版本冲突被正确捕获: ${(error as Error).message}`);
      }

      console.log();
    } catch (error) {
      console.error('❌ 版本控制演示失败:', error);
    }
  }

  /**
   * @method clearEventStore
   * @description 清空事件存储（用于测试）
   * @returns {Promise<void>}
   */
  async clearEventStore(): Promise<void> {
    await this.eventStore.clear();
    console.log('🧹 事件存储已清空');
  }
}
