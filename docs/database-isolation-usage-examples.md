# 数据库隔离策略使用示例

## 概述

本文档展示了如何通过配置来切换不同的数据库隔离策略，而无需修改代码。我们的架构支持三种隔离模式：数据库级、Schema级和表级隔离。

## 配置驱动的隔离策略

### 1. 表级隔离（默认）

**环境变量配置**：

```bash
# 表级隔离配置
DATA_ISOLATION_STRATEGY=table_level
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
ENABLE_RLS=true
TENANT_ID_FIELD=tenant_id
AUTO_ADD_TENANT_CONDITION=true
```

**使用示例**：

```typescript
import {
  IsolationConfigService,
  DatabaseAdapterFactory,
  TenantAwareRepository,
} from '@aiofix/database';

// 创建配置服务
const isolationConfig = new IsolationConfigService(configService);
const adapterFactory = new DatabaseAdapterFactory(isolationConfig);

// 创建租户感知的仓储
class UserRepository extends TenantAwareRepository<User> {
  protected getTableName(): string {
    return 'users';
  }
}

// 使用仓储
const userRepo = new UserRepository(
  adapterFactory,
  isolationConfig,
  'tenant-123',
);

// 查询会自动添加 tenant_id 条件
const users = await userRepo.findAll(); // SELECT * FROM users WHERE tenant_id = 'tenant-123'
```

### 2. 数据库级隔离

**环境变量配置**：

```bash
# 数据库级隔离配置
DATA_ISOLATION_STRATEGY=database_level
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
TENANT_DB_PREFIX=aiofix_tenant_
PLATFORM_DB_NAME=aiofix_platform
```

**使用示例**：

```typescript
// 相同的代码，不同的配置
const isolationConfig = new IsolationConfigService(configService);
const adapterFactory = new DatabaseAdapterFactory(isolationConfig);

// 创建租户感知的仓储
const userRepo = new UserRepository(
  adapterFactory,
  isolationConfig,
  'tenant-123',
);

// 查询会自动连接到租户专用数据库
const users = await userRepo.findAll(); // 连接到 aiofix_tenant_123 数据库
```

### 3. Schema级隔离

**环境变量配置**：

```bash
# Schema级隔离配置
DATA_ISOLATION_STRATEGY=schema_level
DEFAULT_TENANT_ID=00000000-0000-0000-0000-000000000001
TENANT_SCHEMA_PREFIX=tenant_
SHARED_SCHEMA_NAME=shared
```

**使用示例**：

```typescript
// 相同的代码，不同的配置
const isolationConfig = new IsolationConfigService(configService);
const adapterFactory = new DatabaseAdapterFactory(isolationConfig);

// 创建租户感知的仓储
const userRepo = new UserRepository(
  adapterFactory,
  isolationConfig,
  'tenant-123',
);

// 查询会自动使用租户专用Schema
const users = await userRepo.findAll(); // 使用 tenant_123.users 表
```

## 实际应用示例

### 1. 用户管理服务

```typescript
import { Injectable } from '@nestjs/common';
import {
  IsolationConfigService,
  DatabaseAdapterFactory,
  TenantAwareRepository,
} from '@aiofix/database';

interface User {
  id: string;
  tenant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class UserRepository extends TenantAwareRepository<User> {
  protected getTableName(): string {
    return 'users';
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `SELECT * FROM ${this.getTableName()} WHERE email = $1`;
    const modifiedQuery = this.addIsolationConditions(query);
    return await this.adapter.queryOne(modifiedQuery, [email]);
  }

  async findActiveUsers(): Promise<User[]> {
    const query = `SELECT * FROM ${this.getTableName()} WHERE status = 'ACTIVE'`;
    const modifiedQuery = this.addIsolationConditions(query);
    return await this.adapter.query(modifiedQuery);
  }
}

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly isolationConfig: IsolationConfigService,
  ) {}

  async createUser(tenantId: string, userData: Partial<User>): Promise<User> {
    // 创建特定租户的仓储实例
    const tenantRepo =
      this.userRepository.createTenantSpecificRepository(tenantId);
    return await tenantRepo.create(userData);
  }

  async getUsers(tenantId: string): Promise<User[]> {
    const tenantRepo =
      this.userRepository.createTenantSpecificRepository(tenantId);
    return await tenantRepo.findAll();
  }

  async getUserById(tenantId: string, userId: string): Promise<User | null> {
    const tenantRepo =
      this.userRepository.createTenantSpecificRepository(tenantId);
    return await tenantRepo.findById(userId);
  }
}
```

### 2. 通知管理服务

```typescript
@Injectable()
export class NotificationRepository extends TenantAwareRepository<Notification> {
  protected getTableName(): string {
    return 'notifications';
  }

  async findByUser(userId: string): Promise<Notification[]> {
    const query = `SELECT * FROM ${this.getTableName()} WHERE user_id = $1`;
    const modifiedQuery = this.addIsolationConditions(query);
    return await this.adapter.query(modifiedQuery, [userId]);
  }

  async findPendingNotifications(): Promise<Notification[]> {
    const query = `SELECT * FROM ${this.getTableName()} WHERE status = 'PENDING'`;
    const modifiedQuery = this.addIsolationConditions(query);
    return await this.adapter.query(modifiedQuery);
  }
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly isolationConfig: IsolationConfigService,
  ) {}

  async sendNotification(
    tenantId: string,
    notification: Partial<Notification>,
  ): Promise<Notification> {
    const tenantRepo =
      this.notificationRepository.createTenantSpecificRepository(tenantId);
    return await tenantRepo.create(notification);
  }

  async getNotifications(
    tenantId: string,
    userId: string,
  ): Promise<Notification[]> {
    const tenantRepo =
      this.notificationRepository.createTenantSpecificRepository(tenantId);
    return await tenantRepo.findByUser(userId);
  }
}
```

### 3. 跨租户查询服务

```typescript
@Injectable()
export class CrossTenantService {
  constructor(
    private readonly adapterFactory: DatabaseAdapterFactory,
    private readonly isolationConfig: IsolationConfigService,
  ) {}

  async getPlatformStatistics(): Promise<PlatformStats> {
    // 使用平台级适配器进行跨租户查询
    const platformAdapter = this.adapterFactory.createPlatformAdapter();

    // 临时禁用RLS进行跨租户查询
    await platformAdapter.query('SET row_security = off');

    const result = await platformAdapter.query(`
      SELECT 
        t.name as tenant_name,
        COUNT(u.id) as user_count,
        COUNT(n.id) as notification_count
      FROM tenants t
      LEFT JOIN users u ON t.id = u.tenant_id
      LEFT JOIN notifications n ON t.id = n.tenant_id
      GROUP BY t.id, t.name
    `);

    // 重新启用RLS
    await platformAdapter.query('SET row_security = on');

    return result;
  }

  async migrateTenantData(
    fromTenantId: string,
    toTenantId: string,
  ): Promise<void> {
    const fromAdapter = this.adapterFactory.createAdapter(fromTenantId);
    const toAdapter = this.adapterFactory.createAdapter(toTenantId);

    // 获取源租户数据
    const users = await fromAdapter.query('SELECT * FROM users');
    const organizations = await fromAdapter.query(
      'SELECT * FROM organizations',
    );

    // 迁移到目标租户
    for (const user of users) {
      user.tenant_id = toTenantId;
      await toAdapter.queryOne(
        'INSERT INTO users (id, tenant_id, email, first_name, last_name, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          user.id,
          user.tenant_id,
          user.email,
          user.first_name,
          user.last_name,
          user.status,
          user.created_at,
          user.updated_at,
        ],
      );
    }
  }
}
```

## 配置切换示例

### 开发环境配置

```bash
# .env.development
DATA_ISOLATION_STRATEGY=table_level
ENABLE_RLS=false
AUTO_ADD_TENANT_CONDITION=true
```

### 测试环境配置

```bash
# .env.test
DATA_ISOLATION_STRATEGY=database_level
TENANT_DB_PREFIX=test_tenant_
```

### 生产环境配置

```bash
# .env.production
DATA_ISOLATION_STRATEGY=table_level
ENABLE_RLS=true
AUTO_ADD_TENANT_CONDITION=true
```

## 动态配置切换

```typescript
@Injectable()
export class IsolationConfigManager {
  constructor(
    private readonly isolationConfig: IsolationConfigService,
    private readonly adapterFactory: DatabaseAdapterFactory,
  ) {}

  async switchIsolationStrategy(strategy: IsolationStrategy): Promise<void> {
    // 更新环境变量
    process.env.DATA_ISOLATION_STRATEGY = strategy;

    // 重新加载配置
    this.isolationConfig.loadConfig();

    // 通知所有服务重新初始化适配器
    this.eventEmitter.emit('isolation.strategy.changed', { strategy });
  }

  async getCurrentStrategy(): Promise<IsolationStrategy> {
    return this.isolationConfig.getStrategy();
  }

  async validateStrategy(strategy: IsolationStrategy): Promise<boolean> {
    // 验证策略是否支持当前环境
    const config = this.isolationConfig.getConfig();
    config.strategy = strategy;

    return this.isolationConfig.validateConfig();
  }
}
```

## 最佳实践

### 1. 配置验证

```typescript
@Injectable()
export class DatabaseService {
  constructor(
    private readonly isolationConfig: IsolationConfigService,
    private readonly adapterFactory: DatabaseAdapterFactory,
  ) {
    this.validateConfiguration();
  }

  private validateConfiguration(): void {
    if (!this.isolationConfig.validateConfig()) {
      throw new Error('Invalid database isolation configuration');
    }
  }
}
```

### 2. 错误处理

```typescript
@Injectable()
export class TenantAwareService {
  constructor(
    private readonly isolationConfig: IsolationConfigService,
    private readonly adapterFactory: DatabaseAdapterFactory,
  ) {}

  async executeWithTenantContext<T>(
    tenantId: string,
    operation: (adapter: IDatabaseAdapter) => Promise<T>,
  ): Promise<T> {
    try {
      const adapter = this.adapterFactory.createAdapter(tenantId);
      return await operation(adapter);
    } catch (error) {
      if (error.code === '42P01') {
        // 表不存在
        throw new Error(
          `Table not found for tenant ${tenantId}. Please check isolation strategy configuration.`,
        );
      }
      throw error;
    }
  }
}
```

### 3. 性能监控

```typescript
@Injectable()
export class IsolationPerformanceMonitor {
  constructor(private readonly isolationConfig: IsolationConfigService) {}

  async measureQueryPerformance<T>(
    tenantId: string,
    query: () => Promise<T>,
  ): Promise<{ result: T; executionTime: number }> {
    const startTime = Date.now();

    try {
      const result = await query();
      const executionTime = Date.now() - startTime;

      // 记录性能指标
      this.logPerformanceMetrics(tenantId, executionTime);

      return { result, executionTime };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logErrorMetrics(tenantId, executionTime, error);
      throw error;
    }
  }

  private logPerformanceMetrics(tenantId: string, executionTime: number): void {
    console.log(
      `Query executed for tenant ${tenantId} in ${executionTime}ms using ${this.isolationConfig.getStrategy()} isolation`,
    );
  }
}
```

## 总结

通过配置驱动的隔离策略，我们可以：

1. **无需修改代码**：只需更改环境变量即可切换隔离策略
2. **灵活部署**：不同环境可以使用不同的隔离策略
3. **渐进式迁移**：可以从表级隔离逐步迁移到数据库级隔离
4. **性能优化**：根据实际需求选择最适合的隔离策略
5. **维护简单**：统一的代码库，减少维护成本

这种设计使得我们的系统具有很好的灵活性和可扩展性，能够适应不同规模和需求的多租户应用场景。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
