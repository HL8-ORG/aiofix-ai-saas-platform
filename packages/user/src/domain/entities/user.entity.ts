import {
  UserId,
  Email,
  Password,
  UserProfile,
  UserPreferences,
  UserStatus,
} from '../value-objects';

/**
 * @class UserEntity
 * @description
 * 用户领域实体，负责维护用户的身份标识、状态管理和生命周期。
 *
 * 身份标识与状态管理：
 * 1. 通过唯一ID标识用户身份，确保实体的唯一性和可识别性
 * 2. 管理用户的基本状态（PENDING、ACTIVE、SUSPENDED、DELETED）
 * 3. 维护用户的生命周期状态变更，确保状态转换的合法性
 *
 * 业务规则与约束：
 * 1. 用户ID一旦创建不可变更，确保实体标识的稳定性
 * 2. 用户状态变更必须遵循预定义的状态机规则
 * 3. 删除用户时采用软删除策略，保留数据用于审计和恢复
 * 4. 只有激活状态的用户才能进行档案更新和密码修改操作
 *
 * 数据封装与验证：
 * 1. 通过值对象封装复杂属性（UserId、Email、Password等）
 * 2. 确保领域概念的完整性和类型安全
 * 3. 实现用户实体的相等性比较，基于用户ID进行身份识别
 *
 * @property {UserId} _id 用户唯一标识符，创建后不可更改
 * @property {Email} _email 用户邮箱地址，必须唯一且有效
 * @property {Password} _password 用户密码对象，包含哈希值
 * @property {UserProfile} _profile 用户档案信息，包含姓名、头像等
 * @property {UserPreferences} _preferences 用户偏好设置，如语言、时区等
 * @property {UserStatus} _status 用户当前状态
 * @property {Date} _createdAt 用户创建时间
 * @property {Date} _updatedAt 用户最后更新时间
 *
 * @example
 * ```typescript
 * const user = new UserEntity(
 *   new UserId('user-123'),
 *   new Email('user@example.com'),
 *   new Password('hashedPassword'),
 *   new UserProfile('John', 'Doe'),
 *   new UserPreferences('zh-CN', 'Asia/Shanghai')
 * );
 * user.activate(); // 激活用户
 * ```
 * @since 1.0.0
 */
export class UserEntity {
  private readonly _id: UserId;
  private readonly _email: Email;
  private _password: Password;
  private _profile: UserProfile;
  private _preferences: UserPreferences;
  private _status: UserStatus;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  /**
   * @constructor
   * @description
   * 创建用户实体实例，初始化用户的基本信息和状态。
   *
   * 原理与机制：
   * 1. 通过构造函数注入所有必要的值对象，确保实体的完整性
   * 2. 自动设置创建时间和更新时间，用于审计和版本控制
   * 3. 默认用户状态为PENDING，需要激活后才能正常使用
   *
   * 功能与职责：
   * 1. 初始化用户实体的所有属性
   * 2. 设置实体的创建和更新时间戳
   * 3. 确保实体的业务不变性约束
   *
   * @param {UserId} id 用户唯一标识符，创建后不可更改
   * @param {Email} email 用户邮箱地址，必须唯一且有效
   * @param {Password} password 用户密码对象，包含哈希值
   * @param {UserProfile} profile 用户档案信息，包含姓名、头像等
   * @param {UserPreferences} preferences 用户偏好设置，如语言、时区等
   * @param {UserStatus} [status=UserStatus.PENDING] 用户状态，默认为待激活状态
   * @throws {Error} 当参数验证失败时抛出异常
   * @since 1.0.0
   */
  public constructor(
    id: UserId,
    email: Email,
    password: Password,
    profile: UserProfile,
    preferences: UserPreferences,
    status: UserStatus = UserStatus.PENDING,
  ) {
    this._id = id;
    this._email = email;
    this._password = password;
    this._profile = profile;
    this._preferences = preferences;
    this._status = status;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * @getter id
   * @description 获取用户唯一标识符
   * @returns {UserId} 用户ID值对象，创建后不可更改
   * @since 1.0.0
   */
  public get id(): UserId {
    return this._id;
  }

  /**
   * @getter email
   * @description 获取用户邮箱地址
   * @returns {Email} 邮箱地址值对象，包含验证逻辑
   * @since 1.0.0
   */
  public get email(): Email {
    return this._email;
  }

  /**
   * @getter password
   * @description 获取用户密码对象
   * @returns {Password} 密码值对象，包含哈希值，不直接暴露明文
   * @since 1.0.0
   */
  public get password(): Password {
    return this._password;
  }

  /**
   * @getter profile
   * @description 获取用户档案信息
   * @returns {UserProfile} 用户档案值对象，包含姓名、头像等个人信息
   * @since 1.0.0
   */
  public get profile(): UserProfile {
    return this._profile;
  }

  /**
   * @getter preferences
   * @description 获取用户偏好设置
   * @returns {UserPreferences} 用户偏好值对象，包含语言、时区等设置
   * @since 1.0.0
   */
  public get preferences(): UserPreferences {
    return this._preferences;
  }

  /**
   * @getter status
   * @description 获取用户当前状态
   * @returns {UserStatus} 用户状态枚举值
   * @since 1.0.0
   */
  public get status(): UserStatus {
    return this._status;
  }

  /**
   * @getter createdAt
   * @description 获取用户创建时间
   * @returns {Date} 用户创建时间戳，用于审计和版本控制
   * @since 1.0.0
   */
  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * @getter updatedAt
   * @description 获取用户最后更新时间
   * @returns {Date} 用户最后更新时间戳，用于审计和版本控制
   * @since 1.0.0
   */
  public get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * @method updateProfile
   * @description
   * 更新用户档案信息，包括姓名、头像等个人信息。
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的用户才能更新档案
   * 2. 直接替换整个UserProfile值对象，确保数据一致性
   * 3. 自动更新实体的修改时间戳，用于审计和版本控制
   *
   * 功能与职责：
   * 1. 验证用户状态是否允许档案更新操作
   * 2. 更新用户档案信息
   * 3. 记录操作时间戳
   *
   * @param {UserProfile} newProfile 新的用户档案信息
   * @throws {Error} 当用户状态为SUSPENDED时抛出异常
   * @since 1.0.0
   */
  public updateProfile(newProfile: UserProfile): void {
    if (this._status === UserStatus.SUSPENDED) {
      throw new Error('已暂停的用户无法更新档案');
    }

    this._profile = newProfile;
    this._updatedAt = new Date();
  }

  /**
   * @method updatePreferences
   * @description
   * 更新用户偏好设置，包括语言、时区等个人设置。
   *
   * 原理与机制：
   * 1. 偏好设置更新不受用户状态限制，任何状态的用户都可以更新
   * 2. 直接替换整个UserPreferences值对象，确保数据一致性
   * 3. 自动更新实体的修改时间戳，用于审计和版本控制
   *
   * 功能与职责：
   * 1. 更新用户偏好设置信息
   * 2. 记录操作时间戳
   *
   * @param {UserPreferences} newPreferences 新的用户偏好设置
   * @since 1.0.0
   */
  public updatePreferences(newPreferences: UserPreferences): void {
    this._preferences = newPreferences;
    this._updatedAt = new Date();
  }

  /**
   * @method updatePassword
   * @description
   * 更新用户密码，确保密码安全性和用户状态合法性。
   *
   * 原理与机制：
   * 1. 通过状态检查确保只有有效状态的用户才能更新密码
   * 2. 直接替换Password值对象，新密码已包含哈希处理
   * 3. 自动更新实体的修改时间戳，用于审计和版本控制
   *
   * 功能与职责：
   * 1. 验证用户状态是否允许密码更新操作
   * 2. 更新用户密码信息
   * 3. 记录操作时间戳
   *
   * @param {Password} newPassword 新的密码对象，已包含哈希值
   * @throws {Error} 当用户状态为SUSPENDED时抛出异常
   * @since 1.0.0
   */
  public updatePassword(newPassword: Password): void {
    if (this._status === UserStatus.SUSPENDED) {
      throw new Error('已暂停的用户无法更新密码');
    }

    this._password = newPassword;
    this._updatedAt = new Date();
  }

  /**
   * @method activate
   * @description
   * 激活用户账户，将用户状态从PENDING转换为ACTIVE。
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有PENDING状态的用户才能被激活，防止非法状态转换
   * 3. 激活后用户可以进行正常的业务操作
   *
   * 功能与职责：
   * 1. 验证当前用户状态是否为PENDING
   * 2. 将用户状态更新为ACTIVE
   * 3. 记录状态变更时间戳
   *
   * @throws {Error} 当用户状态不是PENDING时抛出异常
   * @since 1.0.0
   */
  public activate(): void {
    if (this._status !== UserStatus.PENDING) {
      throw new Error('只有待激活状态的用户才能被激活');
    }

    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * @method suspend
   * @description
   * 暂停用户账户，将用户状态从ACTIVE转换为SUSPENDED。
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有ACTIVE状态的用户才能被暂停，防止非法状态转换
   * 3. 暂停后用户无法进行需要权限的业务操作
   *
   * 功能与职责：
   * 1. 验证当前用户状态是否为ACTIVE
   * 2. 将用户状态更新为SUSPENDED
   * 3. 记录状态变更时间戳
   *
   * @throws {Error} 当用户状态不是ACTIVE时抛出异常
   * @since 1.0.0
   */
  public suspend(): void {
    if (this._status !== UserStatus.ACTIVE) {
      throw new Error('只有激活状态的用户才能被暂停');
    }

    this._status = UserStatus.SUSPENDED;
    this._updatedAt = new Date();
  }

  /**
   * @method restore
   * @description
   * 恢复用户账户，将用户状态从SUSPENDED转换为ACTIVE。
   *
   * 原理与机制：
   * 1. 遵循状态机模式，确保状态转换的合法性
   * 2. 只有SUSPENDED状态的用户才能被恢复，防止非法状态转换
   * 3. 恢复后用户重新获得正常的业务操作权限
   *
   * 功能与职责：
   * 1. 验证当前用户状态是否为SUSPENDED
   * 2. 将用户状态更新为ACTIVE
   * 3. 记录状态变更时间戳
   *
   * @throws {Error} 当用户状态不是SUSPENDED时抛出异常
   * @since 1.0.0
   */
  public restore(): void {
    if (this._status !== UserStatus.SUSPENDED) {
      throw new Error('只有暂停状态的用户才能被恢复');
    }

    this._status = UserStatus.ACTIVE;
    this._updatedAt = new Date();
  }

  /**
   * @method delete
   * @description
   * 软删除用户账户，将用户状态转换为DELETED。
   *
   * 原理与机制：
   * 1. 采用软删除策略，保留用户数据用于审计和恢复
   * 2. 防止重复删除操作，确保数据一致性
   * 3. 删除后用户数据仍然保留，但用户无法进行任何操作
   *
   * 功能与职责：
   * 1. 验证当前用户状态是否已被删除
   * 2. 将用户状态更新为DELETED
   * 3. 记录删除操作时间戳
   *
   * @throws {Error} 当用户已被删除时抛出异常
   * @since 1.0.0
   */
  public delete(): void {
    if (this._status === UserStatus.DELETED) {
      throw new Error('用户已经被删除');
    }

    this._status = UserStatus.DELETED;
    this._updatedAt = new Date();
  }

  /**
   * @method verifyPassword
   * @description
   * 验证用户密码，确保密码正确性和用户状态合法性。
   *
   * 原理与机制：
   * 1. 通过Password值对象的verify方法进行密码验证
   * 2. 已删除用户直接返回false，不进行密码验证
   * 3. 使用异步操作确保密码验证的性能和安全性
   *
   * 功能与职责：
   * 1. 检查用户状态是否允许密码验证
   * 2. 调用Password值对象进行密码验证
   * 3. 返回验证结果
   *
   * @param {string} plainPassword 明文密码
   * @returns {Promise<boolean>} 密码验证结果，true表示密码正确
   * @since 1.0.0
   */
  public async verifyPassword(plainPassword: string): Promise<boolean> {
    if (this._status === UserStatus.DELETED) {
      return false;
    }

    return await this._password.verify(plainPassword);
  }

  /**
   * @method isActive
   * @description
   * 检查用户是否处于活跃状态。
   *
   * 原理与机制：
   * 1. 通过比较用户状态与ACTIVE枚举值判断活跃状态
   * 2. 只有ACTIVE状态的用户才被认为是活跃用户
   *
   * 功能与职责：
   * 1. 判断用户当前状态是否为ACTIVE
   * 2. 返回活跃状态判断结果
   *
   * @returns {boolean} 用户是否处于活跃状态
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  /**
   * @method canBeOperated
   * @description
   * 检查用户是否可以被操作，用于权限控制。
   *
   * 原理与机制：
   * 1. 只有ACTIVE状态的用户才能进行业务操作
   * 2. 其他状态的用户（PENDING、SUSPENDED、DELETED）都无法进行操作
   *
   * 功能与职责：
   * 1. 判断用户是否可以进行业务操作
   * 2. 为权限控制提供状态检查依据
   *
   * @returns {boolean} 用户是否可以被操作
   * @since 1.0.0
   */
  public canBeOperated(): boolean {
    return this._status === UserStatus.ACTIVE;
  }

  /**
   * @method getDisplayName
   * @description
   * 获取用户显示名称，用于界面展示。
   *
   * 原理与机制：
   * 1. 委托给UserProfile值对象的getDisplayName方法
   * 2. 确保显示名称的一致性和格式化
   *
   * 功能与职责：
   * 1. 获取用户的显示名称
   * 2. 为界面展示提供标准化的用户名称
   *
   * @returns {string} 用户显示名称
   * @since 1.0.0
   */
  public getDisplayName(): string {
    return this._profile.getDisplayName();
  }

  /**
   * @method equals
   * @description
   * 检查用户实体是否相等，基于用户ID进行比较。
   *
   * 原理与机制：
   * 1. 通过UserId值对象的equals方法进行身份比较
   * 2. 确保实体比较的准确性和一致性
   * 3. 遵循值对象相等性比较的最佳实践
   *
   * 功能与职责：
   * 1. 比较两个用户实体是否为同一用户
   * 2. 为集合操作和缓存提供相等性判断
   *
   * @param {UserEntity} other 要比较的另一个用户实体
   * @returns {boolean} 两个用户实体是否相等
   * @since 1.0.0
   */
  public equals(other: UserEntity): boolean {
    return this._id.equals(other._id);
  }
}
