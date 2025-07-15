#!/bin/bash

# Cloudflare Workers环境变量设置脚本
# 使用方法: ./scripts/setup-cloudflare-env.sh [environment]
# environment: development, staging, production (默认: production)

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 环境参数
ENVIRONMENT=${1:-production}

echo -e "${BLUE}🚀 Recipe-Genius Cloudflare Workers 环境配置${NC}"
echo -e "${BLUE}环境: ${ENVIRONMENT}${NC}"
echo ""

# 检查wrangler是否安装
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ Wrangler CLI 未安装${NC}"
    echo -e "${YELLOW}请运行: npm install -g wrangler${NC}"
    exit 1
fi

# 检查是否已登录
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}⚠️  请先登录 Cloudflare${NC}"
    echo -e "${BLUE}运行: wrangler login${NC}"
    read -p "按回车键继续登录..."
    wrangler login
fi

echo -e "${GREEN}✅ Wrangler 已就绪${NC}"
echo ""

# 函数：设置密钥
set_secret() {
    local key=$1
    local description=$2
    local env_flag=""
    
    if [ "$ENVIRONMENT" != "production" ]; then
        env_flag="--env $ENVIRONMENT"
    fi
    
    echo -e "${BLUE}设置 ${key}${NC}"
    echo -e "${YELLOW}${description}${NC}"
    
    # 检查是否已存在
    if wrangler secret list $env_flag 2>/dev/null | grep -q "$key"; then
        read -p "密钥 $key 已存在，是否更新? (y/N): " update
        if [[ $update =~ ^[Yy]$ ]]; then
            echo "请输入新的 $key:"
            wrangler secret put $key $env_flag
        else
            echo -e "${YELLOW}跳过 $key${NC}"
        fi
    else
        echo "请输入 $key:"
        wrangler secret put $key $env_flag
    fi
    echo ""
}

# 函数：设置KV命名空间
setup_kv() {
    local env_flag=""
    if [ "$ENVIRONMENT" != "production" ]; then
        env_flag="--env $ENVIRONMENT"
    fi
    
    echo -e "${BLUE}🗄️  设置 KV 存储${NC}"
    
    # 检查是否已存在KV命名空间
    local kv_name="recipe-genius-cache-$ENVIRONMENT"
    local existing_kv=$(wrangler kv:namespace list | grep "$kv_name" | head -1)
    
    if [ -z "$existing_kv" ]; then
        echo "创建 KV 命名空间: $kv_name"
        wrangler kv:namespace create $kv_name $env_flag
        echo -e "${YELLOW}请将生成的 KV 命名空间 ID 添加到 wrangler.toml 文件中${NC}"
    else
        echo -e "${GREEN}✅ KV 命名空间已存在: $kv_name${NC}"
    fi
    echo ""
}

# 主要配置流程
echo -e "${BLUE}📝 配置 AI 提供商 API 密钥${NC}"
echo ""

# DeepSeek API密钥
set_secret "DEEPSEEK_API_KEY" "DeepSeek API密钥 (从 https://platform.deepseek.com 获取)"

# 豆包API密钥和端点
set_secret "DOUBAO_API_KEY" "豆包 API密钥 (从 https://console.volcengine.com/ark 获取)"
set_secret "DOUBAO_ENDPOINT_ID" "豆包端点ID (在豆包控制台创建推理端点后获取)"

# 通义千问API密钥
set_secret "QWEN_API_KEY" "通义千问 API密钥 (从 https://dashscope.aliyuncs.com 获取)"

# 智谱AI API密钥
set_secret "GLM_API_KEY" "智谱AI API密钥 (从 https://open.bigmodel.cn 获取)"

# Google Gemini API密钥
set_secret "GOOGLE_API_KEY" "Google Gemini API密钥 (从 https://aistudio.google.com/app/apikey 获取)"

# 设置KV存储
setup_kv

# 验证配置
echo -e "${BLUE}🔍 验证配置${NC}"
echo ""

# 列出所有密钥
echo -e "${GREEN}已配置的密钥:${NC}"
local env_flag=""
if [ "$ENVIRONMENT" != "production" ]; then
    env_flag="--env $ENVIRONMENT"
fi

wrangler secret list $env_flag

echo ""
echo -e "${GREEN}✅ 环境配置完成!${NC}"
echo ""

# 提供下一步指导
echo -e "${BLUE}📋 下一步操作:${NC}"
echo ""
echo "1. 更新 wrangler.toml 文件中的域名配置"
echo "2. 如果创建了新的 KV 命名空间，请更新 wrangler.toml 中的 KV 配置"
echo "3. 运行构建命令: npm run build:cloudflare"
echo "4. 部署到 Cloudflare Workers: npm run deploy:$ENVIRONMENT"
echo ""

# 显示有用的命令
echo -e "${BLUE}🛠️  有用的命令:${NC}"
echo ""
echo "查看密钥列表:"
echo "  wrangler secret list $env_flag"
echo ""
echo "删除密钥:"
echo "  wrangler secret delete <KEY_NAME> $env_flag"
echo ""
echo "查看部署状态:"
echo "  wrangler deployments list $env_flag"
echo ""
echo "查看日志:"
echo "  wrangler tail $env_flag"
echo ""

echo -e "${GREEN}🎉 配置完成! 现在可以部署 Recipe-Genius 到 Cloudflare Workers 了!${NC}"
