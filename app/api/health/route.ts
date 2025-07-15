import { NextRequest, NextResponse } from 'next/server';
import { withHealthCheckWrapper } from '@/lib/api-wrapper';
import { isCloudflareWorkers, getEnvVar, log } from '@/lib/cloudflare-utils';
import { getAvailableProviders } from '@/lib/ai-providers';

// 健康检查处理器
async function healthCheckHandler(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // 基本系统信息
    const systemInfo = {
      timestamp: new Date().toISOString(),
      environment: getEnvVar('NODE_ENV', 'unknown'),
      runtime: isCloudflareWorkers() ? 'cloudflare-workers' : 'nodejs',
      version: getEnvVar('APP_VERSION', '1.0.0'),
      buildTime: getEnvVar('BUILD_TIMESTAMP', 'unknown')
    };

    // 检查AI提供商配置
    const providers = getAvailableProviders();
    const aiStatus = {
      configured: providers.length,
      available: providers.map(p => p.name),
      total: 5 // DeepSeek, 豆包, 通义千问, 智谱AI, Gemini
    };

    // 检查环境变量
    const envCheck = {
      hasAppUrl: !!getEnvVar('NEXT_PUBLIC_APP_URL'),
      hasNodeEnv: !!getEnvVar('NODE_ENV'),
      cloudflareWorkers: isCloudflareWorkers()
    };

    // 检查Cloudflare服务
    const cloudflareServices = await checkCloudflareServices();

    // 性能指标
    const performance = {
      responseTime: Date.now() - startTime,
      memoryUsage: getMemoryUsage(),
      uptime: getUptime()
    };

    // 整体健康状态
    const isHealthy = 
      aiStatus.configured > 0 && 
      envCheck.hasAppUrl && 
      envCheck.hasNodeEnv &&
      performance.responseTime < 5000;

    const healthData = {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: systemInfo.timestamp,
      system: systemInfo,
      ai: aiStatus,
      environment: envCheck,
      cloudflare: cloudflareServices,
      performance,
      checks: {
        aiProviders: aiStatus.configured > 0,
        environment: envCheck.hasAppUrl && envCheck.hasNodeEnv,
        performance: performance.responseTime < 5000,
        cloudflareServices: cloudflareServices.kv !== 'error'
      }
    };

    // 记录健康检查日志
    log('info', 'Health check completed', {
      status: healthData.status,
      responseTime: performance.responseTime,
      aiProviders: aiStatus.configured,
      runtime: systemInfo.runtime
    });

    return NextResponse.json(healthData, {
      status: isHealthy ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Status': healthData.status,
        'X-Response-Time': `${performance.responseTime}ms`
      }
    });

  } catch (error) {
    const errorTime = Date.now() - startTime;
    
    log('error', 'Health check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: errorTime
    });

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      performance: {
        responseTime: errorTime
      }
    }, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Health-Status': 'error',
        'X-Response-Time': `${errorTime}ms`
      }
    });
  }
}

// 检查Cloudflare服务状态
async function checkCloudflareServices() {
  const services = {
    kv: 'unknown',
    d1: 'unknown',
    r2: 'unknown'
  };

  try {
    // 检查KV存储
    if (typeof globalThis !== 'undefined' && (globalThis as any).CACHE) {
      try {
        await (globalThis as any).CACHE.get('health-check');
        services.kv = 'available';
      } catch (error) {
        services.kv = 'error';
      }
    } else {
      services.kv = 'not-configured';
    }

    // 检查D1数据库
    if (typeof globalThis !== 'undefined' && (globalThis as any).DB) {
      services.d1 = 'available';
    } else {
      services.d1 = 'not-configured';
    }

    // 检查R2存储
    if (typeof globalThis !== 'undefined' && (globalThis as any).ASSETS) {
      services.r2 = 'available';
    } else {
      services.r2 = 'not-configured';
    }

  } catch (error) {
    log('warn', 'Error checking Cloudflare services', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return services;
}

// 获取内存使用情况
function getMemoryUsage() {
  try {
    if (isCloudflareWorkers()) {
      // Cloudflare Workers中无法获取内存信息
      return {
        used: 'unknown',
        total: 'unknown',
        percentage: 'unknown'
      };
    } else if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        used: Math.round(usage.heapUsed / 1024 / 1024), // MB
        total: Math.round(usage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100)
      };
    }
  } catch (error) {
    // 忽略错误
  }

  return {
    used: 'unknown',
    total: 'unknown',
    percentage: 'unknown'
  };
}

// 获取运行时间
function getUptime() {
  try {
    if (isCloudflareWorkers()) {
      // Cloudflare Workers是无状态的，没有uptime概念
      return 'stateless';
    } else if (typeof process !== 'undefined' && process.uptime) {
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      return `${hours}h ${minutes}m ${seconds}s`;
    }
  } catch (error) {
    // 忽略错误
  }

  return 'unknown';
}

// 导出包装后的处理器
export const GET = withHealthCheckWrapper(healthCheckHandler);

// 支持HEAD请求用于简单的存活检查
export async function HEAD(request: NextRequest): Promise<Response> {
  try {
    const providers = getAvailableProviders();
    const isHealthy = providers.length > 0;
    
    return new Response(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        'X-Health-Status': isHealthy ? 'healthy' : 'degraded',
        'X-AI-Providers': providers.length.toString(),
        'X-Runtime': isCloudflareWorkers() ? 'cloudflare-workers' : 'nodejs'
      }
    });
  } catch (error) {
    return new Response(null, {
      status: 500,
      headers: {
        'X-Health-Status': 'error'
      }
    });
  }
}
