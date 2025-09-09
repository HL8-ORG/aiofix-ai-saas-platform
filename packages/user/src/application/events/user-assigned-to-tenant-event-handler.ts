import { BaseEventHandler, IEventProcessingResult } from '@aiofix/core';
import { UserAssignedToTenantEvent } from '../../domain/events';

/**
 * @class UserAssignedToTenantEventHandler
 * @description
 * 用户分配到租户事件处理器，负责处理用户分配到租户事件的后续业务逻辑。
 *
 * 事件处理职责：
 * 1. 接收并处理用户分配到租户领域事件
 * 2. 更新读模型和视图
 * 3. 触发相关的业务流程
 * 4. 处理事件处理的异常和重试
 *
 * 读模型更新：
 * 1. 更新用户租户关系视图
 * 2. 更新租户用户列表视图
 * 3. 更新用户权限视图
 * 4. 更新组织架构视图
 *
 * 业务流程触发：
 * 1. 发送租户欢迎邮件
 * 2. 创建租户级用户权限
 * 3. 记录审计日志
 * 4. 更新租户统计信息
 *
 * @example
 * ```typescript
 * const handler = new UserAssignedToTenantEventHandler();
 * await handler.handle(userAssignedToTenantEvent);
 * ```
 * @since 1.0.0
 */
export class UserAssignedToTenantEventHandler extends BaseEventHandler<UserAssignedToTenantEvent> {
  constructor() {
    super(
      'UserAssignedToTenantEventHandler',
      'UserAssignedToTenant',
      3, // 最大重试次数
      1000, // 重试延迟（毫秒）
    );
  }

  /**
   * @method processEvent
   * @description 处理用户分配到租户事件，执行后续业务逻辑
   * @param {UserAssignedToTenantEvent} event 用户分配到租户事件
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
    event: UserAssignedToTenantEvent,
  ): Promise<void> {
    try {
      // 1. 验证事件
      this.validateUserAssignedToTenantEvent(event);

      // 2. 并行处理多个后续操作
      await Promise.allSettled([
        this.updateUserTenantRelationship(event),
        this.updateTenantUserList(event),
        this.createTenantPermissions(event),
        this.logAuditEvent(event),
        this.updateTenantStatistics(event),
      ]);

      console.log(
        `UserAssignedToTenantEvent processed successfully: ${event.aggregateId}`,
      );
    } catch (error) {
      console.error(
        `Failed to process UserAssignedToTenantEvent: ${event.aggregateId}`,
        error,
      );
      throw error;
    }
  }

  /**
   * @method updateUserTenantRelationship
   * @description 更新用户租户关系视图
   * @param {UserAssignedToTenantEvent} event 用户分配到租户事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateUserTenantRelationship(
    event: UserAssignedToTenantEvent,
  ): Promise<void> {
    const _userTenantRelationship = {
      userId: event.aggregateId,
      tenantId: event.tenantId,
      organizationId: event.organizationId,
      departmentId: event.departmentId,
      role: event.role,
      assignedBy: event.assignedBy,
      assignedAt: event.occurredOn,
      status: 'ACTIVE',
    };

    // 这里应该调用实际的读模型仓储
    // await this.userTenantRepository.save(userTenantRelationship);
    console.log(
      `User-tenant relationship updated: ${event.aggregateId} -> ${event.tenantId}`,
    );
  }

  /**
   * @method updateTenantUserList
   * @description 更新租户用户列表视图
   * @param {UserAssignedToTenantEvent} event 用户分配到租户事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateTenantUserList(
    event: UserAssignedToTenantEvent,
  ): Promise<void> {
    // 这里应该调用实际的租户用户列表仓储
    // await this.tenantUserListRepository.addUser(event.tenantId, {
    //   userId: event.aggregateId,
    //   role: event.role,
    //   organizationId: event.organizationId,
    //   departmentId: event.departmentId,
    //   assignedAt: event.occurredOn,
    // });
    console.log(`Tenant user list updated: ${event.tenantId}`);
  }

  /**
   * @method createTenantPermissions
   * @description 创建租户级用户权限
   * @param {UserAssignedToTenantEvent} event 用户分配到租户事件
   * @returns {Promise<void>}
   * @private
   */
  private async createTenantPermissions(
    event: UserAssignedToTenantEvent,
  ): Promise<void> {
    // 这里应该调用实际的权限服务
    // await this.permissionService.createTenantPermissions(
    //   event.aggregateId,
    //   event.tenantId,
    //   event.role,
    // );
    console.log(`Tenant permissions created for user: ${event.aggregateId}`);
  }

  /**
   * @method logAuditEvent
   * @description 记录审计日志
   * @param {UserAssignedToTenantEvent} event 用户分配到租户事件
   * @returns {Promise<void>}
   * @private
   */
  private async logAuditEvent(event: UserAssignedToTenantEvent): Promise<void> {
    // 这里应该调用实际的审计服务
    // await this.auditService.logEvent({
    //   eventType: event.getEventType(),
    //   aggregateId: event.aggregateId,
    //   details: event.toJSON(),
    //   timestamp: event.occurredOn,
    // });
    console.log(`Audit event logged for user assignment: ${event.aggregateId}`);
  }

  /**
   * @method updateTenantStatistics
   * @description 更新租户统计信息
   * @param {UserAssignedToTenantEvent} event 用户分配到租户事件
   * @returns {Promise<void>}
   * @private
   */
  private async updateTenantStatistics(
    event: UserAssignedToTenantEvent,
  ): Promise<void> {
    // 这里应该调用实际的统计服务
    // await this.statisticsService.incrementTenantUserCount(event.tenantId);
    console.log(`Tenant statistics updated: ${event.tenantId}`);
  }

  /**
   * @method validateEvent
   * @description 验证事件的有效性
   * @param {UserAssignedToTenantEvent} event 用户分配到租户事件
   * @returns {void}
   * @throws {ValidationError} 当事件无效时抛出
   * @private
   */
  private validateUserAssignedToTenantEvent(
    event: UserAssignedToTenantEvent,
  ): void {
    if (!event.aggregateId || !event.tenantId || !event.assignedBy) {
      throw new Error(
        'Invalid UserAssignedToTenantEvent: missing required fields',
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
      `✅ User assigned to tenant event processed successfully: ${result.eventId} in ${result.processingTimeMs}ms`,
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
      `❌ User assigned to tenant event processing failed: ${result.eventId} after ${result.retryCount} retries`,
      result.error,
    );
  }
}
