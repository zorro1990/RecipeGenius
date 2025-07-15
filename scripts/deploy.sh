#!/bin/bash

# Recipe-Genius Cloudflare Workers 自动化部署脚本
# 使用方法: ./scripts/deploy.sh [environment] [options]
# environment: development, staging, production (默认: production)
# options: --skip-build, --skip-tests, --force

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 参数解析
ENVIRONMENT=${1:-production}
SKIP_BUILD=false
SKIP_TESTS=false
FORCE=false

for arg in "$@"; do
    case $arg in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
    esac
done

# 显示部署信息
echo -e "${PURPLE}🚀 Recipe-Genius Cloudflare Workers 部署${NC}"
echo -e "${BLUE}环境: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}时间: $(date)${NC}"
echo ""

# 检查必要工具
check_tools() {
    echo -e "${BLUE}🔍 检查必要工具...${NC}"
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Node.js $(node --version)${NC}"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm $(npm --version)${NC}"
    
    # 检查wrangler
    if ! command -v wrangler &> /dev/null; then
        echo -e "${RED}❌ Wrangler CLI 未安装${NC}"
        echo -e "${YELLOW}请运行: npm install -g wrangler${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Wrangler $(wrangler --version)${NC}"
    
    # 检查是否已登录Cloudflare
    if ! wrangler whoami &> /dev/null; then
        echo -e "${RED}❌ 未登录 Cloudflare${NC}"
        echo -e "${YELLOW}请运行: wrangler login${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Cloudflare 已登录 ($(wrangler whoami))${NC}"
    
    echo ""
}

# 检查Git状态
check_git_status() {
    echo -e "${BLUE}📋 检查 Git 状态...${NC}"
    
    if [ -d ".git" ]; then
        # 检查是否有未提交的更改
        if [ -n "$(git status --porcelain)" ] && [ "$FORCE" = false ]; then
            echo -e "${YELLOW}⚠️  有未提交的更改:${NC}"
            git status --short
            echo ""
            read -p "是否继续部署? (y/N): " continue_deploy
            if [[ ! $continue_deploy =~ ^[Yy]$ ]]; then
                echo -e "${RED}❌ 部署已取消${NC}"
                exit 1
            fi
        fi
        
        # 显示当前分支和提交
        local branch=$(git branch --show-current)
        local commit=$(git rev-parse --short HEAD)
        echo -e "${GREEN}✅ Git 分支: ${branch}${NC}"
        echo -e "${GREEN}✅ Git 提交: ${commit}${NC}"
    else
        echo -e "${YELLOW}⚠️  不是 Git 仓库${NC}"
    fi
    
    echo ""
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}📦 安装依赖...${NC}"
    
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        npm ci
        echo -e "${GREEN}✅ 依赖安装完成${NC}"
    else
        echo -e "${GREEN}✅ 依赖已是最新${NC}"
    fi
    
    echo ""
}

# 运行测试
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        echo -e "${YELLOW}⏭️  跳过测试${NC}"
        return
    fi
    
    echo -e "${BLUE}🧪 运行测试...${NC}"
    
    # 类型检查
    echo -e "${CYAN}TypeScript 类型检查...${NC}"
    npm run type-check
    echo -e "${GREEN}✅ 类型检查通过${NC}"
    
    # Lint检查
    echo -e "${CYAN}ESLint 检查...${NC}"
    npm run lint
    echo -e "${GREEN}✅ Lint 检查通过${NC}"
    
    # 如果有单元测试，在这里运行
    # npm test
    
    echo ""
}

# 构建项目
build_project() {
    if [ "$SKIP_BUILD" = true ]; then
        echo -e "${YELLOW}⏭️  跳过构建${NC}"
        return
    fi
    
    echo -e "${BLUE}🔨 构建项目...${NC}"
    
    # 清理之前的构建
    if [ -d ".next" ]; then
        rm -rf .next
        echo -e "${GREEN}✅ 清理旧构建${NC}"
    fi
    
    if [ -d ".open-next" ]; then
        rm -rf .open-next
        echo -e "${GREEN}✅ 清理 OpenNext 构建${NC}"
    fi
    
    # 构建项目
    npm run build:cloudflare
    echo -e "${GREEN}✅ 项目构建完成${NC}"
    
    # 验证构建输出
    if [ ! -f ".open-next/worker.js" ]; then
        echo -e "${RED}❌ 构建失败: 找不到 worker.js${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ 构建输出验证通过${NC}"
    
    echo ""
}

# 部署前检查
pre_deploy_check() {
    echo -e "${BLUE}🔍 部署前检查...${NC}"
    
    # 检查环境变量配置
    local env_flag=""
    if [ "$ENVIRONMENT" != "production" ]; then
        env_flag="--env $ENVIRONMENT"
    fi
    
    # 检查密钥配置
    echo -e "${CYAN}检查环境变量...${NC}"
    local secrets=$(wrangler secret list $env_flag 2>/dev/null || echo "")
    if [ -z "$secrets" ]; then
        echo -e "${YELLOW}⚠️  未找到配置的密钥${NC}"
        echo -e "${YELLOW}请运行: npm run cf:setup${NC}"
        read -p "是否继续部署? (y/N): " continue_deploy
        if [[ ! $continue_deploy =~ ^[Yy]$ ]]; then
            echo -e "${RED}❌ 部署已取消${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ 环境变量已配置${NC}"
    fi
    
    # 检查wrangler.toml配置
    if [ ! -f "wrangler.toml" ]; then
        echo -e "${RED}❌ 找不到 wrangler.toml 配置文件${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ wrangler.toml 配置文件存在${NC}"
    
    echo ""
}

# 执行部署
deploy() {
    echo -e "${BLUE}🚀 开始部署到 Cloudflare Workers...${NC}"
    
    local env_flag=""
    if [ "$ENVIRONMENT" != "production" ]; then
        env_flag="--env $ENVIRONMENT"
    fi
    
    # 执行部署
    wrangler deploy $env_flag
    
    echo -e "${GREEN}✅ 部署完成!${NC}"
    echo ""
}

# 部署后验证
post_deploy_check() {
    echo -e "${BLUE}🔍 部署后验证...${NC}"
    
    # 获取部署URL
    local url=""
    case $ENVIRONMENT in
        development)
            url="https://dev.recipe-genius.your-domain.com"
            ;;
        staging)
            url="https://staging.recipe-genius.your-domain.com"
            ;;
        production)
            url="https://recipe-genius.your-domain.com"
            ;;
    esac
    
    if [ -n "$url" ]; then
        echo -e "${CYAN}检查部署状态...${NC}"
        
        # 等待几秒让部署生效
        sleep 5
        
        # 检查健康状态
        if curl -f -s "$url/api/health" > /dev/null; then
            echo -e "${GREEN}✅ 健康检查通过${NC}"
        else
            echo -e "${YELLOW}⚠️  健康检查失败，但部署可能仍然成功${NC}"
        fi
        
        echo -e "${GREEN}🌐 应用URL: ${url}${NC}"
    fi
    
    echo ""
}

# 显示部署信息
show_deployment_info() {
    echo -e "${PURPLE}📊 部署信息${NC}"
    echo ""
    
    local env_flag=""
    if [ "$ENVIRONMENT" != "production" ]; then
        env_flag="--env $ENVIRONMENT"
    fi
    
    # 显示最新部署
    echo -e "${CYAN}最新部署:${NC}"
    wrangler deployments list $env_flag | head -5
    echo ""
    
    # 显示有用的命令
    echo -e "${BLUE}🛠️  有用的命令:${NC}"
    echo ""
    echo "查看实时日志:"
    echo "  npm run cf:tail$([ "$ENVIRONMENT" != "production" ] && echo ":$ENVIRONMENT")"
    echo ""
    echo "查看部署列表:"
    echo "  wrangler deployments list $env_flag"
    echo ""
    echo "回滚到上一个版本:"
    echo "  wrangler rollback $env_flag"
    echo ""
}

# 主执行流程
main() {
    check_tools
    check_git_status
    install_dependencies
    run_tests
    build_project
    pre_deploy_check
    deploy
    post_deploy_check
    show_deployment_info
    
    echo -e "${GREEN}🎉 Recipe-Genius 已成功部署到 Cloudflare Workers!${NC}"
    echo -e "${GREEN}环境: ${ENVIRONMENT}${NC}"
    echo -e "${GREEN}时间: $(date)${NC}"
}

# 执行主流程
main
