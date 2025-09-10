import { v4 as uuidv4 } from 'uuid';
import { UserId } from '@aiofix/shared';

/**
 * @class DeleteUserCommand
 * @description
 * 删除用户命令，封装用户删除操作的输入参数和验证规则。
 *
 * 命令职责：
 * 1. 封装用户删除所需的所有输入参数
 * 2. 提供数据验证和格式检查
 * 3. 确保命令的不可变性和幂等性
 * 4. 支持命令的序列化和反序列化
 *
 * 数据隔离要求：
 * 1. 命令必须包含租户ID以确保数据隔离
 * 2. 验证用户存在性和权限
 * 3. 确保命令执行者具有相应权限
 *
 * @property {string} userId 用户ID，必填
 * @property {string} tenantId 所属租户ID，必填
 * @property {string} requestedBy 请求删除的用户ID，用于权限验证
 * @property {string} [reason] 删除原因，可选
 * @property {boolean} [hardDelete=false] 是否硬删除，默认软删除
 *
 * @example
 * ```typescript
 * const command = new DeleteUserCommand({
 *   userId: 'user-123',
 *   tenantId: 'tenant-123',
 *   requestedBy: 'admin-456',
 *   reason: 'Account deactivated by user request'
 * });
 * ```
 * @since 1.0.0
 */
export class DeleteUserCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly requestedBy: string,
    public readonly reason?: string,
    public readonly hardDelete: boolean = false,
  ) {
    this.validate();
  }

  /**
   * @method validate
   * @description 验证命令参数的有效性
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

    // 验证删除原因长度
    if (this.reason && this.reason.length > 500) {
      throw new Error('删除原因长度不能超过500个字符');
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
   * @description 将命令转换为JSON格式
   * @returns {Record<string, unknown>} JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      userId: this.userId,
      tenantId: this.tenantId,
      requestedBy: this.requestedBy,
      reason: this.reason,
      hardDelete: this.hardDelete,
    };
  }
}
