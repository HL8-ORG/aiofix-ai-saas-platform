/**
 * @interface ICommandHandler
 * @description
 * 命令处理器接口，定义了处理命令的标准方法。
 *
 * 命令处理器职责：
 * 1. 接收并验证命令对象
 * 2. 协调领域服务和仓储执行业务逻辑
 * 3. 管理事务边界和异常处理
 * 4. 发布领域事件和集成事件
 *
 * 设计原则：
 * 1. 每个命令都应该有对应的处理器
 * 2. 处理器应该是无状态的，可以安全地重复使用
 * 3. 处理器应该专注于单一命令的处理
 * 4. 处理器应该通过依赖注入获取所需的依赖
 *
 * @template TCommand 命令类型
 * @template TResult 处理结果类型
 *
 * @example
 * ```typescript
 * export class CreateUserCommandHandler implements ICommandHandler<CreateUserCommand, UserCreatedResult> {
 *   async handle(command: CreateUserCommand): Promise<UserCreatedResult> {
 *     // 处理命令逻辑
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export interface ICommandHandler<TCommand, TResult> {
  /**
   * @method handle
   * @description 处理命令，执行相应的业务逻辑
   * @param {TCommand} command 命令对象
   * @returns {Promise<TResult>} 处理结果
   * @throws {Error} 当处理失败时抛出异常
   */
  handle(command: TCommand): Promise<TResult>;

  /**
   * @method getCommandType
   * @description 获取命令类型
   * @returns {string} 命令类型名称
   */
  getCommandType(): string;

  /**
   * @method getDescription
   * @description 获取处理器描述
   * @returns {string} 处理器描述
   */
  getDescription(): string;
}
