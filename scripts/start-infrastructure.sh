#!/bin/bash

# Aiofix AI SaaS Platform - 基础设施启动脚本
# 启动所有必要的服务：PostgreSQL、MongoDB、Redis

set -e

echo "🚀 启动 Aiofix AI SaaS Platform 基础设施..."

# 检查Docker是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查docker-compose是否可用
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose 未安装，请先安装 docker-compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p data/postgres
mkdir -p data/mongodb
mkdir -p data/redis

# 设置脚本执行权限
chmod +x scripts/init-multiple-databases.sh

# 启动服务
echo "🐳 启动 Docker 服务..."
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."

# 检查PostgreSQL
if docker-compose exec -T postgres pg_isready -U aiofix_user -d aiofix_platform > /dev/null 2>&1; then
    echo "✅ PostgreSQL 已启动"
else
    echo "❌ PostgreSQL 启动失败"
    docker-compose logs postgres
    exit 1
fi

# 检查MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
    echo "✅ MongoDB 已启动"
else
    echo "❌ MongoDB 启动失败"
    docker-compose logs mongodb
    exit 1
fi

# 检查Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis 已启动"
else
    echo "❌ Redis 启动失败"
    docker-compose logs redis
    exit 1
fi

echo ""
echo "🎉 基础设施启动完成！"
echo ""
echo "📊 服务访问信息："
echo "  PostgreSQL:     localhost:5432"
echo "  MongoDB:        localhost:27017"
echo "  Redis:          localhost:6379"
echo ""
echo "🖥️  管理界面："
echo "  pgAdmin:        http://localhost:8080 (admin@aiofix.com / admin123)"
echo "  Redis Commander: http://localhost:8081"
echo "  MongoDB Express: http://localhost:8082 (admin / admin123)"
echo ""
echo "📝 数据库信息："
echo "  PostgreSQL 用户: aiofix_user"
echo "  PostgreSQL 密码: aiofix_password"
echo "  MongoDB 用户: aiofix_admin"
echo "  MongoDB 密码: aiofix_password"
echo ""
echo "🔧 管理命令："
echo "  查看日志:       docker-compose logs [service]"
echo "  停止服务:       docker-compose down"
echo "  重启服务:       docker-compose restart [service]"
echo "  查看状态:       docker-compose ps"
echo ""
