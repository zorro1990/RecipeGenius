import { NextRequest, NextResponse } from 'next/server';

// 测试API密钥有效性
export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey, endpointId, modelId } = await request.json() as {
      provider: string;
      apiKey: string;
      endpointId?: string;
      modelId?: string;
    };

    if (!provider || !apiKey) {
      return NextResponse.json({
        success: false,
        error: '缺少必要参数'
      }, { status: 400 });
    }

    // 根据不同提供商测试API密钥
    let testResult = false;
    let errorMessage = '';

    try {
      switch (provider) {
        case 'deepseek':
          testResult = await testDeepSeekAPI(apiKey);
          break;
        case 'doubao':
          if (!endpointId) {
            errorMessage = '豆包需要提供端点ID';
            break;
          }
          testResult = await testDoubaoAPI(apiKey, endpointId);
          break;
        case 'qwen':
          testResult = await testQwenAPI(apiKey);
          break;
        case 'glm':
          testResult = await testGLMAPI(apiKey);
          break;
        case 'gemini':
          testResult = await testGeminiAPI(apiKey);
          break;
        case 'seedream':
          if (!modelId) {
            throw new Error('Seedream 需要提供模型 ID (例如 doubao-seedream-4-0-xxxxxx)');
          }
          testResult = await testSeedreamAPI(apiKey, modelId);
          break;
       default:
         errorMessage = '不支持的提供商';
      }
    } catch (error) {
      console.error(`测试${provider}API失败:`, error);
      errorMessage = error instanceof Error ? error.message : '测试失败';
    }

    if (testResult) {
      return NextResponse.json({
        success: true,
        message: `${provider} API密钥验证成功`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: errorMessage || 'API密钥验证失败'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('API密钥测试错误:', error);
    return NextResponse.json({
      success: false,
      error: '服务器错误'
    }, { status: 500 });
  }
}

// DeepSeek API测试
async function testDeepSeekAPI(apiKey: string): Promise<boolean> {
  // 预检查API密钥格式
  if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
    throw new Error('DeepSeek API密钥格式错误，必须以sk-开头且长度超过20个字符');
  }

  console.log('🧪 测试DeepSeek API:', {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 10) + '...',
    formatValid: apiKey.startsWith('sk-')
  });

  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: '测试' }],
      max_tokens: 10
    }),
    signal: AbortSignal.timeout(15000)
  });

  console.log('📡 DeepSeek API响应:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ DeepSeek API错误:', errorText);

    // 特殊处理401错误
    if (response.status === 401) {
      if (errorText.includes('Multiple 401 errors detected')) {
        throw new Error('API密钥验证失败次数过多，请等待1分钟后重试');
      } else {
        throw new Error('API密钥无效，请检查密钥是否正确');
      }
    }

    throw new Error(`DeepSeek API错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ DeepSeek API测试成功:', data);
  return true;
}

// 豆包API测试
async function testDoubaoAPI(apiKey: string, endpointId: string): Promise<boolean> {
  console.log('🧪 测试豆包API:', {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 10) + '...',
    endpointId
  });

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: endpointId,
      messages: [{ role: 'user', content: '测试' }],
      max_tokens: 10
    }),
    signal: AbortSignal.timeout(15000)
  });

  console.log('📡 豆包API响应:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ 豆包API错误:', errorText);
    throw new Error(`豆包API错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ 豆包API测试成功:', data);
  return true;
}

// 通义千问API测试
async function testQwenAPI(apiKey: string): Promise<boolean> {
  console.log('🧪 测试通义千问API:', {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 10) + '...'
  });

  const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'qwen-turbo',
      input: {
        messages: [{ role: 'user', content: '测试' }]
      },
      parameters: {
        max_tokens: 10
      }
    }),
    signal: AbortSignal.timeout(15000)
  });

  console.log('📡 通义千问API响应:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ 通义千问API错误:', errorText);
    throw new Error(`通义千问API错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ 通义千问API测试成功:', data);
  return true;
}

// 智谱AI API测试
async function testGLMAPI(apiKey: string): Promise<boolean> {
  console.log('🧪 测试智谱AI API:', {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 10) + '...'
  });

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'glm-4-flash',
      messages: [{ role: 'user', content: '测试' }],
      max_tokens: 10
    }),
    signal: AbortSignal.timeout(15000)
  });

  console.log('📡 智谱AI API响应:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ 智谱AI API错误:', errorText);
    throw new Error(`智谱AI API错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ 智谱AI API测试成功:', data);
  return true;
}

// Google Gemini API测试
async function testGeminiAPI(apiKey: string): Promise<boolean> {
  console.log('🧪 测试Gemini API:', {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 10) + '...'
  });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: '测试' }]
      }]
    }),
    signal: AbortSignal.timeout(15000)
  });

  console.log('📡 Gemini API响应:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Gemini API错误:', errorText);
    throw new Error(`Gemini API错误 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  console.log('✅ Gemini API测试成功:', data);
  return true;
}

// Seedream 图片生成 API 测试
async function testSeedreamAPI(apiKey: string, modelId: string): Promise<boolean> {
  console.log('🧪 测试Seedream API:', {
    keyLength: apiKey.length,
    keyPrefix: apiKey.substring(0, 8) + '...'
  });

  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      prompt: 'Connectivity test prompt for Seedream model',
      negative_prompt: 'text, watermark, lowres',
      size: '2K',
      response_format: 'url',
      stream: false,
      watermark: true,
      sequential_image_generation: 'disabled',
      aspect_ratio: '1:1',
      style_preset: 'food_photography',
      steps: 5,
      cfg_scale: 3
    }),
    signal: AbortSignal.timeout(15000)
  });

  console.log('📡 Seedream API响应:', {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Seedream API错误:', errorText);
    if (response.status === 401) {
      throw new Error('Seedream API密钥无效，请检查密钥是否正确');
    }
    throw new Error(`Seedream API错误 (${response.status}): ${errorText}`);
  }

  type SeedreamTestResponse = {
    data?: {
      task_id?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };

  const data = (await response.json()) as SeedreamTestResponse;
  console.log('✅ Seedream API测试成功:', data.data?.task_id ?? data);
  return true;
}

// 处理不支持的HTTP方法
export async function GET() {
  return NextResponse.json({
    success: false,
    error: '不支持的请求方法'
  }, { status: 405 });
}
