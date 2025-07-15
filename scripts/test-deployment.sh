#!/bin/bash

# Recipe-Genius Cloudflare Workers 部署测试脚本
# 使用方法: ./scripts/test-deployment.sh [environment] [base_url]
# environment: development, staging, production (默认: production)
# base_url: 测试的基础URL (可选，默认根据环境推断)

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
BASE_URL=${2:-""}

# 根据环境设置默认URL
if [ -z "$BASE_URL" ]; then
    case $ENVIRONMENT in
        development)
            BASE_URL="https://dev.recipe-genius.your-domain.com"
            ;;
        staging)
            BASE_URL="https://staging.recipe-genius.your-domain.com"
            ;;
        production)
            BASE_URL="https://recipe-genius.your-domain.com"
            ;;
        *)
            echo -e "${RED}❌ 未知环境: $ENVIRONMENT${NC}"
            exit 1
            ;;
    esac
fi

# 测试结果统计
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 显示测试信息
echo -e "${PURPLE}🧪 Recipe-Genius Cloudflare Workers 部署测试${NC}"
echo -e "${BLUE}环境: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}URL: ${BASE_URL}${NC}"
echo -e "${BLUE}时间: $(date)${NC}"
echo ""

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="${3:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${CYAN}测试 $TOTAL_TESTS: $test_name${NC}"
    
    # 执行测试命令
    local response
    local status_code
    local start_time=$(date +%s%3N)
    
    if response=$(eval "$test_command" 2>&1); then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        # 提取状态码
        status_code=$(echo "$response" | tail -n1 | grep -o '[0-9]\{3\}' | head -1)
        
        if [ "$status_code" = "$expected_status" ]; then
            echo -e "${GREEN}✅ 通过 (${duration}ms, HTTP $status_code)${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}❌ 失败 - 期望状态码 $expected_status, 实际 $status_code${NC}"
            echo -e "${YELLOW}响应: $response${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}❌ 失败 - 请求失败${NC}"
        echo -e "${YELLOW}错误: $response${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# 测试JSON响应
test_json_response() {
    local test_name="$1"
    local url="$2"
    local expected_field="$3"
    local method="${4:-GET}"
    local data="${5:-}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${CYAN}测试 $TOTAL_TESTS: $test_name${NC}"
    
    local curl_cmd="curl -s -w '\n%{http_code}'"
    if [ "$method" = "POST" ]; then
        curl_cmd="$curl_cmd -X POST -H 'Content-Type: application/json'"
        if [ -n "$data" ]; then
            curl_cmd="$curl_cmd -d '$data'"
        fi
    fi
    curl_cmd="$curl_cmd '$url'"
    
    local start_time=$(date +%s%3N)
    local response
    
    if response=$(eval "$curl_cmd" 2>&1); then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))
        
        # 分离响应体和状态码
        local body=$(echo "$response" | head -n -1)
        local status_code=$(echo "$response" | tail -n1)
        
        if [ "$status_code" = "200" ]; then
            # 检查JSON字段
            if echo "$body" | jq -e ".$expected_field" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ 通过 (${duration}ms, 包含字段: $expected_field)${NC}"
                PASSED_TESTS=$((PASSED_TESTS + 1))
            else
                echo -e "${RED}❌ 失败 - 响应中缺少字段: $expected_field${NC}"
                echo -e "${YELLOW}响应: $body${NC}"
                FAILED_TESTS=$((FAILED_TESTS + 1))
            fi
        else
            echo -e "${RED}❌ 失败 - HTTP状态码: $status_code${NC}"
            echo -e "${YELLOW}响应: $body${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        echo -e "${RED}❌ 失败 - 请求失败${NC}"
        echo -e "${YELLOW}错误: $response${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

# 检查必要工具
echo -e "${BLUE}🔍 检查测试工具...${NC}"

if ! command -v curl &> /dev/null; then
    echo -e "${RED}❌ curl 未安装${NC}"
    exit 1
fi
echo -e "${GREEN}✅ curl 可用${NC}"

if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}⚠️  jq 未安装，JSON测试将被跳过${NC}"
    JQ_AVAILABLE=false
else
    echo -e "${GREEN}✅ jq 可用${NC}"
    JQ_AVAILABLE=true
fi

echo ""

# 基础连通性测试
echo -e "${BLUE}🌐 基础连通性测试${NC}"
echo ""

run_test "主页访问" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL'" "200"
run_test "健康检查" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/health'" "200"

# API端点测试
echo -e "${BLUE}🔌 API端点测试${NC}"
echo ""

if [ "$JQ_AVAILABLE" = true ]; then
    test_json_response "健康检查详情" "$BASE_URL/api/health" "status"
    test_json_response "AI测试端点" "$BASE_URL/api/test-ai" "success"
    test_json_response "前端API状态" "$BASE_URL/api/frontend-api-status" "success" "POST" '{"apiKeys":{}}'
else
    run_test "健康检查API" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/health'" "200"
    run_test "AI测试API" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/test-ai'" "200"
fi

# 页面访问测试
echo -e "${BLUE}📄 页面访问测试${NC}"
echo ""

run_test "食材页面" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/ingredients'" "200"
run_test "API状态页面" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api-status'" "200"

# 静态资源测试
echo -e "${BLUE}📦 静态资源测试${NC}"
echo ""

run_test "Favicon" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/favicon.ico'" "200"

# 安全头部测试
echo -e "${BLUE}🔒 安全头部测试${NC}"
echo ""

# 测试安全头部
security_headers_test() {
    local response=$(curl -s -I "$BASE_URL")
    local headers_found=0
    local total_headers=4
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${CYAN}测试 $TOTAL_TESTS: 安全头部检查${NC}"
    
    if echo "$response" | grep -i "x-frame-options" > /dev/null; then
        echo -e "${GREEN}  ✅ X-Frame-Options 存在${NC}"
        headers_found=$((headers_found + 1))
    else
        echo -e "${RED}  ❌ X-Frame-Options 缺失${NC}"
    fi
    
    if echo "$response" | grep -i "x-content-type-options" > /dev/null; then
        echo -e "${GREEN}  ✅ X-Content-Type-Options 存在${NC}"
        headers_found=$((headers_found + 1))
    else
        echo -e "${RED}  ❌ X-Content-Type-Options 缺失${NC}"
    fi
    
    if echo "$response" | grep -i "referrer-policy" > /dev/null; then
        echo -e "${GREEN}  ✅ Referrer-Policy 存在${NC}"
        headers_found=$((headers_found + 1))
    else
        echo -e "${RED}  ❌ Referrer-Policy 缺失${NC}"
    fi
    
    if echo "$response" | grep -i "x-powered-by" > /dev/null; then
        echo -e "${RED}  ❌ X-Powered-By 应该被移除${NC}"
    else
        echo -e "${GREEN}  ✅ X-Powered-By 已移除${NC}"
        headers_found=$((headers_found + 1))
    fi
    
    if [ $headers_found -eq $total_headers ]; then
        echo -e "${GREEN}✅ 安全头部测试通过 ($headers_found/$total_headers)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 安全头部测试失败 ($headers_found/$total_headers)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

security_headers_test

# 性能测试
echo -e "${BLUE}⚡ 性能测试${NC}"
echo ""

performance_test() {
    local url="$1"
    local test_name="$2"
    local max_time="${3:-5000}" # 默认5秒
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${CYAN}测试 $TOTAL_TESTS: $test_name 响应时间${NC}"
    
    local start_time=$(date +%s%3N)
    local response=$(curl -s -w '%{http_code}' -o /dev/null "$url")
    local end_time=$(date +%s%3N)
    local duration=$((end_time - start_time))
    
    if [ "$response" = "200" ] && [ $duration -lt $max_time ]; then
        echo -e "${GREEN}✅ 通过 (${duration}ms < ${max_time}ms)${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 失败 (${duration}ms >= ${max_time}ms 或状态码: $response)${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
}

performance_test "$BASE_URL" "主页" 3000
performance_test "$BASE_URL/api/health" "健康检查" 2000

# 显示测试结果
echo -e "${PURPLE}📊 测试结果汇总${NC}"
echo ""
echo -e "${BLUE}总测试数: $TOTAL_TESTS${NC}"
echo -e "${GREEN}通过: $PASSED_TESTS${NC}"
echo -e "${RED}失败: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 所有测试通过! Recipe-Genius 部署成功!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ 有 $FAILED_TESTS 个测试失败，请检查部署${NC}"
    exit 1
fi
