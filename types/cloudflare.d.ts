// Cloudflare Workers环境类型定义

// 导入Cloudflare Workers类型
/// <reference types="@cloudflare/workers-types" />

declare global {
  // Cloudflare Workers环境变量
  interface CloudflareEnv {
    // AI API密钥
    DEEPSEEK_API_KEY?: string;
    DOUBAO_API_KEY?: string;
    DOUBAO_ENDPOINT_ID?: string;
    QWEN_API_KEY?: string;
    GLM_API_KEY?: string;
    GOOGLE_API_KEY?: string;
    
    // 应用配置
    NEXT_PUBLIC_APP_URL?: string;
    NODE_ENV?: string;
    
    // Cloudflare服务绑定
    CACHE?: KVNamespace;
    DB?: D1Database;
    ASSETS?: R2Bucket;
    QUEUE?: Queue;
    
    // 其他配置
    [key: string]: any;
  }

  // 扩展全局命名空间
  namespace NodeJS {
    interface ProcessEnv extends CloudflareEnv {}
  }

  // Cloudflare Workers特定的全局变量
  var CACHE: KVNamespace | undefined;
  var DB: D1Database | undefined;
  var ASSETS: R2Bucket | undefined;
  var QUEUE: Queue | undefined;
}

// Cloudflare Workers运行时类型
export interface CloudflareContext {
  env: CloudflareEnv;
  ctx: ExecutionContext;
  request: Request;
}

// KV存储操作接口
export interface CacheOperations {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult<unknown>>;
}

// API响应缓存配置
export interface APICacheConfig {
  key: string;
  ttl: number; // 缓存时间（秒）
  tags?: string[];
}

// 错误处理类型
export interface CloudflareError {
  status: number;
  message: string;
  details?: any;
  timestamp: string;
}

// 性能监控类型
export interface PerformanceMetrics {
  requestId: string;
  startTime: number;
  endTime: number;
  duration: number;
  memoryUsage: number;
  cpuTime: number;
}

// AI API调用配置
export interface AIAPIConfig {
  provider: string;
  endpoint: string;
  apiKey: string;
  timeout: number;
  retries: number;
}

// 请求上下文
export interface RequestContext {
  id: string;
  timestamp: number;
  userAgent?: string;
  ip?: string;
  country?: string;
  region?: string;
  city?: string;
}

// 响应头配置
export interface ResponseHeaders {
  'Content-Type'?: string;
  'Cache-Control'?: string;
  'X-Request-ID'?: string;
  'X-Response-Time'?: string;
  [key: string]: string | undefined;
}

// 安全配置
export interface SecurityConfig {
  corsOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  maxRequestSize: number;
  rateLimitPerMinute: number;
}

// 日志级别
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// 日志条目
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

// 环境检测工具
export interface EnvironmentDetector {
  isCloudflareWorkers(): boolean;
  isProduction(): boolean;
  isStaging(): boolean;
  isDevelopment(): boolean;
  getEnvironmentName(): string;
}

// 缓存策略
export interface CacheStrategy {
  static: {
    maxAge: number;
    staleWhileRevalidate: number;
  };
  api: {
    maxAge: number;
    staleWhileRevalidate: number;
  };
  dynamic: {
    maxAge: number;
    staleWhileRevalidate: number;
  };
}

// 部署配置
export interface DeploymentConfig {
  environment: 'development' | 'staging' | 'production';
  domain: string;
  subdomain?: string;
  customDomain?: string;
  ssl: boolean;
  compression: boolean;
  minify: boolean;
}

// 监控配置
export interface MonitoringConfig {
  analytics: boolean;
  errorTracking: boolean;
  performanceMonitoring: boolean;
  customMetrics: boolean;
  alerting: {
    errorRate: number;
    responseTime: number;
    availability: number;
  };
}

// 功能标志
export interface FeatureFlags {
  enableAPIKeyValidation: boolean;
  enableCaching: boolean;
  enableRateLimiting: boolean;
  enableAnalytics: boolean;
  enableErrorTracking: boolean;
  enablePerformanceMonitoring: boolean;
}

// 导出所有类型
export type {
  CloudflareEnv,
  CloudflareContext,
  CacheOperations,
  APICacheConfig,
  CloudflareError,
  PerformanceMetrics,
  AIAPIConfig,
  RequestContext,
  ResponseHeaders,
  SecurityConfig,
  LogLevel,
  LogEntry,
  EnvironmentDetector,
  CacheStrategy,
  DeploymentConfig,
  MonitoringConfig,
  FeatureFlags
};
