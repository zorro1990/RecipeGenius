import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'API密钥未配置'
      });
    }

    // 直接使用fetch测试API连接
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    
    const requestBody = {
      contents: [{
        parts: [{
          text: "Say hello"
        }]
      }]
    };

    console.log('正在测试API连接...');
    
    const response = await fetch(`${url}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(15000) // 15秒超时
    });

    console.log('API响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API错误响应:', errorText);
      
      return NextResponse.json({
        success: false,
        error: `API请求失败: ${response.status}`,
        details: errorText,
        status: response.status
      });
    }

    const data = await response.json();
    console.log('API响应数据:', data);

    return NextResponse.json({
      success: true,
      message: 'API连接成功',
      response: (data as any).candidates?.[0]?.content?.parts?.[0]?.text || 'No response text',
      status: response.status
    });

  } catch (error: any) {
    console.error('测试API错误:', error);
    
    let errorMessage = error.message || '未知错误';
    let suggestions = [];
    
    if (error.name === 'AbortError') {
      errorMessage = '请求超时';
      suggestions.push('网络连接可能较慢，请检查网络');
    } else if (errorMessage.includes('fetch')) {
      suggestions.push('网络连接问题');
      suggestions.push('可能是防火墙或代理设置问题');
      suggestions.push('尝试使用VPN或更换网络');
    }
    
    return NextResponse.json({
      success: false,
      error: '连接失败',
      details: errorMessage,
      suggestions,
      errorType: error.name
    });
  }
}
