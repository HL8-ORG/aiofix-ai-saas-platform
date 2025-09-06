# 领域模型设计

## 概述

领域模型设计是DDD的核心，通过聚合根、实体、值对象、领域事件等概念，将业务逻辑与技术实现分离，确保系统的可维护性和可扩展性。

## 领域模型设计示例（用户管理上下文）

### 用户聚合根

```typescript
// modules/user/domain/user.model.ts
export class User extends EventSourcedAggregateRoot {
  private _id: string;
  private _email: string;
  private _password: string;
  private _status: UserStatus;
  private _profile: UserProfile;

  constructor() {
    super();
  }

  // 创建用户的领域方法
  public static create(userId: string, email: string, password: string): User {
    const user = new User();
    const event = new UserCreatedEvent(
      uuid.v4(),
      userId,
      new Date(),
      email,
      await hashPassword(password)
    );
    
    user.apply(event);
    return user;
  }

  // 处理事件的方法
  protected handleEvent(event: IDomainEvent, isFromHistory: boolean): void {
    if (event instanceof UserCreatedEvent) {
      this.whenUserCreated(event);
    } else if (event instanceof UserProfileUpdatedEvent) {
      this.whenUserProfileUpdated(event);
    }
    // 处理其他事件...
  }

  private whenUserCreated(event: UserCreatedEvent): void {
    this._id = event.aggregateId;
    this._email = event.email;
    this._password = event.hashedPassword;
    this._status = UserStatus.ACTIVE;
  }

  private whenUserProfileUpdated(event: UserProfileUpdatedEvent): void {
    this._profile = event.profile;
  }

  // 更新用户资料的领域方法
  public updateProfile(profile: UserProfile): void {
    this.validateUserStatus();
    
    const event = new UserProfileUpdatedEvent(
      uuid.v4(),
      this._id,
      new Date(),
      profile
    );
    
    this.apply(event);
  }

  private validateUserStatus(): void {
    if (this._status !== UserStatus.ACTIVE) {
      throw new UserNotActiveError(this._id);
    }
  }

  // 其他领域方法...
}
```

### 领域事件

```typescript
// modules/user/domain/events/user-created.event.ts
export class UserCreatedEvent implements IDomainEvent {
  public readonly eventType: string = 'UserCreatedEvent';
  public readonly eventVersion: number = 1;

  constructor(
    public readonly eventId: string,
    public readonly aggregateId: string,
    public readonly occurredOn: Date,
    public readonly email: string,
    public readonly hashedPassword: string
  ) {}

  toJSON(): any {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      email: this.email,
      hashedPassword: this.hashedPassword
    };
  }
}

// modules/user/domain/events/user-profile-updated.event.ts
export class UserProfileUpdatedEvent implements IDomainEvent {
  public readonly eventType: string = 'UserProfileUpdatedEvent';
  public readonly eventVersion: number = 1;

  constructor(
    public readonly eventId: string,
    public readonly aggregateId: string,
    public readonly occurredOn: Date,
    public readonly profile: UserProfile
  ) {}

  toJSON(): any {
    return {
      eventId: this.eventId,
      aggregateId: this.aggregateId,
      occurredOn: this.occurredOn.toISOString(),
      profile: this.profile
    };
  }
}
```

### 值对象

```typescript
// modules/user/domain/value-objects/user-profile.vo.ts
export class UserProfile {
  constructor(
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly phoneNumber: string,
    public readonly avatar: string,
    public readonly preferences: UserPreferences
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.firstName || this.firstName.trim().length === 0) {
      throw new InvalidUserProfileError('First name is required');
    }
    
    if (!this.lastName || this.lastName.trim().length === 0) {
      throw new InvalidUserProfileError('Last name is required');
    }
    
    if (this.phoneNumber && !this.isValidPhoneNumber(this.phoneNumber)) {
      throw new InvalidUserProfileError('Invalid phone number format');
    }
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phoneNumber);
  }

  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public updatePreferences(preferences: UserPreferences): UserProfile {
    return new UserProfile(
      this.firstName,
      this.lastName,
      this.phoneNumber,
      this.avatar,
      preferences
    );
  }
}

// modules/user/domain/value-objects/user-preferences.vo.ts
export class UserPreferences {
  constructor(
    public readonly language: string,
    public readonly timezone: string,
    public readonly theme: string,
    public readonly notifications: NotificationSettings
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.language || this.language.trim().length === 0) {
      throw new InvalidUserPreferencesError('Language is required');
    }
    
    if (!this.timezone || this.timezone.trim().length === 0) {
      throw new InvalidUserPreferencesError('Timezone is required');
    }
  }
}
```

### 实体

```typescript
// modules/user/domain/entities/user-session.entity.ts
export class UserSession {
  constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly deviceInfo: DeviceInfo,
    public readonly ipAddress: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new InvalidUserSessionError('Session ID is required');
    }
    
    if (!this.userId || this.userId.trim().length === 0) {
      throw new InvalidUserSessionError('User ID is required');
    }
    
    if (!this.token || this.token.trim().length === 0) {
      throw new InvalidUserSessionError('Token is required');
    }
    
    if (this.expiresAt <= new Date()) {
      throw new InvalidUserSessionError('Session has already expired');
    }
  }

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public extend(duration: number): UserSession {
    const newExpiresAt = new Date(this.expiresAt.getTime() + duration);
    return new UserSession(
      this.id,
      this.userId,
      this.token,
      newExpiresAt,
      this.deviceInfo,
      this.ipAddress
    );
  }
}
```

### 领域服务

```typescript
// modules/user/domain/services/user-domain.service.ts
@Injectable()
export class UserDomainService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService
  ) {}

  async isEmailUnique(email: string): Promise<boolean> {
    const existingUser = await this.userRepository.findByEmail(email);
    return !existingUser;
  }

  async validatePasswordStrength(password: string): Promise<boolean> {
    return this.passwordService.validateStrength(password);
  }

  async generateSecurePassword(): Promise<string> {
    return this.passwordService.generateSecure();
  }

  async hashPassword(password: string): Promise<string> {
    return this.passwordService.hash(password);
  }

  async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return this.passwordService.verify(password, hashedPassword);
  }
}
```

### 仓储接口

```typescript
// modules/user/domain/repositories/user.repository.interface.ts
export interface IUserRepository {
  save(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByStatus(status: UserStatus): Promise<User[]>;
  delete(id: string): Promise<void>;
  exists(id: string): Promise<boolean>;
}

// modules/user/domain/repositories/user-session.repository.interface.ts
export interface IUserSessionRepository {
  save(session: UserSession): Promise<void>;
  findById(id: string): Promise<UserSession | null>;
  findByUserId(userId: string): Promise<UserSession[]>;
  findByToken(token: string): Promise<UserSession | null>;
  delete(id: string): Promise<void>;
  deleteExpired(): Promise<void>;
}
```

## 事件溯源实现

### 事件存储接口

```typescript
// packages/core/domain/interfaces/event-store.interface.ts
export interface IEventStore {
  saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number
  ): Promise<void>;
  
  getEvents(aggregateId: string, fromVersion?: number): Promise<IDomainEvent[]>;
  
  getEventsByType(eventType: string, fromDate?: Date): Promise<IDomainEvent[]>;
  
  getSnapshot(aggregateId: string): Promise<IAggregateSnapshot | null>;
  
  saveSnapshot(snapshot: IAggregateSnapshot): Promise<void>;
}
```

### 聚合根基类

```typescript
// packages/core/domain/aggregate-root.ts
export abstract class EventSourcedAggregateRoot {
  private _uncommittedEvents: IDomainEvent[] = [];
  private _version = 0;

  public get uncommittedEvents(): IDomainEvent[] {
    return [...this._uncommittedEvents];
  }

  public get version(): number {
    return this._version;
  }

  protected apply(event: IDomainEvent, isFromHistory = false): void {
    this.handleEvent(event, isFromHistory);
    if (!isFromHistory) {
      this._uncommittedEvents.push(event);
      this._version++;
    }
  }

  protected abstract handleEvent(event: IDomainEvent, isFromHistory: boolean): void;

  public markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  public createSnapshot(): IAggregateSnapshot {
    return {
      aggregateId: this.id,
      version: this._version,
      data: this.toSnapshot(),
      createdAt: new Date()
    };
  }

  public restoreFromSnapshot(snapshot: IAggregateSnapshot): void {
    this._version = snapshot.version;
    this.fromSnapshot(snapshot.data);
  }

  protected abstract toSnapshot(): any;
  protected abstract fromSnapshot(data: any): void;
}
```

### 领域事件基类

```typescript
// packages/core/domain/domain-event.ts
export abstract class DomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly occurredOn: Date;
  public readonly eventType: string;
  public readonly eventVersion: number;

  constructor(aggregateId: string, eventVersion: number = 1) {
    this.eventId = uuid.v4();
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
    this.eventType = this.constructor.name;
    this.eventVersion = eventVersion;
  }

  abstract toJSON(): any;
}
```

## CQRS实现

### 命令基类

```typescript
// packages/core/application/commands/command.ts
export abstract class Command {
  public readonly commandId: string;
  public readonly timestamp: Date;

  constructor() {
    this.commandId = uuid.v4();
    this.timestamp = new Date();
  }
}

// modules/user/application/commands/create-user.command.ts
export class CreateUserCommand extends Command {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly profile?: UserProfile
  ) {
    super();
  }
}

// modules/user/application/commands/update-user-profile.command.ts
export class UpdateUserProfileCommand extends Command {
  constructor(
    public readonly userId: string,
    public readonly profile: UserProfile
  ) {
    super();
  }
}
```

### 查询基类

```typescript
// packages/core/application/queries/query.ts
export abstract class Query {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor() {
    this.queryId = uuid.v4();
    this.timestamp = new Date();
  }
}

// modules/user/application/queries/get-user.query.ts
export class GetUserQuery extends Query {
  constructor(public readonly userId: string) {
    super();
  }
}

// modules/user/application/queries/get-users.query.ts
export class GetUsersQuery extends Query {
  constructor(
    public readonly filters: UserFilters,
    public readonly pagination: PaginationOptions
  ) {
    super();
  }
}
```

### 命令处理器

```typescript
// modules/user/application/commands/handlers/create-user.handler.ts
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly userDomainService: UserDomainService,
    private readonly eventStore: IEventStore
  ) {}

  async execute(command: CreateUserCommand): Promise<void> {
    // 1. 验证业务规则
    const isEmailUnique = await this.userDomainService.isEmailUnique(command.email);
    if (!isEmailUnique) {
      throw new EmailAlreadyExistsError(command.email);
    }

    const isPasswordStrong = await this.userDomainService.validatePasswordStrength(command.password);
    if (!isPasswordStrong) {
      throw new WeakPasswordError();
    }

    // 2. 创建聚合
    const userId = uuid.v4();
    const hashedPassword = await this.userDomainService.hashPassword(command.password);
    const user = User.create(userId, command.email, hashedPassword);

    // 3. 保存事件
    await this.eventStore.saveEvents(
      user.id,
      user.uncommittedEvents,
      user.version
    );

    // 4. 标记事件为已提交
    user.markEventsAsCommitted();
  }
}
```

### 查询处理器

```typescript
// modules/user/application/queries/handlers/get-user.handler.ts
@QueryHandler(GetUserQuery)
export class GetUserHandler {
  constructor(
    private readonly userReadRepository: IUserReadRepository
  ) {}

  async execute(query: GetUserQuery): Promise<UserDto> {
    const user = await this.userReadRepository.findById(query.userId);
    if (!user) {
      throw new UserNotFoundError(query.userId);
    }

    return this.mapToDto(user);
  }

  private mapToDto(user: UserReadModel): UserDto {
    return {
      id: user.id,
      email: user.email,
      profile: user.profile,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}
```

### 事件处理器

```typescript
// modules/user/application/events/handlers/user-created.handler.ts
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler {
  constructor(
    private readonly userReadRepository: IUserReadRepository,
    private readonly emailService: EmailService
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    // 1. 更新读模型
    await this.userReadRepository.save({
      id: event.aggregateId,
      email: event.email,
      status: UserStatus.ACTIVE,
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn,
      version: event.eventVersion
    });

    // 2. 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.email);
  }
}

// modules/user/application/events/handlers/user-profile-updated.handler.ts
@EventsHandler(UserProfileUpdatedEvent)
export class UserProfileUpdatedHandler {
  constructor(
    private readonly userReadRepository: IUserReadRepository
  ) {}

  async handle(event: UserProfileUpdatedEvent): Promise<void> {
    await this.userReadRepository.updateProfile(
      event.aggregateId,
      event.profile,
      event.occurredOn
    );
  }
}
```

## 聚合设计原则

### 聚合边界设计

```typescript
// 用户聚合 - 包含用户基本信息、资料、偏好设置
export class User extends EventSourcedAggregateRoot {
  private _id: string;
  private _email: string;
  private _password: string;
  private _status: UserStatus;
  private _profile: UserProfile;
  private _preferences: UserPreferences;
  private _sessions: UserSession[];

  // 聚合内部的一致性边界
  public updateProfile(profile: UserProfile): void {
    this.validateUserStatus();
    this.validateProfile(profile);
    
    const event = new UserProfileUpdatedEvent(
      this._id,
      profile
    );
    
    this.apply(event);
  }

  public addSession(session: UserSession): void {
    this.validateUserStatus();
    this.validateSessionLimit();
    
    const event = new UserSessionAddedEvent(
      this._id,
      session
    );
    
    this.apply(event);
  }

  private validateSessionLimit(): void {
    if (this._sessions.length >= 5) {
      throw new TooManySessionsError(this._id);
    }
  }
}
```

### 聚合间通信

```typescript
// 通过领域事件进行聚合间通信
export class UserCreatedEvent implements IDomainEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly email: string,
    public readonly tenantId?: string
  ) {
    super(aggregateId);
  }
}

// 租户聚合监听用户创建事件
@EventsHandler(UserCreatedEvent)
export class TenantUserCreatedHandler {
  constructor(
    private readonly tenantRepository: ITenantRepository
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    if (event.tenantId) {
      const tenant = await this.tenantRepository.findById(event.tenantId);
      if (tenant) {
        tenant.addUser(event.aggregateId);
        await this.tenantRepository.save(tenant);
      }
    }
  }
}
```

## 领域异常

```typescript
// modules/user/domain/exceptions/user.exceptions.ts
export class UserNotFoundError extends DomainException {
  constructor(userId: string) {
    super(`User with id ${userId} not found`, 'USER_NOT_FOUND', 404);
  }
}

export class EmailAlreadyExistsError extends DomainException {
  constructor(email: string) {
    super(`Email ${email} already exists`, 'EMAIL_ALREADY_EXISTS', 409);
  }
}

export class UserNotActiveError extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} is not active`, 'USER_NOT_ACTIVE', 400);
  }
}

export class WeakPasswordError extends DomainException {
  constructor() {
    super('Password does not meet security requirements', 'WEAK_PASSWORD', 400);
  }
}

export class InvalidUserProfileError extends DomainException {
  constructor(message: string) {
    super(`Invalid user profile: ${message}`, 'INVALID_USER_PROFILE', 400);
  }
}
```

## 相关文档

- [核心模块与组件设计](./03-core-modules.md)
- [应用层实现](./05-application-layer.md)
- [基础设施实现](./06-infrastructure.md)
- [事件溯源设计](./07-event-sourcing.md)

---

**上一篇**：[核心模块与组件设计](./03-core-modules.md)  
**下一篇**：[应用层实现](./05-application-layer.md)
