// Cloudflare Workers工具函数

import type { 
  CloudflareEnv, 
  CloudflareContext, 
  CacheOperations, 
  APICacheConfig,
  RequestContext,
  ResponseHeaders,
  LogLevel,
  LogEntry
} from '@/types/cloudflare';

// 环境检测
export function isCloudflareWorkers(): boolean {
  return typeof globalThis.caches !== 'undefined' && 
         typeof globalThis.Request !== 'undefined' &&
         typeof globalThis.Response !== 'undefined' &&
         typeof globalThis.fetch !== 'undefined';
}

export function getEnvironment(): string {
  if (typeof process !== 'undefined' && process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  return 'production';
}

// 环境变量获取（兼容Cloudflare Workers和Node.js）
export function getEnvVar(key: string, defaultValue?: string): string | undefined {
  // Cloudflare Workers环境
  if (isCloudflareWorkers() && typeof globalThis !== 'undefined') {
    // 在Workers中，环境变量通过context传递
    return (globalThis as any)[key] || defaultValue;
  }
  
  // Node.js环境
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue;
  }
  
  return defaultValue;
}

// 安全的环境变量获取
export function getSecureEnvVar(key: string): string | undefined {
  const value = getEnvVar(key);
  if (!value || value === 'undefined' || value === 'null') {
    return undefined;
  }
  return value;
}

// KV缓存操作
export class CloudflareCache implements CacheOperations {
  private kv: KVNamespace | undefined;

  constructor(kv?: KVNamespace) {
    this.kv = kv || (globalThis as any).CACHE;
  }

  async get(key: string): Promise<string | null> {
    if (!this.kv) {
      console.warn('KV namespace not available, using memory cache fallback');
      return null;
    }
    
    try {
      return await this.kv.get(key);
    } catch (error) {
      console.error('KV get error:', error);
      return null;
    }
  }

  async put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void> {
    if (!this.kv) {
      console.warn('KV namespace not available, skipping cache put');
      return;
    }
    
    try {
      await this.kv.put(key, value, options);
    } catch (error) {
      console.error('KV put error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.kv) {
      console.warn('KV namespace not available, skipping cache delete');
      return;
    }
    
    try {
      await this.kv.delete(key);
    } catch (error) {
      console.error('KV delete error:', error);
    }
  }

  async list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown>> {
    if (!this.kv) {
      console.warn('KV namespace not available, returning empty list');
      return { keys: [], list_complete: true, cacheStatus: null };
    }

    try {
      return await this.kv.list(options);
    } catch (error) {
      console.error('KV list error:', error);
      return { keys: [], list_complete: true, cacheStatus: null };
    }
  }
}

// API响应缓存
export async function cacheAPIResponse(
  config: APICacheConfig,
  response: any,
  cache?: CloudflareCache
): Promise<void> {
  if (!cache) {
    cache = new CloudflareCache();
  }
  
  const cacheKey = `api:${config.key}`;
  const cacheValue = JSON.stringify({
    data: response,
    timestamp: Date.now(),
    ttl: config.ttl
  });
  
  await cache.put(cacheKey, cacheValue, {
    expirationTtl: config.ttl
  });
}

export async function getCachedAPIResponse(
  key: string,
  cache?: CloudflareCache
): Promise<any | null> {
  if (!cache) {
    cache = new CloudflareCache();
  }
  
  const cacheKey = `api:${key}`;
  const cached = await cache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  try {
    const parsed = JSON.parse(cached);
    const now = Date.now();
    
    // 检查是否过期
    if (now - parsed.timestamp > parsed.ttl * 1000) {
      await cache.delete(cacheKey);
      return null;
    }
    
    return parsed.data;
  } catch (error) {
    console.error('Cache parse error:', error);
    await cache.delete(cacheKey);
    return null;
  }
}

// 请求上下文生成
export function createRequestContext(request: Request): RequestContext {
  const headers = request.headers;
  const cf = (request as any).cf || {};
  
  return {
    id: generateRequestId(),
    timestamp: Date.now(),
    userAgent: headers.get('user-agent') || undefined,
    ip: headers.get('cf-connecting-ip') || headers.get('x-forwarded-for') || undefined,
    country: cf.country || undefined,
    region: cf.region || undefined,
    city: cf.city || undefined
  };
}

// 生成请求ID
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 响应头设置
export function setResponseHeaders(
  response: Response,
  headers: ResponseHeaders,
  context?: RequestContext
): Response {
  const newHeaders = new Headers(response.headers);
  
  // 设置自定义头部
  Object.entries(headers).forEach(([key, value]) => {
    if (value !== undefined) {
      newHeaders.set(key, value);
    }
  });
  
  // 设置请求ID
  if (context?.id) {
    newHeaders.set('X-Request-ID', context.id);
  }
  
  // 设置响应时间
  if (context?.timestamp) {
    const responseTime = Date.now() - context.timestamp;
    newHeaders.set('X-Response-Time', `${responseTime}ms`);
  }
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  });
}

// 错误处理
export function createErrorResponse(
  status: number,
  message: string,
  details?: any,
  context?: RequestContext
): Response {
  const error = {
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString(),
    requestId: context?.id
  };
  
  const headers: ResponseHeaders = {
    'Content-Type': 'application/json',
    'X-Request-ID': context?.id
  };
  
  if (context?.timestamp) {
    const responseTime = Date.now() - context.timestamp;
    headers['X-Response-Time'] = `${responseTime}ms`;
  }
  
  return new Response(JSON.stringify(error), {
    status,
    headers: headers as HeadersInit
  });
}

// 日志记录
export function log(
  level: LogLevel,
  message: string,
  metadata?: Record<string, any>,
  requestId?: string
): void {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    requestId,
    metadata
  };
  
  // 在Cloudflare Workers中使用console
  switch (level) {
    case 'debug':
      console.debug(JSON.stringify(entry));
      break;
    case 'info':
      console.info(JSON.stringify(entry));
      break;
    case 'warn':
      console.warn(JSON.stringify(entry));
      break;
    case 'error':
      console.error(JSON.stringify(entry));
      break;
  }
}

// CORS处理
export function handleCORS(request: Request, allowedOrigins: string[] = ['*']): Response | null {
  const origin = request.headers.get('Origin');
  const method = request.method;
  
  // 处理预检请求
  if (method === 'OPTIONS') {
    const headers = new Headers();
    
    if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
      headers.set('Access-Control-Allow-Origin', origin || '*');
    }
    
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    headers.set('Access-Control-Max-Age', '86400');
    
    return new Response(null, { status: 204, headers });
  }
  
  return null;
}

// 速率限制（简单实现）
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
}

// 清理过期的速率限制记录
export function cleanupRateLimit(): void {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// 性能监控
export function measurePerformance<T>(
  fn: () => Promise<T>,
  name: string,
  context?: RequestContext
): Promise<T> {
  const startTime = Date.now();
  
  return fn().then(
    (result) => {
      const duration = Date.now() - startTime;
      log('info', `Performance: ${name} completed in ${duration}ms`, {
        operation: name,
        duration,
        success: true
      }, context?.id);
      return result;
    },
    (error) => {
      const duration = Date.now() - startTime;
      log('error', `Performance: ${name} failed in ${duration}ms`, {
        operation: name,
        duration,
        success: false,
        error: error.message
      }, context?.id);
      throw error;
    }
  );
}
