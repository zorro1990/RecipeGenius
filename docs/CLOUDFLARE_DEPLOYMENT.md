# 🚀 Recipe-Genius Cloudflare Workers 部署指南

本指南将帮助您将Recipe-Genius智能菜谱生成器部署到Cloudflare Workers平台。

## 📋 前置要求

### 必需工具
- **Node.js** 18+ 
- **npm** 或 **yarn**
- **Cloudflare账户** (免费或付费)
- **域名** (可选，用于自定义域名)

### 必需的API密钥
至少需要配置一个AI提供商的API密钥：
- **DeepSeek** (推荐，性价比最高)
- **豆包** (字节跳动，国内稳定)
- **通义千问** (阿里云)
- **智谱AI** (清华技术)
- **Google Gemini** (功能强大)

## 🛠️ 部署步骤

### 1. 安装Wrangler CLI

```bash
# 全局安装Wrangler
npm install -g wrangler

# 或者使用项目本地安装
npm install wrangler --save-dev
```

### 2. 登录Cloudflare

```bash
# 登录Cloudflare账户
wrangler login

# 验证登录状态
wrangler whoami
```

### 3. 配置项目

```bash
# 克隆项目（如果还没有）
git clone <your-repo-url>
cd recipe-genius

# 安装依赖
npm install

# 复制环境变量模板
cp .env.cloudflare.example .env.cloudflare
```

### 4. 配置域名（可选）

编辑 `wrangler.toml` 文件，更新域名配置：

```toml
[env.production]
name = "recipe-genius-prod"
route = { pattern = "recipe-genius.your-domain.com/*", zone_name = "your-domain.com" }

[env.staging]
name = "recipe-genius-staging"
route = { pattern = "staging.recipe-genius.your-domain.com/*", zone_name = "your-domain.com" }
```

### 5. 设置环境变量和密钥

使用自动化脚本设置：

```bash
# 生产环境
npm run cf:setup

# 预发布环境
npm run cf:setup:staging

# 开发环境
npm run cf:setup:dev
```

或手动设置：

```bash
# 设置AI API密钥
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put DOUBAO_API_KEY
wrangler secret put DOUBAO_ENDPOINT_ID
wrangler secret put QWEN_API_KEY
wrangler secret put GLM_API_KEY
wrangler secret put GOOGLE_API_KEY
```

### 6. 创建KV存储

```bash
# 创建KV命名空间
wrangler kv:namespace create "recipe-genius-cache"

# 复制生成的ID到wrangler.toml文件
```

### 7. 构建和部署

```bash
# 构建项目
npm run build:cloudflare

# 部署到生产环境
npm run deploy

# 或部署到特定环境
npm run deploy:staging
npm run deploy:dev
```

### 8. 验证部署

```bash
# 运行自动化测试
./scripts/test-deployment.sh production

# 查看部署状态
npm run cf:deployments

# 查看实时日志
npm run cf:tail
```

## 🔧 配置详解

### wrangler.toml 配置

```toml
name = "recipe-genius"
main = ".open-next/worker.js"
compatibility_date = "2024-12-01"
compatibility_flags = ["nodejs_compat"]

# 环境变量
[vars]
NEXT_PUBLIC_APP_URL = "https://recipe-genius.your-domain.com"
NODE_ENV = "production"

# KV存储
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

# 资源限制
[limits]
cpu_ms = 50000
memory_mb = 256
```

### 环境变量说明

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API密钥 | 推荐 |
| `DOUBAO_API_KEY` | 豆包API密钥 | 可选 |
| `DOUBAO_ENDPOINT_ID` | 豆包端点ID | 与豆包API密钥配套 |
| `QWEN_API_KEY` | 通义千问API密钥 | 可选 |
| `GLM_API_KEY` | 智谱AI API密钥 | 可选 |
| `GOOGLE_API_KEY` | Google Gemini API密钥 | 可选 |
| `NEXT_PUBLIC_APP_URL` | 应用URL | 是 |

## 📊 监控和维护

### 查看日志

```bash
# 实时日志
wrangler tail

# 特定环境日志
wrangler tail --env staging
```

### 查看指标

```bash
# 部署历史
wrangler deployments list

# 密钥列表
wrangler secret list

# KV存储列表
wrangler kv:namespace list
```

### 回滚部署

```bash
# 回滚到上一个版本
wrangler rollback

# 回滚特定环境
wrangler rollback --env staging
```

## 🚨 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存重新构建
rm -rf .next .open-next node_modules
npm install
npm run build:cloudflare
```

#### 2. API密钥未生效
```bash
# 检查密钥配置
wrangler secret list

# 重新设置密钥
wrangler secret put DEEPSEEK_API_KEY
```

#### 3. 域名解析问题
- 检查DNS设置
- 确认Cloudflare代理状态
- 验证SSL证书

#### 4. 性能问题
- 检查资源限制配置
- 优化代码和依赖
- 启用缓存策略

### 调试技巧

```bash
# 本地预览
wrangler dev

# 详细日志
wrangler tail --format pretty

# 健康检查
curl https://your-domain.com/api/health
```

## 🔄 CI/CD 集成

### GitHub Actions 示例

```yaml
name: Deploy to Cloudflare Workers

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build:cloudflare
      
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          command: deploy
```

## 📈 性能优化

### 缓存策略
- 静态资源：1年缓存
- API响应：5分钟缓存
- 动态内容：1小时缓存

### 代码优化
- 启用代码分割
- 压缩静态资源
- 优化图片格式

### 监控指标
- 响应时间 < 2秒
- 错误率 < 1%
- 可用性 > 99.9%

## 🔐 安全配置

### 安全头部
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin

### API安全
- 速率限制
- CORS配置
- 输入验证

## 💰 成本优化

### Cloudflare Workers 定价
- 免费层：100,000 请求/天
- 付费层：$5/月 + $0.50/百万请求

### 优化建议
- 启用缓存减少请求
- 优化代码减少CPU时间
- 使用KV存储减少外部调用

## 📞 支持和帮助

### 有用的命令

```bash
# 项目相关
npm run build:check      # 构建前检查
npm run deploy          # 部署到生产
npm run cf:setup        # 环境配置

# Cloudflare相关
wrangler --help         # 帮助信息
wrangler status         # 服务状态
wrangler whoami         # 当前用户
```

### 文档链接
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [OpenNext 文档](https://opennext.js.org/)

---

🎉 **恭喜！** 您已成功将Recipe-Genius部署到Cloudflare Workers！

如有问题，请查看故障排除部分或联系技术支持。
