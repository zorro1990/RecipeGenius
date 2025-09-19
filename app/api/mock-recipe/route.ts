import { NextRequest, NextResponse } from 'next/server';
import { Recipe, RecipeStep, StepSkillLevel } from '@/lib/types';
import { generateId } from '@/lib/utils';

function buildMockSteps(ingredients: string[], difficulty: Recipe['difficulty']): RecipeStep[] {
  const skillLevelMap: Record<Recipe['difficulty'], StepSkillLevel> = {
    easy: 'basic',
    medium: 'intermediate',
    hard: 'advanced',
  };

  const descriptions = [
    `将${ingredients[0]}洗净切好备用`,
    '热锅下油，爆香蒜蓉',
    `下入${ingredients[0]}翻炒至半熟`,
    `加入${ingredients.slice(1).join('、')}继续炒制`,
    '调入适量盐、生抽调味',
    '炒至食材熟透即可出锅装盘'
  ];

  const baseDuration: Record<Recipe['difficulty'], [number, number]> = {
    easy: [3, 6],
    medium: [5, 9],
    hard: [7, 12],
  };

  const [min, max] = baseDuration[difficulty];

  return descriptions.map((description, index) => {
    const ratio = descriptions.length > 1 ? index / (descriptions.length - 1) : 0.5;
    const duration = Math.round(min + (max - min) * ratio);
    const shortTitle = description.split(/，|。|；|,/)[0]?.trim() || `步骤 ${index + 1}`;

    return {
      index: index + 1,
      title: shortTitle,
      description,
      duration,
      skillLevel: skillLevelMap[difficulty],
    };
  });
}

export async function POST(request: NextRequest) {
  try {
    const { ingredients, preferences } = await request.json() as {
      ingredients: string[];
      preferences: any;
    };

    await new Promise(resolve => setTimeout(resolve, 2000));

    const difficulty = preferences.difficulty || 'easy';

    const mockRecipe: Recipe = {
      id: generateId(),
      title: `${ingredients[0]}炒制`,
      description: `一道美味的${ingredients.slice(0, 2).join('和')}料理，营养丰富，制作简单。`,
      ingredients: ingredients.map((ingredient: string) => ({
        name: ingredient,
        quantity: '适量',
        unit: '',
        category: 'other' as const
      })),
      steps: buildMockSteps(ingredients, difficulty),
      cookingTime: preferences.cookingTime || 30,
      servings: preferences.servings || 2,
      difficulty,
      nutrition: {
        calories: 350,
        protein: 20,
        carbs: 40,
        fat: 12,
        fiber: 5
      },
      tags: ['家常菜', '营养丰富', '简单易做'],
      tips: [
        '制作过程中保持中小火，避免糊锅',
        '可以根据个人口味调整调料用量',
        '新鲜食材会让口感更佳'
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: { recipe: mockRecipe },
      message: '模拟菜谱生成成功'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '模拟菜谱生成失败'
    }, { status: 500 });
  }
}
