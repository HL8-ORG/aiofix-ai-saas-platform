# 适配器模式设计

## 概述

适配器模式是Aiofix平台的核心设计模式之一，用于封装不同数据库的访问细节，为上层提供统一的数据库访问接口，同时支持多租户隔离策略的动态切换。本设计基于Clean Architecture原则，实现了高度的可扩展性和可维护性。

## 设计原则

### 1. 接口隔离原则

- **统一接口**：所有数据库适配器实现相同的接口
- **功能完整**：接口包含所有必要的数据库操作
- **扩展友好**：支持新数据库类型的扩展

### 2. 开闭原则

- **对扩展开放**：可以轻松添加新的数据库适配器
- **对修改封闭**：现有代码无需修改即可支持新数据库

### 3. 依赖倒置原则

- **抽象依赖**：上层代码依赖抽象接口而非具体实现
- **实现隔离**：具体实现可以独立变化

## 核心组件

### 1. 数据库适配器接口

```typescript
/**
 * @interface IDatabaseAdapter
 * @description 数据库适配器接口，提供统一的数据库操作接口
 *
 * 接口职责：
 * 1. 定义统一的数据库操作接口
 * 2. 支持多租户数据隔离
 * 3. 提供连接管理和健康检查
 * 4. 支持事务和性能监控
 */
export interface IDatabaseAdapter {
  /** 适配器名称 */
  name: string;

  /** 数据库类型 */
  type: string;

  /** 连接状态 */
  isConnected: boolean;

  /** 配置信息 */
  config: DatabaseConfig;

  /** 事件发射器 */
  eventEmitter: EventEmitter2;

  /**
   * @method connect
   * @description 连接数据库
   * @returns {Promise<void>}
   */
  connect(): Promise<void>;

  /**
   * @method disconnect
   * @description 断开数据库连接
   * @returns {Promise<void>}
   */
  disconnect(): Promise<void>;

  /**
   * @method query
   * @description 执行查询语句
   * @param {string} sql SQL语句
   * @param {unknown[]} [params] 查询参数
   * @param {Record<string, unknown>} [options] 查询选项
   * @returns {Promise<QueryResult<T>>} 查询结果
   */
  query<T = any>(
    sql: string,
    params?: unknown[],
    options?: Record<string, unknown>,
  ): Promise<QueryResult<T>>;

  /**
   * @method execute
   * @description 执行更新语句
   * @param {string} sql SQL语句
   * @param {unknown[]} [params] 查询参数
   * @param {Record<string, unknown>} [options] 执行选项
   * @returns {Promise<QueryResult<T>>} 执行结果
   */
  execute<T = any>(
    sql: string,
    params?: unknown[],
    options?: Record<string, unknown>,
  ): Promise<QueryResult<T>>;

  /**
   * @method transaction
   * @description 在事务中执行操作
   * @param {Function} callback 事务回调函数
   * @returns {Promise<T>} 事务执行结果
   */
  transaction<T>(
    callback: (adapter: IDatabaseAdapter) => Promise<T>,
  ): Promise<T>;

  // 租户相关方法
  setTenantContext(tenantId: string): void;
  getTenantContext(): string | undefined;
  setDefaultSchema(schemaName: string): void;
  getDefaultSchema(): string | undefined;
  enableRowLevelSecurity(): Promise<void>;
  disableRowLevelSecurity(): Promise<void>;
  isRowLevelSecurityEnabled(): Promise<boolean>;

  // 健康检查和统计
  getHealth(): Promise<HealthStatus>;
  getStats(): Promise<DatabaseStats>;
  resetStats(): Promise<void>;
  getConnection(): Promise<any>;
  ping(): Promise<boolean>;
}
```

### 2. PostgreSQL适配器实现

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
   * @method connect
   * @description 连接到PostgreSQL数据库
   * @returns {Promise<void>} 连接结果
   * @throws {DatabaseConnectionError} 当连接失败时抛出
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
   * @method query
   * @description 执行查询
   * @param {string} sql SQL语句
   * @param {unknown[]} params 查询参数
   * @param {QueryOptions} options 查询选项
   * @returns {Promise<QueryResult>} 查询结果
   * @throws {QueryExecutionError} 当查询执行失败时抛出
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
   * @method setTenantContext
   * @description 设置租户上下文
   * @param {string} tenantId 租户ID
   */
  setTenantContext(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /**
   * @method getTenantContext
   * @description 获取租户上下文
   * @returns {string | undefined} 租户ID
   */
  getTenantContext(): string | undefined {
    return this.tenantId;
  }

  /**
   * @method setDefaultSchema
   * @description 设置默认Schema
   * @param {string} schemaName Schema名称
   */
  setDefaultSchema(schemaName: string): void {
    this.defaultSchema = schemaName;
  }

  /**
   * @method getDefaultSchema
   * @description 获取默认Schema
   * @returns {string | undefined} Schema名称
   */
  getDefaultSchema(): string | undefined {
    return this.defaultSchema;
  }

  /**
   * @method enableRowLevelSecurity
   * @description 启用行级安全策略
   */
  enableRowLevelSecurity(): void {
    this.rlsEnabled = true;
  }

  /**
   * @method disableRowLevelSecurity
   * @description 禁用行级安全策略
   */
  disableRowLevelSecurity(): void {
    this.rlsEnabled = false;
  }

  /**
   * @method isRowLevelSecurityEnabled
   * @description 检查是否启用了行级安全策略
   * @returns {boolean} 是否启用RLS
   */
  isRowLevelSecurityEnabled(): boolean {
    return this.rlsEnabled;
  }
}
```

### 3. MongoDB适配器实现

```typescript
/**
 * @class MongoDBAdapter
 * @description MongoDB数据库适配器，提供统一的数据库操作接口
 *
 * 适配器职责：
 * 1. 实现MongoDB数据库的连接管理
 * 2. 提供统一的文档操作接口
 * 3. 支持集合和索引管理
 * 4. 实现多租户数据隔离支持
 */
@Injectable()
export class MongoDBAdapter implements IDatabaseAdapter {
  public readonly name: string;
  public readonly type: string = 'mongodb';
  public readonly eventEmitter: EventEmitter2;
  public readonly config: DatabaseConfig;

  private tenantId?: string;
  private defaultDatabase?: string;
  private client: MongoClient;
  private db: Db;
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
    this.initializeClient();
  }

  /**
   * @method connect
   * @description 连接到MongoDB数据库
   * @returns {Promise<void>} 连接结果
   */
  async connect(): Promise<void> {
    try {
      this.logger.info(
        `Connecting to MongoDB database: ${this.config.database}`,
        LogContext.DATABASE,
        { adapter: this.name, host: this.config.host, port: this.config.port },
      );

      await this.client.connect();
      this.db = this.client.db(this.config.database);
      this.isConnectedFlag = true;

      this.emitEvent('connected', {
        adapter: this.name,
        database: this.config.database,
        timestamp: new Date(),
      });
    } catch (error) {
      this.isConnectedFlag = false;
      this.logger.error(
        `Failed to connect to MongoDB database: ${this.config.database}`,
        LogContext.DATABASE,
        { adapter: this.name, error: (error as Error).message },
        error as Error,
      );

      throw error;
    }
  }

  /**
   * @method query
   * @description 执行查询（MongoDB中的find操作）
   * @param {string} collection 集合名称
   * @param {object} filter 查询过滤器
   * @param {object} options 查询选项
   * @returns {Promise<QueryResult>} 查询结果
   */
  async query(
    collection: string,
    filter: object = {},
    options: QueryOptions = {},
  ): Promise<QueryResult> {
    const startTime = Date.now();
    this.stats.totalQueries++;

    try {
      const coll = this.getCollection(collection);
      const cursor = coll.find(filter, options);
      const documents = await cursor.toArray();

      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, true);

      return {
        rows: documents,
        rowCount: documents.length,
        fields: [],
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateStats(responseTime, false);

      this.logger.error(
        `MongoDB query failed: ${collection}`,
        LogContext.DATABASE,
        {
          adapter: this.name,
          filter,
          responseTime,
          error: (error as Error).message,
        },
        error as Error,
      );

      throw error;
    }
  }

  /**
   * @method setTenantContext
   * @description 设置租户上下文
   * @param {string} tenantId 租户ID
   */
  setTenantContext(tenantId: string): void {
    this.tenantId = tenantId;
  }

  /**
   * @method getTenantContext
   * @description 获取租户上下文
   * @returns {string | undefined} 租户ID
   */
  getTenantContext(): string | undefined {
    return this.tenantId;
  }

  /**
   * @method setDefaultDatabase
   * @description 设置默认数据库
   * @param {string} databaseName 数据库名称
   */
  setDefaultDatabase(databaseName: string): void {
    this.defaultDatabase = databaseName;
    this.db = this.client.db(databaseName);
  }

  /**
   * @method getDefaultDatabase
   * @description 获取默认数据库
   * @returns {string | undefined} 数据库名称
   */
  getDefaultDatabase(): string | undefined {
    return this.defaultDatabase;
  }

  private getCollection(collectionName: string): Collection {
    // 根据租户上下文选择集合
    const finalCollectionName = this.tenantId
      ? `${this.tenantId}_${collectionName}`
      : collectionName;

    return this.db.collection(finalCollectionName);
  }
}
```

## 数据库隔离策略

### 1. 隔离策略类型

#### 1.1 数据库级隔离 (Database Level)

**特点**：

- 每个租户使用完全独立的数据库
- 最高级别的数据隔离
- 支持租户特定的数据库配置
- 适合对数据隔离要求极高的场景

**实现方式**：

```typescript
// 租户数据库命名规则
const tenantDatabase = `tenant_${tenantId}_db`;

// 连接配置
const connectionConfig = {
  host: 'localhost',
  port: 5432,
  database: tenantDatabase,
  username: 'postgres',
  password: 'password',
};
```

**优势**：

- 完全的数据隔离
- 支持租户特定的数据库优化
- 易于备份和恢复
- 支持租户特定的扩展

**劣势**：

- 资源消耗较大
- 管理复杂度高
- 跨租户查询困难

#### 1.2 Schema级隔离 (Schema Level)

**特点**：

- 所有租户共享同一个数据库
- 每个租户使用独立的Schema
- 平衡了隔离性和资源效率
- 支持跨租户的共享数据

**实现方式**：

```typescript
// Schema命名规则
const tenantSchema = `tenant_${tenantId}`;

// 连接配置
const connectionConfig = {
  host: 'localhost',
  port: 5432,
  database: 'aiofix_platform',
  schema: tenantSchema,
  username: 'postgres',
  password: 'password',
};
```

**优势**：

- 良好的数据隔离
- 资源效率较高
- 支持跨租户查询
- 管理相对简单

**劣势**：

- 隔离性不如数据库级
- 需要Schema管理
- 跨租户数据共享需要特殊处理

#### 1.3 表级隔离 (Table Level) - 默认策略

**特点**：

- 所有租户共享同一个数据库和Schema
- 使用tenant_id字段进行数据隔离
- 最高效的资源利用
- 最简单的管理方式

**实现方式**：

```typescript
// 表结构包含tenant_id字段
CREATE TABLE users (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  email VARCHAR(255) NOT NULL,
  -- 其他字段
);

// 查询时自动添加租户条件
const query = `SELECT * FROM users WHERE tenant_id = '${tenantId}'`;
```

**优势**：

- 资源效率最高
- 管理最简单
- 支持复杂的跨租户查询
- 易于扩展和维护

**劣势**：

- 隔离性相对较低
- 需要严格的权限控制
- 数据泄露风险较高

### 2. 配置驱动实现

#### 2.1 环境变量配置

```bash
# 数据隔离策略配置
DATA_ISOLATION_STRATEGY=table_level  # database_level | schema_level | table_level

# 数据库级隔离配置
TENANT_DB_PREFIX=tenant_
PLATFORM_DB_NAME=aiofix_platform
EVENTS_DB_NAME=aiofix_events
AI_VECTORS_DB_NAME=aiofix_ai_vectors

# Schema级隔离配置
TENANT_SCHEMA_PREFIX=tenant_
SHARED_SCHEMA_NAME=shared

# 表级隔离配置
TENANT_ID_FIELD=tenant_id
AUTO_ADD_TENANT_CONDITION=true
DEFAULT_TENANT_ID=platform
```

#### 2.2 隔离配置服务

```typescript
/**
 * @class IsolationConfigService
 * @description 隔离配置服务，管理多租户数据隔离策略配置
 *
 * 服务职责：
 * 1. 管理隔离策略配置
 * 2. 提供连接配置生成
 * 3. 支持配置动态切换
 * 4. 提供配置验证和默认值
 */
@Injectable()
export class IsolationConfigService {
  private config: IsolationConfig;

  constructor(private configService: ConfigService) {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.config = {
      strategy: this.configService.get(
        'DATA_ISOLATION_STRATEGY',
        IsolationStrategy.TABLE_LEVEL,
      ),
      defaultTenantId: this.configService.get('DEFAULT_TENANT_ID', 'platform'),
      databaseLevel: {
        tenantDbPrefix: this.configService.get('TENANT_DB_PREFIX', 'tenant_'),
        platformDbName: this.configService.get(
          'PLATFORM_DB_NAME',
          'aiofix_platform',
        ),
        eventsDbName: this.configService.get('EVENTS_DB_NAME', 'aiofix_events'),
        aiVectorsDbName: this.configService.get(
          'AI_VECTORS_DB_NAME',
          'aiofix_ai_vectors',
        ),
      },
      schemaLevel: {
        tenantSchemaPrefix: this.configService.get(
          'TENANT_SCHEMA_PREFIX',
          'tenant_',
        ),
        sharedSchemaName: this.configService.get(
          'SHARED_SCHEMA_NAME',
          'shared',
        ),
      },
      tableLevel: {
        tenantIdField: this.configService.get('TENANT_ID_FIELD', 'tenant_id'),
        autoAddTenantCondition: this.configService.get(
          'AUTO_ADD_TENANT_CONDITION',
          true,
        ),
      },
    };
  }

  /**
   * @method getStrategy
   * @description 获取当前隔离策略
   * @returns {IsolationStrategy} 隔离策略
   */
  getStrategy(): IsolationStrategy {
    return this.config.strategy;
  }

  /**
   * @method getConnectionConfig
   * @description 获取连接配置
   * @param {string} [tenantId] 租户ID，可选
   * @returns {ConnectionConfig} 连接配置
   */
  getConnectionConfig(tenantId?: string): ConnectionConfig {
    const strategy = this.getStrategy();

    switch (strategy) {
      case IsolationStrategy.DATABASE_LEVEL:
        return this.getDatabaseLevelConfig(tenantId);
      case IsolationStrategy.SCHEMA_LEVEL:
        return this.getSchemaLevelConfig(tenantId);
      case IsolationStrategy.TABLE_LEVEL:
        return this.getTableLevelConfig();
      default:
        throw new Error(`Unsupported isolation strategy: ${strategy}`);
    }
  }

  /**
   * @method getDatabaseLevelConfig
   * @description 获取数据库级隔离配置
   * @param {string} [tenantId] 租户ID，可选
   * @returns {ConnectionConfig} 连接配置
   * @private
   */
  private getDatabaseLevelConfig(tenantId?: string): ConnectionConfig {
    if (!tenantId) {
      return {
        database: this.config.databaseLevel.platformDbName,
      };
    }

    return {
      database: `${this.config.databaseLevel.tenantDbPrefix}${tenantId}_db`,
    };
  }

  /**
   * @method getSchemaLevelConfig
   * @description 获取Schema级隔离配置
   * @param {string} [tenantId] 租户ID，可选
   * @returns {ConnectionConfig} 连接配置
   * @private
   */
  private getSchemaLevelConfig(tenantId?: string): ConnectionConfig {
    if (!tenantId) {
      return {
        database: this.config.databaseLevel.platformDbName,
        schema: this.config.schemaLevel.sharedSchemaName,
      };
    }

    return {
      database: this.config.databaseLevel.platformDbName,
      schema: `${this.config.schemaLevel.tenantSchemaPrefix}${tenantId}`,
    };
  }

  /**
   * @method getTableLevelConfig
   * @description 获取表级隔离配置
   * @returns {ConnectionConfig} 连接配置
   * @private
   */
  private getTableLevelConfig(): ConnectionConfig {
    return {
      database: this.config.databaseLevel.platformDbName,
    };
  }

  /**
   * @method getHost
   * @description 获取数据库主机
   * @returns {string} 主机地址
   */
  getHost(): string {
    return this.configService.get('DB_HOST', 'localhost');
  }

  /**
   * @method getPort
   * @description 获取数据库端口
   * @returns {number} 端口号
   */
  getPort(): number {
    return parseInt(this.configService.get('DB_PORT', '5432'), 10);
  }

  /**
   * @method getUsername
   * @description 获取数据库用户名
   * @returns {string} 用户名
   */
  getUsername(): string {
    return this.configService.get('DB_USERNAME', 'postgres');
  }

  /**
   * @method getPassword
   * @description 获取数据库密码
   * @returns {string} 密码
   */
  getPassword(): string {
    return this.configService.get('DB_PASSWORD', 'password');
  }

  /**
   * @method getPoolConfig
   * @description 获取连接池配置
   * @returns {object} 连接池配置
   */
  getPoolConfig(): object {
    return {
      min: parseInt(this.configService.get('DB_POOL_MIN', '2'), 10),
      max: parseInt(this.configService.get('DB_POOL_MAX', '10'), 10),
    };
  }

  /**
   * @method isRowLevelSecurityEnabled
   * @description 检查是否启用行级安全
   * @returns {boolean} 是否启用
   */
  isRowLevelSecurityEnabled(): boolean {
    return this.configService.get('ENABLE_ROW_LEVEL_SECURITY', false);
  }

  /**
   * @method shouldAutoAddTenantCondition
   * @description 检查是否自动添加租户条件
   * @returns {boolean} 是否自动添加
   */
  shouldAutoAddTenantCondition(): boolean {
    return this.config.tableLevel.autoAddTenantCondition;
  }

  /**
   * @method getTenantIdField
   * @description 获取租户ID字段名
   * @returns {string} 字段名
   */
  getTenantIdField(): string {
    return this.config.tableLevel.tenantIdField;
  }
}
```

### 3. 租户感知仓储实现

```typescript
/**
 * @class TenantAwareRepository
 * @description 租户感知的仓储基类，根据隔离策略配置自动处理租户数据隔离
 *
 * 仓储职责：
 * 1. 提供统一的数据访问接口
 * 2. 根据隔离策略自动处理租户数据隔离
 * 3. 支持多种隔离策略（数据库级、Schema级、表级）
 * 4. 提供租户特定的仓储实例创建
 */
export abstract class TenantAwareRepository<T> {
  protected adapter: IDatabaseAdapter;

  constructor(
    protected readonly adapterFactory: DatabaseAdapterFactory,
    protected readonly isolationConfig: IsolationConfigService,
    protected readonly tenantId?: string,
  ) {
    this.adapter = this.adapterFactory.createAdapter(tenantId);
  }

  /**
   * @method findAll
   * @description 查找所有记录，自动应用租户隔离条件
   * @param {object} [options] 查询选项
   * @returns {Promise<T[]>} 记录列表
   */
  async findAll(options?: {
    limit?: number;
    offset?: number;
    orderBy?: string;
  }): Promise<T[]> {
    let query = `SELECT * FROM ${this.getTableName()}`;

    // 根据隔离策略添加条件
    query = this.addIsolationConditions(query);

    // 添加排序
    if (options?.orderBy) {
      query += ` ORDER BY ${options.orderBy}`;
    }

    // 添加分页
    if (options?.limit) {
      query += ` LIMIT ${options.limit}`;
      if (options?.offset) {
        query += ` OFFSET ${options.offset}`;
      }
    }

    const result = await this.adapter.query(query);
    return result.rows.map(row => this.mapRowToEntity(row));
  }

  /**
   * @method findById
   * @description 根据ID查找记录，自动应用租户隔离条件
   * @param {string} id 记录ID
   * @returns {Promise<T | null>} 记录或null
   */
  async findById(id: string): Promise<T | null> {
    let query = `SELECT * FROM ${this.getTableName()} WHERE id = $1`;

    // 根据隔离策略添加条件
    query = this.addIsolationConditions(query);

    const result = await this.adapter.query(query, [id]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * @method create
   * @description 创建新记录，自动添加租户信息
   * @param {Partial<T>} data 记录数据
   * @returns {Promise<T>} 创建的记录
   */
  async create(data: Partial<T>): Promise<T> {
    const tenantId = this.tenantId || this.isolationConfig.getDefaultTenantId();

    // 为表级隔离添加tenant_id
    if (this.isolationConfig.getStrategy() === IsolationStrategy.TABLE_LEVEL) {
      const tenantIdField = this.isolationConfig.getTenantIdField();
      (data as any)[tenantIdField] = tenantId;
    }

    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map((_, index) => `$${index + 1}`).join(', ');

    const query = `
      INSERT INTO ${this.getTableName()} (${fields.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.adapter.query(query, values);
    return this.mapRowToEntity(result.rows[0]);
  }

  /**
   * @method addIsolationConditions
   * @description 根据隔离策略添加隔离条件
   * @param {string} query 原始查询
   * @returns {string} 修改后的查询
   * @protected
   */
  protected addIsolationConditions(query: string): string {
    if (!this.tenantId) {
      return query;
    }

    const strategy = this.isolationConfig.getStrategy();

    switch (strategy) {
      case IsolationStrategy.TABLE_LEVEL:
        if (this.isolationConfig.shouldAutoAddTenantCondition()) {
          const tenantIdField = this.isolationConfig.getTenantIdField();
          if (!query.toLowerCase().includes('where')) {
            return `${query} WHERE ${tenantIdField} = '${this.tenantId}'`;
          } else {
            return `${query} AND ${tenantIdField} = '${this.tenantId}'`;
          }
        }
        break;

      case IsolationStrategy.SCHEMA_LEVEL:
      case IsolationStrategy.DATABASE_LEVEL:
        // 这些级别的隔离通过适配器处理，不需要修改查询
        break;
    }

    return query;
  }

  /**
   * @method getTableName
   * @description 获取表名（子类必须实现）
   * @returns {string} 表名
   * @abstract
   */
  protected abstract getTableName(): string;

  /**
   * @method mapRowToEntity
   * @description 将数据库行映射为实体（子类必须实现）
   * @param {any} row 数据库行
   * @returns {T} 实体对象
   * @abstract
   */
  protected abstract mapRowToEntity(row: any): T;

  /**
   * @method setTenantId
   * @description 设置租户ID并重新创建适配器
   * @param {string} tenantId 租户ID
   */
  setTenantId(tenantId: string): void {
    (this as any).tenantId = tenantId;
    this.adapter = this.adapterFactory.createAdapter(tenantId);
  }

  /**
   * @method createTenantSpecificRepository
   * @description 创建特定租户的仓储实例
   * @param {string} tenantId 租户ID
   * @returns {TenantAwareRepository<T>} 新的仓储实例
   */
  createTenantSpecificRepository(tenantId: string): TenantAwareRepository<T> {
    const RepositoryClass = this.constructor as new (
      adapterFactory: DatabaseAdapterFactory,
      isolationConfig: IsolationConfigService,
      tenantId?: string,
    ) => TenantAwareRepository<T>;

    return new RepositoryClass(
      this.adapterFactory,
      this.isolationConfig,
      tenantId,
    );
  }
}
```

### 4. 行级安全 (Row Level Security)

对于表级隔离，可以使用PostgreSQL的行级安全功能来增强数据隔离：

```sql
-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY tenant_isolation_policy ON users
  FOR ALL
  TO application_role
  USING (tenant_id = current_setting('app.current_tenant_id'));

-- 设置租户上下文
SET app.current_tenant_id = 'tenant-123';
```

## 数据库适配器工厂

### 1. 适配器工厂接口

```typescript
/**
 * @interface IDatabaseAdapterFactory
 * @description 数据库适配器工厂接口
 */
export interface IDatabaseAdapterFactory {
  /**
   * @method createAdapter
   * @description 创建数据库适配器
   * @param {string} [tenantId] 租户ID，可选
   * @param {string} [databaseType] 数据库类型，可选
   * @returns {IDatabaseAdapter} 数据库适配器实例
   */
  createAdapter(tenantId?: string, databaseType?: string): IDatabaseAdapter;

  /**
   * @method createPostgreSQLAdapter
   * @description 创建PostgreSQL适配器
   * @param {string} [tenantId] 租户ID，可选
   * @returns {IDatabaseAdapter} PostgreSQL适配器实例
   */
  createPostgreSQLAdapter(tenantId?: string): IDatabaseAdapter;

  /**
   * @method createMongoDBAdapter
   * @description 创建MongoDB适配器
   * @param {string} [tenantId] 租户ID，可选
   * @returns {IDatabaseAdapter} MongoDB适配器实例
   */
  createMongoDBAdapter(tenantId?: string): IDatabaseAdapter;
}
```

### 2. 适配器工厂实现

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
 */
@Injectable()
export class DatabaseAdapterFactory implements IDatabaseAdapterFactory {
  constructor(
    private readonly isolationConfig: IsolationConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: PinoLoggerService,
  ) {}

  /**
   * @method createAdapter
   * @description 根据隔离策略创建数据库适配器
   * @param {string} [tenantId] 租户ID，可选
   * @param {string} [databaseType] 数据库类型，可选
   * @returns {IDatabaseAdapter} 数据库适配器实例
   * @throws {UnsupportedIsolationStrategyError} 当隔离策略不支持时抛出
   */
  createAdapter(tenantId?: string, databaseType?: string): IDatabaseAdapter {
    const strategy = this.isolationConfig.getStrategy();
    const connectionConfig = this.isolationConfig.getConnectionConfig(tenantId);
    const dbType = databaseType || 'postgresql';

    switch (dbType) {
      case 'postgresql':
        return this.createPostgreSQLAdapter(tenantId);
      case 'mongodb':
        return this.createMongoDBAdapter(tenantId);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  /**
   * @method createPostgreSQLAdapter
   * @description 创建PostgreSQL适配器
   * @param {string} [tenantId] 租户ID，可选
   * @returns {IDatabaseAdapter} PostgreSQL适配器实例
   */
  createPostgreSQLAdapter(tenantId?: string): IDatabaseAdapter {
    const strategy = this.isolationConfig.getStrategy();
    const connectionConfig = this.isolationConfig.getConnectionConfig(tenantId);

    switch (strategy) {
      case IsolationStrategy.DATABASE_LEVEL:
        return this.createDatabaseLevelPostgreSQLAdapter(connectionConfig);
      case IsolationStrategy.SCHEMA_LEVEL:
        return this.createSchemaLevelPostgreSQLAdapter(connectionConfig);
      case IsolationStrategy.TABLE_LEVEL:
        return this.createTableLevelPostgreSQLAdapter(connectionConfig);
      default:
        throw new Error(`Unsupported isolation strategy: ${String(strategy)}`);
    }
  }

  /**
   * @method createMongoDBAdapter
   * @description 创建MongoDB适配器
   * @param {string} [tenantId] 租户ID，可选
   * @returns {IDatabaseAdapter} MongoDB适配器实例
   */
  createMongoDBAdapter(tenantId?: string): IDatabaseAdapter {
    const strategy = this.isolationConfig.getStrategy();
    const connectionConfig = this.isolationConfig.getConnectionConfig(tenantId);

    switch (strategy) {
      case IsolationStrategy.DATABASE_LEVEL:
        return this.createDatabaseLevelMongoDBAdapter(connectionConfig);
      case IsolationStrategy.COLLECTION_LEVEL:
        return this.createCollectionLevelMongoDBAdapter(connectionConfig);
      default:
        throw new Error(`Unsupported isolation strategy: ${String(strategy)}`);
    }
  }

  /**
   * @method createDatabaseLevelPostgreSQLAdapter
   * @description 创建数据库级隔离的PostgreSQL适配器
   * @param {object} connectionConfig 连接配置
   * @returns {IDatabaseAdapter} PostgreSQL适配器
   * @private
   */
  private createDatabaseLevelPostgreSQLAdapter(connectionConfig: {
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
      `postgresql-${connectionConfig.tenantId}`,
      this.eventEmitter,
      this.logger,
    );
  }

  /**
   * @method createSchemaLevelPostgreSQLAdapter
   * @description 创建Schema级隔离的PostgreSQL适配器
   * @param {object} connectionConfig 连接配置
   * @returns {IDatabaseAdapter} PostgreSQL适配器
   * @private
   */
  private createSchemaLevelPostgreSQLAdapter(connectionConfig: {
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
      pool: this.isolationConfig.getPoolConfig(),
    };

    const adapter = new PostgreSQLAdapter(
      config,
      `postgresql-schema-${connectionConfig.tenantId}`,
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
   * @method createTableLevelPostgreSQLAdapter
   * @description 创建表级隔离的PostgreSQL适配器
   * @param {object} connectionConfig 连接配置
   * @returns {IDatabaseAdapter} PostgreSQL适配器
   * @private
   */
  private createTableLevelPostgreSQLAdapter(connectionConfig: {
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
      'postgresql-table-level',
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

  /**
   * @method createDatabaseLevelMongoDBAdapter
   * @description 创建数据库级隔离的MongoDB适配器
   * @param {object} connectionConfig 连接配置
   * @returns {IDatabaseAdapter} MongoDB适配器
   * @private
   */
  private createDatabaseLevelMongoDBAdapter(connectionConfig: {
    database: string;
    tenantId?: string;
  }): IDatabaseAdapter {
    const config: DatabaseConfig = {
      type: 'mongodb',
      host: this.isolationConfig.getHost(),
      port: this.isolationConfig.getPort(),
      username: this.isolationConfig.getUsername(),
      password: this.isolationConfig.getPassword(),
      database: connectionConfig.database,
    };

    return new MongoDBAdapter(
      config,
      `mongodb-${connectionConfig.tenantId}`,
      this.eventEmitter,
      this.logger,
    );
  }

  /**
   * @method createCollectionLevelMongoDBAdapter
   * @description 创建集合级隔离的MongoDB适配器
   * @param {object} connectionConfig 连接配置
   * @returns {IDatabaseAdapter} MongoDB适配器
   * @private
   */
  private createCollectionLevelMongoDBAdapter(connectionConfig: {
    database: string;
    tenantId?: string;
  }): IDatabaseAdapter {
    const config: DatabaseConfig = {
      type: 'mongodb',
      host: this.isolationConfig.getHost(),
      port: this.isolationConfig.getPort(),
      username: this.isolationConfig.getUsername(),
      password: this.isolationConfig.getPassword(),
      database: connectionConfig.database,
    };

    const adapter = new MongoDBAdapter(
      config,
      'mongodb-collection-level',
      this.eventEmitter,
      this.logger,
    );

    // 设置租户上下文
    if (connectionConfig.tenantId) {
      adapter.setTenantContext(connectionConfig.tenantId);
    }

    return adapter;
  }
}
```

## 多租户支持

### 1. 租户上下文管理

```typescript
/**
 * @class TenantContextManager
 * @description 租户上下文管理器，管理当前请求的租户上下文
 *
 * 管理器职责：
 * 1. 管理当前请求的租户ID
 * 2. 提供租户上下文的设置和获取
 * 3. 支持租户上下文的清理
 * 4. 确保线程安全的租户上下文管理
 */
@Injectable()
export class TenantContextManager {
  private static instance: TenantContextManager;
  private currentTenantId?: string;

  static getInstance(): TenantContextManager {
    if (!TenantContextManager.instance) {
      TenantContextManager.instance = new TenantContextManager();
    }
    return TenantContextManager.instance;
  }

  /**
   * @method setTenantId
   * @description 设置当前租户ID
   * @param {string} tenantId 租户ID
   */
  setTenantId(tenantId: string): void {
    this.currentTenantId = tenantId;
  }

  /**
   * @method getTenantId
   * @description 获取当前租户ID
   * @returns {string | undefined} 租户ID
   */
  getTenantId(): string | undefined {
    return this.currentTenantId;
  }

  /**
   * @method clearTenantId
   * @description 清除当前租户ID
   */
  clearTenantId(): void {
    this.currentTenantId = undefined;
  }
}
```

### 2. 租户感知适配器装饰器

```typescript
/**
 * @class TenantAwareAdapter
 * @description 租户感知适配器装饰器，自动处理租户上下文
 *
 * 装饰器职责：
 * 1. 自动设置租户上下文
 * 2. 委托所有操作到基础适配器
 * 3. 提供透明的租户隔离
 * 4. 支持租户上下文的自动管理
 */
@Injectable()
export class TenantAwareAdapter implements IDatabaseAdapter {
  constructor(
    private readonly baseAdapter: IDatabaseAdapter,
    private readonly tenantContextManager: TenantContextManager,
  ) {}

  /**
   * @method query
   * @description 执行查询，自动设置租户上下文
   * @param {string} sql SQL语句
   * @param {unknown[]} params 查询参数
   * @param {Record<string, unknown>} options 查询选项
   * @returns {Promise<QueryResult<T>>} 查询结果
   */
  async query<T = any>(
    sql: string,
    params: unknown[] = [],
    options: Record<string, unknown> = {},
  ): Promise<QueryResult<T>> {
    const tenantId = this.tenantContextManager.getTenantId();
    if (tenantId) {
      this.baseAdapter.setTenantContext(tenantId);
    }

    return this.baseAdapter.query<T>(sql, params, options);
  }

  /**
   * @method execute
   * @description 执行更新，自动设置租户上下文
   * @param {string} sql SQL语句
   * @param {unknown[]} params 查询参数
   * @param {Record<string, unknown>} options 执行选项
   * @returns {Promise<QueryResult<T>>} 执行结果
   */
  async execute<T = any>(
    sql: string,
    params: unknown[] = [],
    options: Record<string, unknown> = {},
  ): Promise<QueryResult<T>> {
    const tenantId = this.tenantContextManager.getTenantId();
    if (tenantId) {
      this.baseAdapter.setTenantContext(tenantId);
    }

    return this.baseAdapter.execute<T>(sql, params, options);
  }

  // 委托其他方法到基础适配器
  get name(): string {
    return this.baseAdapter.name;
  }
  get type(): string {
    return this.baseAdapter.type;
  }
  get isConnected(): boolean {
    return this.baseAdapter.isConnected;
  }
  get config(): DatabaseConfig {
    return this.baseAdapter.config;
  }
  get eventEmitter(): EventEmitter2 {
    return this.baseAdapter.eventEmitter;
  }

  async connect(): Promise<void> {
    return this.baseAdapter.connect();
  }
  async disconnect(): Promise<void> {
    return this.baseAdapter.disconnect();
  }
  async transaction<T>(
    callback: (adapter: IDatabaseAdapter) => Promise<T>,
  ): Promise<T> {
    return this.baseAdapter.transaction(callback);
  }
  async getHealth(): Promise<HealthStatus> {
    return this.baseAdapter.getHealth();
  }
  async getStats(): Promise<DatabaseStats> {
    return this.baseAdapter.getStats();
  }
  async resetStats(): Promise<void> {
    return this.baseAdapter.resetStats();
  }
  async getConnection(): Promise<any> {
    return this.baseAdapter.getConnection();
  }
  async ping(): Promise<boolean> {
    return this.baseAdapter.ping();
  }

  setTenantContext(tenantId: string): void {
    this.baseAdapter.setTenantContext(tenantId);
  }
  getTenantContext(): string | undefined {
    return this.baseAdapter.getTenantContext();
  }
  setDefaultSchema(schemaName: string): void {
    this.baseAdapter.setDefaultSchema(schemaName);
  }
  getDefaultSchema(): string | undefined {
    return this.baseAdapter.getDefaultSchema();
  }
  async enableRowLevelSecurity(): Promise<void> {
    return this.baseAdapter.enableRowLevelSecurity();
  }
  async disableRowLevelSecurity(): Promise<void> {
    return this.baseAdapter.disableRowLevelSecurity();
  }
  async isRowLevelSecurityEnabled(): Promise<boolean> {
    return this.baseAdapter.isRowLevelSecurityEnabled();
  }
}
```

## 使用示例

### 1. 基本使用

```typescript
/**
 * @class DatabaseService
 * @description 数据库服务，演示适配器的基本使用
 */
@Injectable()
export class DatabaseService {
  constructor(
    private readonly adapterFactory: IDatabaseAdapterFactory,
    private readonly tenantContextManager: TenantContextManager,
  ) {}

  /**
   * @method getUsers
   * @description 获取用户列表
   * @param {string} tenantId 租户ID
   * @returns {Promise<User[]>} 用户列表
   */
  async getUsers(tenantId: string): Promise<User[]> {
    // 设置租户上下文
    this.tenantContextManager.setTenantId(tenantId);

    // 创建适配器
    const adapter = this.adapterFactory.createAdapter(tenantId);

    // 执行查询
    const result = await adapter.query('SELECT * FROM users');
    return result.rows;
  }

  /**
   * @method getUsersFromMongoDB
   * @description 从MongoDB获取用户列表
   * @param {string} tenantId 租户ID
   * @returns {Promise<User[]>} 用户列表
   */
  async getUsersFromMongoDB(tenantId: string): Promise<User[]> {
    // 设置租户上下文
    this.tenantContextManager.setTenantId(tenantId);

    // 创建MongoDB适配器
    const adapter = this.adapterFactory.createMongoDBAdapter(tenantId);

    // 执行查询
    const result = await adapter.query('users', {});
    return result.rows;
  }
}
```

### 2. 事务使用

```typescript
/**
 * @class UserService
 * @description 用户服务，演示事务的使用
 */
@Injectable()
export class UserService {
  constructor(
    private readonly adapterFactory: IDatabaseAdapterFactory,
    private readonly tenantContextManager: TenantContextManager,
  ) {}

  /**
   * @method createUserWithProfile
   * @description 创建用户和用户资料（事务）
   * @param {string} tenantId 租户ID
   * @param {any} userData 用户数据
   * @param {any} profileData 用户资料数据
   * @returns {Promise<User>} 创建的用户
   */
  async createUserWithProfile(
    tenantId: string,
    userData: any,
    profileData: any,
  ): Promise<User> {
    // 设置租户上下文
    this.tenantContextManager.setTenantId(tenantId);

    // 创建适配器
    const adapter = this.adapterFactory.createAdapter(tenantId);

    return await adapter.transaction(async txAdapter => {
      // 创建用户
      const userResult = await txAdapter.execute(
        'INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *',
        [userData.email, userData.name],
      );

      const user = userResult.rows[0];

      // 创建用户资料
      await txAdapter.execute(
        'INSERT INTO user_profiles (user_id, bio, avatar) VALUES ($1, $2, $3)',
        [user.id, profileData.bio, profileData.avatar],
      );

      return user;
    });
  }
}
```

### 3. 跨租户查询

```typescript
/**
 * @class AnalyticsService
 * @description 分析服务，演示跨租户查询
 */
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly adapterFactory: IDatabaseAdapterFactory,
    private readonly isolationConfig: IsolationConfigService,
  ) {}

  /**
   * @method getPlatformStatistics
   * @description 获取平台统计信息
   * @returns {Promise<PlatformStats>} 平台统计信息
   */
  async getPlatformStatistics(): Promise<PlatformStats> {
    // 使用平台级适配器（不指定租户ID）
    const adapter = this.adapterFactory.createAdapter();

    const result = await adapter.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(DISTINCT tenant_id) as total_tenants
      FROM users
    `);

    return result.rows[0];
  }

  /**
   * @method getTenantStatistics
   * @description 获取租户统计信息
   * @param {string} tenantId 租户ID
   * @returns {Promise<TenantStats>} 租户统计信息
   */
  async getTenantStatistics(tenantId: string): Promise<TenantStats> {
    // 使用租户特定适配器
    const adapter = this.adapterFactory.createAdapter(tenantId);

    const result = await adapter.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users
      FROM users
    `);

    return result.rows[0];
  }
}
```

### 4. 动态切换隔离策略

```typescript
/**
 * @class IsolationStrategyService
 * @description 隔离策略服务，演示动态切换隔离策略
 */
@Injectable()
export class IsolationStrategyService {
  constructor(
    private readonly isolationConfig: IsolationConfigService,
    private readonly adapterFactory: IDatabaseAdapterFactory,
  ) {}

  /**
   * @method switchToDatabaseLevel
   * @description 切换到数据库级隔离策略
   * @returns {Promise<void>}
   */
  async switchToDatabaseLevel(): Promise<void> {
    // 在运行时切换隔离策略
    process.env.DATA_ISOLATION_STRATEGY = 'database_level';

    // 重新加载配置
    await this.isolationConfig.reloadConfig();

    // 创建新的适配器
    const newAdapter = this.adapterFactory.createAdapter('tenant-123');
    await newAdapter.connect();
  }

  /**
   * @method switchToSchemaLevel
   * @description 切换到Schema级隔离策略
   * @returns {Promise<void>}
   */
  async switchToSchemaLevel(): Promise<void> {
    process.env.DATA_ISOLATION_STRATEGY = 'schema_level';
    await this.isolationConfig.reloadConfig();
  }

  /**
   * @method switchToTableLevel
   * @description 切换到表级隔离策略
   * @returns {Promise<void>}
   */
  async switchToTableLevel(): Promise<void> {
    process.env.DATA_ISOLATION_STRATEGY = 'table_level';
    await this.isolationConfig.reloadConfig();
  }
}
```

### 5. 租户感知仓储使用示例

```typescript
/**
 * @class UserRepository
 * @description 用户仓储，演示租户感知仓储的使用
 */
export class UserRepository extends TenantAwareRepository<User> {
  constructor(
    adapterFactory: DatabaseAdapterFactory,
    isolationConfig: IsolationConfigService,
    tenantId?: string,
  ) {
    super(adapterFactory, isolationConfig, tenantId);
  }

  protected getTableName(): string {
    return 'users';
  }

  protected mapRowToEntity(row: any): User {
    return new User(row.id, row.email, row.name, row.status, row.tenant_id);
  }

  /**
   * @method findByEmail
   * @description 根据邮箱查找用户
   * @param {string} email 邮箱地址
   * @returns {Promise<User | null>} 用户或null
   */
  async findByEmail(email: string): Promise<User | null> {
    let query = `SELECT * FROM ${this.getTableName()} WHERE email = $1`;
    query = this.addIsolationConditions(query);

    const result = await this.adapter.query(query, [email]);
    return result.rows.length > 0 ? this.mapRowToEntity(result.rows[0]) : null;
  }

  /**
   * @method findActiveUsers
   * @description 查找活跃用户
   * @returns {Promise<User[]>} 活跃用户列表
   */
  async findActiveUsers(): Promise<User[]> {
    let query = `SELECT * FROM ${this.getTableName()} WHERE status = 'active'`;
    query = this.addIsolationConditions(query);

    const result = await this.adapter.query(query);
    return result.rows.map(row => this.mapRowToEntity(row));
  }
}

/**
 * @class UserService
 * @description 用户服务，演示租户感知仓储的使用
 */
@Injectable()
export class UserService {
  constructor(
    private readonly adapterFactory: DatabaseAdapterFactory,
    private readonly isolationConfig: IsolationConfigService,
  ) {}

  /**
   * @method getUsers
   * @description 获取用户列表
   * @param {string} tenantId 租户ID
   * @returns {Promise<User[]>} 用户列表
   */
  async getUsers(tenantId: string): Promise<User[]> {
    const userRepo = new UserRepository(
      this.adapterFactory,
      this.isolationConfig,
      tenantId,
    );

    return await userRepo.findAll();
  }

  /**
   * @method createUser
   * @description 创建用户
   * @param {string} tenantId 租户ID
   * @param {CreateUserDto} userData 用户数据
   * @returns {Promise<User>} 创建的用户
   */
  async createUser(tenantId: string, userData: CreateUserDto): Promise<User> {
    const userRepo = new UserRepository(
      this.adapterFactory,
      this.isolationConfig,
      tenantId,
    );

    return await userRepo.create({
      email: userData.email,
      name: userData.name,
      status: 'active',
    });
  }
}
```

## 扩展支持

### 1. 添加新的数据库类型

```typescript
/**
 * @class MySQLAdapter
 * @description MySQL数据库适配器
 */
export class MySQLAdapter implements IDatabaseAdapter {
  // 实现IDatabaseAdapter接口的所有方法
  // 具体实现类似PostgreSQLAdapter
}

/**
 * @class RedisAdapter
 * @description Redis数据库适配器
 */
export class RedisAdapter implements IDatabaseAdapter {
  // 实现IDatabaseAdapter接口的所有方法
  // 针对Redis的特殊实现
}
```

### 2. 扩展适配器工厂

```typescript
export class DatabaseAdapterFactory {
  createAdapter(tenantId?: string, databaseType?: string): IDatabaseAdapter {
    const strategy = this.isolationConfig.getStrategy();
    const connectionConfig = this.isolationConfig.getConnectionConfig(tenantId);
    const dbType = databaseType || 'postgresql';

    switch (dbType) {
      case 'postgresql':
        return this.createPostgreSQLAdapter(tenantId);
      case 'mysql':
        return this.createMySQLAdapter(tenantId);
      case 'mongodb':
        return this.createMongoDBAdapter(tenantId);
      case 'redis':
        return this.createRedisAdapter(tenantId);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  private createMySQLAdapter(tenantId?: string): IDatabaseAdapter {
    // MySQL适配器创建逻辑
  }

  private createRedisAdapter(tenantId?: string): IDatabaseAdapter {
    // Redis适配器创建逻辑
  }
}
```

## 最佳实践

### 1. 连接管理

- 使用连接池管理数据库连接
- 实现连接健康检查
- 监控连接使用情况
- 正确处理连接异常

### 2. 性能优化

- 使用参数化查询防止SQL注入
- 实现查询缓存机制
- 监控查询性能
- 优化数据库索引

### 3. 错误处理

- 实现完整的错误处理机制
- 记录详细的错误日志
- 提供有意义的错误信息
- 实现重试机制

### 4. 监控和日志

- 记录所有数据库操作
- 监控数据库性能指标
- 设置性能告警
- 跟踪租户数据访问

### 5. 多租户数据隔离最佳实践

#### 5.1 配置管理

- 使用环境变量进行配置
- 提供合理的默认值
- 支持配置热重载
- 记录配置变更日志

#### 5.2 性能优化

- 为tenant_id字段创建索引
- 使用连接池管理数据库连接
- 实现查询缓存机制
- 监控数据库性能指标

#### 5.3 安全考虑

- 实施严格的权限控制
- 使用参数化查询防止SQL注入
- 启用行级安全策略
- 定期审计数据访问

#### 5.4 监控和日志

- 记录所有数据库操作
- 监控隔离策略的执行情况
- 设置性能告警
- 跟踪跨租户数据访问

#### 5.5 隔离策略选择指南

**选择数据库级隔离的场景**：

- 对数据隔离要求极高
- 需要租户特定的数据库配置
- 有足够的资源支持
- 需要独立的备份和恢复

**选择Schema级隔离的场景**：

- 需要良好的数据隔离
- 资源有限但需要隔离
- 需要支持跨租户查询
- 管理复杂度要求适中

**选择表级隔离的场景**：

- 资源有限
- 需要最高的性能
- 管理复杂度要求最低
- 可以接受相对较低的隔离性

#### 5.6 迁移策略

**从表级到Schema级**：

1. 创建租户特定的Schema
2. 迁移数据到对应Schema
3. 更新应用程序配置
4. 验证数据完整性

**从Schema级到数据库级**：

1. 创建租户特定的数据库
2. 迁移Schema到新数据库
3. 更新连接配置
4. 验证数据完整性

**从数据库级到表级**：

1. 合并所有租户数据
2. 添加tenant_id字段
3. 更新应用程序逻辑
4. 验证数据完整性

## 总结

Aiofix平台的适配器模式设计具有以下特点：

### 1. 核心设计特点

1. **统一接口**：所有数据库适配器实现相同的接口
2. **多租户支持**：自动处理多租户数据隔离
3. **配置驱动**：通过配置动态选择隔离策略
4. **扩展友好**：支持新数据库类型的扩展
5. **性能优化**：支持连接池、缓存等优化策略
6. **事务支持**：提供完整的事务管理能力
7. **监控完善**：提供全面的监控和日志功能

### 2. 数据库隔离策略特点

1. **配置驱动**：通过环境变量动态切换隔离策略
2. **代码无侵入**：业务代码无需关心具体的隔离实现
3. **灵活扩展**：支持新的隔离策略扩展
4. **性能优化**：针对不同策略进行性能优化
5. **安全可靠**：提供多层安全保护机制

### 3. 隔离策略对比

| 策略     | 隔离级别 | 性能 | 成本 | 适用场景                 |
| -------- | -------- | ---- | ---- | ------------------------ |
| 数据库级 | 完全隔离 | 高   | 高   | 大型企业，严格合规要求   |
| Schema级 | 中等隔离 | 中   | 中   | 中型企业，平衡性能与隔离 |
| 表级     | 共享隔离 | 低   | 低   | 小型企业，成本敏感场景   |

### 4. 架构优势

- ✅ **统一抽象**：通过适配器模式统一不同数据库的访问接口
- ✅ **多租户支持**：自动处理租户数据隔离，无需业务代码关心
- ✅ **配置驱动**：通过配置动态切换隔离策略，无需修改代码
- ✅ **扩展友好**：支持新数据库类型和隔离策略的扩展
- ✅ **性能优化**：支持连接池、缓存、索引等优化策略
- ✅ **事务支持**：提供完整的事务管理能力
- ✅ **监控完善**：提供全面的监控和日志功能
- ✅ **安全可靠**：提供多层安全保护机制

### 5. 适用场景

**适配器模式适用于**：

- 需要支持多种数据库类型的系统
- 需要统一数据库访问接口的项目
- 需要动态切换数据库的场景
- 需要抽象数据库操作细节的应用

**数据库隔离策略适用于**：

- 多租户SaaS平台
- 需要数据隔离的企业应用
- 需要灵活隔离策略的系统
- 需要支持不同租户需求的平台

这种设计既满足了多租户SaaS平台的需求，又保持了系统的灵活性和可扩展性，为项目提供了强大的数据库访问抽象和多租户支持能力。

---

**文档版本**: 1.0  
**创建日期**: 2024-01-01  
**维护者**: 项目开发团队
