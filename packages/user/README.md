# 用户模块 (User Module)

## 概述

用户模块是Aiofix AI SAAS平台的核心模块之一，负责管理用户账户、身份验证、权限控制和用户数据。该模块采用Clean Architecture + DDD + CQRS + 事件溯源架构，提供完整的用户管理功能。

## 架构设计

### 分层架构

```
packages/user/src/
├── domain/                 # 领域层
│   ├── entities/          # 领域实体
│   ├── value-objects/     # 值对象
│   ├── events/            # 领域事件
│   ├── services/          # 领域服务
│   └── repositories/      # 仓储接口
├── application/           # 应用层
│   ├── commands/          # 命令
│   ├── queries/           # 查询
│   ├── handlers/          # 处理器
│   └── services/          # 应用服务
├── infrastructure/        # 基础设施层
│   ├── adapters/          # 适配器
│   ├── repositories/      # 仓储实现
│   ├── cache/             # 缓存服务
│   ├── event-storage/     # 事件存储
│   ├── guards/            # 守卫
│   ├── interceptors/      # 拦截器
│   └── decorators/        # 装饰器
├── shared/                # 共享组件
│   ├── constants/         # 常量
│   ├── types/             # 类型定义
│   └── utils/             # 工具函数
└── interfaces/            # 接口层
    ├── rest/              # REST API
    ├── graphql/           # GraphQL API
    └── grpc/              # gRPC API
```

### 核心组件

#### 领域层 (Domain Layer)

- **用户聚合根**: 管理用户的核心业务逻辑
- **值对象**: Email、UserId、UserProfile等
- **领域事件**: UserCreated、UserUpdated、UserDeleted等
- **领域服务**: 用户验证、权限计算等

#### 应用层 (Application Layer)

- **命令**: CreateUser、UpdateUser、DeleteUser等
- **查询**: GetUser、GetUsers、SearchUsers等
- **命令处理器**: 处理业务命令
- **查询处理器**: 处理数据查询

#### 基础设施层 (Infrastructure Layer)

- **仓储实现**: 数据持久化
- **缓存服务**: Redis缓存
- **事件存储**: MongoDB事件存储
- **守卫**: 认证、权限、租户守卫
- **拦截器**: 日志、缓存、性能监控

## 功能特性

### 用户管理

- ✅ 用户创建、更新、删除
- ✅ 用户状态管理（激活、禁用、删除）
- ✅ 用户资料管理
- ✅ 用户偏好设置

### 身份验证

- ✅ JWT令牌认证
- ✅ 密码加密存储
- ✅ 多租户身份验证
- ✅ 会话管理

### 权限控制

- ✅ 基于角色的访问控制 (RBAC)
- ✅ 细粒度权限控制
- ✅ 租户级权限隔离
- ✅ 动态权限管理

### 数据隔离

- ✅ 多租户数据隔离
- ✅ 支持三种隔离策略（数据库级、Schema级、表级）
- ✅ 租户上下文管理
- ✅ 数据安全保护

### 事件驱动

- ✅ 事件溯源支持
- ✅ 领域事件发布
- ✅ 异步事件处理
- ✅ 事件重放和恢复

### 性能优化

- ✅ Redis缓存支持
- ✅ 查询性能优化
- ✅ 分页和排序
- ✅ 性能监控

## 技术栈

- **框架**: NestJS + TypeScript
- **数据库**: PostgreSQL + MongoDB
- **缓存**: Redis
- **消息队列**: Bull + Redis
- **认证**: JWT
- **验证**: class-validator
- **文档**: Swagger/OpenAPI

## 安装和配置

### 依赖安装

```bash
# 安装依赖
pnpm install

# 构建项目
pnpm build
```

### 环境配置

```bash
# 数据库配置
DATABASE_URL=postgresql://user:password@localhost:5432/aiofix_user
MONGODB_URL=mongodb://localhost:27017/aiofix_events

# Redis配置
REDIS_URL=redis://localhost:6379

# JWT配置
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h

# 多租户配置
TENANT_ISOLATION_STRATEGY=TABLE_LEVEL
```

### 数据库迁移

```bash
# 运行数据库迁移
pnpm migration:run

# 生成新的迁移
pnpm migration:generate --name=CreateUserTable
```

## 使用示例

### 创建用户

```typescript
import { CreateUserCommand } from '@aiofix/user';

const command = new CreateUserCommand({
  email: 'user@example.com',
  password: 'SecurePassword123!',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    phoneNumber: '+1234567890',
  },
  preferences: {
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  },
});

const result = await userService.createUser(command);
```

### 查询用户

```typescript
import { GetUsersQuery } from '@aiofix/user';

const query = new GetUsersQuery({
  filters: {
    status: UserStatus.ACTIVE,
    searchTerm: 'john',
  },
  pagination: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'DESC',
  },
});

const users = await userService.getUsers(query);
```

### 权限控制

```typescript
import { RequirePermissions } from '@aiofix/user';

@Controller('users')
@UseGuards(AuthGuard, PermissionGuard)
export class UserController {
  @Get()
  @RequirePermissions('user:read')
  async getUsers() {
    // 需要user:read权限
  }

  @Post()
  @RequirePermissions('user:create')
  async createUser() {
    // 需要user:create权限
  }
}
```

### 缓存使用

```typescript
import { Cache, CacheTTL } from '@aiofix/user';

@Controller('users')
export class UserController {
  @Get(':id')
  @Cache({ ttl: 300, key: 'user:detail' })
  async getUser(@Param('id') id: string) {
    // 缓存5分钟
  }

  @Get()
  @CacheTTL(600) // 缓存10分钟
  async getUsers() {
    // 缓存10分钟
  }
}
```

## API文档

### REST API

#### 用户管理

| 方法   | 路径         | 描述         | 权限          |
| ------ | ------------ | ------------ | ------------- |
| GET    | `/users`     | 获取用户列表 | `user:read`   |
| GET    | `/users/:id` | 获取用户详情 | `user:read`   |
| POST   | `/users`     | 创建用户     | `user:create` |
| PUT    | `/users/:id` | 更新用户     | `user:update` |
| DELETE | `/users/:id` | 删除用户     | `user:delete` |

#### 用户资料

| 方法 | 路径                 | 描述         | 权限                  |
| ---- | -------------------- | ------------ | --------------------- |
| GET  | `/users/:id/profile` | 获取用户资料 | `user:profile:read`   |
| PUT  | `/users/:id/profile` | 更新用户资料 | `user:profile:update` |

#### 用户权限

| 方法   | 路径                                 | 描述         | 权限                     |
| ------ | ------------------------------------ | ------------ | ------------------------ |
| GET    | `/users/:id/permissions`             | 获取用户权限 | `user:permission:read`   |
| POST   | `/users/:id/permissions`             | 授予权限     | `user:permission:grant`  |
| DELETE | `/users/:id/permissions/:permission` | 撤销权限     | `user:permission:revoke` |

### GraphQL API

```graphql
type User {
  id: ID!
  email: String!
  status: UserStatus!
  profile: UserProfile!
  roles: [UserRole!]!
  permissions: [UserPermission!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}

type UserProfile {
  firstName: String!
  lastName: String!
  phoneNumber: String
  avatar: String
  description: String
}

type Query {
  user(id: ID!): User
  users(filters: UserFilters, pagination: PaginationInput): UserConnection!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}
```

## 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 运行E2E测试
pnpm test:e2e

# 测试覆盖率
pnpm test:cov
```

### 测试结构

```
packages/user/src/
├── __tests__/
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   └── e2e/              # E2E测试
├── test/
│   ├── fixtures/         # 测试数据
│   ├── mocks/            # 模拟对象
│   └── utils/            # 测试工具
```

## 部署

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### 环境变量

```bash
# 生产环境配置
NODE_ENV=production
PORT=3000

# 数据库配置
DATABASE_URL=postgresql://user:password@db:5432/aiofix_user
MONGODB_URL=mongodb://mongo:27017/aiofix_events

# Redis配置
REDIS_URL=redis://redis:6379

# JWT配置
JWT_SECRET=your-production-jwt-secret
JWT_EXPIRES_IN=1h

# 多租户配置
TENANT_ISOLATION_STRATEGY=TABLE_LEVEL
```

## 监控和日志

### 性能监控

- 请求处理时间监控
- 数据库查询性能监控
- 缓存命中率监控
- 错误率监控

### 日志记录

- 结构化日志记录
- 审计日志记录
- 错误日志记录
- 性能日志记录

### 健康检查

```bash
# 健康检查端点
GET /health

# 响应示例
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "mongodb": "healthy"
  }
}
```

## 贡献指南

### 开发流程

1. Fork项目
2. 创建功能分支
3. 编写代码和测试
4. 提交Pull Request
5. 代码审查
6. 合并到主分支

### 代码规范

- 使用TypeScript严格模式
- 遵循ESLint和Prettier配置
- 编写完整的TSDoc注释
- 保持测试覆盖率在80%以上

### 提交规范

```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具的变动
```

## 许可证

本项目采用MIT许可证。详情请参阅[LICENSE](../../LICENSE)文件。

## 支持

如有问题或建议，请通过以下方式联系：

- 提交Issue: [GitHub Issues](https://github.com/aiofix/aiofix-ai-saas-platform/issues)
- 邮件支持: support@aiofix.com
- 文档: [项目文档](../../docs/)

---

**版本**: 1.0.0  
**最后更新**: 2024-01-01  
**维护者**: Aiofix开发团队
