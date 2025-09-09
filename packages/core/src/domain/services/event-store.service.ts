import { DomainEvent, EventMetadata } from '../domain-event';
import { IEventStore } from '../interfaces/event-store.interface';

// 使用接口中定义的StoredEvent和EventStream
import { StoredEvent, EventStream } from '../interfaces/event-store.interface';

/**
 * @interface EventStoreStatistics
 * @description 事件存储统计信息
 */
export interface EventStoreStatistics {
  readonly totalEvents: number;
  readonly totalAggregates: number;
  readonly eventsByType: Record<string, number>;
  readonly eventsByTenant: Record<string, number>;
  readonly oldestEvent: Date | null;
  readonly newestEvent: Date | null;
  readonly averageEventsPerAggregate: number;
}

/**
 * @class InMemoryEventStore
 * @description 内存事件存储服务实现，用于开发和测试环境
 *
 * 存储服务职责：
 * 1. 持久化领域事件到存储系统
 * 2. 提供事件的检索和查询功能
 * 3. 支持事件流的重放和快照
 * 4. 提供事件存储的统计信息
 *
 * 存储特性：
 * 1. 内存存储：使用内存Map进行事件存储
 * 2. 版本控制：支持事件的版本管理和并发控制
 * 3. 查询优化：提供多种查询方式和索引
 * 4. 统计监控：提供详细的存储统计信息
 *
 * @param {Map<string, StoredEvent[]>} eventStreams 事件流存储
 * @param {Map<string, StoredEvent>} eventsById 事件ID索引
 * @param {Map<string, StoredEvent[]>} eventsByType 事件类型索引
 * @param {Map<string, StoredEvent[]>} eventsByTenant 租户事件索引
 *
 * @example
 * ```typescript
 * const eventStore = new InMemoryEventStore();
 *
 * // 保存事件
 * await eventStore.saveEvents('user-123', [userCreatedEvent], 0);
 *
 * // 获取事件流
 * const events = await eventStore.getEvents('user-123', 0);
 * ```
 * @since 1.0.0
 */
export class InMemoryEventStore implements IEventStore {
  private readonly eventStreams: Map<string, StoredEvent[]> = new Map();
  private readonly eventsById: Map<string, StoredEvent> = new Map();
  private readonly eventsByType: Map<string, StoredEvent[]> = new Map();
  private readonly eventsByTenant: Map<string, StoredEvent[]> = new Map();
  private readonly aggregateVersions: Map<string, number> = new Map();

  /**
   * @method saveEvents
   * @description 保存聚合根的事件到事件存储
   * @param {string} aggregateId 聚合根ID
   * @param {DomainEvent[]} events 领域事件列表
   * @param {number} expectedVersion 期望的版本号，用于乐观并发控制
   * @returns {Promise<void>}
   * @throws {ConcurrencyError} 当版本冲突时抛出
   * @throws {ValidationError} 当事件无效时抛出
   *
   * 保存流程：
   * 1. 验证事件的有效性和完整性
   * 2. 检查聚合根版本一致性
   * 3. 转换事件为存储格式
   * 4. 持久化事件到存储
   * 5. 更新聚合根版本号
   * 6. 更新索引
   */
  async saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    try {
      // 1. 验证输入
      this.validateSaveEventsInput(aggregateId, events, expectedVersion);

      // 2. 检查版本一致性
      await this.checkVersionConsistency(aggregateId, expectedVersion);

      // 3. 转换事件为存储格式
      const storedEvents = events.map((event, index) =>
        this.convertToStoredEvent(event, expectedVersion + index + 1),
      );

      // 4. 保存事件到存储
      await this.persistEvents(aggregateId, storedEvents);

      // 5. 更新版本号
      this.aggregateVersions.set(aggregateId, expectedVersion + events.length);

      // 6. 记录保存日志
      console.log(
        `Saved ${events.length} events for aggregate ${aggregateId} from version ${expectedVersion}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to save events for aggregate ${aggregateId}: ${errorMessage}`,
      );
    }
  }

  /**
   * @method getEvents
   * @description 获取聚合根的事件历史
   * @param {string} aggregateId 聚合根ID
   * @param {number} fromVersion 起始版本号
   * @param {number} toVersion 结束版本号，可选
   * @returns {Promise<DomainEvent[]>} 事件列表
   * @throws {AggregateNotFoundError} 当聚合根不存在时抛出
   */
  async getEvents(
    aggregateId: string,
    fromVersion: number = 0,
    toVersion?: number,
  ): Promise<DomainEvent[]> {
    try {
      // 1. 获取事件流
      const eventStream = this.eventStreams.get(aggregateId);
      if (!eventStream) {
        return [];
      }

      // 2. 过滤版本范围
      const filteredEvents = eventStream.filter(event => {
        if (event.eventVersion < fromVersion) {
          return false;
        }
        if (toVersion !== undefined && event.eventVersion > toVersion) {
          return false;
        }
        return true;
      });

      // 3. 转换为领域事件
      return filteredEvents.map(storedEvent =>
        this.convertToDomainEvent(storedEvent),
      );
    } catch (error) {
      throw new Error(
        `Failed to get events for aggregate ${aggregateId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * @method getEventStream
   * @description 获取完整的事件流
   * @param {string} aggregateId 聚合根ID
   * @param {number} fromVersion 起始版本号
   * @param {number} toVersion 结束版本号，可选
   * @returns {Promise<EventStream>} 事件流
   */
  async getEventStream(
    aggregateId: string,
    fromVersion: number = 0,
    limit: number = 100,
  ): Promise<EventStream> {
    try {
      const eventStream = this.eventStreams.get(aggregateId);
      if (!eventStream) {
        return {
          aggregateId,
          events: [],
          fromVersion,
          toVersion: 0,
          hasMore: false,
        };
      }

      const filteredEvents = eventStream
        .filter(event => event.eventVersion >= fromVersion)
        .slice(0, limit);

      const toVersion =
        filteredEvents.length > 0
          ? Math.max(...filteredEvents.map(e => e.eventVersion))
          : fromVersion;

      const hasMore = eventStream.some(event => event.eventVersion > toVersion);

      return {
        aggregateId,
        events: filteredEvents,
        fromVersion,
        toVersion,
        hasMore,
      };
    } catch (error) {
      throw new Error(
        `Failed to get event stream for aggregate ${aggregateId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * @method getEventsByType
   * @description 根据事件类型获取事件
   * @param {string} eventType 事件类型
   * @param {number} limit 限制数量
   * @param {number} offset 偏移量
   * @returns {Promise<DomainEvent[]>} 事件列表
   */
  async getEventsByType(
    eventType: string,
    fromDate?: Date,
    toDate?: Date,
    limit: number = 100,
  ): Promise<DomainEvent[]> {
    try {
      let events = this.eventsByType.get(eventType) ?? [];

      // 按日期过滤
      if (fromDate) {
        events = events.filter(event => event.occurredOn >= fromDate);
      }
      if (toDate) {
        events = events.filter(event => event.occurredOn <= toDate);
      }

      // 限制数量
      const paginatedEvents = events.slice(0, limit);
      return paginatedEvents.map(storedEvent =>
        this.convertToDomainEvent(storedEvent),
      );
    } catch (error) {
      throw new Error(
        `Failed to get events by type ${eventType}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * @method getEventsByTenant
   * @description 根据租户ID获取事件
   * @param {string} tenantId 租户ID
   * @param {number} limit 限制数量
   * @param {number} offset 偏移量
   * @returns {Promise<DomainEvent[]>} 事件列表
   */
  async getEventsByTenant(
    tenantId: string,
    fromDate?: Date,
    toDate?: Date,
    limit: number = 100,
  ): Promise<DomainEvent[]> {
    try {
      let events = this.eventsByTenant.get(tenantId) ?? [];

      // 按日期过滤
      if (fromDate) {
        events = events.filter(event => event.occurredOn >= fromDate);
      }
      if (toDate) {
        events = events.filter(event => event.occurredOn <= toDate);
      }

      // 限制数量
      const paginatedEvents = events.slice(0, limit);
      return paginatedEvents.map(storedEvent =>
        this.convertToDomainEvent(storedEvent),
      );
    } catch (error) {
      throw new Error(
        `Failed to get events by tenant ${tenantId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * @method getEventById
   * @description 根据事件ID获取事件
   * @param {string} eventId 事件ID
   * @returns {Promise<DomainEvent | null>} 事件或null
   */
  async getEventById(eventId: string): Promise<DomainEvent | null> {
    try {
      const storedEvent = this.eventsById.get(eventId);
      if (!storedEvent) {
        return null;
      }
      return this.convertToDomainEvent(storedEvent);
    } catch (error) {
      throw new Error(
        `Failed to get event by ID ${eventId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * @method getAggregateVersion
   * @description 获取聚合根的当前版本号
   * @param {string} aggregateId 聚合根ID
   * @returns {Promise<number>} 版本号
   */
  async getAggregateVersion(aggregateId: string): Promise<number> {
    return this.aggregateVersions.get(aggregateId) ?? 0;
  }

  /**
   * @method getStatistics
   * @description 获取事件存储统计信息
   * @returns {Promise<EventStoreStatistics>} 统计信息
   */
  async getStatistics(): Promise<EventStoreStatistics> {
    try {
      const allEvents = Array.from(this.eventsById.values());
      const totalEvents = allEvents.length;
      const totalAggregates = this.eventStreams.size;

      // 按事件类型统计
      const eventsByType: Record<string, number> = {};
      for (const [eventType, events] of this.eventsByType.entries()) {
        eventsByType[eventType] = events.length;
      }

      // 按租户统计
      const eventsByTenant: Record<string, number> = {};
      for (const [tenantId, events] of this.eventsByTenant.entries()) {
        eventsByTenant[tenantId] = events.length;
      }

      // 时间范围
      const timestamps = allEvents.map(event => event.occurredOn);
      const oldestEvent =
        timestamps.length > 0
          ? new Date(Math.min(...timestamps.map(t => t.getTime())))
          : null;
      const newestEvent =
        timestamps.length > 0
          ? new Date(Math.max(...timestamps.map(t => t.getTime())))
          : null;

      // 平均事件数
      const averageEventsPerAggregate =
        totalAggregates > 0 ? totalEvents / totalAggregates : 0;

      return {
        totalEvents,
        totalAggregates,
        eventsByType,
        eventsByTenant,
        oldestEvent,
        newestEvent,
        averageEventsPerAggregate,
      };
    } catch (error) {
      throw new Error(
        `Failed to get event store statistics: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * @method queryEvents
   * @description 查询事件
   * @param {EventStoreQuery} query 查询条件
   * @returns {Promise<EventStoreResult>} 查询结果
   */
  async queryEvents(
    _query: unknown,
  ): Promise<{ events: StoredEvent[]; totalCount: number; hasMore: boolean }> {
    // 简化实现，返回空结果
    return {
      events: [],
      totalCount: 0,
      hasMore: false,
    };
  }

  /**
   * @method createSnapshot
   * @description 为聚合根创建快照
   * @param {string} aggregateId 聚合根ID
   * @param {any} aggregateState 聚合根状态
   * @param {number} version 版本号
   * @returns {Promise<void>}
   */
  async createSnapshot(
    aggregateId: string,
    aggregateState: unknown,
    version: number,
  ): Promise<void> {
    // 简化实现，仅记录日志
    console.log(
      `Snapshot created for aggregate ${aggregateId} at version ${version}`,
    );
  }

  /**
   * @method getSnapshot
   * @description 获取聚合根的最新快照
   * @param {string} aggregateId 聚合根ID
   * @returns {Promise<any>} 快照或null
   */
  async getSnapshot(_aggregateId: string): Promise<null> {
    // 简化实现，返回null
    return null;
  }

  /**
   * @method deleteSnapshot
   * @description 删除聚合根的快照
   * @param {string} aggregateId 聚合根ID
   * @returns {Promise<void>}
   */
  async deleteSnapshot(aggregateId: string): Promise<void> {
    // 简化实现，仅记录日志
    console.log(`Snapshot deleted for aggregate ${aggregateId}`);
  }

  /**
   * @method eventExists
   * @description 检查事件是否存在
   * @param {string} eventId 事件ID
   * @returns {Promise<boolean>} 是否存在
   */
  async eventExists(eventId: string): Promise<boolean> {
    return this.eventsById.has(eventId);
  }

  /**
   * @method archiveEvents
   * @description 归档事件
   * @param {Date} beforeDate 日期
   * @returns {Promise<number>} 归档的事件数量
   */
  async archiveEvents(beforeDate: Date): Promise<number> {
    // 简化实现，仅记录日志
    console.log(`Events archived before date ${beforeDate.toISOString()}`);
    return 0;
  }

  /**
   * @method getEventStatistics
   * @description 获取事件统计信息
   * @returns {Promise<any>} 统计信息
   */
  async getEventStatistics(
    _fromDate: Date,
    _toDate: Date,
  ): Promise<{
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsByTenant: Record<string, number>;
    eventsByUser: Record<string, number>;
    averageEventsPerDay: number;
    peakEventsPerHour: number;
    storageSize: number;
  }> {
    const stats = await this.getStatistics();
    return {
      totalEvents: stats.totalEvents,
      eventsByType: stats.eventsByType,
      eventsByTenant: stats.eventsByTenant,
      eventsByUser: {},
      averageEventsPerDay: 0,
      peakEventsPerHour: 0,
      storageSize: 0,
    };
  }

  /**
   * @method clear
   * @description 清空所有事件数据（仅用于测试）
   * @returns {Promise<void>}
   */
  async clear(): Promise<void> {
    this.eventStreams.clear();
    this.eventsById.clear();
    this.eventsByType.clear();
    this.eventsByTenant.clear();
    this.aggregateVersions.clear();
    console.log('Event store cleared');
  }

  /**
   * @method convertToStoredEvent
   * @description 将领域事件转换为存储格式
   * @param {DomainEvent} event 领域事件
   * @param {number} version 版本号
   * @returns {StoredEvent} 存储的事件
   * @private
   */
  private convertToStoredEvent(
    event: DomainEvent,
    version: number,
  ): StoredEvent {
    const eventId = `${event.aggregateId}-${version}`;
    const metadata: EventMetadata = event.getMetadata();

    return {
      eventId: eventId,
      aggregateId: event.aggregateId,
      eventType: event.getEventType(),
      eventVersion: version,
      eventData: event.toJSON(),
      metadata: metadata,
      occurredOn: event.occurredOn,
      storedAt: new Date(),
      streamVersion: version,
    };
  }

  /**
   * @method convertToDomainEvent
   * @description 将存储的事件转换为领域事件
   * @param {StoredEvent} storedEvent 存储的事件
   * @returns {DomainEvent} 领域事件
   * @private
   */
  private convertToDomainEvent(storedEvent: StoredEvent): DomainEvent {
    // 这里需要根据事件类型创建相应的领域事件实例
    // 为了简化，我们创建一个通用的领域事件
    const event = new (class extends DomainEvent {
      constructor() {
        super(
          storedEvent.aggregateId,
          storedEvent.eventVersion,
          storedEvent.metadata,
        );
      }

      getEventType(): string {
        return storedEvent.eventType;
      }

      toJSON(): Record<string, unknown> {
        return storedEvent.eventData;
      }
    })();

    return event;
  }

  /**
   * @method persistEvents
   * @description 持久化事件到存储
   * @param {string} aggregateId 聚合根ID
   * @param {StoredEvent[]} events 存储的事件列表
   * @returns {Promise<void>}
   * @private
   */
  private async persistEvents(
    aggregateId: string,
    events: StoredEvent[],
  ): Promise<void> {
    // 1. 添加到事件流
    if (!this.eventStreams.has(aggregateId)) {
      this.eventStreams.set(aggregateId, []);
    }
    const eventStream = this.eventStreams.get(aggregateId);
    if (eventStream) {
      eventStream.push(...events);
    }

    // 2. 添加到ID索引
    for (const event of events) {
      this.eventsById.set(event.eventId, event);
    }

    // 3. 添加到类型索引
    for (const event of events) {
      if (!this.eventsByType.has(event.eventType)) {
        this.eventsByType.set(event.eventType, []);
      }
      const typeEvents = this.eventsByType.get(event.eventType);
      if (typeEvents) {
        typeEvents.push(event);
      }
    }

    // 4. 添加到租户索引
    for (const event of events) {
      const tenantId = event.metadata.tenantId;
      if (tenantId) {
        if (!this.eventsByTenant.has(tenantId)) {
          this.eventsByTenant.set(tenantId, []);
        }
        const tenantEvents = this.eventsByTenant.get(tenantId);
        if (tenantEvents) {
          tenantEvents.push(event);
        }
      }
    }
  }

  /**
   * @method checkVersionConsistency
   * @description 检查版本一致性
   * @param {string} aggregateId 聚合根ID
   * @param {number} expectedVersion 期望版本号
   * @returns {Promise<void>}
   * @throws {ConcurrencyError} 当版本冲突时抛出
   * @private
   */
  private async checkVersionConsistency(
    aggregateId: string,
    expectedVersion: number,
  ): Promise<void> {
    const currentVersion = this.aggregateVersions.get(aggregateId) ?? 0;
    if (currentVersion !== expectedVersion) {
      throw new Error(
        `Version conflict for aggregate ${aggregateId}: expected ${expectedVersion}, but current version is ${currentVersion}`,
      );
    }
  }

  /**
   * @method validateSaveEventsInput
   * @description 验证保存事件的输入参数
   * @param {string} aggregateId 聚合根ID
   * @param {DomainEvent[]} events 事件列表
   * @param {number} expectedVersion 期望版本号
   * @throws {ValidationError} 当输入无效时抛出
   * @private
   */
  private validateSaveEventsInput(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number,
  ): void {
    if (!aggregateId) {
      throw new Error('Aggregate ID cannot be empty');
    }

    if (events.length === 0) {
      throw new Error('Events list cannot be empty');
    }

    if (expectedVersion < 0) {
      throw new Error('Expected version cannot be negative');
    }

    // 验证所有事件都属于同一个聚合根
    for (const event of events) {
      if (event.aggregateId !== aggregateId) {
        throw new Error(
          `Event aggregate ID ${event.aggregateId} does not match expected ${aggregateId}`,
        );
      }
    }
  }
}
