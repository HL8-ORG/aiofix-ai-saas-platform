/**
 * 领域事件接口
 *
 * 领域事件是DDD中的核心概念，用于表示聚合根中发生的业务事件。
 * 所有领域事件都必须实现此接口，确保事件的一致性和可追溯性。
 *
 * @interface IDomainEvent
 * @author AI开发团队
 * @since 1.0.0
 */
export interface IDomainEvent {
  /**
   * 事件的唯一标识符
   * 用于事件的去重和追踪
   */
  readonly eventId: string;

  /**
   * 聚合根的唯一标识符
   * 标识事件所属的聚合根
   */
  readonly aggregateId: string;

  /**
   * 事件发生的时间戳
   * 用于事件的时间排序和审计
   */
  readonly occurredOn: Date;

  /**
   * 事件的类型名称
   * 用于事件的序列化和反序列化
   */
  readonly eventType: string;

  /**
   * 事件的版本号
   * 用于事件的版本控制和兼容性处理
   */
  readonly eventVersion: number;

  /**
   * 将事件转换为JSON格式
   * 用于事件的持久化和传输
   *
   * @returns {Record<string, unknown>} 事件的JSON表示
   */
  toJSON(): Record<string, unknown>;
}

/**
 * 聚合快照接口
 *
 * 聚合快照用于优化事件溯源性能，通过定期创建快照，
 * 可以避免重放大量历史事件来重建聚合状态。
 *
 * @interface IAggregateSnapshot
 * @author AI开发团队
 * @since 1.0.0
 */
export interface IAggregateSnapshot {
  /**
   * 聚合根的唯一标识符
   */
  readonly aggregateId: string;

  /**
   * 快照对应的版本号
   * 表示快照创建时的聚合版本
   */
  readonly version: number;

  /**
   * 快照数据
   * 包含聚合在指定版本时的完整状态
   */
  readonly data: Record<string, unknown>;

  /**
   * 快照创建时间
   */
  readonly createdAt: Date;
}
