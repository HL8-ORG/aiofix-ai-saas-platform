import { DomainEvent } from '../domain-event';
import {
  IEventHandler,
  IEventProcessingContext,
  IEventProcessingResult,
} from '../interfaces/event-handler.interface';

/**
 * @class BaseEventHandler
 * @description 事件处理器基类，提供事件处理的基础功能和通用实现
 *
 * 基础功能：
 * 1. 事件处理的生命周期管理
 * 2. 重试机制和错误处理
 * 3. 处理统计和监控
 * 4. 幂等性支持
 *
 * 生命周期管理：
 * 1. 处理前验证：验证事件和处理器的有效性
 * 2. 处理中监控：监控处理状态和性能
 * 3. 处理后清理：清理资源和记录结果
 * 4. 异常处理：处理各种异常情况
 *
 * @template T 事件类型
 */
export abstract class BaseEventHandler<T extends DomainEvent = DomainEvent>
  implements IEventHandler<T>
{
  protected readonly handlerName: string;
  protected readonly eventType: string;
  protected readonly maxRetries: number;
  protected readonly retryDelayMs: number;

  constructor(
    handlerName: string,
    eventType: string,
    maxRetries: number = 3,
    retryDelayMs: number = 1000,
  ) {
    this.handlerName = handlerName;
    this.eventType = eventType;
    this.maxRetries = maxRetries;
    this.retryDelayMs = retryDelayMs;
  }

  /**
   * @method handle
   * @description 处理领域事件，执行完整的处理流程
   * @param {T} event 领域事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 创建处理上下文
   * 2. 验证事件和处理器
   * 3. 执行重试逻辑
   * 4. 记录处理结果
   * 5. 处理异常情况
   */
  async handle(event: T): Promise<void> {
    const context = this.createProcessingContext(event);

    try {
      // 验证事件和处理器
      this.validateEvent(event);
      this.validateHandler();

      // 执行重试逻辑
      await this.executeWithRetry(event, context);

      // 记录成功结果
      this.recordSuccess(context);
    } catch (error) {
      // 记录失败结果
      this.recordFailure(context, error as Error);
      throw error;
    }
  }

  /**
   * @method canHandle
   * @description 检查是否能处理指定类型的事件
   * @param {string} eventType 事件类型
   * @returns {boolean} 是否能处理
   */
  canHandle(eventType: string): boolean {
    return this.eventType === eventType;
  }

  /**
   * @method getEventType
   * @description 获取处理器支持的事件类型
   * @returns {string} 事件类型
   */
  getEventType(): string {
    return this.eventType;
  }

  /**
   * @method getHandlerName
   * @description 获取处理器名称
   * @returns {string} 处理器名称
   */
  getHandlerName(): string {
    return this.handlerName;
  }

  /**
   * @method processEvent
   * @description 处理事件的核心业务逻辑，由子类实现
   * @param {T} event 领域事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 实现要求：
   * 1. 子类必须实现此方法
   * 2. 方法应该是幂等的
   * 3. 应该处理所有可能的异常情况
   * 4. 应该提供详细的错误信息
   */
  protected abstract processEvent(event: T): Promise<void>;

  /**
   * @method createProcessingContext
   * @description 创建事件处理上下文
   * @param {T} event 领域事件
   * @returns {IEventProcessingContext} 处理上下文
   * @private
   */
  private createProcessingContext(event: T): IEventProcessingContext {
    return {
      eventId: event.aggregateId,
      eventType: event.getEventType(),
      handlerName: this.handlerName,
      startTime: new Date(),
      retryCount: 0,
      maxRetries: this.maxRetries,
      isSuccessful: false,
      metadata: {},
    };
  }

  /**
   * @method executeWithRetry
   * @description 执行带重试的事件处理
   * @param {T} event 领域事件
   * @param {IEventProcessingContext} context 处理上下文
   * @returns {Promise<void>}
   * @private
   */
  private async executeWithRetry(
    event: T,
    context: IEventProcessingContext,
  ): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      context.retryCount = attempt;

      try {
        // 执行事件处理
        await this.processEvent(event);

        // 处理成功，跳出重试循环
        context.isSuccessful = true;
        context.endTime = new Date();
        return;
      } catch (error) {
        lastError = error as Error;
        context.error = lastError;

        // 如果不是最后一次尝试，等待后重试
        if (attempt < this.maxRetries) {
          await this.delay(this.calculateRetryDelay(attempt));
        }
      }
    }

    // 所有重试都失败，抛出最后一个错误
    context.endTime = new Date();
    throw lastError ?? new Error('Event processing failed after all retries');
  }

  /**
   * @method calculateRetryDelay
   * @description 计算重试延迟时间（指数退避）
   * @param {number} attempt 当前尝试次数
   * @returns {number} 延迟时间（毫秒）
   * @private
   */
  private calculateRetryDelay(attempt: number): number {
    return this.retryDelayMs * Math.pow(2, attempt);
  }

  /**
   * @method delay
   * @description 延迟执行
   * @param {number} ms 延迟时间（毫秒）
   * @returns {Promise<void>}
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * @method validateEvent
   * @description 验证事件的有效性
   * @param {T} event 领域事件
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateEvent(event: T): void {
    if (!event.aggregateId) {
      throw new Error('Event must have an aggregateId');
    }

    if (!event.getEventType()) {
      throw new Error('Event must have an event type');
    }

    if (event.getEventType() !== this.eventType) {
      throw new Error(
        `Event type ${event.getEventType()} does not match handler type ${this.eventType}`,
      );
    }
  }

  /**
   * @method validateHandler
   * @description 验证处理器的有效性
   * @throws {ValidationError} 当处理器无效时抛出
   * @private
   */
  private validateHandler(): void {
    if (!this.handlerName) {
      throw new Error('Handler name cannot be empty');
    }

    if (!this.eventType) {
      throw new Error('Event type cannot be empty');
    }
  }

  /**
   * @method recordSuccess
   * @description 记录处理成功结果
   * @param {IEventProcessingContext} context 处理上下文
   * @private
   */
  private recordSuccess(context: IEventProcessingContext): void {
    const result: IEventProcessingResult = {
      success: true,
      eventId: context.eventId,
      eventType: context.eventType,
      handlerName: context.handlerName,
      processingTimeMs: context.endTime
        ? context.endTime.getTime() - context.startTime.getTime()
        : 0,
      retryCount: context.retryCount,
      processedAt: context.endTime ?? new Date(),
      metadata: context.metadata,
    };

    this.onProcessingSuccess(result);
  }

  /**
   * @method recordFailure
   * @description 记录处理失败结果
   * @param {IEventProcessingContext} context 处理上下文
   * @param {Error} error 错误信息
   * @private
   */
  private recordFailure(context: IEventProcessingContext, error: Error): void {
    const result: IEventProcessingResult = {
      success: false,
      eventId: context.eventId,
      eventType: context.eventType,
      handlerName: context.handlerName,
      processingTimeMs: context.endTime
        ? context.endTime.getTime() - context.startTime.getTime()
        : 0,
      retryCount: context.retryCount,
      error,
      processedAt: context.endTime ?? new Date(),
      metadata: context.metadata,
    };

    this.onProcessingFailure(result);
  }

  /**
   * @method onProcessingSuccess
   * @description 处理成功回调，由子类重写以添加自定义逻辑
   * @param {IEventProcessingResult} result 处理结果
   * @protected
   */
  protected onProcessingSuccess(result: IEventProcessingResult): void {
    // 默认实现：记录日志
    console.log(
      `Event processing succeeded: ${result.eventType} by ${result.handlerName} in ${result.processingTimeMs}ms`,
    );
  }

  /**
   * @method onProcessingFailure
   * @description 处理失败回调，由子类重写以添加自定义逻辑
   * @param {IEventProcessingResult} result 处理结果
   * @protected
   */
  protected onProcessingFailure(result: IEventProcessingResult): void {
    // 默认实现：记录错误日志
    console.error(
      `Event processing failed: ${result.eventType} by ${result.handlerName} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
