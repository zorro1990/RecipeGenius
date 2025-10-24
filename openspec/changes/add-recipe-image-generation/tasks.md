## 1. Discovery
- [ ] 1.1 调研现有 API Key 存储与加密逻辑，确认可复用方案用于 Seedream Key。
- [ ] 1.2 梳理菜谱生成数据结构，确定用于组装 Seedream 提示词所需的字段（菜名、风味、主要食材等）。

## 2. Implementation
- [ ] 2.1 扩展 API 配置面板，新增 Seedream Key 输入、校验与安全存储。
- [ ] 2.2 实现 Seedream 4.0 图片生成客户端（含错误处理与重试策略），并接入菜谱生成流程。
- [ ] 2.3 基于菜谱内容自动构造提示词，并在生成流程中调用 Seedream API。
- [ ] 2.4 更新“菜谱概览”界面，展示图片、处理加载与失败状态，提供手动重试入口。

## 3. Validation
- [ ] 3.1 编写单元测试覆盖提示词生成逻辑与 Seedream 客户端基础分支。
- [ ] 3.2 手动验证无 Key、Key 无效、生成失败、生成成功等用户体验。
- [ ] 3.3 运行 `npm run build:check` 与 `openspec validate add-recipe-image-generation --strict`。
