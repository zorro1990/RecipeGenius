// 图片识别错误处理和回退机制

import { log } from './cloudflare-utils';

export interface FallbackResult {
  ingredients: string[];
  confidence: number;
  description: string;
  suggestions: string[];
  categories: string[];
  source: 'ai' | 'fallback' | 'manual';
}

export interface ErrorContext {
  errorType: string;
  errorMessage: string;
  imageSize?: number;
  apiProvider?: string;
  retryCount?: number;
  timestamp: number;
}

// 错误类型枚举
export enum RecognitionErrorType {
  API_KEY_MISSING = 'api_key_missing',
  API_QUOTA_EXCEEDED = 'api_quota_exceeded',
  API_TIMEOUT = 'api_timeout',
  API_NETWORK_ERROR = 'api_network_error',
  IMAGE_TOO_LARGE = 'image_too_large',
  IMAGE_INVALID_FORMAT = 'image_invalid_format',
  IMAGE_CORRUPTED = 'image_corrupted',
  PARSING_ERROR = 'parsing_error',
  UNKNOWN_ERROR = 'unknown_error'
}

// 错误分类器
export function classifyError(error: Error | string): RecognitionErrorType {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('api') && (lowerMessage.includes('key') || lowerMessage.includes('密钥'))) {
    return RecognitionErrorType.API_KEY_MISSING;
  }
  
  if (lowerMessage.includes('quota') || lowerMessage.includes('limit') || lowerMessage.includes('配额')) {
    return RecognitionErrorType.API_QUOTA_EXCEEDED;
  }
  
  if (lowerMessage.includes('timeout') || lowerMessage.includes('超时')) {
    return RecognitionErrorType.API_TIMEOUT;
  }
  
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('网络')) {
    return RecognitionErrorType.API_NETWORK_ERROR;
  }
  
  if (lowerMessage.includes('too large') || lowerMessage.includes('过大')) {
    return RecognitionErrorType.IMAGE_TOO_LARGE;
  }
  
  if (lowerMessage.includes('format') || lowerMessage.includes('格式')) {
    return RecognitionErrorType.IMAGE_INVALID_FORMAT;
  }
  
  if (lowerMessage.includes('corrupted') || lowerMessage.includes('损坏')) {
    return RecognitionErrorType.IMAGE_CORRUPTED;
  }
  
  if (lowerMessage.includes('parse') || lowerMessage.includes('json') || lowerMessage.includes('解析')) {
    return RecognitionErrorType.PARSING_ERROR;
  }
  
  return RecognitionErrorType.UNKNOWN_ERROR;
}

// 获取用户友好的错误信息
export function getUserFriendlyErrorMessage(errorType: RecognitionErrorType): {
  title: string;
  message: string;
  suggestions: string[];
  canRetry: boolean;
} {
  switch (errorType) {
    case RecognitionErrorType.API_KEY_MISSING:
      return {
        title: 'API密钥未配置',
        message: '豆包视觉API密钥未配置或无效',
        suggestions: [
          '点击右上角设置图标配置豆包API密钥',
          '确保API密钥和端点ID都已正确填写',
          '检查API密钥是否有视觉识别权限'
        ],
        canRetry: false
      };

    case RecognitionErrorType.API_QUOTA_EXCEEDED:
      return {
        title: 'API配额已用完',
        message: '当前API密钥的使用配额已达到限制',
        suggestions: [
          '等待配额重置（通常在下个计费周期）',
          '升级API套餐以获得更多配额',
          '尝试使用其他API密钥',
          '暂时使用手动输入食材功能'
        ],
        canRetry: false
      };

    case RecognitionErrorType.API_TIMEOUT:
      return {
        title: '识别超时',
        message: 'AI识别服务响应超时',
        suggestions: [
          '检查网络连接是否稳定',
          '尝试压缩图片后重新上传',
          '稍后重试',
          '如果问题持续，请手动输入食材'
        ],
        canRetry: true
      };

    case RecognitionErrorType.API_NETWORK_ERROR:
      return {
        title: '网络连接失败',
        message: '无法连接到AI识别服务',
        suggestions: [
          '检查网络连接',
          '确认防火墙没有阻止请求',
          '稍后重试',
          '使用手动输入食材功能'
        ],
        canRetry: true
      };

    case RecognitionErrorType.IMAGE_TOO_LARGE:
      return {
        title: '图片过大',
        message: '上传的图片文件过大',
        suggestions: [
          '选择小于5MB的图片',
          '使用图片压缩工具减小文件大小',
          '尝试截取图片的主要部分',
          '使用手机拍摄时选择较低分辨率'
        ],
        canRetry: false
      };

    case RecognitionErrorType.IMAGE_INVALID_FORMAT:
      return {
        title: '图片格式不支持',
        message: '上传的文件格式不受支持',
        suggestions: [
          '使用JPG、PNG或WebP格式的图片',
          '确保文件没有损坏',
          '尝试用其他软件重新保存图片',
          '使用手机重新拍摄'
        ],
        canRetry: false
      };

    case RecognitionErrorType.IMAGE_CORRUPTED:
      return {
        title: '图片文件损坏',
        message: '无法读取图片文件',
        suggestions: [
          '重新选择图片文件',
          '确保图片文件完整',
          '尝试用其他设备打开图片确认',
          '重新拍摄或下载图片'
        ],
        canRetry: false
      };

    case RecognitionErrorType.PARSING_ERROR:
      return {
        title: '识别结果解析失败',
        message: 'AI返回的结果格式异常',
        suggestions: [
          '重试识别',
          '尝试使用更清晰的图片',
          '确保图片中食材清晰可见',
          '如果问题持续，请手动输入食材'
        ],
        canRetry: true
      };

    default:
      return {
        title: '识别失败',
        message: '发生未知错误',
        suggestions: [
          '重试识别',
          '检查网络连接',
          '尝试使用其他图片',
          '使用手动输入食材功能'
        ],
        canRetry: true
      };
  }
}

// 基于图片内容的简单食材推测（回退方案）
export function generateFallbackIngredients(imageDataUrl?: string): FallbackResult {
  // 常见食材列表，按类别分组
  const commonIngredients = {
    vegetables: ['土豆', '番茄', '洋葱', '胡萝卜', '白菜', '菠菜', '韭菜', '芹菜', '青椒', '茄子'],
    proteins: ['鸡蛋', '鸡肉', '猪肉', '牛肉', '鱼', '虾', '豆腐', '腊肉', '香肠'],
    grains: ['大米', '面条', '面粉', '小麦', '玉米', '土豆'],
    seasonings: ['盐', '糖', '醋', '酱油', '料酒', '蒜', '姜', '葱', '辣椒', '花椒', '八角'],
    others: ['油', '水', '牛奶', '鸡蛋', '面包', '饼干']
  };

  // 随机选择一些常见食材作为建议
  const suggestions = [
    ...commonIngredients.vegetables.slice(0, 3),
    ...commonIngredients.proteins.slice(0, 2),
    ...commonIngredients.seasonings.slice(0, 2)
  ];

  return {
    ingredients: [],
    confidence: 0,
    description: '无法自动识别，请手动添加食材',
    suggestions,
    categories: ['蔬菜', '肉类', '调料'],
    source: 'fallback'
  };
}

// 智能重试策略
export class RetryStrategy {
  private maxRetries: number;
  private baseDelay: number;
  private maxDelay: number;

  constructor(maxRetries = 3, baseDelay = 1000, maxDelay = 10000) {
    this.maxRetries = maxRetries;
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
  }

  // 计算重试延迟（指数退避）
  calculateDelay(attempt: number): number {
    const delay = this.baseDelay * Math.pow(2, attempt - 1);
    return Math.min(delay, this.maxDelay);
  }

  // 判断是否应该重试
  shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.maxRetries) {
      return false;
    }

    const errorType = classifyError(error);
    
    // 某些错误类型不应该重试
    const nonRetryableErrors = [
      RecognitionErrorType.API_KEY_MISSING,
      RecognitionErrorType.API_QUOTA_EXCEEDED,
      RecognitionErrorType.IMAGE_TOO_LARGE,
      RecognitionErrorType.IMAGE_INVALID_FORMAT,
      RecognitionErrorType.IMAGE_CORRUPTED
    ];

    return !nonRetryableErrors.includes(errorType);
  }

  // 执行带重试的操作
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        log('warn', `操作失败，尝试 ${attempt}/${this.maxRetries}`, {
          error: lastError.message,
          attempt
        });

        if (!this.shouldRetry(lastError, attempt)) {
          break;
        }

        if (attempt < this.maxRetries) {
          const delay = this.calculateDelay(attempt);
          onRetry?.(attempt, lastError);
          
          log('info', `等待 ${delay}ms 后重试`, { delay, nextAttempt: attempt + 1 });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError!;
  }
}

// 错误报告收集
export function reportError(context: ErrorContext): void {
  log('error', '图片识别错误报告', {
    errorType: context.errorType,
    errorMessage: context.errorMessage,
    imageSize: context.imageSize,
    apiProvider: context.apiProvider,
    retryCount: context.retryCount,
    timestamp: context.timestamp,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  });

  // 这里可以添加错误上报到监控服务的逻辑
  // 例如发送到 Sentry、LogRocket 等
}

// 创建错误上下文
export function createErrorContext(
  error: Error | string,
  options: Partial<ErrorContext> = {}
): ErrorContext {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorType = classifyError(error);

  return {
    errorType,
    errorMessage,
    timestamp: Date.now(),
    ...options
  };
}
