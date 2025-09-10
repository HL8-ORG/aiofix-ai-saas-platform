import { Injectable } from '@nestjs/common';
import { UpdateUserCommand } from '../commands/update-user.command';
import { UserUpdatedEvent } from '../../domain/events';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { IEventBus } from '@aiofix/core';
import { IUseCase } from '@aiofix/core';
import { UserId, Email } from '@aiofix/shared';
import {
  Password,
  UserProfile,
  UserPreferences,
  UserStatus,
} from '../../domain/value-objects';

/**
 * @class UpdateUserUseCase
 * @description
 * 更新用户用例，负责处理用户更新操作的业务逻辑。
 *
 * 用例职责：
 * 1. 协调用户更新操作的业务流程
 * 2. 验证业务规则和约束
 * 3. 管理事务边界
 * 4. 发布领域事件
 *
 * 业务流程：
 * 1. 验证用户存在性
 * 2. 验证更新权限
 * 3. 验证业务规则
 * 4. 更新用户信息
 * 5. 发布用户更新事件
 *
 * @param {IUserRepository} userRepository 用户仓储接口
 * @param {IEventBus} eventBus 事件总线
 *
 * @example
 * ```typescript
 * const useCase = new UpdateUserUseCase(userRepository, eventBus);
 * await useCase.execute(updateUserCommand);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class UpdateUserUseCase implements IUseCase<UpdateUserCommand, void> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * @method execute
   * @description 执行更新用户用例
   * @param {UpdateUserCommand} command 更新用户命令
   * @returns {Promise<void>}
   * @throws {UserNotFoundError} 当用户不存在时抛出
   * @throws {ValidationError} 当输入数据无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  async execute(command: UpdateUserCommand): Promise<void> {
    // 1. 验证用户存在性
    const existingUser = await this.userRepository.findById(command.userId);
    if (!existingUser) {
      throw new Error(`用户不存在: ${command.userId}`);
    }

    // 2. 验证租户权限
    if (existingUser.user.tenantId !== command.tenantId) {
      throw new Error('无权访问该用户');
    }

    // 3. 验证邮箱唯一性（如果更新邮箱）
    if (command.email && command.email !== existingUser.email.value) {
      const emailExists = await this.userRepository.findByEmail(
        command.email,
        command.tenantId,
      );
      if (emailExists) {
        throw new Error('邮箱已被使用');
      }
    }

    // 4. 更新用户信息
    const updatedUser = existingUser.update({
      email: command.email ? new Email(command.email) : undefined,
      password: command.password
        ? Password.fromPlainText(command.password)
        : undefined,
      profile:
        command.firstName ||
        command.lastName ||
        command.phoneNumber ||
        command.avatar
          ? new UserProfile({
              firstName:
                command.firstName || existingUser.profile.value.firstName,
              lastName: command.lastName || existingUser.profile.value.lastName,
              phoneNumber:
                command.phoneNumber || existingUser.profile.value.phoneNumber,
              avatar: command.avatar || existingUser.profile.value.avatar,
            })
          : undefined,
      status: command.status || undefined,
    });

    // 5. 保存更新
    await this.userRepository.save(updatedUser);

    // 6. 发布用户更新事件
    const userUpdatedEvent = new UserUpdatedEvent(
      new UserId(command.userId),
      command.tenantId,
      {
        email: command.email,
        firstName: command.firstName,
        lastName: command.lastName,
        phoneNumber: command.phoneNumber,
        avatar: command.avatar,
        status: command.status,
        organizationId: command.organizationId,
        departmentId: command.departmentId,
      },
      command.requestedBy,
    );

    await this.eventBus.publish(userUpdatedEvent);
  }

  /**
   * @method getUseCaseName
   * @description 获取用例名称
   * @returns {string} 用例名称
   */
  getUseCaseName(): string {
    return 'UpdateUserUseCase';
  }

  /**
   * @method getDescription
   * @description 获取用例描述
   * @returns {string} 用例描述
   */
  getDescription(): string {
    return '更新用户信息的用例，包括基本信息、状态和权限验证';
  }
}
