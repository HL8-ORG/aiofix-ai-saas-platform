# Entities层设计

## 文档信息

- **文档名称**: Entities层设计
- **文档版本**: V1.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

Entities层是Clean Architecture的核心层，包含企业范围的业务规则。本层不依赖任何外部框架或技术实现，只包含纯业务逻辑。本文档详细描述了聚合根、领域实体、值对象、领域事件、领域服务和仓储接口的设计原则和实现方式。

## 设计原则

### 1. 业务逻辑隔离

- **纯业务逻辑**: 不包含任何技术实现细节
- **框架无关**: 不依赖任何外部框架或库
- **可独立测试**: 可以独立进行单元测试
- **稳定不变**: 业务规则相对稳定，变化较少

### 2. 领域驱动设计

- **聚合根**: 管理业务不变性约束
- **实体**: 具有唯一标识的业务对象
- **值对象**: 不可变的业务概念
- **领域事件**: 业务状态变更通知
- **领域服务**: 跨聚合的业务逻辑

### 3. 事件溯源支持

- **状态变更记录**: 所有状态变更都通过事件记录
- **事件重放**: 支持从事件历史重建状态
- **审计追踪**: 完整的状态变更历史
- **时间旅行**: 可以查看任意时间点的状态

## 聚合根设计

### 聚合根职责

聚合根是DDD中的核心概念，负责：

1. **维护业务不变性约束**: 确保业务规则得到执行
2. **管理聚合内实体**: 控制聚合内所有对象的一致性
3. **发布领域事件**: 在状态变更时发布相应事件
4. **提供业务方法**: 封装业务操作逻辑

### 聚合根实现模式

#### 1. 事件溯源聚合根

```typescript
/**
 * @class UserAggregate
 * @description 用户聚合根，管理用户相关的业务规则和状态变更
 *
 * 聚合根职责：
 * 1. 维护用户业务不变性约束
 * 2. 管理用户实体的生命周期
 * 3. 发布用户相关的领域事件
 * 4. 提供用户业务操作方法
 *
 * 事件溯源支持：
 * 1. 继承EventSourcedAggregateRoot基类
 * 2. 支持事件重放和状态重建
 * 3. 提供快照机制优化性能
 * 4. 实现乐观并发控制
 */
export class UserAggregate extends EventSourcedAggregateRoot {
  private constructor(private user: UserEntity) {
    super();
  }

  /**
   * 创建用户聚合根
   * @param id 用户ID
   * @param email 用户邮箱
   * @param password 用户密码
   * @param profile 用户资料
   * @param preferences 用户偏好
   * @returns 用户聚合根实例
   */
  static create(
    id: UserId,
    email: Email,
    password: Password,
    profile: UserProfile,
    preferences: UserPreferences,
  ): UserAggregate {
    // 1. 创建用户实体
    const user = UserEntity.create(id, email, password, profile, preferences);

    // 2. 创建聚合根
    const aggregate = new UserAggregate(user);

    // 3. 发布领域事件
    aggregate.addDomainEvent(
      new UserCreatedEvent(
        id.value,
        email.value,
        profile.value.firstName,
        profile.value.lastName,
      ),
    );

    return aggregate;
  }

  /**
   * 更新用户资料
   * @param newProfile 新的用户资料
   */
  updateProfile(newProfile: UserProfile): void {
    // 1. 验证业务规则
    this.validateProfileUpdate(newProfile);

    // 2. 更新用户实体
    this.user.updateProfile(newProfile);

    // 3. 发布领域事件
    this.addDomainEvent(
      new UserProfileUpdatedEvent(
        this.user.id.value,
        this.user.profile.value,
        newProfile.value,
      ),
    );
  }

  /**
   * 激活用户
   */
  activate(): void {
    // 1. 更新用户状态
    this.user.activate();

    // 2. 发布领域事件
    this.addDomainEvent(
      new UserStatusChangedEvent(
        this.user.id.value,
        UserStatus.PENDING,
        UserStatus.ACTIVE,
        'system',
      ),
    );
  }

  /**
   * 获取聚合ID
   */
  getAggregateId(): string {
    return this.user.id.value;
  }

  /**
   * 获取当前版本
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * 验证资料更新业务规则
   */
  private validateProfileUpdate(newProfile: UserProfile): void {
    if (!newProfile.value.firstName || !newProfile.value.lastName) {
      throw new Error('First name and last name are required');
    }
  }
}
```

#### 2. 租户聚合根

```typescript
/**
 * @class TenantAggregate
 * @description 租户聚合根，管理租户相关的业务规则和状态变更
 *
 * 聚合根职责：
 * 1. 维护租户业务不变性约束
 * 2. 管理租户配置和配额
 * 3. 发布租户相关的领域事件
 * 4. 提供租户业务操作方法
 */
export class TenantAggregate extends EventSourcedAggregateRoot {
  private constructor(private tenant: TenantEntity) {
    super();
  }

  /**
   * 创建租户聚合根
   */
  static create(
    id: TenantId,
    name: string,
    type: TenantType,
    quota: TenantQuota,
    configuration: TenantConfiguration,
    createdBy: string,
  ): TenantAggregate {
    // 1. 创建租户实体
    const tenant = TenantEntity.create(id, name, type, quota, configuration);

    // 2. 创建聚合根
    const aggregate = new TenantAggregate(tenant);

    // 3. 发布领域事件
    aggregate.addDomainEvent(
      new TenantCreatedEvent(id.value, name, type, createdBy),
    );

    return aggregate;
  }

  /**
   * 更新租户配置
   */
  updateConfiguration(newConfiguration: TenantConfiguration): void {
    // 1. 验证配置变更
    this.validateConfigurationUpdate(newConfiguration);

    // 2. 更新租户配置
    this.tenant.updateConfiguration(newConfiguration);

    // 3. 发布领域事件
    this.addDomainEvent(
      new TenantUpdatedEvent(
        this.tenant.id.value,
        'configuration',
        this.tenant.configuration.value,
        newConfiguration.value,
      ),
    );
  }

  /**
   * 验证配置更新业务规则
   */
  private validateConfigurationUpdate(
    configuration: TenantConfiguration,
  ): void {
    // 验证配置的业务规则
    if (!configuration.value.maxUsers || configuration.value.maxUsers <= 0) {
      throw new Error('Max users must be greater than 0');
    }
  }
}
```

## 领域实体设计

### 实体职责

领域实体负责：

1. **封装业务状态**: 管理实体的内部状态
2. **执行业务规则**: 在状态变更时执行业务规则
3. **提供业务方法**: 封装业务操作逻辑
4. **维护数据完整性**: 确保数据的一致性和完整性

### 实体实现模式

#### 1. 用户实体

```typescript
/**
 * @class UserEntity
 * @description 用户实体，包含用户的基本信息和状态
 *
 * 实体职责：
 * 1. 封装用户的基本信息和状态
 * 2. 执行用户相关的业务规则
 * 3. 提供用户状态变更方法
 * 4. 维护用户数据的完整性
 */
export class UserEntity extends BaseEntity {
  constructor(
    public readonly id: UserId,
    public readonly email: Email,
    private password: Password,
    private profile: UserProfile,
    private preferences: UserPreferences,
    private status: UserStatus = UserStatus.PENDING,
    private tenantId?: TenantId,
    private organizationId?: OrganizationId,
    private departmentId?: DepartmentId,
  ) {
    super();
  }

  /**
   * 创建用户实体
   */
  static create(
    id: UserId,
    email: Email,
    password: Password,
    profile: UserProfile,
    preferences: UserPreferences,
  ): UserEntity {
    return new UserEntity(id, email, password, profile, preferences);
  }

  /**
   * 激活用户
   */
  activate(): void {
    if (this.status === UserStatus.ACTIVE) {
      throw new Error('User is already active');
    }
    if (this.status === UserStatus.DELETED) {
      throw new Error('Cannot activate deleted user');
    }
    this.status = UserStatus.ACTIVE;
  }

  /**
   * 禁用用户
   */
  deactivate(): void {
    if (this.status === UserStatus.DELETED) {
      throw new Error('Cannot deactivate deleted user');
    }
    this.status = UserStatus.DISABLED;
  }

  /**
   * 删除用户
   */
  delete(): void {
    this.status = UserStatus.DELETED;
  }

  /**
   * 更新用户资料
   */
  updateProfile(newProfile: UserProfile): void {
    this.validateProfileUpdate(newProfile);
    this.profile = newProfile;
  }

  /**
   * 更新用户密码
   */
  updatePassword(newPassword: Password): void {
    this.password = newPassword;
  }

  /**
   * 更新用户偏好
   */
  updatePreferences(newPreferences: UserPreferences): void {
    this.preferences = newPreferences;
  }

  /**
   * 分配用户到租户
   */
  assignToTenant(tenantId: TenantId): void {
    if (this.tenantId && this.tenantId.equals(tenantId)) {
      throw new Error('User is already assigned to this tenant');
    }
    this.tenantId = tenantId;
  }

  /**
   * 分配用户到组织
   */
  assignToOrganization(organizationId: OrganizationId): void {
    this.organizationId = organizationId;
  }

  /**
   * 分配用户到部门
   */
  assignToDepartment(departmentId: DepartmentId): void {
    this.departmentId = departmentId;
  }

  /**
   * 验证资料更新
   */
  private validateProfileUpdate(newProfile: UserProfile): void {
    if (!newProfile.value.firstName || !newProfile.value.lastName) {
      throw new Error('First name and last name are required');
    }
  }

  /**
   * 获取用户状态
   */
  getStatus(): UserStatus {
    return this.status;
  }

  /**
   * 获取用户资料
   */
  getProfile(): UserProfile {
    return this.profile;
  }

  /**
   * 获取用户偏好
   */
  getPreferences(): UserPreferences {
    return this.preferences;
  }
}
```

#### 2. 租户实体

```typescript
/**
 * @class TenantEntity
 * @description 租户实体，包含租户的基本信息和配置
 *
 * 实体职责：
 * 1. 封装租户的基本信息和配置
 * 2. 执行租户相关的业务规则
 * 3. 提供租户配置变更方法
 * 4. 维护租户数据的完整性
 */
export class TenantEntity extends BaseEntity {
  constructor(
    public readonly id: TenantId,
    private name: string,
    private type: TenantType,
    private quota: TenantQuota,
    private configuration: TenantConfiguration,
    private status: TenantStatus = TenantStatus.ACTIVE,
    private settings: TenantSettings = new TenantSettings(),
  ) {
    super();
  }

  /**
   * 创建租户实体
   */
  static create(
    id: TenantId,
    name: string,
    type: TenantType,
    quota: TenantQuota,
    configuration: TenantConfiguration,
  ): TenantEntity {
    return new TenantEntity(id, name, type, quota, configuration);
  }

  /**
   * 更新租户名称
   */
  updateName(newName: string): void {
    this.validateName(newName);
    this.name = newName;
  }

  /**
   * 更新租户配置
   */
  updateConfiguration(newConfiguration: TenantConfiguration): void {
    this.validateConfiguration(newConfiguration);
    this.configuration = newConfiguration;
  }

  /**
   * 更新租户配额
   */
  updateQuota(newQuota: TenantQuota): void {
    this.validateQuota(newQuota);
    this.quota = newQuota;
  }

  /**
   * 更新租户设置
   */
  updateSettings(newSettings: TenantSettings): void {
    this.settings = newSettings;
  }

  /**
   * 激活租户
   */
  activate(): void {
    this.status = TenantStatus.ACTIVE;
  }

  /**
   * 暂停租户
   */
  suspend(): void {
    this.status = TenantStatus.SUSPENDED;
  }

  /**
   * 验证租户名称
   */
  private validateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Tenant name is required');
    }
    if (name.length > 100) {
      throw new Error('Tenant name cannot exceed 100 characters');
    }
  }

  /**
   * 验证租户配置
   */
  private validateConfiguration(configuration: TenantConfiguration): void {
    if (!configuration.value.maxUsers || configuration.value.maxUsers <= 0) {
      throw new Error('Max users must be greater than 0');
    }
  }

  /**
   * 验证租户配额
   */
  private validateQuota(quota: TenantQuota): void {
    if (quota.value.storage < 0) {
      throw new Error('Storage quota cannot be negative');
    }
  }
}
```

## 值对象设计

### 值对象职责

值对象负责：

1. **封装业务概念**: 将业务概念封装为不可变对象
2. **验证业务规则**: 在创建时验证业务规则
3. **提供相等性判断**: 基于值进行相等性比较
4. **隐藏实现细节**: 隐藏业务概念的实现细节

### 值对象实现模式

#### 1. 邮箱值对象

```typescript
/**
 * @class Email
 * @description 邮箱值对象，封装邮箱地址的验证和格式化逻辑
 *
 * 值对象职责：
 * 1. 封装邮箱地址的业务概念
 * 2. 验证邮箱格式的有效性
 * 3. 提供邮箱地址的标准化
 * 4. 支持邮箱地址的相等性比较
 */
export class Email {
  constructor(public readonly value: string) {
    this.validateEmail(value);
    this.value = this.normalizeEmail(value);
  }

  /**
   * 验证邮箱格式
   */
  private validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Email is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    if (email.length > 254) {
      throw new Error('Email cannot exceed 254 characters');
    }
  }

  /**
   * 标准化邮箱地址
   */
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  /**
   * 比较邮箱地址是否相等
   */
  equals(other: Email): boolean {
    return this.value === other.value;
  }

  /**
   * 获取邮箱域名
   */
  getDomain(): string {
    return this.value.split('@')[1];
  }

  /**
   * 获取邮箱用户名
   */
  getUsername(): string {
    return this.value.split('@')[0];
  }
}
```

#### 2. 用户资料值对象

```typescript
/**
 * @class UserProfile
 * @description 用户资料值对象，封装用户的基本资料信息
 *
 * 值对象职责：
 * 1. 封装用户资料的业务概念
 * 2. 验证用户资料的有效性
 * 3. 提供用户资料的格式化
 * 4. 支持用户资料的相等性比较
 */
export class UserProfile {
  constructor(public readonly value: UserProfileData) {
    this.validateProfile(value);
  }

  /**
   * 创建用户资料
   */
  static create(
    firstName: string,
    lastName: string,
    phoneNumber?: string,
  ): UserProfile {
    const profileData: UserProfileData = {
      firstName,
      lastName,
      phoneNumber,
      avatar: null,
      bio: null,
    };
    return new UserProfile(profileData);
  }

  /**
   * 验证用户资料
   */
  private validateProfile(profile: UserProfileData): void {
    if (!profile.firstName || profile.firstName.trim().length === 0) {
      throw new Error('First name is required');
    }

    if (!profile.lastName || profile.lastName.trim().length === 0) {
      throw new Error('Last name is required');
    }

    if (profile.firstName.length > 50) {
      throw new Error('First name cannot exceed 50 characters');
    }

    if (profile.lastName.length > 50) {
      throw new Error('Last name cannot exceed 50 characters');
    }

    if (profile.phoneNumber && !this.isValidPhoneNumber(profile.phoneNumber)) {
      throw new Error('Invalid phone number format');
    }
  }

  /**
   * 验证手机号码格式
   */
  private isValidPhoneNumber(phoneNumber: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  }

  /**
   * 比较用户资料是否相等
   */
  equals(other: UserProfile): boolean {
    return (
      this.value.firstName === other.value.firstName &&
      this.value.lastName === other.value.lastName &&
      this.value.phoneNumber === other.value.phoneNumber
    );
  }

  /**
   * 获取全名
   */
  getFullName(): string {
    return `${this.value.firstName} ${this.value.lastName}`;
  }

  /**
   * 获取显示名称
   */
  getDisplayName(): string {
    return this.getFullName();
  }
}
```

## 领域事件设计

### 领域事件职责

领域事件负责：

1. **通知状态变更**: 通知其他聚合状态变更
2. **实现松耦合**: 通过事件实现聚合间的松耦合
3. **支持事件溯源**: 记录状态变更历史
4. **触发副作用**: 触发相关的业务副作用

### 领域事件实现模式

#### 1. 用户创建事件

```typescript
/**
 * @class UserCreatedEvent
 * @description 用户创建领域事件
 *
 * 事件职责：
 * 1. 通知用户创建状态变更
 * 2. 包含用户创建的关键信息
 * 3. 支持事件溯源和重放
 * 4. 触发用户创建后的副作用
 */
export class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly firstName: string,
    public readonly lastName: string,
    public readonly tenantId?: string,
    public readonly organizationId?: string,
    public readonly departmentId?: string,
  ) {
    super();
  }

  /**
   * 获取事件类型
   */
  getEventType(): string {
    return 'UserCreated';
  }

  /**
   * 获取聚合ID
   */
  getAggregateId(): string {
    return this.userId;
  }

  /**
   * 转换为JSON格式
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      userId: this.userId,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      tenantId: this.tenantId,
      organizationId: this.organizationId,
      departmentId: this.departmentId,
    };
  }
}
```

#### 2. 用户资料更新事件

```typescript
/**
 * @class UserProfileUpdatedEvent
 * @description 用户资料更新领域事件
 *
 * 事件职责：
 * 1. 通知用户资料更新状态变更
 * 2. 包含资料更新的详细信息
 * 3. 支持事件溯源和重放
 * 4. 触发资料更新后的副作用
 */
export class UserProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly oldProfile: UserProfileData,
    public readonly newProfile: UserProfileData,
    public readonly updatedBy: string,
  ) {
    super();
  }

  /**
   * 获取事件类型
   */
  getEventType(): string {
    return 'UserProfileUpdated';
  }

  /**
   * 获取聚合ID
   */
  getAggregateId(): string {
    return this.userId;
  }

  /**
   * 转换为JSON格式
   */
  toJSON(): Record<string, unknown> {
    return {
      ...this.getBaseEventData(),
      userId: this.userId,
      oldProfile: this.oldProfile,
      newProfile: this.newProfile,
      updatedBy: this.updatedBy,
    };
  }
}
```

## 领域服务设计

### 领域服务职责

领域服务负责：

1. **跨聚合业务逻辑**: 处理涉及多个聚合的业务逻辑
2. **无状态操作**: 不维护任何内部状态
3. **业务规则封装**: 封装复杂的业务规则
4. **可重用逻辑**: 提供可重用的业务逻辑

### 领域服务实现模式

#### 1. 用户领域服务

```typescript
/**
 * @class UserDomainService
 * @description 用户领域服务，处理跨聚合的用户相关业务逻辑
 *
 * 领域服务职责：
 * 1. 处理跨聚合的用户业务逻辑
 * 2. 提供无状态的用户业务操作
 * 3. 封装复杂的用户业务规则
 * 4. 支持用户业务逻辑的重用
 */
export class UserDomainService {
  /**
   * 检查邮箱是否在租户内唯一
   */
  async isEmailUniqueInTenant(
    email: Email,
    tenantId: TenantId,
    userRepository: IUserRepository,
  ): Promise<boolean> {
    const existingUser = await userRepository.findByEmailAndTenant(
      email,
      tenantId,
    );
    return existingUser === null;
  }

  /**
   * 检查用户是否可以访问指定资源
   */
  canUserAccessResource(
    userId: UserId,
    resourceId: string,
    userPermissions: Permission[],
  ): boolean {
    // 检查用户权限
    return userPermissions.some(
      permission => permission.resourceId === resourceId,
    );
  }

  /**
   * 计算用户权限列表
   */
  calculateUserPermissions(
    userRoles: Role[],
    rolePermissions: Map<string, Permission[]>,
  ): Permission[] {
    const permissions = new Set<Permission>();

    for (const role of userRoles) {
      const rolePerms = rolePermissions.get(role.id.value) || [];
      rolePerms.forEach(perm => permissions.add(perm));
    }

    return Array.from(permissions);
  }

  /**
   * 验证用户状态变更
   */
  validateUserStatusTransition(
    currentStatus: UserStatus,
    newStatus: UserStatus,
  ): boolean {
    const validTransitions: Map<UserStatus, UserStatus[]> = new Map([
      [UserStatus.PENDING, [UserStatus.ACTIVE, UserStatus.DISABLED]],
      [UserStatus.ACTIVE, [UserStatus.DISABLED, UserStatus.DELETED]],
      [UserStatus.DISABLED, [UserStatus.ACTIVE, UserStatus.DELETED]],
      [UserStatus.DELETED, []], // 删除状态不能转换到其他状态
    ]);

    const allowedTransitions = validTransitions.get(currentStatus) || [];
    return allowedTransitions.includes(newStatus);
  }
}
```

## 仓储接口设计

### 仓储接口职责

仓储接口负责：

1. **定义数据访问抽象**: 为聚合提供数据访问的抽象
2. **隐藏实现细节**: 隐藏具体的数据存储实现
3. **支持事件溯源**: 支持聚合的事件溯源操作
4. **提供查询接口**: 提供聚合查询的接口

### 仓储接口实现模式

#### 1. 用户仓储接口

```typescript
/**
 * @interface IUserRepository
 * @description 用户仓储接口，定义用户数据访问的抽象
 *
 * 仓储接口职责：
 * 1. 定义用户聚合的数据访问抽象
 * 2. 隐藏具体的数据存储实现
 * 3. 支持用户聚合的事件溯源
 * 4. 提供用户聚合的查询接口
 */
export interface IUserRepository {
  /**
   * 保存用户聚合
   */
  save(user: UserAggregate): Promise<void>;

  /**
   * 根据ID查找用户聚合
   */
  findById(id: UserId): Promise<UserAggregate | null>;

  /**
   * 根据邮箱查找用户聚合
   */
  findByEmail(email: Email): Promise<UserAggregate | null>;

  /**
   * 根据邮箱和租户查找用户聚合
   */
  findByEmailAndTenant(
    email: Email,
    tenantId: TenantId,
  ): Promise<UserAggregate | null>;

  /**
   * 根据租户查找用户聚合列表
   */
  findByTenant(tenantId: TenantId): Promise<UserAggregate[]>;

  /**
   * 根据组织查找用户聚合列表
   */
  findByOrganization(organizationId: OrganizationId): Promise<UserAggregate[]>;

  /**
   * 根据部门查找用户聚合列表
   */
  findByDepartment(departmentId: DepartmentId): Promise<UserAggregate[]>;

  /**
   * 删除用户聚合
   */
  delete(id: UserId): Promise<void>;

  /**
   * 检查用户是否存在
   */
  exists(id: UserId): Promise<boolean>;

  /**
   * 获取用户数量
   */
  count(filters?: UserFilters): Promise<number>;
}
```

## 测试策略

### 单元测试

```typescript
// 聚合根测试
describe('UserAggregate', () => {
  it('should create user with valid data', () => {
    const user = UserAggregate.create(
      new UserId('user-123'),
      new Email('user@example.com'),
      new Password('hashedPassword'),
      new UserProfile('John', 'Doe'),
      new UserPreferences('en', 'UTC'),
    );

    expect(user).toBeDefined();
    expect(user.getAggregateId()).toBe('user-123');
    expect(user.uncommittedEvents).toHaveLength(1);
    expect(user.uncommittedEvents[0]).toBeInstanceOf(UserCreatedEvent);
  });

  it('should update profile successfully', () => {
    const user = UserAggregate.create(/* ... */);
    const newProfile = new UserProfile('Jane', 'Smith');

    user.updateProfile(newProfile);

    expect(user.uncommittedEvents).toHaveLength(2);
    expect(user.uncommittedEvents[1]).toBeInstanceOf(UserProfileUpdatedEvent);
  });
});

// 实体测试
describe('UserEntity', () => {
  it('should activate user successfully', () => {
    const user = UserEntity.create(/* ... */);

    user.activate();

    expect(user.getStatus()).toBe(UserStatus.ACTIVE);
  });

  it('should throw error when activating already active user', () => {
    const user = UserEntity.create(/* ... */);
    user.activate();

    expect(() => user.activate()).toThrow('User is already active');
  });
});

// 值对象测试
describe('Email', () => {
  it('should create email with valid format', () => {
    const email = new Email('user@example.com');

    expect(email.value).toBe('user@example.com');
    expect(email.getDomain()).toBe('example.com');
    expect(email.getUsername()).toBe('user');
  });

  it('should throw error with invalid email format', () => {
    expect(() => new Email('invalid-email')).toThrow('Invalid email format');
  });
});
```

## 总结

Entities层是Clean Architecture的核心，通过聚合根、领域实体、值对象、领域事件、领域服务和仓储接口的设计，实现了业务逻辑的清晰分离和高度内聚。这种设计确保了业务规则的正确执行，支持事件溯源，并提供了良好的可测试性和可维护性。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
