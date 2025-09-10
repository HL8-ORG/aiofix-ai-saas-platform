import { DomainEvent } from '@aiofix/core';

/**
 * @interface IEventStorage
 * @description
 * 事件存储接口，定义事件存储操作的标准接口。
 *
 * 事件存储职责：
 * 1. 持久化领域事件到存储系统
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
 * @example
 * ```typescript
 * const eventStorage: IEventStorage = new MongoDBEventStorageService(logger);
 * await eventStorage.saveEvents(aggregateId, events);
 * const events = await eventStorage.getEvents(aggregateId, fromVersion);
 * ```
 * @since 1.0.0
 */
export interface IEventStorage {
  /**
   * @method saveEvents
   * @description 保存聚合根的事件到事件存储
   * @param {string} aggregateId 聚合根ID
   * @param {DomainEvent[]} events 领域事件列表
   * @param {number} expectedVersion 期望的版本号，用于乐观并发控制
   * @returns {Promise<void>}
   * @throws {ConcurrencyError} 当版本冲突时抛出
   * @throws {ValidationError} 当事件无效时抛出
   */
  saveEvents(
    aggregateId: string,
    events: DomainEvent[],
    expectedVersion: number,
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
   * @method getEventsByType
   * @description 根据事件类型获取事件
   * @param {string} eventType 事件类型
   * @param {number} limit 限制数量
   * @param {number} offset 偏移量
   * @returns {Promise<DomainEvent[]>} 事件列表
   */
  getEventsByType(
    eventType: string,
    limit?: number,
    offset?: number,
  ): Promise<DomainEvent[]>;

  /**
   * @method getEventsByDateRange
   * @description 根据日期范围获取事件
   * @param {Date} startDate 开始日期
   * @param {Date} endDate 结束日期
   * @param {number} limit 限制数量
   * @param {number} offset 偏移量
   * @returns {Promise<DomainEvent[]>} 事件列表
   */
  getEventsByDateRange(
    startDate: Date,
    endDate: Date,
    limit?: number,
    offset?: number,
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
   * @method getLatestSnapshot
   * @description 获取聚合根的最新快照
   * @param {string} aggregateId 聚合根ID
   * @returns {Promise<any | null>} 快照数据或null
   */
  getLatestSnapshot(aggregateId: string): Promise<any | null>;

  /**
   * @method deleteEvents
   * @description 删除聚合根的事件（用于测试或清理）
   * @param {string} aggregateId 聚合根ID
   * @returns {Promise<number>} 删除的事件数量
   */
  deleteEvents(aggregateId: string): Promise<number>;

  /**
   * @method getEventStatistics
   * @description 获取事件统计信息
   * @returns {Promise<EventStatistics>} 事件统计信息
   */
  getEventStatistics(): Promise<EventStatistics>;
}

/**
 * 事件统计信息接口
 */
export interface EventStatistics {
  totalEvents: number;
  uniqueAggregates: number;
  eventTypes: number;
  tenantId: string;
}

/**
 * 事件存储异常
 */
export class EventStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EventStorageError';
  }
}

/**
 * 并发控制异常
 */
export class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}

/**
 * 验证异常
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
