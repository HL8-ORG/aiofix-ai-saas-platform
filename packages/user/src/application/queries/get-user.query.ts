import { UserId } from '@aiofix/shared';

/**
 * @class GetUserQuery
 * @description
 * 获取单个用户查询，封装用户查询操作的参数和过滤条件。
 *
 * 查询职责：
 * 1. 封装用户查询所需的所有参数
 * 2. 提供灵活的过滤和排序选项
 * 3. 支持性能优化
 * 4. 确保查询结果的数据隔离
 *
 * 数据隔离要求：
 * 1. 查询必须基于租户ID进行数据隔离
 * 2. 根据查询者权限过滤可访问的数据
 * 3. 确保敏感信息的安全访问
 *
 * @property {string} userId 用户ID，必填
 * @property {string} tenantId 租户ID，必填，用于数据隔离
 * @property {string} requestedBy 请求查询的用户ID，用于权限验证
 * @property {boolean} [includeDeleted=false] 是否包含已删除用户，默认false
 * @property {string[]} [fields] 需要返回的字段列表，可选
 *
 * @example
 * ```typescript
 * const query = new GetUserQuery({
 *   userId: 'user-123',
 *   tenantId: 'tenant-123',
 *   requestedBy: 'user-789',
 *   includeDeleted: false,
 *   fields: ['id', 'email', 'firstName', 'lastName']
 * });
 * ```
 * @since 1.0.0
 */
export class GetUserQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly requestedBy: string,
    public readonly includeDeleted: boolean = false,
    public readonly fields?: string[],
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
    if (!this.userId || this.userId.trim() === '') {
      throw new Error('用户ID不能为空');
    }

    if (!this.tenantId || this.tenantId.trim() === '') {
      throw new Error('租户ID不能为空');
    }

    if (!this.requestedBy || this.requestedBy.trim() === '') {
      throw new Error('请求者ID不能为空');
    }

    // 验证用户ID格式
    if (!this.isValidUserId(this.userId)) {
      throw new Error('用户ID格式不正确');
    }

    // 验证租户ID格式
    if (!this.isValidTenantId(this.tenantId)) {
      throw new Error('租户ID格式不正确');
    }

    // 验证请求者ID格式
    if (!this.isValidUserId(this.requestedBy)) {
      throw new Error('请求者ID格式不正确');
    }

    // 验证字段列表
    if (this.fields && this.fields.length === 0) {
      throw new Error('字段列表不能为空');
    }

    // 验证字段名称
    if (this.fields) {
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

      for (const field of this.fields) {
        if (!validFields.includes(field)) {
          throw new Error(`无效的字段名称: ${field}`);
        }
      }
    }
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
   * @method toJSON
   * @description 将查询转换为JSON格式
   * @returns {Record<string, unknown>} JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      requestedBy: this.requestedBy,
      includeDeleted: this.includeDeleted,
      fields: this.fields,
    };
  }
}
