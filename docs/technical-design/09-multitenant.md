# 多租户数据隔离

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

## 相关文档

- [核心模块与组件设计](./03-core-modules.md)
- [领域模型设计](./04-domain-models.md)
- [事件溯源设计](./07-event-sourcing.md)
- [部署与运维](./08-deployment.md)

---

**上一篇**：[事件溯源设计](./07-event-sourcing.md)  
**下一篇**：[总结](./10-summary.md)
