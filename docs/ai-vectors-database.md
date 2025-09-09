# AI 向量数据库配置指南

## 概述

本项目使用PostgreSQL 16 + pgvector扩展来支持AI向量数据存储，包括文档嵌入、聊天历史向量化和知识库向量搜索等功能。

## 技术栈

- **PostgreSQL 16**: 最新版本的PostgreSQL数据库
- **pgvector**: 高性能向量相似度搜索扩展
- **Docker**: 使用`pgvector/pgvector:pg16`镜像

## 数据库结构

### 1. 文档嵌入表 (document_embeddings)

存储文档的向量化表示，支持语义搜索。

```sql
CREATE TABLE document_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding dimension
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. 聊天历史向量表 (chat_embeddings)

存储聊天消息的向量化表示，支持上下文检索。

```sql
CREATE TABLE chat_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id VARCHAR(255) NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    embedding VECTOR(1536),
    message_type VARCHAR(50) DEFAULT 'user',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. 知识库向量表 (knowledge_embeddings)

存储知识库内容的向量化表示，支持智能问答。

```sql
CREATE TABLE knowledge_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_id VARCHAR(255) NOT NULL,
    title VARCHAR(500),
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    category VARCHAR(100),
    tags TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 向量搜索函数

### 1. 文档相似度搜索

```sql
SELECT * FROM search_similar_documents(
    query_embedding := '[0.1, 0.2, ...]'::vector(1536),
    match_threshold := 0.7,
    match_count := 10
);
```

### 2. 聊天历史搜索

```sql
SELECT * FROM search_similar_chats(
    query_embedding := '[0.1, 0.2, ...]'::vector(1536),
    user_id_param := 'user-123',
    match_threshold := 0.7,
    match_count := 10
);
```

### 3. 知识库搜索

```sql
SELECT * FROM search_similar_knowledge(
    query_embedding := '[0.1, 0.2, ...]'::vector(1536),
    category_param := '技术文档',
    match_threshold := 0.7,
    match_count := 10
);
```

## 环境配置

### Docker Compose 配置

```yaml
postgres:
  image: pgvector/pgvector:pg16
  container_name: aiofix-postgres
  environment:
    POSTGRES_DB: aiofix_platform
    POSTGRES_USER: aiofix_user
    POSTGRES_PASSWORD: aiofix_password
  volumes:
    - ./scripts/init-multiple-databases.sh:/docker-entrypoint-initdb.d/01-init-multiple-databases.sh
    - ./scripts/init-ai-vectors.sh:/docker-entrypoint-initdb.d/02-init-ai-vectors.sh
```

### 环境变量

```bash
# AI 向量数据库配置
AI_VECTORS_DB=aiofix_ai_vectors
AI_VECTORS_HOST=localhost
AI_VECTORS_PORT=5432
AI_VECTORS_USER=aiofix_user
AI_VECTORS_PASSWORD=aiofix_password
```

## 使用示例

### 1. 存储文档嵌入

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.AI_VECTORS_HOST,
  port: parseInt(process.env.AI_VECTORS_PORT || '5432'),
  database: process.env.AI_VECTORS_DB,
  user: process.env.AI_VECTORS_USER,
  password: process.env.AI_VECTORS_PASSWORD,
});

async function storeDocumentEmbedding(
  documentId: string,
  content: string,
  embedding: number[],
  metadata?: any,
) {
  const query = `
    INSERT INTO document_embeddings (document_id, content, embedding, metadata)
    VALUES ($1, $2, $3, $4)
    RETURNING id
  `;

  const result = await pool.query(query, [
    documentId,
    content,
    `[${embedding.join(',')}]`,
    JSON.stringify(metadata),
  ]);

  return result.rows[0].id;
}
```

### 2. 搜索相似文档

```typescript
async function searchSimilarDocuments(
  queryEmbedding: number[],
  threshold: number = 0.7,
  limit: number = 10,
) {
  const query = `
    SELECT * FROM search_similar_documents($1, $2, $3)
  `;

  const result = await pool.query(query, [
    `[${queryEmbedding.join(',')}]`,
    threshold,
    limit,
  ]);

  return result.rows;
}
```

### 3. 存储聊天嵌入

```typescript
async function storeChatEmbedding(
  chatId: string,
  userId: string,
  message: string,
  embedding: number[],
  messageType: 'user' | 'assistant' | 'system' = 'user',
) {
  const query = `
    INSERT INTO chat_embeddings (chat_id, user_id, message, embedding, message_type)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `;

  const result = await pool.query(query, [
    chatId,
    userId,
    message,
    `[${embedding.join(',')}]`,
    messageType,
  ]);

  return result.rows[0].id;
}
```

## 性能优化

### 1. 索引优化

- 使用`ivfflat`索引进行向量相似度搜索
- 为常用查询字段创建B-tree索引
- 使用GIN索引优化JSONB和数组字段查询

### 2. 连接池配置

```typescript
const pool = new Pool({
  // ... 其他配置
  max: 20, // 最大连接数
  idleTimeoutMillis: 30000, // 空闲超时
  connectionTimeoutMillis: 2000, // 连接超时
});
```

### 3. 批量操作

```typescript
async function batchInsertEmbeddings(
  embeddings: Array<{
    documentId: string;
    content: string;
    embedding: number[];
    metadata?: any;
  }>,
) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const item of embeddings) {
      await client.query(
        'INSERT INTO document_embeddings (document_id, content, embedding, metadata) VALUES ($1, $2, $3, $4)',
        [
          item.documentId,
          item.content,
          `[${item.embedding.join(',')}]`,
          JSON.stringify(item.metadata),
        ],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

## 监控和维护

### 1. 性能监控

```sql
-- 查看向量索引使用情况
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%embedding%';

-- 查看表大小
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 2. 数据清理

```sql
-- 清理过期的聊天记录（保留30天）
DELETE FROM chat_embeddings
WHERE created_at < NOW() - INTERVAL '30 days';

-- 清理重复的文档嵌入
DELETE FROM document_embeddings
WHERE id NOT IN (
    SELECT MIN(id)
    FROM document_embeddings
    GROUP BY document_id
);
```

## 故障排除

### 1. 常见问题

**问题**: pgvector扩展未安装
**解决**: 确保使用`pgvector/pgvector:pg16`镜像

**问题**: 向量维度不匹配
**解决**: 确保所有向量都是1536维（OpenAI标准）

**问题**: 搜索性能慢
**解决**: 检查索引是否正确创建，考虑调整`lists`参数

### 2. 日志查看

```bash
# 查看PostgreSQL日志
docker logs aiofix-postgres

# 查看容器状态
docker ps | grep postgres
```

## 扩展功能

### 1. 多租户支持

可以为每个租户创建独立的向量表：

```sql
CREATE TABLE tenant_1_document_embeddings (
    -- 与document_embeddings相同的结构
);
```

### 2. 向量压缩

对于大规模部署，可以考虑使用向量压缩技术：

```sql
-- 使用乘积量化压缩
CREATE INDEX document_embeddings_compressed_idx
ON document_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100, quantizer = 'product_quantizer');
```

### 3. 分布式部署

对于超大规模应用，可以考虑：

- 使用PostgreSQL分片
- 实现向量数据的水平分区
- 使用专门的向量数据库（如Pinecone、Weaviate）

---

**文档版本**: 1.0  
**最后更新**: 2024-01-01  
**维护者**: 项目开发团队
