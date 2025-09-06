import { IDomainEvent, IAggregateSnapshot } from './domain-event.interface';

/**
 * 事件存储接口
 *
 * 事件存储是事件溯源架构的核心组件，负责事件的持久化和检索。
 * 所有事件存储实现都必须实现此接口，确保事件存储的一致性和可靠性。
 *
 * 事件存储的核心职责：
 * 1. 保存聚合根的事件到持久化存储
 * 2. 根据聚合根ID检索事件历史
 * 3. 管理聚合根的快照
 * 4. 提供事件查询和过滤功能
 * 5. 确保事件的原子性和一致性
 *
 * @interface IEventStore
 * @author AI开发团队
 * @since 1.0.0
 */
export interface IEventStore {
  /**
   * 保存聚合根的事件
   *
   * 将聚合根的未提交事件保存到事件存储中。
   * 使用乐观锁机制确保并发安全。
   *
   * @param {string} aggregateId - 聚合根的唯一标识符
   * @param {IDomainEvent[]} events - 要保存的事件列表
   * @param {number} expectedVersion - 期望的版本号（乐观锁）
   *
   * @returns {Promise<void>} 保存操作的Promise
   *
   * @throws {ConcurrencyError} 当版本号不匹配时抛出并发错误
   * @throws {EventStoreError} 当保存失败时抛出事件存储错误
   */
  saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number,
  ): Promise<void>;

  /**
   * 获取聚合根的事件历史
   *
   * 根据聚合根ID获取其完整的事件历史。
   * 事件按版本号升序排列。
   *
   * @param {string} aggregateId - 聚合根的唯一标识符
   * @param {number} [fromVersion] - 起始版本号（可选）
   *
   * @returns {Promise<IDomainEvent[]>} 事件历史列表
   *
   * @throws {EventStoreError} 当检索失败时抛出事件存储错误
   */
  getEvents(aggregateId: string, fromVersion?: number): Promise<IDomainEvent[]>;

  /**
   * 根据事件类型获取事件
   *
   * 根据事件类型和可选的时间范围获取事件列表。
   * 用于事件处理和投影更新。
   *
   * @param {string} eventType - 事件类型名称
   * @param {Date} [fromDate] - 起始时间（可选）
   *
   * @returns {Promise<IDomainEvent[]>} 匹配的事件列表
   *
   * @throws {EventStoreError} 当检索失败时抛出事件存储错误
   */
  getEventsByType(eventType: string, fromDate?: Date): Promise<IDomainEvent[]>;

  /**
   * 获取聚合根的最新快照
   *
   * 获取指定聚合根的最新快照，用于优化聚合重建性能。
   *
   * @param {string} aggregateId - 聚合根的唯一标识符
   *
   * @returns {Promise<IAggregateSnapshot | null>} 快照对象或null
   *
   * @throws {EventStoreError} 当检索失败时抛出事件存储错误
   */
  getSnapshot(aggregateId: string): Promise<IAggregateSnapshot | null>;

  /**
   * 保存聚合根的快照
   *
   * 将聚合根的快照保存到事件存储中，用于性能优化。
   *
   * @param {IAggregateSnapshot} snapshot - 要保存的快照
   *
   * @returns {Promise<void>} 保存操作的Promise
   *
   * @throws {EventStoreError} 当保存失败时抛出事件存储错误
   */
  saveSnapshot(snapshot: IAggregateSnapshot): Promise<void>;

  /**
   * 检查聚合根是否存在
   *
   * 检查指定ID的聚合根是否在事件存储中存在。
   *
   * @param {string} aggregateId - 聚合根的唯一标识符
   *
   * @returns {Promise<boolean>} 聚合根是否存在
   *
   * @throws {EventStoreError} 当检查失败时抛出事件存储错误
   */
  exists(aggregateId: string): Promise<boolean>;

  /**
   * 获取聚合根的当前版本号
   *
   * 获取指定聚合根的当前版本号，用于乐观锁控制。
   *
   * @param {string} aggregateId - 聚合根的唯一标识符
   *
   * @returns {Promise<number>} 当前版本号
   *
   * @throws {EventStoreError} 当检索失败时抛出事件存储错误
   */
  getVersion(aggregateId: string): Promise<number>;

  /**
   * 删除聚合根的所有事件
   *
   * 删除指定聚合根的所有事件和快照。
   * 注意：此操作不可逆，请谨慎使用。
   *
   * @param {string} aggregateId - 聚合根的唯一标识符
   *
   * @returns {Promise<void>} 删除操作的Promise
   *
   * @throws {EventStoreError} 当删除失败时抛出事件存储错误
   */
  deleteAggregate(aggregateId: string): Promise<void>;
}

/**
 * 并发错误
 *
 * 当乐观锁检查失败时抛出此错误，表示聚合根已被其他操作修改。
 *
 * @class ConcurrencyError
 * @extends {Error}
 * @author AI开发团队
 * @since 1.0.0
 */
export class ConcurrencyError extends Error {
  /**
   * 聚合根的唯一标识符
   */
  public readonly aggregateId: string;

  /**
   * 期望的版本号
   */
  public readonly expectedVersion: number;

  /**
   * 实际的版本号
   */
  public readonly actualVersion: number;

  /**
   * 构造函数
   *
   * @param {string} aggregateId - 聚合根的唯一标识符
   * @param {number} expectedVersion - 期望的版本号
   * @param {number} actualVersion - 实际的版本号
   */
  constructor(
    aggregateId: string,
    expectedVersion: number,
    actualVersion: number,
  ) {
    super(
      `聚合根 ${aggregateId} 的版本号不匹配。期望版本: ${expectedVersion}, 实际版本: ${actualVersion}`,
    );
    this.name = 'ConcurrencyError';
    this.aggregateId = aggregateId;
    this.expectedVersion = expectedVersion;
    this.actualVersion = actualVersion;
  }
}

/**
 * 事件存储错误
 *
 * 当事件存储操作失败时抛出此错误。
 *
 * @class EventStoreError
 * @extends {Error}
 * @author AI开发团队
 * @since 1.0.0
 */
export class EventStoreError extends Error {
  /**
   * 错误代码
   */
  public readonly code: string;

  /**
   * 构造函数
   *
   * @param {string} message - 错误消息
   * @param {string} [code='EVENT_STORE_ERROR'] - 错误代码
   * @param {Error} [cause] - 原始错误（可选）
   */
  constructor(
    message: string,
    code: string = 'EVENT_STORE_ERROR',
    cause?: Error,
  ) {
    super(message);
    this.name = 'EventStoreError';
    this.code = code;

    if (cause) {
      this.cause = cause;
    }
  }
}
