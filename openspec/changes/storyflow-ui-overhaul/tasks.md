## 1. 体验框架搭建
- [x] 1.1 梳理现有生成流程与偏好设置状态流，输出故事流 & Wizard 交互蓝图。
- [x] 1.2 定义 Skeleton、Hero、Stepper、Wizard、Tabs 的设计 token（色板、间距、动效）。

## 2. 组件与状态实现
- [x] 2.1 实现可复用的 `<StoryflowStepper>` 与 `<GenerationSkeleton>` 组件，接入生成状态机。
- [x] 2.2 构建偏好设置 Wizard（3 步），实现实时预览 panel 与菜系推荐提示。
- [x] 2.3 重构结果页 Hero 卡片与指标展示模块，接入菜系匹配信息与动画。
- [x] 2.4 实现健康建议 Tab/Pill 卡片，支持语义颜色与响应式布局。

## 3. 状态管理与数据流
- [x] 3.1 更新生成 API 调用和匹配回调，确保故事流阶段可获得进度、重试、失败信息。
- [x] 3.2 调整前端状态管理（可能引入 Zustand/Recoil）以支撑 Wizard -> 生成 -> 结果的连续体验。
- [ ] 3.3 补充 analytics/logging，记录用户在 Wizard 与故事流中的行为。

## 4. 验证与调优
- [ ] 4.1 桌面与移动端全流程手动测试，覆盖成功、重试、失败、撤销等路径。
- [ ] 4.2 运行 `npm run build:check` 与 `openspec validate storyflow-ui-overhaul --strict`。
- [ ] 4.3 收集 3 位真实用户反馈，调整动效时长与信息层级。
