# Docker 开发环境使用指南

## 概述

本指南将帮助开发者快速搭建和使用Aiofix AI SaaS平台的Docker开发环境。项目使用Docker Compose管理多个服务，包括PostgreSQL、MongoDB、Redis以及相关的管理工具。

## 技术栈

- **PostgreSQL 16** + **pgvector扩展** - 主数据库和AI向量存储
- **MongoDB 7.0** - 事件存储和文档存储
- **Redis 7.2** - 缓存和消息队列
- **pgAdmin** - PostgreSQL管理界面
- **Mongo Express** - MongoDB管理界面
- **Redis Commander** - Redis管理界面

## 快速开始

### 1. 环境要求

确保你的系统已安装：

- Docker (版本 20.10+)
- Docker Compose (版本 2.0+)

### 2. 启动服务

```bash
# 克隆项目后，进入项目根目录
cd aiofix-ai-saas-platform

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps
```

### 3. 验证服务

```bash
# 检查所有容器是否健康运行
docker-compose ps

# 应该看到所有服务状态为 "Up" 和 "healthy"
```

## 服务详情

### PostgreSQL 数据库

**容器名称**: `aiofix-postgres`  
**镜像**: `pgvector/pgvector:pg16`  
**端口**: `5432`  
**数据库**:

- 主数据库: `aiofix_platform` (表级隔离，包含所有租户数据)
- 事件存储: `aiofix_events` (MongoDB)
- **AI向量数据库**: `aiofix_ai_vectors` (独立的向量存储)

**连接信息**:

- 用户名: `aiofix_user`
- 密码: `aiofix_password`
- 主机: `localhost`
- 端口: `5432`

#### 连接示例

```bash
# 使用psql命令行连接
docker exec -it aiofix-postgres psql -U aiofix_user -d aiofix_platform

# 或使用外部客户端连接
psql -h localhost -p 5432 -U aiofix_user -d aiofix_platform
```

#### 表级隔离使用

```sql
-- 查看租户数据
SELECT id, name, domain, status FROM tenants;

-- 查看用户数据（自动按租户隔离）
SELECT * FROM users WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 查看组织数据
SELECT * FROM organizations WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 查看通知数据
SELECT * FROM notifications WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 设置租户上下文（用于RLS）
SET app.current_tenant_id = '00000000-0000-0000-0000-000000000001';

-- 查看表结构
\d users
\d organizations
\d notifications
```

#### AI向量数据库使用

```sql
-- 连接到AI向量数据库
\c aiofix_ai_vectors

-- 查看向量表
\dt

-- 查看pgvector扩展
SELECT * FROM pg_extension WHERE extname = 'vector';

-- 测试向量搜索函数
SELECT * FROM search_similar_documents(
    '[0.1, 0.2, 0.3]'::vector(1536),
    0.7,
    10
);
```

### MongoDB 数据库

**容器名称**: `aiofix-mongodb`  
**镜像**: `mongo:7.0`  
**端口**: `27017`  
**数据库**: `aiofix_events`

**连接信息**:

- 用户名: `aiofix_admin`
- 密码: `aiofix_password`
- 主机: `localhost`
- 端口: `27017`

#### 连接示例

```bash
# 使用mongosh连接
docker exec -it aiofix-mongodb mongosh -u aiofix_admin -p aiofix_password

# 或使用外部客户端连接
mongosh mongodb://aiofix_admin:aiofix_password@localhost:27017/aiofix_events?authSource=admin
```

#### 基本操作

```javascript
// 切换到事件数据库
use aiofix_events

// 查看集合
show collections

// 查看事件数据
db.domain_events.find().limit(5)

// 查看通知数据
db.notifications.find().limit(5)
```

### Redis 缓存

**容器名称**: `aiofix-redis`  
**镜像**: `redis:7.2-alpine`  
**端口**: `6379`

#### 连接示例

```bash
# 使用redis-cli连接
docker exec -it aiofix-redis redis-cli

# 或使用外部客户端连接
redis-cli -h localhost -p 6379
```

#### 基本操作

```bash
# 测试连接
PING

# 设置键值
SET test_key "Hello Redis"

# 获取值
GET test_key

# 查看所有键
KEYS *

# 查看Redis信息
INFO
```

## 管理界面

### pgAdmin - PostgreSQL管理界面

**访问地址**: http://localhost:8080  
**登录信息**:

- 邮箱: `admin@aiofix.com`
- 密码: `admin123`

#### 配置服务器连接

1. 登录pgAdmin后，右键"Servers" → "Create" → "Server"
2. 在"General"标签页：
   - Name: `Aiofix PostgreSQL`
3. 在"Connection"标签页：
   - Host: `postgres` (容器内) 或 `localhost` (外部)
   - Port: `5432`
   - Username: `aiofix_user`
   - Password: `aiofix_password`
4. 点击"Save"

#### 使用功能

- **数据库管理**: 创建、删除、备份数据库
- **表管理**: 查看、编辑表结构和数据
- **查询工具**: 执行SQL查询和脚本
- **用户管理**: 管理数据库用户和权限
- **监控**: 查看数据库性能和连接状态

### Mongo Express - MongoDB管理界面

**访问地址**: http://localhost:8082  
**登录信息**:

- 用户名: `admin`
- 密码: `admin123`

#### 使用功能

- **数据库浏览**: 查看所有数据库和集合
- **文档管理**: 查看、编辑、删除文档
- **索引管理**: 创建和管理索引
- **查询工具**: 执行MongoDB查询
- **用户管理**: 管理数据库用户

### Redis Commander - Redis管理界面

**访问地址**: http://localhost:8081

#### 使用功能

- **键值浏览**: 查看所有Redis键
- **数据编辑**: 编辑键值对
- **监控**: 查看Redis性能和内存使用
- **命令执行**: 执行Redis命令
- **连接管理**: 管理Redis连接

## 开发工作流

### 1. 日常开发

```bash
# 启动开发环境
docker-compose up -d

# 查看日志
docker-compose logs -f [service_name]

# 停止服务
docker-compose down

# 重启特定服务
docker-compose restart postgres
```

### 2. 数据库迁移

```bash
# 进入PostgreSQL容器
docker exec -it aiofix-postgres bash

# 执行SQL脚本
psql -U aiofix_user -d aiofix_platform -f /path/to/script.sql
```

### 3. 数据备份

```bash
# 备份PostgreSQL数据库
docker exec aiofix-postgres pg_dump -U aiofix_user aiofix_platform > backup.sql

# 备份MongoDB数据库
docker exec aiofix-mongodb mongodump --username aiofix_admin --password aiofix_password --db aiofix_events --out /backup

# 备份Redis数据
docker exec aiofix-redis redis-cli BGSAVE
```

### 4. 数据恢复

```bash
# 恢复PostgreSQL数据库
docker exec -i aiofix-postgres psql -U aiofix_user aiofix_platform < backup.sql

# 恢复MongoDB数据库
docker exec aiofix-mongodb mongorestore --username aiofix_admin --password aiofix_password --db aiofix_events /backup/aiofix_events
```

## 环境变量配置

### 创建环境文件

```bash
# 复制环境变量模板
cp env.example .env

# 编辑环境变量
nano .env
```

### 主要环境变量

```bash
# 应用配置
NODE_ENV=development
PORT=3000
API_PREFIX=api/v1

# PostgreSQL配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=aiofix_platform
POSTGRES_USER=aiofix_user
POSTGRES_PASSWORD=aiofix_password

# MongoDB配置
MONGODB_URI=mongodb://aiofix_admin:aiofix_password@localhost:27017/aiofix_events?authSource=admin

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI向量数据库配置
AI_VECTORS_DB=aiofix_ai_vectors
AI_VECTORS_HOST=localhost
AI_VECTORS_PORT=5432
AI_VECTORS_USER=aiofix_user
AI_VECTORS_PASSWORD=aiofix_password
```

## 故障排除

### 常见问题

#### 1. 容器启动失败

```bash
# 查看容器日志
docker-compose logs [service_name]

# 检查端口占用
netstat -tulpn | grep :5432

# 重启服务
docker-compose restart [service_name]
```

#### 2. 数据库连接失败

```bash
# 检查容器状态
docker-compose ps

# 测试数据库连接
docker exec aiofix-postgres pg_isready -U aiofix_user

# 检查网络连接
docker network ls
docker network inspect aiofix-ai-saas-platform_aiofix-network
```

#### 3. 数据卷问题

```bash
# 查看数据卷
docker volume ls

# 清理数据卷（注意：会删除所有数据）
docker-compose down -v

# 重新创建数据卷
docker-compose up -d
```

#### 4. 权限问题

```bash
# 检查脚本权限
ls -la scripts/

# 添加执行权限
chmod +x scripts/*.sh
```

### 日志查看

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs postgres
docker-compose logs mongodb
docker-compose logs redis

# 实时查看日志
docker-compose logs -f postgres
```

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看特定容器资源使用
docker stats aiofix-postgres

# 查看数据库连接数
docker exec aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "SELECT count(*) FROM pg_stat_activity;"
```

## 高级配置

### 1. 自定义配置

#### PostgreSQL配置

```bash
# 编辑PostgreSQL配置
docker exec -it aiofix-postgres bash
nano /var/lib/postgresql/data/postgresql.conf

# 重启PostgreSQL
docker-compose restart postgres
```

#### Redis配置

```bash
# 编辑Redis配置
nano config/redis.conf

# 重启Redis
docker-compose restart redis
```

### 2. 扩展服务

#### 添加新数据库

```yaml
# 在docker-compose.yml中添加新服务
services:
  new-database:
    image: postgres:16-alpine
    container_name: aiofix-new-db
    environment:
      POSTGRES_DB: new_database
      POSTGRES_USER: new_user
      POSTGRES_PASSWORD: new_password
    ports:
      - '5433:5432'
    networks:
      - aiofix-network
```

#### 添加监控服务

```yaml
# 添加Prometheus监控
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: aiofix-prometheus
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - aiofix-network
```

### 3. 生产环境配置

#### 安全配置

```bash
# 修改默认密码
# 编辑.env文件，使用强密码
POSTGRES_PASSWORD=your_strong_password_here
MONGODB_PASSWORD=your_strong_password_here
REDIS_PASSWORD=your_strong_password_here

# 限制网络访问
# 在docker-compose.yml中移除端口映射，仅内部访问
```

#### 备份策略

```bash
# 创建备份脚本
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/$DATE"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份PostgreSQL
docker exec aiofix-postgres pg_dump -U aiofix_user aiofix_platform > $BACKUP_DIR/postgres_backup.sql

# 备份MongoDB
docker exec aiofix-mongodb mongodump --username aiofix_admin --password aiofix_password --db aiofix_events --out $BACKUP_DIR/mongodb_backup

# 备份Redis
docker exec aiofix-redis redis-cli BGSAVE
docker cp aiofix-redis:/data/dump.rdb $BACKUP_DIR/redis_backup.rdb

echo "Backup completed: $BACKUP_DIR"
```

## 最佳实践

### 1. 开发环境

- 使用`docker-compose up -d`启动服务
- 定期清理未使用的镜像和容器
- 使用环境变量管理配置
- 保持数据卷的持久化

### 2. 数据管理

- 定期备份重要数据
- 使用版本控制管理数据库迁移脚本
- 监控数据库性能和连接数
- 及时清理过期数据

### 3. 安全考虑

- 修改默认密码
- 限制网络访问
- 定期更新镜像版本
- 监控异常访问

### 4. 性能优化

- 根据需求调整连接池大小
- 优化数据库索引
- 监控内存和CPU使用
- 使用缓存减少数据库负载

## 常用命令速查

```bash
# 服务管理
docker-compose up -d                    # 启动所有服务
docker-compose down                     # 停止所有服务
docker-compose restart [service]        # 重启特定服务
docker-compose logs -f [service]        # 查看服务日志

# 数据库操作
docker exec -it aiofix-postgres psql -U aiofix_user -d aiofix_platform
docker exec -it aiofix-mongodb mongosh -u aiofix_admin -p aiofix_password
docker exec -it aiofix-redis redis-cli

# 数据备份
docker exec aiofix-postgres pg_dump -U aiofix_user aiofix_platform > backup.sql
docker exec aiofix-mongodb mongodump --username aiofix_admin --password aiofix_password --db aiofix_events --out /backup

# 清理操作
docker-compose down -v                  # 停止服务并删除数据卷
docker system prune -a                  # 清理所有未使用的Docker资源
```

## 支持与帮助

### 获取帮助

- 查看项目文档: `docs/` 目录
- 查看Docker Compose文档: https://docs.docker.com/compose/
- 查看PostgreSQL文档: https://www.postgresql.org/docs/
- 查看MongoDB文档: https://docs.mongodb.com/
- 查看Redis文档: https://redis.io/documentation

### 报告问题

如果遇到问题，请：

1. 查看容器日志: `docker-compose logs [service_name]`
2. 检查服务状态: `docker-compose ps`
3. 查看系统资源: `docker stats`
4. 在项目Issues中报告问题

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
