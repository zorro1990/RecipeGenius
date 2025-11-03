'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IngredientInput } from '@/components/forms/ingredient-input';
import { PreferenceForm } from '@/components/forms/preference-form';
import { APISettingsModal } from '@/components/api-settings-modal';
import { APIStatusIndicator } from '@/components/api-status-indicator';
import { ImageIngredientRecognition } from '@/components/image-ingredient-recognition';
import { ApiResponse, Recipe, UserPreferences } from '@/lib/types';
import { hasAnyAPIKey, getStoredAPIKeys, getPreferredRecipeProvider } from '@/lib/api-key-storage';
import { filterIngredientsByPreferences, generateFilterExplanation } from '@/lib/ingredient-filter';
import { Loader2, ChefHat, ArrowLeft, Sparkles, Settings, Camera, CheckCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { StoryflowOverlay } from '@/components/generation/storyflow-overlay';
import { StepItem } from '@/components/ui/stepper';

type CTAState = 'idle-disabled' | 'idle-ready' | 'loading' | 'success' | 'failure';
const GENERATE_RECIPE_TIMEOUT_MS = 5 * 60 * 1000; // Allow up to 5 minutes for slow AI providers

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    cuisineType: [],
    cookingTime: 30,
    servings: 2,
    difficulty: 'easy',
    allergies: [],
    healthConditions: [],
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAPISettingsOpen, setIsAPISettingsOpen] = useState(false);
  const [hasAPIKeys, setHasAPIKeys] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [ctaState, setCtaState] = useState<CTAState>('idle-disabled');
  const [storyflowOpen, setStoryflowOpen] = useState(false);
  const [storyflowSteps, setStoryflowSteps] = useState<StepItem[]>(() => buildStoryflowSteps(0));
  const [storyflowAttempt, setStoryflowAttempt] = useState(1);
  const [storyflowMaxAttempts, setStoryflowMaxAttempts] = useState(3);
  const [storyflowFailure, setStoryflowFailure] = useState<string | null>(null);
  const router = useRouter();

  // 检查API密钥状态
  useEffect(() => {
    setMounted(true);
    const checkAPIKeys = () => {
      if (typeof window !== 'undefined') {
        setHasAPIKeys(hasAnyAPIKey());
      }
    };

    checkAPIKeys();

    // 监听localStorage变化
    const interval = setInterval(checkAPIKeys, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerateRecipe = async () => {
    console.log('🚀 开始生成菜谱，当前食材:', ingredients);
    console.log('🔑 API密钥状态:', hasAPIKeys);

    if (ingredients.length === 0) {
      console.log('❌ 没有食材');
      setError('请至少添加一种食材');
      setCtaState('idle-disabled');
      return;
    }

    // 检查是否配置了API密钥
    if (!hasAPIKeys) {
      console.log('❌ 没有API密钥');
      setError('要生成个性化菜谱，需要配置AI服务。点击右上角按钮进行配置。');
      setCtaState('idle-ready');
      return;
    }

    console.log('✅ 开始调用API');
    setCtaState('loading');
    setError(null);
    setStoryflowOpen(true);
    setStoryflowFailure(null);
    setStoryflowSteps(buildStoryflowSteps(0));
    setStoryflowAttempt(1);
    setStoryflowMaxAttempts(3);

    // 🛡️ 食材预过滤
    const filterResult = filterIngredientsByPreferences(ingredients, preferences);
    let { allowedIngredients, filteredIngredients, filterReasons } = filterResult;

    setStoryflowSteps(buildStoryflowSteps(1));

    // 🚨 临时强制海鲜过滤（修复痛风问题）
    const seafoodItems = ['蛤蜊', '青口', '扇贝', '牡蛎', '生蚝', '虾', '蟹', '螃蟹', '龙虾', '鲍鱼', '海参'];
    const foundSeafood = allowedIngredients.filter(ingredient =>
      seafoodItems.some(seafood => ingredient.includes(seafood))
    );

    if (foundSeafood.length > 0) {
      console.log('🦐 检测到海鲜食材:', foundSeafood);
      // 移除海鲜食材
      allowedIngredients = allowedIngredients.filter(ingredient =>
        !seafoodItems.some(seafood => ingredient.includes(seafood))
      );
      // 添加到过滤列表
      filteredIngredients = [...filteredIngredients, ...foundSeafood];
      filterReasons = [...filterReasons, ...foundSeafood.map(seafood =>
        `${seafood}: 海鲜属于高嘌呤食物，为了您的健康已过滤`
      )];
      console.log('🛡️ 海鲜过滤后的安全食材:', allowedIngredients);
    }

    console.log('🛡️ 食材过滤结果:', {
      原始食材: ingredients,
      允许食材: allowedIngredients,
      过滤食材: filteredIngredients,
      过滤原因: filterReasons
    });

    // 如果所有食材都被过滤了
    if (allowedIngredients.length === 0) {
      setError(`所有食材都不符合您的饮食要求：\n${generateFilterExplanation(filteredIngredients, filterReasons)}`);
      setCtaState('failure');
      return;
    }

    // 如果有食材被过滤，显示提醒
    if (filteredIngredients.length > 0) {
      const explanation = generateFilterExplanation(filteredIngredients, filterReasons);
      console.log('⚠️ 食材过滤说明:', explanation);
      // 可以选择显示一个提醒，但不阻止生成
    }

    let timeoutId: NodeJS.Timeout | undefined;

    try {
      // 获取前端API密钥和首选模型
      const apiKeys = hasAnyAPIKey() ? getStoredAPIKeys() : undefined;
      const preferredProvider = getPreferredRecipeProvider();
      console.log('📋 准备发送的数据:', {
        ingredients: allowedIngredients, // 使用过滤后的食材
        preferences,
        hasApiKeys: !!apiKeys,
        preferredProvider,
        filteredInfo: { filteredIngredients, filterReasons }
      });

      // 调用真实的AI菜谱生成API
      console.log('🌐 开始发送请求到 /api/generate-recipe');

      // 创建AbortController用于超时控制
      const controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort('Request timeout');
        }
      }, GENERATE_RECIPE_TIMEOUT_MS);

      setStoryflowSteps(buildStoryflowSteps(2));

      const response = await fetch('/api/generate-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: allowedIngredients, // 使用过滤后的安全食材
          preferences,
          preferredProvider,
          apiKeys: apiKeys ? {
            deepseek: apiKeys.deepseek,
            doubao: apiKeys.doubao ? {
              key: apiKeys.doubao,
              endpointId: apiKeys.doubaoEndpointId
            } : undefined,
            qwen: apiKeys.qwen,
            glm: apiKeys.glm,
            gemini: apiKeys.gemini,
            seedream: apiKeys.seedream,
            seedreamModelId: apiKeys.seedreamModelId
          } : undefined
        }),
        signal: controller.signal
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      console.log('📡 收到响应:', response.status, response.statusText);
      const responseBody = await response.json() as ApiResponse<{ recipe: Recipe }>;

      if (!response.ok) {
        throw new Error(responseBody.error || '生成菜谱失败');
      }

      console.log('API返回数据:', responseBody); // 添加调试日志

      if (responseBody.success && responseBody.data && responseBody.data.recipe) {
        const cuisineMatch = responseBody.data.recipe.cuisineMatch;
        if (cuisineMatch) {
          setStoryflowAttempt(cuisineMatch.attempts ?? 1);
          setStoryflowMaxAttempts(cuisineMatch.maxAttempts ?? 3);
          if (!cuisineMatch.matched && cuisineMatch.reasons?.length) {
            setStoryflowFailure(cuisineMatch.reasons.join('；'));
          }
        }

        // 存储到localStorage
        localStorage.setItem('currentRecipe', JSON.stringify(responseBody.data.recipe));
        localStorage.setItem('recipeIngredients', JSON.stringify(ingredients));
        localStorage.setItem('recipePreferences', JSON.stringify(preferences));
        setCtaState('success');

        setStoryflowSteps(buildStoryflowSteps(4));

        setTimeout(() => {
          setStoryflowOpen(false);
        }, 600);

        // 跳转到菜谱展示页面
        router.push('/recipe');
      } else {
        console.error('数据结构错误:', responseBody);
        throw new Error(responseBody.error || '未收到有效的菜谱数据');
      }
    } catch (error) {
      console.error('生成菜谱失败:', error);

      let errorMessage = '生成菜谱失败，请重试';

      if (error instanceof Error) {
        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          errorMessage = '请求超时，AI服务响应较慢，请稍后重试';
        } else if (error.message.includes('timeout')) {
          errorMessage = '请求超时，请检查网络连接后重试';
        } else if (error.message.includes('API')) {
          errorMessage = error.message;
        } else {
          errorMessage = error.message;
        }
      }

      setError(errorMessage);
      setCtaState('failure');
      setStoryflowFailure(errorMessage);
      setStoryflowSteps(buildStoryflowSteps(3));
    } finally {
      // 确保清理定时器
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    }
  };

  const updateIngredientList = (nextIngredients: string[]) => {
    setIngredients(nextIngredients);
    setError(null);

    if (nextIngredients.length === 0) {
      setCtaState('idle-disabled');
    } else if (ctaState !== 'loading') {
      setCtaState('idle-ready');
    }
  };

  const ctaTitle = (() => {
    switch (ctaState) {
      case 'failure':
        return '生成遇到问题';
      case 'success':
        return '菜谱已准备好';
      default:
        return '准备好了吗？';
    }
  })();

  const ctaSupportingText = (() => {
    switch (ctaState) {
      case 'idle-disabled':
        return '还没有食材，请上传或手动添加';
      case 'idle-ready':
        return `已添加 ${ingredients.length} 种食材，点击生成专属菜谱`;
      case 'loading':
        return 'AI 正在根据您确认的食材生成菜谱，请稍候';
      case 'success':
        return '生成完成，稍后将为你展示菜谱详情';
      case 'failure':
        return '生成失败，请查看上方提示后重试';
      default:
        return '';
    }
  })();

  const ctaButtonContent = (() => {
    switch (ctaState) {
      case 'loading':
        return (
          <>
            <Loader2 className="mr-2 size-5 animate-spin" />
            AI 正在创建菜谱...
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="mr-2 size-5" />
            查看菜谱详情
          </>
        );
      case 'failure':
        return (
          <>
            <RefreshCw className="mr-2 size-5" />
            重新尝试生成
          </>
        );
      case 'idle-disabled':
        return (
          <>
            <Sparkles className="mr-2 size-5" />
            请先确认食材
          </>
        );
      case 'idle-ready':
      default:
        return (
          <>
            <Sparkles className="mr-2 size-5" />
            生成我的专属菜谱
          </>
        );
    }
  })();

  const ctaCardGradient = (() => {
    switch (ctaState) {
      case 'failure':
        return 'from-red-500 to-rose-500';
      case 'success':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-orange-500 to-red-500';
    }
  })();

  const ctaButtonDisabled = ctaState === 'idle-disabled' || ctaState === 'loading';
  const showEstimate = ctaState === 'idle-ready' || ctaState === 'loading';

  // 防止 hydration 错误
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="size-5" />
            <ChefHat className="size-6 text-orange-500" />
            <span className="text-xl font-bold">RecipeGenius</span>
          </Link>
          <APIStatusIndicator onOpenSettings={() => setIsAPISettingsOpen(true)} />
        </nav>
      </header>

      <div className="container mx-auto px-4 pb-8 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            告诉我你有什么食材
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            拍照识别或手动输入你现有的食材，设置你的偏好，让AI为你创造美味菜谱
          </p>
          <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Camera className="size-4 text-blue-500" />
              <span>输入食材</span>
            </div>
            <div className="flex items-center gap-2">
              <span>✏️</span>
              <span>设置偏好</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-orange-500" />
              <span>AI 生成菜谱</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="image-recognition" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
            <TabsTrigger value="image-recognition" className="flex items-center gap-2">
              <Camera className="size-4" />
              图片识别
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="flex items-center gap-2">
              🥕 手动输入
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              ⚙️ 偏好设置
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ingredients">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">手动添加食材</CardTitle>
                <CardDescription>
                  输入你现有的食材，我们会为你推荐最佳的搭配方案
                </CardDescription>
              </CardHeader>
              <CardContent>
                <IngredientInput
                  onIngredientsChange={updateIngredientList}
                  initialIngredients={ingredients}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="image-recognition" forceMount>
            <ImageIngredientRecognition
              isGenerating={ctaState === 'loading'}
              onIngredientsConfirmed={(recognizedIngredients) => {
                // 将识别的食材添加到现有列表中
                const newIngredients = [...ingredients];
                let addedCount = 0;

                recognizedIngredients.forEach(ingredient => {
                  if (!newIngredients.includes(ingredient)) {
                    newIngredients.push(ingredient);
                    addedCount++;
                  }
                });

                updateIngredientList(newIngredients);

                if (addedCount > 0) {
                  setSuccessMessage(`成功识别并添加了 ${addedCount} 种食材！您可以在"手动输入"标签页查看和编辑。`);
                  setTimeout(() => setSuccessMessage(null), 5000);
                }
              }}
            />
          </TabsContent>
          
          <TabsContent value="preferences">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">个性化设置</CardTitle>
                  <CardDescription>
                    根据你的需求定制菜谱，让AI生成最适合你的方案
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <PreferenceForm 
                onPreferencesChange={setPreferences}
                initialPreferences={preferences}
              />
            </div>
          </TabsContent>
        </Tabs>
        


        {/* 生成按钮区域 */}
        <div className="mt-8 space-y-4">
          {/* 成功消息 */}
          {successMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-700 text-sm">{successMessage}</p>
            </div>
          )}

          {/* 错误消息 */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
              {error.includes('API密钥') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAPISettingsOpen(true)}
                  className="mt-2 text-red-700 border-red-300 hover:bg-red-50"
                >
                  <Settings className="size-4 mr-2" />
                  配置API密钥
                </Button>
              )}
            </div>
          )}
          
          <Card className={`bg-gradient-to-r ${ctaCardGradient} text-white border-0 transition-colors`}>
            <CardContent className="p-6">
              <div className="text-center space-y-4" aria-live="polite">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{ctaTitle}</h3>
                  <p className="opacity-90">{ctaSupportingText}</p>
                </div>

                <Button
                  onClick={() => {
                    console.log('🖱️ 按钮被点击');
                    handleGenerateRecipe();
                  }}
                  disabled={ctaButtonDisabled}
                  size="lg"
                  variant="secondary"
                  className="text-lg px-8 py-4 font-semibold data-[cta-state=failure]:text-red-600 data-[cta-state=success]:text-emerald-700"
                  data-generate-button
                  data-cta-state={ctaState}
                  aria-busy={ctaState === 'loading'}
                >
                  {ctaButtonContent}
                </Button>
                
                {showEstimate && (
                  <div className="text-sm opacity-75">
                    预计生成时间：约 1 分钟
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 提示信息 */}
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-500">
            💡 小贴士：添加更多食材可以获得更丰富的菜谱选择
          </p>
          <p className="text-xs text-gray-400">
            📸 支持拍照识别食材 | ✏️ 支持手动输入 | 🤖 AI智能推荐
          </p>
        </div>
      </div>

      {/* API设置模态框 */}
      <APISettingsModal
        isOpen={isAPISettingsOpen}
        onClose={() => setIsAPISettingsOpen(false)}
        onKeysUpdated={() => {
          setHasAPIKeys(hasAnyAPIKey());
          setError(null); // 清除错误信息
        }}
      />
      <StoryflowOverlay
        open={storyflowOpen}
        steps={storyflowSteps}
        attempt={storyflowAttempt}
        failureReason={storyflowFailure}
        hint={<StoryflowHint preferences={preferences} ingredients={ingredients} />}
        maxAttempts={storyflowMaxAttempts}
      />
    </div>
  );
}

function buildStoryflowSteps(currentStage: number): StepItem[] {
  const definitions: Array<{ id: string; title: string; description: string }> = [
    { id: 'prepare', title: '准备参数', description: '校验食材与偏好设置' },
    { id: 'generate', title: 'AI 生成菜谱', description: '调用模型创作菜谱' },
    { id: 'match', title: '菜系匹配', description: '验证风味关键词' },
    { id: 'finalize', title: '完成并展示', description: '准备跳转到结果页' },
  ];

  const clampedStage = Math.min(Math.max(currentStage, 0), definitions.length);

  return definitions.map((definition, index) => ({
    id: definition.id,
    title: definition.title,
    description: definition.description,
    status: index < clampedStage ? 'complete' : index === clampedStage ? 'current' : 'upcoming',
  }));
}

function StoryflowHint({
  preferences,
  ingredients,
}: {
  preferences: UserPreferences;
  ingredients: string[];
}) {
  const kitchenStats = useMemo(() => {
    const ingredientCount = ingredients.length;
    const cuisine = preferences.cuisineType[0] ?? '开放';
    return {
      ingredientCount,
      cuisine,
      difficulty: preferences.difficulty,
    };
  }, [preferences, ingredients]);

  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      <p>
        当前已确认 <span className="font-semibold text-brand-primary">{kitchenStats.ingredientCount}</span> 种食材，
        偏好菜系为 <span className="font-semibold text-brand-primary">{kitchenStats.cuisine}</span>，
        难度设定为 {friendlyDifficulty(kitchenStats.difficulty)}。
      </p>
      <p className="text-xs opacity-80">
        AI 会自动避开饮食限制与过敏源，若生成时间较长，请耐心等待并保持页面打开。
      </p>
    </div>
  );
}

function friendlyDifficulty(value: UserPreferences['difficulty']) {
  switch (value) {
    case 'easy':
      return '简单 · 快速上手';
    case 'medium':
      return '中等 · 平衡技巧';
    case 'hard':
      return '困难 · 高级挑战';
    default:
      return '未设定';
  }
}
