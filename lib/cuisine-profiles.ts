import { Recipe } from './types';

export interface CuisineProfile {
  id: string;
  name: string;
  flavorNotes: string[];
  keySeasonings: string[];
  typicalIngredients: string[];
  cookingMethods: string[];
  signatureTags: string[];
  avoidCombos?: string[];
}

export const CUISINE_PROFILES: Record<string, CuisineProfile> = {
  '中式': {
    id: 'zh',
    name: '中式',
    flavorNotes: ['鲜香', '酱香', '麻辣', '蒜香'],
    keySeasonings: ['生抽', '老抽', '蚝油', '料酒', '豆瓣酱', '花椒', '葱', '姜', '蒜'],
    typicalIngredients: ['大葱', '姜', '蒜', '香菇', '青椒', '豆腐', '胡萝卜'],
    cookingMethods: ['爆炒', '煸炒', '红烧', '炖', '蒸', '焯水'],
    signatureTags: ['家常菜', '川菜', '粤菜', '湘菜', '中式'],
    avoidCombos: ['奶油', '奶酪', '黄油', '大份奶制品'],
  },
  '日式': {
    id: 'jp',
    name: '日式',
    flavorNotes: ['清淡', '鲜甜', '酱香'],
    keySeasonings: ['酱油', '味醂', '清酒', '日式高汤', '味噌'],
    typicalIngredients: ['海带', '木鱼花', '白萝卜', '香菇', '豆腐', '青葱'],
    cookingMethods: ['炖煮', '焖煮', '蒸', '煮', '凉拌'],
    signatureTags: ['日式', '和风', '和食'],
    avoidCombos: ['大量辣椒油', '花椒', '奶酪'],
  },
  '韩式': {
    id: 'kr',
    name: '韩式',
    flavorNotes: ['辛辣', '咸鲜', '蒜香', '甜辣'],
    keySeasonings: ['韩式辣酱', '大酱', '芝麻油', '蒜', '葱', '酱油'],
    typicalIngredients: ['泡菜', '洋葱', '胡萝卜', '杏鲍菇', '年糕'],
    cookingMethods: ['拌', '炒', '煮汤', '烤'],
    signatureTags: ['韩式', '韩国料理'],
    avoidCombos: ['孜然粉', '奶油'],
  },
  '泰式': {
    id: 'th',
    name: '泰式',
    flavorNotes: ['酸辣', '椰香', '甜辣'],
    keySeasonings: ['鱼露', '椰奶', '柠檬叶', '香茅', '南姜', '泰国辣椒'],
    typicalIngredients: ['香菜', '青柠', '洋葱', '虾', '鸡肉', '胡萝卜'],
    cookingMethods: ['炒', '拌', '咖喱', '汤'],
    signatureTags: ['泰式', '泰国菜'],
    avoidCombos: ['花椒', '豆瓣酱'],
  },
  '西式': {
    id: 'western',
    name: '西式',
    flavorNotes: ['奶香', '香草', '番茄香'],
    keySeasonings: ['黄油', '橄榄油', '黑胡椒', '迷迭香', '百里香', '罗勒'],
    typicalIngredients: ['番茄', '洋葱', '奶油', '奶酪', '意面'],
    cookingMethods: ['烤', '煎', '炖', '焗'],
    signatureTags: ['西式', '意式', '法式', '欧式'],
    avoidCombos: ['花椒', '豆瓣酱'],
  },
  '法式': {
    id: 'fr',
    name: '法式',
    flavorNotes: ['奶油香', '酒香', '草本香'],
    keySeasonings: ['黄油', '干白葡萄酒', '百里香', '月桂叶'],
    typicalIngredients: ['洋葱', '蘑菇', '土豆', '奶油', '奶酪'],
    cookingMethods: ['慢炖', '焗', '煎'],
    signatureTags: ['法式', '法餐'],
    avoidCombos: ['花椒', '豆瓣酱', '酱油'],
  },
  '意式': {
    id: 'it',
    name: '意式',
    flavorNotes: ['番茄香', '草本香', '奶香'],
    keySeasonings: ['番茄酱', '橄榄油', '罗勒', '迷迭香', '黑胡椒', '帕玛森芝士'],
    typicalIngredients: ['意面', '洋葱', '大蒜', '蘑菇'],
    cookingMethods: ['煮', '烤', '焗'],
    signatureTags: ['意式', '意大利菜', '西餐'],
    avoidCombos: ['花椒', '豆瓣酱'],
  },
  '印度菜': {
    id: 'in',
    name: '印度菜',
    flavorNotes: ['香料浓郁', '咖喱', '辛香'],
    keySeasonings: ['咖喱粉', '姜黄', '孜然', '小茴香', '印度香料混合'],
    typicalIngredients: ['鹰嘴豆', '番茄', '洋葱', '椰奶'],
    cookingMethods: ['焖煮', '炒', '烤'],
    signatureTags: ['印度菜', '咖喱'],
    avoidCombos: ['生抽', '老抽'],
  },
  '墨西哥菜': {
    id: 'mx',
    name: '墨西哥菜',
    flavorNotes: ['辣香', '烘烤香', '玉米香'],
    keySeasonings: ['墨西哥辣椒', '孜然', '香菜叶', '酸橙汁'],
    typicalIngredients: ['牛油果', '番茄', '洋葱', '玉米饼'],
    cookingMethods: ['烘烤', '煎', '炖'],
    signatureTags: ['墨西哥菜', 'Tex-Mex'],
    avoidCombos: ['花椒', '豆瓣酱'],
  },
};

const DEFAULT_THRESHOLD = 0.6;

export interface CuisineMatchResult {
  matched: boolean;
  cuisine: string | null;
  confidence: number;
  reasons: string[];
  matchedKeywords: string[];
  missingKeywords: string[];
}

function detectKeywords(text: string, keywords: string[]): string[] {
  const lower = text.toLowerCase();
  return keywords.filter(keyword => keyword && lower.includes(keyword.toLowerCase()));
}

export function buildCuisineGuidance(selected: string[]): string {
  if (!selected || selected.length === 0) {
    return '未指定菜系偏好，可以根据食材选择最适合的烹饪方式。';
  }

  const instructions = selected
    .map((cuisine, index) => {
      const profile = CUISINE_PROFILES[cuisine];
      if (!profile) {
        return `- 目标菜系：${cuisine}（暂未配置详细特征，请参考常见做法）`;
      }

      const ranking = index === 0 ? '主要菜系' : '可选菜系';
      return [
        `${ranking}：${profile.name}`,
        `  - 核心风味：${profile.flavorNotes.join('、')}`,
        `  - 常用调味：${profile.keySeasonings.join('、')}`,
        `  - 常见食材：${profile.typicalIngredients.join('、')}`,
        `  - 常用烹饪方式：${profile.cookingMethods.join('、')}`,
        profile.avoidCombos && profile.avoidCombos.length > 0
          ? `  - 避免出现：${profile.avoidCombos.join('、')}`
          : null,
        `  - 推荐标签：${profile.signatureTags.join('、')}`,
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `${instructions}\n请确保菜谱标题、描述、调味选择和步骤体现以上菜系特征。如受限于安全食材，可提供贴近风味的替代方案。`;
}

export function evaluateCuisineMatch(
  recipe: Recipe,
  desiredCuisines: string[]
): CuisineMatchResult {
  if (!desiredCuisines || desiredCuisines.length === 0) {
    return {
      matched: true,
      cuisine: null,
      confidence: 1,
      reasons: ['未选择菜系偏好'],
      matchedKeywords: [],
      missingKeywords: [],
    };
  }

  const contentFields = [
    recipe.title,
    recipe.description,
    recipe.tags?.join(' ') ?? '',
    recipe.steps?.map(step => `${step.title} ${step.description}`).join(' ') ?? '',
    recipe.ingredients?.map(ing => ing.name).join(' ') ?? '',
  ];
  const combinedText = contentFields.join(' ').toLowerCase();

  const evaluations = desiredCuisines.map(cuisine => {
    const profile = CUISINE_PROFILES[cuisine];
    if (!profile) {
      return {
        cuisine,
        score: 0,
        matchedKeywords: [] as string[],
        missingKeywords: [],
        totalKeywords: 0,
      };
    }

    const matches: string[] = [];

    const tagHits = profile.signatureTags.filter(tag => recipe.tags?.includes(tag));
    matches.push(...tagHits);

    const seasoningHits = detectKeywords(combinedText, profile.keySeasonings);
    const ingredientHits = detectKeywords(combinedText, profile.typicalIngredients);
    const methodHits = detectKeywords(combinedText, profile.cookingMethods);
    const flavorHits = detectKeywords(combinedText, profile.flavorNotes);

    matches.push(...seasoningHits, ...ingredientHits, ...methodHits, ...flavorHits);

    const uniqueMatches = Array.from(new Set(matches));
    const distinctKeywordCount = new Set([
      ...profile.keySeasonings,
      ...profile.typicalIngredients,
      ...profile.cookingMethods,
      ...profile.flavorNotes,
    ]).size;

    const scoreComponents = [
      tagHits.length > 0 ? 0.25 : 0,
      seasoningHits.length / Math.max(profile.keySeasonings.length, 1) * 0.3,
      ingredientHits.length / Math.max(profile.typicalIngredients.length, 1) * 0.2,
      methodHits.length / Math.max(profile.cookingMethods.length, 1) * 0.15,
      flavorHits.length / Math.max(profile.flavorNotes.length, 1) * 0.1,
    ];

    const score = Math.min(scoreComponents.reduce((acc, value) => acc + value, 0), 1);

    const missingCandidates = profile.keySeasonings
      .concat(profile.typicalIngredients)
      .concat(profile.cookingMethods)
      .filter(keyword => !uniqueMatches.some(match => match.includes(keyword)));

    return {
      cuisine,
      score,
      matchedKeywords: uniqueMatches,
      missingKeywords: missingCandidates.slice(0, 5),
      totalKeywords: distinctKeywordCount,
    };
  });

  evaluations.sort((a, b) => b.score - a.score);
  const best = evaluations[0];

  const matched = best.score >= DEFAULT_THRESHOLD;

  const reasons: string[] = [];
  if (matched) {
    reasons.push(`菜系评分 ${best.score.toFixed(2)} >= ${DEFAULT_THRESHOLD}`);
  } else {
    reasons.push(`菜系评分 ${best.score.toFixed(2)} < ${DEFAULT_THRESHOLD}`);
    if (best.missingKeywords.length > 0) {
      reasons.push(`缺少关键词：${best.missingKeywords.join('、')}`);
    }
  }

  return {
    matched,
    cuisine: best?.cuisine ?? desiredCuisines[0],
    confidence: Number(best?.score?.toFixed(2)) || 0,
    reasons,
    matchedKeywords: best?.matchedKeywords ?? [],
    missingKeywords: best?.missingKeywords ?? [],
  };
}
