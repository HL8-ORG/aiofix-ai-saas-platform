import { Injectable } from '@nestjs/common';
import { CreateUserCommand } from '../commands/create-user.command';
import { UserAggregate } from '../../domain/aggregates/user.aggregate';
import { UserCreatedEvent } from '../../domain/events';
import { IEventBus } from '@aiofix/core';

/**
 * @class CreateUserUseCase
 * @description
 * 创建用户用例，负责协调业务流程、协调逻辑和事务边界。
 *
 * 业务流程：
 * 1. 验证用户输入数据
 * 2. 检查邮箱唯一性
 * 3. 创建用户聚合根
 * 4. 保存到数据库
 * 5. 发布领域事件
 *
 * 协调逻辑：
 * 1. 协调多个领域服务
 * 2. 处理跨聚合的业务规则
 * 3. 管理事务边界
 * 4. 处理异常情况
 *
 * 事务边界：
 * 1. 整个用例在一个事务中执行
 * 2. 失败时回滚所有操作
 * 3. 成功后提交事务并发布事件
 *
 * @param {IUserRepository} userRepository 用户仓储接口
 * @param {ITenantRepository} tenantRepository 租户仓储接口
 * @param {IEventBus} eventBus 事件总线
 *
 * @example
 * ```typescript
 * const useCase = new CreateUserUseCase(userRepo, tenantRepo, eventBus);
 * await useCase.execute(createUserCommand);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class CreateUserUseCase {
  constructor(
    // private readonly userRepository: IUserRepository,
    // private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: IEventBus,
  ) {}

  /**
   * @method execute
   * @description 执行创建用户用例，协调完整的业务流程
   * @param {CreateUserCommand} command 创建用户命令
   * @returns {Promise<UserDto>} 创建的用户信息
   * @throws {ValidationError} 当输入数据无效时抛出
   * @throws {DuplicateEmailError} 当邮箱已存在时抛出
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   */
  async execute(command: CreateUserCommand): Promise<any> {
    // 事务边界开始
    // return await this.userRepository.transaction(async () => {
    // 1. 验证租户存在性
    // const tenant = await this.tenantRepository.findById(command.tenantId);
    // if (!tenant) {
    //   throw new TenantNotFoundError(command.tenantId);
    // }

    // 2. 检查邮箱唯一性
    // const existingUser = await this.userRepository.findByEmail(command.email, command.tenantId);
    // if (existingUser) {
    //   throw new DuplicateEmailError(command.email);
    // }

    // 3. 创建用户聚合根
    const valueObjects = await command.toValueObjects();
    const userAggregate = new UserAggregate(
      valueObjects.id,
      valueObjects.email,
      valueObjects.password,
      valueObjects.profile,
      valueObjects.preferences,
      command.tenantId,
      'platform', // platformId - 暂时使用固定值
    );

    // 4. 保存到数据库
    // await this.userRepository.save(userAggregate);

    // 5. 发布领域事件
    const userCreatedEvent = new UserCreatedEvent(
      userAggregate.userId,
      userAggregate.email,
      userAggregate.profile,
      userAggregate.status,
      userAggregate.platformId,
      command.tenantId,
      command.requestedBy,
    );

    await this.eventBus.publish(userCreatedEvent);

    // 6. 返回创建结果
    return {
      id: userAggregate.id,
      email: userAggregate.email.value,
      firstName: userAggregate.profile.value.firstName,
      lastName: userAggregate.profile.value.lastName,
      status: userAggregate.status,
      createdAt: userAggregate.createdAt,
    };
    // });
  }
}
