import { Recipe, UserPreferences, NutritionInfo, HealthInfo, COMMON_HEALTH_CONDITIONS } from './types';
import { extractJSON, safeJSONParse, generateId } from './utils';
import {
  callRecipeAI,
  callAI,
  getAvailableProviders,
  RECIPE_PROMPT_TEMPLATE,
  NUTRITION_PROMPT_TEMPLATE
} from './ai-providers';

/**
 * 构建完整的偏好描述文本
 */
function buildPreferencesText(preferences: UserPreferences): string {
  const parts: string[] = [];

  // 饮食限制（最重要，必须严格遵守）
  if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
    const restrictions = preferences.dietaryRestrictions.join('、');
    parts.push(`🚨【必须严格遵守的饮食限制】：${restrictions}`);

    // 针对特定饮食限制添加详细说明
    if (preferences.dietaryRestrictions.includes('纯素食')) {
      parts.push(`⚠️ 纯素食要求：绝对不能使用任何动物性食材，包括但不限于：肉类（牛肉、猪肉、鸡肉、鱼肉、虾等）、蛋类、奶制品、蜂蜜等`);
    }
    if (preferences.dietaryRestrictions.includes('素食')) {
      parts.push(`⚠️ 素食要求：不能使用肉类和鱼类，但可以使用蛋类和奶制品`);
    }
  }

  // 过敏源（极其重要，绝对不能包含）
  if (preferences.allergies && preferences.allergies.length > 0) {
    const allergies = preferences.allergies.join('、');
    parts.push(`🚨【绝对禁止的过敏源】：${allergies}`);
    parts.push(`⚠️ 过敏源说明：这些食材及其制品绝对不能出现在菜谱中，关乎用户生命安全！`);

    // 针对特定过敏源添加详细说明
    if (preferences.allergies.includes('大豆')) {
      parts.push(`⚠️ 大豆过敏：不能使用豆腐、豆浆、豆腐皮、腐竹、豆瓣酱、生抽、老抽等所有大豆制品`);
    }
    if (preferences.allergies.includes('鸡蛋')) {
      parts.push(`⚠️ 鸡蛋过敏：不能使用鸡蛋及含鸡蛋的制品`);
    }
    if (preferences.allergies.includes('鱼类')) {
      parts.push(`⚠️ 鱼类过敏：不能使用任何鱼类及鱼制品，包括鱼露、鱼汤等`);
    }
  }

  // 菜系偏好
  if (preferences.cuisineType && preferences.cuisineType.length > 0) {
    parts.push(`【菜系偏好】：${preferences.cuisineType.join('、')}`);
  }

  // 健康状况（最重要，关乎用户健康）
  if (preferences.healthConditions && preferences.healthConditions.length > 0) {
    parts.push(`🏥【健康状况限制】：用户患有以下疾病，必须严格遵守相关饮食限制`);

    preferences.healthConditions.forEach(conditionId => {
      const condition = COMMON_HEALTH_CONDITIONS.find(c => c.id === conditionId);
      if (condition) {
        parts.push(`\n📋 ${condition.name}（${condition.category}）：`);
        parts.push(`   - 疾病说明：${condition.description}`);
        parts.push(`   - 绝对禁止：${condition.forbiddenIngredients.join('、')}`);
        if (condition.limitedIngredients.length > 0) {
          parts.push(`   - 需要限制：${condition.limitedIngredients.join('、')}`);
        }
        parts.push(`   - 推荐食用：${condition.recommendedIngredients.join('、')}`);
        parts.push(`   - 科学依据：${condition.scientificBasis}`);
      }
    });

    parts.push(`\n⚠️ 健康提醒：以上健康状况的饮食限制关乎用户生命安全，必须100%严格执行！`);
  }

  return parts.length > 0 ? parts.join('\n') : '无特殊限制';
}

/**
 * 生成菜谱
 */
export async function generateRecipe(
  ingredients: string[],
  preferences: UserPreferences,
  frontendApiKeys?: any,
  preferredProvider?: string
): Promise<Recipe> {
  try {
    // 构建完整的偏好描述
    const preferencesText = buildPreferencesText(preferences);

    // 构建提示词
    const prompt = RECIPE_PROMPT_TEMPLATE
      .replace('{ingredients}', ingredients.join(', '))
      .replace('{preferences}', preferencesText)
      .replace('{timeLimit}', preferences.cookingTime.toString())
      .replace('{servings}', preferences.servings.toString())
      .replace('{difficulty}', preferences.difficulty);

    console.log('🔍 传递给AI的偏好信息:', preferencesText);
    console.log('正在调用菜谱生成专用AI...');

    // 调用菜谱生成专用AI API，传递前端API密钥和首选模型
    const responseText = await callRecipeAI(prompt, frontendApiKeys, preferredProvider);
    
    // 提取JSON部分
    const jsonText = extractJSON(responseText);
    if (!jsonText) {
      throw new Error('无法从响应中提取有效的JSON');
    }

    // 解析JSON
    const recipeData = safeJSONParse(jsonText, null) as any;
    if (!recipeData) {
      throw new Error('无法解析菜谱JSON数据');
    }

    // 验证必需字段
    if (!recipeData.title || !recipeData.ingredients || !recipeData.steps) {
      throw new Error('菜谱数据不完整，缺少必需字段');
    }

    // 构建完整的菜谱对象
    const recipe: Recipe = {
      id: generateId(),
      title: recipeData.title,
      description: recipeData.description || '',
      ingredients: Array.isArray(recipeData.ingredients) 
        ? recipeData.ingredients.map((ing: any) => ({
            name: ing.name || '',
            quantity: ing.quantity || '',
            unit: ing.unit || ''
          }))
        : [],
      steps: Array.isArray(recipeData.steps) ? recipeData.steps : [],
      cookingTime: typeof recipeData.cookingTime === 'number' 
        ? recipeData.cookingTime 
        : preferences.cookingTime,
      servings: typeof recipeData.servings === 'number' 
        ? recipeData.servings 
        : preferences.servings,
      difficulty: ['easy', 'medium', 'hard'].includes(recipeData.difficulty) 
        ? recipeData.difficulty 
        : preferences.difficulty,
      nutrition: recipeData.nutrition ? {
        calories: recipeData.nutrition.calories || 0,
        protein: recipeData.nutrition.protein || 0,
        carbs: recipeData.nutrition.carbs || 0,
        fat: recipeData.nutrition.fat || 0,
        fiber: recipeData.nutrition.fiber || 0
      } : {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      tags: Array.isArray(recipeData.tags) ? recipeData.tags : [],
      tips: Array.isArray(recipeData.tips) ? recipeData.tips : [],
      healthInfo: recipeData.healthInfo ? {
        filteredIngredients: Array.isArray(recipeData.healthInfo.filteredIngredients)
          ? recipeData.healthInfo.filteredIngredients : [],
        filterReasons: Array.isArray(recipeData.healthInfo.filterReasons)
          ? recipeData.healthInfo.filterReasons : [],
        healthBenefits: Array.isArray(recipeData.healthInfo.healthBenefits)
          ? recipeData.healthInfo.healthBenefits : [],
        nutritionHighlights: Array.isArray(recipeData.healthInfo.nutritionHighlights)
          ? recipeData.healthInfo.nutritionHighlights : [],
        healthTips: Array.isArray(recipeData.healthInfo.healthTips)
          ? recipeData.healthInfo.healthTips : []
      } : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('菜谱生成成功:', recipe.title);
    return recipe;

  } catch (error) {
    console.error('生成菜谱失败:', error);
    throw new Error(`生成菜谱失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 分析营养成分
 */
export async function analyzeNutrition(recipe: Recipe): Promise<NutritionInfo> {
  try {
    const prompt = NUTRITION_PROMPT_TEMPLATE
      .replace('{title}', recipe.title)
      .replace('{ingredients}', recipe.ingredients.map(i => `${i.name} ${i.quantity}${i.unit}`).join(', '))
      .replace('{servings}', recipe.servings.toString());

    console.log('正在分析营养成分...');
    
    // 调用AI API
    const responseText = await callAI(prompt);
    
    // 提取JSON部分
    const jsonText = extractJSON(responseText);
    if (!jsonText) {
      throw new Error('无法从响应中提取营养信息JSON');
    }

    // 解析JSON
    const nutritionData = safeJSONParse(jsonText, null) as any;
    if (!nutritionData) {
      throw new Error('无法解析营养信息JSON数据');
    }

    // 构建营养信息对象
    const nutrition: NutritionInfo = {
      calories: nutritionData.calories || 0,
      protein: nutritionData.protein || 0,
      carbs: nutritionData.carbs || 0,
      fat: nutritionData.fat || 0,
      fiber: nutritionData.fiber || 0
    };

    console.log('营养分析完成');
    return nutrition;

  } catch (error) {
    console.error('营养分析失败:', error);
    throw new Error(`营养分析失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 获取食材替代建议
 */
export async function suggestAlternatives(ingredient: string): Promise<string[]> {
  try {
    const prompt = `
请为食材"${ingredient}"提供5个可替代的食材建议。

请以JSON格式返回：
{
  "alternatives": ["替代食材1", "替代食材2", "替代食材3", "替代食材4", "替代食材5"]
}

要求：
1. 替代食材应该在口感、营养或功能上相似
2. 优先推荐常见易购买的食材
3. 考虑不同的饮食需求（如素食、无麸质等）
4. 只返回JSON格式，不要其他文字
`;

    console.log('正在获取食材替代建议...');
    
    // 调用AI API
    const responseText = await callAI(prompt);
    
    // 提取JSON部分
    const jsonText = extractJSON(responseText);
    if (!jsonText) {
      throw new Error('无法从响应中提取替代建议JSON');
    }

    // 解析JSON
    const alternativeData = safeJSONParse(jsonText, null) as any;
    if (!alternativeData || !alternativeData.alternatives) {
      throw new Error('无法解析替代建议JSON数据');
    }

    return Array.isArray(alternativeData.alternatives)
      ? alternativeData.alternatives
      : [];

  } catch (error) {
    console.error('获取替代建议失败:', error);
    throw new Error(`获取替代建议失败: ${error instanceof Error ? error.message : '未知错误'}`);
  }
}

/**
 * 重试机制包装器
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      console.log(`操作失败，${delay * (i + 1)}ms后重试... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * 测试AI连接
 */
export async function testAIConnection(): Promise<{
  success: boolean;
  provider: string;
  message: string;
  error?: string;
}> {
  try {
    const providers = getAvailableProviders();

    if (providers.length === 0) {
      return {
        success: false,
        provider: 'none',
        message: '没有配置任何AI提供商',
        error: '请在环境变量中配置至少一个API密钥'
      };
    }

    const testPrompt = '请回复"连接成功"';
    const response = await callAI(testPrompt);
    
    return {
      success: true,
      provider: providers[0].name,
      message: `AI连接成功，使用提供商: ${providers[0].name}`,
    };

  } catch (error) {
    return {
      success: false,
      provider: 'unknown',
      message: 'AI连接失败',
      error: error instanceof Error ? error.message : '未知错误'
    };
  }
}

/**
 * 获取提供商状态
 */
export function getProviderStatus(): {
  available: string[];
  configured: number;
  recommended: string;
  recipeProviders: string[];
} {
  const allProviders = getAvailableProviders();
  // 过滤掉豆包，得到菜谱生成提供商
  const recipeProviders = allProviders.filter(p => p.name !== 'doubao');

  return {
    available: allProviders.map(p => p.name),
    configured: allProviders.length,
    recommended: allProviders.length > 0 ? allProviders[0].name : 'none',
    recipeProviders: recipeProviders.map(p => p.name)
  };
}
