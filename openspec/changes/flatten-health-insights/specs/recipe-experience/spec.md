## MODIFIED Requirements
### Requirement: Structured Health Insights
系统 MUST 在健康建议页使用单页卡片布局，避免 Tab 切换导致的信息遗漏。

#### Scenario: Single page grouped cards
- **GIVEN** 系统生成了健康相关提示
- **WHEN** 用户查看健康建议区
- **THEN** 所有类别（过滤、益处、营养重点、行动建议等）在同一页面按顺序展示
- **AND** 每个类别以卡片形式呈现，包含标题、语义颜色与图标
- **AND** 当某类别无数据时显示“暂无相关信息”的占位说明
