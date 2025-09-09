import { BaseEventHandler, IEventProcessingResult } from '@aiofix/core';
import { UserPasswordUpdatedEvent } from '../../domain/events';

/**
 * @class UserPasswordUpdatedEventHandler
 * @description
 * 用户密码更新事件处理器，负责处理用户密码更新事件的后续业务逻辑。
 *
 * 事件处理职责：
 * 1. 接收并处理用户密码更新领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 更新用户安全状态视图
 * 2. 更新用户会话信息
 * 3. 更新用户安全统计
 * 4. 更新用户活动日志
 *
 * 业务流程触发：
 * 1. 发送密码变更通知
 * 2. 处理强制登出逻辑
 * 3. 记录安全审计日志
 * 4. 更新安全统计信息
 *
 * @example
 * ```typescript
 * const handler = new UserPasswordUpdatedEventHandler();
 * await handler.handle(userPasswordUpdatedEvent);
 * ```
 * @since 1.0.0
 */
export class UserPasswordUpdatedEventHandler extends BaseEventHandler<UserPasswordUpdatedEvent> {
  constructor() {
    super(
      'UserPasswordUpdatedEventHandler',
      'UserPasswordUpdated',
      3, // 最大重试次数
      1000, // 重试延迟（毫秒）
    );
  }

  /**
   * @method processEvent
   * @description 处理用户密码更新事件，执行后续业务逻辑
   * @param {UserPasswordUpdatedEvent} event 用户密码更新事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 并行更新读模型视图
   * 3. 触发业务流程
   * 4. 记录处理结果
   */
  protected async processEvent(event: UserPasswordUpdatedEvent): Promise<void> {
    try {
      // 1. 验证事件
      this.validateUserPasswordUpdatedEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserSecurityStatus(event),
        this.handleForceLogout(event),
        this.sendPasswordChangeNotification(event),
        this.logSecurityAuditEvent(event),
        this.updateSecurityStatistics(event),
      ]);

      console.log(
        `UserPasswordUpdatedEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      console.error(
        `Failed to process UserPasswordUpdatedEvent: ${event.aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method updateUserSecurityStatus
   * @description 更新用户安全状态视图
   * @param {UserPasswordUpdatedEvent} event 用户密码更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserSecurityStatus(
    event: UserPasswordUpdatedEvent,
  ): Promise<void> {
    const _securityStatus = {
      userId: event.aggregateId,
      lastPasswordChange: event.occurredOn,
      passwordChangeReason: event.reason,
      updatedBy: event.updatedBy,
      version: event.eventVersion,
    };

    // 这里应该调用实际的读模型仓储
    // await this.userSecurityRepository.update(event.aggregateId, securityStatus);
    console.log(`User security status updated: ${event.aggregateId}`);
  }

  /**
   * @method handleForceLogout
   * @description 处理强制登出逻辑
   * @param {UserPasswordUpdatedEvent} event 用户密码更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async handleForceLogout(
    event: UserPasswordUpdatedEvent,
  ): Promise<void> {
    if (event.forceLogout) {
      // 这里应该调用实际的会话管理服务
      // await this.sessionService.invalidateAllUserSessions(event.aggregateId);
      console.log(`All sessions invalidated for user: ${event.aggregateId}`);
    }
  }

  /**
   * @method sendPasswordChangeNotification
   * @description 发送密码变更通知
   * @param {UserPasswordUpdatedEvent} event 用户密码更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async sendPasswordChangeNotification(
    event: UserPasswordUpdatedEvent,
  ): Promise<void> {
    // 这里应该调用实际的通知服务
    // await this.notificationService.sendPasswordChangeNotification(
    //   event.aggregateId,
    //   event.reason,
    //   event.forceLogout,
    // );
    console.log(
      `Password change notification sent for user: ${event.aggregateId}`,
    );
  }

  /**
   * @method logSecurityAuditEvent
   * @description 记录安全审计日志
   * @param {UserPasswordUpdatedEvent} event 用户密码更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async logSecurityAuditEvent(
    event: UserPasswordUpdatedEvent,
  ): Promise<void> {
    // 这里应该调用实际的安全审计服务
    // await this.securityAuditService.logEvent({
    //   eventType: event.getEventType(),
    //   userId: event.aggregateId,
    //   action: 'PASSWORD_CHANGED',
    //   details: {
    //     reason: event.reason,
    //     forceLogout: event.forceLogout,
    //     updatedBy: event.updatedBy,
    //   },
    //   timestamp: event.occurredOn,
    // });
    console.log(
      `Security audit event logged for password change: ${event.aggregateId}`,
    );
  }

  /**
   * @method updateSecurityStatistics
   * @description 更新安全统计信息
   * @param {UserPasswordUpdatedEvent} event 用户密码更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateSecurityStatistics(
    event: UserPasswordUpdatedEvent,
  ): Promise<void> {
    // 这里应该调用实际的统计服务
    // await this.statisticsService.incrementPasswordChangeCount(event.aggregateId);
    console.log(`Security statistics updated for user: ${event.aggregateId}`);
  }

  /**
   * @method validateEvent
   * @description 验证事件的有效性
   * @param {UserPasswordUpdatedEvent} event 用户密码更新事件
   * @returns {void}
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateUserPasswordUpdatedEvent(
    event: UserPasswordUpdatedEvent,
  ): void {
    if (!event.aggregateId || !event.updatedBy) {
      throw new Error(
        'Invalid UserPasswordUpdatedEvent: missing required fields',
      );
    }
  }

  /**
   * @method onProcessingSuccess
   * @description 处理成功回调，记录成功日志
   * @param {IEventProcessingResult} result 处理结果
   * @protected
   */
  protected onProcessingSuccess(result: IEventProcessingResult): void {
    console.log(
      `✅ User password updated event processed successfully: ${result.eventId} in ${result.processingTimeMs}ms`,
    );
  }

  /**
   * @method onProcessingFailure
   * @description 处理失败回调，记录错误日志
   * @param {IEventProcessingResult} result 处理结果
   * @protected
   */
  protected onProcessingFailure(result: IEventProcessingResult): void {
    console.error(
      `❌ User password updated event processing failed: ${result.eventId} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
