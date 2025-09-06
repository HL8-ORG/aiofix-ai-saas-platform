import { v4 as uuidv4 } from 'uuid';
import { EventSourcedAggregateRoot } from '../domain/event-sourced-aggregate-root';
import { DomainEvent } from '../domain/domain-event';
import { IDomainEvent } from '../domain/interfaces/domain-event.interface';

/**
 * 用户创建事件
 *
 * 表示用户被创建的业务事件。
 *
 * @class UserCreatedEvent
 * @extends {DomainEvent}
 * @author AI开发团队
 * @since 1.0.0
 */
export class UserCreatedEvent extends DomainEvent {
  /**
   * 用户邮箱
   */
  public readonly email: string;

  /**
   * 加密后的密码
   */
  public readonly hashedPassword: string;

  /**
   * 用户姓名
   */
  public readonly name: string;

  /**
   * 构造函数
   *
   * @param {string} aggregateId - 聚合根ID
   * @param {string} email - 用户邮箱
   * @param {string} hashedPassword - 加密后的密码
   * @param {string} name - 用户姓名
   */
  constructor(
    aggregateId: string,
    email: string,
    hashedPassword: string,
    name: string,
  ) {
    super(aggregateId);
    this.email = email;
    this.hashedPassword = hashedPassword;
    this.name = name;
  }

  /**
   * 转换为JSON格式
   *
   * @returns {any} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      email: this.email,
      hashedPassword: this.hashedPassword,
      name: this.name,
    };
  }
}

/**
 * 用户资料更新事件
 *
 * 表示用户资料被更新的业务事件。
 *
 * @class UserProfileUpdatedEvent
 * @extends {DomainEvent}
 * @author AI开发团队
 * @since 1.0.0
 */
export class UserProfileUpdatedEvent extends DomainEvent {
  /**
   * 更新的资料信息
   */
  public readonly profile: {
    name?: string;
    phone?: string;
    avatar?: string;
  };

  /**
   * 构造函数
   *
   * @param {string} aggregateId - 聚合根ID
   * @param {object} profile - 更新的资料信息
   */
  constructor(
    aggregateId: string,
    profile: { name?: string; phone?: string; avatar?: string },
  ) {
    super(aggregateId);
    this.profile = profile;
  }

  /**
   * 转换为JSON格式
   *
   * @returns {any} 事件的JSON表示
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      profile: this.profile,
    };
  }
}

/**
 * 用户聚合根
 *
 * 表示系统中的用户实体，使用事件溯源模式管理用户状态。
 *
 * 业务规则：
 * 1. 用户必须有唯一的邮箱地址
 * 2. 用户密码必须加密存储
 * 3. 用户资料更新需要验证数据有效性
 * 4. 用户状态变更需要记录审计日志
 *
 * @class User
 * @extends {EventSourcedAggregateRoot}
 * @author AI开发团队
 * @since 1.0.0
 */
export class User extends EventSourcedAggregateRoot {
  /**
   * 用户ID
   */
  public readonly id: string;

  /**
   * 用户邮箱
   */
  private _email: string = '';

  /**
   * 加密后的密码
   */
  private _hashedPassword: string = '';

  /**
   * 用户姓名
   */
  private _name: string = '';

  /**
   * 用户电话
   */
  private _phone: string = '';

  /**
   * 用户头像
   */
  private _avatar: string = '';

  /**
   * 用户状态
   */
  private _status: 'active' | 'inactive' | 'locked' = 'active';

  /**
   * 创建时间
   */
  private _createdAt: Date = new Date();

  /**
   * 更新时间
   */
  private _updatedAt: Date = new Date();

  /**
   * 构造函数
   *
   * @param {string} [id] - 用户ID，如果不提供则自动生成
   */
  constructor(id?: string) {
    super();
    this.id = id ?? uuidv4();
  }

  /**
   * 创建用户
   *
   * 静态工厂方法，用于创建新用户。
   *
   * @param {string} email - 用户邮箱
   * @param {string} password - 用户密码（明文）
   * @param {string} name - 用户姓名
   * @returns {User} 新创建的用户
   *
   * @throws {Error} 当邮箱格式无效时抛出错误
   * @throws {Error} 当密码强度不足时抛出错误
   */
  public static create(email: string, password: string, name: string): User {
    // 验证邮箱格式
    if (!this.isValidEmail(email)) {
      throw new Error('邮箱格式无效');
    }

    // 验证密码强度
    if (!this.isValidPassword(password)) {
      throw new Error(
        '密码强度不足，必须包含大小写字母、数字和特殊字符，长度至少8位',
      );
    }

    // 验证姓名
    if (!name || name.trim().length === 0) {
      throw new Error('用户姓名不能为空');
    }

    const user = new User();
    const hashedPassword = user.hashPassword(password);

    const event = new UserCreatedEvent(user.id, email, hashedPassword, name);

    user.apply(event);
    return user;
  }

  /**
   * 更新用户资料
   *
   * @param {object} profile - 要更新的资料信息
   *
   * @throws {Error} 当用户状态不是活跃时抛出错误
   * @throws {Error} 当资料信息无效时抛出错误
   */
  public updateProfile(profile: {
    name?: string;
    phone?: string;
    avatar?: string;
  }): void {
    // 验证用户状态
    if (this._status !== 'active') {
      throw new Error('只有活跃用户才能更新资料');
    }

    // 验证资料信息
    if (
      profile.name !== undefined &&
      (!profile.name || profile.name.trim().length === 0)
    ) {
      throw new Error('用户姓名不能为空');
    }

    if (profile.phone !== undefined && !this.isValidPhone(profile.phone)) {
      throw new Error('电话号码格式无效');
    }

    const event = new UserProfileUpdatedEvent(this.id, profile);
    this.apply(event);
  }

  /**
   * 处理领域事件
   *
   * @param {IDomainEvent} event - 要处理的领域事件
   * @param {boolean} _isFromHistory - 是否来自历史事件重放
   */
  protected handleEvent(event: IDomainEvent, _isFromHistory: boolean): void {
    if (event instanceof UserCreatedEvent) {
      this.whenUserCreated(event);
    } else if (event instanceof UserProfileUpdatedEvent) {
      this.whenUserProfileUpdated(event);
    }
  }

  /**
   * 处理用户创建事件
   *
   * @param {UserCreatedEvent} event - 用户创建事件
   * @private
   */
  private whenUserCreated(event: UserCreatedEvent): void {
    this._email = event.email;
    this._hashedPassword = event.hashedPassword;
    this._name = event.name;
    this._status = 'active';
    this._createdAt = event.occurredOn;
    this._updatedAt = event.occurredOn;
  }

  /**
   * 处理用户资料更新事件
   *
   * @param {UserProfileUpdatedEvent} event - 用户资料更新事件
   * @private
   */
  private whenUserProfileUpdated(event: UserProfileUpdatedEvent): void {
    if (event.profile.name !== undefined) {
      this._name = event.profile.name;
    }
    if (event.profile.phone !== undefined) {
      this._phone = event.profile.phone;
    }
    if (event.profile.avatar !== undefined) {
      this._avatar = event.profile.avatar;
    }
    this._updatedAt = event.occurredOn;
  }

  /**
   * 将聚合状态转换为快照数据
   *
   * @returns {Record<string, unknown>} 快照数据
   */
  protected toSnapshot(): Record<string, unknown> {
    return {
      id: this.id,
      email: this._email,
      name: this._name,
      phone: this._phone,
      avatar: this._avatar,
      status: this._status,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  /**
   * 从快照数据恢复聚合状态
   *
   * @param {Record<string, unknown>} data - 快照数据
   */
  protected fromSnapshot(data: Record<string, unknown>): void {
    this._email = data.email as string;
    this._name = data.name as string;
    this._phone = data.phone as string;
    this._avatar = data.avatar as string;
    this._status = data.status as 'active' | 'inactive' | 'locked';
    this._createdAt = new Date(data.createdAt as string | number | Date);
    this._updatedAt = new Date(data.updatedAt as string | number | Date);
  }

  // 私有辅助方法

  /**
   * 验证邮箱格式
   *
   * @param {string} email - 邮箱地址
   * @returns {boolean} 是否有效
   * @private
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 验证密码强度
   *
   * @param {string} password - 密码
   * @returns {boolean} 是否有效
   * @private
   */
  private static isValidPassword(password: string): boolean {
    // 至少8位，包含大小写字母、数字和特殊字符
    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }

  /**
   * 验证电话号码格式
   *
   * @param {string} phone - 电话号码
   * @returns {boolean} 是否有效
   * @private
   */
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone);
  }

  /**
   * 加密密码
   *
   * @param {string} password - 明文密码
   * @returns {string} 加密后的密码
   * @private
   */
  private hashPassword(password: string): string {
    // TODO: 实现实际的密码加密逻辑
    // 这里应该使用bcrypt或其他安全的加密算法
    return `hashed_${password}`;
  }

  // 公共访问器

  /**
   * 获取用户邮箱
   */
  public get email(): string {
    return this._email;
  }

  /**
   * 获取用户姓名
   */
  public get name(): string {
    return this._name;
  }

  /**
   * 获取用户电话
   */
  public get phone(): string {
    return this._phone;
  }

  /**
   * 获取用户头像
   */
  public get avatar(): string {
    return this._avatar;
  }

  /**
   * 获取用户状态
   */
  public get status(): string {
    return this._status;
  }

  /**
   * 获取创建时间
   */
  public get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * 获取更新时间
   */
  public get updatedAt(): Date {
    return this._updatedAt;
  }
}
