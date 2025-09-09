# Docker 开发环境快速参考

## 🚀 快速启动

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 停止所有服务
docker-compose down
```

## 📊 服务端口

| 服务            | 端口  | 访问地址              | 用户名/密码                    |
| --------------- | ----- | --------------------- | ------------------------------ |
| PostgreSQL      | 5432  | localhost:5432        | aiofix_user / aiofix_password  |
| MongoDB         | 27017 | localhost:27017       | aiofix_admin / aiofix_password |
| Redis           | 6379  | localhost:6379        | -                              |
| pgAdmin         | 8080  | http://localhost:8080 | admin@aiofix.com / admin123    |
| Mongo Express   | 8082  | http://localhost:8082 | admin / admin123               |
| Redis Commander | 8081  | http://localhost:8081 | -                              |

## 🗄️ 数据库连接

### PostgreSQL

```bash
# 命令行连接
docker exec -it aiofix-postgres psql -U aiofix_user -d aiofix_platform

# 外部连接
psql -h localhost -p 5432 -U aiofix_user -d aiofix_platform
```

### MongoDB

```bash
# 命令行连接
docker exec -it aiofix-mongodb mongosh -u aiofix_admin -p aiofix_password

# 外部连接
mongosh mongodb://aiofix_admin:aiofix_password@localhost:27017/aiofix_events?authSource=admin
```

### Redis

```bash
# 命令行连接
docker exec -it aiofix-redis redis-cli

# 外部连接
redis-cli -h localhost -p 6379
```

## 🔍 常用命令

### 服务管理

```bash
docker-compose up -d                    # 启动所有服务
docker-compose down                     # 停止所有服务
docker-compose restart [service]        # 重启特定服务
docker-compose logs -f [service]        # 查看服务日志
docker-compose ps                       # 查看服务状态
```

### 数据库操作

```bash
# PostgreSQL
docker exec aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "SELECT version();"
docker exec aiofix-postgres pg_dump -U aiofix_user aiofix_platform > backup.sql

# MongoDB
docker exec aiofix-mongodb mongosh --eval "db.adminCommand('ping')"
docker exec aiofix-mongodb mongodump --username aiofix_admin --password aiofix_password --db aiofix_events --out /backup

# Redis
docker exec aiofix-redis redis-cli ping
docker exec aiofix-redis redis-cli keys "*"
```

### 数据备份

```bash
# 备份PostgreSQL
docker exec aiofix-postgres pg_dump -U aiofix_user aiofix_platform > postgres_backup.sql

# 备份MongoDB
docker exec aiofix-mongodb mongodump --username aiofix_admin --password aiofix_password --db aiofix_events --out mongodb_backup

# 备份Redis
docker exec aiofix-redis redis-cli BGSAVE
docker cp aiofix-redis:/data/dump.rdb redis_backup.rdb
```

### 数据恢复

```bash
# 恢复PostgreSQL
docker exec -i aiofix-postgres psql -U aiofix_user aiofix_platform < postgres_backup.sql

# 恢复MongoDB
docker exec aiofix-mongodb mongorestore --username aiofix_admin --password aiofix_password --db aiofix_events mongodb_backup/aiofix_events
```

## 🛠️ 故障排除

### 查看日志

```bash
docker-compose logs postgres            # PostgreSQL日志
docker-compose logs mongodb             # MongoDB日志
docker-compose logs redis               # Redis日志
docker-compose logs -f                  # 实时查看所有日志
```

### 检查状态

```bash
docker-compose ps                       # 查看容器状态
docker stats                           # 查看资源使用
docker network ls                      # 查看网络
docker volume ls                       # 查看数据卷
```

### 重置环境

```bash
docker-compose down -v                 # 停止并删除数据卷
docker-compose up -d                   # 重新启动
```

## 🎯 AI向量数据库

### 表级隔离查询

```bash
# 连接到主数据库
docker exec -it aiofix-postgres psql -U aiofix_user -d aiofix_platform
```

```sql
-- 查看租户数据
SELECT id, name, domain, status FROM tenants;

-- 查看用户数据（按租户隔离）
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

### 连接AI向量数据库

```bash
docker exec -it aiofix-postgres psql -U aiofix_user -d aiofix_ai_vectors
```

### 查看向量表

```sql
\dt                                    -- 查看所有表
SELECT * FROM pg_extension WHERE extname = 'vector';  -- 查看pgvector扩展
```

### 测试向量搜索

```sql
-- 测试文档相似度搜索
SELECT * FROM search_similar_documents(
    '[0.1, 0.2, 0.3]'::vector(1536),
    0.7,
    10
);

-- 测试聊天相似度搜索
SELECT * FROM search_similar_chats(
    '[0.1, 0.2, 0.3]'::vector(1536),
    'user-123',
    0.7,
    10
);

-- 测试知识库相似度搜索
SELECT * FROM search_similar_knowledge(
    '[0.1, 0.2, 0.3]'::vector(1536),
    '技术文档',
    0.7,
    10
);
```

## 📋 环境变量

### 创建环境文件

```bash
cp env.example .env
```

### 主要配置

```bash
# 数据库配置
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=aiofix_platform
POSTGRES_USER=aiofix_user
POSTGRES_PASSWORD=aiofix_password

MONGODB_URI=mongodb://aiofix_admin:aiofix_password@localhost:27017/aiofix_events?authSource=admin

REDIS_HOST=localhost
REDIS_PORT=6379

# AI向量数据库
AI_VECTORS_DB=aiofix_ai_vectors
AI_VECTORS_HOST=localhost
AI_VECTORS_PORT=5432
AI_VECTORS_USER=aiofix_user
AI_VECTORS_PASSWORD=aiofix_password
```

## 🔧 开发工具

### 数据库管理工具

- **pgAdmin**: http://localhost:8080 (PostgreSQL管理)
- **Mongo Express**: http://localhost:8082 (MongoDB管理)
- **Redis Commander**: http://localhost:8081 (Redis管理)

### 命令行工具

```bash
# 进入容器
docker exec -it aiofix-postgres bash
docker exec -it aiofix-mongodb bash
docker exec -it aiofix-redis sh

# 查看容器信息
docker inspect aiofix-postgres
docker inspect aiofix-mongodb
docker inspect aiofix-redis
```

## 📚 数据库结构

### PostgreSQL数据库列表

- `aiofix_platform` - 主数据库（表级隔离，包含所有租户数据）
- `aiofix_ai_vectors` - AI向量存储（独立数据库）

### MongoDB集合

- `domain_events` - 领域事件
- `aggregate_snapshots` - 聚合快照
- `notifications` - 通知数据

### Redis键空间

- 缓存数据
- 会话存储
- 消息队列
- 分布式锁

## ⚡ 性能监控

### 查看资源使用

```bash
docker stats                           # 实时资源使用
docker exec aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "SELECT count(*) FROM pg_stat_activity;"  # 连接数
```

### 数据库性能

```sql
-- PostgreSQL性能查询
SELECT * FROM pg_stat_activity;        -- 活动连接
SELECT * FROM pg_stat_database;        -- 数据库统计
SELECT * FROM pg_stat_user_tables;     -- 表统计
```

## 🚨 紧急情况

### 服务无法启动

```bash
# 检查端口占用
netstat -tulpn | grep :5432
netstat -tulpn | grep :27017
netstat -tulpn | grep :6379

# 清理并重启
docker-compose down -v
docker system prune -a
docker-compose up -d
```

### 数据丢失

```bash
# 从备份恢复
docker exec -i aiofix-postgres psql -U aiofix_user aiofix_platform < backup.sql
```

### 网络问题

```bash
# 重建网络
docker-compose down
docker network prune
docker-compose up -d
```

---

**快速参考版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
