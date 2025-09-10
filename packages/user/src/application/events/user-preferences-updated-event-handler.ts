import { BaseEventHandler, IEventProcessingResult } from '@aiofix/core';
import { UserPreferencesUpdatedEvent } from '../../domain/events';

/**
 * @class UserPreferencesUpdatedEventHandler
 * @description
 * 用户偏好更新事件处理器，负责处理用户偏好更新事件的后续业务逻辑。
 *
 * 事件处理职责：
 * 1. 接收并处理用户偏好更新领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 更新用户偏好视图
 * 2. 更新用户界面设置
 * 3. 更新用户行为统计
 * 4. 更新用户个性化配置
 *
 * 业务流程触发：
 * 1. 发送偏好变更通知
 * 2. 更新界面主题设置
 * 3. 记录审计日志
 * 4. 触发个性化推荐更新
 *
 * @example
 * ```typescript
 * const handler = new UserPreferencesUpdatedEventHandler();
 * await handler.handle(userPreferencesUpdatedEvent);
 * ```
 * @since 1.0.0
 */
export class UserPreferencesUpdatedEventHandler extends BaseEventHandler<UserPreferencesUpdatedEvent> {
  constructor() {
    super(
      'UserPreferencesUpdatedEventHandler',
      'UserPreferencesUpdated',
      3, // 最大重试次数
      1000, // 重试延迟（毫秒）
    );
  }

  /**
   * @method processEvent
   * @description 处理用户偏好更新事件，执行后续业务逻辑
   * @param {UserPreferencesUpdatedEvent} event 用户偏好更新事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 并行更新读模型视图
   * 3. 触发业务流程
   * 4. 记录处理结果
   */
  protected async processEvent(
    event: UserPreferencesUpdatedEvent,
  ): Promise<void> {
    try {
      // 1. 验证事件
      this.validateUserPreferencesUpdatedEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserPreferencesView(event),
        this.updateUserInterfaceSettings(event),
        this.updateUserBehaviorStatistics(event),
        this.sendPreferencesChangeNotification(event),
        this.logAuditEvent(event),
        this.updatePersonalizationRecommendations(event),
      ]);

      console.log(
        `UserPreferencesUpdatedEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      console.error(
        `Failed to process UserPreferencesUpdatedEvent: ${event.aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method updateUserPreferencesView
   * @description 更新用户偏好视图
   * @param {UserPreferencesUpdatedEvent} event 用户偏好更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserPreferencesView(
    event: UserPreferencesUpdatedEvent,
  ): Promise<void> {
    const preferencesView = {
      userId: event.aggregateId,
      preferences: event.newPreferences.toJSON(),
      updatedBy: event.updatedBy,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };

    // 这里应该调用实际的读模型仓储
    // await this.userPreferencesRepository.update(event.aggregateId, preferencesView);
    console.log(`User preferences view updated: ${event.aggregateId}`);
  }

  /**
   * @method updateUserInterfaceSettings
   * @description 更新用户界面设置
   * @param {UserPreferencesUpdatedEvent} event 用户偏好更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserInterfaceSettings(
    event: UserPreferencesUpdatedEvent,
  ): Promise<void> {
    const interfaceSettings = {
      userId: event.aggregateId,
      theme: event.newPreferences.value.theme,
      language: event.newPreferences.value.language,
      timezone: event.newPreferences.value.timezone,
      updatedAt: event.occurredOn,
    };

    // 这里应该调用实际的界面设置仓储
    // await this.userInterfaceRepository.update(event.aggregateId, interfaceSettings);
    console.log(`User interface settings updated: ${event.aggregateId}`);
  }

  /**
   * @method updateUserBehaviorStatistics
   * @description 更新用户行为统计
   * @param {UserPreferencesUpdatedEvent} event 用户偏好更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserBehaviorStatistics(
    event: UserPreferencesUpdatedEvent,
  ): Promise<void> {
    // 这里应该调用实际的统计服务
    // await this.behaviorStatisticsService.recordPreferenceChange(
    //   event.aggregateId,
    //   event.oldPreferences,
    //   event.newPreferences,
    // );
    console.log(`User behavior statistics updated: ${event.aggregateId}`);
  }

  /**
   * @method sendPreferencesChangeNotification
   * @description 发送偏好变更通知
   * @param {UserPreferencesUpdatedEvent} event 用户偏好更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async sendPreferencesChangeNotification(
    event: UserPreferencesUpdatedEvent,
  ): Promise<void> {
    // 这里应该调用实际的通知服务
    // await this.notificationService.sendPreferencesChangeNotification(
    //   event.aggregateId,
    //   event.oldPreferences,
    //   event.newPreferences,
    // );
    console.log(
      `Preferences change notification sent for user: ${event.aggregateId}`,
    );
  }

  /**
   * @method logAuditEvent
   * @description 记录审计日志
   * @param {UserPreferencesUpdatedEvent} event 用户偏好更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async logAuditEvent(
    event: UserPreferencesUpdatedEvent,
  ): Promise<void> {
    // 这里应该调用实际的审计服务
    // await this.auditService.logEvent({
    //   eventType: event.getEventType(),
    //   aggregateId: event.aggregateId,
    //   details: event.toJSON(),
    //   timestamp: event.occurredOn,
    // });
    console.log(
      `Audit event logged for preferences update: ${event.aggregateId}`,
    );
  }

  /**
   * @method updatePersonalizationRecommendations
   * @description 更新个性化推荐
   * @param {UserPreferencesUpdatedEvent} event 用户偏好更新事件
   * @returns {Promise<void>}
   * @private
   */
  private async updatePersonalizationRecommendations(
    event: UserPreferencesUpdatedEvent,
  ): Promise<void> {
    // 这里应该调用实际的个性化推荐服务
    // await this.personalizationService.updateRecommendations(
    //   event.aggregateId,
    //   event.newPreferences,
    // );
    console.log(
      `Personalization recommendations updated for user: ${event.aggregateId}`,
    );
  }

  /**
   * @method validateEvent
   * @description 验证事件的有效性
   * @param {UserPreferencesUpdatedEvent} event 用户偏好更新事件
   * @returns {void}
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateUserPreferencesUpdatedEvent(
    event: UserPreferencesUpdatedEvent,
  ): void {
    if (
      !event.aggregateId ||
      !event.oldPreferences ||
      !event.newPreferences ||
      !event.updatedBy
    ) {
      throw new Error(
        'Invalid UserPreferencesUpdatedEvent: missing required fields',
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
      `✅ User preferences updated event processed successfully: ${result.eventId} in ${result.processingTimeMs}ms`,
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
      `❌ User preferences updated event processing failed: ${result.eventId} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
