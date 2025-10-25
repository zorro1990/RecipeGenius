'use client';

import { useEffect, useState } from 'react';
import { Recipe, UserPreferences } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { calculateNutritionScore, formatCookingTime, cn } from '@/lib/utils';
import {
  Clock,
  Users,
  ChefHat,
  Heart,
  Share2,
  Download,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { RecipeImagePreview } from './recipe-image-preview';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: () => void;
  onShare?: () => void;
  onDownload?: () => void;
  preferences?: UserPreferences | null;
  onOpenAPISettings?: () => void;
}

export function RecipeCard({
  recipe,
  onSave,
  onShare,
  onDownload,
  preferences,
  onOpenAPISettings,
}: RecipeCardProps) {
  const nutritionScore = calculateNutritionScore(recipe.nutrition);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-[32px] bg-gradient-to-br from-orange-50 via-white to-rose-50 shadow-soft transition-all duration-500 ease-out',
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div className="grid gap-8 md:grid-cols-[minmax(0,3fr)_minmax(260px,2fr)]">
        <div className="flex flex-col gap-6 p-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-brand-primary shadow-soft">
              <Sparkles className="size-4" /> 本次生成的专属菜谱
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground md:text-4xl">{recipe.title}</h1>
              <p className="mt-3 text-base text-muted-foreground md:text-lg">{recipe.description}</p>
            </div>
            {recipe.tags?.length ? (
              <div className="flex flex-wrap gap-2">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="rounded-full border-white/60 bg-white/70 text-xs text-muted-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricPill icon={Clock} label="烹饪时间" value={formatCookingTime(recipe.cookingTime)} />
            <MetricPill icon={Users} label="用餐人数" value={`${recipe.servings} 人`} />
            <MetricPill icon={ChefHat} label="技巧等级" value={difficultyLabel(recipe.difficulty)} tone={recipe.difficulty} />
          </div>

          <div className="rounded-2xl bg-white/75 p-5 shadow-soft">
            <div className="flex items-baseline gap-3">
              <span className="text-sm font-medium text-muted-foreground">营养评分</span>
              <span className="text-4xl font-bold text-brand-primary">{nutritionScore}</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-5">
              <NutritionStat label="卡路里" value={`${Math.round(recipe.nutrition.calories)} kcal`} />
              <NutritionStat label="蛋白质" value={`${Math.round(recipe.nutrition.protein)} g`} />
              <NutritionStat label="碳水" value={`${Math.round(recipe.nutrition.carbs)} g`} />
              <NutritionStat label="脂肪" value={`${Math.round(recipe.nutrition.fat)} g`} />
              <NutritionStat label="膳食纤维" value={`${Math.round(recipe.nutrition.fiber)} g`} />
            </div>
          </div>

          {recipe.cuisineMatch ? <CuisineMatchBanner match={recipe.cuisineMatch} /> : null}

          <div className="flex flex-wrap gap-3">
            {onSave && (
              <Button variant="outline" size="lg" onClick={onSave} className="rounded-full">
                <Heart className="size-4" /> 收藏
              </Button>
            )}
            {onShare && (
              <Button variant="outline" size="lg" onClick={onShare} className="rounded-full">
                <Share2 className="size-4" /> 分享
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="lg" onClick={onDownload} className="rounded-full">
                <Download className="size-4" /> 下载
              </Button>
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-l-[48px] rounded-r-[32px] border-l border-white/60 bg-white/60 p-6">
          <RecipeImagePreview recipe={recipe} preferences={preferences ?? undefined} onOpenSettings={onOpenAPISettings} />
        </div>
      </div>
    </section>
  );
}

function MetricPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  tone?: string;
}) {
  const toneClass =
    tone === 'hard'
      ? 'border-red-200 bg-red-50 text-red-700'
      : tone === 'medium'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : tone === 'easy'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-white/60 bg-white/80 text-muted-foreground';

  return (
    <div className={cn('flex items-center gap-3 rounded-2xl p-4 shadow-soft', toneClass)}>
      <div className="flex size-10 items-center justify-center rounded-full bg-white text-brand-primary shadow-soft">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-current">{value}</p>
      </div>
    </div>
  );
}

function NutritionStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-3 text-xs text-muted-foreground shadow-soft">
      <p className="font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wide">{label}</p>
    </div>
  );
}

function CuisineMatchBanner({ match }: { match: Recipe['cuisineMatch'] }) {
  if (!match) return null;

  const success = match.matched;
  return (
    <div
      className={cn(
        'flex flex-wrap items-start gap-3 rounded-2xl border px-4 py-3 text-sm',
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-amber-200 bg-amber-50 text-amber-700'
      )}
    >
      <div className="flex items-center gap-2 font-semibold">
        {success ? <Sparkles className="size-4" /> : <AlertCircle className="size-4" />}
        {success ? `已匹配 ${match.cuisine ?? match.requestedCuisines[0]}` : '菜系匹配未完全满足'}
      </div>
      <div className="text-xs opacity-80">
        {success
          ? match.matchedKeywords?.length
            ? `关键风味：${match.matchedKeywords.slice(0, 4).join('、')}`
            : '已满足所选菜系的风味特征'
          : match.missingKeywords?.length
            ? `缺少关键词：${match.missingKeywords.slice(0, 4).join('、')}（尝试调整菜系或风味偏好）`
            : match.reasons?.join('；') ?? '建议重新选择菜系组合'}
      </div>
    </div>
  );
}

function difficultyLabel(value: Recipe['difficulty']) {
  switch (value) {
    case 'easy':
      return '简单 · 快速上手';
    case 'medium':
      return '中等 · 平衡技巧';
    case 'hard':
      return '困难 · 高级挑战';
    default:
      return '未知难度';
  }
}
