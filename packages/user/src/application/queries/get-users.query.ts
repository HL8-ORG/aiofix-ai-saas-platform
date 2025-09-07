/**
 * @class GetUsersQuery
 * @description
 * 获取用户列表查询，封装用户查询操作的参数和过滤条件。
 *
 * 查询职责：
 * 1. 封装用户查询所需的所有参数
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
 * @property {string} tenantId 租户ID，必填，用于数据隔离
 * @property {string} organizationId 组织ID，可选，用于组织级过滤
 * @property {string} departmentId 部门ID，可选，用于部门级过滤
 * @property {string} status 用户状态过滤，可选
 * @property {string} searchTerm 搜索关键词，可选
 * @property {number} page 页码，默认1
 * @property {number} limit 每页数量，默认20，最大100
 * @property {string} sortBy 排序字段，默认'createdAt'
 * @property {'asc' | 'desc'} sortOrder 排序方向，默认'desc'
 * @property {string} requestedBy 请求查询的用户ID，用于权限验证
 *
 * @example
 * ```typescript
 * const query = new GetUsersQuery({
 *   tenantId: 'tenant-123',
 *   organizationId: 'org-456',
 *   status: 'ACTIVE',
 *   searchTerm: 'john',
 *   page: 1,
 *   limit: 20,
 *   requestedBy: 'user-789'
 * });
 * ```
 * @since 1.0.0
 */
export class GetUsersQuery {
  constructor(
    public readonly tenantId: string,
    public readonly requestedBy: string,
    public readonly organizationId?: string,
    public readonly departmentId?: string,
    public readonly status?: string,
    public readonly searchTerm?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
    public readonly sortBy: string = 'createdAt',
    public readonly sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证查询参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   * @private
   */
  private validate(): void {
    if (!this.tenantId) {
      throw new Error('租户ID不能为空');
    }

    if (!this.requestedBy) {
      throw new Error('请求者ID不能为空');
    }

    if (this.page < 1) {
      throw new Error('页码必须大于0');
    }

    if (this.limit < 1 || this.limit > 100) {
      throw new Error('每页数量必须在1-100之间');
    }

    if (!['asc', 'desc'].includes(this.sortOrder)) {
      throw new Error('排序方向必须是asc或desc');
    }
  }

  /**
   * @method getOffset
   * @description 计算查询偏移量
   * @returns {number} 查询偏移量
   */
  public getOffset(): number {
    return (this.page - 1) * this.limit;
  }

  /**
   * @method hasFilters
   * @description 检查是否有过滤条件
   * @returns {boolean} 是否有过滤条件
   */
  public hasFilters(): boolean {
    return !!(
      this.organizationId ||
      this.departmentId ||
      this.status ||
      this.searchTerm
    );
  }

  /**
   * @method getCacheKey
   * @description 生成查询缓存键
   * @returns {string} 缓存键
   */
  public getCacheKey(): string {
    const filters = {
      tenantId: this.tenantId,
      organizationId: this.organizationId,
      departmentId: this.departmentId,
      status: this.status,
      searchTerm: this.searchTerm,
      page: this.page,
      limit: this.limit,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };

    return `users:${JSON.stringify(filters)}`;
  }
}
