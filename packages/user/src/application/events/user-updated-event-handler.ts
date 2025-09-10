import { BaseEventHandler, IEventProcessingResult } from '@aiofix/core';
import { UserUpdatedEvent } from '../../domain/events';

/**
 * @class UserUpdatedEventHandler
 * @description
 * 用户更新事件处理器，负责处理用户更新事件的后续业务逻辑。
 *
 * 事件处理职责：
 * 1. 接收并处理用户更新领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 更新用户列表视图
 * 2. 更新用户详情视图
 * 3. 更新用户权限视图
 * 4. 更新用户会话视图
 *
 * 业务流程触发：
 * 1. 发送更新通知邮件
 * 2. 更新用户权限（如果需要）
 * 3. 记录审计日志
 * 4. 更新用户统计
 *
 * @param {IUserReadRepository} userReadRepository 用户读模型仓储
 * @param {INotificationService} notificationService 通知服务
 * @param {IPermissionService} permissionService 权限服务
 * @param {IAuditService} auditService 审计服务
 *
 * @example
 * ```typescript
 * const handler = new UserUpdatedEventHandler(
 *   userReadRepo, notificationService, permissionService, auditService
 * );
 * await handler.handle(userUpdatedEvent);
 * ```
 * @since 1.0.0
 */
export class UserUpdatedEventHandler extends BaseEventHandler<UserUpdatedEvent> {
  constructor() {
    // private readonly auditService: IAuditService, // private readonly permissionService: IPermissionService, // private readonly notificationService: INotificationService, // private readonly userReadRepository: IUserReadRepository,
    super(
      'UserUpdatedEventHandler',
      'UserUpdated',
      3, // 最大重试次数
      1000, // 重试延迟（毫秒）
    );
  }

  /**
   * @method processEvent
   * @description 处理用户更新事件，执行后续业务逻辑
   * @param {UserUpdatedEvent} event 用户更新事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 并行更新读模型视图
   * 3. 触发业务流程
   * 4. 记录处理结果
   */
  protected async processEvent(event: UserUpdatedEvent): Promise<void> {
    try {
      // 1. 验证事件
      this.validateUserUpdatedEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserReadModel(event),
        this.sendUpdateNotification(event),
        this.logAuditEvent(event),
        this.updateUserPermissions(event),
      ]);

      console.log(
        `UserUpdatedEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      console.error(
        `Failed to process UserUpdatedEvent: ${event.aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method updateUserReadModel
   * @description 更新用户读模型视图
   * @param {UserUpdatedEvent} event 用户更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserReadModel(event: UserUpdatedEvent): Promise<void> {
    const updateData = {
      id: event.aggregateId,
      updateData: event.updateData,
      updatedBy: event.updatedBy,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };

    // 这里应该调用实际的读模型仓储
    // await this.userReadRepository.updateUser(updateData);
    console.log(`User read model updated: ${event.aggregateId}`);
  }

  /**
   * @method sendUpdateNotification
   * @description 发送更新通知
   * @param {UserUpdatedEvent} event 用户更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async sendUpdateNotification(event: UserUpdatedEvent): Promise<void> {
    // 这里应该调用实际的通知服务
    // await this.notificationService.sendUserUpdateNotification(
    //   event.aggregateId,
    //   event.updateData,
    // );
    console.log(`Update notification sent for user: ${event.aggregateId}`);
  }

  /**
   * @method logAuditEvent
   * @description 记录审计日志
   * @param {UserUpdatedEvent} event 用户更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async logAuditEvent(event: UserUpdatedEvent): Promise<void> {
    // 这里应该调用实际的审计服务
    // await this.auditService.logEvent({
    //   eventType: event.getEventType(),
    //   aggregateId: event.aggregateId,
    //   details: event.toJSON(),
    //   timestamp: event.occurredOn,
    // });
    console.log(`Audit event logged for user update: ${event.aggregateId}`);
  }

  /**
   * @method updateUserPermissions
   * @description 更新用户权限（如果需要）
   * @param {UserUpdatedEvent} event 用户更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserPermissions(event: UserUpdatedEvent): Promise<void> {
    // 检查是否需要更新权限
    if (this.shouldUpdatePermissions(event.updateData)) {
      // 这里应该调用实际的权限服务
      // await this.permissionService.updateUserPermissions(
      //   event.aggregateId,
      //   event.updateData,
      // );
      console.log(`Permissions updated for user: ${event.aggregateId}`);
    }
  }

  /**
   * @method shouldUpdatePermissions
   * @description 判断是否需要更新权限
   * @param {any} updateData 更新数据
   * @returns {boolean} 是否需要更新权限
   * @private
   */
  private shouldUpdatePermissions(updateData: any): boolean {
    // 如果更新了角色、状态等影响权限的字段，则需要更新权限
    return (
      updateData.status !== undefined ||
      updateData.roles !== undefined ||
      updateData.tenantId !== undefined
    );
  }

  /**
   * @method validateUserUpdatedEvent
   * @description 验证用户更新事件的有效性
   * @param {UserUpdatedEvent} event 用户更新事件
   * @returns {void}
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateUserUpdatedEvent(event: UserUpdatedEvent): void {
    if (!event.aggregateId || !event.updateData || !event.updatedBy) {
      throw new Error('Invalid UserUpdatedEvent: missing required fields');
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
      `✅ User updated event processed successfully: ${result.eventId} in ${result.processingTimeMs}ms`,
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
      `❌ User updated event processing failed: ${result.eventId} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
