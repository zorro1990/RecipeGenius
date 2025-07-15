'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Recipe } from '@/lib/types';
import { RecipeCard } from '@/components/recipe/recipe-card';
import { RecipeSteps } from '@/components/recipe/recipe-steps';
import { HealthInfoComponent } from '@/components/recipe/health-info';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChefHat, RefreshCw, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function RecipePage() {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // 从localStorage获取菜谱数据
    const storedRecipe = localStorage.getItem('currentRecipe');
    const storedIngredients = localStorage.getItem('recipeIngredients');
    
    if (storedRecipe) {
      try {
        const parsedRecipe = JSON.parse(storedRecipe);
        setRecipe(parsedRecipe);
        
        if (storedIngredients) {
          setIngredients(JSON.parse(storedIngredients));
        }
      } catch (error) {
        console.error('解析菜谱数据失败:', error);
        router.push('/ingredients');
        return;
      }
    } else {
      // 如果没有菜谱数据，跳转到食材输入页面
      router.push('/ingredients');
      return;
    }
    
    setIsLoading(false);
  }, [router]);

  const handleRegenerate = async () => {
    const storedPreferences = localStorage.getItem('recipePreferences');
    
    if (!storedPreferences || ingredients.length === 0) {
      router.push('/ingredients');
      return;
    }

    setIsRegenerating(true);
    
    try {
      const preferences = JSON.parse(storedPreferences);
      
      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients, preferences }),
      });
      
      if (!response.ok) {
        throw new Error('重新生成菜谱失败');
      }
      
      const data = await response.json() as any;
      if (data.recipe) {
        setRecipe(data.recipe);
        localStorage.setItem('currentRecipe', JSON.stringify(data.recipe));
      }
    } catch (error) {
      console.error('重新生成菜谱失败:', error);
      // 这里可以添加错误提示
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    if (!recipe) return;
    
    // 保存到收藏列表（这里可以实现本地存储或发送到服务器）
    const savedRecipes = JSON.parse(localStorage.getItem('savedRecipes') || '[]');
    const isAlreadySaved = savedRecipes.some((saved: Recipe) => saved.id === recipe.id);
    
    if (!isAlreadySaved) {
      savedRecipes.push(recipe);
      localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
      // 这里可以添加成功提示
    }
  };

  const handleShare = async () => {
    if (!recipe) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `RecipeGenius - ${recipe.title}`,
          text: `${recipe.description}\n\n制作时间：${recipe.cookingTime}分钟\n份数：${recipe.servings}人`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('分享取消或失败');
      }
    } else {
      // 降级到复制链接
      navigator.clipboard.writeText(window.location.href);
      // 这里可以添加复制成功提示
    }
  };

  const handleDownload = () => {
    if (!recipe) return;
    
    // 生成菜谱文本
    const recipeText = `
${recipe.title}
${recipe.description}

制作时间：${recipe.cookingTime}分钟
份数：${recipe.servings}人
难度：${recipe.difficulty}

食材：
${recipe.ingredients.map(ing => `• ${ing.name} ${ing.quantity}${ing.unit}`).join('\n')}

制作步骤：
${recipe.steps.map((step, index) => `${index + 1}. ${step}`).join('\n\n')}

${recipe.tips ? `\n烹饪小贴士：\n${recipe.tips.map(tip => `• ${tip}`).join('\n')}` : ''}

营养信息（每份）：
• 卡路里：${Math.round(recipe.nutrition.calories / recipe.servings)}
• 蛋白质：${Math.round(recipe.nutrition.protein / recipe.servings)}g
• 碳水化合物：${Math.round(recipe.nutrition.carbs / recipe.servings)}g
• 脂肪：${Math.round(recipe.nutrition.fat / recipe.servings)}g
• 纤维：${Math.round(recipe.nutrition.fiber / recipe.servings)}g

由 RecipeGenius 生成
    `.trim();
    
    // 创建下载链接
    const blob = new Blob([recipeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${recipe.title}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin mx-auto mb-4 text-orange-500" />
          <p className="text-gray-600">正在加载菜谱...</p>
        </div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <ChefHat className="size-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold mb-2">没有找到菜谱</h2>
            <p className="text-gray-600 mb-4">请先添加食材生成菜谱</p>
            <Link href="/ingredients">
              <Button>重新开始</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/ingredients" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="size-5" />
            <ChefHat className="size-6 text-orange-500" />
            <span className="text-xl font-bold">RecipeGenius</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              size="sm"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  重新生成中...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4 mr-2" />
                  重新生成
                </>
              )}
            </Button>
            
            <div className="text-sm text-gray-600">
              步骤 2/2：菜谱展示
            </div>
          </div>
        </nav>
      </header>

      <div className="container mx-auto px-4 pb-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className={`grid w-full max-w-md mx-auto ${recipe?.healthInfo ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="overview">菜谱概览</TabsTrigger>
            <TabsTrigger value="steps">制作步骤</TabsTrigger>
            {recipe?.healthInfo && (
              <TabsTrigger value="health">健康建议</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="overview">
            <RecipeCard 
              recipe={recipe}
              onSave={handleSave}
              onShare={handleShare}
              onDownload={handleDownload}
            />
          </TabsContent>
          
          <TabsContent value="steps">
            <RecipeSteps recipe={recipe} />
          </TabsContent>

          {recipe?.healthInfo && (
            <TabsContent value="health">
              <HealthInfoComponent healthInfo={recipe.healthInfo} />
            </TabsContent>
          )}
        </Tabs>

        {/* 底部操作 */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/ingredients">
              <Button variant="outline" size="lg">
                创建新菜谱
              </Button>
            </Link>
            <Button 
              onClick={handleRegenerate}
              disabled={isRegenerating}
              size="lg"
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  重新生成中...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4 mr-2" />
                  换个菜谱试试
                </>
              )}
            </Button>
          </div>
          
          <p className="text-sm text-gray-500">
            💡 不满意当前菜谱？点击"换个菜谱试试"获得新的创意
          </p>
        </div>
      </div>
    </div>
  );
}
