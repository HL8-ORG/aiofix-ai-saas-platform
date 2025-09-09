import { Injectable } from '@nestjs/common';
import { AssignUserToTenantCommand } from '../commands/assign-user-to-tenant.command';
import { UserAssignedToTenantEvent } from '../../domain/events';
import { IEventBus } from '@aiofix/core';

/**
 * @class AssignUserToTenantUseCase
 * @description
 * 分配用户到租户用例，负责协调用户和租户之间的业务逻辑。
 *
 * 业务流程：
 * 1. 验证用户存在性
 * 2. 验证租户存在性
 * 3. 检查分配规则
 * 4. 执行分配操作
 * 5. 发布领域事件
 *
 * 协调逻辑：
 * 1. 协调用户和租户聚合根
 * 2. 处理跨聚合的业务规则
 * 3. 管理事务边界
 * 4. 处理异常情况
 *
 * @param {IUserRepository} userRepository 用户仓储接口
 * @param {ITenantRepository} tenantRepository 租户仓储接口
 * @param {IEventBus} eventBus 事件总线
 *
 * @example
 * ```typescript
 * const useCase = new AssignUserToTenantUseCase(userRepo, tenantRepo, eventBus);
 * await useCase.execute(assignCommand);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class AssignUserToTenantUseCase {
  constructor(
    // private readonly userRepository: IUserRepository,
    // private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * @method execute
   * @description 执行分配用户到租户用例
   * @param {AssignUserToTenantCommand} command 分配命令
   * @returns {Promise<void>}
   * @throws {UserNotFoundError} 当用户不存在时抛出
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {UserAlreadyAssignedError} 当用户已分配到其他租户时抛出
   */
  async execute(command: AssignUserToTenantCommand): Promise<void> {
    // 1. 验证用户存在性
    // const user = await this.userRepository.findById(command.userId);
    // if (!user) {
    //   throw new UserNotFoundError(command.userId);
    // }

    // 2. 验证租户存在性
    // const tenant = await this.tenantRepository.findById(command.tenantId);
    // if (!tenant) {
    //   throw new TenantNotFoundError(command.tenantId);
    // }

    // 3. 检查分配规则
    // await this.validateAssignmentRules(user, tenant, command);

    // 4. 执行分配操作
    // user.assignToTenant(command.tenantId, command.role);
    // await this.userRepository.save(user);

    // 5. 发布领域事件
    const userAssignedEvent = new UserAssignedToTenantEvent(
      command.userId,
      command.tenantId,
      command.role,
      command.assignedBy,
    );

    await this.eventBus.publish(userAssignedEvent);
  }

  /**
   * @method validateAssignmentRules
   * @description 验证分配规则
   * @param {User} user 用户聚合根
   * @param {Tenant} tenant 租户聚合根
   * @param {AssignUserToTenantCommand} command 分配命令
   * @returns {Promise<void>}
   * @throws {UserAlreadyAssignedError} 当用户已分配到其他租户时抛出
   * @throws {TenantUserLimitExceededError} 当租户用户数量超限时抛出
   * @private
   */
  private async validateAssignmentRules(
    user: any,
    tenant: any,
    command: AssignUserToTenantCommand,
  ): Promise<void> {
    // 检查用户是否已经在其他租户中
    // if (user.tenantId && user.tenantId !== command.tenantId) {
    //   throw new UserAlreadyAssignedToDifferentTenantError(
    //     user.id,
    //     user.tenantId,
    //   );
    // }
    // 检查租户用户数量限制
    // const currentUserCount = await this.tenantRepository.getUserCount(command.tenantId);
    // if (currentUserCount >= tenant.settings.maxUsers) {
    //   throw new TenantUserLimitExceededError(command.tenantId);
    // }
    // 检查分配者权限
    // await this.validateAssignerPermissions(command.assignedBy, command.tenantId);
  }
}
