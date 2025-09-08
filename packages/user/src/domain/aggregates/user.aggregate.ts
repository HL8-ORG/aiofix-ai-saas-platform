import { EventSourcedAggregateRoot } from '@aiofix/core';
import { UserEntity } from '../entities';
import {
  UserCreatedEvent,
  UserProfileUpdatedEvent,
  UserStatusChangedEvent,
  UserPasswordUpdatedEvent,
  UserPreferencesUpdatedEvent,
} from '../events';
import { UserId, Email } from '@aiofix/shared';
import {
  Password,
  UserProfile,
  UserPreferences,
  UserStatus,
} from '../value-objects';

/**
 * @class UserAggregate
 * @description
 * 用户聚合根，负责管理用户相关的业务方法、事件发布和不变性约束。
 *
 * 业务方法与事件发布：
 * 1. 提供用户创建、更新、删除等业务方法
 * 2. 在状态变更时发布相应的领域事件
 * 3. 确保业务操作的事务一致性
 *
 * 不变性约束：
 * 1. 用户邮箱在租户内必须唯一
 * 2. 用户不能同时属于多个租户
 * 3. 用户删除前必须清理所有关联数据
 *
 * 事件溯源支持：
 * 1. 继承EventSourcedAggregateRoot，支持事件溯源模式
 * 2. 记录所有状态变更历史，支持时间旅行和审计
 * 3. 通过领域事件实现与其他聚合的松耦合通信
 *
 * @property {UserEntity} _user 封装的用户实体
 *
 * @example
 * ```typescript
 * const userAggregate = new UserAggregate(
 *   new UserId('user-123'),
 *   new Email('user@example.com'),
 *   new Password('hashedPassword'),
 *   new UserProfile('John', 'Doe'),
 *   new UserPreferences('zh-CN', 'Asia/Shanghai')
 * );
 * userAggregate.activate(); // 激活用户并发布事件
 * ```
 * @extends EventSourcedAggregateRoot
 * @since 1.0.0
 */
export class UserAggregate extends EventSourcedAggregateRoot {
  private readonly _user: UserEntity;

  /**
   * @constructor
   * @description
   * 创建用户聚合根实例，初始化用户实体和事件溯源支持。
   *
   * 原理与机制：
   * 1. 调用父类构造函数，初始化事件溯源基础设施
   * 2. 创建UserEntity实例，封装用户的核心业务逻辑
   * 3. 默认用户状态为PENDING，需要激活后才能正常使用
   * 4. 发布用户创建事件，实现事件驱动架构
   *
   * 功能与职责：
   * 1. 初始化用户聚合根的所有属性
   * 2. 设置事件溯源支持
   * 3. 确保聚合根的业务不变性约束
   * 4. 发布用户创建事件
   *
   * @param {UserId} id 用户唯一标识符
   * @param {Email} email 用户邮箱地址
   * @param {Password} password 用户密码对象
   * @param {UserProfile} profile 用户档案信息
   * @param {UserPreferences} preferences 用户偏好设置
   * @param {string} tenantId 租户ID，用于多租户数据隔离
   * @param {string} platformId 平台ID，用于平台级数据隔离
   * @param {UserStatus} [status=UserStatus.PENDING] 用户状态，默认为待激活状态
   * @param {string} [createdBy='system'] 创建者ID，用于审计追踪
   * @since 1.0.0
   */
  public constructor(
    id: UserId,
    email: Email,
    password: Password,
    profile: UserProfile,
    preferences: UserPreferences,
    tenantId: string,
    platformId: string,
    status: UserStatus = UserStatus.PENDING,
    createdBy: string = 'system',
  ) {
    super();
    this._user = new UserEntity(
      id,
      email,
      password,
      profile,
      preferences,
      tenantId,
      platformId,
      status,
      createdBy,
    );

    // 发布用户创建事件
    this.addDomainEvent(
      new UserCreatedEvent(
        id,
        email,
        profile,
        status,
        tenantId,
        platformId,
        createdBy,
      ),
    );
  }

  /**
   * @getter id
   * @description 获取聚合根的唯一标识符
   * @returns {string} 聚合根ID字符串值
   * @since 1.0.0
   */
  public get id(): string {
    return this._user.id.value;
  }

  /**
   * @getter user
   * @description 获取封装的用户实体
   * @returns {UserEntity} 用户实体实例
   * @since 1.0.0
   */
  public get user(): UserEntity {
    return this._user;
  }

  /**
   * @getter userId
   * @description 获取用户ID值对象
   * @returns {UserId} 用户ID值对象
   * @since 1.0.0
   */
  public get userId(): UserId {
    return this._user.id;
  }

  /**
   * @getter email
   * @description 获取用户邮箱地址
   * @returns {Email} 邮箱地址值对象
   * @since 1.0.0
   */
  public get email(): Email {
    return this._user.email;
  }

  /**
   * @getter profile
   * @description 获取用户档案信息
   * @returns {UserProfile} 用户档案值对象
   * @since 1.0.0
   */
  public get profile(): UserProfile {
    return this._user.profile;
  }

  /**
   * @getter preferences
   * @description 获取用户偏好设置
   * @returns {UserPreferences} 用户偏好值对象
   * @since 1.0.0
   */
  public get preferences(): UserPreferences {
    return this._user.preferences;
  }

  /**
   * @getter status
   * @description 获取用户当前状态
   * @returns {UserStatus} 用户状态枚举值
   * @since 1.0.0
   */
  public get status(): UserStatus {
    return this._user.status;
  }

  /**
   * @getter createdAt
   * @description 获取用户创建时间
   * @returns {Date} 用户创建时间戳
   * @since 1.0.0
   */
  public get createdAt(): Date {
    return this._user.createdAt;
  }

  /**
   * @getter updatedAt
   * @description 获取用户最后更新时间
   * @returns {Date} 用户最后更新时间戳
   * @since 1.0.0
   */
  public get updatedAt(): Date {
    return this._user.getUpdatedAt();
  }

  /**
   * @method updateProfile
   * @description
   * 更新用户档案信息，包括姓名、头像等个人信息。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的updateProfile方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   * 3. 发布UserProfileUpdatedEvent领域事件，实现事件驱动架构
   *
   * 功能与职责：
   * 1. 协调用户档案更新操作
   * 2. 维护聚合的一致性边界
   * 3. 发布档案更新事件
   *
   * @param {UserProfile} newProfile 新的用户档案信息
   * @param {string} [updatedBy='system'] 更新者ID，用于审计追踪
   * @throws {Error} 当用户状态不允许档案更新时抛出异常
   * @since 1.0.0
   */
  public updateProfile(
    newProfile: UserProfile,
    updatedBy: string = 'system',
  ): void {
    const oldProfile = this._user.profile;
    this._user.updateProfile(newProfile, updatedBy);

    // 发布用户档案更新事件
    this.addDomainEvent(
      new UserProfileUpdatedEvent(
        this._user.id,
        oldProfile,
        newProfile,
        updatedBy,
      ),
    );
  }

  /**
   * @method updatePreferences
   * @description
   * 更新用户偏好设置，包括语言、时区等个人设置。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的updatePreferences方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   * 3. 发布UserPreferencesUpdatedEvent领域事件，实现事件驱动架构
   *
   * 功能与职责：
   * 1. 协调用户偏好更新操作
   * 2. 维护聚合的一致性边界
   * 3. 发布偏好更新事件
   *
   * @param {UserPreferences} newPreferences 新的用户偏好设置
   * @param {string} [updatedBy='system'] 更新者ID，用于审计追踪
   * @since 1.0.0
   */
  public updatePreferences(
    newPreferences: UserPreferences,
    updatedBy: string = 'system',
  ): void {
    const oldPreferences = this._user.preferences;
    this._user.updatePreferences(newPreferences, updatedBy);

    // 发布用户偏好更新事件
    this.addDomainEvent(
      new UserPreferencesUpdatedEvent(
        this._user.id,
        oldPreferences,
        newPreferences,
        updatedBy,
      ),
    );
  }

  /**
   * @method updatePassword
   * @description
   * 更新用户密码，确保密码安全性和用户状态合法性。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的updatePassword方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   * 3. 发布UserPasswordUpdatedEvent领域事件，实现事件驱动架构
   *
   * 功能与职责：
   * 1. 协调用户密码更新操作
   * 2. 维护聚合的一致性边界
   * 3. 发布密码更新事件
   *
   * @param {Password} newPassword 新的密码对象，已包含哈希值
   * @param {string} [updatedBy='system'] 更新者ID，用于审计追踪
   * @param {string} [reason] 密码更新原因，可选
   * @param {boolean} [forceLogout] 是否强制登出，可选
   * @throws {Error} 当用户状态不允许密码更新时抛出异常
   * @since 1.0.0
   */
  public updatePassword(
    newPassword: Password,
    updatedBy: string = 'system',
    reason?: string,
    forceLogout?: boolean,
  ): void {
    this._user.updatePassword(newPassword, updatedBy);

    // 发布用户密码更新事件
    this.addDomainEvent(
      new UserPasswordUpdatedEvent(
        this._user.id,
        updatedBy,
        reason,
        forceLogout,
      ),
    );
  }

  /**
   * @method activate
   * @description
   * 激活用户账户，将用户状态从PENDING转换为ACTIVE。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的activate方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   * 3. 发布UserStatusChangedEvent领域事件，实现事件驱动架构
   *
   * 功能与职责：
   * 1. 协调用户激活操作
   * 2. 维护聚合的一致性边界
   * 3. 发布状态变更事件
   *
   * @param {string} [activatedBy='system'] 激活者ID，用于审计追踪
   * @param {string} [reason] 激活原因，可选
   * @throws {Error} 当用户状态不允许激活时抛出异常
   * @since 1.0.0
   */
  public activate(activatedBy: string = 'system', reason?: string): void {
    const oldStatus = this._user.status;
    this._user.activate(activatedBy);

    // 发布用户状态变更事件
    this.addDomainEvent(
      new UserStatusChangedEvent(
        this._user.id,
        oldStatus,
        this._user.status,
        activatedBy,
        reason,
      ),
    );
  }

  /**
   * @method suspend
   * @description
   * 暂停用户账户，将用户状态从ACTIVE转换为SUSPENDED。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的suspend方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   * 3. 发布UserStatusChangedEvent领域事件，实现事件驱动架构
   *
   * 功能与职责：
   * 1. 协调用户暂停操作
   * 2. 维护聚合的一致性边界
   * 3. 发布状态变更事件
   *
   * @param {string} [suspendedBy='system'] 暂停者ID，用于审计追踪
   * @param {string} [reason] 暂停原因，可选
   * @throws {Error} 当用户状态不允许暂停时抛出异常
   * @since 1.0.0
   */
  public suspend(suspendedBy: string = 'system', reason?: string): void {
    const oldStatus = this._user.status;
    this._user.suspend(suspendedBy);

    // 发布用户状态变更事件
    this.addDomainEvent(
      new UserStatusChangedEvent(
        this._user.id,
        oldStatus,
        this._user.status,
        suspendedBy,
        reason,
      ),
    );
  }

  /**
   * @method restore
   * @description
   * 恢复用户账户，将用户状态从SUSPENDED转换为ACTIVE。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的restore方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   * 3. 发布UserStatusChangedEvent领域事件，实现事件驱动架构
   *
   * 功能与职责：
   * 1. 协调用户恢复操作
   * 2. 维护聚合的一致性边界
   * 3. 发布状态变更事件
   *
   * @param {string} [restoredBy='system'] 恢复者ID，用于审计追踪
   * @param {string} [reason] 恢复原因，可选
   * @throws {Error} 当用户状态不允许恢复时抛出异常
   * @since 1.0.0
   */
  public restore(restoredBy: string = 'system', reason?: string): void {
    const oldStatus = this._user.status;
    this._user.restore(restoredBy);

    // 发布用户状态变更事件
    this.addDomainEvent(
      new UserStatusChangedEvent(
        this._user.id,
        oldStatus,
        this._user.status,
        restoredBy,
        reason,
      ),
    );
  }

  /**
   * @method delete
   * @description
   * 软删除用户账户，将用户状态转换为DELETED。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的delete方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   * 3. 发布UserStatusChangedEvent领域事件，实现事件驱动架构
   *
   * 功能与职责：
   * 1. 协调用户删除操作
   * 2. 维护聚合的一致性边界
   * 3. 发布状态变更事件
   *
   * @param {string} [deletedBy='system'] 删除者ID，用于审计追踪
   * @param {string} [reason] 删除原因，可选
   * @throws {Error} 当用户已被删除时抛出异常
   * @since 1.0.0
   */
  public delete(deletedBy: string = 'system', reason?: string): void {
    const oldStatus = this._user.status;
    this._user.delete(deletedBy);

    // 发布用户状态变更事件
    this.addDomainEvent(
      new UserStatusChangedEvent(
        this._user.id,
        oldStatus,
        this._user.status,
        deletedBy,
        reason,
      ),
    );
  }

  /**
   * @method verifyPassword
   * @description
   * 验证用户密码，确保密码正确性和用户状态合法性。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的verifyPassword方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   * 3. 使用异步操作确保密码验证的性能和安全性
   *
   * 功能与职责：
   * 1. 协调用户密码验证操作
   * 2. 维护聚合的一致性边界
   * 3. 返回密码验证结果
   *
   * @param {string} plainPassword 明文密码
   * @returns {Promise<boolean>} 密码验证结果，true表示密码正确
   * @since 1.0.0
   */
  public async verifyPassword(plainPassword: string): Promise<boolean> {
    return await this._user.verifyPassword(plainPassword);
  }

  /**
   * @method isActive
   * @description
   * 检查用户是否处于活跃状态。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的isActive方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   *
   * 功能与职责：
   * 1. 协调用户活跃状态检查操作
   * 2. 维护聚合的一致性边界
   * 3. 返回活跃状态判断结果
   *
   * @returns {boolean} 用户是否处于活跃状态
   * @since 1.0.0
   */
  public isActive(): boolean {
    return this._user.isActive();
  }

  /**
   * @method canBeOperated
   * @description
   * 检查用户是否可以被操作，用于权限控制。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的canBeOperated方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   *
   * 功能与职责：
   * 1. 协调用户操作权限检查操作
   * 2. 维护聚合的一致性边界
   * 3. 为权限控制提供状态检查依据
   *
   * @returns {boolean} 用户是否可以被操作
   * @since 1.0.0
   */
  public canBeOperated(): boolean {
    return this._user.canBeOperated();
  }

  /**
   * @method getDisplayName
   * @description
   * 获取用户显示名称，用于界面展示。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的getDisplayName方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   *
   * 功能与职责：
   * 1. 协调用户显示名称获取操作
   * 2. 维护聚合的一致性边界
   * 3. 为界面展示提供标准化的用户名称
   *
   * @returns {string} 用户显示名称
   * @since 1.0.0
   */
  public getDisplayName(): string {
    return this._user.getDisplayName();
  }

  /**
   * @method equals
   * @description
   * 检查用户聚合根是否相等，基于用户ID进行比较。
   *
   * 原理与机制：
   * 1. 委托给UserEntity的equals方法执行具体的业务逻辑
   * 2. 通过聚合根统一管理业务操作，确保一致性边界
   * 3. 确保聚合根比较的准确性和一致性
   *
   * 功能与职责：
   * 1. 协调用户聚合根相等性比较操作
   * 2. 维护聚合的一致性边界
   * 3. 为集合操作和缓存提供相等性判断
   *
   * @param {UserAggregate} other 要比较的另一个用户聚合根
   * @returns {boolean} 两个用户聚合根是否相等
   * @since 1.0.0
   */
  public equals(other: UserAggregate): boolean {
    return this._user.equals(other._user);
  }

  /**
   * @method handleEvent
   * @description
   * 处理领域事件，实现EventSourcedAggregateRoot的抽象方法。
   *
   * 原理与机制：
   * 1. 实现事件溯源模式的事件处理逻辑
   * 2. 根据事件类型更新聚合状态，确保状态一致性
   * 3. 支持从历史事件重建聚合状态
   *
   * 功能与职责：
   * 1. 处理用户相关的领域事件
   * 2. 根据事件类型更新用户状态
   * 3. 维护聚合的状态一致性
   *
   * @param {unknown} _event 领域事件对象
   * @param {boolean} _isFromHistory 是否为历史事件
   * @since 1.0.0
   */
  protected handleEvent(_event: unknown, _isFromHistory: boolean): void {
    // TODO: 实现事件处理逻辑
    // 根据事件类型更新用户状态
  }

  /**
   * @method toSnapshot
   * @description
   * 将聚合状态转换为快照数据，实现EventSourcedAggregateRoot的抽象方法。
   *
   * 原理与机制：
   * 1. 将聚合的当前状态序列化为快照数据
   * 2. 用于性能优化，避免重放大量历史事件
   * 3. 支持聚合状态的快速恢复
   *
   * 功能与职责：
   * 1. 序列化聚合状态为快照数据
   * 2. 为性能优化提供支持
   * 3. 支持状态恢复机制
   *
   * @returns {Record<string, unknown>} 聚合状态快照数据
   * @since 1.0.0
   */
  protected toSnapshot(): Record<string, unknown> {
    return this.getSnapshot();
  }

  /**
   * @method fromSnapshot
   * @description
   * 从快照数据恢复聚合状态，实现EventSourcedAggregateRoot的抽象方法。
   *
   * 原理与机制：
   * 1. 从快照数据反序列化聚合状态
   * 2. 用于性能优化，快速恢复聚合状态
   * 3. 避免重放大量历史事件的开销
   *
   * 功能与职责：
   * 1. 从快照数据恢复聚合状态
   * 2. 为性能优化提供支持
   * 3. 支持状态快速恢复机制
   *
   * @param {Record<string, unknown>} _data 快照数据
   * @since 1.0.0
   */
  protected fromSnapshot(_data: Record<string, unknown>): void {
    // TODO: 实现从快照恢复状态的逻辑
  }

  /**
   * @method fromHistory
   * @description
   * 从历史事件重建聚合，用于事件溯源。
   *
   * 原理与机制：
   * 1. 重放历史事件序列，重建聚合状态
   * 2. 支持时间旅行和状态审计功能
   * 3. 确保聚合状态的一致性和完整性
   *
   * 功能与职责：
   * 1. 从历史事件重建聚合状态
   * 2. 支持事件溯源功能
   * 3. 提供状态审计能力
   *
   * @param {unknown[]} _events 历史事件序列
   * @returns {UserAggregate} 重建的用户聚合根
   * @throws {Error} 当实现未完成时抛出异常
   * @since 1.0.0
   */
  public static fromHistory(_events: unknown[]): UserAggregate {
    // TODO: 实现从历史事件重建聚合的逻辑
    throw new Error('Not implemented yet');
  }

  /**
   * @method getSnapshot
   * @description
   * 获取聚合的当前状态快照，用于性能优化。
   *
   * 原理与机制：
   * 1. 将聚合的当前状态序列化为快照数据
   * 2. 包含用户的所有关键属性信息
   * 3. 用于性能优化和状态恢复
   *
   * 功能与职责：
   * 1. 序列化聚合状态为快照数据
   * 2. 为性能优化提供支持
   * 3. 支持状态恢复机制
   *
   * @returns {Record<string, unknown>} 聚合状态快照数据
   * @since 1.0.0
   */
  public getSnapshot(): Record<string, unknown> {
    // TODO: 实现聚合状态快照
    return {
      id: this._user.id.value,
      email: this._user.email.value,
      profile: this._user.profile,
      preferences: this._user.preferences,
      status: this._user.status,
      createdAt: this._user.createdAt,
      updatedAt: this._user.getUpdatedAt(),
    };
  }
}
