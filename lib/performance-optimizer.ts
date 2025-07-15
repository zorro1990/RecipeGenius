// Cloudflare Workers性能优化工具

import type { 
  CacheStrategy, 
  APICacheConfig,
  PerformanceMetrics,
  RequestContext 
} from '@/types/cloudflare';
import { CloudflareCache, log } from './cloudflare-utils';

// 默认缓存策略
export const DEFAULT_CACHE_STRATEGY: CacheStrategy = {
  static: {
    maxAge: 31536000, // 1年
    staleWhileRevalidate: 86400 // 1天
  },
  api: {
    maxAge: 300, // 5分钟
    staleWhileRevalidate: 60 // 1分钟
  },
  dynamic: {
    maxAge: 3600, // 1小时
    staleWhileRevalidate: 300 // 5分钟
  }
};

// 性能监控类
export class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private maxMetrics = 100; // 最多保存100个指标

  // 开始性能监控
  startMonitoring(operation: string, context?: RequestContext): string {
    const id = `${operation}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const metric: PerformanceMetrics = {
      requestId: context?.id || id,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
      memoryUsage: this.getMemoryUsage(),
      cpuTime: 0
    };

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const operationMetrics = this.metrics.get(operation)!;
    operationMetrics.push(metric);

    // 限制指标数量
    if (operationMetrics.length > this.maxMetrics) {
      operationMetrics.shift();
    }

    return id;
  }

  // 结束性能监控
  endMonitoring(operation: string, id: string): PerformanceMetrics | null {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics) return null;

    const metric = operationMetrics.find(m => m.requestId === id);
    if (!metric) return null;

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.cpuTime = metric.duration; // 简化的CPU时间计算

    // 记录性能日志
    if (metric.duration > 5000) { // 超过5秒记录警告
      log('warn', `Slow operation detected: ${operation}`, {
        operation,
        duration: metric.duration,
        requestId: metric.requestId
      });
    }

    return metric;
  }

  // 获取操作的平均性能
  getAveragePerformance(operation: string): {
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    count: number;
  } | null {
    const operationMetrics = this.metrics.get(operation);
    if (!operationMetrics || operationMetrics.length === 0) return null;

    const durations = operationMetrics
      .filter(m => m.duration > 0)
      .map(m => m.duration);

    if (durations.length === 0) return null;

    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      count: durations.length
    };
  }

  // 获取内存使用情况
  private getMemoryUsage(): number {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        return process.memoryUsage().heapUsed;
      }
    } catch (error) {
      // 忽略错误
    }
    return 0;
  }

  // 清理旧指标
  cleanup(): void {
    const now = Date.now();
    const maxAge = 3600000; // 1小时

    for (const [operation, metrics] of this.metrics.entries()) {
      const filteredMetrics = metrics.filter(m => 
        now - m.startTime < maxAge
      );
      
      if (filteredMetrics.length === 0) {
        this.metrics.delete(operation);
      } else {
        this.metrics.set(operation, filteredMetrics);
      }
    }
  }
}

// 全局性能监控实例
export const performanceMonitor = new PerformanceMonitor();

// 智能缓存管理器
export class SmartCacheManager {
  private cache: CloudflareCache;
  private strategy: CacheStrategy;

  constructor(cache?: CloudflareCache, strategy?: CacheStrategy) {
    this.cache = cache || new CloudflareCache();
    this.strategy = strategy || DEFAULT_CACHE_STRATEGY;
  }

  // 智能缓存API响应
  async cacheAPIResponse(
    key: string,
    data: any,
    options?: {
      type?: 'static' | 'api' | 'dynamic';
      customTTL?: number;
      tags?: string[];
    }
  ): Promise<void> {
    const type = options?.type || 'api';
    const ttl = options?.customTTL || this.strategy[type as keyof CacheStrategy].maxAge;

    const cacheData = {
      data,
      timestamp: Date.now(),
      ttl,
      tags: options?.tags || [],
      type
    };

    await this.cache.put(
      `smart:${key}`,
      JSON.stringify(cacheData),
      { expirationTtl: ttl }
    );

    log('debug', 'Cached API response', {
      key,
      type,
      ttl,
      size: JSON.stringify(data).length
    });
  }

  // 获取缓存的API响应
  async getCachedAPIResponse(key: string): Promise<{
    data: any;
    isStale: boolean;
    age: number;
  } | null> {
    try {
      const cached = await this.cache.get(`smart:${key}`);
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const now = Date.now();
      const age = now - cacheData.timestamp;
      const maxAge = cacheData.ttl * 1000;
      const staleAge = this.strategy[cacheData.type as keyof CacheStrategy].staleWhileRevalidate * 1000;

      // 检查是否过期
      if (age > maxAge + staleAge) {
        await this.cache.delete(`smart:${key}`);
        return null;
      }

      const isStale = age > maxAge;

      log('debug', 'Cache hit', {
        key,
        age: Math.round(age / 1000),
        isStale,
        type: cacheData.type
      });

      return {
        data: cacheData.data,
        isStale,
        age: Math.round(age / 1000)
      };

    } catch (error) {
      log('error', 'Cache read error', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return null;
    }
  }

  // 预热缓存
  async warmupCache(keys: string[]): Promise<void> {
    log('info', 'Starting cache warmup', { keys: keys.length });

    const promises = keys.map(async (key) => {
      try {
        // 这里可以添加预热逻辑
        // 例如：预先计算和缓存常用的API响应
        await this.getCachedAPIResponse(key);
      } catch (error) {
        log('warn', 'Cache warmup failed for key', {
          key,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });

    await Promise.allSettled(promises);
    log('info', 'Cache warmup completed');
  }

  // 清理过期缓存
  async cleanupExpiredCache(): Promise<void> {
    try {
      const list = await this.cache.list({ prefix: 'smart:' });
      const now = Date.now();
      let cleanedCount = 0;

      for (const key of list.keys) {
        try {
          const cached = await this.cache.get(key.name);
          if (cached) {
            const cacheData = JSON.parse(cached);
            const age = now - cacheData.timestamp;
            const maxAge = (cacheData.ttl + this.strategy[cacheData.type as keyof CacheStrategy].staleWhileRevalidate) * 1000;

            if (age > maxAge) {
              await this.cache.delete(key.name);
              cleanedCount++;
            }
          }
        } catch (error) {
          // 如果解析失败，删除这个缓存项
          await this.cache.delete(key.name);
          cleanedCount++;
        }
      }

      log('info', 'Cache cleanup completed', { cleanedCount });
    } catch (error) {
      log('error', 'Cache cleanup failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// 全局缓存管理器实例
export const smartCacheManager = new SmartCacheManager();

// 响应压缩工具
export class ResponseCompressor {
  // 检查是否应该压缩响应
  static shouldCompress(
    contentType: string,
    contentLength: number,
    acceptEncoding: string
  ): boolean {
    // 检查客户端是否支持压缩
    if (!acceptEncoding.includes('gzip') && !acceptEncoding.includes('br')) {
      return false;
    }

    // 检查内容类型
    const compressibleTypes = [
      'text/',
      'application/json',
      'application/javascript',
      'application/xml',
      'image/svg+xml'
    ];

    const isCompressible = compressibleTypes.some(type => 
      contentType.startsWith(type)
    );

    // 只压缩大于1KB的内容
    return isCompressible && contentLength > 1024;
  }

  // 压缩响应（在Cloudflare Workers中，压缩通常由边缘自动处理）
  static async compressResponse(response: Response): Promise<Response> {
    // 在Cloudflare Workers中，压缩通常由边缘自动处理
    // 这里主要是设置正确的头部
    const headers = new Headers(response.headers);
    
    // 确保设置了正确的内容编码头部
    if (!headers.has('Content-Encoding')) {
      headers.set('Vary', 'Accept-Encoding');
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  }
}

// 冷启动优化
export class ColdStartOptimizer {
  private static initialized = false;
  private static initPromise: Promise<void> | null = null;

  // 预初始化关键资源
  static async preInitialize(): Promise<void> {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this.doPreInitialize();
    await this.initPromise;
  }

  private static async doPreInitialize(): Promise<void> {
    try {
      log('info', 'Starting cold start optimization');

      // 预加载关键模块
      await Promise.all([
        // 预加载AI提供商配置
        import('../lib/ai-providers'),
        // 预加载工具函数
        import('../lib/utils'),
        // 预加载API密钥存储
        import('../lib/api-key-storage')
      ]);

      // 初始化性能监控
      performanceMonitor.cleanup();

      // 预热缓存
      await smartCacheManager.cleanupExpiredCache();

      this.initialized = true;
      log('info', 'Cold start optimization completed');

    } catch (error) {
      log('error', 'Cold start optimization failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // 检查是否已初始化
  static isInitialized(): boolean {
    return this.initialized;
  }
}

// 自动性能优化中间件
export async function optimizePerformance(
  request: Request,
  handler: () => Promise<Response>
): Promise<Response> {
  // 预初始化（冷启动优化）
  await ColdStartOptimizer.preInitialize();

  // 开始性能监控
  const monitoringId = performanceMonitor.startMonitoring(
    'request',
    { id: `req_${Date.now()}`, timestamp: Date.now() }
  );

  try {
    // 执行处理器
    const response = await handler();

    // 结束性能监控
    performanceMonitor.endMonitoring('request', monitoringId);

    // 压缩响应（如果需要）
    const acceptEncoding = request.headers.get('Accept-Encoding') || '';
    const contentType = response.headers.get('Content-Type') || '';
    const contentLength = parseInt(response.headers.get('Content-Length') || '0');

    if (ResponseCompressor.shouldCompress(contentType, contentLength, acceptEncoding)) {
      return ResponseCompressor.compressResponse(response);
    }

    return response;

  } catch (error) {
    performanceMonitor.endMonitoring('request', monitoringId);
    throw error;
  }
}
