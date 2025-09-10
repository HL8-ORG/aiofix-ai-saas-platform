import { Injectable } from '@nestjs/common';
import { DeleteUserCommand } from '../delete-user.command';
import { DeleteUserUseCase } from '../../use-cases/delete-user.use-case';
import { BaseCommandHandler } from '@aiofix/core';

/**
 * @class DeleteUserCommandHandler
 * @description
 * 删除用户命令处理器，负责处理用户删除命令的业务逻辑和事务管理。
 *
 * 处理器职责：
 * 1. 接收并验证删除用户命令
 * 2. 协调领域服务和仓储操作
 * 3. 管理事务边界和异常处理
 * 4. 发布领域事件和集成事件
 *
 * 业务逻辑流程：
 * 1. 验证命令参数和权限
 * 2. 检查用户关联数据
 * 3. 执行删除操作（软删除或硬删除）
 * 4. 保存到写模型数据库
 * 5. 发布用户删除事件
 * 6. 清理相关数据
 *
 * 事务管理：
 * 1. 整个处理过程在一个事务中执行
 * 2. 失败时自动回滚所有操作
 * 3. 成功后提交事务并发布事件
 * 4. 支持分布式事务协调
 *
 * @param {DeleteUserUseCase} deleteUserUseCase 删除用户用例
 *
 * @example
 * ```typescript
 * const handler = new DeleteUserCommandHandler(deleteUserUseCase);
 * await handler.handle(deleteUserCommand);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class DeleteUserCommandHandler extends BaseCommandHandler<
  DeleteUserCommand,
  void
> {
  constructor(private readonly deleteUserUseCase: DeleteUserUseCase) {
    super();
  }

  /**
   * @method execute
   * @description 执行删除用户命令，执行完整的用户删除流程
   * @param {DeleteUserCommand} command 删除用户命令
   * @returns {Promise<void>} 处理结果
   * @throws {ValidationError} 当命令参数无效时抛出
   * @throws {UserNotFoundError} 当用户不存在时抛出
   * @throws {UserHasActiveDataError} 当用户有关联数据时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   *
   * 处理流程：
   * 1. 验证命令和权限
   * 2. 检查业务规则约束
   * 3. 检查用户关联数据
   * 4. 执行删除操作
   * 5. 保存到数据库
   * 6. 发布领域事件
   * 7. 返回处理结果
   */
  protected async execute(command: DeleteUserCommand): Promise<void> {
    // 1. 检查是否可以处理
    if (!this.canProcess(command)) {
      throw new Error('无法处理删除用户命令');
    }

    // 2. 执行用例
    await this.deleteUserUseCase.execute(command);
  }

  /**
   * @method validateCommand
   * @description 验证命令参数和权限
   * @param {DeleteUserCommand} command 删除用户命令
   * @returns {void}
   * @throws {ValidationError} 当命令无效时抛出
   * @protected
   */
  protected async validateCommand(command: DeleteUserCommand): Promise<void> {
    if (!command) {
      throw new Error('删除用户命令不能为空');
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

    // 验证用户ID格式
    if (!this.isValidUserId(command.userId)) {
      throw new Error('用户ID格式不正确');
    }

    // 验证租户ID格式
    if (!this.isValidTenantId(command.tenantId)) {
      throw new Error('租户ID格式不正确');
    }

    // 验证请求者ID格式
    if (!this.isValidUserId(command.requestedBy)) {
      throw new Error('请求者ID格式不正确');
    }

    // 验证删除原因长度
    if (command.reason && command.reason.length > 500) {
      throw new Error('删除原因长度不能超过500个字符');
    }
  }

  /**
   * @method canProcess
   * @description 检查是否可以处理命令
   * @param {DeleteUserCommand} command 删除用户命令
   * @returns {boolean} 是否可以处理
   * @protected
   */
  protected canProcess(command: DeleteUserCommand): boolean {
    return !!(
      command &&
      command.userId &&
      command.tenantId &&
      command.requestedBy
    );
  }

  /**
   * @method isValidUserId
   * @description 验证用户ID格式
   * @param {string} userId 用户ID
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidUserId(userId: string): boolean {
    // UUID格式验证
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(userId);
  }

  /**
   * @method isValidTenantId
   * @description 验证租户ID格式
   * @param {string} tenantId 租户ID
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidTenantId(tenantId: string): boolean {
    // UUID格式验证
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(tenantId);
  }

  /**
   * @method getCommandType
   * @description 获取命令类型
   * @returns {string} 命令类型
   */
  getCommandType(): string {
    return 'DeleteUserCommand';
  }

  /**
   * @method getDescription
   * @description 获取处理器描述
   * @returns {string} 处理器描述
   */
  getDescription(): string {
    return '处理用户删除命令，支持软删除和硬删除，包括权限验证和关联数据检查';
  }
}
