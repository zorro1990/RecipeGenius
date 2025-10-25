## ADDED Requirements
### Requirement: Storyflow Generation Experience
系统 MUST 以分段故事流引导菜谱生成过程，包括 Skeleton 过渡、进度提示与菜系匹配反馈。

#### Scenario: Progressive skeleton loading
- **GIVEN** 用户点击「生成菜谱」
- **WHEN** 请求未完成
- **THEN** 页面切换到故事流模式，展示包含步骤指示与 Skeleton 占位的进度面板
- **AND** 每当状态变化（请求发送、模型响应、菜系匹配验证）时，进度面板更新对应节点与说明

#### Scenario: Cuisine retry feedback
- **GIVEN** 菜系匹配首次失败
- **WHEN** 系统触发自动重试
- **THEN** 故事流界面 MUST 显示当前尝试次数与失败原因摘要
- **AND** 提供预计剩余时间或继续等待提示，避免用户误以为卡死

### Requirement: Preference Wizard Flow
系统 MUST 将偏好设置拆分为多步向导，并在每步提供实时预览与校验反馈。

#### Scenario: Step-by-step guidance
- **GIVEN** 用户进入偏好设置
- **WHEN** 处于向导任一步
- **THEN** 可见顶部步骤指示与当前步的核心表单
- **AND** 右侧或底部展示实时预览卡片，反映当前选择对菜谱生成的影响

#### Scenario: Dynamic cuisine suggestion
- **GIVEN** 用户选择的菜系在历史记录中常失败
- **WHEN** 用户位于菜系选择步骤
- **THEN** 系统 MUST 提供推荐替代菜系或组合建议，并支持一键应用

### Requirement: Hero Result Presentation
结果页 MUST 以 Hero 模块突出菜谱核心信息，并使用动效强调关键指标。

#### Scenario: Animated hero entry
- **GIVEN** 菜谱生成成功
- **WHEN** 进入结果页
- **THEN** Hero 模块在 400ms 以内完成标题、图片、评分等元素的入场动画
- **AND** 菜系匹配状态与主要 CTA 同步更新并可交互

### Requirement: Structured Health Insights
健康建议 MUST 采用卡片切换形式，根据风险/益处等类别使用语义色彩与图标。

#### Scenario: Semantic tabs
- **GIVEN** 系统生成健康建议
- **WHEN** 用户查看健康板块
- **THEN** 默认显示风险/警示卡片，其他类别以 Tab 或 Pill 切换
- **AND** 每个卡片使用统一图标语义和背景色，支持在移动设备上横向滚动浏览
