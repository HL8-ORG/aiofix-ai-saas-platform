# 多租户数据隔离设计

## 概述

多租户数据隔离是SAAS平台的核心特性，通过多层数据隔离架构，实现从平台级到用户级的细粒度数据访问控制，确保数据安全性和业务隔离性。

## 多层数据隔离架构

### 数据隔离层次结构

```
平台级 (Platform Level)
├── 租户级 (Tenant Level)
│   ├── 组织级 (Organization Level)
│   │   ├── 部门级 (Department Level)
│   │   │   └── 用户级 (User Level)
│   │   └── 用户级 (User Level)
│   └── 用户级 (User Level)
└── 系统级 (System Level)
    └── 用户级 (User Level)
```

### 层次结构说明

这个五层数据隔离架构的设计逻辑如下：

1. **平台级 (Platform Level)**
   - 最高层级，管理整个SAAS平台
   - 包含平台配置、全局设置、跨租户数据

2. **租户级 (Tenant Level)**
   - 租户隔离层级，每个租户独立管理
   - 包含租户配置、租户级用户、租户数据

3. **组织级 (Organization Level)**
   - 租户内的组织管理
   - 包含组织配置、组织级用户、组织数据

4. **部门级 (Department Level)**
   - 组织内的部门管理
   - 包含部门配置、部门级用户、部门数据

5. **用户级 (User Level)**
   - 最细粒度的数据隔离
   - 包含用户个人数据、用户配置、用户行为

### 为什么系统级也需要用户级？

系统级用户级的存在是必要的，原因包括：

1. **平台管理员**
   - 平台级管理员需要独立的用户身份
   - 管理跨租户的系统配置和监控
   - 处理平台级的技术支持和维护

2. **系统级服务账户**
   - 自动化系统服务需要用户身份
   - 系统级数据同步和备份
   - 跨租户的数据分析和报告

3. **审计和合规**
   - 系统级操作需要用户身份追踪
   - 满足合规要求的审计日志
   - 系统级权限管理

4. **数据完整性**
   - 确保所有数据都有明确的归属
   - 避免"孤儿"数据的存在
   - 支持完整的数据生命周期管理

## 数据分类与共享策略

### 数据分类原则

每个层级的数据都可以分为两种类型：

1. **可共享数据 (Shareable Data)**
   - 可以被上级或同级访问的数据
   - 具有明确的共享范围和权限控制
   - 支持跨层级的数据查询和操作

2. **受保护数据 (Protected Data)**
   - 严格限制访问范围的数据
   - 只能被特定层级或用户访问
   - 具有强制的数据隔离保护

### 数据分类实现

```typescript
// 数据分类枚举
export enum DataClassification {
  SHAREABLE = 'shareable', // 可共享数据
  PROTECTED = 'protected', // 受保护数据
}

// 数据访问权限
export enum DataAccessLevel {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share',
}

// 数据分类上下文
export interface DataClassificationContext {
  classification: DataClassification;
  accessLevel: DataAccessLevel;
  shareableScopes: IsolationLevel[]; // 可共享的范围
  protectedScopes: IsolationLevel[]; // 受保护的范围
  ownerLevel: IsolationLevel; // 数据所有者层级
}

// 数据分类服务
@Injectable()
export class DataClassificationService {
  constructor(
    private readonly isolationService: DataIsolationService,
    private readonly permissionService: PermissionService,
  ) {}

  // 检查数据访问权限
  async checkDataAccess(
    dataId: string,
    requesterContext: DataIsolationContext,
    accessLevel: DataAccessLevel,
  ): Promise<boolean> {
    const dataClassification = await this.getDataClassification(dataId);

    // 检查数据分类
    if (dataClassification.classification === DataClassification.PROTECTED) {
      return this.checkProtectedDataAccess(
        dataClassification,
        requesterContext,
        accessLevel,
      );
    }

    // 检查可共享数据访问
    if (dataClassification.classification === DataClassification.SHAREABLE) {
      return this.checkShareableDataAccess(
        dataClassification,
        requesterContext,
        accessLevel,
      );
    }

    return false;
  }

  // 检查受保护数据访问
  private async checkProtectedDataAccess(
    classification: DataClassificationContext,
    requesterContext: DataIsolationContext,
    accessLevel: DataAccessLevel,
  ): Promise<boolean> {
    // 受保护数据只能被所有者或具有特殊权限的用户访问
    const isOwner = this.isDataOwner(classification, requesterContext);
    const hasSpecialPermission = await this.hasSpecialPermission(
      requesterContext,
      accessLevel,
    );

    return isOwner || hasSpecialPermission;
  }

  // 检查可共享数据访问
  private async checkShareableDataAccess(
    classification: DataClassificationContext,
    requesterContext: DataIsolationContext,
    accessLevel: DataAccessLevel,
  ): Promise<boolean> {
    // 检查请求者是否在可共享范围内
    const isInShareableScope = classification.shareableScopes.some(scope =>
      this.isInScope(requesterContext, scope),
    );

    if (!isInShareableScope) {
      return false;
    }

    // 检查具体的访问权限
    return await this.permissionService.checkPermission(
      requesterContext,
      accessLevel,
    );
  }
}
```

## 数据隔离策略

### 行级安全策略

```typescript
// 数据隔离上下文
export interface DataIsolationContext {
  platformId?: string;
  tenantId?: string;
  organizationId?: string;
  departmentId?: string;
  userId: string;
  isolationLevel: IsolationLevel;
  permissions: string[];
}

// 数据隔离服务
@Injectable()
export class DataIsolationService {
  constructor(
    private readonly userService: UserService,
    private readonly permissionService: PermissionService,
  ) {}

  // 获取用户的数据隔离上下文
  async getDataIsolationContext(userId: string): Promise<DataIsolationContext> {
    const user = await this.userService.findById(userId);
    const permissions = await this.permissionService.getUserPermissions(userId);

    return {
      platformId: user.platformId,
      tenantId: user.tenantId,
      organizationId: user.organizationId,
      departmentId: user.departmentId,
      userId: user.id,
      isolationLevel: this.determineIsolationLevel(user),
      permissions,
    };
  }

  // 确定用户的隔离级别
  private determineIsolationLevel(user: User): IsolationLevel {
    if (user.isPlatformAdmin) {
      return IsolationLevel.PLATFORM;
    }

    if (user.tenantId && user.isTenantAdmin) {
      return IsolationLevel.TENANT;
    }

    if (user.organizationId && user.isOrganizationAdmin) {
      return IsolationLevel.ORGANIZATION;
    }

    if (user.departmentId && user.isDepartmentAdmin) {
      return IsolationLevel.DEPARTMENT;
    }

    return IsolationLevel.USER;
  }

  // 应用数据隔离过滤器
  applyDataIsolation<T>(
    query: SelectQueryBuilder<T>,
    context: DataIsolationContext,
  ): SelectQueryBuilder<T> {
    switch (context.isolationLevel) {
      case IsolationLevel.PLATFORM:
        // 平台级用户可以访问所有数据
        return query;

      case IsolationLevel.TENANT:
        // 租户级用户只能访问本租户数据
        return query.where('tenantId = :tenantId', {
          tenantId: context.tenantId,
        });

      case IsolationLevel.ORGANIZATION:
        // 组织级用户只能访问本组织数据
        return query.where('organizationId = :organizationId', {
          organizationId: context.organizationId,
        });

      case IsolationLevel.DEPARTMENT:
        // 部门级用户只能访问本部门数据
        return query.where('departmentId = :departmentId', {
          departmentId: context.departmentId,
        });

      case IsolationLevel.USER:
        // 用户级只能访问自己的数据
        return query.where('userId = :userId', { userId: context.userId });

      default:
        throw new UnauthorizedException('Invalid isolation level');
    }
  }
}
```

### 数据隔离装饰器

```typescript
// 数据隔离装饰器
export function DataIsolation(isolationLevel: IsolationLevel) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const context = this.dataIsolationService.getDataIsolationContext(
        this.getCurrentUserId(),
      );

      // 检查隔离级别权限
      if (!this.hasIsolationPermission(context, isolationLevel)) {
        throw new ForbiddenException('Insufficient isolation level permission');
      }

      // 应用数据隔离
      const result = await method.apply(this, args);
      return this.applyDataIsolationToResult(result, context);
    };
  };
}

// 使用示例
@Injectable()
export class UserService {
  constructor(
    private readonly dataIsolationService: DataIsolationService,
    private readonly userRepository: IUserRepository,
  ) {}

  @DataIsolation(IsolationLevel.TENANT)
  async getUsers(filters: UserFilters): Promise<User[]> {
    return this.userRepository.find(filters);
  }

  @DataIsolation(IsolationLevel.USER)
  async getUserProfile(userId: string): Promise<UserProfile> {
    return this.userRepository.getProfile(userId);
  }
}
```

## 领域模型设计

### 平台管理领域

```typescript
// 平台聚合根
export class Platform extends EventSourcedAggregateRoot {
  private _id: string;
  private _name: string;
  private _settings: PlatformSettings;
  private _tenants: Tenant[];

  public static create(name: string, settings: PlatformSettings): Platform {
    const platform = new Platform();
    const event = new PlatformCreatedEvent(uuid.v4(), name, settings);

    platform.apply(event);
    return platform;
  }

  public addTenant(tenant: Tenant): void {
    this.validateTenantLimit();

    const event = new TenantAddedToPlatformEvent(this._id, tenant.id);

    this.apply(event);
  }

  private validateTenantLimit(): void {
    if (this._tenants.length >= this._settings.maxTenants) {
      throw new TenantLimitExceededError(this._id);
    }
  }

  protected handleEvent(event: IDomainEvent, isFromHistory: boolean): void {
    if (event instanceof PlatformCreatedEvent) {
      this.whenPlatformCreated(event);
    } else if (event instanceof TenantAddedToPlatformEvent) {
      this.whenTenantAdded(event);
    }
  }

  private whenPlatformCreated(event: PlatformCreatedEvent): void {
    this._id = event.aggregateId;
    this._name = event.name;
    this._settings = event.settings;
    this._tenants = [];
  }

  private whenTenantAdded(event: TenantAddedToPlatformEvent): void {
    const tenant = this.findTenant(event.tenantId);
    if (tenant) {
      this._tenants.push(tenant);
    }
  }
}
```

### 租户管理领域

```typescript
// 租户聚合根
export class Tenant extends EventSourcedAggregateRoot {
  private _id: string;
  private _platformId: string;
  private _name: string;
  private _settings: TenantSettings;
  private _organizations: Organization[];
  private _users: User[];

  public static create(
    platformId: string,
    name: string,
    settings: TenantSettings,
  ): Tenant {
    const tenant = new Tenant();
    const event = new TenantCreatedEvent(uuid.v4(), platformId, name, settings);

    tenant.apply(event);
    return tenant;
  }

  public addOrganization(organization: Organization): void {
    this.validateOrganizationLimit();

    const event = new OrganizationAddedToTenantEvent(this._id, organization.id);

    this.apply(event);
  }

  public addUser(user: User): void {
    this.validateUserLimit();

    const event = new UserAddedToTenantEvent(this._id, user.id);

    this.apply(event);
  }

  private validateOrganizationLimit(): void {
    if (this._organizations.length >= this._settings.maxOrganizations) {
      throw new OrganizationLimitExceededError(this._id);
    }
  }

  private validateUserLimit(): void {
    if (this._users.length >= this._settings.maxUsers) {
      throw new UserLimitExceededError(this._id);
    }
  }

  protected handleEvent(event: IDomainEvent, isFromHistory: boolean): void {
    if (event instanceof TenantCreatedEvent) {
      this.whenTenantCreated(event);
    } else if (event instanceof OrganizationAddedToTenantEvent) {
      this.whenOrganizationAdded(event);
    } else if (event instanceof UserAddedToTenantEvent) {
      this.whenUserAdded(event);
    }
  }

  private whenTenantCreated(event: TenantCreatedEvent): void {
    this._id = event.aggregateId;
    this._platformId = event.platformId;
    this._name = event.name;
    this._settings = event.settings;
    this._organizations = [];
    this._users = [];
  }

  private whenOrganizationAdded(event: OrganizationAddedToTenantEvent): void {
    const organization = this.findOrganization(event.organizationId);
    if (organization) {
      this._organizations.push(organization);
    }
  }

  private whenUserAdded(event: UserAddedToTenantEvent): void {
    const user = this.findUser(event.userId);
    if (user) {
      this._users.push(user);
    }
  }
}
```

### 组织管理领域

```typescript
// 组织聚合根
export class Organization extends EventSourcedAggregateRoot {
  private _id: string;
  private _tenantId: string;
  private _name: string;
  private _type: OrganizationType;
  private _departments: Department[];
  private _users: User[];

  public static create(
    tenantId: string,
    name: string,
    type: OrganizationType,
  ): Organization {
    const organization = new Organization();
    const event = new OrganizationCreatedEvent(uuid.v4(), tenantId, name, type);

    organization.apply(event);
    return organization;
  }

  public addDepartment(department: Department): void {
    this.validateDepartmentLimit();

    const event = new DepartmentAddedToOrganizationEvent(
      this._id,
      department.id,
    );

    this.apply(event);
  }

  public addUser(user: User): void {
    this.validateUserLimit();

    const event = new UserAddedToOrganizationEvent(this._id, user.id);

    this.apply(event);
  }

  private validateDepartmentLimit(): void {
    if (this._departments.length >= 50) {
      // 默认限制
      throw new DepartmentLimitExceededError(this._id);
    }
  }

  private validateUserLimit(): void {
    if (this._users.length >= 1000) {
      // 默认限制
      throw new UserLimitExceededError(this._id);
    }
  }

  protected handleEvent(event: IDomainEvent, isFromHistory: boolean): void {
    if (event instanceof OrganizationCreatedEvent) {
      this.whenOrganizationCreated(event);
    } else if (event instanceof DepartmentAddedToOrganizationEvent) {
      this.whenDepartmentAdded(event);
    } else if (event instanceof UserAddedToOrganizationEvent) {
      this.whenUserAdded(event);
    }
  }

  private whenOrganizationCreated(event: OrganizationCreatedEvent): void {
    this._id = event.aggregateId;
    this._tenantId = event.tenantId;
    this._name = event.name;
    this._type = event.type;
    this._departments = [];
    this._users = [];
  }

  private whenDepartmentAdded(event: DepartmentAddedToOrganizationEvent): void {
    const department = this.findDepartment(event.departmentId);
    if (department) {
      this._departments.push(department);
    }
  }

  private whenUserAdded(event: UserAddedToOrganizationEvent): void {
    const user = this.findUser(event.userId);
    if (user) {
      this._users.push(user);
    }
  }
}
```

### 部门管理领域

```typescript
// 部门聚合根
export class Department extends EventSourcedAggregateRoot {
  private _id: string;
  private _organizationId: string;
  private _name: string;
  private _parentDepartmentId?: string;
  private _users: User[];

  public static create(
    organizationId: string,
    name: string,
    parentDepartmentId?: string,
  ): Department {
    const department = new Department();
    const event = new DepartmentCreatedEvent(
      uuid.v4(),
      organizationId,
      name,
      parentDepartmentId,
    );

    department.apply(event);
    return department;
  }

  public addUser(user: User): void {
    this.validateUserLimit();

    const event = new UserAddedToDepartmentEvent(this._id, user.id);

    this.apply(event);
  }

  public removeUser(userId: string): void {
    const event = new UserRemovedFromDepartmentEvent(this._id, userId);

    this.apply(event);
  }

  private validateUserLimit(): void {
    if (this._users.length >= 100) {
      // 默认限制
      throw new UserLimitExceededError(this._id);
    }
  }

  protected handleEvent(event: IDomainEvent, isFromHistory: boolean): void {
    if (event instanceof DepartmentCreatedEvent) {
      this.whenDepartmentCreated(event);
    } else if (event instanceof UserAddedToDepartmentEvent) {
      this.whenUserAdded(event);
    } else if (event instanceof UserRemovedFromDepartmentEvent) {
      this.whenUserRemoved(event);
    }
  }

  private whenDepartmentCreated(event: DepartmentCreatedEvent): void {
    this._id = event.aggregateId;
    this._organizationId = event.organizationId;
    this._name = event.name;
    this._parentDepartmentId = event.parentDepartmentId;
    this._users = [];
  }

  private whenUserAdded(event: UserAddedToDepartmentEvent): void {
    const user = this.findUser(event.userId);
    if (user) {
      this._users.push(user);
    }
  }

  private whenUserRemoved(event: UserRemovedFromDepartmentEvent): void {
    this._users = this._users.filter(user => user.id !== event.userId);
  }
}
```

### 用户管理领域

```typescript
// 用户聚合根
export class User extends EventSourcedAggregateRoot {
  private _id: string;
  private _platformId: string;
  private _tenantId?: string;
  private _organizationId?: string;
  private _departmentId?: string;
  private _email: string;
  private _profile: UserProfile;
  private _roles: UserRole[];

  public static create(
    platformId: string,
    email: string,
    profile: UserProfile,
  ): User {
    const user = new User();
    const event = new UserCreatedEvent(uuid.v4(), platformId, email, profile);

    user.apply(event);
    return user;
  }

  public assignToTenant(tenantId: string): void {
    if (this._tenantId) {
      throw new UserAlreadyAssignedToTenantError(this._id, this._tenantId);
    }

    const event = new UserAssignedToTenantEvent(this._id, tenantId);

    this.apply(event);
  }

  public assignToOrganization(organizationId: string): void {
    if (!this._tenantId) {
      throw new UserNotAssignedToTenantError(this._id);
    }

    const event = new UserAssignedToOrganizationEvent(this._id, organizationId);

    this.apply(event);
  }

  public assignToDepartment(departmentId: string): void {
    if (!this._organizationId) {
      throw new UserNotAssignedToOrganizationError(this._id);
    }

    const event = new UserAssignedToDepartmentEvent(this._id, departmentId);

    this.apply(event);
  }

  public addRole(role: UserRole): void {
    this.validateRoleLimit();

    const event = new UserRoleAddedEvent(this._id, role);

    this.apply(event);
  }

  private validateRoleLimit(): void {
    if (this._roles.length >= 10) {
      // 默认限制
      throw new RoleLimitExceededError(this._id);
    }
  }

  protected handleEvent(event: IDomainEvent, isFromHistory: boolean): void {
    if (event instanceof UserCreatedEvent) {
      this.whenUserCreated(event);
    } else if (event instanceof UserAssignedToTenantEvent) {
      this.whenAssignedToTenant(event);
    } else if (event instanceof UserAssignedToOrganizationEvent) {
      this.whenAssignedToOrganization(event);
    } else if (event instanceof UserAssignedToDepartmentEvent) {
      this.whenAssignedToDepartment(event);
    } else if (event instanceof UserRoleAddedEvent) {
      this.whenRoleAdded(event);
    }
  }

  private whenUserCreated(event: UserCreatedEvent): void {
    this._id = event.aggregateId;
    this._platformId = event.platformId;
    this._email = event.email;
    this._profile = event.profile;
    this._roles = [];
  }

  private whenAssignedToTenant(event: UserAssignedToTenantEvent): void {
    this._tenantId = event.tenantId;
  }

  private whenAssignedToOrganization(
    event: UserAssignedToOrganizationEvent,
  ): void {
    this._organizationId = event.organizationId;
  }

  private whenAssignedToDepartment(event: UserAssignedToDepartmentEvent): void {
    this._departmentId = event.departmentId;
  }

  private whenRoleAdded(event: UserRoleAddedEvent): void {
    this._roles.push(event.role);
  }
}
```

## 数据隔离实现

### 隔离仓储基类

```typescript
// 隔离仓储基类
export abstract class IsolatedRepository<T> {
  constructor(
    protected readonly entityManager: EntityManager,
    protected readonly dataIsolationService: DataIsolationService,
  ) {}

  protected async applyIsolation(
    query: SelectQueryBuilder<T>,
    userId: string,
  ): Promise<SelectQueryBuilder<T>> {
    const context =
      await this.dataIsolationService.getDataIsolationContext(userId);
    return this.dataIsolationService.applyDataIsolation(query, context);
  }

  async findById(id: string, userId: string): Promise<T | null> {
    const query = this.entityManager
      .createQueryBuilder(this.getEntityClass(), 'entity')
      .where('entity.id = :id', { id });

    const isolatedQuery = await this.applyIsolation(query, userId);
    return isolatedQuery.getOne();
  }

  async find(filters: any, userId: string): Promise<T[]> {
    const query = this.entityManager.createQueryBuilder(
      this.getEntityClass(),
      'entity',
    );

    // 应用过滤条件
    this.applyFilters(query, filters);

    // 应用数据隔离
    const isolatedQuery = await this.applyIsolation(query, userId);
    return isolatedQuery.getMany();
  }

  protected abstract getEntityClass(): new () => T;
  protected abstract applyFilters(
    query: SelectQueryBuilder<T>,
    filters: any,
  ): void;
}
```

### 用户仓储实现

```typescript
// 用户仓储实现
@Injectable()
export class UserRepository extends IsolatedRepository<User> {
  constructor(
    @InjectEntityManager() entityManager: EntityManager,
    dataIsolationService: DataIsolationService,
  ) {
    super(entityManager, dataIsolationService);
  }

  protected getEntityClass(): new () => User {
    return User;
  }

  protected applyFilters(
    query: SelectQueryBuilder<User>,
    filters: UserFilters,
  ): void {
    if (filters.email) {
      query.andWhere('entity.email LIKE :email', {
        email: `%${filters.email}%`,
      });
    }

    if (filters.status) {
      query.andWhere('entity.status = :status', { status: filters.status });
    }

    if (filters.tenantId) {
      query.andWhere('entity.tenantId = :tenantId', {
        tenantId: filters.tenantId,
      });
    }

    if (filters.organizationId) {
      query.andWhere('entity.organizationId = :organizationId', {
        organizationId: filters.organizationId,
      });
    }

    if (filters.departmentId) {
      query.andWhere('entity.departmentId = :departmentId', {
        departmentId: filters.departmentId,
      });
    }
  }

  async findByEmail(email: string, userId: string): Promise<User | null> {
    const query = this.entityManager
      .createQueryBuilder(User, 'user')
      .where('user.email = :email', { email });

    const isolatedQuery = await this.applyIsolation(query, userId);
    return isolatedQuery.getOne();
  }

  async findUsersInTenant(tenantId: string, userId: string): Promise<User[]> {
    const query = this.entityManager
      .createQueryBuilder(User, 'user')
      .where('user.tenantId = :tenantId', { tenantId });

    const isolatedQuery = await this.applyIsolation(query, userId);
    return isolatedQuery.getMany();
  }
}
```

## 多租户配置管理

### 租户配置服务

```typescript
// 租户配置服务
@Injectable()
export class TenantConfigurationService {
  constructor(
    private readonly configRepository: IConfigurationRepository,
    private readonly cacheService: ICacheService,
  ) {}

  // 获取租户配置
  async getTenantConfiguration(tenantId: string): Promise<TenantConfiguration> {
    const cacheKey = `tenant:config:${tenantId}`;

    // 尝试从缓存获取
    let config = await this.cacheService.get<TenantConfiguration>(cacheKey);

    if (!config) {
      // 从数据库获取
      config = await this.configRepository.findByTenantId(tenantId);

      // 缓存配置
      await this.cacheService.set(cacheKey, config, 300); // 5分钟缓存
    }

    return config;
  }

  // 更新租户配置
  async updateTenantConfiguration(
    tenantId: string,
    updates: Partial<TenantConfiguration>,
  ): Promise<void> {
    // 更新数据库
    await this.configRepository.updateByTenantId(tenantId, updates);

    // 清除缓存
    const cacheKey = `tenant:config:${tenantId}`;
    await this.cacheService.delete(cacheKey);

    // 发布配置变更事件
    await this.eventBus.publish(
      new TenantConfigurationUpdatedEvent(tenantId, updates),
    );
  }
}
```

### 数据隔离配置

```typescript
// 数据隔离配置
export interface DataIsolationConfig {
  strategy: IsolationStrategy;
  enableRowLevelSecurity: boolean;
  enableAuditLogging: boolean;
  maxDataRetentionDays: number;
  enableDataEncryption: boolean;
}

// 隔离策略枚举
export enum IsolationStrategy {
  DATABASE_LEVEL = 'database_level', // 数据库级隔离
  SCHEMA_LEVEL = 'schema_level', // Schema级隔离
  TABLE_LEVEL = 'table_level', // 表级隔离
}

// 数据隔离配置服务
@Injectable()
export class DataIsolationConfigService {
  constructor(private readonly configRepository: IConfigurationRepository) {}

  // 获取数据隔离配置
  async getDataIsolationConfig(tenantId: string): Promise<DataIsolationConfig> {
    const config = await this.configRepository.findByTenantId(tenantId);

    return {
      strategy: config.isolationStrategy || IsolationStrategy.TABLE_LEVEL,
      enableRowLevelSecurity: config.enableRowLevelSecurity ?? true,
      enableAuditLogging: config.enableAuditLogging ?? true,
      maxDataRetentionDays: config.maxDataRetentionDays || 2555, // 7年
      enableDataEncryption: config.enableDataEncryption ?? true,
    };
  }

  // 更新数据隔离配置
  async updateDataIsolationConfig(
    tenantId: string,
    updates: Partial<DataIsolationConfig>,
  ): Promise<void> {
    await this.configRepository.updateByTenantId(tenantId, {
      isolationStrategy: updates.strategy,
      enableRowLevelSecurity: updates.enableRowLevelSecurity,
      enableAuditLogging: updates.enableAuditLogging,
      maxDataRetentionDays: updates.maxDataRetentionDays,
      enableDataEncryption: updates.enableDataEncryption,
    });
  }
}
```

## 审计和合规

### 审计日志服务

```typescript
// 审计日志服务
@Injectable()
export class AuditLogService {
  constructor(
    private readonly auditRepository: IAuditRepository,
    private readonly eventBus: IEventBus,
  ) {}

  // 记录数据访问审计
  async logDataAccess(
    userId: string,
    action: string,
    resourceType: string,
    resourceId: string,
    context: DataIsolationContext,
  ): Promise<void> {
    const auditLog = new AuditLog({
      id: uuid.v4(),
      userId,
      action,
      resourceType,
      resourceId,
      isolationLevel: context.isolationLevel,
      tenantId: context.tenantId,
      organizationId: context.organizationId,
      departmentId: context.departmentId,
      timestamp: new Date(),
      ipAddress: this.getClientIpAddress(),
      userAgent: this.getUserAgent(),
    });

    await this.auditRepository.save(auditLog);

    // 发布审计事件
    await this.eventBus.publish(new DataAccessAuditedEvent(auditLog));
  }

  // 查询审计日志
  async queryAuditLogs(
    filters: AuditLogFilters,
    context: DataIsolationContext,
  ): Promise<AuditLog[]> {
    // 应用数据隔离
    const isolatedFilters = this.applyIsolationToFilters(filters, context);

    return this.auditRepository.find(isolatedFilters);
  }

  private applyIsolationToFilters(
    filters: AuditLogFilters,
    context: DataIsolationContext,
  ): AuditLogFilters {
    switch (context.isolationLevel) {
      case IsolationLevel.PLATFORM:
        // 平台级可以查看所有审计日志
        return filters;

      case IsolationLevel.TENANT:
        // 租户级只能查看本租户的审计日志
        return { ...filters, tenantId: context.tenantId };

      case IsolationLevel.ORGANIZATION:
        // 组织级只能查看本组织的审计日志
        return {
          ...filters,
          tenantId: context.tenantId,
          organizationId: context.organizationId,
        };

      case IsolationLevel.DEPARTMENT:
        // 部门级只能查看本部门的审计日志
        return {
          ...filters,
          tenantId: context.tenantId,
          organizationId: context.organizationId,
          departmentId: context.departmentId,
        };

      case IsolationLevel.USER:
        // 用户级只能查看自己的审计日志
        return { ...filters, userId: context.userId };

      default:
        throw new UnauthorizedException('Invalid isolation level');
    }
  }
}
```

## 性能优化

### 数据隔离索引策略

```typescript
// 数据隔离索引配置
export class DataIsolationIndexStrategy {
  // 为多租户数据创建复合索引
  static createTenantIndexes(): IndexDefinition[] {
    return [
      // 租户级索引
      {
        name: 'idx_tenant_data',
        columns: ['tenantId', 'createdAt'],
        unique: false,
      },
      // 组织级索引
      {
        name: 'idx_organization_data',
        columns: ['tenantId', 'organizationId', 'createdAt'],
        unique: false,
      },
      // 部门级索引
      {
        name: 'idx_department_data',
        columns: ['tenantId', 'organizationId', 'departmentId', 'createdAt'],
        unique: false,
      },
      // 用户级索引
      {
        name: 'idx_user_data',
        columns: [
          'tenantId',
          'organizationId',
          'departmentId',
          'userId',
          'createdAt',
        ],
        unique: false,
      },
    ];
  }

  // 为审计日志创建索引
  static createAuditIndexes(): IndexDefinition[] {
    return [
      {
        name: 'idx_audit_tenant',
        columns: ['tenantId', 'timestamp'],
        unique: false,
      },
      {
        name: 'idx_audit_user',
        columns: ['userId', 'timestamp'],
        unique: false,
      },
      {
        name: 'idx_audit_resource',
        columns: ['resourceType', 'resourceId', 'timestamp'],
        unique: false,
      },
    ];
  }
}
```

### 缓存策略

```typescript
// 多租户缓存策略
@Injectable()
export class MultiTenantCacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly tenantContext: ITenantContext,
  ) {}

  // 生成租户级缓存键
  private generateTenantCacheKey(key: string, tenantId: string): string {
    return `tenant:${tenantId}:${key}`;
  }

  // 获取租户级缓存
  async get<T>(key: string, tenantId: string): Promise<T | null> {
    const tenantKey = this.generateTenantCacheKey(key, tenantId);
    return this.redisService.get<T>(tenantKey);
  }

  // 设置租户级缓存
  async set<T>(
    key: string,
    value: T,
    ttl: number,
    tenantId: string,
  ): Promise<void> {
    const tenantKey = this.generateTenantCacheKey(key, tenantId);
    await this.redisService.set(tenantKey, value, ttl);
  }

  // 清除租户级缓存
  async clearTenantCache(tenantId: string): Promise<void> {
    const pattern = `tenant:${tenantId}:*`;
    await this.redisService.deletePattern(pattern);
  }

  // 清除所有租户缓存
  async clearAllTenantCache(): Promise<void> {
    const pattern = 'tenant:*';
    await this.redisService.deletePattern(pattern);
  }
}
```

## 总结

多租户数据隔离设计通过五层隔离架构实现了细粒度的数据访问控制：

### 核心特性

1. **五层隔离架构**: 平台级 → 租户级 → 组织级 → 部门级 → 用户级
2. **数据分类管理**: 可共享数据和受保护数据的分类管理
3. **动态权限控制**: 基于用户角色的动态数据访问权限
4. **审计和合规**: 完整的数据访问审计日志
5. **性能优化**: 针对多租户场景的索引和缓存策略

### 技术实现

- **领域模型**: 基于DDD的聚合根设计，支持事件溯源
- **数据隔离**: 行级安全策略和装饰器模式
- **配置管理**: 租户级配置和数据隔离策略配置
- **缓存策略**: 租户级缓存隔离和管理
- **审计日志**: 完整的数据访问审计和合规支持

### 优势

- ✅ **数据安全**: 严格的数据隔离和访问控制
- ✅ **灵活配置**: 支持不同租户的个性化配置
- ✅ **性能优化**: 针对多租户场景的优化策略
- ✅ **合规支持**: 完整的审计日志和合规功能
- ✅ **可扩展性**: 支持大规模多租户部署

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
