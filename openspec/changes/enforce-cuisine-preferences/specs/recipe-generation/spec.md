## ADDED Requirements
### Requirement: Enforce Cuisine Preference Profiles
系统 MUST 使用内置菜系特征配置来引导模型生成结果，并在菜谱返回后验证主菜系是否匹配用户偏好。

#### Scenario: Prompt enriched with cuisine profile
- **GIVEN** 用户仅选择了「中式」作为菜系偏好
- **WHEN** 系统构建菜谱生成请求
- **THEN** 提示词中包含中式菜谱的核心风味、典型调味与禁止示例
- **AND** 只要模型输出不满足约束，就会按设定的重试上限继续生成

#### Scenario: Post-generation cuisine validation
- **GIVEN** 用户偏好为「日式」
- **WHEN** 第一次生成的菜谱缺少日式标签或关键调味词
- **THEN** 系统 MUST 触发至少一次带惩罚权重的重试
- **AND** 最终返回的菜谱对象包含 `cuisineMatch` 字段，说明匹配状态与尝试次数

### Requirement: Surface Cuisine Match Feedback
系统 MUST 将菜系匹配结果反馈给用户，帮助其了解偏好是否被满足。

#### Scenario: Match succeeded
- **GIVEN** 系统生成的菜谱已通过菜系校验
- **WHEN** 用户查看菜谱详情页
- **THEN** 页面展示菜系匹配为成功的提示，包含主要菜系与匹配依据

#### Scenario: Match unresolved after retries
- **GIVEN** 多次重试后仍未满足所选菜系
- **WHEN** 用户查看菜谱详情页
- **THEN** 页面展示未匹配的提示，包括建议的操作（如调整偏好或接受当前推荐）
