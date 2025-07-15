'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { UserPreferences, DIETARY_RESTRICTIONS, CUISINE_TYPES, COMMON_ALLERGENS, COMMON_HEALTH_CONDITIONS, HEALTH_CONDITION_CATEGORIES } from '@/lib/types';
import { Clock, Users, ChefHat, AlertTriangle, Heart, Info } from 'lucide-react';

interface PreferenceFormProps {
  onPreferencesChange: (preferences: UserPreferences) => void;
  initialPreferences?: Partial<UserPreferences>;
}

export function PreferenceForm({
  onPreferencesChange,
  initialPreferences = {}
}: PreferenceFormProps) {
  console.log('🎯 PreferenceForm 渲染，初始偏好:', initialPreferences);
  console.log('🏥 健康状况数据检查:', {
    categoriesLength: HEALTH_CONDITION_CATEGORIES.length,
    conditionsLength: COMMON_HEALTH_CONDITIONS.length,
    categories: HEALTH_CONDITION_CATEGORIES,
    firstCondition: COMMON_HEALTH_CONDITIONS[0]
  });
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: initialPreferences.dietaryRestrictions || [],
    cuisineType: initialPreferences.cuisineType || [],
    cookingTime: initialPreferences.cookingTime || 30,
    servings: initialPreferences.servings || 2,
    difficulty: initialPreferences.difficulty || 'easy',
    allergies: initialPreferences.allergies || [],
    healthConditions: initialPreferences.healthConditions || [],
  });

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    console.log('🔄 偏好设置更新:', updates);
    console.log('📋 新的偏好设置:', newPreferences);
    setPreferences(newPreferences);
    onPreferencesChange(newPreferences);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5 text-blue-500" />
            烹饪时间和份数
          </CardTitle>
          <CardDescription>
            设置你的时间限制和用餐人数
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>最大烹饪时间</span>
              <span className="text-orange-500 font-semibold">{preferences.cookingTime}分钟</span>
            </label>
            <Slider
              value={[preferences.cookingTime]}
              onValueChange={([value]) => updatePreferences({ cookingTime: value })}
              max={120}
              min={10}
              step={5}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>10分钟</span>
              <span>60分钟</span>
              <span>120分钟</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center justify-between">
              <span>用餐人数</span>
              <span className="text-orange-500 font-semibold">{preferences.servings}人</span>
            </label>
            <Slider
              value={[preferences.servings]}
              onValueChange={([value]) => updatePreferences({ servings: value })}
              max={8}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1人</span>
              <span>4人</span>
              <span>8人</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="size-5 text-green-500" />
            烹饪难度
          </CardTitle>
          <CardDescription>
            选择适合你技能水平的难度
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'easy', label: '简单', desc: '基础操作' },
              { value: 'medium', label: '中等', desc: '需要一些技巧' },
              { value: 'hard', label: '困难', desc: '挑战性强' }
            ].map((difficulty) => (
              <Button
                key={difficulty.value}
                variant={preferences.difficulty === difficulty.value ? 'default' : 'outline'}
                onClick={() => updatePreferences({ difficulty: difficulty.value as any })}
                className="h-auto p-4 flex flex-col items-center gap-2"
              >
                <span className="font-medium">{difficulty.label}</span>
                <span className="text-xs opacity-70">{difficulty.desc}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-purple-500" />
            饮食偏好
          </CardTitle>
          <CardDescription>
            选择你的饮食限制和偏好
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">饮食限制</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_RESTRICTIONS.map((restriction) => (
                <Badge
                  key={restriction}
                  variant={preferences.dietaryRestrictions.includes(restriction) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => updatePreferences({
                    dietaryRestrictions: toggleArrayItem(preferences.dietaryRestrictions, restriction)
                  })}
                >
                  {restriction}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">菜系偏好</label>
            <div className="flex flex-wrap gap-2">
              {CUISINE_TYPES.map((cuisine) => (
                <Badge
                  key={cuisine}
                  variant={preferences.cuisineType.includes(cuisine) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => updatePreferences({
                    cuisineType: toggleArrayItem(preferences.cuisineType, cuisine)
                  })}
                >
                  {cuisine}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-red-500" />
            过敏原提醒
          </CardTitle>
          <CardDescription>
            选择你需要避免的过敏原
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGENS.map((allergen) => (
              <Badge
                key={allergen}
                variant={preferences.allergies?.includes(allergen) ? 'destructive' : 'outline'}
                className="cursor-pointer"
                onClick={() => updatePreferences({
                  allergies: toggleArrayItem(preferences.allergies || [], allergen)
                })}
              >
                {allergen}
              </Badge>
            ))}
          </div>
          {preferences.allergies && preferences.allergies.length > 0 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                ⚠️ 已选择过敏原：{preferences.allergies.join('、')}
              </p>
              <p className="text-xs text-red-600 mt-1">
                生成的菜谱将避免使用这些食材
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 健康状况 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="size-5 text-red-500" />
            健康状况
          </CardTitle>
          <CardDescription>
            选择您的健康状况，我们将为您提供专业的饮食建议
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(() => {
            console.log('🏥 健康状况分类:', HEALTH_CONDITION_CATEGORIES);
            console.log('🏥 健康状况列表:', COMMON_HEALTH_CONDITIONS);
            return null;
          })()}
          {HEALTH_CONDITION_CATEGORIES.map((category) => {
            const conditionsInCategory = COMMON_HEALTH_CONDITIONS.filter(
              condition => condition.category === category
            );

            console.log(`🏥 分类 ${category} 的疾病:`, conditionsInCategory);

            if (conditionsInCategory.length === 0) return null;

            return (
              <div key={category} className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{category}</label>
                <div className="flex flex-wrap gap-2">
                  {conditionsInCategory.map((condition) => (
                    <Badge
                      key={condition.id}
                      variant={preferences.healthConditions?.includes(condition.id) ? 'destructive' : 'outline'}
                      className={`cursor-pointer transition-all ${
                        condition.severity === 'severe' ? 'border-red-300 hover:border-red-400' :
                        condition.severity === 'moderate' ? 'border-orange-300 hover:border-orange-400' :
                        'border-yellow-300 hover:border-yellow-400'
                      }`}
                      onClick={() => updatePreferences({
                        healthConditions: toggleArrayItem(preferences.healthConditions || [], condition.id)
                      })}
                    >
                      <span className="flex items-center gap-1">
                        {condition.name}
                        <Info className="size-3" title={condition.description} />
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}

          {preferences.healthConditions && preferences.healthConditions.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium mb-2">
                💙 已选择的健康状况：
              </p>
              {preferences.healthConditions.map(conditionId => {
                const condition = COMMON_HEALTH_CONDITIONS.find(c => c.id === conditionId);
                return condition ? (
                  <div key={conditionId} className="mb-2 p-2 bg-white rounded border">
                    <p className="text-sm font-medium text-blue-800">{condition.name}</p>
                    <p className="text-xs text-blue-600 mt-1">{condition.description}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      将避免：{condition.forbiddenIngredients.slice(0, 3).join('、')}
                      {condition.forbiddenIngredients.length > 3 && '等'}
                    </p>
                  </div>
                ) : null;
              })}
              <p className="text-xs text-blue-600 mt-2">
                ⚠️ 生成的菜谱将根据您的健康状况进行专业调整，并提供相应的健康建议
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 偏好总结 */}
      <Card className="bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-orange-800">偏好总结</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-orange-700">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">烹饪时间：</span>
              {preferences.cookingTime}分钟以内
            </div>
            <div>
              <span className="font-medium">用餐人数：</span>
              {preferences.servings}人
            </div>
            <div>
              <span className="font-medium">难度：</span>
              {preferences.difficulty === 'easy' ? '简单' :
               preferences.difficulty === 'medium' ? '中等' : '困难'}
            </div>
            <div>
              <span className="font-medium">饮食限制：</span>
              {preferences.dietaryRestrictions.length > 0
                ? preferences.dietaryRestrictions.join('、')
                : '无特殊限制'}
            </div>
            {preferences.allergies && preferences.allergies.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium">过敏原：</span>
                {preferences.allergies.join('、')}
              </div>
            )}
            {preferences.healthConditions && preferences.healthConditions.length > 0 && (
              <div className="col-span-2">
                <span className="font-medium">健康状况：</span>
                {preferences.healthConditions.map(id => {
                  const condition = COMMON_HEALTH_CONDITIONS.find(c => c.id === id);
                  return condition?.name;
                }).filter(Boolean).join('、')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
