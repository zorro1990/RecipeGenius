'use client';

import { useEffect, useMemo, useState } from 'react';
import { StepItem, Stepper } from '@/components/ui/stepper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  UserPreferences,
  DIETARY_RESTRICTIONS,
  CUISINE_TYPES,
  COMMON_ALLERGENS,
  COMMON_HEALTH_CONDITIONS,
  HEALTH_CONDITION_CATEGORIES,
  Recipe,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  Sparkles,
  Clock,
  ChefHat,
  AlertTriangle,
  Heart,
  Info,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';

interface PreferenceFormProps {
  onPreferencesChange: (preferences: UserPreferences) => void;
  initialPreferences?: Partial<UserPreferences>;
}

interface CuisineInsight {
  state: 'success' | 'warning';
  headline: string;
  details?: string;
  suggestions?: string[];
}

const wizardSteps = [
  {
    id: 'basics',
    title: '基础参数',
    description: '设置时间、份数与难度',
  },
  {
    id: 'diet',
    title: '饮食偏好',
    description: '饮食限制与过敏源',
  },
  {
    id: 'cuisine',
    title: '菜系与健康',
    description: '菜系偏好与健康状况',
  },
] as const;

export function PreferenceForm({
  onPreferencesChange,
  initialPreferences = {},
}: PreferenceFormProps) {
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: initialPreferences.dietaryRestrictions || [],
    cuisineType: initialPreferences.cuisineType || [],
    cookingTime: initialPreferences.cookingTime || 30,
    servings: initialPreferences.servings || 2,
    difficulty: initialPreferences.difficulty || 'easy',
    allergies: initialPreferences.allergies || [],
    healthConditions: initialPreferences.healthConditions || [],
  });

  const [activeStep, setActiveStep] = useState(0);
  const [cuisineInsight, setCuisineInsight] = useState<CuisineInsight | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cache = localStorage.getItem('currentRecipe');
      if (!cache) return;
      const parsed = JSON.parse(cache) as Recipe;
      if (!parsed?.cuisineMatch) return;

      if (parsed.cuisineMatch.matched) {
        setCuisineInsight({
          state: 'success',
          headline: `上次成功生成 ${parsed.cuisineMatch.cuisine ?? '目标'} 菜系`,
          details:
            parsed.cuisineMatch.matchedKeywords?.length
              ? `关键风味：${parsed.cuisineMatch.matchedKeywords.slice(0, 3).join('、')}`
              : undefined,
        });
      } else {
        setCuisineInsight({
          state: 'warning',
          headline: `未能完全满足 ${parsed.cuisineMatch.requestedCuisines.join('、')} 的风味`,
          details:
            parsed.cuisineMatch.missingKeywords?.length
              ? `缺少关键词：${parsed.cuisineMatch.missingKeywords.slice(0, 3).join('、')}`
              : '建议尝试调整菜系组合或放宽限制',
          suggestions: suggestCuisineAlternatives(parsed.cuisineMatch.requestedCuisines),
        });
      }
    } catch (error) {
      console.warn('读取菜谱缓存失败:', error);
    }
  }, []);

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const next = { ...preferences, ...updates };
    setPreferences(next);
    onPreferencesChange(next);
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item) ? array.filter((value) => value !== item) : [...array, item];
  };

  const selectCuisine = (cuisine: string) => {
    const current = preferences.cuisineType[0];
    if (current === cuisine) {
      updatePreferences({ cuisineType: [] });
      return;
    }
    updatePreferences({ cuisineType: [cuisine] });
  };

  const stepItems: StepItem[] = wizardSteps.map((step, index) => ({
    id: step.id,
    title: step.title,
    description: step.description,
    status: index < activeStep ? 'complete' : index === activeStep ? 'current' : 'upcoming',
  }));

  const summaryRows = useMemo(
    () => [
      {
        label: '烹饪时间',
        value: `${preferences.cookingTime} 分钟以内`,
      },
      {
        label: '用餐人数',
        value: `${preferences.servings} 人`,
      },
      {
        label: '菜谱难度',
        value: difficultyLabel(preferences.difficulty),
      },
      {
        label: '饮食限制',
        value: preferences.dietaryRestrictions.length > 0 ? preferences.dietaryRestrictions.join('、') : '无',
      },
      {
        label: '过敏原',
        value: preferences.allergies?.length ? preferences.allergies.join('、') : '暂未设置',
      },
      {
        label: '健康状况',
        value: preferences.healthConditions?.length
          ? preferences.healthConditions
              .map((id) => COMMON_HEALTH_CONDITIONS.find((condition) => condition.id === id)?.name)
              .filter(Boolean)
              .join('、')
          : '未选择',
      },
      {
        label: '菜系偏好',
        value: preferences.cuisineType.length > 0 ? preferences.cuisineType.join('、') : '尚未设定',
      },
    ],
    [preferences]
  );

  const navigate = (delta: number) => {
    setActiveStep((prev) => {
      const next = Math.min(Math.max(prev + delta, 0), wizardSteps.length - 1);
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <Stepper steps={stepItems} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="space-y-6">
          {activeStep === 0 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="size-5 text-brand-primary" />
                    时间与份量
                  </CardTitle>
                  <CardDescription>合理的时间与份数能帮助模型规划步骤节奏。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm font-medium">
                      <span>最大烹饪时间</span>
                      <span className="text-brand-primary font-semibold">{preferences.cookingTime} 分钟</span>
                    </label>
                    <Slider
                      value={[preferences.cookingTime]}
                      onValueChange={([value]) => updatePreferences({ cookingTime: value })}
                      min={10}
                      max={120}
                      step={5}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>10 分钟</span>
                      <span>60 分钟</span>
                      <span>120 分钟</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center justify-between text-sm font-medium">
                      <span>用餐人数</span>
                      <span className="text-brand-primary font-semibold">{preferences.servings} 人</span>
                    </label>
                    <Slider
                      value={[preferences.servings]}
                      onValueChange={([value]) => updatePreferences({ servings: value })}
                      min={1}
                      max={8}
                      step={1}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1 人</span>
                      <span>4 人</span>
                      <span>8 人</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ChefHat className="size-5 text-brand-secondary" />
                    烹饪难度
                  </CardTitle>
                  <CardDescription>根据你的烹饪经验选择合适的复杂度。</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      { value: 'easy', label: '简单', desc: '指引清晰、低风险' },
                      { value: 'medium', label: '中等', desc: '需要一定技巧' },
                      { value: 'hard', label: '困难', desc: '挑战进阶技法' },
                    ].map((item) => (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => updatePreferences({ difficulty: item.value as UserPreferences['difficulty'] })}
                        className={cn(
                          'group rounded-2xl border border-border p-4 text-left transition-all hover:border-brand-primary/60 hover:shadow-soft',
                          preferences.difficulty === item.value &&
                            'border-brand-primary bg-orange-50 text-brand-primary shadow-soft'
                        )}
                      >
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground group-hover:text-brand-primary">
                          {item.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeStep === 1 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="size-5 text-brand-primary" />
                    饮食限制
                  </CardTitle>
                  <CardDescription>选择需要遵守的饮食规则，我们会严格避开违规食材。</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {DIETARY_RESTRICTIONS.map((restriction) => (
                      <Badge
                        key={restriction}
                        variant={preferences.dietaryRestrictions.includes(restriction) ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer rounded-full px-3 py-1 text-sm transition-all',
                          preferences.dietaryRestrictions.includes(restriction)
                            ? 'bg-brand-primary text-white shadow-soft'
                            : 'hover:border-brand-primary hover:text-brand-primary'
                        )}
                        onClick={() =>
                          updatePreferences({
                            dietaryRestrictions: toggleArrayItem(preferences.dietaryRestrictions, restriction),
                          })
                        }
                      >
                        {restriction}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <AlertTriangle className="size-5 text-red-500" />
                    过敏原管理
                  </CardTitle>
                  <CardDescription>标记你的过敏源，生成时会自动排除。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {COMMON_ALLERGENS.map((allergen) => (
                      <Badge
                        key={allergen}
                        variant={preferences.allergies?.includes(allergen) ? 'destructive' : 'outline'}
                        className="cursor-pointer rounded-full px-3 py-1 text-sm"
                        onClick={() =>
                          updatePreferences({
                            allergies: toggleArrayItem(preferences.allergies || [], allergen),
                          })
                        }
                      >
                        {allergen}
                      </Badge>
                    ))}
                  </div>

                  {preferences.allergies?.length ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      <p className="font-medium">⚠️ 已选过敏原</p>
                      <p className="mt-1 text-xs text-red-600">{preferences.allergies.join('、')}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </>
          )}

          {activeStep === 2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="size-5 text-brand-secondary" />
                    菜系偏好
                  </CardTitle>
                  <CardDescription>
                    选择想要的菜系风味，我们会基于最新的匹配结果给予建议。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cuisineInsight && (
                    <div
                      className={cn(
                        'rounded-2xl border p-4 text-sm',
                        cuisineInsight.state === 'success'
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                      )}
                    >
                      <p className="font-semibold">{cuisineInsight.headline}</p>
                      {cuisineInsight.details ? <p className="mt-1 text-xs opacity-80">{cuisineInsight.details}</p> : null}
                      {cuisineInsight.suggestions?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {cuisineInsight.suggestions.map((suggestion) => (
                            <Button
                              key={suggestion}
                              variant="outline"
                              size="sm"
                              className="rounded-full border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white"
                              onClick={() => selectCuisine(suggestion)}
                            >
                              推荐：{suggestion}
                            </Button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {CUISINE_TYPES.map((cuisine) => {
                      const selected = preferences.cuisineType[0] === cuisine;
                      return (
                        <Badge
                          key={cuisine}
                          variant="outline"
                          className={cn(
                            'cursor-pointer rounded-full px-3 py-1 text-sm transition-all',
                            selected
                              ? 'border-transparent bg-brand-secondary text-white shadow-soft'
                              : 'border-border text-muted-foreground hover:border-brand-secondary hover:text-brand-secondary'
                          )}
                          onClick={() => selectCuisine(cuisine)}
                        >
                          {cuisine}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="size-5 text-red-500" />
                    健康状况
                  </CardTitle>
                  <CardDescription>选择与你相关的健康状况，我们将提供针对性的饮食建议。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {HEALTH_CONDITION_CATEGORIES.map((category) => {
                    const items = COMMON_HEALTH_CONDITIONS.filter((condition) => condition.category === category);
                    if (!items.length) return null;
                    return (
                      <div key={category} className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground">{category}</p>
                        <div className="flex flex-wrap gap-2">
                          {items.map((condition) => (
                            <Badge
                              key={condition.id}
                              variant={preferences.healthConditions?.includes(condition.id) ? 'destructive' : 'outline'}
                              className="cursor-pointer rounded-full px-3 py-1 text-sm"
                              onClick={() =>
                                updatePreferences({
                                  healthConditions: toggleArrayItem(preferences.healthConditions || [], condition.id),
                                })
                              }
                            >
                              <span className="flex items-center gap-1">
                                {condition.name}
                                <Info className="size-3 opacity-70" />
                              </span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {preferences.healthConditions?.length ? (
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-sm font-medium text-blue-700">已选择的健康状况</p>
                      <ul className="mt-2 space-y-2 text-xs text-blue-600">
                        {preferences.healthConditions.map((conditionId) => {
                          const condition = COMMON_HEALTH_CONDITIONS.find((item) => item.id === conditionId);
                          if (!condition) return null;
                          return (
                            <li key={conditionId}>
                              <span className="font-semibold text-blue-700">{condition.name}：</span>
                              {condition.description}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-3xl border border-border bg-surface-elevated p-5 shadow-soft">
          <div className="flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-brand-primary">
            <Sparkles className="size-4" />
            实时偏好预览
          </div>

          <div className="space-y-3">
            {summaryRows.map((row) => (
              <div key={row.label} className="rounded-2xl bg-surface-muted p-4">
                <p className="text-xs text-muted-foreground">{row.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{row.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-brand-primary/30 bg-orange-50 p-4 text-sm text-brand-primary">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <CheckCircle2 className="size-4" /> 完成所有步骤后即可生成菜谱
            </p>
            <p className="mt-1 text-xs text-brand-primary/80">
              你的选择会实时影响 AI 的提示词。确保重要限制已设置，以获得精准菜谱。
            </p>
          </div>
        </aside>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          disabled={activeStep === 0}
          className="w-full sm:w-auto"
        >
          <ArrowLeft className="size-4" /> 上一步
        </Button>

        <Button
          className="w-full bg-brand-primary text-white hover:bg-brand-primary-strong sm:w-auto"
          onClick={() => (activeStep === wizardSteps.length - 1 ? setActiveStep(0) : navigate(1))}
        >
          {activeStep === wizardSteps.length - 1 ? (
            <>
              完成设置
              <Sparkles className="size-4" />
            </>
          ) : (
            <>
              下一步
              <ArrowRight className="size-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

function difficultyLabel(value: UserPreferences['difficulty']) {
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

function suggestCuisineAlternatives(current: string[]): string[] {
  if (!current.length) {
    return ['中式', '西式'];
  }

  const altMap: Record<string, string[]> = {
    中式: ['西式', '泰式'],
    日式: ['韩式', '泰式'],
    韩式: ['日式', '泰式'],
    泰式: ['日式', '中式'],
    西式: ['意式', '法式'],
    法式: ['意式', '西式'],
    意式: ['西式', '法式'],
    印度菜: ['泰式', '墨西哥菜'],
    墨西哥菜: ['西式', '泰式'],
  };

  const pool = new Set<string>();
  current.forEach((cuisine) => {
    altMap[cuisine]?.forEach((alt) => pool.add(alt));
  });

  const allowed = Array.from(pool).filter((item) =>
    (CUISINE_TYPES as readonly string[]).includes(item)
  );

  if (!allowed.length) {
    return CUISINE_TYPES.slice(0, 3);
  }

  return allowed.slice(0, 3);
}
