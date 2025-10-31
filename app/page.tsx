'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChefHat, Sparkles, Settings } from 'lucide-react';
import Link from 'next/link';
import { APISettingsModal } from '@/components/api-settings-modal';

export default function HomePage() {
  const [isAPISettingsOpen, setIsAPISettingsOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-fixed"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-transparent to-red-500/20" />
      </div>

      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChefHat className="size-8 text-orange-400" />
              <span className="text-2xl font-bold text-white drop-shadow-lg">RecipeGenius</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-6">
                <Link href="/ingredients" className="text-white/90 hover:text-white transition-colors font-medium drop-shadow">
                  开始创作
                </Link>
                <Link href="/api-status" className="text-white/90 hover:text-white transition-colors font-medium drop-shadow">
                  API状态
                </Link>
                <Link href="/about" className="text-white/90 hover:text-white transition-colors font-medium drop-shadow">
                  关于我们
                </Link>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAPISettingsOpen(true)}
                className="text-white/90 hover:text-white hover:bg-white/10 transition-all duration-200"
                title="API设置"
              >
                <Settings className="size-5" />
              </Button>
            </div>
          </nav>
        </header>

        <section className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl" />
              <div className="relative p-8 md:p-16">
                <ChefHat className="size-24 mx-auto mb-8 text-orange-400 drop-shadow-lg animate-pulse" />
                <h1 className="text-6xl md:text-8xl font-bold mb-8 text-white drop-shadow-2xl">
                  RecipeGenius
                </h1>
                <p className="text-2xl md:text-3xl text-white/95 mb-4 max-w-3xl mx-auto drop-shadow-lg font-medium">
                  AI 智能营养师，让家常菜更安心。
                </p>
                <p className="text-lg md:text-xl text-white/80 mb-12 max-w-2xl mx-auto drop-shadow">
                  30 秒生成菜谱，自动过滤过敏源与慢性病禁忌，让健康多一道保障。
                </p>

                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                  <Link href="/ingredients">
                    <Button size="lg" className="text-xl px-12 py-6 bg-orange-500 hover:bg-orange-600 shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 transform hover:scale-110 font-bold">
                      🚀 立即免费体验 <Sparkles className="ml-3 size-6" />
                    </Button>
                  </Link>
                  <Link href="/examples">
                    <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                      查看家常菜谱
                    </Button>
                  </Link>
                </div>

                <div className="flex flex-wrap justify-center gap-8 text-white/90 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <span>已生成 <strong className="text-orange-300">50,000+</strong> 道菜谱</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">👥</span>
                    <span><strong className="text-orange-300">10,000+</strong> 用户信赖</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⭐</span>
                    <span><strong className="text-orange-300">4.9</strong> 用户评分</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* API设置模态框 */}
      <APISettingsModal
        isOpen={isAPISettingsOpen}
        onClose={() => setIsAPISettingsOpen(false)}
        onKeysUpdated={() => {
          // 可以在这里添加更新后的回调逻辑
          console.log('API密钥已更新');
        }}
      />
    </div>
  );
}
