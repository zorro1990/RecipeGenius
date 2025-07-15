# 🔑 API密钥配置指南

Recipe-Genius现在支持前端API密钥配置，让您可以直接在浏览器中管理AI提供商的API密钥，无需修改服务器配置。

## ✨ 新功能特点

- 🔒 **安全存储**: API密钥在浏览器本地加密存储
- 🔄 **多提供商支持**: 支持DeepSeek、豆包、通义千问、智谱AI、Google Gemini
- ✅ **实时验证**: 输入API密钥后立即测试连接有效性
- 🎯 **智能回退**: 优先使用前端配置，自动回退到环境变量
- 📊 **状态显示**: 实时显示API配置状态和当前使用的提供商

## 🚀 使用方法

### 1. 访问API设置

有三种方式打开API设置：

1. **首页右上角**: 点击设置图标 ⚙️
2. **食材页面**: 点击右上角的API状态指示器
3. **无密钥提示**: 当没有配置API密钥时，系统会显示配置引导

### 2. 配置API密钥

1. 在设置界面中选择要配置的AI提供商
2. 输入对应的API密钥
3. 对于豆包，还需要输入端点ID
4. 系统会自动验证密钥有效性
5. 点击"保存设置"完成配置

### 3. 支持的AI提供商

| 提供商 | 获取地址 | 密钥格式 | 特殊要求 |
|--------|----------|----------|----------|
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com) | `sk-xxxxxxxx...` | 无 |
| **豆包** | [console.volcengine.com/ark](https://console.volcengine.com/ark) | `xxxxxxxx-xxxx...` | 需要端点ID |
| **通义千问** | [dashscope.aliyuncs.com](https://dashscope.aliyuncs.com) | `sk-xxxxxxxx...` | 无 |
| **智谱AI** | [open.bigmodel.cn](https://open.bigmodel.cn) | `xxxxxxxx...` | 无 |
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) | `AIzaxxxxxxxx...` | 需科学上网 |

## 🔒 安全特性

### 本地加密存储
- API密钥使用Base64编码和字符混淆进行基础加密
- 密钥仅存储在浏览器localStorage中，不会上传到服务器
- 支持掩码显示，保护密钥隐私

### 输入验证
- 自动验证API密钥格式
- 实时测试API连接有效性
- 防止无效密钥的存储

### 安全提示
- 显示安全警告，提醒用户保护API密钥
- 提供清除密钥的选项
- 支持单个或批量清除

## 🎯 用户体验优化

### 智能引导
- 无API密钥时显示友好的配置引导
- 错误时提供直接的解决方案
- 实时状态反馈

### 状态指示
- API状态指示器显示当前配置状态
- 支持多提供商状态显示
- 实时更新配置变化

### 错误处理
- 详细的错误信息和解决建议
- 网络错误的友好提示
- 配置问题的直接修复入口

## 🛠️ 技术实现

### 前端组件
- `APISettingsModal`: 主要的API设置界面
- `APIStatusIndicator`: API状态指示器
- `api-key-storage.ts`: API密钥存储和管理工具

### 后端支持
- `/api/test-api-key`: API密钥验证端点
- 修改的`ai-providers.ts`: 支持动态API密钥

### 安全措施
- 简单加密算法保护localStorage数据
- 输入sanitization防止注入攻击
- 格式验证确保密钥有效性

## 📝 使用示例

### 配置DeepSeek API
1. 访问 [DeepSeek平台](https://platform.deepseek.com)
2. 注册账号并获取API密钥
3. 在Recipe-Genius中打开API设置
4. 选择DeepSeek，输入密钥（格式：`sk-xxxxxxxx...`）
5. 等待验证通过，点击保存

### 配置豆包API
1. 访问 [豆包控制台](https://console.volcengine.com/ark)
2. 创建推理端点，获取API密钥和端点ID
3. 在Recipe-Genius中配置豆包
4. 输入API密钥和端点ID
5. 验证通过后保存

## 🔧 故障排除

### 常见问题

**Q: API密钥验证失败怎么办？**
A: 检查密钥格式是否正确，确保网络连接正常，验证密钥是否有效。

**Q: 豆包配置失败？**
A: 确保同时提供了API密钥和端点ID，检查端点是否已激活。

**Q: 密钥丢失了怎么办？**
A: 密钥存储在浏览器本地，清除浏览器数据会丢失密钥，需要重新配置。

**Q: 可以同时配置多个提供商吗？**
A: 可以，系统会自动选择可用的提供商，并支持故障转移。

### 技术支持
如果遇到问题，请检查：
1. 浏览器控制台是否有错误信息
2. 网络连接是否正常
3. API密钥是否有效且有足够额度
4. 是否启用了必要的浏览器功能（localStorage）

## 🎉 总结

新的前端API密钥配置功能让Recipe-Genius更加用户友好，您可以：
- 无需技术知识即可配置AI提供商
- 安全地管理多个API密钥
- 享受实时验证和状态反馈
- 获得智能的错误处理和引导

立即体验这个强大的新功能，让AI为您的厨房带来更多创意！🍳✨
