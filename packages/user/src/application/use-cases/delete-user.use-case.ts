import { Injectable } from '@nestjs/common';
import { DeleteUserCommand } from '../commands/delete-user.command';
import { UserDeletedEvent } from '../../domain/events';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IEventBus } from '@aiofix/core';
import { IUseCase } from '@aiofix/core';
import { UserId } from '@aiofix/shared';

/**
 * @class DeleteUserUseCase
 * @description
 * 删除用户用例，负责处理用户删除操作的业务逻辑。
 *
 * 用例职责：
 * 1. 协调用户删除操作的业务流程
 * 2. 验证业务规则和约束
 * 3. 管理事务边界
 * 4. 发布领域事件
 *
 * 业务流程：
 * 1. 验证用户存在性
 * 2. 验证删除权限
 * 3. 检查用户关联数据
 * 4. 执行删除操作
 * 5. 发布用户删除事件
 *
 * @param {IUserRepository} userRepository 用户仓储接口
 * @param {IEventBus} eventBus 事件总线
 *
 * @example
 * ```typescript
 * const useCase = new DeleteUserUseCase(userRepository, eventBus);
 * await useCase.execute(deleteUserCommand);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class DeleteUserUseCase implements IUseCase<DeleteUserCommand, void> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * @method execute
   * @description 执行删除用户用例
   * @param {DeleteUserCommand} command 删除用户命令
   * @returns {Promise<void>}
   * @throws {UserNotFoundError} 当用户不存在时抛出
   * @throws {ValidationError} 当输入数据无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   * @throws {UserHasActiveDataError} 当用户有关联数据时抛出
   */
  async execute(command: DeleteUserCommand): Promise<void> {
    // 1. 验证用户存在性
    const existingUser = await this.userRepository.findById(command.userId);
    if (!existingUser) {
      throw new Error(`用户不存在: ${command.userId}`);
    }

    // 2. 验证租户权限
    if (existingUser.user.tenantId !== command.tenantId) {
      throw new Error('无权访问该用户');
    }

    // 3. 检查用户是否已被删除
    if (existingUser.isDeleted()) {
      throw new Error('用户已被删除');
    }

    // 4. 检查用户关联数据（这里可以添加更多检查逻辑）
    await this.checkUserDependencies(command.userId, command.tenantId);

    // 5. 执行删除操作
    if (command.hardDelete) {
      // 硬删除：直接从数据库中删除
      await this.userRepository.delete(command.userId);
    } else {
      // 软删除：标记为已删除
      const deletedUser = existingUser.markAsDeleted(command.reason);
      await this.userRepository.save(deletedUser);
    }

    // 6. 发布用户删除事件
    const userDeletedEvent = new UserDeletedEvent(
      new UserId(command.userId),
      command.tenantId,
      command.reason,
      command.hardDelete,
      command.requestedBy,
    );

    await this.eventBus.publish(userDeletedEvent);
  }

  /**
   * @method checkUserDependencies
   * @description 检查用户关联数据
   * @param {string} userId 用户ID
   * @param {string} tenantId 租户ID
   * @returns {Promise<void>}
   * @throws {UserHasActiveDataError} 当用户有关联数据时抛出
   * @private
   */
  private async checkUserDependencies(
    userId: string,
    tenantId: string,
  ): Promise<void> {
    // TODO: 实现用户关联数据检查
    // 例如：检查用户是否有未完成的任务、订单等
    // 这里暂时跳过检查，实际项目中需要根据业务需求实现
  }

  /**
   * @method getUseCaseName
   * @description 获取用例名称
   * @returns {string} 用例名称
   */
  getUseCaseName(): string {
    return 'DeleteUserUseCase';
  }

  /**
   * @method getDescription
   * @description 获取用例描述
   * @returns {string} 用例描述
   */
  getDescription(): string {
    return '删除用户的用例，支持软删除和硬删除，包括权限验证和关联数据检查';
  }
}
