'use client';

import type { ComponentType } from 'react';
import { HealthInfo } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { ShieldPlus, Lightbulb, Target, AlertTriangle, Sparkles } from 'lucide-react';

interface HealthInfoProps {
  healthInfo: HealthInfo;
}

export function HealthInfoComponent({ healthInfo }: HealthInfoProps) {
  const { filteredIngredients, filterReasons, healthBenefits, nutritionHighlights, healthTips } = healthInfo;

  const cards: HealthInsightCard[] = [
    {
      title: '健康保护',
      icon: ShieldPlus,
      tone: 'amber',
      available: filteredIngredients.length > 0 || filterReasons.length > 0,
      content: filteredIngredients.length ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-amber-700">为你过滤的食材</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {filteredIngredients.map((ingredient) => (
                <Badge key={ingredient} variant="destructive" className="rounded-full px-3 py-1 text-xs">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
          {filterReasons.length > 0 && (
            <ul className="space-y-2 rounded-2xl bg-amber-50 p-4 text-xs text-amber-800">
              {filterReasons.map((reason) => (
                <li key={reason} className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 size-3.5" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <EmptyState message="没有需要过滤的食材" tone="amber" />
      ),
    },
    {
      title: '健康益处',
      icon: Sparkles,
      tone: 'emerald',
      available: healthBenefits.length > 0,
      content: healthBenefits.length ? (
        <ul className="space-y-3 text-sm text-emerald-700">
          {healthBenefits.map((benefit) => (
            <li key={benefit} className="flex items-start gap-2 rounded-2xl bg-emerald-50 p-3">
              <span className="mt-1 text-emerald-500">✓</span>
              {benefit}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message="暂无特别健康益处" tone="emerald" />
      ),
    },
    {
      title: '营养重点',
      icon: Target,
      tone: 'purple',
      available: nutritionHighlights.length > 0,
      content: nutritionHighlights.length ? (
        <div className="flex flex-wrap gap-2">
          {nutritionHighlights.map((highlight) => (
            <Badge key={highlight} variant="secondary" className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
              {highlight}
            </Badge>
          ))}
        </div>
      ) : (
        <EmptyState message="暂无重点营养提示" tone="purple" />
      ),
    },
    {
      title: '健康建议',
      icon: Lightbulb,
      tone: 'blue',
      available: healthTips.length > 0,
      content: healthTips.length ? (
        <ul className="space-y-3 text-sm text-blue-700">
          {healthTips.map((tip) => (
            <li key={tip} className="flex items-start gap-2 rounded-2xl bg-blue-50 p-3">
              <Lightbulb className="mt-0.5 size-4 text-blue-500" />
              {tip}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState message="暂无额外建议" tone="blue" />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {cards.map((card) => (
        <HealthInsightCard key={card.title} {...card} />
      ))}
    </div>
  );
}

interface HealthInsightCard {
  title: string;
  icon: ComponentType<{ className?: string }>;
  tone: 'emerald' | 'amber' | 'purple' | 'blue';
  content: React.ReactNode;
  available?: boolean;
}

function HealthInsightCard({ title, icon: Icon, tone, content }: HealthInsightCard) {
  return (
    <article
      className={
        tone === 'amber'
          ? 'rounded-3xl border border-amber-200 bg-amber-50/40 p-6 shadow-soft'
          : tone === 'emerald'
            ? 'rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-soft'
            : tone === 'purple'
              ? 'rounded-3xl border border-purple-200 bg-purple-50/40 p-6 shadow-soft'
              : 'rounded-3xl border border-blue-200 bg-blue-50/40 p-6 shadow-soft'
      }
    >
      <header className="mb-3 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-full bg-white shadow-soft">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </header>
      <div className="text-sm text-muted-foreground">{content}</div>
    </article>
  );
}

interface EmptyStateProps {
  message: string;
  tone: 'amber' | 'emerald' | 'purple' | 'blue';
}

function EmptyState({ message, tone }: EmptyStateProps) {
  const textColor =
    tone === 'amber'
      ? 'text-amber-600'
      : tone === 'emerald'
        ? 'text-emerald-600'
        : tone === 'purple'
          ? 'text-purple-600'
          : 'text-blue-600';

  return <p className={`rounded-2xl bg-white/60 p-3 text-xs ${textColor}`}>{message}</p>;
}
