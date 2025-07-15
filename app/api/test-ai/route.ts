import { NextRequest, NextResponse } from 'next/server';
import { testAIConnection, getProviderStatus } from '@/lib/ai-service';
import { getStoredAPIKeys } from '@/lib/api-key-storage';

export async function GET() {
  try {
    // 获取提供商状态
    const providerStatus = getProviderStatus();
    
    // 测试AI连接
    const connectionTest = await testAIConnection();
    
    // 检查环境变量配置
    const envStatus = {
      doubao: !!process.env.DOUBAO_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      qwen: !!process.env.QWEN_API_KEY,
      glm: !!process.env.GLM_API_KEY,
      gemini: !!process.env.GOOGLE_API_KEY
    };

    // 检查前端存储的API密钥（仅在客户端请求时）
    let frontendStatus = {};
    try {
      // 注意：这里无法直接访问localStorage，因为这是服务端代码
      // 前端状态将通过客户端JavaScript获取
      frontendStatus = {
        note: '前端API密钥状态需要通过客户端JavaScript获取',
        available: '请使用新的API设置界面管理前端密钥'
      };
    } catch (error) {
      frontendStatus = { error: '无法获取前端API密钥状态' };
    }

    // 生成配置建议
    const suggestions = [];
    if (providerStatus.configured === 0) {
      suggestions.push('🔑 请配置至少一个AI提供商的API密钥');
      suggestions.push('💡 推荐使用新的前端API设置界面（点击首页右上角设置图标）');
      suggestions.push('📋 推荐配置顺序：DeepSeek > 豆包 > 通义千问 > 智谱AI > Gemini');
    } else if (providerStatus.configured === 1) {
      suggestions.push('✅ 建议配置多个AI提供商作为备用');
      suggestions.push('🔧 可以使用前端API设置界面管理多个提供商');
    }

    // 环境变量建议（向后兼容）
    if (!envStatus.doubao) {
      suggestions.push('🎯 豆包API访问稳定，可在前端设置或配置 DOUBAO_API_KEY');
    }
    if (!envStatus.deepseek) {
      suggestions.push('🚀 DeepSeek价格最低，可在前端设置或配置 DEEPSEEK_API_KEY');
    }

    // 新功能提示
    suggestions.push('');
    suggestions.push('🆕 新功能：现在支持前端API密钥配置！');
    suggestions.push('   • 点击首页右上角的设置图标');
    suggestions.push('   • 安全的本地加密存储');
    suggestions.push('   • 实时API密钥验证');
    suggestions.push('   • 支持多提供商管理');

    return NextResponse.json({
      success: connectionTest.success,
      message: connectionTest.message,
      data: {
        connection: connectionTest,
        providers: providerStatus,
        environment: envStatus,
        frontend: frontendStatus,
        suggestions,
        info: {
          version: '2.0',
          features: [
            '前端API密钥配置',
            '多提供商支持',
            '实时验证',
            '安全存储',
            '智能回退'
          ],
          usage: '访问首页右上角设置图标配置API密钥'
        }
      }
    });

  } catch (error) {
    console.error('AI测试错误:', error);

    return NextResponse.json({
      success: false,
      error: 'AI测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json() as { prompt: string };
    
    if (!prompt) {
      return NextResponse.json({
        success: false,
        error: '请提供测试提示词'
      }, { status: 400 });
    }

    // 测试AI调用
    const { callAI } = await import('@/lib/ai-providers');
    const response = await callAI(prompt);
    
    return NextResponse.json({
      success: true,
      message: 'AI调用成功',
      data: {
        prompt,
        response,
        provider: getProviderStatus().recommended
      }
    });

  } catch (error) {
    console.error('AI调用测试错误:', error);

    return NextResponse.json({
      success: false,
      error: 'AI调用失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
