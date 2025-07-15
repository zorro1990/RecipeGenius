'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { APIStatusDashboard } from '@/components/api-status-dashboard';
import { APISettingsModal } from '@/components/api-settings-modal';
import { ChefHat, ArrowLeft, Settings } from 'lucide-react';

export default function APIStatusPage() {
  const [isAPISettingsOpen, setIsAPISettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* 头部导航 */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="size-5" />
            <ChefHat className="size-6 text-orange-500" />
            <span className="text-xl font-bold">RecipeGenius</span>
          </Link>
          <Button
            onClick={() => setIsAPISettingsOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <Settings className="size-4 mr-2" />
            API设置
          </Button>
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">API配置状态</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            查看和管理您的AI提供商API密钥配置。支持前端安全存储和环境变量配置。
          </p>
        </div>

        {/* API状态仪表板 */}
        <div className="max-w-6xl mx-auto">
          <APIStatusDashboard onOpenSettings={() => setIsAPISettingsOpen(true)} />
        </div>

        {/* 使用说明 */}
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">使用说明</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">🔑 前端API配置（推荐）</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 安全的本地加密存储</li>
                  <li>• 实时API密钥验证</li>
                  <li>• 用户友好的管理界面</li>
                  <li>• 支持多提供商管理</li>
                  <li>• 密钥不会上传到服务器</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-2">⚙️ 环境变量配置（传统）</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 服务器端配置</li>
                  <li>• 需要重启服务器生效</li>
                  <li>• 适合生产环境部署</li>
                  <li>• 作为前端配置的备用</li>
                  <li>• 优先级低于前端配置</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 支持的提供商 */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">支持的AI提供商</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🚀</span>
                  <span className="font-medium">DeepSeek</span>
                </div>
                <p className="text-sm text-gray-600">性价比之王，价格极低</p>
                <a 
                  href="https://platform.deepseek.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  获取API密钥 →
                </a>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🎯</span>
                  <span className="font-medium">豆包</span>
                </div>
                <p className="text-sm text-gray-600">字节跳动，国内访问稳定</p>
                <a 
                  href="https://console.volcengine.com/ark" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  获取API密钥 →
                </a>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">☁️</span>
                  <span className="font-medium">通义千问</span>
                </div>
                <p className="text-sm text-gray-600">阿里云生态，企业级稳定</p>
                <a
                  href="https://bailian.console.aliyun.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  获取API密钥 →
                </a>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🧠</span>
                  <span className="font-medium">智谱AI</span>
                </div>
                <p className="text-sm text-gray-600">清华技术，中文优化</p>
                <a 
                  href="https://open.bigmodel.cn" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  获取API密钥 →
                </a>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">🌟</span>
                  <span className="font-medium">Google Gemini</span>
                </div>
                <p className="text-sm text-gray-600">Google AI，功能强大</p>
                <a 
                  href="https://aistudio.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline"
                >
                  获取API密钥 →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="max-w-4xl mx-auto mt-8 text-center">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-2">开始使用智能菜谱生成</h2>
            <p className="mb-4 opacity-90">配置好API密钥后，立即体验AI为您创造的美味菜谱</p>
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => setIsAPISettingsOpen(true)}
                variant="secondary"
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                <Settings className="size-4 mr-2" />
                配置API密钥
              </Button>
              <Link href="/ingredients">
                <Button variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  开始生成菜谱
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* API设置模态框 */}
      <APISettingsModal
        isOpen={isAPISettingsOpen}
        onClose={() => setIsAPISettingsOpen(false)}
        onKeysUpdated={() => {
          // 刷新页面状态
          window.location.reload();
        }}
      />
    </div>
  );
}
