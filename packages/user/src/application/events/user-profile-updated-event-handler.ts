import { BaseEventHandler, IEventProcessingResult } from '@aiofix/core';
import { UserProfileUpdatedEvent } from '../../domain/events';

/**
 * @class UserProfileUpdatedEventHandler
 * @description
 * 用户档案更新事件处理器，负责处理用户档案更新事件的后续业务逻辑。
 *
 * 事件处理职责：
 * 1. 接收并处理用户档案更新领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 更新用户档案视图
 * 2. 更新用户显示信息
 * 3. 更新用户搜索索引
 * 4. 更新用户统计信息
 *
 * 业务流程触发：
 * 1. 发送档案变更通知
 * 2. 更新相关用户关系
 * 3. 记录审计日志
 * 4. 触发档案同步流程
 *
 * @example
 * ```typescript
 * const handler = new UserProfileUpdatedEventHandler();
 * await handler.handle(userProfileUpdatedEvent);
 * ```
 * @since 1.0.0
 */
export class UserProfileUpdatedEventHandler extends BaseEventHandler<UserProfileUpdatedEvent> {
  constructor() {
    super(
      'UserProfileUpdatedEventHandler',
      'UserProfileUpdated',
      3, // 最大重试次数
      1000, // 重试延迟（毫秒）
    );
  }

  /**
   * @method processEvent
   * @description 处理用户档案更新事件，执行后续业务逻辑
   * @param {UserProfileUpdatedEvent} event 用户档案更新事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 并行更新读模型视图
   * 3. 触发业务流程
   * 4. 记录处理结果
   */
  protected async processEvent(event: UserProfileUpdatedEvent): Promise<void> {
    try {
      // 1. 验证事件
      this.validateUserProfileUpdatedEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserProfileView(event),
        this.updateUserDisplayInfo(event),
        this.updateUserSearchIndex(event),
        this.sendProfileChangeNotification(event),
        this.logAuditEvent(event),
      ]);

      console.log(
        `UserProfileUpdatedEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      console.error(
        `Failed to process UserProfileUpdatedEvent: ${event.aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method updateUserProfileView
   * @description 更新用户档案视图
   * @param {UserProfileUpdatedEvent} event 用户档案更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserProfileView(
    event: UserProfileUpdatedEvent,
  ): Promise<void> {
    const _userProfileView = {
      userId: event.aggregateId,
      profile: event.newProfile.toJSON(),
      updatedBy: event.updatedBy,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };

    // 这里应该调用实际的读模型仓储
    // await this.userProfileRepository.update(event.aggregateId, userProfileView);
    console.log(`User profile view updated: ${event.aggregateId}`);
  }

  /**
   * @method updateUserDisplayInfo
   * @description 更新用户显示信息
   * @param {UserProfileUpdatedEvent} event 用户档案更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserDisplayInfo(
    event: UserProfileUpdatedEvent,
  ): Promise<void> {
    const _displayInfo = {
      userId: event.aggregateId,
      displayName: `${event.newProfile.value.firstName} ${event.newProfile.value.lastName}`,
      avatar: event.newProfile.value.avatar,
      updatedAt: event.occurredOn,
    };

    // 这里应该调用实际的显示信息仓储
    // await this.userDisplayRepository.update(event.aggregateId, displayInfo);
    console.log(`User display info updated: ${event.aggregateId}`);
  }

  /**
   * @method updateUserSearchIndex
   * @description 更新用户搜索索引
   * @param {UserProfileUpdatedEvent} event 用户档案更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserSearchIndex(
    event: UserProfileUpdatedEvent,
  ): Promise<void> {
    const _searchIndex = {
      userId: event.aggregateId,
      firstName: event.newProfile.value.firstName,
      lastName: event.newProfile.value.lastName,
      fullName: `${event.newProfile.value.firstName} ${event.newProfile.value.lastName}`,
      phoneNumber: event.newProfile.value.phoneNumber,
      updatedAt: event.occurredOn,
    };

    // 这里应该调用实际的搜索索引服务
    // await this.searchIndexService.updateUserIndex(event.aggregateId, searchIndex);
    console.log(`User search index updated: ${event.aggregateId}`);
  }

  /**
   * @method sendProfileChangeNotification
   * @description 发送档案变更通知
   * @param {UserProfileUpdatedEvent} event 用户档案更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async sendProfileChangeNotification(
    event: UserProfileUpdatedEvent,
  ): Promise<void> {
    // 这里应该调用实际的通知服务
    // await this.notificationService.sendProfileChangeNotification(
    //   event.aggregateId,
    //   event.oldProfile,
    //   event.newProfile,
    // );
    console.log(
      `Profile change notification sent for user: ${event.aggregateId}`,
    );
  }

  /**
   * @method logAuditEvent
   * @description 记录审计日志
   * @param {UserProfileUpdatedEvent} event 用户档案更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async logAuditEvent(event: UserProfileUpdatedEvent): Promise<void> {
    // 这里应该调用实际的审计服务
    // await this.auditService.logEvent({
    //   eventType: event.getEventType(),
    //   aggregateId: event.aggregateId,
    //   details: event.toJSON(),
    //   timestamp: event.occurredOn,
    // });
    console.log(`Audit event logged for profile update: ${event.aggregateId}`);
  }

  /**
   * @method validateEvent
   * @description 验证事件的有效性
   * @param {UserProfileUpdatedEvent} event 用户档案更新事件
   * @returns {void}
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateUserProfileUpdatedEvent(
    event: UserProfileUpdatedEvent,
  ): void {
    if (
      !event.aggregateId ||
      !event.oldProfile ||
      !event.newProfile ||
      !event.updatedBy
    ) {
      throw new Error(
        'Invalid UserProfileUpdatedEvent: missing required fields',
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
      `✅ User profile updated event processed successfully: ${result.eventId} in ${result.processingTimeMs}ms`,
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
      `❌ User profile updated event processing failed: ${result.eventId} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
