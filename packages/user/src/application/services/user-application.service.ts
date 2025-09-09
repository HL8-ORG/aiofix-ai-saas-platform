import { Injectable } from '@nestjs/common';
import { CreateUserCommand } from '../commands/create-user.command';
import { GetUsersQuery } from '../queries/get-users.query';
import { AssignUserToTenantCommand } from '../commands/assign-user-to-tenant.command';
import {
  CreateUserUseCase,
  AssignUserToTenantUseCase,
  GetUsersUseCase,
} from '../use-cases';
import { EventBusService } from '@aiofix/core';
import {
  UserCreatedEvent,
  UserAssignedToTenantEvent,
  UserProfileUpdatedEvent,
  UserPasswordUpdatedEvent,
  UserPreferencesUpdatedEvent,
  UserStatusChangedEvent,
} from '../../domain/events';

/**
 * @class UserApplicationService
 * @description
 * 用户应用服务，负责协调业务流程、协调逻辑和事务边界。
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
 * const useCase = new UserApplicationService(userRepo, tenantRepo, eventBus);
 * await useCase.createUser(createUserCommand);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class UserApplicationService {
  constructor(
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly assignUserToTenantUseCase: AssignUserToTenantUseCase,
    private readonly getUsersUseCase: GetUsersUseCase,
  ) {}

  /**
   * @method createUser
   * @description 执行创建用户用例，协调完整的业务流程
   * @param {CreateUserCommand} command 创建用户命令
   * @returns {Promise<UserDto>} 创建的用户信息
   * @throws {ValidationError} 当输入数据无效时抛出
   * @throws {DuplicateEmailError} 当邮箱已存在时抛出
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   */
  async createUser(command: CreateUserCommand): Promise<any> {
    return await this.createUserUseCase.execute(command);
  }

  /**
   * @method getUsers
   * @description 执行获取用户列表用例，协调查询业务流程
   * @param {GetUsersQuery} query 获取用户列表查询
   * @returns {Promise<GetUsersResult>} 查询结果
   * @throws {ValidationError} 当查询参数无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   */
  async getUsers(query: GetUsersQuery): Promise<any> {
    return await this.getUsersUseCase.execute(query);
  }

  /**
   * @method assignUserToTenant
   * @description 分配用户到租户
   * @param {AssignUserToTenantCommand} command 分配命令
   * @returns {Promise<void>}
   * @throws {UserNotFoundError} 当用户不存在时抛出
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   */
  async assignUserToTenant(command: AssignUserToTenantCommand): Promise<void> {
    return await this.assignUserToTenantUseCase.execute(command);
  }
}
