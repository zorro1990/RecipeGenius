## ADDED Requirements
### Requirement: Focused Ingredient Upload Entry
系统 MUST 在上传前突出主任务，将功能说明折叠或移至帮助入口，确保上传按钮、支持格式及大小限制在首屏清晰可见。

#### Scenario: Entry state highlights upload
- **GIVEN** 用户首次或再次进入食材上传页面
- **WHEN** 页面加载完成尚未选择图片
- **THEN** 首屏仅展示上传面板与必要的格式/隐私提示
- **AND** 功能介绍折叠成帮助链接或次要折叠卡，不阻挡上传区域

### Requirement: Collapsible Recognition Summary
系统 MUST 在识别结果中默认展示结构化的食材列表与置信度，将 AI 生成的长文本描述折叠为可展开的辅助信息。

#### Scenario: Default collapsed description
- **GIVEN** AI 成功返回识别结果
- **WHEN** 用户查看识别区块
- **THEN** 先看到可编辑的食材列表与置信度标记
- **AND** 文本描述保持折叠，用户点击“展开识别说明”后才显示完整段落

### Requirement: Unified Generation CTA State
系统 MUST 在食材确认后的生成阶段维护单一 CTA，加载时禁用重复操作，并在状态完成后恢复主按钮。

#### Scenario: Ready state
- **GIVEN** 用户成功识别或手动补充了至少一种食材
- **WHEN** 用户查看界面
- **THEN** 页面底部仅展示一个主 CTA，文案为“生成我的专属菜谱”
- **AND** 识别卡片中不再出现重复的确认按钮

#### Scenario: Generation in progress
- **GIVEN** 用户点击底部 CTA
- **WHEN** 菜谱生成请求进行中
- **THEN** 同一 CTA 切换为加载态并显示预计耗时提示
- **AND** 食材列表进入只读状态，避免过程中被编辑

#### Scenario: Generation complete
- **GIVEN** AI 返回菜谱结果或失败反馈
- **WHEN** 生成流程结束
- **THEN** CTA 根据结果切换为“查看菜谱详情”或“重新尝试生成”，底部不再出现额外按钮
