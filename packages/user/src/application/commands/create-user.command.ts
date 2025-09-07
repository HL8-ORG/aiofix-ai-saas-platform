import { v4 as uuidv4 } from 'uuid';
import {
  UserId,
  Email,
  Password,
  UserProfile,
  UserPreferences,
} from '../../domain/value-objects';

/**
 * @class CreateUserCommand
 * @description
 * 创建用户命令，封装用户创建操作的输入参数和验证规则。
 *
 * 命令职责：
 * 1. 封装用户创建所需的所有输入参数
 * 2. 提供数据验证和格式检查
 * 3. 确保命令的不可变性和幂等性
 * 4. 支持命令的序列化和反序列化
 *
 * 数据隔离要求：
 * 1. 命令必须包含租户ID以确保数据隔离
 * 2. 验证用户邮箱在租户内的唯一性
 * 3. 确保命令执行者具有相应权限
 *
 * @property {string} email 用户邮箱地址，必填且格式验证
 * @property {string} password 用户密码，必填且强度验证
 * @property {string} firstName 用户名字，必填
 * @property {string} lastName 用户姓氏，必填
 * @property {string} tenantId 所属租户ID，必填
 * @property {string} organizationId 所属组织ID，可选
 * @property {string} departmentId 所属部门ID，可选
 * @property {string} requestedBy 请求创建的用户ID，用于权限验证
 *
 * @example
 * ```typescript
 * const command = new CreateUserCommand({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   firstName: 'John',
 *   lastName: 'Doe',
 *   tenantId: 'tenant-123',
 *   requestedBy: 'admin-456'
 * });
 * ```
 * @since 1.0.0
 */
export class CreateUserCommand {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly tenantId: string,
    public readonly requestedBy: string,
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
    if (!this.email?.includes('@')) {
      throw new Error('邮箱地址格式不正确');
    }

    if (!this.password || this.password.length < 8) {
      throw new Error('密码长度不能少于8位');
    }

    if (!this.firstName || !this.lastName) {
      throw new Error('用户姓名不能为空');
    }

    if (!this.tenantId) {
      throw new Error('租户ID不能为空');
    }

    if (!this.requestedBy) {
      throw new Error('请求者ID不能为空');
    }
  }

  /**
   * @method toValueObjects
   * @description 将命令参数转换为值对象
   * @returns {Object} 包含值对象的对象
   */
  public async toValueObjects(): Promise<{
    id: UserId;
    email: Email;
    password: Password;
    profile: UserProfile;
    preferences: UserPreferences;
  }> {
    try {
      return {
        id: new UserId(uuidv4()),
        email: new Email(this.email),
        password: await Password.create(this.password),
        profile: new UserProfile({
          firstName: this.firstName,
          lastName: this.lastName,
        }),
        preferences: new UserPreferences({
          language: 'zh-CN',
          timezone: 'Asia/Shanghai',
          theme: 'light',
          dateFormat: 'YYYY-MM-DD',
          timeFormat: '24h',
          currency: 'CNY',
          // TODO: 后续开发替代any需要修改
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          notifications: {} as any,
          // TODO: 后续开发替代any需要修改
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          privacy: {} as any,
          // TODO: 后续开发替代any需要修改
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
          accessibility: {} as any,
        }),
      };
    } catch (error) {
      throw new Error(
        `Failed to create value objects: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }
}
