import { ICommandHandler } from './command-handler.interface';

/**
 * @class BaseCommandHandler
 * @description
 * 命令处理器基类，提供通用的命令处理功能和验证机制。
 *
 * 基类功能：
 * 1. 提供通用的命令验证方法
 * 2. 提供统一的错误处理机制
 * 3. 提供事务管理支持
 * 4. 提供日志记录和监控支持
 *
 * 设计原则：
 * 1. 所有命令处理器都应该继承此基类
 * 2. 基类提供通用的处理逻辑，子类专注于业务逻辑
 * 3. 支持依赖注入和生命周期管理
 * 4. 提供统一的异常处理和日志记录
 *
 * @template TCommand 命令类型
 * @template TResult 处理结果类型
 *
 * @example
 * ```typescript
 * export class CreateUserCommandHandler extends BaseCommandHandler<CreateUserCommand, UserCreatedResult> {
 *   async handle(command: CreateUserCommand): Promise<UserCreatedResult> {
 *     await this.validateCommand(command);
 *     // 实现具体的业务逻辑
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class BaseCommandHandler<TCommand, TResult>
  implements ICommandHandler<TCommand, TResult>
{
  /**
   * @method handle
   * @description 处理命令，执行相应的业务逻辑
   * @param {TCommand} command 命令对象
   * @returns {Promise<TResult>} 处理结果
   * @throws {Error} 当处理失败时抛出异常
   */
  public async handle(command: TCommand): Promise<TResult> {
    try {
      // 验证命令
      await this.validateCommand(command);

      // 执行具体的处理逻辑
      return await this.execute(command);
    } catch (error) {
      // 记录错误日志
      this.logError(command, error as Error);
      throw error;
    }
  }

  /**
   * @method execute
   * @description 执行具体的命令处理逻辑，子类必须实现
   * @param {TCommand} command 命令对象
   * @returns {Promise<TResult>} 处理结果
   * @abstract
   */
  protected abstract execute(command: TCommand): Promise<TResult>;

  /**
   * @method validateCommand
   * @description 验证命令的有效性，子类可以重写
   * @param {TCommand} command 命令对象
   * @returns {Promise<void>}
   * @protected
   */
  protected async validateCommand(command: TCommand): Promise<void> {
    if (!command) {
      throw new Error('Command cannot be null or undefined');
    }
  }

  /**
   * @method logError
   * @description 记录错误日志
   * @param {TCommand} command 命令对象
   * @param {Error} error 错误对象
   * @protected
   */
  protected logError(command: TCommand, error: Error): void {
    console.error(`Command handler error: ${this.getCommandType()}`, {
      command,
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * @method getCommandType
   * @description 获取命令类型
   * @returns {string} 命令类型名称
   */
  public getCommandType(): string {
    return this.constructor.name.replace('CommandHandler', '');
  }

  /**
   * @method getDescription
   * @description 获取处理器描述
   * @returns {string} 处理器描述
   */
  public getDescription(): string {
    return `Handles ${this.getCommandType()} commands`;
  }
}
