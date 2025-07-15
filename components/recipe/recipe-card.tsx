'use client';

import { Recipe } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Users, ChefHat, Heart, Share2, Download } from 'lucide-react';
import { formatCookingTime, calculateNutritionScore } from '@/lib/utils';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
}

export function RecipeCard({ recipe, onSave, onShare, onDownload }: RecipeCardProps) {
  const nutritionScore = calculateNutritionScore(recipe.nutrition);
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '简单';
      case 'medium': return '中等';
      case 'hard': return '困难';
      default: return '未知';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
              {recipe.title}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600">
              {recipe.description}
            </CardDescription>
          </div>
          
          {/* 营养评分 */}
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{nutritionScore}</div>
            <div className="text-xs text-gray-500">营养评分</div>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="size-4" />
            <span className="text-sm">{formatCookingTime(recipe.cookingTime)}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="size-4" />
            <span className="text-sm">{recipe.servings}人份</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <ChefHat className="size-4" />
            <Badge className={getDifficultyColor(recipe.difficulty)}>
              {getDifficultyLabel(recipe.difficulty)}
            </Badge>
          </div>
        </div>

        {/* 标签 */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-2">
          {onSave && (
            <Button variant="outline" size="sm" onClick={onSave}>
              <Heart className="size-4 mr-2" />
              收藏
            </Button>
          )}
          {onShare && (
            <Button variant="outline" size="sm" onClick={onShare}>
              <Share2 className="size-4 mr-2" />
              分享
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <Download className="size-4 mr-2" />
              下载
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 食材列表 */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">所需食材</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {recipe.ingredients.map((ingredient, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{ingredient.name}</span>
                <span className="text-gray-600 text-sm">
                  {ingredient.quantity} {ingredient.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 营养信息 */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-900">营养信息</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-xl font-bold text-orange-600">{Math.round(recipe.nutrition.calories)}</div>
              <div className="text-xs text-gray-600">卡路里</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{Math.round(recipe.nutrition.protein)}g</div>
              <div className="text-xs text-gray-600">蛋白质</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">{Math.round(recipe.nutrition.carbs)}g</div>
              <div className="text-xs text-gray-600">碳水</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-xl font-bold text-purple-600">{Math.round(recipe.nutrition.fat)}g</div>
              <div className="text-xs text-gray-600">脂肪</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-xl font-bold text-yellow-600">{Math.round(recipe.nutrition.fiber)}g</div>
              <div className="text-xs text-gray-600">纤维</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * 营养数据为估算值，仅供参考
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
