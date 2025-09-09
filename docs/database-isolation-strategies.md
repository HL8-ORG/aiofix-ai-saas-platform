# 数据库隔离策略指南

## 概述

本文档详细介绍了Aiofix AI SaaS平台支持的多租户数据隔离策略，包括不同隔离模式的优缺点、实现方式和使用场景。平台默认采用**表级隔离**策略，在保证数据安全的同时提供最佳的性能和可维护性。

## 隔离策略对比

### 1. 数据库级隔离 (Database-Level Isolation)

**架构描述**：每个租户使用独立的数据库实例

```
PostgreSQL
├── aiofix_tenant_1 (租户1数据库)
├── aiofix_tenant_2 (租户2数据库)
├── aiofix_tenant_3 (租户3数据库)
└── aiofix_platform (平台数据库)
```

**优点**：

- ✅ **强隔离**：数据完全隔离，安全性最高
- ✅ **性能隔离**：租户间查询互不影响
- ✅ **备份灵活**：可单独备份特定租户数据
- ✅ **扩展性好**：可为不同租户分配不同资源
- ✅ **故障隔离**：一个租户的问题不影响其他租户

**缺点**：

- ❌ **资源消耗大**：每个租户需要独立数据库实例
- ❌ **管理复杂**：需要管理多个数据库
- ❌ **成本较高**：数据库连接数和存储成本增加
- ❌ **跨租户查询困难**：难以进行跨租户数据分析
- ❌ **连接池限制**：受数据库连接数限制

**适用场景**：

- 大型企业客户，对数据隔离要求极高
- 需要完全独立的备份和恢复策略
- 租户数量相对较少（< 100个）
- 对成本不敏感的场景

### 2. Schema级隔离 (Schema-Level Isolation)

**架构描述**：在同一数据库中使用不同的Schema隔离租户数据

```
aiofix_platform
├── tenant_1_schema
│   ├── users
│   ├── organizations
│   └── notifications
├── tenant_2_schema
│   ├── users
│   ├── organizations
│   └── notifications
└── shared_schema
    ├── tenants
    └── platform_config
```

**优点**：

- ✅ **中等隔离**：数据在Schema级别隔离
- ✅ **资源效率**：共享数据库连接池
- ✅ **管理相对简单**：统一数据库管理
- ✅ **成本适中**：比数据库级隔离成本低

**缺点**：

- ❌ **隔离性中等**：Schema级别的隔离
- ❌ **跨租户查询复杂**：需要动态切换Schema
- ❌ **备份复杂**：需要按Schema备份
- ❌ **权限管理复杂**：需要精细的Schema权限控制

**适用场景**：

- 中等规模的多租户应用
- 需要一定隔离性但成本敏感的场景
- 租户数量中等（100-1000个）

### 3. 表级隔离 (Table-Level Isolation) - **默认策略**

**架构描述**：在同一数据库的同一Schema中使用`tenant_id`字段隔离数据

```
aiofix_platform
├── tenants (租户表)
├── users (tenant_id字段)
├── organizations (tenant_id字段)
├── notifications (tenant_id字段)
├── notification_templates (tenant_id字段)
└── platform_configurations (全局配置)
```

**优点**：

- ✅ **资源效率最高**：共享数据库和连接池
- ✅ **管理简单**：统一数据库管理
- ✅ **成本最低**：最小化资源消耗
- ✅ **跨租户查询容易**：支持跨租户数据分析
- ✅ **扩展性好**：支持大量租户（> 1000个）
- ✅ **开发简单**：标准的SQL查询

**缺点**：

- ❌ **隔离性依赖应用层**：需要应用层确保数据隔离
- ❌ **性能影响**：所有查询都需要包含tenant_id条件
- ❌ **备份复杂**：需要按租户过滤数据

**适用场景**：

- 大规模多租户SaaS应用
- 成本敏感的场景
- 需要跨租户数据分析
- 租户数量大（> 1000个）

## 表级隔离实现详解

### 数据库架构

#### 核心表结构

```sql
-- 租户表（全局表）
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户表（包含tenant_id）
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    roles TEXT[] DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 租户内邮箱唯一性约束
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

-- 组织表（包含tenant_id）
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- 租户内组织名称唯一性约束
    CONSTRAINT unique_org_name_per_tenant UNIQUE (tenant_id, name)
);

-- 通知表（包含tenant_id）
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 索引策略

```sql
-- 租户相关索引
CREATE INDEX idx_tenants_domain ON tenants(domain);
CREATE INDEX idx_tenants_status ON tenants(status);

-- 用户相关索引
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_email ON users(tenant_id, email);

-- 组织相关索引
CREATE INDEX idx_organizations_tenant_id ON organizations(tenant_id);
CREATE INDEX idx_organizations_parent_id ON organizations(parent_id);

-- 通知相关索引
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### 行级安全策略 (RLS)

#### RLS函数

```sql
-- 获取当前租户ID的函数
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- 从应用程序上下文中获取当前租户ID
    RETURN current_setting('app.current_tenant_id', true)::UUID;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### RLS策略

```sql
-- 启用行级安全
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY tenant_isolation_policy ON users
    FOR ALL TO aiofix_user
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_policy ON organizations
    FOR ALL TO aiofix_user
    USING (tenant_id = get_current_tenant_id());

CREATE POLICY tenant_isolation_policy ON notifications
    FOR ALL TO aiofix_user
    USING (tenant_id = get_current_tenant_id());
```

### 应用程序集成

#### 设置租户上下文

```typescript
// 在应用程序中设置当前租户ID
async function setTenantContext(tenantId: string) {
  await this.database.query(`SET app.current_tenant_id = '${tenantId}'`);
}

// 在请求处理中设置租户上下文
@Injectable()
export class TenantContextService {
  async setTenantFromRequest(request: Request) {
    const tenantId = this.extractTenantId(request);
    await this.setTenantContext(tenantId);
  }

  private extractTenantId(request: Request): string {
    // 从请求头、子域名或JWT token中提取租户ID
    return (
      request.headers['x-tenant-id'] ||
      this.extractFromSubdomain(request) ||
      this.extractFromJWT(request)
    );
  }
}
```

#### 查询示例

```typescript
// 自动包含tenant_id的查询
async findUsersByTenant(tenantId: string) {
    await this.setTenantContext(tenantId);

    // RLS会自动过滤数据，无需手动添加WHERE条件
    return await this.database.query(`
        SELECT * FROM users
        WHERE status = 'ACTIVE'
        ORDER BY created_at DESC
    `);
}

// 跨租户查询（需要特殊权限）
async findUsersAcrossTenants() {
    // 临时禁用RLS进行跨租户查询
    await this.database.query('SET row_security = off');

    const result = await this.database.query(`
        SELECT t.name as tenant_name, u.email, u.first_name, u.last_name
        FROM users u
        JOIN tenants t ON u.tenant_id = t.id
        WHERE u.status = 'ACTIVE'
    `);

    // 重新启用RLS
    await this.database.query('SET row_security = on');

    return result;
}
```

## 数据隔离最佳实践

### 1. 应用层隔离

```typescript
// 基础仓储类，自动处理租户隔离
export abstract class TenantAwareRepository<T> {
  constructor(
    protected readonly database: DatabaseService,
    protected readonly tenantContext: TenantContextService,
  ) {}

  async findAll(): Promise<T[]> {
    await this.tenantContext.setCurrentTenant();
    return await this.database.query(`SELECT * FROM ${this.tableName}`);
  }

  async findById(id: string): Promise<T | null> {
    await this.tenantContext.setCurrentTenant();
    return await this.database.queryOne(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id],
    );
  }

  async create(data: Partial<T>): Promise<T> {
    await this.tenantContext.setCurrentTenant();
    const tenantId = await this.tenantContext.getCurrentTenantId();

    return await this.database.queryOne(
      `INSERT INTO ${this.tableName} (tenant_id, ...) VALUES ($1, ...) RETURNING *`,
      [tenantId, ...Object.values(data)],
    );
  }

  protected abstract get tableName(): string;
}
```

### 2. 中间件集成

```typescript
// 租户上下文中间件
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(private readonly tenantContextService: TenantContextService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = await this.extractTenantId(req);
      if (tenantId) {
        await this.tenantContextService.setTenantContext(tenantId);
      }
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid tenant context' });
    }
  }

  private async extractTenantId(req: Request): Promise<string> {
    // 从多个来源提取租户ID
    return (
      (req.headers['x-tenant-id'] as string) ||
      this.extractFromSubdomain(req) ||
      this.extractFromJWT(req)
    );
  }
}
```

### 3. 数据验证

```typescript
// 租户数据验证装饰器
export function ValidateTenantAccess() {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tenantId = await this.tenantContextService.getCurrentTenantId();
      if (!tenantId) {
        throw new UnauthorizedException('Tenant context required');
      }

      return method.apply(this, args);
    };
  };
}

// 使用示例
@Controller('users')
export class UsersController {
  @Get()
  @ValidateTenantAccess()
  async getUsers() {
    return await this.usersService.findAll();
  }
}
```

## 性能优化策略

### 1. 索引优化

```sql
-- 复合索引优化
CREATE INDEX idx_users_tenant_status ON users(tenant_id, status);
CREATE INDEX idx_notifications_tenant_created ON notifications(tenant_id, created_at);
CREATE INDEX idx_organizations_tenant_parent ON organizations(tenant_id, parent_id);

-- 部分索引（只索引活跃数据）
CREATE INDEX idx_active_users_tenant ON users(tenant_id) WHERE status = 'ACTIVE';
CREATE INDEX idx_pending_notifications_tenant ON notifications(tenant_id) WHERE status = 'PENDING';
```

### 2. 查询优化

```typescript
// 使用EXISTS而不是JOIN
async findUsersWithOrganizations(tenantId: string) {
    return await this.database.query(`
        SELECT u.*, o.name as organization_name
        FROM users u
        LEFT JOIN user_organizations uo ON u.id = uo.user_id
        LEFT JOIN organizations o ON uo.organization_id = o.id
        WHERE u.tenant_id = $1
        AND (o.tenant_id = $1 OR o.tenant_id IS NULL)
    `, [tenantId]);
}

// 使用LIMIT和OFFSET进行分页
async findUsersPaginated(tenantId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;

    return await this.database.query(`
        SELECT * FROM users
        WHERE tenant_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
    `, [tenantId, limit, offset]);
}
```

### 3. 连接池优化

```typescript
// 数据库连接池配置
const databaseConfig = {
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT),
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  pool: {
    min: 2,
    max: 20, // 根据租户数量调整
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
};
```

## 监控和审计

### 1. 数据访问监控

```sql
-- 创建审计日志表
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建审计触发器
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        tenant_id, user_id, action, resource_type, resource_id,
        old_values, new_values, ip_address, user_agent
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        current_setting('app.current_user_id', true)::UUID,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id)::TEXT,
        CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        inet_client_addr(),
        current_setting('app.user_agent', true)
    );
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 为关键表创建审计触发器
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### 2. 性能监控

```sql
-- 查询性能监控
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
AND tablename IN ('users', 'organizations', 'notifications')
ORDER BY tablename, attname;

-- 索引使用情况监控
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

## 数据迁移和备份

### 1. 租户数据导出

```bash
#!/bin/bash
# 导出特定租户数据
TENANT_ID=$1
OUTPUT_DIR="backup/tenant_${TENANT_ID}_$(date +%Y%m%d_%H%M%S)"

mkdir -p $OUTPUT_DIR

# 导出租户基础信息
docker exec aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "
    COPY (
        SELECT * FROM tenants WHERE id = '$TENANT_ID'
    ) TO STDOUT WITH CSV HEADER
" > $OUTPUT_DIR/tenant.csv

# 导出租户用户数据
docker exec aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "
    COPY (
        SELECT * FROM users WHERE tenant_id = '$TENANT_ID'
    ) TO STDOUT WITH CSV HEADER
" > $OUTPUT_DIR/users.csv

# 导出租户组织数据
docker exec aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "
    COPY (
        SELECT * FROM organizations WHERE tenant_id = '$TENANT_ID'
    ) TO STDOUT WITH CSV HEADER
" > $OUTPUT_DIR/organizations.csv

echo "Tenant data exported to: $OUTPUT_DIR"
```

### 2. 租户数据导入

```bash
#!/bin/bash
# 导入租户数据
TENANT_ID=$1
INPUT_DIR=$2

# 导入租户基础信息
docker exec -i aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "
    COPY tenants FROM STDIN WITH CSV HEADER
" < $INPUT_DIR/tenant.csv

# 导入租户用户数据
docker exec -i aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "
    COPY users FROM STDIN WITH CSV HEADER
" < $INPUT_DIR/users.csv

# 导入租户组织数据
docker exec -i aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "
    COPY organizations FROM STDIN WITH CSV HEADER
" < $INPUT_DIR/organizations.csv

echo "Tenant data imported successfully"
```

## 安全考虑

### 1. 数据泄露防护

```typescript
// 查询结果验证
export class TenantDataValidator {
    static validateTenantAccess(data: any[], expectedTenantId: string): any[] {
        return data.filter(item => {
            if (item.tenant_id && item.tenant_id !== expectedTenantId) {
                console.error(`Data leak detected: item ${item.id} belongs to tenant ${item.tenant_id}, expected ${expectedTenantId}`);
                return false;
            }
            return true;
        });
    }
}

// 使用示例
async findUsers(tenantId: string) {
    const users = await this.database.query(`
        SELECT * FROM users WHERE tenant_id = $1
    `, [tenantId]);

    return TenantDataValidator.validateTenantAccess(users, tenantId);
}
```

### 2. 权限控制

```typescript
// 租户权限装饰器
export function RequireTenantPermission(permission: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor,
  ) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tenantId = await this.tenantContextService.getCurrentTenantId();
      const userId = await this.authService.getCurrentUserId();

      const hasPermission = await this.permissionService.checkTenantPermission(
        userId,
        tenantId,
        permission,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Permission '${permission}' required for tenant ${tenantId}`,
        );
      }

      return method.apply(this, args);
    };
  };
}
```

## 总结

表级隔离策略为Aiofix AI SaaS平台提供了：

1. **高效的数据隔离**：通过`tenant_id`字段和RLS策略确保数据安全
2. **优秀的性能**：共享数据库资源，支持大规模租户
3. **简单的管理**：统一的数据库管理，降低运维复杂度
4. **灵活的分析**：支持跨租户数据分析和报表
5. **成本效益**：最小化资源消耗，降低运营成本

通过合理的索引设计、RLS策略和应用程序集成，表级隔离策略能够满足大多数SaaS应用的需求，同时保持高性能和良好的可维护性。

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
