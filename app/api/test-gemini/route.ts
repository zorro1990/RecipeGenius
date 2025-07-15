import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // 检查环境变量
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json({
        success: false,
        error: 'API密钥未配置或使用默认值',
        details: '请在.env.local文件中设置正确的GOOGLE_API_KEY',
        apiKeyLength: apiKey ? apiKey.length : 0,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'none'
      }, { status: 500 });
    }

    // 验证API密钥格式
    if (!apiKey.startsWith('AIza')) {
      return NextResponse.json({
        success: false,
        error: 'API密钥格式不正确',
        details: 'Google API密钥应该以"AIza"开头',
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
      }, { status: 500 });
    }

    // 测试简单的API调用
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);

      // 先尝试列出可用模型
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // 使用更简单的提示
        const response = await model.generateContent('Hello');
        const text = response.response.text();

        return NextResponse.json({
          success: true,
          message: 'Gemini API连接成功',
          response: text,
          apiKeyStatus: '有效',
          model: 'gemini-1.5-flash'
        });

      } catch (modelError) {
        // 尝试其他模型
        try {
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
          const response = await model.generateContent('Hello');
          const text = response.response.text();

          return NextResponse.json({
            success: true,
            message: 'Gemini API连接成功（使用备用模型）',
            response: text,
            apiKeyStatus: '有效',
            model: 'gemini-pro'
          });

        } catch (fallbackError) {
          throw modelError; // 抛出原始错误
        }
      }

    } catch (geminiError: any) {
      console.error('Gemini API错误:', geminiError);

      let errorDetails = geminiError.message || '未知错误';
      let suggestions = [];

      if (errorDetails.includes('API_KEY_INVALID')) {
        suggestions.push('API密钥无效，请检查密钥是否正确');
      } else if (errorDetails.includes('PERMISSION_DENIED')) {
        suggestions.push('权限被拒绝，请检查API密钥权限');
      } else if (errorDetails.includes('QUOTA_EXCEEDED')) {
        suggestions.push('API配额已用完，请检查使用限制');
      } else if (errorDetails.includes('fetch failed')) {
        suggestions.push('网络连接失败，请检查网络连接');
        suggestions.push('可能是防火墙或代理问题');
      }

      return NextResponse.json({
        success: false,
        error: 'Gemini API调用失败',
        details: errorDetails,
        suggestions,
        apiKeyStatus: '已配置但可能无效',
        apiKeyLength: apiKey.length,
        apiKeyPrefix: apiKey.substring(0, 10) + '...'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('测试API错误:', error);

    return NextResponse.json({
      success: false,
      error: '测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 });
  }
}
