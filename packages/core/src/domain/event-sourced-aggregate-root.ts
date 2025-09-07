import {
  IDomainEvent,
  IAggregateSnapshot,
} from './interfaces/domain-event.interface';

/**
 * @class EventSourcedAggregateRoot
 * @description
 * 事件溯源聚合根基类，负责管理用户相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供聚合根的事件管理和版本控制
 * 2. 在状态变更时记录相应的领域事件
 * 3. 确保业务操作的事件一致性
 *
 * 不变性约束：
 * 1. 事件一旦创建不可修改
 * 2. 聚合状态只能通过事件变更
 * 3. 版本控制确保并发安全
 *
 * 事件溯源特性：
 * 1. 支持从历史事件重建聚合状态
 * 2. 提供快照机制优化性能
 * 3. 支持时间旅行和审计功能
 * 4. 通过版本控制防止并发冲突
 *
 * @property {string} id 聚合根的唯一标识符，子类必须实现
 * @property {IDomainEvent[]} uncommittedEvents 未提交的事件列表
 * @property {number} version 聚合根的当前版本号
 *
 * @example
 * ```typescript
 * class UserAggregate extends EventSourcedAggregateRoot {
 *   public readonly id: string;
 *
 *   protected handleEvent(event: IDomainEvent, isFromHistory: boolean): void {
 *     // 处理事件逻辑
 *   }
 *
 *   protected toSnapshot(): any {
 *     // 返回快照数据
 *   }
 *
 *   protected fromSnapshot(data: any): void {
 *     // 从快照恢复状态
 *   }
 * }
 * ```
 * @abstract
 * @since 1.0.0
 */
export abstract class EventSourcedAggregateRoot {
  /**
   * 聚合根的唯一标识符
   * 子类必须实现此属性
   */
  public abstract readonly id: string;

  /**
   * 未提交的事件列表
   * 存储聚合根中发生但尚未持久化的事件
   */
  private _uncommittedEvents: IDomainEvent[] = [];

  /**
   * 聚合根的当前版本号
   * 用于乐观锁控制，防止并发冲突
   */
  private _version = 0;

  /**
   * 获取未提交的事件列表
   *
   * @returns {IDomainEvent[]} 未提交的事件列表的副本
   */
  public get uncommittedEvents(): IDomainEvent[] {
    return [...this._uncommittedEvents];
  }

  /**
   * 获取聚合根的当前版本号
   *
   * @returns {number} 当前版本号
   */
  public get version(): number {
    return this._version;
  }

  /**
   * 应用领域事件
   *
   * 这是事件溯源的核心方法，用于应用事件到聚合根。
   * 事件应用会触发状态变更，并记录到未提交事件列表中。
   *
   * @param {IDomainEvent} event - 要应用的领域事件
   * @param {boolean} [isFromHistory=false] - 是否来自历史事件重放
   *
   * @protected
   */
  protected apply(event: IDomainEvent, isFromHistory: boolean = false): void {
    // 验证事件的有效性
    this.validateEvent(event);

    // 处理事件，更新聚合状态
    this.handleEvent(event, isFromHistory);

    // 如果不是来自历史事件重放，则记录到未提交事件列表
    if (!isFromHistory) {
      this._uncommittedEvents.push(event);
      this._version++;
    }
  }

  /**
   * 处理领域事件
   *
   * 子类必须实现此方法，定义如何处理不同类型的事件。
   * 这是聚合根业务逻辑的核心部分。
   *
   * @param {IDomainEvent} event - 要处理的领域事件
   * @param {boolean} isFromHistory - 是否来自历史事件重放
   *
   * @protected
   * @abstract
   */
  protected abstract handleEvent(
    event: IDomainEvent,
    isFromHistory: boolean,
  ): void;

  /**
   * 标记事件为已提交
   *
   * 在事件成功持久化后调用此方法，清空未提交事件列表。
   * 这通常在仓储的保存操作完成后调用。
   *
   * @public
   */
  public markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  /**
   * 从历史事件重建聚合状态
   *
   * 通过重放历史事件来重建聚合的当前状态。
   * 这是事件溯源的核心功能之一。
   *
   * @param {IDomainEvent[]} events - 历史事件列表
   * @param {number} [fromVersion=0] - 起始版本号
   *
   * @public
   */
  public loadFromHistory(
    events: IDomainEvent[],
    fromVersion: number = 0,
  ): void {
    if (events.length === 0) {
      return;
    }

    // 按版本号排序事件
    const sortedEvents = events.sort((a, b) => a.eventVersion - b.eventVersion);

    // 重放事件
    for (const event of sortedEvents) {
      this.apply(event, true);
    }

    // 设置版本号
    this._version = fromVersion + events.length;
  }

  /**
   * 创建聚合快照
   *
   * 快照用于优化性能，避免重放大量历史事件。
   * 子类应该重写此方法，提供具体的快照数据。
   *
   * @returns {IAggregateSnapshot} 聚合快照
   *
   * @public
   */
  public createSnapshot(): IAggregateSnapshot {
    return {
      aggregateId: this.id,
      version: this._version,
      data: this.toSnapshot(),
      createdAt: new Date(),
    };
  }

  /**
   * 从快照恢复聚合状态
   *
   * 从快照数据恢复聚合的状态，然后可以继续应用后续事件。
   * 子类应该重写此方法，提供具体的快照恢复逻辑。
   *
   * @param {IAggregateSnapshot} snapshot - 聚合快照
   *
   * @public
   */
  public restoreFromSnapshot(snapshot: IAggregateSnapshot): void {
    if (snapshot.aggregateId !== this.id) {
      throw new Error('无效的快照数据');
    }

    this._version = snapshot.version;
    this.fromSnapshot(snapshot.data);
  }

  /**
   * 将聚合状态转换为快照数据
   *
   * 子类必须实现此方法，定义如何将聚合状态序列化为快照数据。
   *
   * @returns {Record<string, unknown>} 快照数据
   *
   * @protected
   * @abstract
   */
  protected abstract toSnapshot(): Record<string, unknown>;

  /**
   * 从快照数据恢复聚合状态
   *
   * 子类必须实现此方法，定义如何从快照数据恢复聚合状态。
   *
   * @param {Record<string, unknown>} data - 快照数据
   *
   * @protected
   * @abstract
   */
  protected abstract fromSnapshot(data: Record<string, unknown>): void;

  /**
   * 验证事件的有效性
   *
   * @param {IDomainEvent} event - 要验证的事件
   *
   * @private
   */
  private validateEvent(event: IDomainEvent): void {
    if (event.aggregateId !== this.id) {
      throw new Error('事件的聚合根ID与当前聚合根不匹配');
    }

    if (event.eventId.trim().length === 0) {
      throw new Error('事件ID不能为空');
    }

    if (event.eventType.trim().length === 0) {
      throw new Error('事件类型不能为空');
    }

    if (event.eventVersion < 1) {
      throw new Error('事件版本号必须大于等于1');
    }
  }

  /**
   * 检查是否有未提交的事件
   *
   * @returns {boolean} 是否有未提交的事件
   *
   * @public
   */
  public hasUncommittedEvents(): boolean {
    return this._uncommittedEvents.length > 0;
  }

  /**
   * 获取未提交事件的数量
   *
   * @returns {number} 未提交事件的数量
   *
   * @public
   */
  public getUncommittedEventsCount(): number {
    return this._uncommittedEvents.length;
  }
}
