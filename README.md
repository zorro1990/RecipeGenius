# 🍳 RecipeGenius - 智能菜谱生成器

基于 Next.js 15、Tailwind CSS v4、shadcn/ui 和 Google Gemini 2.0 Flash 的智能菜谱生成应用。

## ✨ 功能特点

- 🤖 **AI智能生成**：基于 Google Gemini 2.0 Flash 模型
- 🥕 **食材输入**：支持文本输入和快速添加
- ⚙️ **个性化设置**：饮食偏好、烹饪时间、难度等
- 📊 **营养分析**：详细的营养成分信息
- 📝 **制作步骤**：交互式步骤指导
- 💾 **菜谱保存**：收藏和下载功能
- 📱 **响应式设计**：支持移动端和桌面端

## 🚀 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- Google Gemini API 密钥

### 安装步骤

1. **安装依赖**
```bash
npm install
```

2. **配置环境变量**
编辑 `.env.local` 文件，添加你的 Google Gemini API 密钥：
```env
GOOGLE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 🛠️ 技术栈

- **前端框架**: Next.js 15 (App Router)
- **样式框架**: Tailwind CSS v4
- **UI组件库**: shadcn/ui
- **AI模型**: Google Gemini 2.0 Flash
- **开发语言**: TypeScript
- **图标库**: Lucide React

## 📁 项目结构

```
recipe-genius/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── generate-recipe/      # 菜谱生成 API
│   │   └── analyze-nutrition/    # 营养分析 API
│   ├── ingredients/              # 食材输入页面
│   ├── recipe/                   # 菜谱展示页面
│   ├── globals.css               # 全局样式
│   ├── layout.tsx                # 根布局
│   └── page.tsx                  # 主页
├── components/                   # 可复用组件
│   ├── ui/                       # shadcn/ui 组件
│   ├── forms/                    # 表单组件
│   └── recipe/                   # 菜谱相关组件
├── lib/                          # 工具函数和配置
│   ├── gemini.ts                 # Gemini API 客户端
│   ├── types.ts                  # TypeScript 类型定义
│   └── utils.ts                  # 工具函数
└── docs/                         # 项目文档
```

## 🔑 获取 API 密钥

1. 访问 [Google AI Studio](https://aistudio.google.com/)
2. 登录你的 Google 账户
3. 创建新的 API 密钥
4. 将密钥添加到 `.env.local` 文件

## 🎯 使用流程

1. **添加食材**：在主页点击"开始创作菜谱"
2. **输入食材**：添加你现有的食材
3. **设置偏好**：配置饮食偏好、烹饪时间等
4. **生成菜谱**：AI 自动生成个性化菜谱
5. **查看结果**：浏览菜谱详情和制作步骤
6. **开始烹饪**：按照步骤指导制作美食

---

**RecipeGenius** - 让 AI 为你的厨房带来无限创意！ 🍳✨
