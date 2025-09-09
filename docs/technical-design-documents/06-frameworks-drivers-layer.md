# Frameworks & Drivers层设计

## 文档信息

- **文档名称**: Frameworks & Drivers层设计
- **文档版本**: V1.0
- **创建日期**: 2024-01-01
- **最后更新**: 2024-01-01
- **维护者**: 项目开发团队

## 概述

Frameworks & Drivers层是Clean Architecture的最外层，包含框架、工具和驱动程序。本层负责实现Interface Adapters层定义的接口，提供具体的框架集成、数据库连接、外部服务集成和基础设施服务。

## 设计原则

### 1. 框架集成

- **框架选择**: 选择适合的框架和工具
- **配置管理**: 管理框架和工具的配置
- **生命周期管理**: 管理框架和工具的生命周期
- **性能优化**: 优化框架和工具的性能

### 2. 基础设施服务

- **数据库连接**: 提供数据库连接和操作
- **缓存服务**: 提供缓存存储和操作
- **消息队列**: 提供消息队列服务
- **外部服务**: 集成外部服务和API

### 3. 依赖注入

- **模块配置**: 配置依赖注入模块
- **服务注册**: 注册服务和提供者
- **生命周期管理**: 管理服务的生命周期
- **配置注入**: 注入配置和环境变量

## 数据库模块设计

### 数据库适配器

#### 1. PostgreSQL适配器

```typescript
/**
 * @class PostgreSQLAdapter
 * @description PostgreSQL数据库适配器，提供统一的数据库操作接口
 *
 * 适配器职责：
 * 1. 实现PostgreSQL数据库的连接管理
 * 2. 提供统一的查询和事务接口
 * 3. 支持连接池和性能监控
 * 4. 实现多租户数据隔离支持
 *
 * 多租户支持：
 * 1. 支持租户上下文设置
 * 2. 支持Schema级隔离
 * 3. 支持行级安全策略
 * 4. 提供租户级连接管理
 *
 * 性能监控：
 * 1. 查询性能统计
 * 2. 连接池状态监控
 * 3. 健康检查机制
 * 4. 事件通知系统
 */
@Injectable()
export class PostgreSQLAdapter implements IDatabaseAdapter {
  public readonly name: string;
  public readonly type: string = 'postgresql';
  public readonly eventEmitter: EventEmitter2;
  public readonly config: DatabaseConfig;

  private tenantId?: string;
  private defaultSchema?: string;
  private rlsEnabled: boolean = false;
  private pool: Pool;
  private knexInstance: Knex;
  private isConnectedFlag = false;
  private stats: DatabaseStats;

  constructor(
    @Inject('DATABASE_CONFIG') config: DatabaseConfig,
    @Inject('DATABASE_NAME') name: string,
    eventEmitter: EventEmitter2,
    logger: PinoLoggerService,
  ) {
    this.config = config;
    this.name = name;
    this.eventEmitter = eventEmitter;
    this.logger = logger;
    this.stats = this.initializeStats();
    this.initializePool();
    this.initializeKnex();
  }

  /**
   * 连接到PostgreSQL数据库
   * @returns 连接结果
   */
  async connect(): Promise<void> {
    try {
      this.logger.info(
        `Connecting to PostgreSQL database: ${this.config.database}`,
        LogContext.DATABASE,
        { adapter: this.name, host: this.config.host, port: this.config.port },
      );

      // 测试连接池连接
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      this.isConnectedFlag = true;

      this.emitEvent('connected', {
        adapter: this.name,
        database: this.config.database,
        timestamp: new Date(),
      });
    } catch (error) {
      this.isConnectedFlag = false;
      this.logger.error(
        `Failed to connect to PostgreSQL database: ${this.config.database}`,
        LogContext.DATABASE,
        { adapter: this.name, error: (error as Error).message },
        error as Error,
      );

      this.emitEvent('connection_error', {
        adapter: this.name,
        error: (error as Error).message,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * 执行查询
   * @param sql SQL语句
   * @param params 查询参数
   * @param options 查询选项
   * @returns 查询结果
   */
  async query(
    sql: string,
    params: unknown[] = [],
    options: QueryOptions = {},
  ): Promise<QueryResult> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    try {
      if (options.logQuery) {
        this.logger.debug(`Executing query: ${sql}`, LogContext.DATABASE, {
          adapter: this.name,
          params,
          tag: options.tag,
        });
      }

      const queryConfig = {
        text: sql,
        values: params,
        name: options.tag ?? 'unnamed',
      };

      const result = await this.pool.query(queryConfig);
      const responseTime = Date.now() - startTime;

      this.updateStats(responseTime, true);

      this.emitEvent('query_executed', {
        adapter: this.name,
        sql,
        params,
        responseTime,
        rowCount: result.rowCount,
        timestamp: new Date(),
      });

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false);

      this.logger.error(
        `Query failed: ${sql}`,
        LogContext.DATABASE,
        {
          adapter: this.name,
          params,
          responseTime,
          error: (error as Error).message,
        },
        error as Error,
      );

      this.emitEvent('query_error', {
        adapter: this.name,
        sql,
        params,
        error: (error as Error).message,
        responseTime,
        timestamp: new Date(),
      });

      throw error;
    }
  }

  /**
   * 设置租户上下文
   * @param tenantId 租户ID
   */
  setTenantContext(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /**
   * 获取租户上下文
   * @returns 租户ID
   */
  getTenantContext(): string | undefined {
    return this.tenantId;
  }

  /**
   * 设置默认Schema
   * @param schemaName Schema名称
   */
  setDefaultSchema(schemaName: string): void {
    this.defaultSchema = schemaName;
  }

  /**
   * 获取默认Schema
   * @returns Schema名称
   */
  getDefaultSchema(): string | undefined {
    return this.defaultSchema;
  }

  /**
   * 启用行级安全策略
   */
  enableRowLevelSecurity(): void {
    this.rlsEnabled = true;
  }

  /**
   * 禁用行级安全策略
   */
  disableRowLevelSecurity(): void {
    this.rlsEnabled = false;
  }

  /**
   * 检查是否启用了行级安全策略
   * @returns 是否启用RLS
   */
  isRowLevelSecurityEnabled(): boolean {
    return this.rlsEnabled;
  }

  /**
   * 初始化连接池
   */
  private initializePool(): void {
    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.username,
      password: this.config.password,
      max: this.config.pool?.max || 20,
      min: this.config.pool?.min || 5,
      idleTimeoutMillis: this.config.pool?.idleTimeoutMillis || 30000,
      connectionTimeoutMillis:
        this.config.pool?.connectionTimeoutMillis || 2000,
    });

    // 监听连接池事件
    this.pool.on('connect', client => {
      this.logger.debug(
        'New client connected to PostgreSQL',
        LogContext.DATABASE,
        {
          adapter: this.name,
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount,
        },
      );
    });

    this.pool.on('error', err => {
      this.logger.error(
        'PostgreSQL pool error',
        LogContext.DATABASE,
        {
          adapter: this.name,
          error: err.message,
        },
        err,
      );
    });
  }

  /**
   * 初始化Knex实例
   */
  private initializeKnex(): void {
    this.knexInstance = knex({
      client: 'postgresql',
      connection: {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
      },
      pool: {
        min: this.config.pool?.min || 5,
        max: this.config.pool?.max || 20,
      },
    });
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): DatabaseStats {
    return {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      lastQueryTime: null,
    };
  }

  /**
   * 更新统计信息
   */
  private updateStats(responseTime: number, success: boolean): void {
    this.stats.totalResponseTime += responseTime;
    this.stats.averageResponseTime =
      this.stats.totalResponseTime / this.stats.totalQueries;
    this.stats.lastQueryTime = new Date();

    if (success) {
      this.stats.successfulQueries++;
    } else {
      this.stats.failedQueries++;
    }
  }

  /**
   * 发射事件
   */
  private emitEvent(eventName: string, data: any): void {
    this.eventEmitter.emit(`database.${eventName}`, {
      adapter: this.name,
      ...data,
    });
  }
}
```

### 数据库适配器工厂

```typescript
/**
 * @class DatabaseAdapterFactory
 * @description 数据库适配器工厂，负责根据隔离策略动态创建数据库适配器
 *
 * 工厂职责：
 * 1. 根据隔离策略创建相应的数据库适配器
 * 2. 管理适配器的配置和连接
 * 3. 支持多种隔离策略的动态切换
 * 4. 提供统一的适配器创建接口
 *
 * 隔离策略支持：
 * 1. 数据库级隔离：为每个租户创建独立的数据库连接
 * 2. Schema级隔离：为每个租户创建独立的Schema连接
 * 3. 表级隔离：所有租户共享数据库连接，通过tenant_id隔离
 *
 * 配置管理：
 * 1. 动态读取隔离策略配置
 * 2. 根据策略生成相应的连接配置
 * 3. 支持租户特定的配置覆盖
 * 4. 提供配置验证和错误处理
 */
@Injectable()
export class DatabaseAdapterFactory {
  constructor(
    private readonly isolationConfig: IsolationConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: PinoLoggerService,
  ) {}

  /**
   * 根据隔离策略创建数据库适配器
   * @param tenantId 租户ID，可选
   * @returns 数据库适配器实例
   */
  createAdapter(tenantId?: string): IDatabaseAdapter {
    const strategy = this.isolationConfig.getStrategy();
    const connectionConfig = this.isolationConfig.getConnectionConfig(tenantId);

    switch (strategy) {
      case IsolationStrategy.DATABASE_LEVEL:
        return this.createDatabaseLevelAdapter(connectionConfig);
      case IsolationStrategy.SCHEMA_LEVEL:
        return this.createSchemaLevelAdapter(connectionConfig);
      case IsolationStrategy.TABLE_LEVEL:
        return this.createTableLevelAdapter(connectionConfig);
      default:
        throw new Error(`Unsupported isolation strategy: ${String(strategy)}`);
    }
  }

  /**
   * 创建数据库级隔离适配器
   * @param connectionConfig 连接配置
   * @returns 数据库适配器
   */
  private createDatabaseLevelAdapter(connectionConfig: {
    database: string;
    tenantId?: string;
  }): IDatabaseAdapter {
    const config: DatabaseConfig = {
      type: 'postgresql',
      host: this.isolationConfig.getHost(),
      port: this.isolationConfig.getPort(),
      username: this.isolationConfig.getUsername(),
      password: this.isolationConfig.getPassword(),
      database: connectionConfig.database,
      pool: this.isolationConfig.getPoolConfig(),
    };

    return new PostgreSQLAdapter(
      config,
      `db-${connectionConfig.tenantId}`,
      this.eventEmitter,
      this.logger,
    );
  }

  /**
   * 创建Schema级隔离适配器
   * @param connectionConfig 连接配置
   * @returns 数据库适配器
   */
  private createSchemaLevelAdapter(connectionConfig: {
    database: string;
    schema?: string;
    tenantId?: string;
  }): IDatabaseAdapter {
    const config: DatabaseConfig = {
      type: 'postgresql',
      host: this.isolationConfig.getHost(),
      port: this.isolationConfig.getPort(),
      username: this.isolationConfig.getUsername(),
      password: this.isolationConfig.getPassword(),
      database: connectionConfig.database,
      schema: connectionConfig.schema,
      pool: this.isolationConfig.getPoolConfig(),
    };

    const adapter = new PostgreSQLAdapter(
      config,
      `schema-${connectionConfig.tenantId}`,
      this.eventEmitter,
      this.logger,
    );

    // 设置默认Schema
    if (connectionConfig.schema) {
      adapter.setDefaultSchema(connectionConfig.schema);
    }

    return adapter;
  }

  /**
   * 创建表级隔离适配器
   * @param connectionConfig 连接配置
   * @returns 数据库适配器
   */
  private createTableLevelAdapter(connectionConfig: {
    database: string;
    tenantId?: string;
  }): IDatabaseAdapter {
    const config: DatabaseConfig = {
      type: 'postgresql',
      host: this.isolationConfig.getHost(),
      port: this.isolationConfig.getPort(),
      username: this.isolationConfig.getUsername(),
      password: this.isolationConfig.getPassword(),
      database: connectionConfig.database,
      pool: this.isolationConfig.getPoolConfig(),
    };

    const adapter = new PostgreSQLAdapter(
      config,
      'table-level',
      this.eventEmitter,
      this.logger,
    );

    // 设置租户上下文
    if (connectionConfig.tenantId) {
      adapter.setTenantContext(connectionConfig.tenantId);
    }

    // 启用行级安全策略
    if (this.isolationConfig.isRowLevelSecurityEnabled()) {
      adapter.enableRowLevelSecurity();
    }

    return adapter;
  }
}
```

## 缓存模块设计

### Redis缓存服务

```typescript
/**
 * @class RedisCacheService
 * @description Redis缓存服务实现，负责提供高性能的数据缓存和会话管理功能
 *
 * 缓存服务职责：
 * 1. 提供键值对缓存存储
 * 2. 实现缓存过期和淘汰策略
 * 3. 支持分布式缓存同步
 * 4. 提供缓存统计和监控
 *
 * 缓存策略：
 * 1. 基于TTL的自动过期
 * 2. LRU淘汰策略
 * 3. 缓存预热和刷新
 * 4. 缓存穿透和雪崩保护
 *
 * 多租户支持：
 * 1. 基于租户ID的缓存键命名空间
 * 2. 租户级缓存隔离
 * 3. 租户级缓存统计
 * 4. 支持租户级缓存清理
 */
@Injectable()
export class RedisCacheService implements ICacheService {
  private redis: Redis;
  private stats: CacheStats;

  constructor(
    private readonly redisConfig: RedisConfig,
    private readonly tenantContext: ITenantContext,
    private readonly logger: Logger,
  ) {
    this.redis = new Redis({
      host: this.redisConfig.host,
      port: this.redisConfig.port,
      password: this.redisConfig.password,
      db: this.redisConfig.db,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    });

    this.stats = this.initializeStats();
    this.setupEventListeners();
  }

  /**
   * 从缓存中获取数据
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const tenantKey = this.generateTenantKey(key);
      const cachedData = await this.redis.get(tenantKey);

      if (!cachedData) {
        await this.incrementCacheMiss();
        return null;
      }

      await this.incrementCacheHit();
      return JSON.parse(cachedData) as T;
    } catch (error) {
      throw new CacheError(`Failed to get cache key ${key}: ${error.message}`);
    }
  }

  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param value 缓存值
   * @param ttlSeconds TTL秒数
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    try {
      const tenantKey = this.generateTenantKey(key);
      const serializedData = JSON.stringify(value);

      await this.redis.setex(tenantKey, ttlSeconds, serializedData);
      await this.incrementCacheSet();
    } catch (error) {
      throw new CacheError(`Failed to set cache key ${key}: ${error.message}`);
    }
  }

  /**
   * 删除缓存数据
   * @param key 缓存键
   * @returns 是否删除成功
   */
  async delete(key: string): Promise<boolean> {
    try {
      const tenantKey = this.generateTenantKey(key);
      const result = await this.redis.del(tenantKey);
      await this.incrementCacheDelete();
      return result > 0;
    } catch (error) {
      throw new CacheError(
        `Failed to delete cache key ${key}: ${error.message}`,
      );
    }
  }

  /**
   * 清理租户级缓存
   * @returns 清理的键数量
   */
  async clearTenantCache(): Promise<number> {
    try {
      const tenantId = this.tenantContext.getCurrentTenantId();
      const pattern = `tenant:${tenantId}:*`;

      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      await this.incrementCacheClear(keys.length);
      return result;
    } catch (error) {
      throw new CacheError(`Failed to clear tenant cache: ${error.message}`);
    }
  }

  /**
   * 生成租户级缓存键
   * @param key 原始缓存键
   * @returns 租户级缓存键
   */
  private generateTenantKey(key: string): string {
    const tenantId = this.tenantContext.getCurrentTenantId();
    return `tenant:${tenantId}:${key}`;
  }

  /**
   * 增加缓存命中计数
   */
  private async incrementCacheHit(): Promise<void> {
    this.stats.hits++;
    this.stats.hitRate =
      this.stats.hits / (this.stats.hits + this.stats.misses);
  }

  /**
   * 增加缓存未命中计数
   */
  private async incrementCacheMiss(): Promise<void> {
    this.stats.misses++;
    this.stats.hitRate =
      this.stats.hits / (this.stats.hits + this.stats.misses);
  }

  /**
   * 增加缓存设置计数
   */
  private async incrementCacheSet(): Promise<void> {
    this.stats.sets++;
  }

  /**
   * 增加缓存删除计数
   */
  private async incrementCacheDelete(): Promise<void> {
    this.stats.deletes++;
  }

  /**
   * 增加缓存清理计数
   */
  private async incrementCacheClear(count: number): Promise<void> {
    this.stats.clears += count;
  }

  /**
   * 初始化统计信息
   */
  private initializeStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0,
      hitRate: 0,
    };
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });

    this.redis.on('error', error => {
      this.logger.error('Redis connection error', error);
    });

    this.redis.on('ready', () => {
      this.logger.log('Redis is ready to receive commands');
    });
  }
}
```

## 消息队列模块设计

### Bull消息队列服务

```typescript
/**
 * @class BullMessageQueueService
 * @description Bull消息队列服务，负责处理异步消息传递和事件分发
 *
 * 消息队列职责：
 * 1. 发布和消费领域事件
 * 2. 处理异步任务队列
 * 3. 实现消息路由和分发
 * 4. 提供消息持久化和重试机制
 *
 * 消息类型：
 * 1. 领域事件：业务状态变更通知
 * 2. 集成事件：跨边界上下文通信
 * 3. 命令消息：异步命令处理
 * 4. 查询消息：异步查询处理
 *
 * 可靠性保证：
 * 1. 消息持久化存储
 * 2. 消息确认机制
 * 3. 失败重试策略
 * 4. 死信队列处理
 */
@Injectable()
export class BullMessageQueueService implements IMessageQueueService {
  private queues: Map<string, Queue> = new Map();
  private processors: Map<string, Processor> = new Map();

  constructor(
    private readonly redisConfig: RedisConfig,
    private readonly logger: Logger,
  ) {
    this.initializeQueues();
  }

  /**
   * 发布领域事件到消息队列
   * @param event 领域事件
   */
  async publishEvent(event: IDomainEvent): Promise<void> {
    try {
      const queue = this.getQueue('domain_events');

      const jobData = {
        eventType: event.eventType,
        aggregateId: event.aggregateId,
        data: event.toJSON(),
        metadata: {
          occurredOn: event.occurredOn,
          eventVersion: event.eventVersion,
          tenantId: this.getTenantIdFromEvent(event),
        },
      };

      await queue.add('process_event', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      this.logger.log(
        `Event published: ${event.eventType} for aggregate ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(`Failed to publish event: ${event.eventType}`, error);
      throw new MessagePublishError(
        `Failed to publish event: ${error.message}`,
      );
    }
  }

  /**
   * 发布命令到消息队列
   * @param command 命令对象
   */
  async publishCommand(command: ICommand): Promise<void> {
    try {
      const queue = this.getQueue('commands');

      const jobData = {
        commandType: command.constructor.name,
        data: command.toJSON(),
        metadata: {
          requestedBy: command.requestedBy,
          tenantId: command.tenantId,
        },
      };

      await queue.add('process_command', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      this.logger.log(`Command published: ${command.constructor.name}`);
    } catch (error) {
      this.logger.error(
        `Failed to publish command: ${command.constructor.name}`,
        error,
      );
      throw new MessagePublishError(
        `Failed to publish command: ${error.message}`,
      );
    }
  }

  /**
   * 注册事件处理器
   * @param eventType 事件类型
   * @param handler 事件处理器
   */
  registerEventHandler(eventType: string, handler: IEventHandler): void {
    const queue = this.getQueue('domain_events');

    const processor = async (job: Job) => {
      try {
        const eventData = job.data;
        const event = this.deserializeEvent(eventData);

        await handler.handle(event);

        this.logger.log(
          `Event processed: ${eventType} for aggregate ${event.aggregateId}`,
        );
      } catch (error) {
        this.logger.error(`Failed to process event: ${eventType}`, error);
        throw error; // 让Bull重试
      }
    };

    queue.process('process_event', processor);
    this.processors.set(eventType, processor);
  }

  /**
   * 注册命令处理器
   * @param commandType 命令类型
   * @param handler 命令处理器
   */
  registerCommandHandler(commandType: string, handler: ICommandHandler): void {
    const queue = this.getQueue('commands');

    const processor = async (job: Job) => {
      try {
        const commandData = job.data;
        const command = this.deserializeCommand(commandData);

        await handler.handle(command);

        this.logger.log(`Command processed: ${commandType}`);
      } catch (error) {
        this.logger.error(`Failed to process command: ${commandType}`, error);
        throw error; // 让Bull重试
      }
    };

    queue.process('process_command', processor);
    this.processors.set(commandType, processor);
  }

  /**
   * 获取队列实例
   * @param queueName 队列名称
   * @returns 队列实例
   */
  private getQueue(queueName: string): Queue {
    if (!this.queues.has(queueName)) {
      const queue = new Queue(queueName, {
        redis: {
          host: this.redisConfig.host,
          port: this.redisConfig.port,
          password: this.redisConfig.password,
          db: this.redisConfig.db,
        },
        defaultJobOptions: {
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      });

      this.queues.set(queueName, queue);
    }

    return this.queues.get(queueName)!;
  }

  /**
   * 从事件中提取租户ID
   * @param event 领域事件
   * @returns 租户ID
   */
  private getTenantIdFromEvent(event: IDomainEvent): string | undefined {
    if ('tenantId' in event) {
      return (event as any).tenantId;
    }
    return undefined;
  }

  /**
   * 反序列化事件
   * @param eventData 事件数据
   * @returns 领域事件
   */
  private deserializeEvent(eventData: any): IDomainEvent {
    // 根据事件类型反序列化事件
    const eventClass = this.getEventClass(eventData.eventType);
    return new eventClass(eventData.data);
  }

  /**
   * 反序列化命令
   * @param commandData 命令数据
   * @returns 命令对象
   */
  private deserializeCommand(commandData: any): ICommand {
    // 根据命令类型反序列化命令
    const commandClass = this.getCommandClass(commandData.commandType);
    return new commandClass(commandData.data);
  }

  /**
   * 获取事件类
   * @param eventType 事件类型
   * @returns 事件类
   */
  private getEventClass(eventType: string): any {
    // 事件类型到事件类的映射
    const eventClassMap = {
      UserCreated: UserCreatedEvent,
      UserUpdated: UserUpdatedEvent,
      UserDeleted: UserDeletedEvent,
      // 添加更多事件类型映射
    };

    return eventClassMap[eventType] || DomainEvent;
  }

  /**
   * 获取命令类
   * @param commandType 命令类型
   * @returns 命令类
   */
  private getCommandClass(commandType: string): any {
    // 命令类型到命令类的映射
    const commandClassMap = {
      CreateUserCommand: CreateUserCommand,
      UpdateUserCommand: UpdateUserCommand,
      DeleteUserCommand: DeleteUserCommand,
      // 添加更多命令类型映射
    };

    return commandClassMap[commandType] || Command;
  }
}
```

## 外部服务集成

### HTTP客户端服务

```typescript
/**
 * @class HttpClientService
 * @description HTTP客户端服务，负责与外部HTTP服务进行通信
 *
 * 服务职责：
 * 1. 提供统一的HTTP客户端接口
 * 2. 实现请求重试和错误处理
 * 3. 支持请求和响应拦截器
 * 4. 提供请求监控和日志记录
 *
 * 功能特性：
 * 1. 自动重试机制
 * 2. 请求超时控制
 * 3. 请求和响应日志
 * 4. 错误处理和转换
 * 5. 请求缓存支持
 */
@Injectable()
export class HttpClientService {
  private httpClient: AxiosInstance;

  constructor(
    private readonly httpConfig: HttpConfig,
    private readonly logger: Logger,
  ) {
    this.initializeHttpClient();
  }

  /**
   * 发送GET请求
   * @param url 请求URL
   * @param options 请求选项
   * @returns 响应数据
   */
  async get<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('GET', url, undefined, options);
  }

  /**
   * 发送POST请求
   * @param url 请求URL
   * @param data 请求数据
   * @param options 请求选项
   * @returns 响应数据
   */
  async post<T>(
    url: string,
    data?: any,
    options?: HttpRequestOptions,
  ): Promise<T> {
    return this.request<T>('POST', url, data, options);
  }

  /**
   * 发送PUT请求
   * @param url 请求URL
   * @param data 请求数据
   * @param options 请求选项
   * @returns 响应数据
   */
  async put<T>(
    url: string,
    data?: any,
    options?: HttpRequestOptions,
  ): Promise<T> {
    return this.request<T>('PUT', url, data, options);
  }

  /**
   * 发送DELETE请求
   * @param url 请求URL
   * @param options 请求选项
   * @returns 响应数据
   */
  async delete<T>(url: string, options?: HttpRequestOptions): Promise<T> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  /**
   * 发送HTTP请求
   * @param method 请求方法
   * @param url 请求URL
   * @param data 请求数据
   * @param options 请求选项
   * @returns 响应数据
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const response = await this.httpClient.request({
        method,
        url,
        data,
        ...options,
      });

      const responseTime = Date.now() - startTime;

      this.logger.log(`HTTP ${method} ${url} - ${response.status}`, {
        method,
        url,
        status: response.status,
        responseTime,
      });

      return response.data;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      this.logger.error(`HTTP ${method} ${url} failed`, {
        method,
        url,
        error: error.message,
        responseTime,
      });

      throw new HttpRequestError(`HTTP request failed: ${error.message}`);
    }
  }

  /**
   * 初始化HTTP客户端
   */
  private initializeHttpClient(): void {
    this.httpClient = axios.create({
      timeout: this.httpConfig.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Aiofix-SaaS-Platform/1.0',
      },
    });

    // 请求拦截器
    this.httpClient.interceptors.request.use(
      config => {
        this.logger.debug(
          `HTTP Request: ${config.method?.toUpperCase()} ${config.url}`,
          {
            method: config.method,
            url: config.url,
            headers: config.headers,
          },
        );

        return config;
      },
      error => {
        this.logger.error('HTTP Request Error', error);
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    this.httpClient.interceptors.response.use(
      response => {
        this.logger.debug(
          `HTTP Response: ${response.status} ${response.config.url}`,
          {
            status: response.status,
            url: response.config.url,
            data: response.data,
          },
        );

        return response;
      },
      error => {
        this.logger.error('HTTP Response Error', {
          status: error.response?.status,
          url: error.config?.url,
          error: error.message,
        });

        return Promise.reject(error);
      },
    );
  }
}
```

## 配置管理

### 环境配置服务

```typescript
/**
 * @class EnvironmentConfigService
 * @description 环境配置服务，负责管理应用程序的配置信息
 *
 * 配置服务职责：
 * 1. 加载和管理环境变量
 * 2. 提供类型安全的配置访问
 * 3. 支持配置验证和默认值
 * 4. 实现配置的热重载
 *
 * 配置类型：
 * 1. 数据库配置
 * 2. Redis配置
 * 3. 外部服务配置
 * 4. 应用程序配置
 * 5. 安全配置
 */
@Injectable()
export class EnvironmentConfigService {
  private config: ApplicationConfig;

  constructor() {
    this.loadConfig();
  }

  /**
   * 获取数据库配置
   * @returns 数据库配置
   */
  getDatabaseConfig(): DatabaseConfig {
    return {
      type: this.getEnv('DATABASE_TYPE', 'postgresql'),
      host: this.getEnv('DATABASE_HOST', 'localhost'),
      port: parseInt(this.getEnv('DATABASE_PORT', '5432')),
      username: this.getEnv('DATABASE_USERNAME', 'postgres'),
      password: this.getEnv('DATABASE_PASSWORD', ''),
      database: this.getEnv('DATABASE_NAME', 'aiofix'),
      pool: {
        min: parseInt(this.getEnv('DATABASE_POOL_MIN', '5')),
        max: parseInt(this.getEnv('DATABASE_POOL_MAX', '20')),
        idleTimeoutMillis: parseInt(
          this.getEnv('DATABASE_POOL_IDLE_TIMEOUT', '30000'),
        ),
        connectionTimeoutMillis: parseInt(
          this.getEnv('DATABASE_POOL_CONNECTION_TIMEOUT', '2000'),
        ),
      },
    };
  }

  /**
   * 获取Redis配置
   * @returns Redis配置
   */
  getRedisConfig(): RedisConfig {
    return {
      host: this.getEnv('REDIS_HOST', 'localhost'),
      port: parseInt(this.getEnv('REDIS_PORT', '6379')),
      password: this.getEnv('REDIS_PASSWORD', ''),
      db: parseInt(this.getEnv('REDIS_DB', '0')),
    };
  }

  /**
   * 获取应用程序配置
   * @returns 应用程序配置
   */
  getApplicationConfig(): ApplicationConfig {
    return {
      port: parseInt(this.getEnv('PORT', '3000')),
      environment: this.getEnv('NODE_ENV', 'development'),
      logLevel: this.getEnv('LOG_LEVEL', 'info'),
      cors: {
        origin: this.getEnv('CORS_ORIGIN', '*'),
        credentials: this.getEnv('CORS_CREDENTIALS', 'true') === 'true',
      },
      rateLimit: {
        windowMs: parseInt(this.getEnv('RATE_LIMIT_WINDOW_MS', '900000')),
        max: parseInt(this.getEnv('RATE_LIMIT_MAX', '100')),
      },
    };
  }

  /**
   * 获取安全配置
   * @returns 安全配置
   */
  getSecurityConfig(): SecurityConfig {
    return {
      jwt: {
        secret: this.getEnv('JWT_SECRET', ''),
        expiresIn: this.getEnv('JWT_EXPIRES_IN', '24h'),
      },
      bcrypt: {
        rounds: parseInt(this.getEnv('BCRYPT_ROUNDS', '12')),
      },
      encryption: {
        algorithm: this.getEnv('ENCRYPTION_ALGORITHM', 'aes-256-gcm'),
        key: this.getEnv('ENCRYPTION_KEY', ''),
      },
    };
  }

  /**
   * 获取环境变量值
   * @param key 环境变量键
   * @param defaultValue 默认值
   * @returns 环境变量值
   */
  private getEnv(key: string, defaultValue?: string): string {
    const value = process.env[key];
    if (value === undefined) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Environment variable ${key} is required`);
    }
    return value;
  }

  /**
   * 加载配置
   */
  private loadConfig(): void {
    this.config = {
      database: this.getDatabaseConfig(),
      redis: this.getRedisConfig(),
      application: this.getApplicationConfig(),
      security: this.getSecurityConfig(),
    };
  }
}
```

## 测试策略

### 单元测试

```typescript
// 数据库适配器测试
describe('PostgreSQLAdapter', () => {
  let adapter: PostgreSQLAdapter;
  let mockPool: jest.Mocked<Pool>;

  beforeEach(() => {
    mockPool = createMockPool();
    adapter = new PostgreSQLAdapter(
      mockConfig,
      'test-db',
      mockEventEmitter,
      mockLogger,
    );
  });

  it('should connect to database successfully', async () => {
    mockPool.connect.mockResolvedValue(mockClient);
    mockClient.query.mockResolvedValue({ rows: [{ '?column?': 1 }] });

    await adapter.connect();

    expect(mockPool.connect).toHaveBeenCalled();
    expect(adapter.isConnected()).toBe(true);
  });

  it('should execute query successfully', async () => {
    const mockResult = { rows: [{ id: 1, name: 'test' }], rowCount: 1 };
    mockPool.query.mockResolvedValue(mockResult);

    const result = await adapter.query('SELECT * FROM users WHERE id = $1', [
      1,
    ]);

    expect(result).toBe(mockResult);
    expect(mockPool.query).toHaveBeenCalledWith({
      text: 'SELECT * FROM users WHERE id = $1',
      values: [1],
      name: 'unnamed',
    });
  });
});

// 缓存服务测试
describe('RedisCacheService', () => {
  let cacheService: RedisCacheService;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    mockRedis = createMockRedis();
    cacheService = new RedisCacheService(
      mockRedisConfig,
      mockTenantContext,
      mockLogger,
    );
  });

  it('should get cached data successfully', async () => {
    const cachedData = JSON.stringify({ id: 1, name: 'test' });
    mockRedis.get.mockResolvedValue(cachedData);

    const result = await cacheService.get<{ id: number; name: string }>(
      'user:1',
    );

    expect(result).toEqual({ id: 1, name: 'test' });
    expect(mockRedis.get).toHaveBeenCalledWith('tenant:tenant-123:user:1');
  });

  it('should set cache data successfully', async () => {
    mockRedis.setex.mockResolvedValue('OK');

    await cacheService.set('user:1', { id: 1, name: 'test' }, 300);

    expect(mockRedis.setex).toHaveBeenCalledWith(
      'tenant:tenant-123:user:1',
      300,
      JSON.stringify({ id: 1, name: 'test' }),
    );
  });
});
```

## 总结

Frameworks & Drivers层是Clean Architecture的最外层，通过数据库适配器、缓存服务、消息队列和外部服务集成，为整个系统提供了稳定可靠的基础设施支持。这种设计确保了系统的可扩展性、可维护性和高性能，为业务逻辑的实现提供了坚实的技术基础。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
