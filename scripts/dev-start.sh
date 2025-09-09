#!/bin/bash

# Aiofix AI SaaS Platform - 开发环境启动脚本
# 该脚本用于快速启动Docker开发环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  Aiofix AI SaaS Platform${NC}"
    echo -e "${BLUE}  开发环境启动脚本${NC}"
    echo -e "${BLUE}================================${NC}"
}

# 检查Docker是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装，请先安装Docker"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose未安装，请先安装Docker Compose"
        exit 1
    fi

    print_message "Docker和Docker Compose已安装"
}

# 检查环境文件
check_env_file() {
    if [ ! -f ".env" ]; then
        print_warning ".env文件不存在，从env.example创建"
        if [ -f "env.example" ]; then
            cp env.example .env
            print_message "已创建.env文件，请根据需要修改配置"
        else
            print_error "env.example文件不存在"
            exit 1
        fi
    else
        print_message ".env文件已存在"
    fi
}

# 检查脚本权限
check_script_permissions() {
    if [ ! -x "scripts/init-multiple-databases.sh" ]; then
        print_warning "设置数据库初始化脚本权限"
        chmod +x scripts/init-multiple-databases.sh
    fi

    if [ ! -x "scripts/init-ai-vectors.sh" ]; then
        print_warning "设置AI向量数据库初始化脚本权限"
        chmod +x scripts/init-ai-vectors.sh
    fi

    print_message "脚本权限检查完成"
}

# 启动Docker服务
start_services() {
    print_message "启动Docker服务..."
    
    # 检查是否有运行中的容器
    if docker-compose ps | grep -q "Up"; then
        print_warning "检测到运行中的容器，正在停止..."
        docker-compose down
    fi

    # 启动服务
    docker-compose up -d

    print_message "等待服务启动..."
    sleep 10
}

# 检查服务状态
check_services() {
    print_message "检查服务状态..."
    
    # 检查PostgreSQL
    if docker exec aiofix-postgres pg_isready -U aiofix_user &> /dev/null; then
        print_message "✅ PostgreSQL服务正常"
    else
        print_error "❌ PostgreSQL服务异常"
        return 1
    fi

    # 检查MongoDB
    if docker exec aiofix-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
        print_message "✅ MongoDB服务正常"
    else
        print_error "❌ MongoDB服务异常"
        return 1
    fi

    # 检查Redis
    if docker exec aiofix-redis redis-cli ping | grep -q "PONG"; then
        print_message "✅ Redis服务正常"
    else
        print_error "❌ Redis服务异常"
        return 1
    fi

    return 0
}

# 显示服务信息
show_service_info() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}  服务访问信息${NC}"
    echo -e "${BLUE}================================${NC}"
    
    echo -e "\n${GREEN}数据库服务:${NC}"
    echo -e "  PostgreSQL: localhost:5432 (aiofix_user / aiofix_password)"
    echo -e "  MongoDB:    localhost:27017 (aiofix_admin / aiofix_password)"
    echo -e "  Redis:      localhost:6379"
    
    echo -e "\n${GREEN}管理界面:${NC}"
    echo -e "  pgAdmin:         http://localhost:8080 (admin@aiofix.com / admin123)"
    echo -e "  Mongo Express:   http://localhost:8082 (admin / admin123)"
    echo -e "  Redis Commander: http://localhost:8081"
    
    echo -e "\n${GREEN}AI向量数据库:${NC}"
    echo -e "  数据库: aiofix_ai_vectors"
    echo -e "  连接: docker exec -it aiofix-postgres psql -U aiofix_user -d aiofix_ai_vectors"
    
    echo -e "\n${GREEN}常用命令:${NC}"
    echo -e "  查看服务状态: docker-compose ps"
    echo -e "  查看日志:     docker-compose logs -f [service_name]"
    echo -e "  停止服务:     docker-compose down"
    echo -e "  重启服务:     docker-compose restart [service_name]"
}

# 显示数据库信息
show_database_info() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}  数据库信息${NC}"
    echo -e "${BLUE}================================${NC}"
    
    print_message "PostgreSQL数据库列表:"
    docker exec aiofix-postgres psql -U aiofix_user -d aiofix_platform -c "\l" | grep "aiofix_"
    
    print_message "MongoDB数据库列表:"
    docker exec aiofix-mongodb mongosh --eval "show dbs" | grep "aiofix"
    
    print_message "Redis键数量:"
    docker exec aiofix-redis redis-cli dbsize
}

# 主函数
main() {
    print_header
    
    # 检查环境
    check_docker
    check_env_file
    check_script_permissions
    
    # 启动服务
    start_services
    
    # 检查服务状态
    if check_services; then
        print_message "🎉 所有服务启动成功！"
        show_service_info
        show_database_info
        
        echo -e "\n${GREEN}开发环境已就绪，可以开始开发了！${NC}"
    else
        print_error "服务启动失败，请检查日志"
        echo -e "\n${YELLOW}查看日志命令:${NC}"
        echo -e "  docker-compose logs postgres"
        echo -e "  docker-compose logs mongodb"
        echo -e "  docker-compose logs redis"
        exit 1
    fi
}

# 脚本参数处理
case "${1:-}" in
    "stop")
        print_message "停止所有服务..."
        docker-compose down
        print_message "服务已停止"
        ;;
    "restart")
        print_message "重启所有服务..."
        docker-compose restart
        print_message "服务已重启"
        ;;
    "status")
        print_message "服务状态:"
        docker-compose ps
        ;;
    "logs")
        print_message "查看服务日志:"
        docker-compose logs -f "${2:-}"
        ;;
    "help"|"-h"|"--help")
        echo -e "${BLUE}用法:${NC}"
        echo -e "  $0          启动开发环境"
        echo -e "  $0 stop     停止所有服务"
        echo -e "  $0 restart  重启所有服务"
        echo -e "  $0 status   查看服务状态"
        echo -e "  $0 logs     查看服务日志"
        echo -e "  $0 help     显示帮助信息"
        ;;
    "")
        main
        ;;
    *)
        print_error "未知参数: $1"
        echo -e "使用 '$0 help' 查看帮助信息"
        exit 1
        ;;
esac
