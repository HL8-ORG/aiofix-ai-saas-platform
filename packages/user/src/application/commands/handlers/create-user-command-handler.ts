import { Injectable } from '@nestjs/common';
import { CreateUserCommand } from '../create-user.command';
import { CreateUserUseCase } from '../../use-cases/create-user.use-case';
import { BaseCommandHandler } from '@aiofix/core';

/**
 * @class CreateUserCommandHandler
 * @description
 * 创建用户命令处理器，负责处理用户创建命令的业务逻辑和事务管理。
 *
 * 处理器职责：
 * 1. 接收并验证创建用户命令
 * 2. 协调领域服务和仓储操作
 * 3. 管理事务边界和异常处理
 * 4. 发布领域事件和集成事件
 *
 * 业务逻辑流程：
 * 1. 验证命令参数和权限
 * 2. 检查邮箱唯一性约束
 * 3. 创建用户聚合根
 * 4. 保存到写模型数据库
 * 5. 发布用户创建事件
 * 6. 更新读模型视图
 *
 * 事务管理：
 * 1. 整个处理过程在一个事务中执行
 * 2. 失败时自动回滚所有操作
 * 3. 成功后提交事务并发布事件
 * 4. 支持分布式事务协调
 *
 * @param {CreateUserUseCase} createUserUseCase 创建用户用例
 *
 * @example
 * ```typescript
 * const handler = new CreateUserCommandHandler(createUserUseCase);
 * await handler.handle(createUserCommand);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class CreateUserCommandHandler extends BaseCommandHandler<
  CreateUserCommand,
  void
> {
  constructor(private readonly createUserUseCase: CreateUserUseCase) {
    super();
  }

  /**
   * @method execute
   * @description 执行创建用户命令，执行完整的用户创建流程
   * @param {CreateUserCommand} command 创建用户命令
   * @returns {Promise<void>} 处理结果
   * @throws {ValidationError} 当命令参数无效时抛出
   * @throws {DuplicateEmailError} 当邮箱已存在时抛出
   * @throws {TenantNotFoundError} 当租户不存在时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   *
   * 处理流程：
   * 1. 验证命令和权限
   * 2. 检查业务规则约束
   * 3. 创建用户聚合根
   * 4. 保存到数据库
   * 5. 发布领域事件
   * 6. 返回处理结果
   */
  protected async execute(command: CreateUserCommand): Promise<void> {
    // 1. 检查是否可以处理
    if (!this.canProcess(command)) {
      throw new Error('无法处理创建用户命令');
    }

    // 2. 执行用例
    await this.createUserUseCase.execute(command);
  }

  /**
   * @method validateCommand
   * @description 验证命令参数和权限
   * @param {CreateUserCommand} command 创建用户命令
   * @returns {void}
   * @throws {ValidationError} 当命令无效时抛出
   * @protected
   */
  protected async validateCommand(command: CreateUserCommand): Promise<void> {
    if (!command) {
      throw new Error('创建用户命令不能为空');
    }

    if (!command.email || command.email.trim() === '') {
      throw new Error('邮箱地址不能为空');
    }

    if (!command.password || command.password.trim() === '') {
      throw new Error('密码不能为空');
    }

    if (!command.firstName || command.firstName.trim() === '') {
      throw new Error('名字不能为空');
    }

    if (!command.lastName || command.lastName.trim() === '') {
      throw new Error('姓氏不能为空');
    }

    if (!command.tenantId || command.tenantId.trim() === '') {
      throw new Error('租户ID不能为空');
    }

    if (!command.requestedBy || command.requestedBy.trim() === '') {
      throw new Error('请求者ID不能为空');
    }

    // 验证邮箱格式
    if (!this.isValidEmail(command.email)) {
      throw new Error('邮箱格式不正确');
    }

    // 验证密码强度
    if (!this.isValidPassword(command.password)) {
      throw new Error('密码强度不符合要求');
    }

    // 验证姓名长度
    if (command.firstName.length < 1 || command.firstName.length > 50) {
      throw new Error('名字长度必须在1-50个字符之间');
    }

    if (command.lastName.length < 1 || command.lastName.length > 50) {
      throw new Error('姓氏长度必须在1-50个字符之间');
    }

    // 注意：phoneNumber和avatar在CreateUserCommand中不存在，它们属于UserProfile
  }

  /**
   * @method canProcess
   * @description 检查是否可以处理命令
   * @param {CreateUserCommand} command 创建用户命令
   * @returns {boolean} 是否可以处理
   * @protected
   */
  protected canProcess(command: CreateUserCommand): boolean {
    return !!(
      command &&
      command.email &&
      command.password &&
      command.firstName &&
      command.lastName &&
      command.tenantId &&
      command.requestedBy
    );
  }

  /**
   * @method isValidEmail
   * @description 验证邮箱格式
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * @method isValidPassword
   * @description 验证密码强度
   * @param {string} password 密码
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidPassword(password: string): boolean {
    // 至少8位，包含大小写字母、数字和特殊字符
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * @method isValidPhoneNumber
   * @description 验证电话号码格式
   * @param {string} phoneNumber 电话号码
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // 支持国际格式的电话号码
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * @method isValidUrl
   * @description 验证URL格式
   * @param {string} url URL地址
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @method getCommandType
   * @description 获取命令类型
   * @returns {string} 命令类型
   */
  getCommandType(): string {
    return 'CreateUserCommand';
  }

  /**
   * @method getDescription
   * @description 获取处理器描述
   * @returns {string} 处理器描述
   */
  getDescription(): string {
    return '处理用户创建命令，包括数据验证、业务规则检查和事件发布';
  }
}
