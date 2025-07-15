import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { apiKey: string; endpointId: string };
    const { apiKey, endpointId } = body;
    
    if (!apiKey || !endpointId) {
      return NextResponse.json({
        success: false,
        error: '请提供API密钥和端点ID'
      }, { status: 400 });
    }

    console.log('🧪 测试豆包API:', {
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length,
      endpointId: endpointId
    });

    // 构建请求
    const requestBody = {
      model: endpointId,
      messages: [
        { role: 'user', content: '你好，请回复"测试成功"' }
      ],
      temperature: 0.7,
      max_tokens: 100
    };

    console.log('📤 发送请求到豆包API:', {
      url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      model: endpointId,
      messageLength: requestBody.messages[0].content.length
    });

    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000) // 30秒超时
    });

    console.log('📥 豆包API响应状态:', response.status, response.statusText);

    const responseData = await response.json() as any;
    console.log('📋 豆包API响应数据:', responseData);

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: `豆包API错误: ${responseData.error?.message || responseData.message || '未知错误'}`,
        details: responseData
      }, { status: response.status });
    }

    const content = responseData.choices?.[0]?.message?.content || '';
    
    return NextResponse.json({
      success: true,
      message: '豆包API连接成功',
      response: content,
      details: {
        model: endpointId,
        usage: responseData.usage
      }
    });

  } catch (error) {
    console.error('豆包API测试错误:', error);

    let errorMessage = '豆包API测试失败';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = '请求超时，豆包API响应较慢';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
