# 🏥 RecipeGenius - Health Care System / 健康关怀系统

🌟 Generate recipes based on ingredients, filter allergens, and exclude disease-sensitive foods.
🌟 根据食材生成菜谱，过滤过敏源，排除疾病敏感食材

## 🎯 Features / 功能特点

- ✨ **Health Condition Management / 健康状况管理**: Support dietary restrictions for gout, diabetes, hypertension, etc. / 支持痛风、糖尿病、高血压等常见疾病的饮食限制
- ✨ **Smart Ingredient Filtering / 智能食材过滤**: Automatically filter harmful ingredients based on health conditions / 根据健康情况与过敏原自动过滤有害食材
- ✨ **Health Advice System / 健康建议系统**: Provide professional dietary advice and health guidance / 提供专业的饮食建议和健康指导：
  - 🦐 **Gout patients / 痛风患者**: Strictly filter shellfish and high-purine seafood / 严格过滤蛤蜊、青口等高嘌呤海鲜
  - 💙 **Diabetes patients / 糖尿病患者**: Limit high-sugar ingredients, control blood sugar index / 限制高糖食材，控制血糖指数
  - 🧂 **Hypertension patients / 高血压患者**: Avoid high-salt foods, control sodium intake / 避免高盐食品，控制钠盐摄入
  - 💚 **Gastritis patients / 胃病患者**: Provide mild and easy-to-digest options / 完善温和易消化功能管理

## 🎯 Usage Guide / 使用指南

1. Select your health conditions in preferences / 在偏好设置中可选择您的健康状况
2. Add ingredients: clams, mussels, broccoli, tomatoes / 添加食材：蛤蜊、青口、西兰花、番茄
3. Generate recipes: system automatically filters harmful ingredients / 生成菜谱：系统自动过滤有害食材
4. View advice: check professional guidance in the "Health Advice" tab / 查看建议：在"健康建议"标签页查看专业指导
5. Safe cooking: use filtered safe ingredients to prepare meals / 安全烹饪：使用过滤后的安全食材制作菜谱

## 🚨 Important Notes / 重要提醒

- Fixed sensitive ingredient issues for gout patients / 解决了痛风患者的敏感食材问题
- Update valid AI key in settings if needed / 请更新有效的AI密钥，或者在设置中配置
- Switching between multiple servers may cause anomalies / 在多个服务器之间切换，可能会出现异常

## 💻 Technology Stack / 技术支持

- Next.js 14
- TypeScript
- Tailwind CSS
- Shadcn/ui
- Lucide React
- Playwright testing / Playwright 测试

## 🚀 Quick Start / 快速开始

### Prerequisites / 环境要求
- Node.js 18+
- npm or yarn / npm 或 yarn
- Google Gemini API key / Google Gemini API 密钥

### Installation / 安装步骤

1. **Install dependencies / 安装依赖**
```bash
npm install
```

2. **Configure environment variables / 配置环境变量**
Create `.env.local` file and add your Google Gemini API key:
编辑 `.env.local` 文件，添加你的 Google Gemini API 密钥：
```env
GOOGLE_API_KEY=your_actual_api_key_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. **Start development server / 启动开发服务器**
```bash
npm run dev
```

4. **Access the application / 访问应用**
Open your browser and visit / 打开浏览器访问: [http://localhost:3000](http://localhost:3000)

## 💡 Developer / 开发者

[zorro1990](https://github.com/zorro1990)

## 📜 License / 许可证

MIT License
