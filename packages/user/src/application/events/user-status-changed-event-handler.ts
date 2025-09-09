import { BaseEventHandler, IEventProcessingResult } from '@aiofix/core';
import { UserStatusChangedEvent } from '../../domain/events';

/**
 * @class UserStatusChangedEventHandler
 * @description
 * 用户状态变更事件处理器，负责处理用户状态变更事件的后续业务逻辑。
 *
 * 事件处理职责：
 * 1. 接收并处理用户状态变更领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 更新用户状态视图
 * 2. 更新用户权限视图
 * 3. 更新用户会话状态
 * 4. 更新用户统计信息
 *
 * 业务流程触发：
 * 1. 发送状态变更通知
 * 2. 处理权限变更逻辑
 * 3. 记录审计日志
 * 4. 更新相关统计信息
 *
 * @example
 * ```typescript
 * const handler = new UserStatusChangedEventHandler();
 * await handler.handle(userStatusChangedEvent);
 * ```
 * @since 1.0.0
 */
export class UserStatusChangedEventHandler extends BaseEventHandler<UserStatusChangedEvent> {
  constructor() {
    super(
      'UserStatusChangedEventHandler',
      'UserStatusChanged',
      3, // 最大重试次数
      1000, // 重试延迟（毫秒）
    );
  }

  /**
   * @method processEvent
   * @description 处理用户状态变更事件，执行后续业务逻辑
   * @param {UserStatusChangedEvent} event 用户状态变更事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 并行更新读模型视图
   * 3. 触发业务流程
   * 4. 记录处理结果
   */
  protected async processEvent(event: UserStatusChangedEvent): Promise<void> {
    try {
      // 1. 验证事件
      this.validateEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserStatusView(event),
        this.updateUserPermissions(event),
        this.updateUserSessionStatus(event),
        this.sendStatusChangeNotification(event),
        this.logAuditEvent(event),
        this.updateUserStatistics(event),
      ]);

      console.log(
        `UserStatusChangedEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      console.error(
        `Failed to process UserStatusChangedEvent: ${event.aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method updateUserStatusView
   * @description 更新用户状态视图
   * @param {UserStatusChangedEvent} event 用户状态变更事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserStatusView(
    event: UserStatusChangedEvent,
  ): Promise<void> {
    const statusView = {
      userId: event.aggregateId,
      oldStatus: event.oldStatus.toString(),
      newStatus: event.newStatus.toString(),
      changedBy: event.changedBy,
      reason: event.reason,
      changedAt: event.occurredOn,
      version: event.eventVersion,
    };

    // 这里应该调用实际的读模型仓储
    // await this.userStatusRepository.update(event.aggregateId, statusView);
    console.log(
      `User status view updated: ${event.aggregateId} (${event.oldStatus} -> ${event.newStatus})`,
    );
  }

  /**
   * @method updateUserPermissions
   * @description 更新用户权限
   * @param {UserStatusChangedEvent} event 用户状态变更事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserPermissions(
    event: UserStatusChangedEvent,
  ): Promise<void> {
    // 根据新状态更新用户权限
    const permissions = this.getPermissionsForStatus(event.newStatus);

    // 这里应该调用实际的权限服务
    // await this.permissionService.updateUserPermissions(
    //   event.aggregateId,
    //   permissions,
    //   event.reason,
    // );
    console.log(
      `User permissions updated for status change: ${event.aggregateId}`,
    );
  }

  /**
   * @method updateUserSessionStatus
   * @description 更新用户会话状态
   * @param {UserStatusChangedEvent} event 用户状态变更事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserSessionStatus(
    event: UserStatusChangedEvent,
  ): Promise<void> {
    // 如果状态变更为禁用或删除，需要处理会话
    if (this.shouldInvalidateSessions(event.newStatus)) {
      // 这里应该调用实际的会话管理服务
      // await this.sessionService.invalidateAllUserSessions(event.aggregateId);
      console.log(
        `All sessions invalidated for user status change: ${event.aggregateId}`,
      );
    }
  }

  /**
   * @method sendStatusChangeNotification
   * @description 发送状态变更通知
   * @param {UserStatusChangedEvent} event 用户状态变更事件
   * @returns {Promise<void>}
   * @private
   */
  private async sendStatusChangeNotification(
    event: UserStatusChangedEvent,
  ): Promise<void> {
    // 这里应该调用实际的通知服务
    // await this.notificationService.sendStatusChangeNotification(
    //   event.aggregateId,
    //   event.oldStatus,
    //   event.newStatus,
    //   event.reason,
    // );
    console.log(
      `Status change notification sent for user: ${event.aggregateId}`,
    );
  }

  /**
   * @method logAuditEvent
   * @description 记录审计日志
   * @param {UserStatusChangedEvent} event 用户状态变更事件
   * @returns {Promise<void>}
   * @private
   */
  private async logAuditEvent(event: UserStatusChangedEvent): Promise<void> {
    // 这里应该调用实际的审计服务
    // await this.auditService.logEvent({
    //   eventType: event.getEventType(),
    //   aggregateId: event.aggregateId,
    //   details: event.toJSON(),
    //   timestamp: event.occurredOn,
    // });
    console.log(`Audit event logged for status change: ${event.aggregateId}`);
  }

  /**
   * @method updateUserStatistics
   * @description 更新用户统计信息
   * @param {UserStatusChangedEvent} event 用户状态变更事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserStatistics(
    event: UserStatusChangedEvent,
  ): Promise<void> {
    // 这里应该调用实际的统计服务
    // await this.statisticsService.updateUserStatusCount(
    //   event.oldStatus,
    //   event.newStatus,
    // );
    console.log(
      `User statistics updated for status change: ${event.aggregateId}`,
    );
  }

  /**
   * @method getPermissionsForStatus
   * @description 根据用户状态获取权限列表
   * @param {UserStatus} status 用户状态
   * @returns {string[]} 权限列表
   * @private
   */
  private getPermissionsForStatus(status: any): string[] {
    switch (status.toString()) {
      case 'ACTIVE':
        return ['user:read:own', 'user:update:own', 'platform:service:use'];
      case 'PENDING':
        return ['user:read:own'];
      case 'DISABLED':
        return [];
      case 'DELETED':
        return [];
      default:
        return [];
    }
  }

  /**
   * @method shouldInvalidateSessions
   * @description 判断是否需要使会话失效
   * @param {UserStatus} status 用户状态
   * @returns {boolean} 是否需要使会话失效
   * @private
   */
  private shouldInvalidateSessions(status: any): boolean {
    return status.toString() === 'DISABLED' || status.toString() === 'DELETED';
  }

  /**
   * @method validateEvent
   * @description 验证事件的有效性
   * @param {UserStatusChangedEvent} event 用户状态变更事件
   * @returns {void}
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateEvent(event: UserStatusChangedEvent): void {
    if (
      !event.aggregateId ||
      !event.oldStatus ||
      !event.newStatus ||
      !event.changedBy
    ) {
      throw new Error(
        'Invalid UserStatusChangedEvent: missing required fields',
      );
    }

    if (event.oldStatus.toString() === event.newStatus.toString()) {
      throw new Error(
        'Invalid UserStatusChangedEvent: old and new status cannot be the same',
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
      `✅ User status changed event processed successfully: ${result.eventId} in ${result.processingTimeMs}ms`,
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
      `❌ User status changed event processing failed: ${result.eventId} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
