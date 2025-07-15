import { NextRequest, NextResponse } from 'next/server';
import { recognizeIngredientsFromImage } from '@/lib/ai-providers';
import { validateImageFile, compressImage } from '@/lib/image-utils';
import { log } from '@/lib/cloudflare-utils';

// export const runtime = 'edge'; // 暂时禁用edge runtime以兼容OpenNext

interface RecognizeRequest {
  imageDataUrl: string;
  apiKeys?: {
    doubao?: {
      key: string;
      endpointId: string;
    };
  };
  options?: {
    maxRetries?: number;
    timeout?: number;
  };
}

interface RecognizeResponse {
  success: boolean;
  data?: {
    ingredients: string[];
    confidence: number;
    description: string;
    suggestions?: string[];
    categories?: string[];
    processingTime: number;
  };
  error?: string;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<RecognizeResponse>> {
  const startTime = Date.now();
  
  try {
    log('info', '开始图片食材识别请求');

    // 解析请求体
    const body: RecognizeRequest = await request.json();
    const { imageDataUrl, apiKeys, options = {} } = body;

    // 验证输入
    if (!imageDataUrl) {
      return NextResponse.json({
        success: false,
        error: '缺少图片数据'
      }, { status: 400 });
    }

    // 验证DataURL格式
    if (!imageDataUrl.startsWith('data:image/')) {
      return NextResponse.json({
        success: false,
        error: '无效的图片格式'
      }, { status: 400 });
    }

    // 检查图片大小（DataURL大小限制）
    const imageSizeInMB = (imageDataUrl.length * 3 / 4) / (1024 * 1024);
    if (imageSizeInMB > 10) { // 10MB限制
      return NextResponse.json({
        success: false,
        error: '图片过大，请选择小于10MB的图片'
      }, { status: 400 });
    }

    log('info', '图片验证通过', {
      imageSizeInMB: imageSizeInMB.toFixed(2),
      hasApiKeys: !!apiKeys?.doubao
    });

    // 设置超时
    const timeout = options.timeout || 30000;
    const maxRetries = options.maxRetries || 2;

    let lastError: Error | null = null;
    
    // 重试机制
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        log('info', `尝试识别食材 (第${attempt}次)`, {
          attempt,
          maxRetries
        });

        // 创建超时Promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('请求超时')), timeout);
        });

        // 调用识别API
        const recognitionPromise = recognizeIngredientsFromImage(imageDataUrl, apiKeys);

        // 等待识别结果或超时
        const result = await Promise.race([recognitionPromise, timeoutPromise]);

        const processingTime = Date.now() - startTime;

        log('info', '食材识别成功', {
          ingredientsCount: result.ingredients.length,
          confidence: result.confidence,
          processingTime,
          attempt
        });

        return NextResponse.json({
          success: true,
          data: {
            ...result,
            processingTime
          }
        });

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        log('warn', `食材识别失败 (第${attempt}次)`, {
          attempt,
          maxRetries,
          error: lastError.message
        });

        // 如果不是最后一次尝试，等待一段时间后重试
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }

    // 所有重试都失败了
    const processingTime = Date.now() - startTime;
    
    log('error', '食材识别最终失败', {
      maxRetries,
      processingTime,
      finalError: lastError?.message
    });

    // 根据错误类型返回不同的错误信息
    let errorMessage = '食材识别失败，请重试';
    let statusCode = 500;

    if (lastError) {
      if (lastError.message.includes('未配置') || lastError.message.includes('API密钥')) {
        errorMessage = '豆包API未配置，请在设置中配置API密钥';
        statusCode = 400;
      } else if (lastError.message.includes('超时')) {
        errorMessage = '识别超时，请重试或选择更小的图片';
        statusCode = 408;
      } else if (lastError.message.includes('格式') || lastError.message.includes('解析')) {
        errorMessage = '图片格式不支持或已损坏';
        statusCode = 400;
      } else if (lastError.message.includes('网络') || lastError.message.includes('连接')) {
        errorMessage = '网络连接失败，请检查网络后重试';
        statusCode = 503;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      message: `处理时间: ${processingTime}ms`
    }, { status: statusCode });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    log('error', '图片识别API异常', {
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime
    });

    return NextResponse.json({
      success: false,
      error: '服务器内部错误',
      message: '请稍后重试'
    }, { status: 500 });
  }
}

// 健康检查端点
export async function GET(): Promise<NextResponse> {
  try {
    // 检查豆包API配置
    const { testDoubaoVisionConnection } = await import('@/lib/ai-providers');
    const testResult = await testDoubaoVisionConnection();

    return NextResponse.json({
      status: 'ok',
      service: 'ingredient-recognition',
      timestamp: new Date().toISOString(),
      doubaoVision: {
        available: testResult.success,
        message: testResult.message
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      service: 'ingredient-recognition',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// 支持的HTTP方法
export const dynamic = 'force-dynamic';
