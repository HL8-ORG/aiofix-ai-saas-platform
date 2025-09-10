import { Injectable } from '@nestjs/common';
import { GetUserQuery } from '../get-user.query';
import {
  GetUserUseCase,
  GetUserResult,
} from '../../use-cases/get-user.use-case';
import { BaseQueryHandler } from '@aiofix/core';

/**
 * @class GetUserQueryHandler
 * @description
 * 获取单个用户查询处理器，负责处理用户查询请求和优化读性能。
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
 * @param {GetUserUseCase} getUserUseCase 获取用户用例
 *
 * @example
 * ```typescript
 * const handler = new GetUserQueryHandler(getUserUseCase);
 * const result = await handler.handle(getUserQuery);
 * ```
 * @since 1.0.0
 */
@Injectable()
export class GetUserQueryHandler extends BaseQueryHandler<
  GetUserQuery,
  GetUserResult | null
> {
  constructor(private readonly getUserUseCase: GetUserUseCase) {
    super();
  }

  /**
   * @method execute
   * @description 执行获取用户查询，返回用户数据
   * @param {GetUserQuery} query 获取用户查询
   * @returns {Promise<GetUserResult | null>} 查询结果
   * @throws {ValidationError} 当查询参数无效时抛出
   * @throws {InsufficientPermissionError} 当权限不足时抛出
   *
   * 处理流程：
   * 1. 验证查询参数和权限
   * 2. 检查缓存中是否有结果
   * 3. 从读模型数据库查询数据
   * 4. 应用数据隔离和权限过滤
   * 5. 缓存查询结果
   * 6. 返回查询结果
   */
  protected async execute(query: GetUserQuery): Promise<GetUserResult | null> {
    // 1. 检查是否可以处理
    if (!this.canProcess(query)) {
      throw new Error('无法处理获取用户查询');
    }

    // 2. 执行用例
    return await this.getUserUseCase.execute(query);
  }

  /**
   * @method validateQuery
   * @description 验证查询参数和权限
   * @param {GetUserQuery} query 获取用户查询
   * @returns {Promise<void>}
   * @throws {ValidationError} 当查询参数无效时抛出
   * @protected
   */
  protected async validateQuery(query: GetUserQuery): Promise<void> {
    if (!query) {
      throw new Error('获取用户查询不能为空');
    }

    if (!query.userId || query.userId.trim() === '') {
      throw new Error('用户ID不能为空');
    }

    if (!query.tenantId || query.tenantId.trim() === '') {
      throw new Error('租户ID不能为空');
    }

    if (!query.requestedBy || query.requestedBy.trim() === '') {
      throw new Error('请求者ID不能为空');
    }

    // 验证用户ID格式
    if (!this.isValidUserId(query.userId)) {
      throw new Error('用户ID格式不正确');
    }

    // 验证租户ID格式
    if (!this.isValidTenantId(query.tenantId)) {
      throw new Error('租户ID格式不正确');
    }

    // 验证请求者ID格式
    if (!this.isValidUserId(query.requestedBy)) {
      throw new Error('请求者ID格式不正确');
    }

    // 验证字段列表
    if (query.fields && query.fields.length === 0) {
      throw new Error('字段列表不能为空');
    }

    // 验证字段名称
    if (query.fields) {
      const validFields = [
        'id',
        'email',
        'firstName',
        'lastName',
        'phoneNumber',
        'avatar',
        'status',
        'tenantId',
        'organizationId',
        'departmentId',
        'createdAt',
        'updatedAt',
      ];

      for (const field of query.fields) {
        if (!validFields.includes(field)) {
          throw new Error(`无效的字段名称: ${field}`);
        }
      }
    }
  }

  /**
   * @method canProcess
   * @description 检查是否可以处理查询
   * @param {GetUserQuery} query 获取用户查询
   * @returns {boolean} 是否可以处理
   * @protected
   */
  protected canProcess(query: GetUserQuery): boolean {
    return !!(query && query.userId && query.tenantId && query.requestedBy);
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
   * @method getQueryType
   * @description 获取查询类型
   * @returns {string} 查询类型
   */
  getQueryType(): string {
    return 'GetUserQuery';
  }

  /**
   * @method getDescription
   * @description 获取处理器描述
   * @returns {string} 处理器描述
   */
  getDescription(): string {
    return '处理获取单个用户查询，包括权限验证和数据隔离';
  }
}
