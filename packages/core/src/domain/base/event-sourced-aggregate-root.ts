import { DomainEvent } from '../domain-event';

/**
 * @class EventSourcedAggregateRoot
 * @description
 * 事件溯源聚合根基类，负责管理聚合根的事件收集、存储和重放功能。
 *
 * 事件溯源职责：
 * 1. 收集聚合根产生的领域事件
 * 2. 管理未提交事件的生命周期
 * 3. 支持事件的重放和状态重建
 * 4. 提供事件提交和清理机制
 *
 * 事件管理机制：
 * 1. 事件收集：通过addDomainEvent方法收集业务事件
 * 2. 事件存储：维护未提交事件的内部列表
 * 3. 事件提交：通过markEventsAsCommitted标记事件已提交
 * 4. 事件清理：通过clearDomainEvents清理已处理事件
 *
 * 设计原则：
 * 1. 所有事件溯源聚合根都应该继承此类
 * 2. 提供统一的事件管理接口和行为
 * 3. 支持事件驱动架构的完整实现
 * 4. 确保事件的一致性和完整性
 * 5. 为事件存储和重放提供基础支持
 *
 * @property {DomainEvent[]} domainEvents 未提交的领域事件列表
 *
 * @example
 * ```typescript
 * export class UserAggregate extends EventSourcedAggregateRoot {
 *   constructor(private userId: string) {
 *     super();
 *   }
 *
 *   createUser(email: string, tenantId: string): void {
 *     // 业务逻辑
 *     this.addDomainEvent(new UserCreatedEvent(this.userId, email, tenantId));
 *   }
 *
 *   // 获取未提交事件
 *   getUncommittedEvents(): DomainEvent[] {
 *     return this.getDomainEvents();
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class EventSourcedAggregateRoot {
  /**
   * 未提交的领域事件列表
   * 用于收集聚合根在业务操作中产生的所有事件
   */
  private domainEvents: DomainEvent[] = [];

  /**
   * @method addDomainEvent
   * @description
   * 添加领域事件到未提交事件列表。此方法用于在业务操作中收集产生的领域事件。
   *
   * 功能与职责：
   * 1. 将新产生的领域事件添加到内部事件列表
   * 2. 确保事件在事务提交前被正确收集
   * 3. 支持多个事件在同一个业务操作中产生
   * 4. 为事件存储和发布提供数据源
   *
   * 使用场景：
   * 1. 聚合根执行业务方法时产生事件
   * 2. 状态变更需要通知其他聚合根
   * 3. 需要记录业务操作的审计日志
   * 4. 触发后续的业务流程
   *
   * @param {DomainEvent} event 要添加的领域事件
   * @returns {void}
   * @throws {Error} 当事件为null或undefined时抛出错误
   * @protected
   *
   * @example
   * ```typescript
   * // 在业务方法中添加事件
   * createUser(email: string, tenantId: string): void {
   *   // 执行业务逻辑
   *   const user = new User(email, tenantId);
   *
   *   // 添加领域事件
   *   this.addDomainEvent(new UserCreatedEvent(user.id, email, tenantId));
   * }
   * ```
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * @method getDomainEvents
   * @description
   * 获取聚合根的所有未提交领域事件。此方法用于在事务提交前获取所有待处理的事件。
   *
   * 功能与职责：
   * 1. 返回聚合根当前收集的所有未提交事件
   * 2. 为事件存储和发布提供事件列表
   * 3. 支持事件驱动架构的事件处理流程
   * 4. 确保事件在事务边界内被正确处理
   *
   * 使用场景：
   * 1. 事务提交前获取所有待处理事件
   * 2. 事件存储服务保存事件到数据库
   * 3. 事件总线发布事件到消息队列
   * 4. 事件处理器处理业务逻辑
   *
   * @returns {DomainEvent[]} 未提交的领域事件列表，返回副本以避免外部修改
   *
   * @example
   * ```typescript
   * // 在事务提交前获取事件
   * const events = aggregate.getDomainEvents();
   *
   * // 保存到事件存储
   * await eventStore.saveEvents(aggregateId, events, expectedVersion);
   *
   * // 发布到事件总线
   * await eventBus.publishAll(events);
   *
   * // 标记事件已提交
   * aggregate.markEventsAsCommitted();
   * ```
   */
  public getDomainEvents(): DomainEvent[] {
    return [...this.domainEvents]; // 返回副本以避免外部修改
  }

  /**
   * @method clearDomainEvents
   * @description
   * 清除聚合根的所有未提交领域事件。此方法用于在事件处理完成后清理内部事件列表。
   *
   * 功能与职责：
   * 1. 清空聚合根内部的未提交事件列表
   * 2. 释放事件对象占用的内存空间
   * 3. 为下一次业务操作准备干净的状态
   * 4. 防止事件重复处理
   *
   * 使用场景：
   * 1. 事件成功保存到事件存储后
   * 2. 事件成功发布到消息队列后
   * 3. 事务提交成功后
   * 4. 聚合根状态重置时
   *
   * 注意事项：
   * 1. 只有在确认事件已正确处理后才能调用此方法
   * 2. 调用后无法恢复已清除的事件
   * 3. 建议在事务提交成功后调用
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * // 在事件处理完成后清除事件
   * try {
   *   const events = aggregate.getDomainEvents();
   *   await eventStore.saveEvents(aggregateId, events, expectedVersion);
   *   await eventBus.publishAll(events);
   *
   *   // 事件处理成功，清除事件列表
   *   aggregate.clearDomainEvents();
   * } catch (error) {
   *   // 事件处理失败，保留事件列表以便重试
   *   throw error;
   * }
   * ```
   */
  public clearDomainEvents(): void {
    this.domainEvents = [];
  }

  /**
   * @method markEventsAsCommitted
   * @description
   * 标记所有未提交事件为已提交状态。此方法用于在事件成功处理后更新聚合根的状态。
   *
   * 功能与职责：
   * 1. 标记聚合根的所有事件为已提交状态
   * 2. 清除内部未提交事件列表
   * 3. 更新聚合根的内部状态
   * 4. 为下一次业务操作准备干净的状态
   *
   * 使用场景：
   * 1. 事件成功保存到事件存储后
   * 2. 事件成功发布到消息队列后
   * 3. 事务成功提交后
   * 4. 聚合根状态同步完成后
   *
   * 与clearDomainEvents的区别：
   * 1. markEventsAsCommitted语义更明确，表示事件已成功处理
   * 2. clearDomainEvents只是清除事件，不表示处理状态
   * 3. 建议在事件处理成功后使用markEventsAsCommitted
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * // 在事件处理成功后标记为已提交
   * try {
   *   const events = aggregate.getDomainEvents();
   *   await eventStore.saveEvents(aggregateId, events, expectedVersion);
   *   await eventBus.publishAll(events);
   *
   *   // 标记事件已提交
   *   aggregate.markEventsAsCommitted();
   * } catch (error) {
   *   // 事件处理失败，不标记为已提交
   *   throw error;
   * }
   * ```
   */
  public markEventsAsCommitted(): void {
    this.clearDomainEvents();
  }
}
