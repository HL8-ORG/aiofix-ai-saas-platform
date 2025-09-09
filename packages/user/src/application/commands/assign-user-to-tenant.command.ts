import { TenantId } from '@aiofix/shared';

/**
 * @class AssignUserToTenantCommand
 * @description
 * 分配用户到租户命令，封装用户租户分配操作的输入参数和验证规则。
 *
 * 命令职责：
 * 1. 封装用户租户分配所需的所有输入参数
 * 2. 提供数据验证和格式检查
 * 3. 确保命令的不可变性和幂等性
 * 4. 支持命令的序列化和反序列化
 *
 * 数据隔离要求：
 * 1. 命令必须包含租户ID以确保数据隔离
 * 2. 验证用户和租户的存在性
 * 3. 确保命令执行者具有相应权限
 *
 * @property {string} userId 用户ID，必填
 * @property {string} tenantId 目标租户ID，必填
 * @property {string} requestedBy 请求分配的用户ID，用于权限验证
 * @property {string} [role] 用户在租户中的角色，可选
 * @property {string} [reason] 分配原因，可选
 *
 * @example
 * ```typescript
 * const command = new AssignUserToTenantCommand({
 *   userId: 'user-123',
 *   tenantId: 'tenant-456',
 *   requestedBy: 'admin-789',
 *   role: 'MEMBER'
 * });
 * ```
 * @since 1.0.0
 */
export class AssignUserToTenantCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly requestedBy: string,
    public readonly role?: string,
    public readonly reason?: string,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令参数的有效性
   * @returns {void}
   * @throws {ValidationError} 当参数无效时抛出
   */
  private validate(): void {
    if (!this.userId || this.userId.trim() === '') {
      throw new Error('User ID is required');
    }

    if (!this.tenantId || this.tenantId.trim() === '') {
      throw new Error('Tenant ID is required');
    }

    if (!this.requestedBy || this.requestedBy.trim() === '') {
      throw new Error('Requested by is required');
    }

    // 验证UUID格式
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(this.userId)) {
      throw new Error('Invalid user ID format');
    }

    if (!uuidRegex.test(this.tenantId)) {
      throw new Error('Invalid tenant ID format');
    }

    if (!uuidRegex.test(this.requestedBy)) {
      throw new Error('Invalid requested by format');
    }
  }

  /**
   * @method toValueObjects
   * @description 将命令转换为值对象
   * @returns {object} 值对象集合
   */
  async toValueObjects(): Promise<{
    userId: TenantId;
    tenantId: TenantId;
  }> {
    return {
      userId: new TenantId(this.userId),
      tenantId: new TenantId(this.tenantId),
    };
  }

  /**
   * @method toJSON
   * @description 将命令转换为JSON对象
   * @returns {object} JSON对象
   */
  toJSON(): object {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      requestedBy: this.requestedBy,
      role: this.role,
      reason: this.reason,
    };
  }
}
