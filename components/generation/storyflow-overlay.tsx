import { ReactNode } from 'react';
import { StepItem, Stepper } from '@/components/ui/stepper';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StoryflowPhase = 'collecting' | 'generating' | 'matching' | 'finalizing';

export interface StoryflowOverlayProps {
  open: boolean;
  steps: StepItem[];
  attempt: number;
  maxAttempts: number;
  hint?: ReactNode;
  failureReason?: string | null;
  className?: string;
  onCancel?: () => void;
}

export function StoryflowOverlay({
  open,
  steps,
  attempt,
  maxAttempts,
  hint,
  failureReason,
  className,
  onCancel,
}: StoryflowOverlayProps) {
  if (!open) return null;

  return (
    <div className={cn('fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 backdrop-blur-sm', className)}>
      <div className="mx-4 w-full max-w-4xl rounded-3xl bg-surface-elevated p-6 shadow-soft">
        <header className="flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.1em] text-muted-foreground">正在为你准备</p>
            <h2 className="text-2xl font-semibold text-foreground">AI 正在创作你的专属菜谱</h2>
          </div>

          {onCancel && (
            <Button variant="ghost" onClick={onCancel} className="text-sm text-muted-foreground">
              取消生成
            </Button>
          )}
        </header>

        <div className="mt-6 space-y-8">
          <Stepper steps={steps} className="sm:gap-8" />

          <div className="grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-4 rounded-2xl bg-surface-muted p-5">
              <Skeleton className="h-14" />
              <Skeleton className="h-40" />
              <div className="grid grid-cols-2 gap-3">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            </div>

            <aside className="flex h-full flex-col justify-between rounded-2xl border border-border p-5">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-brand-primary">
                  <Loader2 className="size-3 animate-spin" />
                  正在尝试第 {attempt}/{maxAttempts} 次
                </div>

                {hint ? <div className="text-sm text-muted-foreground">{hint}</div> : null}

                {failureReason ? (
                  <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                    <AlertTriangle className="mt-0.5 size-4" />
                    <p>{failureReason}</p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-xl bg-surface-muted p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Sparkles className="size-4 text-brand-secondary" />
                  小贴士
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  模型会结合你的菜系偏好与饮食限制生成菜谱，预计过程 30~60 秒。保持页面开启，系统将自动完成剩余步骤。
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

