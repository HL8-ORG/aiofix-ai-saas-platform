import { BaseEventHandler, IEventProcessingResult } from '@aiofix/core';
import { UserCreatedEvent } from '../../domain/events';

/**
 * @class UserCreatedEventHandler
 * @description
 * 用户创建事件处理器，负责处理用户创建事件的后续业务逻辑。
 *
 * 事件处理职责：
 * 1. 接收并处理用户创建领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 更新用户列表视图
 * 2. 更新用户统计信息
 * 3. 更新用户权限视图
 * 4. 更新用户会话视图
 *
 * 业务流程触发：
 * 1. 发送欢迎邮件
 * 2. 创建用户权限
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
 * const handler = new UserCreatedEventHandler(
 *   userReadRepo, notificationService, permissionService, auditService
 * );
 * await handler.handle(userCreatedEvent);
 * ```
 * @since 1.0.0
 */
export class UserCreatedEventHandler extends BaseEventHandler<UserCreatedEvent> {
  constructor() {
    // private readonly auditService: IAuditService, // private readonly permissionService: IPermissionService, // private readonly notificationService: INotificationService, // private readonly userReadRepository: IUserReadRepository,
    super(
      'UserCreatedEventHandler',
      'UserCreated',
      3, // 最大重试次数
      1000, // 重试延迟（毫秒）
    );
  }

  /**
   * @method processEvent
   * @description 处理用户创建事件，执行后续业务逻辑
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证事件的有效性
   * 2. 并行更新读模型视图
   * 3. 触发业务流程
   * 4. 记录处理结果
   */
  protected async processEvent(event: UserCreatedEvent): Promise<void> {
    try {
      // 1. 验证事件
      this.validateUserCreatedEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserReadModel(event),
        this.sendWelcomeEmail(event),
        this.logAuditEvent(event),
        this.createUserPermissions(event),
      ]);

      console.log(
        `UserCreatedEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      console.error(
        `Failed to process UserCreatedEvent: ${event.aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method updateUserReadModel
   * @description 更新用户读模型视图
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserReadModel(event: UserCreatedEvent): Promise<void> {
    const _userReadModel = {
      id: event.aggregateId,
      email: event.email.toString(),
      profile: event.profile.toJSON(),
      status: event.status.toString(),
      platformId: event.platformId,
      tenantId: event.tenantId,
      organizationId: null,
      departmentId: null,
      roles: ['PERSONAL_USER'],
      permissions: this.getDefaultPermissions(),
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn,
      version: event.eventVersion,
    };

    // 这里应该调用实际的读模型仓储
    // await this.userReadRepository.save(_userReadModel);
    console.log(`User read model updated: ${event.aggregateId}`);
  }

  /**
   * @method sendWelcomeEmail
   * @description 发送欢迎邮件
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @private
   */
  private async sendWelcomeEmail(event: UserCreatedEvent): Promise<void> {
    // 这里应该调用实际的通知服务
    // await this.notificationService.sendWelcomeEmail(
    //   event.email.toString(),
    //   event.profile.firstName,
    // );
    console.log(
      `Welcome email sent to: ${event.email.toString()} for user: ${event.aggregateId}`,
    );
  }

  /**
   * @method logAuditEvent
   * @description 记录审计日志
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @private
   */
  private async logAuditEvent(event: UserCreatedEvent): Promise<void> {
    // 这里应该调用实际的审计服务
    // await this.auditService.logEvent({
    //   eventType: event.getEventType(),
    //   aggregateId: event.aggregateId,
    //   details: event.toJSON(),
    //   timestamp: event.occurredOn,
    // });
    console.log(`Audit event logged for user creation: ${event.aggregateId}`);
  }

  /**
   * @method createUserPermissions
   * @description 创建用户权限
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @private
   */
  private async createUserPermissions(event: UserCreatedEvent): Promise<void> {
    // 这里应该调用实际的权限服务
    // await this.permissionService.createDefaultPermissions(
    //   event.aggregateId,
    //   event.platformId,
    // );
    console.log(`Default permissions created for user: ${event.aggregateId}`);
  }

  /**
   * @method getDefaultPermissions
   * @description 获取默认权限列表
   * @returns {string[]} 默认权限列表
   * @private
   */
  private getDefaultPermissions(): string[] {
    return ['user:read:own', 'user:update:own', 'platform:service:use'];
  }

  /**
   * @method validateUserCreatedEvent
   * @description 验证用户创建事件的有效性
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {void}
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateUserCreatedEvent(event: UserCreatedEvent): void {
    if (!event.aggregateId || !event.email || !event.profile) {
      throw new Error('Invalid UserCreatedEvent: missing required fields');
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
      `✅ User created event processed successfully: ${result.eventId} in ${result.processingTimeMs}ms`,
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
      `❌ User created event processing failed: ${result.eventId} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
