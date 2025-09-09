#!/bin/bash
set -e

echo "Initializing AI vectors database with pgvector extension..."

# 为AI向量数据库启用pgvector扩展
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "aiofix_ai_vectors" <<-EOSQL
    -- 创建pgvector扩展（如果可用）
    CREATE EXTENSION IF NOT EXISTS vector;
    
    -- 创建向量存储表
    CREATE TABLE IF NOT EXISTS document_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        document_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(1536), -- OpenAI embedding dimension
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- 创建向量索引
    CREATE INDEX IF NOT EXISTS document_embeddings_embedding_idx 
    ON document_embeddings USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);
    
    -- 创建文档ID索引
    CREATE INDEX IF NOT EXISTS document_embeddings_document_id_idx 
    ON document_embeddings (document_id);
    
    -- 创建元数据索引
    CREATE INDEX IF NOT EXISTS document_embeddings_metadata_idx 
    ON document_embeddings USING gin (metadata);
    
    -- 创建聊天历史向量表
    CREATE TABLE IF NOT EXISTS chat_embeddings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        chat_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        embedding VECTOR(1536),
        message_type VARCHAR(50) DEFAULT 'user', -- 'user', 'assistant', 'system'
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- 创建聊天向量索引
    CREATE INDEX IF NOT EXISTS chat_embeddings_embedding_idx 
    ON chat_embeddings USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);
    
    -- 创建聊天ID索引
    CREATE INDEX IF NOT EXISTS chat_embeddings_chat_id_idx 
    ON chat_embeddings (chat_id);
    
    -- 创建用户ID索引
    CREATE INDEX IF NOT EXISTS chat_embeddings_user_id_idx 
    ON chat_embeddings (user_id);
    
    -- 创建知识库向量表
    CREATE TABLE IF NOT EXISTS knowledge_embeddings (
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
    
    -- 创建知识库向量索引
    CREATE INDEX IF NOT EXISTS knowledge_embeddings_embedding_idx 
    ON knowledge_embeddings USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);
    
    -- 创建知识库ID索引
    CREATE INDEX IF NOT EXISTS knowledge_embeddings_knowledge_id_idx 
    ON knowledge_embeddings (knowledge_id);
    
    -- 创建分类索引
    CREATE INDEX IF NOT EXISTS knowledge_embeddings_category_idx 
    ON knowledge_embeddings (category);
    
    -- 创建标签索引
    CREATE INDEX IF NOT EXISTS knowledge_embeddings_tags_idx 
    ON knowledge_embeddings USING gin (tags);
    
    -- 创建相似度搜索函数
    CREATE OR REPLACE FUNCTION search_similar_documents(
        query_embedding VECTOR(1536),
        match_threshold FLOAT DEFAULT 0.7,
        match_count INT DEFAULT 10
    )
    RETURNS TABLE (
        id UUID,
        document_id VARCHAR(255),
        content TEXT,
        similarity FLOAT,
        metadata JSONB
    )
    LANGUAGE SQL
    AS \$\$
        SELECT 
            document_embeddings.id,
            document_embeddings.document_id,
            document_embeddings.content,
            1 - (document_embeddings.embedding <=> query_embedding) AS similarity,
            document_embeddings.metadata
        FROM document_embeddings
        WHERE 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
        ORDER BY document_embeddings.embedding <=> query_embedding
        LIMIT match_count;
    \$\$;
    
    -- 创建聊天相似度搜索函数
    CREATE OR REPLACE FUNCTION search_similar_chats(
        query_embedding VECTOR(1536),
        user_id_param VARCHAR(255),
        match_threshold FLOAT DEFAULT 0.7,
        match_count INT DEFAULT 10
    )
    RETURNS TABLE (
        id UUID,
        chat_id VARCHAR(255),
        message TEXT,
        similarity FLOAT,
        message_type VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE
    )
    LANGUAGE SQL
    AS \$\$
        SELECT 
            chat_embeddings.id,
            chat_embeddings.chat_id,
            chat_embeddings.message,
            1 - (chat_embeddings.embedding <=> query_embedding) AS similarity,
            chat_embeddings.message_type,
            chat_embeddings.created_at
        FROM chat_embeddings
        WHERE chat_embeddings.user_id = user_id_param
        AND 1 - (chat_embeddings.embedding <=> query_embedding) > match_threshold
        ORDER BY chat_embeddings.embedding <=> query_embedding
        LIMIT match_count;
    \$\$;
    
    -- 创建知识库相似度搜索函数
    CREATE OR REPLACE FUNCTION search_similar_knowledge(
        query_embedding VECTOR(1536),
        category_param VARCHAR(100) DEFAULT NULL,
        match_threshold FLOAT DEFAULT 0.7,
        match_count INT DEFAULT 10
    )
    RETURNS TABLE (
        id UUID,
        knowledge_id VARCHAR(255),
        title VARCHAR(500),
        content TEXT,
        similarity FLOAT,
        category VARCHAR(100),
        tags TEXT[]
    )
    LANGUAGE SQL
    AS \$\$
        SELECT 
            knowledge_embeddings.id,
            knowledge_embeddings.knowledge_id,
            knowledge_embeddings.title,
            knowledge_embeddings.content,
            1 - (knowledge_embeddings.embedding <=> query_embedding) AS similarity,
            knowledge_embeddings.category,
            knowledge_embeddings.tags
        FROM knowledge_embeddings
        WHERE (category_param IS NULL OR knowledge_embeddings.category = category_param)
        AND 1 - (knowledge_embeddings.embedding <=> query_embedding) > match_threshold
        ORDER BY knowledge_embeddings.embedding <=> query_embedding
        LIMIT match_count;
    \$\$;
    
    -- 授予权限
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $POSTGRES_USER;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $POSTGRES_USER;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO $POSTGRES_USER;
EOSQL

echo "AI vectors database initialized successfully with pgvector extension!"
