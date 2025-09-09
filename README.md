# Aiofix AI SaaS Platform

一个现代化的AI驱动的SaaS平台，支持多租户架构，采用DDD + Clean Architecture + CQRS + 事件溯源 + 事件驱动架构。

## 🚀 快速开始

### 环境要求

- Docker (版本 20.10+)
- Docker Compose (版本 2.0+)
- Node.js (版本 18+)
- pnpm (版本 8+)

### 一键启动开发环境

```bash
# 克隆项目
git clone <repository-url>
cd aiofix-ai-saas-platform

# 一键启动开发环境
./scripts/dev-start.sh

# 或者手动启动
docker-compose up -d
```

### 验证环境

```bash
# 检查服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f
```

## 📚 文档

- [Docker开发环境使用指南](docs/docker-development-guide.md) - 详细的Docker环境配置和使用说明
- [Docker快速参考](docs/docker-quick-reference.md) - 常用命令和快速操作指南
- [AI向量数据库配置指南](docs/ai-vectors-database.md) - AI向量存储和搜索功能说明
- [数据库隔离策略指南](docs/database-isolation-strategies.md) - 多租户数据隔离策略详解
- [数据库隔离使用示例](docs/database-isolation-usage-examples.md) - 配置驱动的隔离策略使用示例
- [技术设计文档](docs/technical-design/) - 完整的架构设计文档
- [业务需求文档](docs/business-requirements.md) - 业务需求和功能规格

## 🏗️ 技术架构

### 核心技术栈

- **后端**: NestJS + TypeScript + Fastify
- **数据库**: PostgreSQL 16 + pgvector (AI向量存储)
- **事件存储**: MongoDB 7.0
- **缓存**: Redis 7.2
- **消息队列**: Bull + Redis
- **架构模式**: DDD + Clean Architecture + CQRS + 事件溯源

### 服务端口

| 服务            | 端口  | 描述               |
| --------------- | ----- | ------------------ |
| PostgreSQL      | 5432  | 主数据库           |
| MongoDB         | 27017 | 事件存储           |
| Redis           | 6379  | 缓存和消息队列     |
| pgAdmin         | 8080  | PostgreSQL管理界面 |
| Mongo Express   | 8082  | MongoDB管理界面    |
| Redis Commander | 8081  | Redis管理界面      |

## 🗄️ 数据库

### 数据隔离策略

项目支持**配置驱动的多租户数据隔离**，默认采用表级隔离策略：

#### 支持的隔离模式

1. **表级隔离**（默认）：使用`tenant_id`字段在同一数据库中隔离数据
2. **数据库级隔离**：每个租户使用独立的数据库实例
3. **Schema级隔离**：每个租户使用独立的Schema

#### 当前配置

- **主数据库**: `aiofix_platform` - 包含所有租户数据，通过`tenant_id`字段隔离
- **AI向量数据库**: `aiofix_ai_vectors` - 独立的向量存储数据库
- **事件存储**: `aiofix_events` - MongoDB事件存储

#### 配置切换

通过环境变量`DATA_ISOLATION_STRATEGY`可以切换隔离策略，无需修改代码：

```bash
# 表级隔离（默认）
DATA_ISOLATION_STRATEGY=table_level

# 数据库级隔离
DATA_ISOLATION_STRATEGY=database_level

# Schema级隔离
DATA_ISOLATION_STRATEGY=schema_level
```

### 数据库表结构

- `tenants` - 租户信息表
- `users` - 用户表（包含tenant_id）
- `organizations` - 组织表（包含tenant_id）
- `departments` - 部门表（包含tenant_id）
- `notifications` - 通知表（包含tenant_id）
- `notification_templates` - 通知模板表（包含tenant_id）
- `user_notification_preferences` - 用户通知偏好表（包含tenant_id）
- `platform_configurations` - 平台配置表（全局）
- `tenant_configurations` - 租户配置表（包含tenant_id）
- `audit_logs` - 审计日志表（包含tenant_id）

### 连接信息

```bash
# PostgreSQL
用户名: aiofix_user
密码: aiofix_password
主机: localhost:5432

# MongoDB
用户名: aiofix_admin
密码: aiofix_password
主机: localhost:27017

# Redis
主机: localhost:6379
```

## 🤖 AI功能

### 向量数据库

项目集成了pgvector扩展，支持AI向量数据存储和相似度搜索：

- **文档嵌入**: 存储文档的向量化表示
- **聊天历史**: 存储聊天消息的向量化表示
- **知识库**: 存储知识库内容的向量化表示
- **相似度搜索**: 支持余弦相似度计算和高效搜索

### 使用示例

```sql
-- 连接到AI向量数据库
docker exec -it aiofix-postgres psql -U aiofix_user -d aiofix_ai_vectors

-- 搜索相似文档
SELECT * FROM search_similar_documents(
    '[0.1, 0.2, 0.3]'::vector(1536),
    0.7,
    10
);
```

## 🛠️ 开发工具

### 管理界面

- **pgAdmin**: http://localhost:8080 (admin@aiofix.com / admin123)
- **Mongo Express**: http://localhost:8082 (admin / admin123)
- **Redis Commander**: http://localhost:8081

### 常用命令

```bash
# 启动开发环境
./scripts/dev-start.sh

# 停止服务
docker-compose down

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f [service_name]

# 重启服务
docker-compose restart [service_name]
```

## 📦 项目结构

```
aiofix-ai-saas-platform/
├── packages/                    # 包目录
│   ├── shared/                 # 共享模块
│   ├── core/                   # 核心模块
│   ├── database/               # 数据库模块
│   ├── config/                 # 配置模块
│   ├── logging/                # 日志模块
│   ├── notification/           # 通知模块
│   ├── user/                   # 用户模块
│   ├── tenant/                 # 租户模块
│   ├── organization/           # 组织模块
│   └── platform/               # 平台模块
├── docs/                       # 文档目录
├── scripts/                    # 脚本目录
├── config/                     # 配置文件
├── docker-compose.yml          # Docker编排文件
├── env.example                 # 环境变量示例
└── README.md                   # 项目说明
```

## 🔧 开发工作流

### 1. 环境设置

```bash
# 复制环境变量
cp env.example .env

# 启动开发环境
./scripts/dev-start.sh
```

### 2. 开发调试

```bash
# 查看服务日志
docker-compose logs -f postgres
docker-compose logs -f mongodb
docker-compose logs -f redis

# 进入容器调试
docker exec -it aiofix-postgres bash
docker exec -it aiofix-mongodb bash
docker exec -it aiofix-redis sh
```

### 3. 数据管理

```bash
# 备份数据
docker exec aiofix-postgres pg_dump -U aiofix_user aiofix_platform > backup.sql

# 恢复数据
docker exec -i aiofix-postgres psql -U aiofix_user aiofix_platform < backup.sql
```

## 🚨 故障排除

### 常见问题

1. **容器启动失败**

   ```bash
   # 查看日志
   docker-compose logs [service_name]

   # 重启服务
   docker-compose restart [service_name]
   ```

2. **端口占用**

   ```bash
   # 检查端口占用
   netstat -tulpn | grep :5432

   # 停止占用端口的进程
   sudo kill -9 [PID]
   ```

3. **数据卷问题**

   ```bash
   # 清理数据卷
   docker-compose down -v

   # 重新启动
   docker-compose up -d
   ```

### 获取帮助

- 查看详细文档: [docs/](docs/)
- 查看Docker日志: `docker-compose logs -f`
- 检查服务状态: `docker-compose ps`
- 报告问题: 在项目Issues中提交

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🤝 贡献

欢迎贡献代码！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解贡献指南。

## 📞 支持

如有问题或建议，请：

1. 查看文档: [docs/](docs/)
2. 搜索Issues: [GitHub Issues](https://github.com/your-repo/issues)
3. 创建新Issue: [New Issue](https://github.com/your-repo/issues/new)

---

**项目版本**: 1.0.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
