import { DomainEvent } from '../domain-event';
import {
  IEventHandler,
  IEventProcessor,
} from '../interfaces/event-handler.interface';

/**
 * @class EventProcessorService
 * @description 事件处理器管理器服务，负责协调多个事件处理器的注册、路由和管理
 *
 * 服务职责：
 * 1. 注册和管理事件处理器
 * 2. 路由事件到相应的处理器
 * 3. 监控事件处理状态
 * 4. 提供事件处理的统计信息
 *
 * 管理特性：
 * 1. 动态注册：支持运行时注册和注销处理器
 * 2. 事件路由：根据事件类型自动路由到相应处理器
 * 3. 并发处理：支持多个事件的并发处理
 * 4. 监控统计：提供处理器的性能统计和监控
 *
 * @param {Map<string, IEventHandler>} handlers 处理器映射表
 * @param {Map<string, IEventHandler[]>} eventTypeHandlers 事件类型到处理器的映射
 *
 * @example
 * ```typescript
 * const eventProcessor = new EventProcessorService();
 *
 * // 注册处理器
 * await eventProcessor.registerHandler(new UserCreatedEventHandler());
 *
 * // 处理事件
 * await eventProcessor.processEvent(userCreatedEvent);
 * ```
 * @since 1.0.0
 */
export class EventProcessorService implements IEventProcessor {
  private readonly handlers: Map<string, IEventHandler> = new Map();
  private readonly eventTypeHandlers: Map<string, IEventHandler[]> = new Map();

  /**
   * @method registerHandler
   * @description 注册事件处理器
   * @param {IEventHandler} handler 事件处理器
   * @returns {Promise<void>}
   * @throws {HandlerRegistrationError} 当处理器注册失败时抛出
   *
   * 注册流程：
   * 1. 验证处理器的有效性
   * 2. 检查处理器名称是否已存在
   * 3. 注册处理器到映射表
   * 4. 更新事件类型映射
   * 5. 记录注册日志
   */
  async registerHandler(handler: IEventHandler): Promise<void> {
    try {
      // 1. 验证处理器
      this.validateHandler(handler);

      // 2. 检查名称冲突
      if (this.handlers.has(handler.getHandlerName())) {
        throw new Error(
          `Handler with name '${handler.getHandlerName()}' is already registered`,
        );
      }

      // 3. 注册处理器
      this.handlers.set(handler.getHandlerName(), handler);

      // 4. 更新事件类型映射
      const eventType = handler.getEventType();
      if (!this.eventTypeHandlers.has(eventType)) {
        this.eventTypeHandlers.set(eventType, []);
      }
      this.eventTypeHandlers.get(eventType)!.push(handler);

      // 5. 记录注册日志
      console.log(
        `Event handler registered: ${handler.getHandlerName()} for event type: ${eventType}`,
      );
    } catch (error) {
      throw new Error(
        `Failed to register handler '${handler.getHandlerName()}': ${(error as Error).message}`,
      );
    }
  }

  /**
   * @method unregisterHandler
   * @description 注销事件处理器
   * @param {string} handlerName 处理器名称
   * @returns {Promise<void>}
   * @throws {HandlerNotFoundError} 当处理器不存在时抛出
   *
   * 注销流程：
   * 1. 检查处理器是否存在
   * 2. 从映射表中移除处理器
   * 3. 更新事件类型映射
   * 4. 记录注销日志
   */
  async unregisterHandler(handlerName: string): Promise<void> {
    try {
      // 1. 检查处理器是否存在
      const handler = this.handlers.get(handlerName);
      if (!handler) {
        throw new Error(`Handler with name '${handlerName}' is not registered`);
      }

      // 2. 从映射表中移除处理器
      this.handlers.delete(handlerName);

      // 3. 更新事件类型映射
      const eventType = handler.getEventType();
      const handlers = this.eventTypeHandlers.get(eventType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }

        // 如果没有处理器了，移除事件类型映射
        if (handlers.length === 0) {
          this.eventTypeHandlers.delete(eventType);
        }
      }

      // 4. 记录注销日志
      console.log(
        `Event handler unregistered: ${handlerName} for event type: ${eventType}`,
      );
    } catch (error) {
      throw new Error(
        `Failed to unregister handler '${handlerName}': ${(error as Error).message}`,
      );
    }
  }

  /**
   * @method processEvent
   * @description 处理领域事件
   * @param {DomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 查找能处理该事件的处理器
   * 3. 并发执行所有处理器
   * 4. 收集处理结果
   * 5. 处理异常情况
   */
  async processEvent(event: DomainEvent): Promise<void> {
    try {
      // 1. 验证事件
      this.validateEvent(event);

      // 2. 查找处理器
      const handlers = this.getHandlersForEvent(event.getEventType());
      if (handlers.length === 0) {
        console.warn(
          `No handlers found for event type: ${event.getEventType()}`,
        );
        return;
      }

      // 3. 并发执行所有处理器
      const processingPromises = handlers.map(handler =>
        this.executeHandler(handler, event),
      );

      // 4. 等待所有处理器完成
      await Promise.allSettled(processingPromises);

      // 5. 记录处理日志
      console.log(
        `Event processed: ${event.getEventType()} by ${handlers.length} handlers`,
      );
    } catch (error) {
      throw new Error(
        `Failed to process event '${event.getEventType()}': ${(error as Error).message}`,
      );
    }
  }

  /**
   * @method getHandlers
   * @description 获取所有注册的处理器
   * @returns {IEventHandler[]} 处理器列表
   */
  getHandlers(): IEventHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * @method getHandler
   * @description 获取指定名称的处理器
   * @param {string} handlerName 处理器名称
   * @returns {IEventHandler | undefined} 处理器实例
   */
  getHandler(handlerName: string): IEventHandler | undefined {
    return this.handlers.get(handlerName);
  }

  /**
   * @method getHandlersForEvent
   * @description 获取能处理指定事件类型的处理器
   * @param {string} eventType 事件类型
   * @returns {IEventHandler[]} 处理器列表
   */
  getHandlersForEvent(eventType: string): IEventHandler[] {
    return this.eventTypeHandlers.get(eventType) ?? [];
  }

  /**
   * @method getEventTypes
   * @description 获取所有支持的事件类型
   * @returns {string[]} 事件类型列表
   */
  getEventTypes(): string[] {
    return Array.from(this.eventTypeHandlers.keys());
  }

  /**
   * @method getHandlerCount
   * @description 获取注册的处理器数量
   * @returns {number} 处理器数量
   */
  getHandlerCount(): number {
    return this.handlers.size;
  }

  /**
   * @method clearHandlers
   * @description 清空所有注册的处理器
   * @returns {void}
   */
  clearHandlers(): void {
    this.handlers.clear();
    this.eventTypeHandlers.clear();
    console.log('All event handlers cleared');
  }

  /**
   * @method executeHandler
   * @description 执行单个处理器
   * @param {IEventHandler} handler 事件处理器
   * @param {DomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @private
   */
  private async executeHandler(
    handler: IEventHandler,
    event: DomainEvent,
  ): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error(
        `Handler '${handler.getHandlerName()}' failed to process event '${event.getEventType()}':`,
        error,
      );
      // 不重新抛出错误，让其他处理器继续执行
    }
  }

  /**
   * @method validateHandler
   * @description 验证处理器的有效性
   * @param {IEventHandler} handler 事件处理器
   * @throws {ValidationError} 当处理器无效时抛出
   * @private
   */
  private validateHandler(handler: IEventHandler): void {
    if (!handler.getHandlerName()) {
      throw new Error('Handler name cannot be empty');
    }

    if (!handler.getEventType()) {
      throw new Error('Handler event type cannot be empty');
    }

    if (typeof handler.handle !== 'function') {
      throw new Error('Handler must implement handle method');
    }

    if (typeof handler.canHandle !== 'function') {
      throw new Error('Handler must implement canHandle method');
    }
  }

  /**
   * @method validateEvent
   * @description 验证事件的有效性
   * @param {DomainEvent} event 领域事件
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateEvent(event: DomainEvent): void {
    if (!event.aggregateId) {
      throw new Error('Event must have an aggregateId');
    }

    if (!event.getEventType()) {
      throw new Error('Event must have an event type');
    }
  }
}
