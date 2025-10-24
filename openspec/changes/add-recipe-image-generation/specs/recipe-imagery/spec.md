## ADDED Requirements
### Requirement: Seedream API Key Management
系统 MUST 在右上角的“API 配置”面板中新增 Seedream 4.0 图片生成 API Key 的输入与保存，沿用现有本地安全存储策略，并在未配置时向用户提示。

#### Scenario: Save valid key
- **GIVEN** 用户打开“API 配置”面板，之前未设置 Seedream Key
- **WHEN** 用户输入非空的 Seedream API Key 并点击保存
- **THEN** 系统使用现有的本地加密存储机制记录该 Key
- **AND** 面板显示保存成功的反馈，并在后续解锁 Seedream 生成能力

#### Scenario: Missing key warning
- **GIVEN** 用户未保存 Seedream Key
- **WHEN** 用户尝试触发菜谱图片生成
- **THEN** 系统阻止调用 Seedream API 并提示用户先配置 Key

### Requirement: Seedream Prompt Construction
系统 MUST 依据火山引擎文生图提示词指南，为每道菜谱生成中英文结合的 prompt，包含菜名、烹饪方式、主配料、风味氛围等关键信息，并可选择性加入上色/灯光/摄影风格描述以提升图片质量。

#### Scenario: Generate localized prompt
- **GIVEN** 已生成的菜谱包含菜名、主要食材、烹饪手法与健康取向标签
- **WHEN** 系统准备调用 Seedream API
- **THEN** 会拼装出包含中文主体描述、英文风格补充、健康饮食限制说明的 prompt
- **AND** prompt 符合文生图指南的结构（例如“主体描述 + 场景 + 构图/光线 + 画质要求”）

### Requirement: Recipe Overview Imagery
菜谱生成后，系统 MUST 调用 Seedream API 生成菜谱配图，并在“菜谱概览”模块中展示，提供加载中的骨架态、失败提示与重试入口，同时缓存成功结果以避免重复请求。

#### Scenario: Display generated image
- **GIVEN** 用户完成菜谱生成且 Seedream Key 已配置
- **WHEN** Seedream API 返回有效的图片 URL 或 Base64 内容
- **THEN** “菜谱概览”在正文下方展示生成的菜品图片，并附带可访问的替代文本
- **AND** 若用户刷新页面或返回该菜谱，优先展示缓存的图片

#### Scenario: Handle generation failure
- **GIVEN** Seedream API 调用发生错误或超时
- **WHEN** 系统未能获取图片结果
- **THEN** “菜谱概览”显示失败提示与重试按钮，不影响菜谱文字内容的呈现
