/**
 * @interface IUseCase
 * @description
 * 用例接口，定义了所有用例必须实现的标准方法。
 *
 * 用例职责：
 * 1. 封装业务逻辑和业务流程
 * 2. 协调多个领域服务和仓储
 * 3. 管理事务边界和异常处理
 * 4. 提供统一的用例执行接口
 *
 * 设计原则：
 * 1. 每个用例都应该实现此接口
 * 2. 用例应该是无状态的，可以安全地重复使用
 * 3. 用例应该专注于单一的业务流程
 * 4. 用例应该通过依赖注入获取所需的依赖
 *
 * @template TInput 输入参数类型
 * @template TOutput 输出结果类型
 *
 * @example
 * ```typescript
 * export class CreateUserUseCase implements IUseCase<CreateUserCommand, UserDto> {
 *   async execute(command: CreateUserCommand): Promise<UserDto> {
 *     // 实现业务逻辑
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export interface IUseCase<TInput, TOutput> {
  /**
   * @method execute
   * @description 执行用例，处理业务逻辑
   * @param {TInput} input 输入参数
   * @returns {Promise<TOutput>} 执行结果
   * @throws {Error} 当执行失败时抛出异常
   */
  execute(input: TInput): Promise<TOutput>;

  /**
   * @method getUseCaseName
   * @description 获取用例名称
   * @returns {string} 用例名称
   */
  getUseCaseName(): string;

  /**
   * @method getDescription
   * @description 获取用例描述
   * @returns {string} 用例描述
   */
  getDescription(): string;
}
