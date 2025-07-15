import { NextRequest, NextResponse } from 'next/server';
import { generateRecipe, withRetry } from '@/lib/ai-service';
import { UserPreferences, RecipeGenerationRequest, ApiResponse, Recipe } from '@/lib/types';
import { cleanIngredients, formatErrorMessage } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: RecipeGenerationRequest & { apiKeys?: any; preferredProvider?: string } = await request.json();
    const { ingredients, preferences, apiKeys, preferredProvider } = body;

    // 验证输入
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '请至少提供一种食材'
      }, { status: 400 });
    }

    if (!preferences) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '请提供用户偏好设置'
      }, { status: 400 });
    }

    // 清理和验证食材列表
    const cleanedIngredients = cleanIngredients(ingredients);
    if (cleanedIngredients.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '请提供有效的食材名称'
      }, { status: 400 });
    }

    // 验证偏好设置
    const validatedPreferences: UserPreferences = {
      dietaryRestrictions: preferences.dietaryRestrictions || [],
      cuisineType: preferences.cuisineType || [],
      cookingTime: Math.max(10, Math.min(120, preferences.cookingTime || 30)),
      servings: Math.max(1, Math.min(8, preferences.servings || 2)),
      difficulty: ['easy', 'medium', 'hard'].includes(preferences.difficulty)
        ? preferences.difficulty
        : 'easy',
      allergies: preferences.allergies || [],
      healthConditions: preferences.healthConditions || [], // 🏥 修复：添加健康状况字段
    };

    console.log('开始生成菜谱:', {
      ingredients: cleanedIngredients,
      preferences: validatedPreferences
    });

    // 使用重试机制生成菜谱，传递前端API密钥和首选模型
    const recipe = await withRetry(
      () => generateRecipe(cleanedIngredients, validatedPreferences, apiKeys, preferredProvider),
      3, // 最多重试3次
      2000 // 延迟2秒
    );

    console.log('菜谱生成成功:', recipe.title);

    // 返回成功响应
    return NextResponse.json<ApiResponse<{ recipe: Recipe }>>({
      success: true,
      data: { recipe },
      message: '菜谱生成成功'
    });

  } catch (error) {
    console.error('菜谱生成API错误:', error);

    // 处理不同类型的错误
    let errorMessage = '菜谱生成失败，请稍后重试';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI服务配置错误，请联系管理员';
        statusCode = 503;
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'AI服务暂时不可用，请稍后重试';
        statusCode = 503;
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请重试';
        statusCode = 408;
      } else {
        errorMessage = formatErrorMessage(error);
      }
    }

    return NextResponse.json<ApiResponse<null>>({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
}

// 处理不支持的HTTP方法
export async function GET() {
  return NextResponse.json<ApiResponse<null>>({
    success: false,
    error: '不支持的请求方法'
  }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json<ApiResponse<null>>({
    success: false,
    error: '不支持的请求方法'
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json<ApiResponse<null>>({
    success: false,
    error: '不支持的请求方法'
  }, { status: 405 });
}
