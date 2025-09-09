import { BaseEventHandler } from '../domain/base/base-event-handler';
import { DomainEvent } from '../domain/domain-event';

/**
 * @class UserCreatedEvent
 * @description 用户创建事件示例
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly tenantId: string,
  ) {
    super(userId, 1, {
      tenantId,
      source: 'user-management',
    });
  }

  getEventType(): string {
    return 'UserCreated';
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.getBaseEventData(),
      userId: this.userId,
      email: this.email,
      tenantId: this.tenantId,
    };
  }
}

/**
 * @class UserCreatedEventHandler
 * @description 用户创建事件处理器示例，展示如何实现具体的事件处理器
 *
 * 处理器职责：
 * 1. 处理用户创建事件
 * 2. 发送欢迎邮件
 * 3. 创建用户权限
 * 4. 记录审计日志
 * 5. 更新用户统计
 *
 * 业务逻辑：
 * 1. 验证用户数据的完整性
 * 2. 调用邮件服务发送欢迎邮件
 * 3. 调用权限服务创建默认权限
 * 4. 调用审计服务记录创建日志
 * 5. 调用统计服务更新用户数量
 *
 * @example
 * ```typescript
 * const handler = new UserCreatedEventHandler();
 * await handler.handle(userCreatedEvent);
 * ```
 * @since 1.0.0
 */
export class UserCreatedEventHandler extends BaseEventHandler<UserCreatedEvent> {
  constructor() {
    super(
      'UserCreatedEventHandler',
      'UserCreated',
      3, // 最大重试次数
      1000, // 重试延迟（毫秒）
    );
  }

  /**
   * @method processEvent
   * @description 处理用户创建事件的核心业务逻辑
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @throws {EventProcessingError} 当事件处理失败时抛出
   *
   * 处理流程：
   * 1. 验证用户数据
   * 2. 发送欢迎邮件
   * 3. 创建用户权限
   * 4. 记录审计日志
   * 5. 更新用户统计
   */
  protected async processEvent(event: UserCreatedEvent): Promise<void> {
    try {
      // 1. 验证用户数据
      this.validateUserData(event);

      // 2. 并行执行多个业务操作
      await Promise.all([
        this.sendWelcomeEmail(event),
        this.createUserPermissions(event),
        this.logAuditEvent(event),
        this.updateUserStatistics(event),
      ]);

      console.log(`User created event processed successfully: ${event.userId}`);
    } catch (error) {
      console.error(
        `Failed to process user created event: ${event.userId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method validateUserData
   * @description 验证用户数据的完整性
   * @param {UserCreatedEvent} event 用户创建事件
   * @throws {ValidationError} 当用户数据无效时抛出
   * @private
   */
  private validateUserData(event: UserCreatedEvent): void {
    if (!event.userId) {
      throw new Error('User ID is required');
    }

    if (!event.email) {
      throw new Error('User email is required');
    }

    if (!event.tenantId) {
      throw new Error('Tenant ID is required');
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(event.email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * @method sendWelcomeEmail
   * @description 发送欢迎邮件
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @private
   */
  private async sendWelcomeEmail(event: UserCreatedEvent): Promise<void> {
    try {
      // 模拟邮件发送服务调用
      console.log(`Sending welcome email to: ${event.email}`);

      // 这里应该调用实际的邮件服务
      // await this.emailService.sendWelcomeEmail(event.email, event.userId);

      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log(`Welcome email sent successfully to: ${event.email}`);
    } catch (error) {
      console.error(`Failed to send welcome email to: ${event.email}`, error);
      throw new Error(
        `Welcome email sending failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * @method createUserPermissions
   * @description 创建用户默认权限
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @private
   */
  private async createUserPermissions(event: UserCreatedEvent): Promise<void> {
    try {
      // 模拟权限服务调用
      console.log(`Creating default permissions for user: ${event.userId}`);

      // 这里应该调用实际的权限服务
      // await this.permissionService.createDefaultPermissions(event.userId, event.tenantId);

      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 150));

      console.log(
        `Default permissions created successfully for user: ${event.userId}`,
      );
    } catch (error) {
      console.error(
        `Failed to create permissions for user: ${event.userId}`,
        error,
      );
      throw new Error(
        `Permission creation failed: ${(error as Error).message}`,
      );
    }
  }

  /**
   * @method logAuditEvent
   * @description 记录审计日志
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @private
   */
  private async logAuditEvent(event: UserCreatedEvent): Promise<void> {
    try {
      // 模拟审计服务调用
      console.log(`Logging audit event for user creation: ${event.userId}`);

      // 这里应该调用实际的审计服务
      // await this.auditService.logEvent({
      //   eventType: 'UserCreated',
      //   userId: event.userId,
      //   tenantId: event.tenantId,
      //   details: event.toJSON(),
      //   timestamp: new Date(),
      // });

      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 50));

      console.log(`Audit event logged successfully for user: ${event.userId}`);
    } catch (error) {
      console.error(
        `Failed to log audit event for user: ${event.userId}`,
        error,
      );
      throw new Error(`Audit logging failed: ${(error as Error).message}`);
    }
  }

  /**
   * @method updateUserStatistics
   * @description 更新用户统计信息
   * @param {UserCreatedEvent} event 用户创建事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserStatistics(event: UserCreatedEvent): Promise<void> {
    try {
      // 模拟统计服务调用
      console.log(`Updating user statistics for tenant: ${event.tenantId}`);

      // 这里应该调用实际的统计服务
      // await this.statisticsService.incrementUserCount(event.tenantId);

      // 模拟异步操作
      await new Promise(resolve => setTimeout(resolve, 75));

      console.log(
        `User statistics updated successfully for tenant: ${event.tenantId}`,
      );
    } catch (error) {
      console.error(
        `Failed to update user statistics for tenant: ${event.tenantId}`,
        error,
      );
      throw new Error(`Statistics update failed: ${(error as Error).message}`);
    }
  }

  /**
   * @method onProcessingSuccess
   * @description 处理成功回调，记录成功日志
   * @param {IEventProcessingResult} result 处理结果
   * @protected
   */
  protected onProcessingSuccess(result: any): void {
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
  protected onProcessingFailure(result: any): void {
    console.error(
      `❌ User created event processing failed: ${result.eventId} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
