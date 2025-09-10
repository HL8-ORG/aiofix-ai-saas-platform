import { Injectable } from '@nestjs/common';
import { UpdateUserCommand } from '../update-user.command';
import { UpdateUserUseCase } from '../../use-cases/update-user.use-case';
import { BaseCommandHandler } from '@aiofix/core';

/**
 * @class UpdateUserCommandHandler
 * @description
 * 更新用户命令处理器，负责处理用户更新命令的业务逻辑和事务管理。
 *
 * 处理器职责：
 * 1. 接收并验证更新用户命令
 * 2. 协调领域服务和仓储操作
 * 3. 管理事务边界和异常处理
 * 4. 发布领域事件和集成事件
 *
 * 业务逻辑流程：
 * 1. 验证命令参数和权限
 * 2. 检查邮箱唯一性约束
 * 3. 更新用户聚合根
 * 4. 保存到写模型数据库
 * 5. 发布用户更新事件
 * 6. 更新读模型视图
 *
 * 事务管理：
 * 1. 整个处理过程在一个事务中执行
 * 2. 失败时自动回滚所有操作
 * 3. 成功后提交事务并发布事件
 * 4. 支持分布式事务协调
 *
 * @param {UpdateUserUseCase} updateUserUseCase 更新用户用例
 *
 * @example
 * ```typescript
 * const handler = new UpdateUserCommandHandler(updateUserUseCase);
 * await handler.handle(updateUserCommand);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class UpdateUserCommandHandler extends BaseCommandHandler<
  UpdateUserCommand,
  void
> {
  constructor(private readonly updateUserUseCase: UpdateUserUseCase) {
    super();
  }

  /**
   * @method execute
   * @description 执行更新用户命令，执行完整的用户更新流程
   * @param {UpdateUserCommand} command 更新用户命令
   * @returns {Promise<void>} 处理结果
   * @throws {ValidationError} 当命令参数无效时抛出
   * @throws {UserNotFoundError} 当用户不存在时抛出
   * @throws {DuplicateEmailError} 当邮箱已存在时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   *
   * 处理流程：
   * 1. 验证命令和权限
   * 2. 检查业务规则约束
   * 3. 更新用户聚合根
   * 4. 保存到数据库
   * 5. 发布领域事件
   * 6. 返回处理结果
   */
  protected async execute(command: UpdateUserCommand): Promise<void> {
    // 1. 检查是否可以处理
    if (!this.canProcess(command)) {
      throw new Error('无法处理更新用户命令');
    }

    // 2. 执行用例
    await this.updateUserUseCase.execute(command);
  }

  /**
   * @method validateCommand
   * @description 验证命令参数和权限
   * @param {UpdateUserCommand} command 更新用户命令
   * @returns {void}
   * @throws {ValidationError} 当命令无效时抛出
   * @protected
   */
  protected async validateCommand(command: UpdateUserCommand): Promise<void> {
    if (!command) {
      throw new Error('更新用户命令不能为空');
    }

    if (!command.userId || command.userId.trim() === '') {
      throw new Error('用户ID不能为空');
    }

    if (!command.tenantId || command.tenantId.trim() === '') {
      throw new Error('租户ID不能为空');
    }

    if (!command.requestedBy || command.requestedBy.trim() === '') {
      throw new Error('请求者ID不能为空');
    }

    // 检查是否有任何更新字段
    const hasUpdateFields =
      command.email ||
      command.password ||
      command.firstName ||
      command.lastName ||
      command.phoneNumber ||
      command.avatar ||
      command.status ||
      command.organizationId ||
      command.departmentId;

    if (!hasUpdateFields) {
      throw new Error('至少需要提供一个更新字段');
    }
  }

  /**
   * @method canProcess
   * @description 检查是否可以处理命令
   * @param {UpdateUserCommand} command 更新用户命令
   * @returns {boolean} 是否可以处理
   * @protected
   */
  protected canProcess(command: UpdateUserCommand): boolean {
    return !!(
      command &&
      command.userId &&
      command.tenantId &&
      command.requestedBy
    );
  }

  /**
   * @method getCommandType
   * @description 获取命令类型
   * @returns {string} 命令类型
   */
  getCommandType(): string {
    return 'UpdateUserCommand';
  }

  /**
   * @method getDescription
   * @description 获取处理器描述
   * @returns {string} 处理器描述
   */
  getDescription(): string {
    return '处理用户更新命令，包括基本信息、状态和权限验证';
  }
}
