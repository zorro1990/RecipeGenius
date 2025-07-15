// Cloudflare Workers API路由包装器

import { NextRequest, NextResponse } from 'next/server';
import type { CloudflareContext, RequestContext } from '@/types/cloudflare';
import { 
  isCloudflareWorkers, 
  createRequestContext, 
  createErrorResponse, 
  handleCORS, 
  checkRateLimit,
  log,
  measurePerformance,
  setResponseHeaders
} from './cloudflare-utils';

// API路由处理器类型
export type APIHandler = (
  request: NextRequest,
  context?: CloudflareContext
) => Promise<NextResponse | Response>;

// API路由配置
export interface APIRouteConfig {
  allowedMethods?: string[];
  corsOrigins?: string[];
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  timeout?: number;
  cache?: {
    enabled: boolean;
    ttl: number;
  };
  auth?: {
    required: boolean;
    type: 'api-key' | 'bearer' | 'custom';
  };
}

// 默认配置
const defaultConfig: APIRouteConfig = {
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  corsOrigins: ['*'],
  rateLimit: {
    requests: 100,
    windowMs: 60000 // 1分钟
  },
  timeout: 30000, // 30秒
  cache: {
    enabled: false,
    ttl: 300 // 5分钟
  },
  auth: {
    required: false,
    type: 'api-key'
  }
};

// API路由包装器
export function withAPIWrapper(
  handler: APIHandler,
  config: Partial<APIRouteConfig> = {}
) {
  const finalConfig = { ...defaultConfig, ...config };

  return async function wrappedHandler(
    request: NextRequest,
    context?: any
  ): Promise<NextResponse | Response> {
    const requestContext = createRequestContext(request);
    const startTime = Date.now();

    try {
      // 日志记录请求开始
      log('info', `API Request: ${request.method} ${request.url}`, {
        method: request.method,
        url: request.url,
        userAgent: request.headers.get('user-agent'),
        ip: requestContext.ip
      }, requestContext.id);

      // CORS处理
      const corsResponse = handleCORS(request, finalConfig.corsOrigins);
      if (corsResponse) {
        return corsResponse;
      }

      // 方法验证
      if (!finalConfig.allowedMethods?.includes(request.method)) {
        return createErrorResponse(
          405,
          `Method ${request.method} not allowed`,
          { allowedMethods: finalConfig.allowedMethods },
          requestContext
        );
      }

      // 速率限制
      if (finalConfig.rateLimit) {
        const identifier = requestContext.ip || 'unknown';
        const isAllowed = checkRateLimit(
          identifier,
          finalConfig.rateLimit.requests,
          finalConfig.rateLimit.windowMs
        );

        if (!isAllowed) {
          return createErrorResponse(
            429,
            'Too many requests',
            { 
              limit: finalConfig.rateLimit.requests,
              windowMs: finalConfig.rateLimit.windowMs 
            },
            requestContext
          );
        }
      }

      // 身份验证（如果需要）
      if (finalConfig.auth?.required) {
        const authResult = await validateAuth(request, finalConfig.auth);
        if (!authResult.valid) {
          return createErrorResponse(
            401,
            'Authentication required',
            { reason: authResult.reason },
            requestContext
          );
        }
      }

      // 执行处理器（带性能监控和超时）
      const response = await Promise.race([
        measurePerformance(
          () => handler(request, context),
          `${request.method} ${new URL(request.url).pathname}`,
          requestContext
        ),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timeout'));
          }, finalConfig.timeout);
        })
      ]);

      // 设置响应头
      const finalResponse = setResponseHeaders(
        response,
        {
          'X-Powered-By': 'Recipe-Genius/Cloudflare',
          'X-Environment': isCloudflareWorkers() ? 'cloudflare-workers' : 'nodejs'
        },
        requestContext
      );

      // 日志记录请求完成
      const duration = Date.now() - startTime;
      log('info', `API Response: ${finalResponse.status}`, {
        status: finalResponse.status,
        duration,
        method: request.method,
        url: request.url
      }, requestContext.id);

      return finalResponse;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      // 错误日志
      log('error', 'API Error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        method: request.method,
        url: request.url
      }, requestContext.id);

      // 返回错误响应
      if (error instanceof Error && error.message === 'Request timeout') {
        return createErrorResponse(
          408,
          'Request timeout',
          { timeout: finalConfig.timeout },
          requestContext
        );
      }

      return createErrorResponse(
        500,
        'Internal server error',
        isCloudflareWorkers() ? undefined : { 
          message: error instanceof Error ? error.message : 'Unknown error' 
        },
        requestContext
      );
    }
  };
}

// 身份验证验证
async function validateAuth(
  request: NextRequest,
  authConfig: NonNullable<APIRouteConfig['auth']>
): Promise<{ valid: boolean; reason?: string }> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader) {
    return { valid: false, reason: 'Missing Authorization header' };
  }

  switch (authConfig.type) {
    case 'bearer':
      if (!authHeader.startsWith('Bearer ')) {
        return { valid: false, reason: 'Invalid Bearer token format' };
      }
      // 这里可以添加token验证逻辑
      return { valid: true };

    case 'api-key':
      if (!authHeader.startsWith('ApiKey ')) {
        return { valid: false, reason: 'Invalid API key format' };
      }
      // 这里可以添加API key验证逻辑
      return { valid: true };

    case 'custom':
      // 自定义验证逻辑
      return { valid: true };

    default:
      return { valid: false, reason: 'Unknown auth type' };
  }
}

// 专门的AI API包装器
export function withAIAPIWrapper(handler: APIHandler) {
  return withAPIWrapper(handler, {
    allowedMethods: ['POST'],
    rateLimit: {
      requests: 20, // AI API调用限制更严格
      windowMs: 60000
    },
    timeout: 120000, // AI调用需要更长时间
    cache: {
      enabled: true,
      ttl: 300 // 缓存5分钟
    }
  });
}

// 测试API包装器
export function withTestAPIWrapper(handler: APIHandler) {
  return withAPIWrapper(handler, {
    allowedMethods: ['GET', 'POST'],
    rateLimit: {
      requests: 50,
      windowMs: 60000
    },
    timeout: 30000
  });
}

// 公共API包装器（无认证）
export function withPublicAPIWrapper(handler: APIHandler) {
  return withAPIWrapper(handler, {
    allowedMethods: ['GET', 'POST'],
    corsOrigins: ['*'],
    rateLimit: {
      requests: 200,
      windowMs: 60000
    },
    timeout: 30000,
    auth: {
      required: false,
      type: 'api-key'
    }
  });
}

// 私有API包装器（需要认证）
export function withPrivateAPIWrapper(handler: APIHandler) {
  return withAPIWrapper(handler, {
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    corsOrigins: ['https://recipe-genius.your-domain.com'],
    rateLimit: {
      requests: 100,
      windowMs: 60000
    },
    timeout: 60000,
    auth: {
      required: true,
      type: 'bearer'
    }
  });
}

// 健康检查API包装器
export function withHealthCheckWrapper(handler: APIHandler) {
  return withAPIWrapper(handler, {
    allowedMethods: ['GET'],
    corsOrigins: ['*'],
    rateLimit: {
      requests: 1000,
      windowMs: 60000
    },
    timeout: 5000,
    cache: {
      enabled: true,
      ttl: 60 // 缓存1分钟
    }
  });
}
