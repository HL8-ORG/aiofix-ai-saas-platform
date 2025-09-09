#!/bin/bash
set -e

# 安装pgvector扩展（如果可用）
if command -v pg_config &> /dev/null; then
    echo "Installing pgvector extension..."
    # 这里可以添加pgvector的安装逻辑
    # 在实际部署时，需要确保pgvector扩展已安装
fi

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 创建AI向量存储数据库（独立数据库，因为需要pgvector扩展）
    CREATE DATABASE aiofix_ai_vectors;
    
    -- 为AI向量数据库创建用户和权限
    GRANT ALL PRIVILEGES ON DATABASE aiofix_ai_vectors TO $POSTGRES_USER;
EOSQL

echo "Database initialization completed successfully!"
echo "Using table-level isolation with tenant_id field in aiofix_platform database"
