/**
 * @interface IQueryHandler
 * @description
 * 查询处理器接口，定义了处理查询的标准方法。
 *
 * 查询处理器职责：
 * 1. 接收并验证查询对象
 * 2. 从读模型数据库获取数据
 * 3. 应用数据隔离和权限过滤
 * 4. 优化查询性能和缓存策略
 *
 * 设计原则：
 * 1. 每个查询都应该有对应的处理器
 * 2. 处理器应该是无状态的，可以安全地重复使用
 * 3. 处理器应该专注于单一查询的处理
 * 4. 处理器应该通过依赖注入获取所需的依赖
 *
 * @template TQuery 查询类型
 * @template TResult 查询结果类型
 *
 * @example
 * ```typescript
 * export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery, GetUsersResult> {
 *   async handle(query: GetUsersQuery): Promise<GetUsersResult> {
 *     // 处理查询逻辑
 *   }
 * }
 * ```
 * @since 1.0.0
 */
export interface IQueryHandler<TQuery, TResult> {
  /**
   * @method handle
   * @description 处理查询，执行相应的数据获取逻辑
   * @param {TQuery} query 查询对象
   * @returns {Promise<TResult>} 查询结果
   * @throws {Error} 当查询失败时抛出异常
   */
  handle(query: TQuery): Promise<TResult>;

  /**
   * @method getQueryType
   * @description 获取查询类型
   * @returns {string} 查询类型名称
   */
  getQueryType(): string;

  /**
   * @method getDescription
   * @description 获取处理器描述
   * @returns {string} 处理器描述
   */
  getDescription(): string;
}
