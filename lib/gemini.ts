import { GoogleGenerativeAI } from '@google/generative-ai';
import { Recipe, RecipeStep, StepSkillLevel, UserPreferences, NutritionInfo, COMMON_HEALTH_CONDITIONS } from './types';
import { extractJSON, safeJSONParse, generateId } from './utils';
import { getSecureEnvVar } from './cloudflare-utils';

// 获取Gemini客户端实例
function getGeminiClient(): GoogleGenerativeAI {
  const apiKey = getSecureEnvVar('GOOGLE_API_KEY');
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY environment variable is not set');
  }
  return new GoogleGenerativeAI(apiKey);
}

const MIN_STEPS_BY_DIFFICULTY: Record<'easy' | 'medium' | 'hard', number> = {
  easy: 5,
  medium: 7,
  hard: 9,
};

const DIFFICULTY_SKILL_LEVEL: Record<'easy' | 'medium' | 'hard', StepSkillLevel> = {
  easy: 'basic',
  medium: 'intermediate',
  hard: 'advanced',
};

const STEP_SKILL_LEVEL_VALUES: StepSkillLevel[] = ['basic', 'intermediate', 'advanced'];

function buildDifficultyGuidance(difficulty: 'easy' | 'medium' | 'hard'): string {
  switch (difficulty) {
    case 'easy':
      return '🧑‍🍳【烹饪难度】：简单。请提供至少5个步骤，强调基础操作和省时技巧，描述中需包含时间提示（3-6分钟），skillLevel以"basic"为主。';
    case 'medium':
      return '👨‍🍳【烹饪难度】：中等。请提供7-9个步骤，包含火候控制、分段处理等要点，描述需给出具体细节和时间（5-10分钟），skillLevel混合"basic"与"intermediate"。';
    case 'hard':
      return '👩‍🍳【烹饪难度】：困难。请提供9-12个步骤，展示高级技巧（多段火候、调味分层、精细摆盘），描述需深入细节并给出时间（7-15分钟），至少一半步骤使用"advanced" skillLevel。';
    default:
      return '请根据难度调整步骤数量、细致程度与技巧等级。';
  }
}

function deriveStepTitle(text: string, index: number): string {
  const separators = ['，', '。', '；', ',', ';'];
  for (const separator of separators) {
    const [candidate] = text.split(separator);
    if (candidate && candidate.trim().length > 2 && candidate.trim().length <= 18) {
      return candidate.trim();
    }
  }
  return `步骤 ${index + 1}`;
}

function deriveStepDuration(index: number, total: number, difficulty: 'easy' | 'medium' | 'hard'): number {
  const ranges: Record<'easy' | 'medium' | 'hard', [number, number]> = {
    easy: [3, 6],
    medium: [5, 10],
    hard: [7, 15],
  };
  const [min, max] = ranges[difficulty];
  if (total <= 1) return Math.round((min + max) / 2);
  const ratio = index / (total - 1);
  return Math.round(min + (max - min) * ratio);
}

function normalizeRecipeSteps(rawSteps: unknown, difficulty: 'easy' | 'medium' | 'hard'): RecipeStep[] {
  if (!Array.isArray(rawSteps)) {
    return [];
  }

  return rawSteps
    .map((step, index) => {
      if (typeof step === 'string') {
        return {
          index: index + 1,
          title: deriveStepTitle(step, index),
          description: step,
          duration: deriveStepDuration(index, rawSteps.length, difficulty),
          skillLevel: DIFFICULTY_SKILL_LEVEL[difficulty],
        } as RecipeStep;
      }

      if (step && typeof step === 'object') {
        const stepObject = step as Record<string, unknown>;
        const description = typeof stepObject.description === 'string'
          ? stepObject.description
          : typeof stepObject.detail === 'string'
            ? stepObject.detail
            : typeof stepObject.instructions === 'string'
              ? stepObject.instructions
              : '';
        const titleCandidate = typeof stepObject.title === 'string' ? stepObject.title : '';
        const title = titleCandidate || deriveStepTitle(description || '', index);
        const duration = typeof stepObject.duration === 'number'
          ? stepObject.duration
          : deriveStepDuration(index, rawSteps.length, difficulty);
        const skillCandidate = typeof stepObject.skillLevel === 'string' ? stepObject.skillLevel : undefined;
        const skillLevel: StepSkillLevel = skillCandidate && STEP_SKILL_LEVEL_VALUES.includes(skillCandidate as StepSkillLevel)
          ? (skillCandidate as StepSkillLevel)
          : DIFFICULTY_SKILL_LEVEL[difficulty];
        const tips = Array.isArray(stepObject.tips)
          ? stepObject.tips.filter((tip): tip is string => typeof tip === 'string' && tip.trim().length > 0)
          : undefined;

        return {
          index: index + 1,
          title: title || `步骤 ${index + 1}`,
          description: description || '',
          duration,
          skillLevel,
          tips,
        } as RecipeStep;
      }

      return null;
    })
    .filter((step): step is RecipeStep => !!step && !!step.description);
}
// 菜谱生成提示词模板
export const RECIPE_PROMPT_TEMPLATE = `
作为一位专业的厨师和营养师，请根据以下信息生成一个详细的菜谱：

食材列表：{ingredients}
用户偏好和限制：{preferences}
烹饪时间限制：{timeLimit}分钟
用餐人数：{servings}人
难度要求：{difficulty}

🚨 严格约束条件（必须遵守，关乎用户安全）：
1. 【饮食限制】如果用户设置了饮食限制（如素食、纯素食等），必须100%严格遵守，绝对不能使用任何违反限制的食材
2. 【过敏源安全】如果用户标注了过敏源，这些食材及其制品绝对不能出现在菜谱中，这关乎用户生命安全
3. 【食材冲突处理】如果现有食材与用户的饮食限制或过敏源冲突，必须从食材列表中完全排除这些食材
4. 【替代方案】当排除冲突食材后，使用剩余的安全食材创建菜谱，或建议安全的替代食材
5. 【菜系偏好】在满足安全要求的前提下，优先考虑用户的菜系偏好

⚠️ 特别注意：
- 纯素食 = 绝对不能有任何动物性食材（肉、鱼、蛋、奶等）
- 大豆过敏 = 不能有豆腐、豆浆、生抽、老抽等任何大豆制品
- 鸡蛋过敏 = 不能有鸡蛋及含鸡蛋的任何制品
- 安全第一，宁可简单也不能违反限制

🧠 难度与步骤规则：
- easy（简单）：至少5个步骤，突出基础技巧与省时逻辑，步骤语言要简单易懂，skillLevel以"basic"为主
- medium（中等）：7-9个步骤，包含火候控制、分段处理等技巧，可混合"basic"与"intermediate"
- hard（困难）：9-12个步骤，展示高级技巧（多段火候、预处理、摆盘等），至少一半步骤使用"advanced"

✍️ 步骤写作要求：
- 每个步骤description需至少两句话，包含关键动作、技巧和时间提示
- duration为整数分钟，合理体现步骤耗时
- tips字段可选，但若存在需给出实用提醒

请严格输出以下JSON结构：
{
  "title": "菜谱名称",
  "description": "简短描述（50字以内）",
  "ingredients": [
    {"name": "食材名", "quantity": "数量", "unit": "单位"}
  ],
  "steps": [
    {
      "index": 1,
      "title": "步骤标题（概括关键动作）",
      "description": "详细步骤说明（至少两句，包含操作顺序、火候、质感及时间提示）",
      "duration": 6,
      "skillLevel": "basic/intermediate/advanced",
      "tips": ["提示1", "提示2"]
    }
  ],
  "cookingTime": 总烹饪时间(分钟),
  "servings": 份数,
  "difficulty": "easy/medium/hard",
  "nutrition": {
    "calories": 卡路里,
    "protein": 蛋白质(g),
    "carbs": 碳水化合物(g),
    "fat": 脂肪(g),
    "fiber": 纤维(g)
  },
  "tags": ["标签1", "标签2"],
  "tips": ["烹饪小贴士1", "烹饪小贴士2"],
  "healthInfo": {
    "filteredIngredients": ["被过滤的食材1", "被过滤的食材2"],
    "filterReasons": ["过滤原因1", "过滤原因2"],
    "healthBenefits": ["健康益处1", "健康益处2"],
    "nutritionHighlights": ["营养重点1", "营养重点2"],
    "healthTips": ["健康建议1", "健康建议2"]
  }
}

请确保：
1. 严格遵守用户的饮食限制和过敏源要求
2. 步骤数量与难度相匹配，且描述充分细致
3. 食材用量、时间与营养数据合理
4. healthInfo 针对用户健康状况给出具体建议
5. 只返回JSON，不要其他文字

请生成菜谱：
`;

// 营养分析提示词模板
export const NUTRITION_PROMPT_TEMPLATE = `
请分析以下菜谱的营养成分：

菜谱：{title}
食材：{ingredients}
份数：{servings}

请以JSON格式返回每份的营养信息：
{
  "calories": 卡路里,
  "protein": 蛋白质(g),
  "carbs": 碳水化合物(g),
  "fat": 脂肪(g),
  "fiber": 纤维(g)
}

只返回JSON，不要其他文字。
`;

// 食材替代建议提示词模板
export const ALTERNATIVE_PROMPT_TEMPLATE = `
请为食材"{ingredient}"推荐3-5个替代食材，考虑营养价值、口感和烹饪特性。

以JSON格式返回：
{
  "alternatives": ["替代食材1", "替代食材2", "替代食材3"]
}

只返回JSON，不要其他文字。
`;

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

  // 难度指引
  parts.push(buildDifficultyGuidance(preferences.difficulty));

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
  preferences: UserPreferences
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

    console.log('🔍 传递给Gemini的偏好信息:', preferencesText);

    // 调用Gemini API
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    
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

    // 验证必要字段
    if (!recipeData.title || !recipeData.ingredients || !recipeData.steps) {
      throw new Error('菜谱数据不完整');
    }

    const normalizedSteps = normalizeRecipeSteps(recipeData.steps, preferences.difficulty);
    if (normalizedSteps.length === 0) {
      throw new Error('菜谱步骤生成失败，未获得有效的步骤列表');
    }

    // 构建完整的Recipe对象
    const recipe: Recipe = {
      id: generateId(),
      title: recipeData.title,
      description: recipeData.description || '',
      ingredients: recipeData.ingredients || [],
      steps: normalizedSteps,
      cookingTime: recipeData.cookingTime || preferences.cookingTime,
      servings: recipeData.servings || preferences.servings,
      difficulty: recipeData.difficulty || preferences.difficulty,
      nutrition: recipeData.nutrition || {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0
      },
      tags: recipeData.tags || [],
      tips: recipeData.tips || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const minStepsRequired = MIN_STEPS_BY_DIFFICULTY[recipe.difficulty];
    if (recipe.steps.length < minStepsRequired) {
      console.warn(`Gemini生成的菜谱步骤少于预期（${recipe.steps.length}/${minStepsRequired}）`);
    }

    return recipe;
  } catch (error) {
    console.error('菜谱生成失败:', error);
    throw new Error(`菜谱生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
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

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    const jsonText = extractJSON(responseText);
    
    if (!jsonText) {
      throw new Error('无法从响应中提取营养信息JSON');
    }

    const nutritionData = safeJSONParse(jsonText, null) as any;
    if (!nutritionData) {
      throw new Error('无法解析营养信息JSON数据');
    }

    return {
      calories: nutritionData.calories || 0,
      protein: nutritionData.protein || 0,
      carbs: nutritionData.carbs || 0,
      fat: nutritionData.fat || 0,
      fiber: nutritionData.fiber || 0
    };
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
    const prompt = ALTERNATIVE_PROMPT_TEMPLATE.replace('{ingredient}', ingredient);

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent(prompt);
    const responseText = response.response.text();
    const jsonText = extractJSON(responseText);
    
    if (!jsonText) {
      throw new Error('无法从响应中提取替代建议JSON');
    }

    const alternativeData = safeJSONParse(jsonText, null) as any;
    if (!alternativeData || !alternativeData.alternatives) {
      throw new Error('无法解析替代建议JSON数据');
    }

    return alternativeData.alternatives;
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
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
