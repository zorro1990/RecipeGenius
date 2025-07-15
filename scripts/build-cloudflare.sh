#!/bin/bash

# Cloudflare Workers 构建脚本
# 解决静态资源路径问题

set -e

echo "🚀 开始构建 Cloudflare Workers 版本..."

# 清理之前的构建
echo "🧹 清理之前的构建文件..."
rm -rf .next .open-next

# 设置环境变量
export NODE_ENV=production
export NEXT_TELEMETRY_DISABLED=1

# 构建 Next.js 应用
echo "📦 构建 Next.js 应用..."
npm run build

# 使用 OpenNext 构建 Cloudflare Workers 版本
echo "⚡ 使用 OpenNext 构建 Cloudflare Workers 版本..."
npx @opennextjs/cloudflare build

# 检查构建结果
if [ -f ".open-next/worker.js" ]; then
    echo "✅ 构建成功！"
    echo "📁 构建文件位置: .open-next/worker.js"
    
    # 显示文件大小
    echo "📊 构建文件大小:"
    ls -lh .open-next/worker.js
    
    if [ -d ".open-next/assets" ]; then
        echo "📁 静态资源文件:"
        ls -la .open-next/assets/ | head -10
    fi
else
    echo "❌ 构建失败！"
    exit 1
fi

echo "🎉 Cloudflare Workers 构建完成！"
echo "💡 现在可以运行 'wrangler deploy' 进行部署"
