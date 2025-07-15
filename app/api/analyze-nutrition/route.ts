import { NextRequest, NextResponse } from 'next/server';
import { analyzeNutrition, withRetry } from '@/lib/ai-service';
import { Recipe, NutritionAnalysisRequest, ApiResponse, NutritionInfo } from '@/lib/types';
import { formatErrorMessage } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: NutritionAnalysisRequest = await request.json();
    const { recipe } = body;

    // 验证输入
    if (!recipe) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '请提供菜谱信息'
      }, { status: 400 });
    }

    if (!recipe.title || !recipe.ingredients || recipe.ingredients.length === 0) {
      return NextResponse.json<ApiResponse<null>>({
        success: false,
        error: '菜谱信息不完整'
      }, { status: 400 });
    }

    console.log('开始分析营养成分:', recipe.title);

    // 使用重试机制分析营养
    const nutrition = await withRetry(
      () => analyzeNutrition(recipe),
      3, // 最多重试3次
      1500 // 延迟1.5秒
    );

    console.log('营养分析完成:', nutrition);

    // 生成营养建议
    const recommendations = generateNutritionRecommendations(nutrition, recipe.servings);

    // 返回成功响应
    return NextResponse.json<ApiResponse<{ nutrition: NutritionInfo; recommendations: string[] }>>({
      success: true,
      data: { 
        nutrition,
        recommendations
      },
      message: '营养分析完成'
    });

  } catch (error) {
    console.error('营养分析API错误:', error);

    // 处理不同类型的错误
    let errorMessage = '营养分析失败，请稍后重试';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'AI服务配置错误，请联系管理员';
        statusCode = 503;
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'AI服务暂时不可用，请稍后重试';
        statusCode = 503;
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

// 生成营养建议
function generateNutritionRecommendations(nutrition: NutritionInfo, servings: number): string[] {
  const recommendations: string[] = [];
  
  // 卡路里建议
  const caloriesPerServing = nutrition.calories / servings;
  if (caloriesPerServing > 600) {
    recommendations.push('这道菜热量较高，建议搭配清淡的蔬菜或汤品');
  } else if (caloriesPerServing < 200) {
    recommendations.push('这道菜热量较低，可以作为轻食或配菜');
  }

  // 蛋白质建议
  const proteinPerServing = nutrition.protein / servings;
  if (proteinPerServing > 25) {
    recommendations.push('蛋白质含量丰富，适合健身或需要补充蛋白质的人群');
  } else if (proteinPerServing < 10) {
    recommendations.push('蛋白质含量较低，建议搭配肉类、蛋类或豆制品');
  }

  // 纤维建议
  const fiberPerServing = nutrition.fiber / servings;
  if (fiberPerServing > 8) {
    recommendations.push('膳食纤维丰富，有助于消化和肠道健康');
  } else if (fiberPerServing < 3) {
    recommendations.push('建议增加蔬菜或全谷物来提高膳食纤维含量');
  }

  // 脂肪建议
  const fatPerServing = nutrition.fat / servings;
  if (fatPerServing > 20) {
    recommendations.push('脂肪含量较高，建议适量食用');
  } else if (fatPerServing < 5) {
    recommendations.push('脂肪含量较低，可以适当添加健康油脂如橄榄油');
  }

  // 碳水化合物建议
  const carbsPerServing = nutrition.carbs / servings;
  if (carbsPerServing > 50) {
    recommendations.push('碳水化合物含量较高，适合运动前后食用');
  }

  // 如果没有特殊建议，给出通用建议
  if (recommendations.length === 0) {
    recommendations.push('营养搭配均衡，是一道健康的菜品');
  }

  return recommendations;
}

// 处理不支持的HTTP方法
export async function GET() {
  return NextResponse.json<ApiResponse<null>>({
    success: false,
    error: '不支持的请求方法'
  }, { status: 405 });
}
