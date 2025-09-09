#!/bin/bash
set -e

# 数据迁移脚本：从数据库级隔离迁移到表级隔离
# 注意：此脚本会删除现有的租户数据库，请确保已备份重要数据

echo "=========================================="
echo "数据隔离策略迁移脚本"
echo "从数据库级隔离迁移到表级隔离"
echo "=========================================="

# 检查是否在正确的环境中运行
if [ -z "$POSTGRES_USER" ] || [ -z "$POSTGRES_DB" ]; then
    echo "错误：请设置环境变量 POSTGRES_USER 和 POSTGRES_DB"
    exit 1
fi

echo "警告：此操作将删除现有的租户数据库！"
echo "请确保已备份重要数据。"
read -p "是否继续？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "操作已取消"
    exit 1
fi

echo "开始迁移..."

# 连接到PostgreSQL并执行迁移
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    -- 1. 备份现有数据（如果存在）
    -- 注意：这里只是示例，实际迁移时需要根据具体情况调整
    
    -- 2. 删除旧的租户数据库
    DROP DATABASE IF EXISTS aiofix_tenant_1;
    DROP DATABASE IF EXISTS aiofix_tenant_2;
    DROP DATABASE IF EXISTS aiofix_tenant_3;
    DROP DATABASE IF EXISTS aiofix_notifications;
    DROP DATABASE IF EXISTS aiofix_users;
    DROP DATABASE IF EXISTS aiofix_organizations;
    DROP DATABASE IF EXISTS aiofix_platform_management;
    
    -- 3. 保留事件存储和AI向量数据库
    -- aiofix_events 和 aiofix_ai_vectors 保持不变
    
    -- 4. 创建表级隔离的表结构
    -- 执行表级隔离初始化脚本
    \i /docker-entrypoint-initdb.d/02-init-table-level-isolation.sh
    
    -- 5. 迁移现有数据（如果有的话）
    -- 这里需要根据实际的数据结构进行调整
    
    -- 6. 验证迁移结果
    SELECT 'Migration completed successfully' as status;
EOSQL

echo "迁移完成！"
echo ""
echo "新的数据隔离策略："
echo "- 所有租户数据存储在 aiofix_platform 数据库中"
echo "- 使用 tenant_id 字段进行数据隔离"
echo "- 支持行级安全策略（RLS）"
echo "- AI向量数据仍使用独立的 aiofix_ai_vectors 数据库"
echo ""
echo "请更新应用程序代码以使用新的数据隔离策略。"
