import { Injectable } from '@nestjs/common';
import { GetUsersQuery } from '../get-users.query';
import { GetUsersUseCase } from '../../use-cases/get-users.use-case';
import { BaseQueryHandler } from '@aiofix/core';

/**
 * @class GetUsersQueryHandler
 * @description
 * 获取用户列表查询处理器，负责处理用户查询请求和优化读性能。
 *
 * 处理器职责：
 * 1. 接收并验证用户查询请求
 * 2. 从读模型数据库获取数据
 * 3. 应用数据隔离和权限过滤
 * 4. 优化查询性能和缓存策略
 *
 * 查询优化策略：
 * 1. 使用专门的读模型数据库
 * 2. 实现查询结果缓存机制
 * 3. 支持分页和索引优化
 * 4. 避免N+1查询问题
 *
 * 数据隔离实现：
 * 1. 基于租户ID进行数据隔离
 * 2. 根据用户权限过滤可访问数据
 * 3. 支持组织级和部门级过滤
 * 4. 确保敏感数据的安全访问
 *
 * @param {GetUsersUseCase} getUsersUseCase 获取用户列表用例
 *
 * @example
 * ```typescript
 * const handler = new GetUsersQueryHandler(getUsersUseCase);
 * const result = await handler.handle(getUsersQuery);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class GetUsersQueryHandler extends BaseQueryHandler<GetUsersQuery, any> {
  constructor(private readonly getUsersUseCase: GetUsersUseCase) {
    super();
  }

  /**
   * @method execute
   * @description 执行获取用户列表查询，返回分页的用户数据
   * @param {GetUsersQuery} query 获取用户列表查询
   * @returns {Promise<any>} 查询结果
   * @throws {ValidationError} 当查询参数无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   *
   * 处理流程：
   * 1. 验证查询参数和权限
   * 2. 检查缓存中是否有结果
   * 3. 从读模型数据库查询数据
   * 4. 应用数据隔离和权限过滤
   * 5. 缓存查询结果
   * 6. 返回分页结果
   */
  protected async execute(query: GetUsersQuery): Promise<any> {
    // 1. 检查是否可以处理
    if (!this.canProcess(query)) {
      throw new Error('无法处理获取用户列表查询');
    }

    // 2. 执行用例
    return await this.getUsersUseCase.execute(query);
  }

  /**
   * @method validateQuery
   * @description 验证查询参数和权限
   * @param {GetUsersQuery} query 获取用户列表查询
   * @returns {Promise<void>}
   * @throws {ValidationError} 当查询参数无效时抛出
   * @protected
   */
  protected async validateQuery(query: GetUsersQuery): Promise<void> {
    if (!query) {
      throw new Error('获取用户列表查询不能为空');
    }

    if (!query.tenantId || query.tenantId.trim() === '') {
      throw new Error('租户ID不能为空');
    }

    if (!query.requestedBy || query.requestedBy.trim() === '') {
      throw new Error('请求者ID不能为空');
    }

    // 验证租户ID格式
    if (!this.isValidTenantId(query.tenantId)) {
      throw new Error('租户ID格式不正确');
    }

    // 验证请求者ID格式
    if (!this.isValidUserId(query.requestedBy)) {
      throw new Error('请求者ID格式不正确');
    }

    // 验证分页参数
    if (query.page && query.page < 1) {
      throw new Error('页码必须大于0');
    }

    if (query.limit && (query.limit < 1 || query.limit > 100)) {
      throw new Error('每页数量必须在1-100之间');
    }

    // 验证排序参数
    if (query.sortBy && !this.isValidSortField(query.sortBy)) {
      throw new Error(`无效的排序字段: ${query.sortBy}`);
    }

    if (query.sortOrder && !['asc', 'desc'].includes(query.sortOrder)) {
      throw new Error('排序方向必须是asc或desc');
    }

    // 验证搜索关键词长度
    if (query.searchTerm && query.searchTerm.length > 100) {
      throw new Error('搜索关键词长度不能超过100个字符');
    }
  }

  /**
   * @method canProcess
   * @description 检查是否可以处理查询
   * @param {GetUsersQuery} query 获取用户列表查询
   * @returns {boolean} 是否可以处理
   * @protected
   */
  protected canProcess(query: GetUsersQuery): boolean {
    return !!(query && query.tenantId && query.requestedBy);
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
   * @method isValidSortField
   * @description 验证排序字段
   * @param {string} sortField 排序字段
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidSortField(sortField: string): boolean {
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'email',
      'firstName',
      'lastName',
      'status',
    ];
    return validSortFields.includes(sortField);
  }

  /**
   * @method getQueryType
   * @description 获取查询类型
   * @returns {string} 查询类型
   */
  getQueryType(): string {
    return 'GetUsersQuery';
  }

  /**
   * @method getDescription
   * @description 获取处理器描述
   * @returns {string} 处理器描述
   */
  getDescription(): string {
    return '处理获取用户列表查询，包括分页、排序、搜索和权限验证';
  }
}
