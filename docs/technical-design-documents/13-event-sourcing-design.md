# 事件溯源设计

## 概述

事件溯源（Event Sourcing）是本项目的核心架构模式之一，通过将状态变更记录为一系列不可变的事件来实现数据持久化。这种模式提供了完整的状态变更历史、审计能力、时间旅行功能和强大的调试能力。

## 事件溯源核心概念

### 1. 事件溯源基本原理

事件溯源的核心思想是：

- **状态变更通过事件记录**：所有业务状态变更都通过领域事件记录
- **事件是不可变的**：一旦创建，事件不能被修改或删除
- **状态通过事件重建**：当前状态通过重放所有相关事件来重建
- **事件是唯一真相来源**：事件存储是系统状态的唯一真相来源

### 2. 事件溯源架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   命令处理器     │───▶│   聚合根        │───▶│   事件存储      │
│  Command Handler│    │  Aggregate Root │    │  Event Store    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   领域事件      │    │   事件投射器    │
                       │  Domain Events  │    │  Event Projector│
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                                               ┌─────────────────┐
                                               │   读模型        │
                                               │  Read Models    │
                                               └─────────────────┘
```

## 事件存储设计

### 1. 事件存储接口

```typescript
// 事件存储接口
export interface IEventStore {
  // 保存事件
  saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number,
  ): Promise<void>;

  // 获取事件
  getEvents(
    aggregateId: string,
    fromVersion?: number,
    toVersion?: number,
  ): Promise<IDomainEvent[]>;

  // 获取所有事件
  getAllEvents(
    fromTimestamp?: Date,
    toTimestamp?: Date,
  ): Promise<IDomainEvent[]>;

  // 创建快照
  createSnapshot(
    aggregateId: string,
    aggregateState: any,
    version: number,
  ): Promise<void>;

  // 获取快照
  getSnapshot(aggregateId: string): Promise<ISnapshot | null>;
}

// 事件存储实现
@Injectable()
export class EventStore implements IEventStore {
  constructor(
    private readonly eventRepository: IEventRepository,
    private readonly snapshotRepository: ISnapshotRepository,
    private readonly eventSerializer: IEventSerializer,
  ) {}

  async saveEvents(
    aggregateId: string,
    events: IDomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    // 检查版本一致性
    const currentVersion = await this.getCurrentVersion(aggregateId);
    if (currentVersion !== expectedVersion) {
      throw new ConcurrencyError(
        `Expected version ${expectedVersion}, but current version is ${currentVersion}`,
      );
    }

    // 保存事件
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const eventVersion = expectedVersion + i + 1;

      const storedEvent = new StoredEvent({
        id: uuid.v4(),
        aggregateId,
        eventType: event.eventType,
        eventData: this.eventSerializer.serialize(event),
        eventVersion,
        occurredOn: event.occurredOn,
        metadata: event.metadata || {},
      });

      await this.eventRepository.save(storedEvent);
    }
  }

  async getEvents(
    aggregateId: string,
    fromVersion: number = 0,
    toVersion?: number,
  ): Promise<IDomainEvent[]> {
    const storedEvents = await this.eventRepository.findByAggregateId(
      aggregateId,
      fromVersion,
      toVersion,
    );

    return storedEvents.map(storedEvent =>
      this.eventSerializer.deserialize(storedEvent.eventData),
    );
  }

  async getAllEvents(
    fromTimestamp?: Date,
    toTimestamp?: Date,
  ): Promise<IDomainEvent[]> {
    const storedEvents = await this.eventRepository.findByTimestamp(
      fromTimestamp,
      toTimestamp,
    );

    return storedEvents.map(storedEvent =>
      this.eventSerializer.deserialize(storedEvent.eventData),
    );
  }

  async createSnapshot(
    aggregateId: string,
    aggregateState: any,
    version: number,
  ): Promise<void> {
    const snapshot = new Snapshot({
      id: uuid.v4(),
      aggregateId,
      aggregateType: aggregateState.constructor.name,
      aggregateState: this.eventSerializer.serialize(aggregateState),
      version,
      createdAt: new Date(),
    });

    await this.snapshotRepository.save(snapshot);
  }

  async getSnapshot(aggregateId: string): Promise<ISnapshot | null> {
    return this.snapshotRepository.findLatestByAggregateId(aggregateId);
  }

  private async getCurrentVersion(aggregateId: string): Promise<number> {
    const latestEvent =
      await this.eventRepository.findLatestByAggregateId(aggregateId);
    return latestEvent ? latestEvent.eventVersion : 0;
  }
}
```

### 2. 事件存储实体

```typescript
// 存储的事件实体
@Entity('stored_events')
export class StoredEvent {
  @PrimaryKey()
  id!: string;

  @Property()
  aggregateId!: string;

  @Property()
  eventType!: string;

  @Property({ type: 'json' })
  eventData!: any;

  @Property()
  eventVersion!: number;

  @Property()
  occurredOn!: Date;

  @Property({ type: 'json' })
  metadata!: Record<string, any>;

  @Property()
  createdAt!: Date;

  constructor(data: Partial<StoredEvent>) {
    Object.assign(this, data);
    this.createdAt = new Date();
  }
}

// 快照实体
@Entity('snapshots')
export class Snapshot {
  @PrimaryKey()
  id!: string;

  @Property()
  aggregateId!: string;

  @Property()
  aggregateType!: string;

  @Property({ type: 'json' })
  aggregateState!: any;

  @Property()
  version!: number;

  @Property()
  createdAt!: Date;

  constructor(data: Partial<Snapshot>) {
    Object.assign(this, data);
  }
}
```

## 事件溯源聚合根

### 1. 事件溯源聚合根基类

```typescript
// 事件溯源聚合根基类
export abstract class EventSourcedAggregateRoot {
  private _id: string;
  private _version: number = 0;
  private _uncommittedEvents: IDomainEvent[] = [];

  get id(): string {
    return this._id;
  }

  get version(): number {
    return this._version;
  }

  get uncommittedEvents(): IDomainEvent[] {
    return [...this._uncommittedEvents];
  }

  protected constructor(id?: string) {
    this._id = id || uuid.v4();
  }

  // 应用事件（用于事件重放）
  protected applyEvent(
    event: IDomainEvent,
    isFromHistory: boolean = false,
  ): void {
    this.handleEvent(event, isFromHistory);

    if (!isFromHistory) {
      this._uncommittedEvents.push(event);
    }

    this._version++;
  }

  // 从历史事件重建聚合根
  static fromHistory<T extends EventSourcedAggregateRoot>(
    this: new () => T,
    events: IDomainEvent[],
  ): T {
    const aggregate = new this();

    for (const event of events) {
      aggregate.applyEvent(event, true);
    }

    return aggregate;
  }

  // 从快照和事件重建聚合根
  static fromSnapshot<T extends EventSourcedAggregateRoot>(
    this: new () => T,
    snapshot: ISnapshot,
    events: IDomainEvent[],
  ): T {
    const aggregate = new this();

    // 从快照恢复状态
    aggregate.restoreFromSnapshot(snapshot);

    // 应用快照后的事件
    for (const event of events) {
      aggregate.applyEvent(event, true);
    }

    return aggregate;
  }

  // 清除未提交的事件
  markEventsAsCommitted(): void {
    this._uncommittedEvents = [];
  }

  // 获取当前状态快照
  getSnapshot(): any {
    return this.createSnapshot();
  }

  // 子类需要实现的方法
  protected abstract handleEvent(
    event: IDomainEvent,
    isFromHistory: boolean,
  ): void;
  protected abstract createSnapshot(): any;
  protected abstract restoreFromSnapshot(snapshot: ISnapshot): void;
}
```

### 2. 用户聚合根示例

```typescript
// 用户聚合根
export class UserAggregate extends EventSourcedAggregateRoot {
  private _email: string;
  private _profile: UserProfile;
  private _status: UserStatus;
  private _tenantId?: string;
  private _organizationId?: string;
  private _departmentId?: string;
  private _roles: UserRole[] = [];

  public static create(email: string, profile: UserProfile): UserAggregate {
    const user = new UserAggregate();
    const event = new UserCreatedEvent(user.id, email, profile, new Date());

    user.applyEvent(event);
    return user;
  }

  public assignToTenant(tenantId: string): void {
    if (this._tenantId) {
      throw new UserAlreadyAssignedToTenantError(this.id, this._tenantId);
    }

    const event = new UserAssignedToTenantEvent(this.id, tenantId, new Date());

    this.applyEvent(event);
  }

  public assignToOrganization(organizationId: string): void {
    if (!this._tenantId) {
      throw new UserNotAssignedToTenantError(this.id);
    }

    const event = new UserAssignedToOrganizationEvent(
      this.id,
      organizationId,
      new Date(),
    );

    this.applyEvent(event);
  }

  public updateProfile(profile: UserProfile): void {
    const event = new UserProfileUpdatedEvent(this.id, profile, new Date());

    this.applyEvent(event);
  }

  public addRole(role: UserRole): void {
    if (this._roles.some(r => r.id === role.id)) {
      throw new RoleAlreadyAssignedError(this.id, role.id);
    }

    const event = new UserRoleAddedEvent(this.id, role, new Date());

    this.applyEvent(event);
  }

  public activate(): void {
    if (this._status === UserStatus.ACTIVE) {
      throw new UserAlreadyActiveError(this.id);
    }

    const event = new UserActivatedEvent(this.id, new Date());

    this.applyEvent(event);
  }

  public deactivate(): void {
    if (this._status === UserStatus.INACTIVE) {
      throw new UserAlreadyInactiveError(this.id);
    }

    const event = new UserDeactivatedEvent(this.id, new Date());

    this.applyEvent(event);
  }

  // Getters
  get email(): string {
    return this._email;
  }

  get profile(): UserProfile {
    return this._profile;
  }

  get status(): UserStatus {
    return this._status;
  }

  get tenantId(): string | undefined {
    return this._tenantId;
  }

  get organizationId(): string | undefined {
    return this._organizationId;
  }

  get departmentId(): string | undefined {
    return this._departmentId;
  }

  get roles(): UserRole[] {
    return [...this._roles];
  }

  // 事件处理器
  protected handleEvent(event: IDomainEvent, isFromHistory: boolean): void {
    if (event instanceof UserCreatedEvent) {
      this.whenUserCreated(event);
    } else if (event instanceof UserAssignedToTenantEvent) {
      this.whenAssignedToTenant(event);
    } else if (event instanceof UserAssignedToOrganizationEvent) {
      this.whenAssignedToOrganization(event);
    } else if (event instanceof UserProfileUpdatedEvent) {
      this.whenProfileUpdated(event);
    } else if (event instanceof UserRoleAddedEvent) {
      this.whenRoleAdded(event);
    } else if (event instanceof UserActivatedEvent) {
      this.whenActivated(event);
    } else if (event instanceof UserDeactivatedEvent) {
      this.whenDeactivated(event);
    }
  }

  private whenUserCreated(event: UserCreatedEvent): void {
    this._email = event.email;
    this._profile = event.profile;
    this._status = UserStatus.PENDING;
  }

  private whenAssignedToTenant(event: UserAssignedToTenantEvent): void {
    this._tenantId = event.tenantId;
  }

  private whenAssignedToOrganization(
    event: UserAssignedToOrganizationEvent,
  ): void {
    this._organizationId = event.organizationId;
  }

  private whenProfileUpdated(event: UserProfileUpdatedEvent): void {
    this._profile = event.profile;
  }

  private whenRoleAdded(event: UserRoleAddedEvent): void {
    this._roles.push(event.role);
  }

  private whenActivated(event: UserActivatedEvent): void {
    this._status = UserStatus.ACTIVE;
  }

  private whenDeactivated(event: UserDeactivatedEvent): void {
    this._status = UserStatus.INACTIVE;
  }

  // 快照相关方法
  protected createSnapshot(): any {
    return {
      id: this._id,
      email: this._email,
      profile: this._profile,
      status: this._status,
      tenantId: this._tenantId,
      organizationId: this._organizationId,
      departmentId: this._departmentId,
      roles: this._roles,
      version: this._version,
    };
  }

  protected restoreFromSnapshot(snapshot: ISnapshot): void {
    const state = snapshot.aggregateState;
    this._id = state.id;
    this._email = state.email;
    this._profile = state.profile;
    this._status = state.status;
    this._tenantId = state.tenantId;
    this._organizationId = state.organizationId;
    this._departmentId = state.departmentId;
    this._roles = state.roles;
    this._version = state.version;
  }
}
```

## 事件投射器设计

### 1. 事件投射器接口

```typescript
// 事件投射器接口
export interface IEventProjector {
  handle(event: IDomainEvent): Promise<void>;
  getProjectionName(): string;
  getLastProcessedEventId(): Promise<string | null>;
  setLastProcessedEventId(eventId: string): Promise<void>;
}

// 事件投射器基类
export abstract class EventProjector implements IEventProjector {
  constructor(
    protected readonly projectionStateRepository: IProjectionStateRepository,
  ) {}

  abstract handle(event: IDomainEvent): Promise<void>;
  abstract getProjectionName(): string;

  async getLastProcessedEventId(): Promise<string | null> {
    const state = await this.projectionStateRepository.findByProjectionName(
      this.getProjectionName(),
    );
    return state?.lastProcessedEventId || null;
  }

  async setLastProcessedEventId(eventId: string): Promise<void> {
    await this.projectionStateRepository.save({
      projectionName: this.getProjectionName(),
      lastProcessedEventId: eventId,
      lastProcessedAt: new Date(),
    });
  }
}
```

### 2. 用户读模型投射器

```typescript
// 用户读模型投射器
@Injectable()
export class UserReadModelProjector extends EventProjector {
  constructor(
    projectionStateRepository: IProjectionStateRepository,
    private readonly userReadRepository: IUserReadRepository,
  ) {
    super(projectionStateRepository);
  }

  getProjectionName(): string {
    return 'UserReadModel';
  }

  async handle(event: IDomainEvent): Promise<void> {
    switch (event.eventType) {
      case 'UserCreated':
        await this.handleUserCreated(event as UserCreatedEvent);
        break;
      case 'UserAssignedToTenant':
        await this.handleUserAssignedToTenant(
          event as UserAssignedToTenantEvent,
        );
        break;
      case 'UserAssignedToOrganization':
        await this.handleUserAssignedToOrganization(
          event as UserAssignedToOrganizationEvent,
        );
        break;
      case 'UserProfileUpdated':
        await this.handleUserProfileUpdated(event as UserProfileUpdatedEvent);
        break;
      case 'UserRoleAdded':
        await this.handleUserRoleAdded(event as UserRoleAddedEvent);
        break;
      case 'UserActivated':
        await this.handleUserActivated(event as UserActivatedEvent);
        break;
      case 'UserDeactivated':
        await this.handleUserDeactivated(event as UserDeactivatedEvent);
        break;
    }
  }

  private async handleUserCreated(event: UserCreatedEvent): Promise<void> {
    const userReadModel = new UserReadModel({
      id: event.aggregateId,
      email: event.email,
      profile: event.profile,
      status: UserStatus.PENDING,
      tenantId: null,
      organizationId: null,
      departmentId: null,
      roles: [],
      createdAt: event.occurredOn,
      updatedAt: event.occurredOn,
    });

    await this.userReadRepository.save(userReadModel);
  }

  private async handleUserAssignedToTenant(
    event: UserAssignedToTenantEvent,
  ): Promise<void> {
    await this.userReadRepository.update(event.aggregateId, {
      tenantId: event.tenantId,
      updatedAt: event.occurredOn,
    });
  }

  private async handleUserAssignedToOrganization(
    event: UserAssignedToOrganizationEvent,
  ): Promise<void> {
    await this.userReadRepository.update(event.aggregateId, {
      organizationId: event.organizationId,
      updatedAt: event.occurredOn,
    });
  }

  private async handleUserProfileUpdated(
    event: UserProfileUpdatedEvent,
  ): Promise<void> {
    await this.userReadRepository.update(event.aggregateId, {
      profile: event.profile,
      updatedAt: event.occurredOn,
    });
  }

  private async handleUserRoleAdded(event: UserRoleAddedEvent): Promise<void> {
    const user = await this.userReadRepository.findById(event.aggregateId);
    if (user) {
      user.roles.push(event.role);
      await this.userReadRepository.save(user);
    }
  }

  private async handleUserActivated(event: UserActivatedEvent): Promise<void> {
    await this.userReadRepository.update(event.aggregateId, {
      status: UserStatus.ACTIVE,
      updatedAt: event.occurredOn,
    });
  }

  private async handleUserDeactivated(
    event: UserDeactivatedEvent,
  ): Promise<void> {
    await this.userReadRepository.update(event.aggregateId, {
      status: UserStatus.INACTIVE,
      updatedAt: event.occurredOn,
    });
  }
}
```

## 事件重放和重建

### 1. 聚合根重建器

```typescript
// 聚合根重建器
@Injectable()
export class AggregateRebuilder {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly eventSerializer: IEventSerializer,
  ) {}

  // 重建聚合根
  async rebuildAggregate<T extends EventSourcedAggregateRoot>(
    aggregateClass: new () => T,
    aggregateId: string,
    toVersion?: number,
  ): Promise<T> {
    // 检查是否有快照
    const snapshot = await this.eventStore.getSnapshot(aggregateId);

    if (snapshot && (!toVersion || snapshot.version < toVersion)) {
      // 从快照开始重建
      const events = await this.eventStore.getEvents(
        aggregateId,
        snapshot.version + 1,
        toVersion,
      );

      return aggregateClass.fromSnapshot(snapshot, events);
    } else {
      // 从头开始重建
      const events = await this.eventStore.getEvents(aggregateId, 0, toVersion);
      return aggregateClass.fromHistory(events);
    }
  }

  // 重建所有聚合根
  async rebuildAllAggregates<T extends EventSourcedAggregateRoot>(
    aggregateClass: new () => T,
    fromTimestamp?: Date,
    toTimestamp?: Date,
  ): Promise<T[]> {
    const events = await this.eventStore.getAllEvents(
      fromTimestamp,
      toTimestamp,
    );
    const aggregates = new Map<string, T>();

    for (const event of events) {
      let aggregate = aggregates.get(event.aggregateId);

      if (!aggregate) {
        // 重建聚合根
        aggregate = await this.rebuildAggregate(
          aggregateClass,
          event.aggregateId,
        );
        aggregates.set(event.aggregateId, aggregate);
      }
    }

    return Array.from(aggregates.values());
  }
}
```

### 2. 投影重建器

```typescript
// 投影重建器
@Injectable()
export class ProjectionRebuilder {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly eventProjector: IEventProjector,
  ) {}

  // 重建投影
  async rebuildProjection(
    fromTimestamp?: Date,
    toTimestamp?: Date,
  ): Promise<void> {
    const projectionName = this.eventProjector.getProjectionName();

    // 清除现有投影状态
    await this.clearProjectionState(projectionName);

    // 获取所有事件
    const events = await this.eventStore.getAllEvents(
      fromTimestamp,
      toTimestamp,
    );

    // 按时间顺序处理事件
    const sortedEvents = events.sort(
      (a, b) => a.occurredOn.getTime() - b.occurredOn.getTime(),
    );

    for (const event of sortedEvents) {
      try {
        await this.eventProjector.handle(event);
        await this.eventProjector.setLastProcessedEventId(event.id);
      } catch (error) {
        console.error(`Failed to process event ${event.id}:`, error);
        throw error;
      }
    }
  }

  // 增量重建投影
  async rebuildProjectionIncremental(): Promise<void> {
    const lastProcessedEventId =
      await this.eventProjector.getLastProcessedEventId();

    if (!lastProcessedEventId) {
      // 如果没有处理过任何事件，进行完整重建
      await this.rebuildProjection();
      return;
    }

    // 获取自上次处理以来的所有事件
    const events = await this.eventStore.getEventsAfter(lastProcessedEventId);

    for (const event of events) {
      try {
        await this.eventProjector.handle(event);
        await this.eventProjector.setLastProcessedEventId(event.id);
      } catch (error) {
        console.error(`Failed to process event ${event.id}:`, error);
        throw error;
      }
    }
  }

  private async clearProjectionState(projectionName: string): Promise<void> {
    // 清除投影状态，具体实现取决于存储方式
    // 这里需要根据实际的投影存储方式来实现
  }
}
```

## 事件序列化

### 1. 事件序列化器

```typescript
// 事件序列化器接口
export interface IEventSerializer {
  serialize(event: IDomainEvent): any;
  deserialize(eventData: any): IDomainEvent;
}

// JSON事件序列化器
@Injectable()
export class JsonEventSerializer implements IEventSerializer {
  private readonly eventTypeMap: Map<
    string,
    new (...args: any[]) => IDomainEvent
  >;

  constructor() {
    this.eventTypeMap = new Map();
    this.registerEventTypes();
  }

  serialize(event: IDomainEvent): any {
    return {
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      occurredOn: event.occurredOn,
      eventVersion: event.eventVersion,
      metadata: event.metadata,
      data: this.serializeEventData(event),
    };
  }

  deserialize(eventData: any): IDomainEvent {
    const EventClass = this.eventTypeMap.get(eventData.eventType);

    if (!EventClass) {
      throw new UnknownEventTypeError(eventData.eventType);
    }

    const event = new EventClass();
    event.aggregateId = eventData.aggregateId;
    event.occurredOn = eventData.occurredOn;
    event.eventVersion = eventData.eventVersion;
    event.metadata = eventData.metadata;

    this.deserializeEventData(event, eventData.data);

    return event;
  }

  private serializeEventData(event: IDomainEvent): any {
    // 使用反射或手动序列化事件数据
    const data: any = {};

    for (const key in event) {
      if (
        key !== 'eventType' &&
        key !== 'aggregateId' &&
        key !== 'occurredOn' &&
        key !== 'eventVersion' &&
        key !== 'metadata'
      ) {
        data[key] = (event as any)[key];
      }
    }

    return data;
  }

  private deserializeEventData(event: IDomainEvent, data: any): void {
    for (const key in data) {
      (event as any)[key] = data[key];
    }
  }

  private registerEventTypes(): void {
    // 注册所有事件类型
    this.eventTypeMap.set('UserCreated', UserCreatedEvent);
    this.eventTypeMap.set('UserAssignedToTenant', UserAssignedToTenantEvent);
    this.eventTypeMap.set(
      'UserAssignedToOrganization',
      UserAssignedToOrganizationEvent,
    );
    this.eventTypeMap.set('UserProfileUpdated', UserProfileUpdatedEvent);
    this.eventTypeMap.set('UserRoleAdded', UserRoleAddedEvent);
    this.eventTypeMap.set('UserActivated', UserActivatedEvent);
    this.eventTypeMap.set('UserDeactivated', UserDeactivatedEvent);
    // 添加更多事件类型...
  }
}
```

## 快照策略

### 1. 快照策略接口

```typescript
// 快照策略接口
export interface ISnapshotStrategy {
  shouldCreateSnapshot(aggregate: EventSourcedAggregateRoot): boolean;
  getSnapshotInterval(): number;
}

// 基于事件数量的快照策略
export class EventCountSnapshotStrategy implements ISnapshotStrategy {
  constructor(private readonly eventCountThreshold: number = 100) {}

  shouldCreateSnapshot(aggregate: EventSourcedAggregateRoot): boolean {
    return aggregate.version % this.eventCountThreshold === 0;
  }

  getSnapshotInterval(): number {
    return this.eventCountThreshold;
  }
}

// 基于时间的快照策略
export class TimeBasedSnapshotStrategy implements ISnapshotStrategy {
  constructor(private readonly timeThreshold: number = 24 * 60 * 60 * 1000) {} // 24小时

  shouldCreateSnapshot(aggregate: EventSourcedAggregateRoot): boolean {
    // 这里需要跟踪上次快照时间，简化实现
    return true; // 实际实现需要更复杂的逻辑
  }

  getSnapshotInterval(): number {
    return this.timeThreshold;
  }
}
```

### 2. 快照管理器

```typescript
// 快照管理器
@Injectable()
export class SnapshotManager {
  constructor(
    private readonly eventStore: IEventStore,
    private readonly snapshotStrategy: ISnapshotStrategy,
  ) {}

  // 检查并创建快照
  async checkAndCreateSnapshot(
    aggregate: EventSourcedAggregateRoot,
  ): Promise<void> {
    if (this.snapshotStrategy.shouldCreateSnapshot(aggregate)) {
      const snapshot = aggregate.getSnapshot();
      await this.eventStore.createSnapshot(
        aggregate.id,
        snapshot,
        aggregate.version,
      );
    }
  }

  // 清理旧快照
  async cleanupOldSnapshots(
    aggregateId: string,
    keepCount: number = 5,
  ): Promise<void> {
    // 实现快照清理逻辑
    // 保留最新的几个快照，删除旧的
  }
}
```

## 事件溯源仓储

### 1. 事件溯源仓储接口

```typescript
// 事件溯源仓储接口
export interface IEventSourcedRepository<T extends EventSourcedAggregateRoot> {
  save(aggregate: T): Promise<void>;
  findById(id: string): Promise<T | null>;
  findByIdAndVersion(id: string, version: number): Promise<T | null>;
}

// 事件溯源仓储实现
@Injectable()
export class EventSourcedRepository<T extends EventSourcedAggregateRoot>
  implements IEventSourcedRepository<T>
{
  constructor(
    private readonly eventStore: IEventStore,
    private readonly aggregateClass: new () => T,
    private readonly snapshotManager: SnapshotManager,
  ) {}

  async save(aggregate: T): Promise<void> {
    const uncommittedEvents = aggregate.uncommittedEvents;

    if (uncommittedEvents.length === 0) {
      return; // 没有未提交的事件
    }

    // 保存事件
    await this.eventStore.saveEvents(
      aggregate.id,
      uncommittedEvents,
      aggregate.version - uncommittedEvents.length,
    );

    // 检查并创建快照
    await this.snapshotManager.checkAndCreateSnapshot(aggregate);

    // 标记事件为已提交
    aggregate.markEventsAsCommitted();
  }

  async findById(id: string): Promise<T | null> {
    try {
      return await this.eventStore.rebuildAggregate(this.aggregateClass, id);
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return null;
      }
      throw error;
    }
  }

  async findByIdAndVersion(id: string, version: number): Promise<T | null> {
    try {
      return await this.eventStore.rebuildAggregate(
        this.aggregateClass,
        id,
        version,
      );
    } catch (error) {
      if (error instanceof AggregateNotFoundError) {
        return null;
      }
      throw error;
    }
  }
}
```

## 事件溯源命令处理器

### 1. 事件溯源命令处理器基类

```typescript
// 事件溯源命令处理器基类
export abstract class EventSourcedCommandHandler<
  TCommand,
  TAggregate extends EventSourcedAggregateRoot,
> {
  constructor(
    protected readonly repository: IEventSourcedRepository<TAggregate>,
    protected readonly eventBus: IEventBus,
  ) {}

  abstract handle(command: TCommand): Promise<void>;

  protected async loadAggregate(id: string): Promise<TAggregate> {
    const aggregate = await this.repository.findById(id);

    if (!aggregate) {
      throw new AggregateNotFoundError(id);
    }

    return aggregate;
  }

  protected async saveAggregate(aggregate: TAggregate): Promise<void> {
    await this.repository.save(aggregate);

    // 发布未提交的事件
    for (const event of aggregate.uncommittedEvents) {
      await this.eventBus.publish(event);
    }
  }
}
```

### 2. 用户命令处理器示例

```typescript
// 用户命令处理器
@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler extends EventSourcedCommandHandler<
  CreateUserCommand,
  UserAggregate
> {
  constructor(
    repository: IEventSourcedRepository<UserAggregate>,
    eventBus: IEventBus,
  ) {
    super(repository, eventBus);
  }

  async handle(command: CreateUserCommand): Promise<void> {
    // 创建用户聚合根
    const user = UserAggregate.create(command.email, command.profile);

    // 保存聚合根
    await this.saveAggregate(user);
  }
}

@CommandHandler(AssignUserToTenantCommand)
export class AssignUserToTenantCommandHandler extends EventSourcedCommandHandler<
  AssignUserToTenantCommand,
  UserAggregate
> {
  constructor(
    repository: IEventSourcedRepository<UserAggregate>,
    eventBus: IEventBus,
  ) {
    super(repository, eventBus);
  }

  async handle(command: AssignUserToTenantCommand): Promise<void> {
    // 加载用户聚合根
    const user = await this.loadAggregate(command.userId);

    // 执行业务操作
    user.assignToTenant(command.tenantId);

    // 保存聚合根
    await this.saveAggregate(user);
  }
}
```

## 性能优化

### 1. 事件存储优化

```typescript
// 事件存储优化配置
export class EventStoreOptimization {
  // 批量保存事件
  static async batchSaveEvents(
    eventStore: IEventStore,
    events: Array<{
      aggregateId: string;
      events: IDomainEvent[];
      expectedVersion: number;
    }>,
  ): Promise<void> {
    // 按聚合根ID分组
    const groupedEvents = new Map<
      string,
      Array<{ events: IDomainEvent[]; expectedVersion: number }>
    >();

    for (const item of events) {
      if (!groupedEvents.has(item.aggregateId)) {
        groupedEvents.set(item.aggregateId, []);
      }
      groupedEvents.get(item.aggregateId)!.push({
        events: item.events,
        expectedVersion: item.expectedVersion,
      });
    }

    // 并行保存
    const promises = Array.from(groupedEvents.entries()).map(
      async ([aggregateId, eventGroups]) => {
        for (const group of eventGroups) {
          await eventStore.saveEvents(
            aggregateId,
            group.events,
            group.expectedVersion,
          );
        }
      },
    );

    await Promise.all(promises);
  }

  // 事件压缩
  static compressEvents(events: IDomainEvent[]): IDomainEvent[] {
    // 实现事件压缩逻辑，例如合并相同类型的事件
    return events;
  }
}
```

### 2. 投影优化

```typescript
// 投影优化配置
export class ProjectionOptimization {
  // 批量处理事件
  static async batchProcessEvents(
    projector: IEventProjector,
    events: IDomainEvent[],
  ): Promise<void> {
    // 按事件类型分组
    const groupedEvents = new Map<string, IDomainEvent[]>();

    for (const event of events) {
      if (!groupedEvents.has(event.eventType)) {
        groupedEvents.set(event.eventType, []);
      }
      groupedEvents.get(event.eventType)!.push(event);
    }

    // 批量处理相同类型的事件
    for (const [eventType, eventGroup] of groupedEvents) {
      await projector.handleBatch(eventGroup);
    }
  }

  // 投影缓存
  static createProjectionCache<T>(
    cacheService: ICacheService,
    ttl: number = 300,
  ): (key: string, factory: () => Promise<T>) => Promise<T> {
    return async (key: string, factory: () => Promise<T>): Promise<T> => {
      const cached = await cacheService.get<T>(key);

      if (cached !== null) {
        return cached;
      }

      const result = await factory();
      await cacheService.set(key, result, ttl);

      return result;
    };
  }
}
```

## 总结

事件溯源设计为项目提供了强大的状态管理能力：

### 核心特性

1. **完整的状态历史**: 所有状态变更都通过事件记录
2. **时间旅行**: 可以重建任意时间点的状态
3. **审计能力**: 完整的事件日志提供审计功能
4. **调试能力**: 通过事件重放进行问题调试
5. **最终一致性**: 通过事件投射实现读模型更新

### 技术实现

- **事件存储**: 基于MongoDB的事件存储实现
- **聚合根**: 事件溯源聚合根基类和具体实现
- **事件投射器**: 将事件投射到读模型
- **快照策略**: 优化聚合根重建性能
- **序列化**: 事件序列化和反序列化

### 优势

- ✅ **数据完整性**: 事件是不可变的，确保数据完整性
- ✅ **可追溯性**: 完整的状态变更历史
- ✅ **可扩展性**: 支持复杂的业务逻辑和查询需求
- ✅ **性能优化**: 通过快照和批量处理优化性能
- ✅ **调试友好**: 通过事件重放进行问题定位

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
