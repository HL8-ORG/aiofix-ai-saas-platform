import { v4 as uuidv4 } from 'uuid';

/**
 * @class Query
 * @description
 * 查询基类，封装用户查询操作的参数和过滤条件。
 *
 * 查询职责：
 * 1. 封装数据查询所需的所有参数
 * 2. 提供灵活的过滤和排序选项
 * 3. 支持分页和性能优化
 * 4. 确保查询结果的数据隔离
 *
 * 数据隔离要求：
 * 1. 查询必须基于租户ID进行数据隔离
 * 2. 根据查询者权限过滤可访问的数据
 * 3. 支持组织级和部门级的数据过滤
 * 4. 确保敏感信息的安全访问
 *
 * CQRS特性：
 * 1. 表示数据检索的请求
 * 2. 是不可变的，一旦创建就不能修改
 * 3. 包含查询所需的所有参数
 * 4. 具有唯一标识符和时间戳
 * 5. 不产生副作用，只返回数据
 *
 * @property {string} queryId 查询的唯一标识符
 * @property {Date} timestamp 查询创建的时间戳
 * @property {string} queryType 查询的类型名称
 *
 * @example
 * ```typescript
 * class GetUsersQuery extends Query {
 *   constructor(
 *     public readonly tenantId: string,
 *     public readonly organizationId?: string,
 *     public readonly page: number = 1,
 *     public readonly limit: number = 20
 *   ) {
 *     super();
 *     this.validate();
 *   }
 *
 *   private validate(): void {
 *     if (!this.tenantId) {
 *       throw new Error('Tenant ID is required');
 *     }
 *   }
 *
 *   toJSON(): any {
 *     return {
 *       ...this.getBaseQueryData(),
 *       tenantId: this.tenantId,
 *       organizationId: this.organizationId,
 *       page: this.page,
 *       limit: this.limit
 *     };
 *   }
 * }
 * ```
 * @abstract
 * @since 1.0.0
 */
export abstract class Query {
  /**
   * 查询的唯一标识符
   * 使用UUID确保全局唯一性
   */
  public readonly queryId: string;

  /**
   * 查询创建的时间戳
   * 记录查询创建的时间
   */
  public readonly timestamp: Date;

  /**
   * 查询的类型名称
   * 使用构造函数名称作为查询类型
   */
  public readonly queryType: string;

  /**
   * 构造函数
   *
   * 初始化查询的基本属性，包括唯一标识符、时间戳和类型名称。
   */
  constructor() {
    this.queryId = uuidv4();
    this.timestamp = new Date();
    this.queryType = this.constructor.name;
  }

  /**
   * 验证查询数据的有效性
   *
   * 子类可以重写此方法，添加特定的查询数据验证逻辑。
   * 基类提供基本的验证，确保查询的基本属性有效。
   *
   * @throws {Error} 当查询数据无效时抛出错误
   */
  protected validateQuery(): void {
    if (!this.queryId || this.queryId.trim().length === 0) {
      throw new Error('查询ID不能为空');
    }

    if (isNaN(this.timestamp.getTime())) {
      throw new Error('查询时间戳无效');
    }

    if (!this.queryType || this.queryType.trim().length === 0) {
      throw new Error('查询类型不能为空');
    }
  }

  /**
   * 获取查询的基本信息
   *
   * @returns {object} 包含查询基本信息的对象
   */
  protected getBaseQueryData(): object {
    return {
      queryId: this.queryId,
      timestamp: this.timestamp.toISOString(),
      queryType: this.queryType,
    };
  }

  /**
   * 将查询转换为JSON格式
   *
   * 子类应该重写此方法，提供具体的查询数据序列化。
   * 基类提供默认实现，包含查询的基本属性。
   *
   * @returns {Record<string, unknown>} 查询的JSON表示
   */
  abstract toJSON(): Record<string, unknown>;
}
