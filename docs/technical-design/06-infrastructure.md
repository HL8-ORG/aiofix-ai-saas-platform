# 基础设施实现

## 概述

基础设施层负责提供技术实现，包括数据持久化、外部服务集成、消息传递、缓存、日志等。本层实现了领域层定义的接口，为应用层提供具体的技术服务。

## 基础设施层架构

### 整体架构

```
基础设施层 (Infrastructure Layer)
├── 持久化 (Persistence)
│   ├── PostgreSQL实现
│   │   ├── 实体定义 (Entities)
│   │   ├── 仓储实现 (Repositories)
│   │   ├── 数据库迁移 (Migrations)
│   │   ├── 实体映射器 (Mappers)
│   │   └── 数据库适配器 (Adapters)
│   ├── MongoDB实现
│   │   ├── 文档定义 (Documents)
│   │   ├── 集合实现 (Collections)
│   │   ├── 模式定义 (Schemas)
│   │   ├── 文档映射器 (Mappers)
│   │   └── 数据库适配器 (Adapters)
│   └── 事件存储 (Event Store)
│       ├── 事件投射器 (Projections)
│       ├── 快照管理 (Snapshots)
│       └── 事件存储适配器 (Adapters)
├── 消息传递 (Messaging)
│   ├── 消息队列 (Message Queue)
│   ├── 事件总线 (Event Bus)
│   └── 消息路由 (Message Routing)
├── 外部服务集成 (External Services)
│   ├── 邮件服务 (Email Service)
│   ├── 短信服务 (SMS Service)
│   ├── 文件存储 (File Storage)
│   └── 第三方API (Third-party APIs)
├── 缓存 (Caching)
│   ├── Redis缓存 (Redis Cache)
│   ├── 内存缓存 (In-memory Cache)
│   └── 分布式缓存 (Distributed Cache)
└── 配置管理 (Configuration)
    ├── 环境配置 (Environment Config)
    ├── 数据库配置 (Database Config)
    └── 服务配置 (Service Config)
```

## 持久化实现

### PostgreSQL实现

#### 实体定义

```typescript
// 用户实体
@Entity({ tableName: 'users' })
export class UserEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Property({ type: 'varchar', length: 255 })
  hashedPassword!: string;

  @Property({ type: 'jsonb' })
  profile!: UserProfile;

  @Property({ type: 'varchar', length: 50 })
  status!: UserStatus;

  @Property({ type: 'uuid' })
  platformId!: string;

  @Property({ type: 'uuid', nullable: true })
  tenantId?: string;

  @Property({ type: 'uuid', nullable: true })
  organizationId?: string;

  @Property({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Property({ type: 'jsonb', default: [] })
  roles!: string[];

  @Property({ type: 'jsonb', default: [] })
  permissions!: string[];

  @Property({ type: 'timestamp', default: 'now()' })
  createdAt!: Date;

  @Property({ type: 'timestamp', default: 'now()', onUpdate: 'now()' })
  updatedAt!: Date;

  @Property({ type: 'int', default: 0 })
  version!: number;
}

// 租户实体
@Entity({ tableName: 'tenants' })
export class TenantEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 255, unique: true })
  name!: string;

  @Property({ type: 'varchar', length: 50 })
  type!: TenantType;

  @Property({ type: 'jsonb' })
  settings!: TenantSettings;

  @Property({ type: 'varchar', length: 50 })
  status!: TenantStatus;

  @Property({ type: 'uuid' })
  createdBy!: string;

  @Property({ type: 'timestamp', default: 'now()' })
  createdAt!: Date;

  @Property({ type: 'timestamp', default: 'now()', onUpdate: 'now()' })
  updatedAt!: Date;

  @Property({ type: 'int', default: 0 })
  version!: number;
}

// 组织实体
@Entity({ tableName: 'organizations' })
export class OrganizationEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'varchar', length: 50 })
  type!: OrganizationType;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'uuid' })
  tenantId!: string;

  @Property({ type: 'varchar', length: 50 })
  status!: OrganizationStatus;

  @Property({ type: 'uuid' })
  createdBy!: string;

  @Property({ type: 'timestamp', default: 'now()' })
  createdAt!: Date;

  @Property({ type: 'timestamp', default: 'now()', onUpdate: 'now()' })
  updatedAt!: Date;

  @Property({ type: 'int', default: 0 })
  version!: number;
}

// 部门实体
@Entity({ tableName: 'departments' })
export class DepartmentEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'uuid' })
  organizationId!: string;

  @Property({ type: 'uuid', nullable: true })
  parentDepartmentId?: string;

  @Property({ type: 'varchar', length: 50 })
  status!: DepartmentStatus;

  @Property({ type: 'uuid' })
  createdBy!: string;

  @Property({ type: 'timestamp', default: 'now()' })
  createdAt!: Date;

  @Property({ type: 'timestamp', default: 'now()', onUpdate: 'now()' })
  updatedAt!: Date;

  @Property({ type: 'int', default: 0 })
  version!: number;
}

// 角色实体
@Entity({ tableName: 'roles' })
export class RoleEntity {
  @PrimaryKey({ type: 'uuid' })
  id!: string;

  @Property({ type: 'varchar', length: 255 })
  name!: string;

  @Property({ type: 'text', nullable: true })
  description?: string;

  @Property({ type: 'jsonb', default: [] })
  permissions!: string[];

  @Property({ type: 'varchar', length: 50 })
  scope!: RoleScope;

  @Property({ type: 'uuid', nullable: true })
  tenantId?: string;

  @Property({ type: 'uuid', nullable: true })
  organizationId?: string;

  @Property({ type: 'uuid', nullable: true })
  departmentId?: string;

  @Property({ type: 'boolean', default: true })
  isActive!: boolean;

  @Property({ type: 'timestamp', default: 'now()' })
  createdAt!: Date;

  @Property({ type: 'timestamp', default: 'now()', onUpdate: 'now()' })
  updatedAt!: Date;

  @Property({ type: 'int', default: 0 })
  version!: number;
}
```

#### 仓储实现

```typescript
// 用户仓储实现
@Injectable()
export class UserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: EntityRepository<UserEntity>,
    private readonly dataIsolationService: DataIsolationService
  ) {}

  async save(user: User): Promise<void> {
    const userEntity = this.mapToEntity(user);
    await this.userRepository.persistAndFlush(userEntity);
  }

  async findById(id: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne(id);
    return userEntity ? this.mapToDomain(userEntity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userEntity = await this.userRepository.findOne({ email });
    return userEntity ? this.mapToDomain(userEntity) : null;
  }

  async findByStatus(status: UserStatus): Promise<User[]> {
    const userEntities = await this.userRepository.find({ status });
    return userEntities.map(entity => this.mapToDomain(entity));
  }

  async delete(id: string): Promise<void> {
    await this.userRepository.nativeDelete(id);
  }

  async exists(id: string): Promise<boolean> {
    const count = await this.userRepository.count({ id });
    return count > 0;
  }

  async findWithIsolation(
    filters: UserFilters,
    isolationContext: DataIsolationContext
  ): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');
    
    // 应用数据隔离
    this.applyDataIsolation(query, isolationContext);
    
    // 应用过滤条件
    this.applyFilters(query, filters);
    
    const userEntities = await query.getResult();
    return userEntities.map(entity => this.mapToDomain(entity));
  }

  private applyDataIsolation(
    query: QueryBuilder<UserEntity>,
    isolationContext: DataIsolationContext
  ): void {
    if (isolationContext.platformId) {
      query.andWhere('user.platformId = :platformId', { 
        platformId: isolationContext.platformId 
      });
    }
    
    if (isolationContext.tenantId) {
      query.andWhere('user.tenantId = :tenantId', { 
        tenantId: isolationContext.tenantId 
      });
    }
    
    if (isolationContext.organizationId) {
      query.andWhere('user.organizationId = :organizationId', { 
        organizationId: isolationContext.organizationId 
      });
    }
    
    if (isolationContext.departmentId) {
      query.andWhere('user.departmentId = :departmentId', { 
        departmentId: isolationContext.departmentId 
      });
    }
  }

  private applyFilters(
    query: QueryBuilder<UserEntity>,
    filters: UserFilters
  ): void {
    if (filters.email) {
      query.andWhere('user.email ILIKE :email', { 
        email: `%${filters.email}%` 
      });
    }
    
    if (filters.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }
    
    if (filters.role) {
      query.andWhere('user.roles @> :role', { role: JSON.stringify([filters.role]) });
    }
  }

  private mapToEntity(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id;
    entity.email = user.email;
    entity.hashedPassword = user.hashedPassword;
    entity.profile = user.profile;
    entity.status = user.status;
    entity.platformId = user.platformId;
    entity.tenantId = user.tenantId;
    entity.organizationId = user.organizationId;
    entity.departmentId = user.departmentId;
    entity.roles = user.roles;
    entity.permissions = user.permissions;
    entity.createdAt = user.createdAt;
    entity.updatedAt = user.updatedAt;
    entity.version = user.version;
    return entity;
  }

  private mapToDomain(entity: UserEntity): User {
    const user = new User();
    user.id = entity.id;
    user.email = entity.email;
    user.hashedPassword = entity.hashedPassword;
    user.profile = entity.profile;
    user.status = entity.status;
    user.platformId = entity.platformId;
    user.tenantId = entity.tenantId;
    user.organizationId = entity.organizationId;
    user.departmentId = entity.departmentId;
    user.roles = entity.roles;
    user.permissions = entity.permissions;
    user.createdAt = entity.createdAt;
    user.updatedAt = entity.updatedAt;
    user.version = entity.version;
    return user;
  }
}
```

#### 数据库迁移

```typescript
// 用户表迁移
export class CreateUsersTable1704067200000 implements Migration {
  async up(schema: Schema): Promise<void> {
    schema.createTable('users', (table) => {
      table.uuid('id').primary();
      table.string('email', 255).unique().notNullable();
      table.string('hashed_password', 255).notNullable();
      table.jsonb('profile').notNullable();
      table.string('status', 50).notNullable();
      table.uuid('platform_id').notNullable();
      table.uuid('tenant_id').nullable();
      table.uuid('organization_id').nullable();
      table.uuid('department_id').nullable();
      table.jsonb('roles').defaultTo('[]');
      table.jsonb('permissions').defaultTo('[]');
      table.timestamp('created_at').defaultTo('now()');
      table.timestamp('updated_at').defaultTo('now()');
      table.integer('version').defaultTo(0);
      
      // 索引
      table.index(['email']);
      table.index(['platform_id']);
      table.index(['tenant_id']);
      table.index(['organization_id']);
      table.index(['department_id']);
      table.index(['status']);
    });
  }

  async down(schema: Schema): Promise<void> {
    schema.dropTable('users');
  }
}

// 租户表迁移
export class CreateTenantsTable1704067200001 implements Migration {
  async up(schema: Schema): Promise<void> {
    schema.createTable('tenants', (table) => {
      table.uuid('id').primary();
      table.string('name', 255).unique().notNullable();
      table.string('type', 50).notNullable();
      table.jsonb('settings').notNullable();
      table.string('status', 50).notNullable();
      table.uuid('created_by').notNullable();
      table.timestamp('created_at').defaultTo('now()');
      table.timestamp('updated_at').defaultTo('now()');
      table.integer('version').defaultTo(0);
      
      // 索引
      table.index(['name']);
      table.index(['type']);
      table.index(['status']);
      table.index(['created_by']);
    });
  }

  async down(schema: Schema): Promise<void> {
    schema.dropTable('tenants');
  }
}
```

### MongoDB实现

#### 文档定义

```typescript
// 用户文档
@Document({ collection: 'users' })
export class UserDocument {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  id!: string;

  @Property()
  email!: string;

  @Property()
  hashedPassword!: string;

  @Property()
  profile!: UserProfile;

  @Property()
  status!: UserStatus;

  @Property()
  platformId!: string;

  @Property()
  tenantId?: string;

  @Property()
  organizationId?: string;

  @Property()
  departmentId?: string;

  @Property()
  roles!: string[];

  @Property()
  permissions!: string[];

  @Property()
  createdAt!: Date;

  @Property()
  updatedAt!: Date;

  @Property()
  version!: number;
}

// 日志文档
@Document({ collection: 'audit_logs' })
export class AuditLogDocument {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  id!: string;

  @Property()
  eventType!: string;

  @Property()
  aggregateId!: string;

  @Property()
  userId!: string;

  @Property()
  performedBy!: string;

  @Property()
  details!: any;

  @Property()
  timestamp!: Date;

  @Property()
  ipAddress?: string;

  @Property()
  userAgent?: string;
}

// 配置文档
@Document({ collection: 'configurations' })
export class ConfigurationDocument {
  @PrimaryKey()
  _id!: ObjectId;

  @Property()
  id!: string;

  @Property()
  key!: string;

  @Property()
  value!: any;

  @Property()
  type!: ConfigurationType;

  @Property()
  scope!: ConfigurationScope;

  @Property()
  tenantId?: string;

  @Property()
  organizationId?: string;

  @Property()
  departmentId?: string;

  @Property()
  isActive!: boolean;

  @Property()
  createdAt!: Date;

  @Property()
  updatedAt!: Date;
}
```

#### 集合实现

```typescript
// 用户集合实现
@Injectable()
export class UserCollection implements IUserCollection {
  constructor(
    @InjectRepository(UserDocument)
    private readonly userRepository: EntityRepository<UserDocument>
  ) {}

  async save(user: User): Promise<void> {
    const userDocument = this.mapToDocument(user);
    await this.userRepository.persistAndFlush(userDocument);
  }

  async findById(id: string): Promise<User | null> {
    const userDocument = await this.userRepository.findOne({ id });
    return userDocument ? this.mapToDomain(userDocument) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const userDocument = await this.userRepository.findOne({ email });
    return userDocument ? this.mapToDomain(userDocument) : null;
  }

  async findWithFilters(filters: UserFilters): Promise<User[]> {
    const query: any = {};
    
    if (filters.email) {
      query.email = { $regex: filters.email, $options: 'i' };
    }
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.role) {
      query.roles = { $in: [filters.role] };
    }
    
    const userDocuments = await this.userRepository.find(query);
    return userDocuments.map(doc => this.mapToDomain(doc));
  }

  async updateUserProfile(userId: string, profile: UserProfile): Promise<void> {
    await this.userRepository.nativeUpdateOne(
      { id: userId },
      { 
        $set: { 
          profile,
          updatedAt: new Date()
        },
        $inc: { version: 1 }
      }
    );
  }

  private mapToDocument(user: User): UserDocument {
    const document = new UserDocument();
    document.id = user.id;
    document.email = user.email;
    document.hashedPassword = user.hashedPassword;
    document.profile = user.profile;
    document.status = user.status;
    document.platformId = user.platformId;
    document.tenantId = user.tenantId;
    document.organizationId = user.organizationId;
    document.departmentId = user.departmentId;
    document.roles = user.roles;
    document.permissions = user.permissions;
    document.createdAt = user.createdAt;
    document.updatedAt = user.updatedAt;
    document.version = user.version;
    return document;
  }

  private mapToDomain(document: UserDocument): User {
    const user = new User();
    user.id = document.id;
    user.email = document.email;
    user.hashedPassword = document.hashedPassword;
    user.profile = document.profile;
    user.status = document.status;
    user.platformId = document.platformId;
    user.tenantId = document.tenantId;
    user.organizationId = document.organizationId;
    user.departmentId = document.departmentId;
    user.roles = document.roles;
    user.permissions = document.permissions;
    user.createdAt = document.createdAt;
    user.updatedAt = document.updatedAt;
    user.version = document.version;
    return user;
  }
}
```

### 事件存储实现

#### 事件存储服务

```typescript
// 事件存储服务实现
@Injectable()
export class EventStoreService implements IEventStore {
  constructor(
    @InjectRepository(EventEntity)
    private readonly eventRepository: EntityRepository<EventEntity>,
    @InjectRepository(AggregateSnapshot)
    private readonly snapshotRepository: EntityRepository<AggregateSnapshot>,
    @InjectConnection() private readonly connection: Connection
  ) {}

  async saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    await this.connection.transaction(async (manager) => {
      // 乐观锁检查
      const currentVersion = await this.getCurrentVersion(aggregateId);
      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(aggregateId, expectedVersion, currentVersion);
      }

      // 批量保存事件
      const eventEntities = events.map((event, index) => 
        this.mapToEventEntity(event, expectedVersion + index + 1)
      );
      
      await manager.save(EventEntity, eventEntities);
    });
  }

  async getEvents(aggregateId: string, fromVersion?: number): Promise<IDomainEvent[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .orderBy('event.version', 'ASC');

    if (fromVersion) {
      query.andWhere('event.version >= :fromVersion', { fromVersion });
    }

    const events = await query.getMany();
    return events.map(event => this.mapToDomainEvent(event));
  }

  async getEventsByType(eventType: string, fromDate?: Date): Promise<IDomainEvent[]> {
    const query = this.eventRepository
      .createQueryBuilder('event')
      .where('event.eventType = :eventType', { eventType })
      .orderBy('event.occurredOn', 'ASC');

    if (fromDate) {
      query.andWhere('event.occurredOn >= :fromDate', { fromDate });
    }

    const events = await query.getMany();
    return events.map(event => this.mapToDomainEvent(event));
  }

  async getSnapshot(aggregateId: string): Promise<IAggregateSnapshot | null> {
    const snapshot = await this.snapshotRepository.findOne({
      where: { aggregateId },
      order: { version: 'DESC' }
    });

    return snapshot ? this.mapToSnapshot(snapshot) : null;
  }

  async saveSnapshot(snapshot: IAggregateSnapshot): Promise<void> {
    const snapshotEntity = this.mapToSnapshotEntity(snapshot);
    await this.snapshotRepository.persistAndFlush(snapshotEntity);
  }

  private async getCurrentVersion(aggregateId: string): Promise<number> {
    const result = await this.eventRepository
      .createQueryBuilder('event')
      .select('MAX(event.version)', 'maxVersion')
      .where('event.aggregateId = :aggregateId', { aggregateId })
      .getRawOne();

    return result?.maxVersion || 0;
  }

  private mapToEventEntity(event: IDomainEvent, version: number): EventEntity {
    const entity = new EventEntity();
    entity.id = event.eventId;
    entity.aggregateId = event.aggregateId;
    entity.eventType = event.eventType;
    entity.eventVersion = event.eventVersion;
    entity.eventData = event.toJSON();
    entity.occurredOn = event.occurredOn;
    entity.version = version;
    return entity;
  }

  private mapToDomainEvent(entity: EventEntity): IDomainEvent {
    // 根据事件类型创建相应的领域事件
    const eventClass = this.getEventClass(entity.eventType);
    const event = new eventClass(entity.aggregateId, entity.eventVersion);
    
    // 从JSON数据恢复事件属性
    Object.assign(event, entity.eventData);
    
    return event;
  }

  private getEventClass(eventType: string): new (...args: any[]) => IDomainEvent {
    const eventClasses = {
      'UserCreatedEvent': UserCreatedEvent,
      'UserAssignedToTenantEvent': UserAssignedToTenantEvent,
      'TenantCreatedEvent': TenantCreatedEvent,
      // 添加其他事件类型
    };

    return eventClasses[eventType] || DomainEvent;
  }

  private mapToSnapshot(snapshot: AggregateSnapshot): IAggregateSnapshot {
    return {
      aggregateId: snapshot.aggregateId,
      version: snapshot.version,
      data: snapshot.data,
      createdAt: snapshot.createdAt
    };
  }

  private mapToSnapshotEntity(snapshot: IAggregateSnapshot): AggregateSnapshot {
    const entity = new AggregateSnapshot();
    entity.aggregateId = snapshot.aggregateId;
    entity.version = snapshot.version;
    entity.data = snapshot.data;
    entity.createdAt = snapshot.createdAt;
    return entity;
  }
}
```

## 消息传递实现

### 消息队列服务

```typescript
// 消息队列服务
@Injectable()
export class MessageQueueService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: Logger
  ) {}

  async publishMessage(queueName: string, message: any): Promise<void> {
    try {
      await this.redisService.lpush(queueName, JSON.stringify(message));
      this.logger.log(`Message published to queue: ${queueName}`);
    } catch (error) {
      this.logger.error(`Failed to publish message to queue: ${queueName}`, error);
      throw error;
    }
  }

  async consumeMessage(queueName: string, handler: (message: any) => Promise<void>): Promise<void> {
    while (true) {
      try {
        const message = await this.redisService.brpop(queueName, 5);
        if (message) {
          const parsedMessage = JSON.parse(message[1]);
          await handler(parsedMessage);
        }
      } catch (error) {
        this.logger.error(`Error consuming message from queue: ${queueName}`, error);
        // 继续处理下一个消息
      }
    }
  }

  async publishEvent(event: IDomainEvent): Promise<void> {
    const eventMessage = {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      eventData: event.toJSON(),
      occurredOn: event.occurredOn
    };

    await this.publishMessage('domain_events', eventMessage);
  }
}
```

### 事件总线实现

```typescript
// 事件总线实现
@Injectable()
export class EventBusService {
  private readonly eventHandlers = new Map<string, EventHandler[]>();

  constructor(
    private readonly messageQueueService: MessageQueueService,
    private readonly logger: Logger
  ) {}

  registerHandler(eventType: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  async publish(event: IDomainEvent): Promise<void> {
    // 发布到消息队列
    await this.messageQueueService.publishEvent(event);

    // 同步处理事件处理器
    const handlers = this.eventHandlers.get(event.eventType) || [];
    for (const handler of handlers) {
      try {
        await handler.handle(event);
      } catch (error) {
        this.logger.error(`Error handling event: ${event.eventType}`, error);
        // 继续处理其他处理器
      }
    }
  }

  async publishAll(events: IDomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}
```

## 外部服务集成

### 邮件服务实现

```typescript
// 邮件服务实现
@Injectable()
export class EmailService {
  constructor(
    private readonly nodemailerService: NodemailerService,
    private readonly templateService: TemplateService,
    private readonly logger: Logger
  ) {}

  async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const template = await this.templateService.getTemplate('welcome');
    const html = template.render({ firstName });

    await this.sendEmail({
      to: email,
      subject: '欢迎使用我们的平台',
      html
    });
  }

  async sendNotificationEmail(
    email: string,
    subject: string,
    templateName: string,
    data: any
  ): Promise<void> {
    const template = await this.templateService.getTemplate(templateName);
    const html = template.render(data);

    await this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      await this.nodemailerService.sendMail({
        from: process.env.SMTP_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html
      });

      this.logger.log(`Email sent to: ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email to: ${options.to}`, error);
      throw error;
    }
  }
}
```

### 短信服务实现

```typescript
// 短信服务实现
@Injectable()
export class SMSService {
  constructor(
    private readonly twilioService: TwilioService,
    private readonly logger: Logger
  ) {}

  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    const message = `您的验证码是：${code}，5分钟内有效。`;
    
    await this.sendSMS(phoneNumber, message);
  }

  async sendNotification(phoneNumber: string, message: string): Promise<void> {
    await this.sendSMS(phoneNumber, message);
  }

  private async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      await this.twilioService.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      this.logger.log(`SMS sent to: ${phoneNumber}`);
    } catch (error) {
      this.logger.error(`Failed to send SMS to: ${phoneNumber}`, error);
      throw error;
    }
  }
}
```

## 缓存实现

### Redis缓存服务

```typescript
// Redis缓存服务
@Injectable()
export class RedisCacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: Logger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Failed to get cache key: ${key}`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redisService.setex(key, ttl, serializedValue);
      } else {
        await this.redisService.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Failed to set cache key: ${key}`, error);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redisService.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete cache key: ${key}`, error);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisService.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check cache key existence: ${key}`, error);
      return false;
    }
  }

  async clearPattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redisService.keys(pattern);
      if (keys.length > 0) {
        await this.redisService.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Failed to clear cache pattern: ${pattern}`, error);
      throw error;
    }
  }
}
```

### 内存缓存服务

```typescript
// 内存缓存服务
@Injectable()
export class InMemoryCacheService {
  private readonly cache = new Map<string, { value: any; expiresAt: number }>();

  constructor(
    private readonly logger: Logger
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  async set<T>(key: string, value: T, ttl: number = 300): Promise<void> {
    const expiresAt = Date.now() + (ttl * 1000);
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    const item = this.cache.get(key);
    return item ? Date.now() <= item.expiresAt : false;
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  // 定期清理过期项
  @Cron('*/5 * * * *') // 每5分钟执行一次
  async cleanupExpiredItems(): Promise<void> {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.cache.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.logger.log(`Cleaned up ${expiredKeys.length} expired cache items`);
    }
  }
}
```

## 配置管理

### 配置服务

```typescript
// 配置服务
@Injectable()
export class ConfigurationService {
  private readonly configurations = new Map<string, any>();

  constructor(
    @InjectRepository(ConfigurationDocument)
    private readonly configRepository: EntityRepository<ConfigurationDocument>,
    private readonly cacheService: CacheService
  ) {}

  async get<T>(key: string, defaultValue?: T): Promise<T> {
    // 先从缓存获取
    const cachedValue = await this.cacheService.get<T>(`config:${key}`);
    if (cachedValue !== null) {
      return cachedValue;
    }

    // 从数据库获取
    const config = await this.configRepository.findOne({ key });
    if (config) {
      const value = config.value as T;
      // 缓存结果
      await this.cacheService.set(`config:${key}`, value, 300);
      return value;
    }

    return defaultValue;
  }

  async set<T>(key: string, value: T, scope: ConfigurationScope = ConfigurationScope.GLOBAL): Promise<void> {
    const config = await this.configRepository.findOne({ key });
    
    if (config) {
      config.value = value;
      config.updatedAt = new Date();
      await this.configRepository.persistAndFlush(config);
    } else {
      const newConfig = new ConfigurationDocument();
      newConfig.id = uuid.v4();
      newConfig.key = key;
      newConfig.value = value;
      newConfig.scope = scope;
      newConfig.isActive = true;
      newConfig.createdAt = new Date();
      newConfig.updatedAt = new Date();
      
      await this.configRepository.persistAndFlush(newConfig);
    }

    // 更新缓存
    await this.cacheService.set(`config:${key}`, value, 300);
  }

  async getByScope(
    scope: ConfigurationScope,
    tenantId?: string,
    organizationId?: string,
    departmentId?: string
  ): Promise<ConfigurationDocument[]> {
    const query: any = { scope, isActive: true };

    if (scope === ConfigurationScope.TENANT && tenantId) {
      query.tenantId = tenantId;
    } else if (scope === ConfigurationScope.ORGANIZATION && organizationId) {
      query.organizationId = organizationId;
    } else if (scope === ConfigurationScope.DEPARTMENT && departmentId) {
      query.departmentId = departmentId;
    }

    return this.configRepository.find(query);
  }
}
```

## 相关文档

- [应用层实现](./05-application-layer.md)
- [事件溯源设计](./07-event-sourcing.md)
- [多租户数据隔离](./09-multitenant.md)
- [部署与运维](./08-deployment.md)

---

**上一篇**：[应用层实现](./05-application-layer.md)  
**下一篇**：[部署与运维](./08-deployment.md)
