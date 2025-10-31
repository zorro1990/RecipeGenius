import type { KeyboardEvent } from 'react';

import { cn } from '@/lib/utils';

export type StepStatus = 'complete' | 'current' | 'upcoming';

export interface StepItem {
  id: string;
  title: string;
  description?: string;
  status: StepStatus;
}

export interface StepperProps {
  steps: StepItem[];
  className?: string;
  onStepClick?: (step: StepItem, index: number) => void;
}

export function Stepper({ steps, className, onStepClick }: StepperProps) {
  return (
    <ol className={cn('flex w-full flex-col gap-4 md:flex-row md:items-start', className)}>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const statusColor =
          step.status === 'complete'
            ? 'border-brand-primary bg-brand-primary text-white'
            : step.status === 'current'
              ? 'border-brand-primary text-brand-primary'
              : 'border-border text-muted-foreground';

        const interactive = typeof onStepClick === 'function';

        const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
          if (!interactive) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onStepClick?.(step, index);
          }
        };

        return (
          <li key={step.id} className="relative flex-1">
            <div
              className={cn(
                'group flex items-start gap-3 rounded-2xl border border-transparent p-3 transition-colors',
                step.status === 'current' && 'border-border bg-surface-muted shadow-soft',
                interactive
                  ? 'cursor-pointer hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/60'
                  : 'cursor-default',
                interactive && step.status === 'complete' && 'hover:border-brand-primary/40'
              )}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? () => onStepClick?.(step, index) : undefined}
              onKeyDown={handleKeyDown}
            >
              <div
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors',
                  statusColor,
                  step.status === 'complete' && 'shadow-[0_10px_20px_-12px_rgba(255,107,61,0.6)]'
                )}
                aria-current={step.status === 'current' ? 'step' : undefined}
              >
                {index + 1}
              </div>

              <div className="space-y-1">
                <p
                  className={cn(
                    'text-base font-semibold text-foreground',
                    step.status === 'upcoming' && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </p>
                {step.description ? (
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                ) : null}
              </div>
            </div>

            {!isLast && (
              <div className="mt-4 hidden h-px w-full translate-y-1 bg-border md:block" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
