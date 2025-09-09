import { DomainEvent, EventMetadata } from '../domain-event';

/**
 * @interface StoredEvent
 * @description 存储的事件，包含事件数据和元数据
 */
export interface StoredEvent {
  readonly eventId: string;
  readonly aggregateId: string;
  readonly eventType: string;
  readonly eventVersion: number;
  readonly eventData: Record<string, unknown>;
  readonly metadata: EventMetadata;
  readonly occurredOn: Date;
  readonly storedAt: Date;
  readonly streamVersion: number; // 事件流版本号
}

/**
 * @interface EventStream
 * @description 事件流，包含聚合根的所有事件
 */
export interface EventStream {
  readonly aggregateId: string;
  readonly events: StoredEvent[];
  readonly fromVersion: number;
  readonly toVersion: number;
  readonly hasMore: boolean;
}

/**
 * @interface EventStoreQuery
 * @description 事件存储查询条件
 */
export interface EventStoreQuery {
  readonly aggregateId?: string;
  readonly eventType?: string;
  readonly fromDate?: Date;
  readonly toDate?: Date;
  readonly fromVersion?: number;
  readonly toVersion?: number;
  readonly limit?: number;
  readonly offset?: number;
  readonly tenantId?: string;
  readonly userId?: string;
}

/**
 * @interface EventStoreResult
 * @description 事件存储查询结果
 */
export interface EventStoreResult {
  readonly events: StoredEvent[];
  readonly totalCount: number;
  readonly hasMore: boolean;
  readonly nextOffset?: number;
}

/**
 * @interface IAggregateSnapshot
 * @description 聚合根快照接口
 */
export interface IAggregateSnapshot {
  readonly aggregateId: string;
  readonly aggregateType: string;
  readonly version: number;
  readonly data: Record<string, unknown>;
  readonly createdAt: Date;
}

/**
 * @interface IEventStore
 * @description
 * 事件存储接口，负责管理领域事件的持久化、检索和重放功能。
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
 *
 * @example
 * ```typescript
 * const eventStore = new EventStore(eventRepository, snapshotRepository);
 * await eventStore.saveEvents(aggregateId, events);
 * const events = await eventStore.getEvents(aggregateId, fromVersion);
 * ```
 * @since 1.0.0
 */
export interface IEventStore {
  /**
   * @method saveEvents
   * @description 保存聚合根的事件到事件存储
   * @param {string} aggregateId 聚合根ID
   * @param {DomainEvent[]} events 领域事件列表
   * @param {number} expectedVersion 期望的版本号，用于乐观并发控制
   * @param {EventMetadata} [metadata] 事件元数据，可选
   * @returns {Promise<void>}
   * @throws {ConcurrencyError} 当版本冲突时抛出
   * @throws {ValidationError} 当事件无效时抛出
   *
   * 保存流程：
   * 1. 验证事件的有效性和完整性
   * 2. 检查聚合根版本一致性
   * 3. 应用租户级数据隔离
   * 4. 持久化事件到存储
   * 5. 更新聚合根版本号
   */
  saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number,
    metadata?: EventMetadata,
  ): Promise<void>;

  /**
   * @method getEvents
   * @description 获取聚合根的事件历史
   * @param {string} aggregateId 聚合根ID
   * @param {number} fromVersion 起始版本号
   * @param {number} toVersion 结束版本号，可选
   * @returns {Promise<DomainEvent[]>} 事件列表
   */
  getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<DomainEvent[]>;

  /**
   * @method getEventStream
   * @description 获取事件流
   * @param {string} aggregateId 聚合根ID
   * @param {number} fromVersion 起始版本号
   * @param {number} limit 限制数量
   * @returns {Promise<EventStream>} 事件流
   */
  getEventStream(
    aggregateId: string,
    fromVersion?: number,
    limit?: number,
  ): Promise<EventStream>;

  /**
   * @method queryEvents
   * @description 查询事件
   * @param {EventStoreQuery} query 查询条件
   * @returns {Promise<EventStoreResult>} 查询结果
   */
  queryEvents(query: EventStoreQuery): Promise<EventStoreResult>;

  /**
   * @method getEventsByType
   * @description 根据事件类型获取事件
   * @param {string} eventType 事件类型
   * @param {Date} fromDate 开始日期
   * @param {Date} toDate 结束日期
   * @param {number} limit 限制数量
   * @returns {Promise<DomainEvent[]>} 事件列表
   */
  getEventsByType(
    eventType: string,
    fromDate?: Date,
    toDate?: Date,
    limit?: number,
  ): Promise<DomainEvent[]>;

  /**
   * @method createSnapshot
   * @description 为聚合根创建快照
   * @param {string} aggregateId 聚合根ID
   * @param {any} aggregateState 聚合根状态
   * @param {number} version 版本号
   * @returns {Promise<void>}
   */
  createSnapshot(
    aggregateId: string,
    aggregateState: any,
    version: number,
  ): Promise<void>;

  /**
   * @method getSnapshot
   * @description 获取聚合根的最新快照
   * @param {string} aggregateId 聚合根ID
   * @returns {Promise<IAggregateSnapshot | null>} 快照或null
   */
  getSnapshot(aggregateId: string): Promise<IAggregateSnapshot | null>;

  /**
   * @method deleteSnapshot
   * @description 删除聚合根的快照
   * @param {string} aggregateId 聚合根ID
   * @returns {Promise<void>}
   */
  deleteSnapshot(aggregateId: string): Promise<void>;

  /**
   * @method getAggregateVersion
   * @description 获取聚合根的当前版本号
   * @param {string} aggregateId 聚合根ID
   * @returns {Promise<number>} 版本号
   */
  getAggregateVersion(aggregateId: string): Promise<number>;

  /**
   * @method eventExists
   * @description 检查事件是否存在
   * @param {string} eventId 事件ID
   * @returns {Promise<boolean>} 是否存在
   */
  eventExists(eventId: string): Promise<boolean>;

  /**
   * @method getEventById
   * @description 根据事件ID获取事件
   * @param {string} eventId 事件ID
   * @returns {Promise<DomainEvent | null>} 事件或null
   */
  getEventById(eventId: string): Promise<DomainEvent | null>;

  /**
   * @method archiveEvents
   * @description 归档旧事件
   * @param {Date} beforeDate 归档此日期之前的事件
   * @returns {Promise<number>} 归档的事件数量
   */
  archiveEvents(beforeDate: Date): Promise<number>;

  /**
   * @method getEventStatistics
   * @description 获取事件统计信息
   * @param {Date} fromDate 开始日期
   * @param {Date} toDate 结束日期
   * @returns {Promise<EventStatistics>} 统计信息
   */
  getEventStatistics(fromDate: Date, toDate: Date): Promise<EventStatistics>;
}

/**
 * @interface EventStatistics
 * @description 事件统计信息
 */
export interface EventStatistics {
  readonly totalEvents: number;
  readonly eventsByType: Record<string, number>;
  readonly eventsByTenant: Record<string, number>;
  readonly eventsByUser: Record<string, number>;
  readonly averageEventsPerDay: number;
  readonly peakEventsPerHour: number;
  readonly storageSize: number; // bytes
}
