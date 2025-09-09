import { IQueryHandler } from './query-handler.interface';

/**
 * @class BaseQueryHandler
 * @description
 * 查询处理器基类，提供通用的查询处理功能和验证机制。
 *
 * 基类功能：
 * 1. 提供通用的查询验证方法
 * 2. 提供统一的错误处理机制
 * 3. 提供缓存支持
 * 4. 提供日志记录和监控支持
 *
 * 设计原则：
 * 1. 所有查询处理器都应该继承此基类
 * 2. 基类提供通用的处理逻辑，子类专注于查询逻辑
 * 3. 支持依赖注入和生命周期管理
 * 4. 提供统一的异常处理和日志记录
 *
 * @template TQuery 查询类型
 * @template TResult 查询结果类型
 *
 * @example
 * ```typescript
 * export class GetUsersQueryHandler extends BaseQueryHandler<GetUsersQuery, GetUsersResult> {
 *   async handle(query: GetUsersQuery): Promise<GetUsersResult> {
 *     await this.validateQuery(query);
 *     // 实现具体的查询逻辑
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export abstract class BaseQueryHandler<TQuery, TResult>
  implements IQueryHandler<TQuery, TResult>
{
  /**
   * @method handle
   * @description 处理查询，执行相应的数据获取逻辑
   * @param {TQuery} query 查询对象
   * @returns {Promise<TResult>} 查询结果
   * @throws {Error} 当查询失败时抛出异常
   */
  public async handle(query: TQuery): Promise<TResult> {
    try {
      // 验证查询
      await this.validateQuery(query);

      // 执行具体的查询逻辑
      return await this.execute(query);
    } catch (error) {
      // 记录错误日志
      this.logError(query, error as Error);
      throw error;
    }
  }

  /**
   * @method execute
   * @description 执行具体的查询逻辑，子类必须实现
   * @param {TQuery} query 查询对象
   * @returns {Promise<TResult>} 查询结果
   * @abstract
   */
  protected abstract execute(query: TQuery): Promise<TResult>;

  /**
   * @method validateQuery
   * @description 验证查询的有效性，子类可以重写
   * @param {TQuery} query 查询对象
   * @returns {Promise<void>}
   * @protected
   */
  protected async validateQuery(query: TQuery): Promise<void> {
    if (!query) {
      throw new Error('Query cannot be null or undefined');
    }
  }

  /**
   * @method logError
   * @description 记录错误日志
   * @param {TQuery} query 查询对象
   * @param {Error} error 错误对象
   * @protected
   */
  protected logError(query: TQuery, error: Error): void {
    console.error(`Query handler error: ${this.getQueryType()}`, {
      query,
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * @method getQueryType
   * @description 获取查询类型
   * @returns {string} 查询类型名称
   */
  public getQueryType(): string {
    return this.constructor.name.replace('QueryHandler', '');
  }

  /**
   * @method getDescription
   * @description 获取处理器描述
   * @returns {string} 处理器描述
   */
  public getDescription(): string {
    return `Handles ${this.getQueryType()} queries`;
  }
}
