import { DomainEvent } from '../domain-event';

/**
 * @interface IEventHandler
 * @description 事件处理器接口，定义异步事件处理的标准方法
 *
 * 事件处理器职责：
 * 1. 接收并处理领域事件
 * 2. 执行事件相关的业务逻辑
 * 3. 处理事件处理的异常和重试
 * 4. 支持事件处理的幂等性
 *
 * 处理特性：
 * 1. 异步处理：支持异步事件处理
 * 2. 重试机制：支持失败重试和指数退避
 * 3. 幂等性：支持重复事件的安全处理
 * 4. 错误处理：提供完整的错误处理和恢复机制
 *
 * @template T 事件类型
 */
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * @method handle
   * @description 处理领域事件，执行相关的业务逻辑
   * @param {T} event 领域事件
   * @returns {Promise<void>} 处理结果
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 检查事件是否已处理（幂等性）
   * 3. 执行事件相关的业务逻辑
   * 4. 记录处理结果
   * 5. 处理异常和重试
   */
  handle(event: T): Promise<void>;

  /**
   * @method canHandle
   * @description 检查是否能处理指定类型的事件
   * @param {string} eventType 事件类型
   * @returns {boolean} 是否能处理
   */
  canHandle(eventType: string): boolean;

  /**
   * @method getEventType
   * @description 获取处理器支持的事件类型
   * @returns {string} 事件类型
   */
  getEventType(): string;

  /**
   * @method getHandlerName
   * @description 获取处理器名称
   * @returns {string} 处理器名称
   */
  getHandlerName(): string;
}

/**
 * @interface IEventProcessor
 * @description 事件处理器管理器接口，负责协调多个事件处理器
 *
 * 处理器管理职责：
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
 */
export interface IEventProcessor {
  /**
   * @method registerHandler
   * @description 注册事件处理器
   * @param {IEventHandler} handler 事件处理器
   * @returns {Promise<void>}
   * @throws {HandlerRegistrationError} 当处理器注册失败时抛出
   */
  registerHandler(handler: IEventHandler): Promise<void>;

  /**
   * @method unregisterHandler
   * @description 注销事件处理器
   * @param {string} handlerName 处理器名称
   * @returns {Promise<void>}
   * @throws {HandlerNotFoundError} 当处理器不存在时抛出
   */
  unregisterHandler(handlerName: string): Promise<void>;

  /**
   * @method processEvent
   * @description 处理领域事件
   * @param {DomainEvent} event 领域事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   */
  processEvent(event: DomainEvent): Promise<void>;

  /**
   * @method getHandlers
   * @description 获取所有注册的处理器
   * @returns {IEventHandler[]} 处理器列表
   */
  getHandlers(): IEventHandler[];

  /**
   * @method getHandler
   * @description 获取指定名称的处理器
   * @param {string} handlerName 处理器名称
   * @returns {IEventHandler | undefined} 处理器实例
   */
  getHandler(handlerName: string): IEventHandler | undefined;

  /**
   * @method getHandlersForEvent
   * @description 获取能处理指定事件类型的处理器
   * @param {string} eventType 事件类型
   * @returns {IEventHandler[]} 处理器列表
   */
  getHandlersForEvent(eventType: string): IEventHandler[];
}

/**
 * @interface IEventProcessingContext
 * @description 事件处理上下文接口，提供事件处理过程中的上下文信息
 *
 * 上下文信息：
 * 1. 事件处理状态
 * 2. 重试次数和配置
 * 3. 处理开始和结束时间
 * 4. 错误信息和堆栈
 * 5. 处理结果和统计
 */
export interface IEventProcessingContext {
  /**
   * @property {string} eventId 事件ID
   */
  readonly eventId: string;

  /**
   * @property {string} eventType 事件类型
   */
  readonly eventType: string;

  /**
   * @property {string} handlerName 处理器名称
   */
  readonly handlerName: string;

  /**
   * @property {Date} startTime 处理开始时间
   */
  readonly startTime: Date;

  /**
   * @property {Date} endTime 处理结束时间
   */
  endTime?: Date;

  /**
   * @property {number} retryCount 重试次数
   */
  retryCount: number;

  /**
   * @property {number} maxRetries 最大重试次数
   */
  readonly maxRetries: number;

  /**
   * @property {boolean} isSuccessful 是否处理成功
   */
  isSuccessful: boolean;

  /**
   * @property {Error} error 处理错误
   */
  error?: Error;

  /**
   * @property {Record<string, unknown>} metadata 处理元数据
   */
  readonly metadata: Record<string, unknown>;
}

/**
 * @interface IEventProcessingResult
 * @description 事件处理结果接口，封装事件处理的结果信息
 *
 * 结果信息：
 * 1. 处理状态和结果
 * 2. 处理时间和性能指标
 * 3. 错误信息和重试信息
 * 4. 处理统计和监控数据
 */
export interface IEventProcessingResult {
  /**
   * @property {boolean} success 是否处理成功
   */
  readonly success: boolean;

  /**
   * @property {string} eventId 事件ID
   */
  readonly eventId: string;

  /**
   * @property {string} eventType 事件类型
   */
  readonly eventType: string;

  /**
   * @property {string} handlerName 处理器名称
   */
  readonly handlerName: string;

  /**
   * @property {number} processingTimeMs 处理时间（毫秒）
   */
  readonly processingTimeMs: number;

  /**
   * @property {number} retryCount 重试次数
   */
  readonly retryCount: number;

  /**
   * @property {Error} error 处理错误
   */
  readonly error?: Error;

  /**
   * @property {Date} processedAt 处理完成时间
   */
  readonly processedAt: Date;

  /**
   * @property {Record<string, unknown>} metadata 处理元数据
   */
  readonly metadata: Record<string, unknown>;
}
