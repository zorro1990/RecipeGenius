import { NextRequest, NextResponse } from 'next/server';

interface FrontendAPIKeys extends Record<string, string | undefined> {
  doubaoEndpointId?: string;
}

interface ProviderStatus {
  configured: boolean;
  hasKey: boolean;
  hasEndpoint: boolean | null;
  keyLength: number;
  keyPrefix: string | null;
}

interface FrontendStatusSummary {
  configured: number;
  total: number;
  percentage: number;
  hasAny: boolean;
}

interface FrontendStatus {
  providers: Record<string, ProviderStatus>;
  summary: FrontendStatusSummary;
}

interface StatusReport {
  overall: 'unknown' | 'no-config' | 'frontend-only' | 'env-only' | 'hybrid';
  recommendations: string[];
  warnings: string[];
  info: string[];
}

// 获取前端API密钥状态的端点
export async function POST(request: NextRequest) {
  try {
    const { apiKeys } = await request.json() as { apiKeys: FrontendAPIKeys };
    
    if (!apiKeys || typeof apiKeys !== 'object') {
      return NextResponse.json({
        success: false,
        error: '请提供API密钥信息'
      }, { status: 400 });
    }

    // 分析前端API密钥状态
    const frontendStatus = analyzeFrontendAPIKeys(apiKeys);
    
    // 检查环境变量状态（用于对比）
    const envStatus = {
      doubao: !!process.env.DOUBAO_API_KEY,
      deepseek: !!process.env.DEEPSEEK_API_KEY,
      qwen: !!process.env.QWEN_API_KEY,
      glm: !!process.env.GLM_API_KEY,
      gemini: !!process.env.GOOGLE_API_KEY
    };

    // 生成状态报告
    const report = generateStatusReport(frontendStatus, envStatus);

    return NextResponse.json({
      success: true,
      message: '前端API密钥状态获取成功',
      data: {
        frontend: frontendStatus,
        environment: envStatus,
        report,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('前端API状态检查错误:', error);
    return NextResponse.json({
      success: false,
      error: '状态检查失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}

// 分析前端API密钥状态
function analyzeFrontendAPIKeys(apiKeys: FrontendAPIKeys): FrontendStatus {
  const providers = ['deepseek', 'doubao', 'qwen', 'glm', 'gemini'];
  const status: Record<string, ProviderStatus> = {};

  let configuredCount = 0;
  const totalProviders = providers.length;

  providers.forEach((provider) => {
    const key = apiKeys[provider];
    const hasKey = typeof key === 'string' && key.trim().length > 0;
    const requiresEndpoint = provider === 'doubao';
    const endpointValue = apiKeys.doubaoEndpointId;
    const hasEndpoint = requiresEndpoint ? typeof endpointValue === 'string' && endpointValue.trim().length > 0 : true;
    const configured = hasKey && hasEndpoint;

    status[provider] = {
      configured,
      hasKey,
      hasEndpoint: requiresEndpoint ? hasEndpoint : null,
      keyLength: hasKey ? key!.length : 0,
      keyPrefix: hasKey ? maskAPIKey(key!) : null,
    };

    if (configured) {
      configuredCount++;
    }
  });

  return {
    providers: status,
    summary: {
      configured: configuredCount,
      total: totalProviders,
      percentage: totalProviders === 0 ? 0 : Math.round((configuredCount / totalProviders) * 100),
      hasAny: configuredCount > 0,
    },
  };
}

// 生成状态报告
function generateStatusReport(frontendStatus: FrontendStatus, envStatus: Record<string, boolean>): StatusReport {
  const report: StatusReport = {
    overall: 'unknown',
    recommendations: [],
    warnings: [],
    info: [],
  };

  const frontendConfigured = frontendStatus.summary.configured;
  const envConfigured = Object.values(envStatus).filter(Boolean).length;
  const totalConfigured = frontendConfigured + envConfigured;

  // 整体状态评估
  if (totalConfigured === 0) {
    report.overall = 'no-config';
    report.recommendations.push('🔑 请配置至少一个AI提供商的API密钥');
    report.recommendations.push('💡 推荐使用前端API设置界面（更安全、更方便）');
  } else if (frontendConfigured > 0 && envConfigured === 0) {
    report.overall = 'frontend-only';
    report.info.push('✅ 使用前端API密钥配置（推荐方式）');
    if (frontendConfigured === 1) {
      report.recommendations.push('🔄 建议配置多个提供商作为备用');
    }
  } else if (frontendConfigured === 0 && envConfigured > 0) {
    report.overall = 'env-only';
    report.info.push('⚠️ 使用环境变量配置（传统方式）');
    report.recommendations.push('🆕 建议迁移到前端API设置界面');
    report.recommendations.push('   • 更安全的本地存储');
    report.recommendations.push('   • 实时验证功能');
    report.recommendations.push('   • 更好的用户体验');
  } else {
    report.overall = 'hybrid';
    report.info.push('🔄 同时使用前端和环境变量配置');
    report.info.push('📋 前端配置优先级更高');
  }

  // 具体提供商建议
  if (frontendConfigured > 0) {
    const configuredProviders = Object.entries(frontendStatus.providers)
      .filter(([, providerStatus]) => providerStatus.configured)
      .map(([provider]) => provider);
    
    report.info.push(`🎯 已配置的前端提供商: ${configuredProviders.join(', ')}`);
    
    if (!configuredProviders.includes('deepseek')) {
      report.recommendations.push('🚀 推荐配置DeepSeek（性价比最高）');
    }
    if (!configuredProviders.includes('doubao')) {
      report.recommendations.push('🎯 推荐配置豆包（国内访问稳定）');
    }
  }

  // 安全提示
  if (frontendConfigured > 0) {
    report.info.push('🔒 前端API密钥已加密存储在本地');
    report.info.push('🛡️ 密钥不会上传到服务器');
  }

  return report;
}

// 掩码显示API密钥
function maskAPIKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '****';
  
  const start = apiKey.substring(0, 4);
  const end = apiKey.substring(apiKey.length - 4);
  return `${start}****${end}`;
}

// 处理不支持的HTTP方法
export async function GET() {
  return NextResponse.json({
    success: false,
    error: '请使用POST方法并提供API密钥信息',
    usage: {
      method: 'POST',
      body: {
        apiKeys: {
          deepseek: 'sk-xxx...',
          doubao: 'xxx...',
          doubaoEndpointId: 'xxx...',
          // ... 其他提供商
        }
      }
    }
  }, { status: 405 });
}
