// 豆包视觉API集成

import { getSecureEnvVar, log } from './cloudflare-utils';
import {
  RetryStrategy,
  classifyError,
  createErrorContext,
  reportError,
  generateFallbackIngredients
} from './image-recognition-fallback';

export interface DoubaoVisionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
        detail?: 'low' | 'high' | 'auto';
      };
    }>;
  }>;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  stream?: boolean;
}

export interface DoubaoVisionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface IngredientRecognitionResult {
  ingredients: string[];
  confidence: number;
  description: string;
  suggestions?: string[];
  categories?: string[];
}

// 豆包视觉API客户端
export class DoubaoVisionClient {
  private apiKey: string;
  private endpointId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = getSecureEnvVar('DOUBAO_API_KEY') || '';
    this.endpointId = getSecureEnvVar('DOUBAO_ENDPOINT_ID') || 'doubao-seed-1-6-250615'; // 默认使用您提供的模型
    this.baseUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';

    if (!this.apiKey) {
      throw new Error('豆包API密钥未配置');
    }
  }

  // 检查API配置是否可用
  isAvailable(): boolean {
    return !!this.apiKey && !!this.endpointId;
  }

  // 识别图片中的食材（带重试和错误处理）
  async recognizeIngredients(imageDataUrl: string): Promise<IngredientRecognitionResult> {
    if (!this.isAvailable()) {
      const error = new Error('豆包API未配置');
      reportError(createErrorContext(error, {
        apiProvider: 'doubao',
        imageSize: imageDataUrl.length
      }));
      throw error;
    }

    const retryStrategy = new RetryStrategy(2, 1000, 5000);

    return await retryStrategy.executeWithRetry(
      () => this.performRecognition(imageDataUrl),
      (attempt, error) => {
        log('warn', `豆包API重试`, {
          attempt,
          error: error.message,
          imageSize: imageDataUrl.length
        });
      }
    );
  }

  // 执行实际的识别操作
  private async performRecognition(imageDataUrl: string): Promise<IngredientRecognitionResult> {

    const prompt = `请仔细分析这张图片，识别出其中的所有食材。请按照以下JSON格式返回结果：

{
  "ingredients": ["食材1", "食材2", "食材3"],
  "confidence": 0.95,
  "description": "图片描述",
  "suggestions": ["建议的额外食材"],
  "categories": ["蔬菜", "肉类", "调料"]
}

要求：
1. ingredients数组包含所有能识别出的具体食材名称
2. confidence表示识别的整体置信度(0-1)
3. description简要描述图片内容
4. suggestions可选，推荐可能需要的额外食材
5. categories将食材按类型分类
6. 只返回JSON格式，不要其他文字`;

    const request: DoubaoVisionRequest = {
      model: this.endpointId,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: imageDataUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1,
      top_p: 0.9
    };

    try {
      log('info', '开始豆包视觉API调用', {
        model: this.endpointId,
        imageSize: imageDataUrl.length
      });

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(30000) // 30秒超时
      });

      if (!response.ok) {
        const errorText = await response.text();
        log('error', '豆包API调用失败', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`豆包API调用失败: ${response.status} ${response.statusText}`);
      }

      const data: DoubaoVisionResponse = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('豆包API返回空结果');
      }

      const content = data.choices[0].message.content;
      log('info', '豆包API调用成功', {
        tokensUsed: data.usage?.total_tokens || 0,
        responseLength: content.length
      });

      // 解析JSON响应
      const result = this.parseRecognitionResult(content);
      
      // 验证结果
      if (!result.ingredients || result.ingredients.length === 0) {
        throw new Error('未能识别出任何食材');
      }

      return result;

    } catch (error) {
      const errorContext = createErrorContext(error instanceof Error ? error : 'Unknown error', {
        apiProvider: 'doubao',
        imageSize: imageDataUrl.length
      });

      reportError(errorContext);

      log('error', '豆包视觉API调用异常', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorType: classifyError(error instanceof Error ? error : 'Unknown error')
      });

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('请求超时，请重试');
        }

        // 根据错误类型提供更具体的错误信息
        const errorType = classifyError(error);
        switch (errorType) {
          case 'api_key_missing':
            throw new Error('豆包API密钥无效或已过期');
          case 'api_quota_exceeded':
            throw new Error('API调用配额已用完，请稍后重试');
          case 'api_network_error':
            throw new Error('网络连接失败，请检查网络后重试');
          default:
            throw error;
        }
      }

      throw new Error('食材识别失败，请重试');
    }
  }

  // 解析识别结果
  private parseRecognitionResult(content: string): IngredientRecognitionResult {
    try {
      // 提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('响应格式错误');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // 验证必需字段
      if (!Array.isArray(parsed.ingredients)) {
        throw new Error('食材列表格式错误');
      }

      // 清理和标准化食材名称
      const cleanedIngredients = parsed.ingredients
        .filter((item: any) => typeof item === 'string' && item.trim().length > 0)
        .map((item: string) => item.trim())
        .filter((item: string, index: number, arr: string[]) => arr.indexOf(item) === index); // 去重

      return {
        ingredients: cleanedIngredients,
        confidence: typeof parsed.confidence === 'number' ? 
          Math.max(0, Math.min(1, parsed.confidence)) : 0.8,
        description: typeof parsed.description === 'string' ? 
          parsed.description.trim() : '已识别图片中的食材',
        suggestions: Array.isArray(parsed.suggestions) ? 
          parsed.suggestions.filter((item: any) => typeof item === 'string') : [],
        categories: Array.isArray(parsed.categories) ? 
          parsed.categories.filter((item: any) => typeof item === 'string') : []
      };

    } catch (error) {
      log('warn', '解析豆包响应失败，使用备用解析', {
        content: content.substring(0, 200),
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // 备用解析：尝试从文本中提取食材
      return this.fallbackParseIngredients(content);
    }
  }

  // 备用解析方法
  private fallbackParseIngredients(content: string): IngredientRecognitionResult {
    // 简单的关键词提取
    const commonIngredients = [
      '土豆', '番茄', '洋葱', '胡萝卜', '白菜', '菠菜', '韭菜', '芹菜', '豆腐',
      '鸡蛋', '鸡肉', '猪肉', '牛肉', '鱼', '虾', '蟹', '大米', '面条', '面粉',
      '油', '盐', '糖', '醋', '酱油', '蒜', '姜', '葱', '辣椒', '花椒'
    ];

    const foundIngredients = commonIngredients.filter(ingredient => 
      content.includes(ingredient)
    );

    if (foundIngredients.length === 0) {
      // 如果没有找到已知食材，尝试提取可能的食材词汇
      const possibleIngredients = content
        .match(/[\u4e00-\u9fa5]{2,4}/g) // 匹配2-4个中文字符
        ?.filter(word => word.length >= 2 && word.length <= 4)
        .slice(0, 5) || ['未知食材'];

      return {
        ingredients: possibleIngredients,
        confidence: 0.3,
        description: '图片识别结果不确定，请手动确认',
        suggestions: [],
        categories: []
      };
    }

    return {
      ingredients: foundIngredients,
      confidence: 0.6,
      description: '从描述中提取的食材信息',
      suggestions: [],
      categories: []
    };
  }

  // 测试API连接
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.isAvailable()) {
      return {
        success: false,
        message: '豆包API密钥或端点ID未配置'
      };
    }

    try {
      // 使用简单的文本请求测试连接
      const testRequest: DoubaoVisionRequest = {
        model: this.endpointId,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: '你好，请回复"连接正常"'
              }
            ]
          }
        ],
        max_tokens: 10
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(testRequest),
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        return {
          success: true,
          message: '豆包API连接正常'
        };
      } else {
        return {
          success: false,
          message: `连接失败: ${response.status} ${response.statusText}`
        };
      }

    } catch (error) {
      return {
        success: false,
        message: `连接异常: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// 创建豆包视觉客户端实例
export function createDoubaoVisionClient(): DoubaoVisionClient | null {
  try {
    return new DoubaoVisionClient();
  } catch (error) {
    log('warn', '豆包视觉客户端创建失败', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}
