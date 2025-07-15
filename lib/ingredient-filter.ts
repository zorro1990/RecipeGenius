import { UserPreferences, COMMON_HEALTH_CONDITIONS } from './types';

/**
 * 根据用户偏好过滤食材
 */
export function filterIngredientsByPreferences(
  ingredients: string[],
  preferences: UserPreferences
): {
  allowedIngredients: string[];
  filteredIngredients: string[];
  filterReasons: string[];
} {
  const filteredIngredients: string[] = [];
  const filterReasons: string[] = [];
  const allowedIngredients: string[] = [];

  ingredients.forEach(ingredient => {
    let shouldFilter = false;
    const reasons: string[] = [];

    // 检查饮食限制
    if (preferences.dietaryRestrictions?.includes('纯素食')) {
      const animalProducts = [
        '肉', '牛肉', '猪肉', '鸡肉', '鸭肉', '羊肉', '鱼', '鱼肉', '虾', '蟹', '螃蟹',
        '蛤蜊', '青口', '扇贝', '牡蛎', '鸡蛋', '鸭蛋', '鹌鹑蛋', '牛奶', '奶酪', '黄油', '蜂蜜'
      ];
      if (animalProducts.some(animal => ingredient.includes(animal))) {
        shouldFilter = true;
        reasons.push('纯素食限制：不能食用动物性食材');
      }
    }

    if (preferences.dietaryRestrictions?.includes('素食')) {
      const meatProducts = [
        '肉', '牛肉', '猪肉', '鸡肉', '鸭肉', '羊肉', '鱼', '鱼肉', '虾', '蟹', '螃蟹',
        '蛤蜊', '青口', '扇贝', '牡蛎'
      ];
      if (meatProducts.some(meat => ingredient.includes(meat))) {
        shouldFilter = true;
        reasons.push('素食限制：不能食用肉类和海鲜');
      }
    }

    // 检查过敏源
    if (preferences.allergies) {
      preferences.allergies.forEach(allergen => {
        if (ingredient.includes(allergen)) {
          shouldFilter = true;
          reasons.push(`${allergen}过敏：避免过敏反应`);
        }

        // 特殊处理大豆过敏
        if (allergen === '大豆') {
          const soyProducts = ['豆腐', '豆浆', '豆皮', '腐竹', '豆瓣酱', '生抽', '老抽', '豆豉'];
          if (soyProducts.some(soy => ingredient.includes(soy))) {
            shouldFilter = true;
            reasons.push('大豆过敏：避免所有大豆制品');
          }
        }
      });
    }

    // 检查健康状况
    if (preferences.healthConditions) {
      preferences.healthConditions.forEach(conditionId => {
        const condition = COMMON_HEALTH_CONDITIONS.find(c => c.id === conditionId);
        if (condition) {
          // 检查绝对禁止的食材
          condition.forbiddenIngredients.forEach(forbidden => {
            if (ingredient.includes(forbidden) || forbidden.includes(ingredient)) {
              shouldFilter = true;
              reasons.push(`${condition.name}限制：${forbidden}属于禁止食材`);
            }
          });

          // 特殊处理海鲜类（痛风）
          if (condition.id === 'gout') {
            const seafoodKeywords = ['蛤', '蜊', '青口', '扇贝', '牡蛎', '生蚝', '虾', '蟹', '螃蟹', '龙虾', '海鲜', '鱼', '鲍鱼', '海参'];
            if (seafoodKeywords.some(keyword => ingredient.includes(keyword))) {
              shouldFilter = true;
              reasons.push(`痛风限制：${ingredient}属于高嘌呤海鲜，会加重病情`);
            }
          }
        }
      });
    }

    // 🚨 临时解决方案：强制过滤常见海鲜
    const commonSeafood = ['蛤蜊', '青口', '扇贝', '牡蛎', '生蚝', '虾', '蟹', '螃蟹', '龙虾', '鲍鱼', '海参'];
    if (commonSeafood.includes(ingredient)) {
      const hasGoutConcern = preferences.healthConditions?.includes('gout') ||
                           preferences.dietaryRestrictions?.some(diet => diet.includes('痛风')) ||
                           preferences.allergies?.includes('海鲜');

      if (hasGoutConcern) {
        shouldFilter = true;
        reasons.push(`海鲜过滤：${ingredient}属于高嘌呤食物，不适合痛风患者`);
      }
    }

    if (shouldFilter) {
      filteredIngredients.push(ingredient);
      filterReasons.push(`${ingredient}: ${reasons.join('；')}`);
    } else {
      allowedIngredients.push(ingredient);
    }
  });

  return {
    allowedIngredients,
    filteredIngredients,
    filterReasons
  };
}

/**
 * 生成过滤说明文本
 */
export function generateFilterExplanation(
  filteredIngredients: string[],
  filterReasons: string[]
): string {
  if (filteredIngredients.length === 0) {
    return '所有食材都符合您的饮食要求 ✅';
  }

  let explanation = `为了您的健康，我们过滤了以下食材：\n\n`;

  filterReasons.forEach(reason => {
    explanation += `❌ ${reason}\n`;
  });

  explanation += `\n💡 建议：使用剩余的安全食材制作菜谱，或选择替代食材。`;

  return explanation;
}