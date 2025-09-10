import { v4 as uuidv4 } from 'uuid';
import { UserId, Email } from '@aiofix/shared';
import {
  Password,
  UserProfile,
  UserPreferences,
  UserStatus,
} from '../../domain/value-objects';

/**
 * @class UpdateUserCommand
 * @description
 * 更新用户命令，封装用户更新操作的输入参数和验证规则。
 *
 * 命令职责：
 * 1. 封装用户更新所需的所有输入参数
 * 2. 提供数据验证和格式检查
 * 3. 确保命令的不可变性和幂等性
 * 4. 支持命令的序列化和反序列化
 *
 * 数据隔离要求：
 * 1. 命令必须包含租户ID以确保数据隔离
 * 2. 验证用户邮箱在租户内的唯一性
 * 3. 确保命令执行者具有相应权限
 *
 * @property {string} userId 用户ID，必填
 * @property {string} [email] 用户邮箱地址，可选
 * @property {string} [password] 用户密码，可选
 * @property {string} [firstName] 用户名字，可选
 * @property {string} [lastName] 用户姓氏，可选
 * @property {string} [phoneNumber] 电话号码，可选
 * @property {string} [avatar] 头像URL，可选
 * @property {UserStatus} [status] 用户状态，可选
 * @property {string} tenantId 所属租户ID，必填
 * @property {string} organizationId 所属组织ID，可选
 * @property {string} departmentId 所属部门ID，可选
 * @property {string} requestedBy 请求更新的用户ID，用于权限验证
 *
 * @example
 * ```typescript
 * const command = new UpdateUserCommand({
 *   userId: 'user-123',
 *   email: 'newemail@example.com',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   tenantId: 'tenant-123',
 *   requestedBy: 'admin-456'
 * });
 * ```
 * @since 1.0.0
 */
export class UpdateUserCommand {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string,
    public readonly requestedBy: string,
    public readonly email?: string,
    public readonly password?: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly phoneNumber?: string,
    public readonly avatar?: string,
    public readonly status?: UserStatus,
    public readonly organizationId?: string,
    public readonly departmentId?: string,
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

    // 验证邮箱格式
    if (this.email && !this.isValidEmail(this.email)) {
      throw new Error('邮箱格式不正确');
    }

    // 验证密码强度
    if (this.password && !this.isValidPassword(this.password)) {
      throw new Error('密码强度不符合要求');
    }

    // 验证姓名长度
    if (
      this.firstName &&
      (this.firstName.length < 1 || this.firstName.length > 50)
    ) {
      throw new Error('名字长度必须在1-50个字符之间');
    }

    if (
      this.lastName &&
      (this.lastName.length < 1 || this.lastName.length > 50)
    ) {
      throw new Error('姓氏长度必须在1-50个字符之间');
    }

    // 验证电话号码格式
    if (this.phoneNumber && !this.isValidPhoneNumber(this.phoneNumber)) {
      throw new Error('电话号码格式不正确');
    }

    // 验证头像URL格式
    if (this.avatar && !this.isValidUrl(this.avatar)) {
      throw new Error('头像URL格式不正确');
    }
  }

  /**
   * @method isValidEmail
   * @description 验证邮箱格式
   * @param {string} email 邮箱地址
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * @method isValidPassword
   * @description 验证密码强度
   * @param {string} password 密码
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidPassword(password: string): boolean {
    // 至少8位，包含大小写字母、数字和特殊字符
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * @method isValidPhoneNumber
   * @description 验证电话号码格式
   * @param {string} phoneNumber 电话号码
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    // 支持国际格式的电话号码
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * @method isValidUrl
   * @description 验证URL格式
   * @param {string} url URL地址
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
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
      email: this.email,
      password: this.password ? '[REDACTED]' : undefined,
      firstName: this.firstName,
      lastName: this.lastName,
      phoneNumber: this.phoneNumber,
      avatar: this.avatar,
      status: this.status,
      organizationId: this.organizationId,
      departmentId: this.departmentId,
    };
  }
}
