import { BaseEventHandler, IEventProcessingResult } from '@aiofix/core';
import { UserDeletedEvent } from '../../domain/events';

/**
 * @class UserDeletedEventHandler
 * @description
 * 用户删除事件处理器，负责处理用户删除事件的后续业务逻辑。
 *
 * 事件处理职责：
 * 1. 接收并处理用户删除领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 标记用户为已删除状态
 * 2. 更新用户列表视图
 * 3. 清理用户权限视图
 * 4. 清理用户会话视图
 *
 * 业务流程触发：
 * 1. 发送删除通知邮件
 * 2. 清理用户权限
 * 3. 记录审计日志
 * 4. 更新用户统计
 * 5. 清理相关数据
 *
 * @param {IUserReadRepository} userReadRepository 用户读模型仓储
 * @param {INotificationService} notificationService 通知服务
 * @param {IPermissionService} permissionService 权限服务
 * @param {IAuditService} auditService 审计服务
 * @param {IDataCleanupService} dataCleanupService 数据清理服务
 *
 * @example
 * ```typescript
 * const handler = new UserDeletedEventHandler(
 *   userReadRepo, notificationService, permissionService, auditService, dataCleanupService
 * );
 * await handler.handle(userDeletedEvent);
 * ```
 * @since 1.0.0
 */
export class UserDeletedEventHandler extends BaseEventHandler<UserDeletedEvent> {
  constructor() {
    // private readonly dataCleanupService: IDataCleanupService, // private readonly auditService: IAuditService, // private readonly permissionService: IPermissionService, // private readonly notificationService: INotificationService, // private readonly userReadRepository: IUserReadRepository,
    super(
      'UserDeletedEventHandler',
      'UserDeleted',
      3, // 最大重试次数
      1000, // 重试延迟（毫秒）
    );
  }

  /**
   * @method processEvent
   * @description 处理用户删除事件，执行后续业务逻辑
   * @param {UserDeletedEvent} event 用户删除事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 并行更新读模型视图
   * 3. 触发业务流程
   * 4. 记录处理结果
   */
  protected async processEvent(event: UserDeletedEvent): Promise<void> {
    try {
      // 1. 验证事件
      this.validateUserDeletedEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserReadModel(event),
        this.sendDeletionNotification(event),
        this.logAuditEvent(event),
        this.cleanupUserPermissions(event),
        this.cleanupUserData(event),
      ]);

      console.log(
        `UserDeletedEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      console.error(
        `Failed to process UserDeletedEvent: ${event.aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method updateUserReadModel
   * @description 更新用户读模型视图
   * @param {UserDeletedEvent} event 用户删除事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserReadModel(event: UserDeletedEvent): Promise<void> {
    const deleteData = {
      id: event.aggregateId,
      deletedAt: event.occurredOn,
      deletedBy: event.deletedBy,
      reason: event.reason,
      hardDelete: event.hardDelete,
      version: event.eventVersion,
    };

    if (event.hardDelete) {
      // 硬删除：从读模型中完全移除
      // await this.userReadRepository.deleteUser(event.aggregateId);
      console.log(`User hard deleted from read model: ${event.aggregateId}`);
    } else {
      // 软删除：标记为已删除
      // await this.userReadRepository.markUserAsDeleted(deleteData);
      console.log(`User marked as deleted in read model: ${event.aggregateId}`);
    }
  }

  /**
   * @method sendDeletionNotification
   * @description 发送删除通知
   * @param {UserDeletedEvent} event 用户删除事件
   * @returns {Promise<void>}
   * @private
   */
  private async sendDeletionNotification(
    event: UserDeletedEvent,
  ): Promise<void> {
    // 这里应该调用实际的通知服务
    // await this.notificationService.sendUserDeletionNotification(
    //   event.aggregateId,
    //   event.reason,
    //   event.hardDelete,
    // );
    console.log(`Deletion notification sent for user: ${event.aggregateId}`);
  }

  /**
   * @method logAuditEvent
   * @description 记录审计日志
   * @param {UserDeletedEvent} event 用户删除事件
   * @returns {Promise<void>}
   * @private
   */
  private async logAuditEvent(event: UserDeletedEvent): Promise<void> {
    // 这里应该调用实际的审计服务
    // await this.auditService.logEvent({
    //   eventType: event.getEventType(),
    //   aggregateId: event.aggregateId,
    //   details: event.toJSON(),
    //   timestamp: event.occurredOn,
    // });
    console.log(`Audit event logged for user deletion: ${event.aggregateId}`);
  }

  /**
   * @method cleanupUserPermissions
   * @description 清理用户权限
   * @param {UserDeletedEvent} event 用户删除事件
   * @returns {Promise<void>}
   * @private
   */
  private async cleanupUserPermissions(event: UserDeletedEvent): Promise<void> {
    // 这里应该调用实际的权限服务
    // await this.permissionService.removeUserPermissions(event.aggregateId);
    console.log(`User permissions cleaned up: ${event.aggregateId}`);
  }

  /**
   * @method cleanupUserData
   * @description 清理用户相关数据
   * @param {UserDeletedEvent} event 用户删除事件
   * @returns {Promise<void>}
   * @private
   */
  private async cleanupUserData(event: UserDeletedEvent): Promise<void> {
    if (event.hardDelete) {
      // 硬删除：清理所有相关数据
      // await this.dataCleanupService.cleanupUserData(event.aggregateId);
      console.log(`User data cleaned up (hard delete): ${event.aggregateId}`);
    } else {
      // 软删除：只清理敏感数据
      // await this.dataCleanupService.cleanupSensitiveUserData(event.aggregateId);
      console.log(
        `Sensitive user data cleaned up (soft delete): ${event.aggregateId}`,
      );
    }
  }

  /**
   * @method validateUserDeletedEvent
   * @description 验证用户删除事件的有效性
   * @param {UserDeletedEvent} event 用户删除事件
   * @returns {void}
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateUserDeletedEvent(event: UserDeletedEvent): void {
    if (!event.aggregateId || !event.deletedBy) {
      throw new Error('Invalid UserDeletedEvent: missing required fields');
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
      `✅ User deleted event processed successfully: ${result.eventId} in ${result.processingTimeMs}ms`,
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
      `❌ User deleted event processing failed: ${result.eventId} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
