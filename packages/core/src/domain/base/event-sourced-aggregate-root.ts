import { DomainEvent } from '../domain-event';

/**
 * @class EventSourcedAggregateRoot
 * @description 事件溯源聚合根基础类
 */
export abstract class EventSourcedAggregateRoot {
  private domainEvents: DomainEvent[] = [];

  /**
   * @method addDomainEvent
   * @description 添加领域事件
   * @param {DomainEvent} event 领域事件
   * @returns {void}
   * @protected
   */
  protected addDomainEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  /**
   * @method getDomainEvents
   * @description 获取未提交的领域事件
   * @returns {DomainEvent[]} 领域事件列表
   */
  public getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  /**
   * @method clearDomainEvents
   * @description 清除领域事件
   * @returns {void}
   */
  public clearDomainEvents(): void {
    this.domainEvents = [];
  }

  /**
   * @method markEventsAsCommitted
   * @description 标记事件为已提交
   * @returns {void}
   */
  public markEventsAsCommitted(): void {
    this.clearDomainEvents();
  }
}
