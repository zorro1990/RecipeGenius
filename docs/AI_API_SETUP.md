# 🤖 AI API配置指南

## 📋 概述

由于Google Gemini API在国内访问不稳定，我们支持多个优秀的国内AI提供商。你可以选择配置一个或多个API密钥作为备用。

## 🚀 推荐配置顺序

### 1. 🥇 **豆包 (字节跳动) - 首选推荐**

**优势：**
- ✅ 国内访问稳定，无需科学上网
- ✅ 响应速度快，延迟低
- ✅ 中文理解能力优秀
- ✅ 价格合理，有免费额度

**获取步骤：**
1. 访问 [火山引擎控制台](https://console.volcengine.com/ark)
2. 注册/登录账号
3. 进入"豆包大模型"服务
4. 创建API密钥
5. 复制密钥到 `.env.local` 文件：
   ```bash
   DOUBAO_API_KEY=your_doubao_api_key_here
   ```

### 2. 🥈 **DeepSeek - 性价比之王**

**优势：**
- ✅ 价格极低，业界最便宜
- ✅ 性能优秀，支持长上下文
- ✅ 代码理解能力强
- ✅ API稳定可靠

**获取步骤：**
1. 访问 [DeepSeek平台](https://platform.deepseek.com)
2. 注册账号并完成认证
3. 进入API管理页面
4. 创建API密钥
5. 配置环境变量：
   ```bash
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```

### 3. 🥉 **通义千问 (阿里云)**

**优势：**
- ✅ 阿里云生态支持
- ✅ 企业级稳定性
- ✅ 多模态能力
- ✅ 中文优化

**获取步骤：**
1. 访问 [阿里云百炼平台](https://dashscope.aliyuncs.com)
2. 使用阿里云账号登录
3. 开通DashScope服务
4. 获取API-KEY
5. 配置环境变量：
   ```bash
   QWEN_API_KEY=your_qwen_api_key_here
   ```

### 4. 🏅 **智谱AI (ChatGLM)**

**优势：**
- ✅ 清华大学技术背景
- ✅ 中文语言模型专家
- ✅ 多模态支持
- ✅ 合理定价

**获取步骤：**
1. 访问 [智谱AI开放平台](https://open.bigmodel.cn)
2. 注册并完成实名认证
3. 进入API管理
4. 创建API密钥
5. 配置环境变量：
   ```bash
   GLM_API_KEY=your_glm_api_key_here
   ```

### 5. 🔄 **Google Gemini (备用)**

**注意：** 可能需要科学上网

**获取步骤：**
1. 访问 [Google AI Studio](https://aistudio.google.com/app/apikey)
2. 使用Google账号登录
3. 创建API密钥
4. 配置环境变量：
   ```bash
   GOOGLE_API_KEY=your_google_api_key_here
   ```

## ⚙️ 配置步骤

### 1. 复制环境变量文件
```bash
cp .env.example .env.local
```

### 2. 编辑配置文件
```bash
# 编辑 .env.local 文件，添加你的API密钥
nano .env.local
```

### 3. 重启开发服务器
```bash
npm run dev
```

### 4. 测试API连接
访问 `http://localhost:3001/api/test-ai` 检查配置状态

## 🔧 配置验证

### 检查配置状态
```bash
curl http://localhost:3001/api/test-ai
```

### 测试AI调用
```bash
curl -X POST http://localhost:3001/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "你好，请介绍一下自己"}'
```

## 💡 最佳实践

### 1. **多提供商配置**
建议配置2-3个提供商作为备用：
```bash
# 主要提供商
DOUBAO_API_KEY=your_doubao_key
# 备用提供商
DEEPSEEK_API_KEY=your_deepseek_key
QWEN_API_KEY=your_qwen_key
```

### 2. **成本优化**
- **开发测试**: 使用DeepSeek（最便宜）
- **生产环境**: 使用豆包（稳定性好）
- **高并发**: 配置多个提供商负载均衡

### 3. **监控和告警**
系统会自动在提供商失败时切换到备用提供商，建议监控API调用状态。

## 🚨 常见问题

### Q: 为什么不用Google Gemini？
A: Google服务在国内访问不稳定，经常出现连接超时或被墙的情况。

### Q: 哪个提供商最便宜？
A: DeepSeek价格最低，但建议配置多个提供商确保稳定性。

### Q: 如何选择合适的提供商？
A: 
- **个人项目**: DeepSeek (便宜)
- **商业项目**: 豆包 (稳定)
- **企业项目**: 通义千问 (阿里云生态)

### Q: API密钥安全吗？
A: 
- ✅ 密钥存储在 `.env.local` 文件中，不会提交到代码仓库
- ✅ 生产环境使用环境变量管理
- ✅ 定期轮换API密钥

## 📊 价格对比 (参考)

| 提供商 | 输入价格 | 输出价格 | 免费额度 | 推荐场景 |
|--------|----------|----------|----------|----------|
| DeepSeek | 极低 | 极低 | 有 | 开发测试 |
| 豆包 | 低 | 低 | 有 | 生产环境 |
| 通义千问 | 中 | 中 | 有 | 企业应用 |
| 智谱AI | 中 | 中 | 有 | 中文优化 |
| Gemini | 中 | 中 | 有 | 国际项目 |

## 🎯 快速开始

1. **选择一个提供商** (推荐豆包或DeepSeek)
2. **获取API密钥**
3. **配置环境变量**
4. **测试连接**
5. **开始使用**

配置完成后，你的智能菜谱生成器就可以正常工作了！🎉
